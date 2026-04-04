# Vertex Autopilot — Functional Test Cases
**Product:** Vertex Autopilot — AI Restaurant Operations Platform
**Version:** 1.0
**Date:** April 3, 2026
**Prepared by:** Max (QA Architect)

---

## Functional Test Philosophy
Each test verifies a **single function** works correctly with valid inputs, invalid inputs, and edge cases.

---

## Module 1: Authentication

### FT-AUTH-001: Email/Password Registration
| Field | Detail |
|-------|--------|
| **Precondition** | No existing account with test email |
| **Input** | Email: `test@example.com`, Password: `Test1234!` |
| **Steps** | 1. Go to `/login` 2. Click "Sign up" 3. Enter credentials 4. Submit |
| **Expected** | Account created, redirected to `/dashboard` |
| **Negative** | Empty email → error, weak password → error, duplicate email → error |

### FT-AUTH-002: Email/Password Login
| Field | Detail |
|-------|--------|
| **Precondition** | Account exists |
| **Input** | Valid email + password |
| **Steps** | 1. Go to `/login` 2. Enter credentials 3. Submit |
| **Expected** | Logged in, redirected to `/dashboard` |
| **Negative** | Wrong password → "Invalid login credentials", non-existent email → error |

### FT-AUTH-003: Google OAuth Login
| Field | Detail |
|-------|--------|
| **Precondition** | Google account exists |
| **Steps** | 1. Go to `/login` 2. Click "Continue with Google" 3. Select Google account |
| **Expected** | OAuth flow completes, redirected to `/dashboard` |
| **Negative** | Cancel OAuth → returns to login page |

### FT-AUTH-004: Auth Guard (Middleware)
| Field | Detail |
|-------|--------|
| **Precondition** | Not logged in |
| **Steps** | 1. Navigate directly to `/dashboard` |
| **Expected** | Redirected to `/login` |
| **Negative** | All `/dashboard/*` routes redirect when unauthenticated |

---

## Module 2: Dashboard & Navigation

### FT-DASH-001: Command Center Data Loading
| Field | Detail |
|-------|--------|
| **Steps** | 1. Log in 2. Verify `/dashboard` |
| **Expected** | Stats cards load: locations, expiring certs, open actions, pending approvals |
| **Verify** | Numbers match API: `/api/dashboard/stats` |

### FT-DASH-002: Sidebar Navigation
| Field | Detail |
|-------|--------|
| **Steps** | Click each of 15 sidebar items |
| **Expected** | Each navigates to correct page, active item highlighted blue |
| **Verify** | All 15 routes load without errors |

### FT-DASH-003: Mobile Navigation
| Field | Detail |
|-------|--------|
| **Steps** | 1. Resize to mobile (<768px) 2. Tap hamburger 3. Navigate |
| **Expected** | Hamburger menu opens, all items accessible, closes after selection |

---

## Module 3: Store Management

### FT-STORE-001: Store List Loading
| Field | Detail |
|-------|--------|
| **API** | `GET /api/dashboard/stats` |
| **Expected** | Grid of stores with name, safety score, staffing %, status badge |
| **Verify** | Count matches database `locations` table |

### FT-STORE-002: Store Detail Page
| Field | Detail |
|-------|--------|
| **Steps** | Click any store card |
| **Expected** | `/dashboard/stores/[id]` loads with: employees, certs, staffing, temp logs, corrective actions |
| **Negative** | Invalid store ID → graceful error |

### FT-STORE-003: Store Status Calculation
| Field | Detail |
|-------|--------|
| **Logic** | Critical: safety score <70 or staffing <60%. Warning: score <85 or staffing <80%. Healthy: rest |
| **Verify** | Badge color matches calculated status |

---

## Module 4: Orders

### FT-ORDER-001: Create New Order
| Field | Detail |
|-------|--------|
| **API** | `POST /api/orders` |
| **Input** | `{ location_id, channel: "phone", customer_name, items, total }` |
| **Expected** | Order created with `status: new`, `order_number` auto-assigned |
| **Negative** | Missing location_id → 400, missing channel → 400 |

