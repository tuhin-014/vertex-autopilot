# Vertex Autopilot — End-to-End (E2E) Test Cases
**Product:** Vertex Autopilot — AI Restaurant Operations Platform
**Version:** 1.0
**URL:** https://app-khaki-pi-37.vercel.app
**Date:** April 3, 2026
**Prepared by:** Max (QA Architect)

---

## E2E Test Philosophy
Each E2E test simulates a **complete user journey** from start to finish, crossing multiple features and verifying data flows end-to-end through the system.

---

## E2E-001: New Restaurant Onboarding → First Agent Run

**Objective:** Verify a brand-new restaurant can sign up, set up, and see their first AI agent results.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/` | Landing page loads with hero, features, pricing CTA |
| 2 | Click "Get Started" → `/login` | Login page loads |
| 3 | Click "Sign up" → Enter email + password | Account created, redirected to `/dashboard` |
| 4 | Verify Command Center | Dashboard shows with location stats, empty agent activity |
| 5 | Navigate to `/dashboard/settings` | See 14 agents listed, all active |
| 6 | Click "▶ Run All 14 Agents" | New tab opens `/api/agents/run-all` → JSON response with `agents: 14` |
| 7 | Return to `/dashboard` | Agent Activity feed shows new events from the run |
| 8 | Navigate to `/dashboard/events` | Full event log shows all agent events with timestamps |

**Pass Criteria:** User goes from zero → signed up → seeing AI agent results in < 3 minutes.

---

## E2E-002: Food Safety Violation → Alert → Resolution

**Objective:** Verify the complete food safety workflow from temperature violation to resolution.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in → `/dashboard/safety` | Safety dashboard loads with temp logs, certs, corrective actions |
| 2 | POST to `/api/temp-logs` with out-of-range temp (50°F for cold storage) | Temp log saved with `status: violation` |
| 3 | Trigger `/api/cron/check-temps` | Agent detects violation, creates agent_event with `severity: critical` |
| 4 | Check SMS (Twilio) | Cook receives SMS: "⚠️ Walk-In Cooler at [Store]: 50°F (safe: ≤41°F)" |
| 5 | Navigate to `/dashboard/safety` | Red violation badge visible on temp log |
| 6 | Check `/dashboard/events` | "temp_violation" event from food_safety agent visible |
| 7 | Navigate to corrective actions | Auto-created corrective action appears with due date |
| 8 | Open corrective action → Resolve it | Status changes to "resolved", completed_at set |
| 9 | Trigger `/api/cron/check-corrective` | No overdue events generated (action resolved) |

**Pass Criteria:** Violation detected → SMS sent → corrective action created → resolved, all within one flow.

---

## E2E-003: Hiring Pipeline → Candidate → Offer → Onboarding

**Objective:** Verify the complete hiring lifecycle from job posting to onboarding.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/hiring` | Pipeline visible: Applied → Screened → Interview → Offered → Hired |
| 2 | Check staffing targets | Understaffed roles highlighted with red/yellow bars |
| 3 | Trigger `/api/cron/screen-candidates` | AI scores candidates, moves qualified ones to "screened" |
| 4 | Navigate to `/dashboard/hiring` | Candidate table shows AI scores (1-10) |
| 5 | Click top candidate → Advance to "Interview" | Status updates, SMS sent if phone available |
| 6 | Advance candidate to "Offered" | Offer letter generated |
| 7 | Open `/offer/[candidateId]` | Offer letter page with e-signature canvas |
| 8 | Sign offer (draw signature) → Accept | Candidate status → "hired", signature saved |
| 9 | Check `/dashboard/stores/[id]` | Employee count updated, staffing bar reflects new hire |

**Pass Criteria:** Full hiring lifecycle completes with SMS notifications and e-signature.

---

## E2E-004: Invoice Upload → Price Alert → Vendor Tracking

**Objective:** Verify invoice processing triggers price monitoring and vendor tracking.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/invoices/upload` | Upload form loads |
| 2 | Upload an invoice file | Invoice saved with line items parsed |
| 3 | Navigate to `/dashboard/invoices` | New invoice appears in list with "pending" status |
| 4 | Click invoice → `/dashboard/invoices/[id]` | Detail view shows line items, total, vendor |
| 5 | Mark invoice as "approved" | Status updates to approved |
| 6 | Trigger `/api/cron/check-invoices` | Agent checks for price anomalies |
| 7 | Navigate to `/dashboard/invoices/price-alerts` | If price changed >15%, alert visible |
| 8 | Navigate to `/dashboard/vendors` | Vendor shows with invoice history, price trends |
| 9 | Check `/api/audit` | Audit trail shows invoice approval action |

**Pass Criteria:** Upload → parse → approve → price monitoring → vendor history, full chain.

---

## E2E-005: Inventory Alert → Purchase Order → Restock

**Objective:** Verify low inventory triggers alerts and purchase order flow.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/inventory` | Inventory items with par levels visible |
| 2 | Trigger `/api/cron/check-inventory` | Agent detects below-par items |
| 3 | Navigate to `/dashboard/inventory/alerts` | Below-par and expiring items listed |
| 4 | Navigate to `/dashboard/inventory/orders` | Suggested purchase orders visible |
| 5 | Create/approve a purchase order | PO status → approved |
| 6 | Navigate to `/dashboard/inventory/count` | Enter physical count for restocked item |
| 7 | Check inventory item | Quantity updated, no longer below par |
| 8 | Check `/dashboard/events` | inventory agent events logged |

