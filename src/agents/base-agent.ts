import { createServiceClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/sms/twilio";
import { sendEmail } from "@/lib/email/send";
import { dispatchNotification } from "@/lib/notifications/dispatch";

export type Severity = "critical" | "warning" | "info" | "log";

export interface AgentEvent {
  id?: string;
  agent_type: string;
  event_type: string;
  location_id: string;
  severity: Severity;
  description: string;
  action_taken?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationTarget {
  phone?: string;
  email?: string;
  name: string;
}

export abstract class BaseAgent {
  protected agentType: string;
  protected supabase = createServiceClient();

  constructor(agentType: string) {
    this.agentType = agentType;
  }

  /** Run the agent's main check cycle */
  abstract check(): Promise<AgentEvent[]>;

  /** Log an event to the agent_events table */
  async logEvent(event: AgentEvent): Promise<AgentEvent> {
    const row = {
      agent_type: event.agent_type || this.agentType,
      event_type: event.event_type,
      location_id: event.location_id,
      severity: event.severity,
      description: event.description,
      action_taken: event.action_taken,
      metadata: event.metadata || {},
    };
    const { data, error } = await this.supabase
      .from("agent_events")
      .insert(row)
      .select("id")
      .single();

    if (error) console.error("Failed to log agent event:", error);
    return { ...row, id: data?.id } as AgentEvent;
  }

  /** Send notification via appropriate channel based on severity and preferences */
  async notify(
    severity: Severity,
    target: NotificationTarget,
    message: string,
    emailSubject?: string,
    emailHtml?: string,
    agentEventId?: string,
    locationId?: string
  ): Promise<void> {
    // If we have a locationId, use smart dispatcher (checks preferences)
    if (locationId) {
      await dispatchNotification({
        locationId,
        severity,
        smsBody: message,
        emailSubject,
        emailHtml,
        agentEventId,
      });
      return;
    }

    // Fallback: direct send (for cases without a location context)
    const channels: string[] = [];

    if ((severity === "critical" || severity === "warning") && target.phone) {
      await sendSMS(target.phone, message);
      channels.push("sms");
    }
    if ((severity === "critical" || severity === "info") && target.email && emailHtml) {
      await sendEmail({ to: target.email, subject: emailSubject || "Vertex Autopilot Alert", html: emailHtml });
      channels.push("email");
    }

    await this.supabase.from("notifications_log").insert({
      recipient_phone: target.phone,
      recipient_email: target.email,
      channel: channels.join(",") || "dashboard",
      template: this.agentType,
      message,
      agent_event_id: agentEventId,
    });
  }

  /** Escalate to next level (manager → regional) */
  async escalate(
    locationId: string,
    issue: string,
    escalateTo: NotificationTarget,
    originalEventId?: string
  ): Promise<void> {
    const event = await this.logEvent({
      agent_type: this.agentType,
      event_type: "escalated",
      location_id: locationId,
      severity: "critical",
      description: `Escalation: ${issue}`,
      action_taken: `Escalated to ${escalateTo.name}`,
      metadata: { original_event_id: originalEventId },
    });

    await this.notify(
      "critical",
      escalateTo,
      `🚨 ESCALATION: ${issue}`,
      `Vertex Autopilot — Escalation`,
      `<div style="font-family:sans-serif;padding:20px;background:#111827;color:white;border-radius:12px;">
        <h2 style="color:#f87171;">🚨 Escalation Alert</h2>
        <p>${issue}</p>
        <p style="color:#9ca3af;">This issue was escalated because the original assignee did not respond.</p>
      </div>`,
      event.id
    );
  }

  /** Submit an item for manager approval */
  async requestApproval(
    actionType: string,
    locationId: string,
    payload: Record<string, unknown>
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from("approval_queue")
      .insert({
        agent_type: this.agentType,
        action_type: actionType,
        location_id: locationId,
        requested_by: "agent",
        payload,
      })
      .select("id")
      .single();

    if (error) console.error("Failed to create approval request:", error);
    return data?.id || "";
  }
}