### FT-ORDER-002: Update Order Status
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/orders/[id]` |
| **Input** | `{ status: "preparing" }` then `"ready"` then `"completed"` |
| **Expected** | Status updates, `completed_at` set when completed |
| **Negative** | Invalid status → 400, non-existent ID → 404 |

### FT-ORDER-003: Order Queue Filtering
| Field | Detail |
|-------|--------|
| **API** | `GET /api/orders/queue` |
| **Expected** | Returns only orders with status: new, preparing, ready |
| **Verify** | Completed/cancelled orders excluded |

### FT-ORDER-004: Order Analytics
| Field | Detail |
|-------|--------|
| **API** | `GET /api/orders/analytics` |
| **Expected** | Returns: total orders, avg prep time, orders by channel, orders by hour |

### FT-ORDER-005: Order Issues
| Field | Detail |
|-------|--------|
| **API** | `GET /api/orders/issues`, `POST /api/orders/issues` |
| **Input** | `{ order_id, issue_type: "wrong_item", description }` |
| **Expected** | Issue logged, linked to order |

---

## Module 5: Menu Management

### FT-MENU-001: List Menu Items
| Field | Detail |
|-------|--------|
| **API** | `GET /api/menu` |
| **Expected** | Returns all menu items grouped by category |

### FT-MENU-002: Add Menu Item
| Field | Detail |
|-------|--------|
| **API** | `POST /api/menu` |
| **Input** | `{ location_id, name: "Pancake Stack", category: "Breakfast", price: 9.99 }` |
| **Expected** | Item created, returned with ID |
| **Negative** | Missing name → 400, negative price → 400 |

### FT-MENU-003: Update Menu Item
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/menu/[id]` |
| **Input** | `{ price: 10.99, available: false }` |
| **Expected** | Price updated, availability toggled |

---

## Module 6: Checklists

### FT-CHECK-001: List Templates
| Field | Detail |
|-------|--------|
| **API** | `GET /api/checklists/templates` |
| **Expected** | Returns opening, closing, safety templates with items |

### FT-CHECK-002: Start Checklist
| Field | Detail |
|-------|--------|
| **API** | `POST /api/checklists/start` |
| **Input** | `{ template_id, location_id, completed_by: "John", shift_type: "opening" }` |
| **Expected** | New completion record with `status: in_progress`, `completion_pct: 0` |

### FT-CHECK-003: Update Checklist Progress
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/checklists/[id]` |
| **Input** | `{ items_completed: [...], completion_pct: 75 }` |
| **Expected** | Progress saved, percentage updated |

### FT-CHECK-004: Complete Checklist
| Field | Detail |
|-------|--------|
| **Input** | `{ status: "completed", completion_pct: 100, handoff_notes: "All good" }` |
| **Expected** | `completed_at` set, status → completed, appears in history |

### FT-CHECK-005: Checklist History
| Field | Detail |
|-------|--------|
| **API** | `GET /api/checklists/history` |
| **Expected** | Returns past completions sorted by date, filterable by location |

---

## Module 7: Food Safety

### FT-SAFE-001: Log Temperature
| Field | Detail |
|-------|--------|
| **API** | `POST /api/temp-logs` |
| **Input** | `{ location_id, equipment: "Walk-In Cooler", temperature: 38, recorded_by: "Cook" }` |
| **Expected** | Log saved, `status: normal` (38°F < 41°F max) |

### FT-SAFE-002: Out-of-Range Detection
| Field | Detail |
|-------|--------|
| **Input** | `{ equipment: "Walk-In Cooler", temperature: 50 }` |
| **Expected** | Log saved, `status: violation`, agent creates corrective action |

### FT-SAFE-003: Certification Tracking
| Field | Detail |
|-------|--------|
| **API** | `GET /api/dashboard/stats` (certs section) |
| **Expected** | Expiring certs (<30 days) listed with employee name, type, expiry date |
| **Verify** | Color coding: red (<0 days), yellow (<7 days), orange (<30 days) |

### FT-SAFE-004: Corrective Action CRUD
| Field | Detail |
|-------|--------|
| **API** | `GET /api/corrective-actions/[id]`, `PATCH /api/corrective-actions/[id]` |
| **Steps** | View action → Add resolution notes → Mark resolved |
| **Expected** | Status → resolved, completed_at set |

---

## Module 8: Hiring

### FT-HIRE-001: Candidate Pipeline
| Field | Detail |
|-------|--------|
| **API** | `GET /api/candidates/[id]` |
| **Expected** | Returns candidate with: name, role, AI score, status, phone, email |

### FT-HIRE-002: Advance Candidate
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/candidates/[id]` |
| **Input** | `{ status: "interviewing" }` |
| **Expected** | Status updated, pipeline counts refresh |

