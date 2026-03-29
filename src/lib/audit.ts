import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logAudit(params: {
  userId?: string;
  userEmail?: string;
  action: string;
  tableName: string;
  recordId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await supabase.from("audit_trail").insert({
    user_id: params.userId,
    user_email: params.userEmail,
    action: params.action,
    table_name: params.tableName,
    record_id: params.recordId,
    changes: params.changes || {},
    ip_address: params.ipAddress,
  });
}