**Pass Criteria:** Low stock → alert → PO → restock → inventory updated.

---

## E2E-006: Daily Operations Cycle (Opening → Service → Closing)

**Objective:** Simulate a full day of restaurant operations.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | **OPENING:** `/dashboard/checklists/start` → Select "Opening" template | Checklist starts with items to complete |
| 2 | Complete opening checklist items | Completion % updates in real-time |
| 3 | Submit completed checklist | Status → "completed", logged in history |
| 4 | **SERVICE:** Log temp readings via `/api/temp-logs` | Temps saved, all within range = green |
| 5 | Receive orders → `/dashboard/orders` | Orders appear in queue with status "new" |
| 6 | Update order status → "preparing" → "ready" → "completed" | Status progression works |
| 7 | Log a waste item → `/dashboard/waste/log` | Waste entry saved with reason, cost |
| 8 | **CLOSING:** `/dashboard/checklists/start` → Select "Closing" template | Closing checklist starts |
| 9 | Complete closing checklist | All items checked, handoff notes added |
| 10 | Check `/dashboard/financials/daily` | Today's revenue, costs, profit visible |
| 11 | Trigger `/api/cron/daily-summary` | Daily summary generated with all metrics |

**Pass Criteria:** Full opening→service→closing cycle completes without errors.

---

## E2E-007: Multi-Store Manager Overview

**Objective:** Verify a regional manager can monitor all stores from one dashboard.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Log in → `/dashboard` | Command Center shows aggregate stats across all stores |
| 2 | Navigate to `/dashboard/stores` | Grid of all stores with safety scores, staffing %, status |
| 3 | Sort/filter stores | Critical stores appear first, filter by status works |
| 4 | Click worst-performing store | Detail page shows specific issues |
| 5 | Check `/dashboard/financials` | P&L summary across all locations |
| 6 | Check `/dashboard/events` | Agent events from ALL stores visible |
| 7 | Check `/dashboard/approvals` | Pending approvals from all stores in one queue |
| 8 | Export data: `/api/export/employees` | CSV downloads with all employees across stores |

**Pass Criteria:** Manager sees full portfolio health from one dashboard without switching stores.

---

## E2E-008: Waste Reduction Cycle

**Objective:** Verify waste tracking leads to prep optimization.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/waste/log` | Log 5+ waste entries over multiple days |
| 2 | Trigger `/api/cron/check-waste` | Waste agent analyzes patterns |
| 3 | Navigate to `/dashboard/waste` | Waste dashboard shows top wasted items, total cost |
| 4 | Navigate to `/dashboard/waste/prep` | AI prep targets adjusted based on waste data |
| 5 | Navigate to `/dashboard/waste/reports` | Weekly report shows waste trends, $ impact |
| 6 | Check `/dashboard/events` | Waste agent logged "high waste" events |

**Pass Criteria:** Waste data → analysis → prep optimization → visible cost savings.

---

## E2E-009: Financial Health Monitoring

**Objective:** Verify the financial pipeline from daily tracking to alerts.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard/financials/daily` | Daily P&L entries visible |
| 2 | Navigate to `/dashboard/financials/expenses` | Expenses by category |
| 3 | Navigate to `/dashboard/financials/forecast` | Revenue/cost projections |
| 4 | Navigate to `/dashboard/financials/reports` | Generate P&L report |
| 5 | Navigate to `/dashboard/financials` | Overview: food cost %, labor cost %, net margin |
| 6 | Trigger `/api/cron/check-financials` | Agent checks thresholds |
| 7 | Check `/dashboard/financials` → Alerts section | If food cost >35%, alert generated |

**Pass Criteria:** Financial data flows from daily entries → summaries → forecasts → automated alerts.

---

## E2E-010: Cross-Product Intelligence

**Objective:** Verify AI agents correlate data across systems.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger `/api/agents/run-all` | All 14 agents run |
| 2 | Check response → `cross_product` section | Shows safety↔staffing correlations |
| 3 | Check for training gap alerts | Certs near expiry + understaffed = training recommendation |
| 4 | Check high-risk store identification | Stores with multiple issues flagged |
| 5 | Check weekly insights | AI-generated weekly summary with actionable items |
| 6 | Navigate to `/dashboard/events` → Filter "cross_product" | Cross-product events visible |

**Pass Criteria:** AI connects dots across food safety, staffing, inventory, and financials.

---

## Summary

| Test ID | Journey | Steps | Priority |
|---------|---------|-------|----------|
| E2E-001 | Onboarding → First Agent Run | 8 | P0 |
| E2E-002 | Food Safety Violation → Resolution | 9 | P0 |
| E2E-003 | Hiring Pipeline → Onboarding | 9 | P0 |
| E2E-004 | Invoice → Price Alert → Vendor | 9 | P1 |
| E2E-005 | Inventory → PO → Restock | 8 | P1 |
| E2E-006 | Daily Operations Cycle | 11 | P0 |
| E2E-007 | Multi-Store Manager | 8 | P0 |
| E2E-008 | Waste Reduction Cycle | 6 | P1 |
| E2E-009 | Financial Health Monitoring | 7 | P1 |
| E2E-010 | Cross-Product Intelligence | 6 | P2 |
| **TOTAL** | | **81** | |