### FT-HIRE-003: Reject Candidate
| Field | Detail |
|-------|--------|
| **Input** | `{ status: "rejected", reject_reason: "No experience" }` |
| **Expected** | Removed from active pipeline, reason saved |

### FT-HIRE-004: Offer Letter & E-Signature
| Field | Detail |
|-------|--------|
| **Steps** | Navigate to `/offer/[candidateId]` → Draw signature → Accept |
| **Expected** | Signature saved (canvas data), candidate status → hired |

---

## Module 9: Invoices

### FT-INV-001: List Invoices
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices` |
| **Expected** | Returns invoices with: vendor, total, status, due_date |
| **Filters** | By status (pending/approved/paid/overdue), by location |

### FT-INV-002: Invoice Detail
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices/[id]` |
| **Expected** | Full invoice with line items, amounts, vendor info |

### FT-INV-003: Approve/Dispute Invoice
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/invoices/[id]` |
| **Input** | `{ status: "approved" }` or `{ status: "disputed", dispute_reason: "Wrong amount" }` |
| **Expected** | Status updated, audit trail entry created |

### FT-INV-004: Price Alert Detection
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices/price-alerts` |
| **Expected** | Returns items where vendor price changed >15% from previous invoice |

### FT-INV-005: Invoice Aging Report
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices/aging` |
| **Expected** | Invoices grouped by: current, 1-30 days, 31-60, 61-90, 90+ |

---

## Module 10: Vendors

### FT-VEND-001: List Vendors
| Field | Detail |
|-------|--------|
| **API** | `GET /api/vendors` |
| **Expected** | Returns vendors with: name, contact, email, phone |

### FT-VEND-002: Add Vendor
| Field | Detail |
|-------|--------|
| **API** | `POST /api/vendors` |
| **Input** | `{ location_id, name, contact_name, contact_email }` |
| **Expected** | Vendor created, returned with ID |

### FT-VEND-003: Update Vendor
| Field | Detail |
|-------|--------|
| **API** | `PUT /api/vendors/[id]` or `PATCH /api/vendors/[id]` |
| **Input** | `{ contact_email: "new@email.com" }` |
| **Expected** | Contact info updated |

---

## Module 11: Inventory

### FT-INVT-001: List Inventory Items
| Field | Detail |
|-------|--------|
| **API** | `GET /api/inventory` |
| **Expected** | Items with: name, quantity, unit, par_level, category |

### FT-INVT-002: Inventory Alerts
| Field | Detail |
|-------|--------|
| **API** | `GET /api/inventory/alerts` |
| **Expected** | Below-par items, expiring items, out-of-stock items |

### FT-INVT-003: Physical Count
| Field | Detail |
|-------|--------|
| **API** | `POST /api/inventory/count` |
| **Input** | `{ item_id, counted_qty: 15, counted_by: "Manager" }` |
| **Expected** | Count recorded, variance calculated vs system qty |

### FT-INVT-004: Purchase Orders
| Field | Detail |
|-------|--------|
| **API** | `GET /api/purchase-orders`, `POST /api/purchase-orders` |
| **Expected** | PO created with items, vendor, estimated total |

---

## Module 12: Waste Management

### FT-WASTE-001: Log Waste
| Field | Detail |
|-------|--------|
| **API** | `POST /api/waste` |
| **Input** | `{ location_id, item_name: "Lettuce", quantity: 5, unit: "lbs", reason: "expired", cost: 12.50 }` |
| **Expected** | Waste entry saved |

### FT-WASTE-002: Waste Dashboard
| Field | Detail |
|-------|--------|
| **API** | `GET /api/waste/dashboard` |
| **Expected** | Total waste cost, top wasted items, waste % of food cost |

### FT-WASTE-003: Prep Targets
| Field | Detail |
|-------|--------|
| **API** | `GET /api/waste/prep-targets` |
| **Expected** | AI-suggested prep quantities by item and day of week |

### FT-WASTE-004: Waste Reports
| Field | Detail |
|-------|--------|
| **API** | `GET /api/waste/reports` |
| **Expected** | Weekly/monthly waste summaries with trends |

---

## Module 13: Financials

### FT-FIN-001: Financial Summary
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/summary` |
| **Expected** | Total revenue, food cost %, labor cost %, net profit, comparison to targets |

