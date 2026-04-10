// ============================================================
// Vertex Autopilot - Enterprise Demo Mock Data
// 73-location iHop Area Manager (Southeast US)
// ============================================================

export type AgentStatus = "active" | "paused" | "alert";
export type LocationStatus = "healthy" | "warning" | "critical";
export type AlertSeverity = "critical" | "warning" | "info";
export type UserRole = "area_manager" | "store_manager" | "employee";

// ---- 14 AI Agents ----
export interface Agent {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  status: AgentStatus;
  actionsToday: number;
  alertsOpen: number;
  lastRun: string;
  uptime: number; // percentage
  category: string;
  metrics: { label: string; value: string; trend?: "up" | "down" | "flat" }[];
  recentActions: { time: string; description: string; severity: AlertSeverity }[];
}

export const agents: Agent[] = [
  {
    id: "food-safety",
    name: "Food Safety Agent",
    shortName: "Food Safety",
    icon: "🛡️",
    description: "Temperature monitoring, HACCP compliance, inspection readiness, cert tracking",
    status: "alert",
    actionsToday: 47,
    alertsOpen: 3,
    lastRun: "2 min ago",
    uptime: 99.8,
    category: "Compliance",
    metrics: [
      { label: "Temp Logs Today", value: "1,247", trend: "up" },
      { label: "Violations (7d)", value: "4", trend: "down" },
      { label: "Avg Score", value: "94.2", trend: "up" },
      { label: "Certs Expiring", value: "12", trend: "flat" },
    ],
    recentActions: [
      { time: "2 min ago", description: "Walk-in cooler at Store #14 hit 43F - SMS sent to manager", severity: "critical" },
      { time: "15 min ago", description: "Auto-enrolled 3 employees in ServSafe renewal", severity: "info" },
      { time: "1 hr ago", description: "Inspection prep checklist generated for Store #7", severity: "info" },
    ],
  },
  {
    id: "hiring",
    name: "Hiring Agent",
    shortName: "Hiring",
    icon: "👥",
    description: "Job posting, resume screening, interview scheduling, offer management",
    status: "active",
    actionsToday: 23,
    alertsOpen: 0,
    lastRun: "5 min ago",
    uptime: 99.9,
    category: "HR",
    metrics: [
      { label: "Open Positions", value: "34", trend: "down" },
      { label: "Candidates Pipeline", value: "127", trend: "up" },
      { label: "Avg Time-to-Hire", value: "8.2d", trend: "down" },
      { label: "Offers Pending", value: "7", trend: "up" },
    ],
    recentActions: [
      { time: "5 min ago", description: "Screened 12 new applications for line cook positions", severity: "info" },
      { time: "30 min ago", description: "Auto-posted 3 new job listings on Indeed & ZipRecruiter", severity: "info" },
      { time: "2 hr ago", description: "Interview scheduled for Store #22 shift lead candidate", severity: "info" },
    ],
  },
  {
    id: "scheduling",
    name: "Scheduling Agent",
    shortName: "Scheduling",
    icon: "📅",
    description: "Shift scheduling, overtime alerts, coverage gap detection, swap management",
    status: "active",
    actionsToday: 18,
    alertsOpen: 2,
    lastRun: "8 min ago",
    uptime: 99.7,
    category: "Operations",
    metrics: [
      { label: "Shifts Scheduled", value: "892", trend: "flat" },
      { label: "Coverage Gaps", value: "5", trend: "down" },
      { label: "OT Hours (week)", value: "142", trend: "down" },
      { label: "Swap Requests", value: "8", trend: "flat" },
    ],
    recentActions: [
      { time: "8 min ago", description: "Coverage gap detected Saturday PM at Store #31 - notified available staff", severity: "warning" },
      { time: "1 hr ago", description: "Overtime alert: Store #9 projected 18 OT hours this week", severity: "warning" },
      { time: "3 hr ago", description: "Auto-approved 4 shift swap requests", severity: "info" },
    ],
  },
  {
    id: "revenue",
    name: "Revenue Agent",
    shortName: "Revenue",
    icon: "💰",
    description: "Sales forecasting, menu pricing optimization, promotional analysis",
    status: "active",
    actionsToday: 12,
    alertsOpen: 1,
    lastRun: "12 min ago",
    uptime: 99.9,
    category: "Finance",
    metrics: [
      { label: "Today Revenue", value: "$487K", trend: "up" },
      { label: "vs Forecast", value: "+3.2%", trend: "up" },
      { label: "Avg Ticket", value: "$14.82", trend: "up" },
      { label: "Promo ROI", value: "4.1x", trend: "up" },
    ],
    recentActions: [
      { time: "12 min ago", description: "Revenue forecast updated for next week - projected +5% due to local events", severity: "info" },
      { time: "2 hr ago", description: "Menu price adjustment recommended for pancake combos (+$0.50)", severity: "info" },
      { time: "4 hr ago", description: "Store #18 underperforming by 12% vs target - flagged for review", severity: "warning" },
    ],
  },
  {
    id: "spend-intelligence",
    name: "Spend Intelligence Agent",
    shortName: "Spend Intel",
    icon: "📊",
    description: "Vendor cost tracking, invoice analysis, budget alerts, price anomaly detection",
    status: "active",
    actionsToday: 31,
    alertsOpen: 2,
    lastRun: "3 min ago",
    uptime: 99.6,
    category: "Finance",
    metrics: [
      { label: "Invoices Scanned", value: "89", trend: "flat" },
      { label: "Price Alerts", value: "6", trend: "up" },
      { label: "Savings Found", value: "$4,230", trend: "up" },
      { label: "Budget Status", value: "92%", trend: "flat" },
    ],
    recentActions: [
      { time: "3 min ago", description: "Price spike detected: eggs up 18% from Sysco - flagged for renegotiation", severity: "warning" },
      { time: "45 min ago", description: "Duplicate invoice detected from US Foods ($2,340) - blocked payment", severity: "critical" },
      { time: "2 hr ago", description: "Monthly vendor comparison report generated", severity: "info" },
    ],
  },
  {
    id: "inventory",
    name: "Inventory Agent",
    shortName: "Inventory",
    icon: "📦",
    description: "Stock level monitoring, waste tracking, auto-ordering, par level management",
    status: "active",
    actionsToday: 56,
    alertsOpen: 4,
    lastRun: "1 min ago",
    uptime: 99.8,
    category: "Operations",
    metrics: [
      { label: "Items Tracked", value: "2,847", trend: "flat" },
      { label: "Low Stock Alerts", value: "14", trend: "up" },
      { label: "Auto-Orders", value: "8", trend: "flat" },
      { label: "Waste Rate", value: "2.1%", trend: "down" },
    ],
    recentActions: [
      { time: "1 min ago", description: "Auto-order placed for bacon (Store #5, #12, #27) - 3 cases each", severity: "info" },
      { time: "20 min ago", description: "Waste alert: Store #33 pancake batter waste 40% above average", severity: "warning" },
      { time: "1 hr ago", description: "Par levels adjusted for 8 locations based on weekend forecast", severity: "info" },
    ],
  },
  {
    id: "customer-experience",
    name: "Customer Experience Agent",
    shortName: "CX Agent",
    icon: "⭐",
    description: "Review monitoring, complaint resolution, NPS tracking, sentiment analysis",
    status: "active",
    actionsToday: 34,
    alertsOpen: 3,
    lastRun: "7 min ago",
    uptime: 99.5,
    category: "Customer",
    metrics: [
      { label: "Avg Rating", value: "4.3", trend: "up" },
      { label: "Reviews Today", value: "28", trend: "flat" },
      { label: "NPS Score", value: "62", trend: "up" },
      { label: "Open Complaints", value: "7", trend: "down" },
    ],
    recentActions: [
      { time: "7 min ago", description: "1-star review at Store #41 - auto-response drafted for manager approval", severity: "warning" },
      { time: "30 min ago", description: "NPS survey results compiled: Store #3 improved +8 points", severity: "info" },
      { time: "1 hr ago", description: "Complaint pattern detected: wait times at Store #19 (3 reviews)", severity: "warning" },
    ],
  },
  {
    id: "training",
    name: "Training Agent",
    shortName: "Training",
    icon: "🎓",
    description: "Employee certification tracking, onboarding progress, compliance training",
    status: "active",
    actionsToday: 15,
    alertsOpen: 1,
    lastRun: "20 min ago",
    uptime: 99.9,
    category: "HR",
    metrics: [
      { label: "Active Trainees", value: "43", trend: "up" },
      { label: "Completion Rate", value: "87%", trend: "up" },
      { label: "Certs Expiring (30d)", value: "18", trend: "flat" },
      { label: "Onboarding Active", value: "12", trend: "up" },
    ],
    recentActions: [
      { time: "20 min ago", description: "Onboarding checklist completed for 2 new hires at Store #15", severity: "info" },
      { time: "2 hr ago", description: "Food handler cert reminder sent to 6 employees", severity: "warning" },
      { time: "5 hr ago", description: "Compliance training module updated for Q2 health code changes", severity: "info" },
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance Agent",
    shortName: "Maintenance",
    icon: "🔧",
    description: "Equipment status monitoring, preventive maintenance scheduling, repair tracking",
    status: "alert",
    actionsToday: 9,
    alertsOpen: 2,
    lastRun: "15 min ago",
    uptime: 99.4,
    category: "Operations",
    metrics: [
      { label: "Equipment Monitored", value: "584", trend: "flat" },
      { label: "Open Work Orders", value: "11", trend: "up" },
      { label: "PM Compliance", value: "91%", trend: "flat" },
      { label: "Avg Repair Time", value: "4.2h", trend: "down" },
    ],
    recentActions: [
      { time: "15 min ago", description: "Dishwasher malfunction at Store #28 - repair technician dispatched", severity: "critical" },
      { time: "1 hr ago", description: "Preventive maintenance scheduled for 12 HVAC units next week", severity: "info" },
      { time: "3 hr ago", description: "Grill thermostat replaced at Store #6 - verified operational", severity: "info" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing Agent",
    shortName: "Marketing",
    icon: "📣",
    description: "Social media management, local promotions, campaign performance tracking",
    status: "active",
    actionsToday: 8,
    alertsOpen: 0,
    lastRun: "25 min ago",
    uptime: 99.8,
    category: "Growth",
    metrics: [
      { label: "Active Campaigns", value: "6", trend: "flat" },
      { label: "Social Engagement", value: "2.4K", trend: "up" },
      { label: "Promo Redemptions", value: "342", trend: "up" },
      { label: "Email Open Rate", value: "34%", trend: "up" },
    ],
    recentActions: [
      { time: "25 min ago", description: "Weekend pancake special campaign launched across 73 locations", severity: "info" },
      { time: "3 hr ago", description: "Social media content calendar generated for next week", severity: "info" },
      { time: "6 hr ago", description: "Local event promo created for Store #11 (Atlanta food festival)", severity: "info" },
    ],
  },
  {
    id: "compliance",
    name: "Compliance Agent",
    shortName: "Compliance",
    icon: "📋",
    description: "Labor law monitoring, health code compliance, licensing, audit trail management",
    status: "active",
    actionsToday: 22,
    alertsOpen: 1,
    lastRun: "10 min ago",
    uptime: 99.9,
    category: "Compliance",
    metrics: [
      { label: "Compliance Score", value: "96%", trend: "up" },
      { label: "Audit Items", value: "3", trend: "down" },
      { label: "Licenses Active", value: "219", trend: "flat" },
      { label: "Policy Updates", value: "2", trend: "flat" },
    ],
    recentActions: [
      { time: "10 min ago", description: "Minor labor compliance update: break scheduling adjusted for FL locations", severity: "info" },
      { time: "1 hr ago", description: "Health permit renewal reminder for Store #37 (due in 14 days)", severity: "warning" },
      { time: "4 hr ago", description: "Audit trail report generated for regional inspection", severity: "info" },
    ],
  },
  {
    id: "analytics",
    name: "Analytics Agent",
    shortName: "Analytics",
    icon: "📈",
    description: "Cross-location benchmarking, trend analysis, executive reports, KPI dashboards",
    status: "active",
    actionsToday: 6,
    alertsOpen: 0,
    lastRun: "30 min ago",
    uptime: 99.9,
    category: "Intelligence",
    metrics: [
      { label: "Reports Generated", value: "4", trend: "flat" },
      { label: "KPIs Tracked", value: "48", trend: "flat" },
      { label: "Anomalies Found", value: "3", trend: "down" },
      { label: "Insights Shared", value: "12", trend: "up" },
    ],
    recentActions: [
      { time: "30 min ago", description: "Weekly executive report generated - top performer: Store #3 (Atlanta)", severity: "info" },
      { time: "2 hr ago", description: "Anomaly detected: Store #45 labor cost 22% above benchmark", severity: "warning" },
      { time: "6 hr ago", description: "Trend analysis: breakfast revenue up 8% across region", severity: "info" },
    ],
  },
  {
    id: "communication",
    name: "Communication Agent",
    shortName: "Comms",
    icon: "💬",
    description: "Team messaging, shift notifications, announcement broadcasts, escalation routing",
    status: "active",
    actionsToday: 142,
    alertsOpen: 0,
    lastRun: "1 min ago",
    uptime: 99.9,
    category: "Operations",
    metrics: [
      { label: "Messages Sent", value: "342", trend: "flat" },
      { label: "SMS Alerts", value: "47", trend: "flat" },
      { label: "Read Rate", value: "94%", trend: "up" },
      { label: "Escalations", value: "3", trend: "down" },
    ],
    recentActions: [
      { time: "1 min ago", description: "Shift reminder SMS sent to 23 employees for tomorrow AM shift", severity: "info" },
      { time: "15 min ago", description: "Manager broadcast: new cleaning protocol distributed to all stores", severity: "info" },
      { time: "1 hr ago", description: "Escalation routed: Store #14 temp alert to area manager", severity: "warning" },
    ],
  },
  {
    id: "quality",
    name: "Quality Agent",
    shortName: "Quality",
    icon: "✅",
    description: "Food quality scoring, mystery shopper results, brand standards enforcement",
    status: "active",
    actionsToday: 11,
    alertsOpen: 1,
    lastRun: "18 min ago",
    uptime: 99.7,
    category: "Quality",
    metrics: [
      { label: "Avg Quality Score", value: "91.4", trend: "up" },
      { label: "Mystery Shops (mo)", value: "12", trend: "flat" },
      { label: "Brand Violations", value: "5", trend: "down" },
      { label: "Photo Audits", value: "34", trend: "up" },
    ],
    recentActions: [
      { time: "18 min ago", description: "Mystery shopper report: Store #22 scored 88/100 - plating deductions", severity: "info" },
      { time: "2 hr ago", description: "Brand standards check: Store #40 signage non-compliant - flagged", severity: "warning" },
      { time: "5 hr ago", description: "Quality scores updated for 73 locations - regional avg: 91.4", severity: "info" },
    ],
  },
];

// ---- 10 Sample iHop Locations (Southeast US) ----
export interface Location {
  id: string;
  storeNumber: number;
  name: string;
  city: string;
  state: string;
  address: string;
  manager: string;
  staffCount: number;
  staffTarget: number;
  healthScore: number;
  status: LocationStatus;
  revenue: { today: number; mtd: number; target: number };
  alerts: { critical: number; warning: number; info: number };
  agentStatuses: Record<string, AgentStatus>;
  metrics: {
    foodSafetyScore: number;
    customerRating: number;
    laborCostPct: number;
    wasteRate: number;
    avgTicket: number;
  };
}

export const locations: Location[] = [
  {
    id: "loc-001", storeNumber: 3, name: "IHOP #1247 - Midtown Atlanta",
    city: "Atlanta", state: "GA", address: "1085 Peachtree St NE",
    manager: "Marcus Johnson", staffCount: 32, staffTarget: 35,
    healthScore: 97, status: "healthy",
    revenue: { today: 8420, mtd: 187600, target: 195000 },
    alerts: { critical: 0, warning: 1, info: 4 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "active", "revenue": "active", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 97, customerRating: 4.5, laborCostPct: 28.2, wasteRate: 1.8, avgTicket: 15.40 },
  },
  {
    id: "loc-002", storeNumber: 7, name: "IHOP #1389 - Buckhead",
    city: "Atlanta", state: "GA", address: "3280 Peachtree Rd NE",
    manager: "Sarah Williams", staffCount: 28, staffTarget: 30,
    healthScore: 94, status: "healthy",
    revenue: { today: 7890, mtd: 172300, target: 180000 },
    alerts: { critical: 0, warning: 2, info: 3 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "active", "revenue": "active", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 94, customerRating: 4.3, laborCostPct: 29.1, wasteRate: 2.0, avgTicket: 14.90 },
  },
  {
    id: "loc-003", storeNumber: 14, name: "IHOP #1502 - Jacksonville Beach",
    city: "Jacksonville", state: "FL", address: "1201 Beach Blvd",
    manager: "David Chen", staffCount: 24, staffTarget: 28,
    healthScore: 78, status: "critical",
    revenue: { today: 5230, mtd: 124500, target: 155000 },
    alerts: { critical: 2, warning: 3, info: 5 },
    agentStatuses: { "food-safety": "alert", "hiring": "active", "scheduling": "alert", "revenue": "active", "spend-intelligence": "active", "inventory": "alert", "customer-experience": "active", "training": "active", "maintenance": "alert", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 78, customerRating: 3.8, laborCostPct: 33.4, wasteRate: 3.7, avgTicket: 13.20 },
  },
  {
    id: "loc-004", storeNumber: 22, name: "IHOP #1678 - Nashville West",
    city: "Nashville", state: "TN", address: "4501 Charlotte Ave",
    manager: "Jennifer Martinez", staffCount: 30, staffTarget: 32,
    healthScore: 92, status: "healthy",
    revenue: { today: 9100, mtd: 201400, target: 210000 },
    alerts: { critical: 0, warning: 1, info: 2 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "active", "revenue": "active", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 92, customerRating: 4.4, laborCostPct: 27.8, wasteRate: 1.9, avgTicket: 15.70 },
  },
  {
    id: "loc-005", storeNumber: 31, name: "IHOP #1834 - Charlotte Uptown",
    city: "Charlotte", state: "NC", address: "301 S Tryon St",
    manager: "Robert Taylor", staffCount: 26, staffTarget: 30,
    healthScore: 85, status: "warning",
    revenue: { today: 6780, mtd: 148900, target: 165000 },
    alerts: { critical: 0, warning: 4, info: 3 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "alert", "revenue": "active", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 85, customerRating: 4.0, laborCostPct: 31.2, wasteRate: 2.8, avgTicket: 14.10 },
  },
  {
    id: "loc-006", storeNumber: 33, name: "IHOP #1901 - Birmingham Southside",
    city: "Birmingham", state: "AL", address: "2001 11th Ave S",
    manager: "Lisa Anderson", staffCount: 22, staffTarget: 26,
    healthScore: 88, status: "warning",
    revenue: { today: 5940, mtd: 132700, target: 145000 },
    alerts: { critical: 0, warning: 3, info: 4 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "active", "revenue": "active", "spend-intelligence": "active", "inventory": "alert", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 88, customerRating: 4.1, laborCostPct: 30.5, wasteRate: 3.2, avgTicket: 13.80 },
  },
  {
    id: "loc-007", storeNumber: 40, name: "IHOP #2045 - Miami Gardens",
    city: "Miami", state: "FL", address: "18300 NW 27th Ave",
    manager: "Carlos Rodriguez", staffCount: 34, staffTarget: 35,
    healthScore: 95, status: "healthy",
    revenue: { today: 10200, mtd: 224800, target: 230000 },
    alerts: { critical: 0, warning: 0, info: 6 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "active", "revenue": "active", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 95, customerRating: 4.6, laborCostPct: 26.9, wasteRate: 1.5, avgTicket: 16.20 },
  },
  {
    id: "loc-008", storeNumber: 45, name: "IHOP #2189 - Savannah Downtown",
    city: "Savannah", state: "GA", address: "401 W Bay St",
    manager: "Amanda Brooks", staffCount: 20, staffTarget: 24,
    healthScore: 82, status: "warning",
    revenue: { today: 4890, mtd: 108300, target: 130000 },
    alerts: { critical: 0, warning: 5, info: 2 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "alert", "revenue": "alert", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 82, customerRating: 3.9, laborCostPct: 34.1, wasteRate: 3.0, avgTicket: 13.50 },
  },
  {
    id: "loc-009", storeNumber: 52, name: "IHOP #2301 - Raleigh Midtown",
    city: "Raleigh", state: "NC", address: "4325 Glenwood Ave",
    manager: "Michael Thompson", staffCount: 29, staffTarget: 30,
    healthScore: 93, status: "healthy",
    revenue: { today: 7650, mtd: 168900, target: 175000 },
    alerts: { critical: 0, warning: 1, info: 3 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "active", "revenue": "active", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 93, customerRating: 4.4, laborCostPct: 28.7, wasteRate: 1.7, avgTicket: 15.10 },
  },
  {
    id: "loc-010", storeNumber: 61, name: "IHOP #2467 - Tampa Westshore",
    city: "Tampa", state: "FL", address: "1550 N Westshore Blvd",
    manager: "Patricia Kim", staffCount: 31, staffTarget: 33,
    healthScore: 91, status: "healthy",
    revenue: { today: 8100, mtd: 179200, target: 185000 },
    alerts: { critical: 0, warning: 2, info: 4 },
    agentStatuses: { "food-safety": "active", "hiring": "active", "scheduling": "active", "revenue": "active", "spend-intelligence": "active", "inventory": "active", "customer-experience": "active", "training": "active", "maintenance": "active", "marketing": "active", "compliance": "active", "analytics": "active", "communication": "active", "quality": "active" },
    metrics: { foodSafetyScore: 91, customerRating: 4.2, laborCostPct: 29.4, wasteRate: 2.2, avgTicket: 14.60 },
  },
];

// ---- Aggregate helpers ----
export function getAgentSummary() {
  const active = agents.filter(a => a.status === "active").length;
  const alerting = agents.filter(a => a.status === "alert").length;
  const paused = agents.filter(a => a.status === "paused").length;
  const totalActions = agents.reduce((sum, a) => sum + a.actionsToday, 0);
  const totalAlerts = agents.reduce((sum, a) => sum + a.alertsOpen, 0);
  return { active, alerting, paused, totalActions, totalAlerts, total: agents.length };
}

export function getLocationSummary() {
  const healthy = locations.filter(l => l.status === "healthy").length;
  const warning = locations.filter(l => l.status === "warning").length;
  const critical = locations.filter(l => l.status === "critical").length;
  const totalRevenue = locations.reduce((sum, l) => sum + l.revenue.today, 0);
  const avgHealthScore = Math.round(locations.reduce((sum, l) => sum + l.healthScore, 0) / locations.length);
  const totalStaff = locations.reduce((sum, l) => sum + l.staffCount, 0);
  return { healthy, warning, critical, totalRevenue, avgHealthScore, totalStaff, total: locations.length };
}

// ---- Activity Feed ----
export interface ActivityItem {
  id: string;
  time: string;
  agentId: string;
  agentName: string;
  agentIcon: string;
  description: string;
  severity: AlertSeverity;
  locationId?: string;
  locationName?: string;
}

export const recentActivity: ActivityItem[] = [
  { id: "a1", time: "1 min ago", agentId: "communication", agentName: "Communication Agent", agentIcon: "💬", description: "Shift reminder SMS sent to 23 employees for tomorrow AM shift", severity: "info" },
  { id: "a2", time: "2 min ago", agentId: "food-safety", agentName: "Food Safety Agent", agentIcon: "🛡️", description: "Walk-in cooler at Store #14 hit 43F - SMS sent to manager", severity: "critical", locationId: "loc-003", locationName: "Jacksonville Beach" },
  { id: "a3", time: "3 min ago", agentId: "spend-intelligence", agentName: "Spend Intelligence Agent", agentIcon: "📊", description: "Price spike detected: eggs up 18% from Sysco - flagged for renegotiation", severity: "warning" },
  { id: "a4", time: "5 min ago", agentId: "hiring", agentName: "Hiring Agent", agentIcon: "👥", description: "Screened 12 new applications for line cook positions across 4 stores", severity: "info" },
  { id: "a5", time: "7 min ago", agentId: "customer-experience", agentName: "Customer Experience Agent", agentIcon: "⭐", description: "1-star review at Store #41 - auto-response drafted for manager approval", severity: "warning" },
  { id: "a6", time: "8 min ago", agentId: "scheduling", agentName: "Scheduling Agent", agentIcon: "📅", description: "Coverage gap detected Saturday PM at Store #31 - notified available staff", severity: "warning", locationId: "loc-005", locationName: "Charlotte Uptown" },
  { id: "a7", time: "10 min ago", agentId: "compliance", agentName: "Compliance Agent", agentIcon: "📋", description: "Break scheduling adjusted for FL locations per labor law update", severity: "info" },
  { id: "a8", time: "12 min ago", agentId: "revenue", agentName: "Revenue Agent", agentIcon: "💰", description: "Revenue forecast updated - projected +5% next week due to local events", severity: "info" },
  { id: "a9", time: "15 min ago", agentId: "food-safety", agentName: "Food Safety Agent", agentIcon: "🛡️", description: "Auto-enrolled 3 employees in ServSafe renewal certification", severity: "info" },
  { id: "a10", time: "15 min ago", agentId: "maintenance", agentName: "Maintenance Agent", agentIcon: "🔧", description: "Dishwasher malfunction at Store #28 - repair technician dispatched", severity: "critical" },
  { id: "a11", time: "18 min ago", agentId: "quality", agentName: "Quality Agent", agentIcon: "✅", description: "Mystery shopper report: Store #22 scored 88/100 - plating deductions noted", severity: "info", locationId: "loc-004", locationName: "Nashville West" },
  { id: "a12", time: "20 min ago", agentId: "inventory", agentName: "Inventory Agent", agentIcon: "📦", description: "Waste alert: Store #33 pancake batter waste 40% above average", severity: "warning", locationId: "loc-006", locationName: "Birmingham Southside" },
  { id: "a13", time: "20 min ago", agentId: "training", agentName: "Training Agent", agentIcon: "🎓", description: "Onboarding checklist completed for 2 new hires at Store #15", severity: "info" },
  { id: "a14", time: "25 min ago", agentId: "marketing", agentName: "Marketing Agent", agentIcon: "📣", description: "Weekend pancake special campaign launched across 73 locations", severity: "info" },
  { id: "a15", time: "30 min ago", agentId: "analytics", agentName: "Analytics Agent", agentIcon: "📈", description: "Weekly executive report generated - top performer: Store #3 (Atlanta)", severity: "info", locationId: "loc-001", locationName: "Midtown Atlanta" },
];

// ---- Employee Schedule (for employee dashboard) ----
export interface ScheduleShift {
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  location: string;
}

export const employeeSchedule: ScheduleShift[] = [
  { day: "Monday", date: "Apr 7", startTime: "6:00 AM", endTime: "2:00 PM", role: "Line Cook", location: "IHOP #1247 - Midtown Atlanta" },
  { day: "Tuesday", date: "Apr 8", startTime: "6:00 AM", endTime: "2:00 PM", role: "Line Cook", location: "IHOP #1247 - Midtown Atlanta" },
  { day: "Wednesday", date: "Apr 9", startTime: "Off", endTime: "", role: "", location: "" },
  { day: "Thursday", date: "Apr 10", startTime: "2:00 PM", endTime: "10:00 PM", role: "Line Cook", location: "IHOP #1247 - Midtown Atlanta" },
  { day: "Friday", date: "Apr 11", startTime: "6:00 AM", endTime: "2:00 PM", role: "Line Cook", location: "IHOP #1247 - Midtown Atlanta" },
  { day: "Saturday", date: "Apr 12", startTime: "7:00 AM", endTime: "3:00 PM", role: "Line Cook", location: "IHOP #1247 - Midtown Atlanta" },
  { day: "Sunday", date: "Apr 13", startTime: "Off", endTime: "", role: "", location: "" },
];

export interface TrainingAssignment {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  status: "completed" | "in_progress" | "not_started" | "overdue";
}

export const trainingAssignments: TrainingAssignment[] = [
  { id: "t1", title: "ServSafe Food Handler Certification", dueDate: "Apr 30, 2026", progress: 75, status: "in_progress" },
  { id: "t2", title: "Allergen Awareness Training", dueDate: "Apr 15, 2026", progress: 100, status: "completed" },
  { id: "t3", title: "Fire Safety & Evacuation Procedures", dueDate: "May 10, 2026", progress: 0, status: "not_started" },
  { id: "t4", title: "Customer Service Excellence", dueDate: "Apr 5, 2026", progress: 40, status: "overdue" },
  { id: "t5", title: "IHOP Brand Standards Q2 2026", dueDate: "Apr 20, 2026", progress: 60, status: "in_progress" },
];

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

export const employeeTasks: TaskItem[] = [
  { id: "tk1", title: "Complete opening prep checklist", completed: true, priority: "high" },
  { id: "tk2", title: "Check walk-in cooler temperatures", completed: true, priority: "high" },
  { id: "tk3", title: "Restock pancake batter station", completed: false, priority: "medium" },
  { id: "tk4", title: "Clean griddle surfaces", completed: false, priority: "medium" },
  { id: "tk5", title: "Review new menu item preparation guide", completed: false, priority: "low" },
  { id: "tk6", title: "Complete ServSafe Module 3", completed: false, priority: "high" },
];

export const announcements = [
  { id: "an1", title: "New Cleaning Protocol", date: "Apr 9, 2026", message: "Updated sanitization procedures are now in effect. Review the new checklist in your training portal.", priority: "high" as const },
  { id: "an2", title: "Weekend Pancake Special", date: "Apr 8, 2026", message: "All-you-can-eat pancake promotion runs this Saturday and Sunday. Review prep guidelines.", priority: "medium" as const },
  { id: "an3", title: "Q2 Schedule Preferences", date: "Apr 7, 2026", message: "Submit your schedule preferences for May by April 15th through the scheduling portal.", priority: "low" as const },
];

// ---- Navigation items for different roles ----
export const roleNavItems = {
  area_manager: [
    { href: "/dashboard", label: "Command Center", icon: "🎯", exact: true },
    { href: "/dashboard/locations", label: "Locations", icon: "📍" },
    { href: "/dashboard/agents", label: "AI Agents", icon: "🤖" },
    { href: "/dashboard/safety", label: "Food Safety", icon: "🛡️" },
    { href: "/dashboard/hiring", label: "Hiring & HR", icon: "👥" },
    { href: "/dashboard/scheduling", label: "Scheduling", icon: "📅" },
    { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
    { href: "/dashboard/orders", label: "Orders", icon: "📞" },
    { href: "/dashboard/waste", label: "Waste", icon: "🗑️" },
    { href: "/dashboard/checklists", label: "Checklists", icon: "✅" },
    { href: "/dashboard/events", label: "Activity Log", icon: "📋" },
    { href: "/dashboard/approvals", label: "Approvals", icon: "🔔" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ],
  store_manager: [
    { href: "/dashboard/store-manager", label: "My Store", icon: "🏪", exact: true },
    { href: "/dashboard/safety", label: "Food Safety", icon: "🛡️" },
    { href: "/dashboard/employees", label: "Staff", icon: "👤" },
    { href: "/dashboard/scheduling", label: "Schedule", icon: "📅" },
    { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
    { href: "/dashboard/orders", label: "Orders", icon: "📞" },
    { href: "/dashboard/checklists", label: "Checklists", icon: "✅" },
    { href: "/dashboard/events", label: "Activity", icon: "📋" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  ],
  employee: [
    { href: "/dashboard/employee", label: "My Dashboard", icon: "🏠", exact: true },
    { href: "/dashboard/employee/schedule", label: "My Schedule", icon: "📅" },
    { href: "/dashboard/employee/training", label: "Training", icon: "🎓" },
    { href: "/dashboard/employee/tasks", label: "Tasks", icon: "✅" },
  ],
};

// ---- Store Manager mock data ----
export const storeManagerData = {
  location: locations[0],
  todayTasks: [
    { id: "sm1", title: "Review morning temp logs", completed: true, priority: "high" as const },
    { id: "sm2", title: "Approve shift swap request (Maria -> Tom)", completed: false, priority: "medium" as const },
    { id: "sm3", title: "Interview candidate for server position (2:00 PM)", completed: false, priority: "high" as const },
    { id: "sm4", title: "Submit weekly inventory count", completed: false, priority: "high" as const },
    { id: "sm5", title: "Respond to Google review (1-star)", completed: false, priority: "medium" as const },
    { id: "sm6", title: "Review overtime report", completed: false, priority: "low" as const },
  ],
  staffOnDuty: 12,
  staffScheduled: 14,
  recentReviews: [
    { rating: 5, text: "Best pancakes in Atlanta! Server was amazing.", date: "2 hours ago", platform: "Google" },
    { rating: 1, text: "Waited 30 minutes for our food. Very disappointing.", date: "5 hours ago", platform: "Yelp" },
    { rating: 4, text: "Good breakfast, friendly staff. Parking could be better.", date: "1 day ago", platform: "Google" },
  ],
  inventoryAlerts: [
    { item: "Bacon (applewood)", level: "Low", qty: "12 lbs", reorderPoint: "20 lbs" },
    { item: "Whole Eggs", level: "OK", qty: "45 dozen", reorderPoint: "30 dozen" },
    { item: "Pancake Mix", level: "Critical", qty: "8 bags", reorderPoint: "15 bags" },
  ],
};