### FT-FIN-002: Daily Financials
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/daily`, `POST /api/financials/daily` |
| **Input** | `{ location_id, date, revenue: 5000, food_cost: 1500, labor_cost: 1200 }` |
| **Expected** | Day entry saved, net_profit calculated, food_cost_pct = 30% |

### FT-FIN-003: Expenses
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/expenses`, `POST /api/financials/expenses` |
| **Expected** | Expenses by category with totals vs budgets |

### FT-FIN-004: Forecast
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/forecast` |
| **Expected** | 30/60/90-day projections based on historical data |

### FT-FIN-005: Financial Alerts
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/alerts` |
| **Expected** | Alerts when food cost >35%, labor >30%, or net margin <5% |

---

## Module 14: AI Agents

### FT-AGENT-001: Run All Agents
| Field | Detail |
|-------|--------|
| **API** | `GET /api/agents/run-all` |
| **Expected** | JSON with `agents: 14`, summary per agent, events array |
| **Timing** | Completes within 60 seconds |

### FT-AGENT-002: Individual Cron Endpoints
| Field | Detail |
|-------|--------|
| **APIs** | `/api/cron/check-temps`, `/api/cron/check-certs`, `/api/cron/check-corrective`, `/api/cron/check-staffing`, `/api/cron/screen-candidates`, `/api/cron/daily-summary`, `/api/cron/check-invoices`, `/api/cron/check-inventory`, `/api/cron/check-orders`, `/api/cron/check-checklists`, `/api/cron/check-waste`, `/api/cron/check-financials` |
| **Expected** | Each returns `{ success: true }` with results |

### FT-AGENT-003: Agent Event Logging
| Field | Detail |
|-------|--------|
| **Verify** | After any agent run, `agent_events` table has new rows |
| **Fields** | agent_type, event_type, location_id, severity, description, action_taken, metadata |

---

## Module 15: Notifications

### FT-NOTIF-001: SMS Delivery (Twilio)
| Field | Detail |
|-------|--------|
| **Trigger** | Critical food safety violation |
| **Expected** | SMS sent to assigned cook/manager, message includes store name + details |

### FT-NOTIF-002: Email Delivery (Resend)
| Field | Detail |
|-------|--------|
| **Trigger** | Certification expiring (30-day warning) |
| **Expected** | HTML email sent to employee from `hello@vertexlabsolutions.com` |

---

## Module 16: Data Export & Audit

### FT-EXPORT-001: CSV Export
| Field | Detail |
|-------|--------|
| **API** | `GET /api/export/employees`, `/api/export/candidates`, `/api/export/temp_logs`, `/api/export/events` |
| **Expected** | Downloads CSV file with correct columns and data |

### FT-EXPORT-002: Audit Trail
| Field | Detail |
|-------|--------|
| **API** | `GET /api/audit` |
| **Expected** | Returns all auditable actions with user, timestamp, action, details |

---

## Summary

| Module | Test Cases | Priority |
|--------|-----------|----------|
| Authentication | 4 | P0 |
| Dashboard & Nav | 3 | P0 |
| Store Management | 3 | P0 |
| Orders | 5 | P0 |
| Menu | 3 | P1 |
| Checklists | 5 | P0 |
| Food Safety | 4 | P0 |
| Hiring | 4 | P0 |
| Invoices | 5 | P1 |
| Vendors | 3 | P1 |
| Inventory | 4 | P1 |
| Waste | 4 | P1 |
| Financials | 5 | P1 |
| AI Agents | 3 | P0 |
| Notifications | 2 | P0 |
| Export & Audit | 2 | P2 |
| **TOTAL** | **59** | |
