# Vertex Autopilot — Master Test Document
## Complete Test Suite: QA + Functional + E2E + UAT
**Product:** Vertex Autopilot — AI Restaurant Operations Platform
**Version:** 1.0
**URL:** https://app-khaki-pi-37.vercel.app
**Date:** April 3, 2026
**Prepared by:** Max (QA Architect)

---

# TABLE OF CONTENTS

1. [Test Overview](#1-test-overview)
2. [Environment & Setup](#2-environment--setup)
3. [PART A: QA Checklist (97 Tests)](#part-a-qa-checklist)
4. [PART B: Functional Test Cases (84 Tests)](#part-b-functional-test-cases)
5. [PART C: End-to-End Test Cases (81 Steps)](#part-c-end-to-end-test-cases)
6. [PART D: User Acceptance Testing (12 Scenarios)](#part-d-user-acceptance-testing)
7. [PART E: API Contract Tests (88 Endpoints)](#part-e-api-contract-tests)
8. [PART F: Agent-Specific Tests (14 Agents)](#part-f-agent-specific-tests)
9. [PART G: Notification Tests](#part-g-notification-tests)
10. [PART H: Security Tests](#part-h-security-tests)
11. [PART I: Performance Tests](#part-i-performance-tests)
12. [PART J: Cross-Browser & Responsive Tests](#part-j-cross-browser--responsive-tests)
13. [Defect Management](#defect-management)
14. [Sign-Off](#sign-off)

---

# 1. Test Overview

| Category | Test Count | Priority |
|----------|-----------|----------|
| QA Checklist (page-level) | 97 | P0-P1 |
| Functional Tests (feature-level) | 84 | P0-P2 |
| E2E Journeys (flow-level) | 10 journeys / 81 steps | P0-P2 |
| UAT Scenarios (business-level) | 12 scenarios / 68 steps | P0-P2 |
| API Contract Tests | 88 endpoints | P0 |
| Agent Tests | 14 agents / 42 tests | P0 |
| Notification Tests | 8 tests | P0 |
| Security Tests | 12 tests | P0 |
| Performance Tests | 8 tests | P1 |
| Cross-Browser/Responsive | 12 tests | P1 |
| **GRAND TOTAL** | **~430+ test cases** | |

---

# 2. Environment & Setup

| Item | Detail |
|------|--------|
| **Production URL** | https://app-khaki-pi-37.vercel.app |
| **Test Account** | Sign up or use Google OAuth |
| **Database** | Supabase (iatdvwzenpjrwwotlewg) — 30 IHOP locations seeded |
| **Integrations** | Twilio SMS ✅, Resend Email ✅, Stripe ✅, Weather API ✅ |
| **Health Check** | `/api/health` — 10/10 passing |
| **Browsers** | Chrome (latest), Safari, Firefox, Mobile Chrome, Mobile Safari |
| **Devices** | Desktop (1920x1080), Tablet (768x1024), Mobile (375x812) |

### Test Data Available
- 30 IHOP locations across multiple states
- 76 employees with roles (manager, cook, server, host)
- 40 certifications (some expiring soon)
- 50 staffing targets
- 50 temp log schedules
- 166 agent events (historical)

---

# PART A: QA CHECKLIST
*Page-by-page verification that everything loads and functions*

## A1. Authentication & Public Pages (8 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-001 | Landing page | Go to `/` | Hero section, features, pricing CTA visible | P0 | ☐ |
| QA-002 | Login page | Go to `/login` | Email/password form + Google button visible | P0 | ☐ |
| QA-003 | Google Sign-In | Click Google → complete OAuth | Redirected to `/dashboard` | P0 | ☐ |
| QA-004 | Email Sign Up | Enter new email + password → Sign up | Account created, redirected to `/dashboard` | P0 | ☐ |
| QA-005 | Email Login | Enter existing credentials → Sign in | Logged in, redirected to `/dashboard` | P0 | ☐ |
| QA-006 | Invalid login | Enter wrong password | Error message shown | P0 | ☐ |
| QA-007 | Pricing page | Go to `/pricing` | 3 plans visible, "14 Agents" text | P1 | ☐ |
| QA-008 | Privacy page | Go to `/privacy` | Privacy policy content loads | P2 | ☐ |

## A2. Command Center — Dashboard Home (7 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-009 | Dashboard loads | Go to `/dashboard` | Stats cards, agent feed, approvals visible | P0 | ☐ |
| QA-010 | Stats accuracy | Compare cards to `/api/dashboard/stats` | Numbers match API | P0 | ☐ |
| QA-011 | Agent activity feed | Scroll activity feed | Events show with timestamps + severity badges | P0 | ☐ |
| QA-012 | Pending approvals | Check approvals section | Approve/reject buttons visible if items exist | P0 | ☐ |
| QA-013 | Sidebar navigation | Check all 15 nav items | All present: Command Center → Settings | P0 | ☐ |
| QA-014 | Agent count badge | Check sidebar footer | "14 agents active" with green dot | P0 | ☐ |
| QA-015 | Mobile hamburger | Resize to mobile → tap hamburger | Menu opens, all items accessible | P1 | ☐ |

## A3. All Stores (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-016 | Store grid | Go to `/dashboard/stores` | Store cards with safety scores visible | P0 | ☐ |
| QA-017 | Status badges | Check card colors | Critical=red, Warning=yellow, Healthy=green | P0 | ☐ |
| QA-018 | Staffing bars | Check progress bars | Per-role staffing % shown | P0 | ☐ |
| QA-019 | Store drill-down | Click a store card | `/dashboard/stores/[id]` loads with detail | P0 | ☐ |
| QA-020 | Store sections | Check detail page | Employees, certs, staffing, temp logs, corrective actions, candidates | P0 | ☐ |

## A4. Orders (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-021 | Order queue | Go to `/dashboard/orders` | Active orders listed | P0 | ☐ |
| QA-022 | New order | Go to `/dashboard/orders/new` → create order | Order appears in queue | P0 | ☐ |
| QA-023 | Order history | Go to `/dashboard/orders/history` | Past orders visible | P1 | ☐ |
| QA-024 | Order analytics | Go to `/dashboard/orders/analytics` | Charts/stats load | P1 | ☐ |
| QA-025 | Order issues | Go to `/dashboard/orders/issues` | Reported issues visible | P1 | ☐ |

## A5. Menu (4 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-026 | Menu list | Go to `/dashboard/menu` | Items by category | P0 | ☐ |
| QA-027 | Add item | Click add → fill form → save | Item appears | P1 | ☐ |
| QA-028 | Edit item | Click item → modify → save | Changes reflected | P1 | ☐ |
| QA-029 | Toggle availability | Toggle on/off | Status updates | P1 | ☐ |

## A6. Checklists (6 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-030 | Checklists page | Go to `/dashboard/checklists` | Active checklists visible | P0 | ☐ |
| QA-031 | Templates | Go to `/dashboard/checklists/templates` | Opening/closing/safety templates | P0 | ☐ |
| QA-032 | Start checklist | Go to `/dashboard/checklists/start` → select template | Checklist begins | P0 | ☐ |
| QA-033 | Complete items | Check off items | Completion % updates | P0 | ☐ |
| QA-034 | Checklist detail | Go to `/dashboard/checklists/[id]` | Item-by-item status | P1 | ☐ |
| QA-035 | History | Go to `/dashboard/checklists/history` | Past completions | P1 | ☐ |

## A7. Food Safety (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-036 | Safety dashboard | Go to `/dashboard/safety` | Temp logs, certs, corrective actions | P0 | ☐ |
| QA-037 | Temp log entries | Check temp logs | Equipment, temp, time, status visible | P0 | ☐ |
| QA-038 | Violations flagged | Check out-of-range temps | Highlighted red | P0 | ☐ |
| QA-039 | Certifications | Check cert list | Expiry dates, urgency colors | P0 | ☐ |
| QA-040 | Corrective actions | Check actions list | Open/resolved with due dates | P0 | ☐ |

## A8. Hiring (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-041 | Pipeline view | Go to `/dashboard/hiring` | Funnel: Applied→Screened→Interview→Offered→Hired | P0 | ☐ |
| QA-042 | Candidate table | Check table | AI scores, status, role visible | P0 | ☐ |
| QA-043 | Candidate actions | Click candidate | Advance/reject buttons work | P0 | ☐ |
| QA-044 | Job postings | Check postings | Location, role, source visible | P1 | ☐ |
| QA-045 | Staffing health | Check bars | Current vs target per role | P0 | ☐ |

## A9. Invoices (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-046 | Invoice list | Go to `/dashboard/invoices` | Invoices with status badges | P0 | ☐ |
| QA-047 | Invoice detail | Click invoice → `/dashboard/invoices/[id]` | Line items, total, vendor | P0 | ☐ |
| QA-048 | Upload invoice | Go to `/dashboard/invoices/upload` → upload | File processed | P1 | ☐ |
| QA-049 | Price alerts | Go to `/dashboard/invoices/price-alerts` | Price change alerts | P1 | ☐ |
| QA-050 | Invoice actions | Approve/dispute/mark-paid | Status updates correctly | P0 | ☐ |

## A10. Vendors (3 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-051 | Vendor list | Go to `/dashboard/vendors` | Vendors with contact info | P0 | ☐ |
| QA-052 | Add vendor | Click add → fill form → save | Vendor appears | P1 | ☐ |
| QA-053 | Vendor detail | Click vendor | Invoices, price history | P1 | ☐ |

## A11. Inventory (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-054 | Inventory list | Go to `/dashboard/inventory` | Items with par levels | P0 | ☐ |
| QA-055 | Alerts | Go to `/dashboard/inventory/alerts` | Below-par + expiring items | P0 | ☐ |
| QA-056 | Count | Go to `/dashboard/inventory/count` | Enter physical counts | P1 | ☐ |
| QA-057 | Purchase orders | Go to `/dashboard/inventory/orders` | POs with status | P1 | ☐ |
| QA-058 | Waste tracking | Go to `/dashboard/inventory/waste` | Log waste items | P1 | ☐ |

## A12. Waste (4 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-059 | Waste dashboard | Go to `/dashboard/waste` | Summary, top wasted items | P0 | ☐ |
| QA-060 | Log waste | Go to `/dashboard/waste/log` → add entry | Entry saved | P0 | ☐ |
| QA-061 | Prep targets | Go to `/dashboard/waste/prep` | AI-suggested quantities | P1 | ☐ |
| QA-062 | Waste reports | Go to `/dashboard/waste/reports` | Weekly/monthly reports | P1 | ☐ |

## A13. Financials (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-063 | Financial overview | Go to `/dashboard/financials` | P&L, food/labor cost % | P0 | ☐ |
| QA-064 | Daily tracker | Go to `/dashboard/financials/daily` | Daily revenue, costs, profit | P0 | ☐ |
| QA-065 | Expenses | Go to `/dashboard/financials/expenses` | Expenses by category | P1 | ☐ |
| QA-066 | Forecast | Go to `/dashboard/financials/forecast` | Revenue/cost projections | P1 | ☐ |
| QA-067 | Reports | Go to `/dashboard/financials/reports` | Generate financial reports | P1 | ☐ |

## A14. Agent Activity (4 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-068 | Event log | Go to `/dashboard/events` | All agent events with filters | P0 | ☐ |
| QA-069 | Filter by agent | Select agent type filter | Only matching events shown | P1 | ☐ |
| QA-070 | Filter by severity | Select severity filter | Correct events shown | P1 | ☐ |
| QA-071 | Event detail | Click event | Full description + metadata | P1 | ☐ |

## A15. Approvals (3 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-072 | Approval queue | Go to `/dashboard/approvals` | Pending approvals listed | P0 | ☐ |
| QA-073 | Approve | Click Approve | Status changes, removed from queue | P0 | ☐ |
| QA-074 | Reject | Click Reject | Status changes, removed from queue | P0 | ☐ |

## A16. Settings (5 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-075 | Settings page | Go to `/dashboard/settings` | All 14 agents listed | P0 | ☐ |
| QA-076 | Agent toggle | Toggle agent on/off | Status updates | P1 | ☐ |
| QA-077 | Run all agents | Click "▶ Run All 14 Agents" | API response with results | P0 | ☐ |
| QA-078 | Notification prefs | Check notification toggles | SMS/Email per severity | P1 | ☐ |
| QA-079 | Integration status | Check connections | Twilio, Resend, Stripe status shown | P1 | ☐ |

## A17. QR Codes (2 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-080 | QR page | Go to `/dashboard/qrcodes` | QR codes visible | P1 | ☐ |
| QA-081 | QR scan | Scan QR code | Opens temp log form | P1 | ☐ |

## A18. API & Integrations (4 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-082 | Health check | Go to `/api/health` | 10/10 pass | P0 | ☐ |
| QA-083 | Run all agents | Go to `/api/agents/run-all` | 14 agent results in JSON | P0 | ☐ |
| QA-084 | CSV export | Go to `/api/export/employees` | CSV file downloads | P1 | ☐ |
| QA-085 | Audit log | Go to `/api/audit` | Audit entries returned | P1 | ☐ |

## A19. Responsive Design (3 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-086 | Mobile | Phone width (<768px) | Hamburger nav, stacked cards, no overflow | P1 | ☐ |
| QA-087 | Tablet | Tablet width (768-1024px) | Proper grid layout | P1 | ☐ |
| QA-088 | Desktop | Full width (>1024px) | Sidebar visible, multi-column grids | P0 | ☐ |

## A20. Edge Cases (4 tests)
| ID | Test | Steps | Expected | P | ☐ |
|----|------|-------|----------|---|---|
| QA-089 | Empty state | Location with no data | Graceful empty states, no crashes | P0 | ☐ |
| QA-090 | Auth guard | Open `/dashboard` logged out | Redirect to `/login` | P0 | ☐ |
| QA-091 | 404 page | Go to `/dashboard/nonexistent` | Graceful error page | P1 | ☐ |
| QA-092 | Slow network | Throttle to 3G | Pages load with loading states | P2 | ☐ |

**QA Checklist Total: 92 tests**

---

# PART B: FUNCTIONAL TEST CASES
*Feature-level testing with valid/invalid inputs and edge cases*

## B1. Authentication Functions

### FT-001: Email/Password Registration
| Field | Detail |
|-------|--------|
| **API** | Supabase Auth `signUp` |
| **Valid Input** | Email: `test@example.com`, Password: `Test1234!` |
| **Expected** | Account created, session established |
| **Negative Cases** | |
| | Empty email → "Email is required" |
| | Invalid email format → "Invalid email" |
| | Password <6 chars → "Password should be at least 6 characters" |
| | Duplicate email → "User already registered" |

### FT-002: Email/Password Login
| Field | Detail |
|-------|--------|
| **Valid Input** | Existing email + correct password |
| **Expected** | Session created, redirect to `/dashboard` |
| **Negative Cases** | |
| | Wrong password → "Invalid login credentials" |
| | Non-existent email → "Invalid login credentials" |
| | Empty fields → validation error |

### FT-003: Google OAuth
| Field | Detail |
|-------|--------|
| **Expected** | Google consent → callback → session → dashboard |
| **Negative** | Cancel OAuth → return to login, no error |

### FT-004: Session Management
| Field | Detail |
|-------|--------|
| **Tests** | |
| | Refresh page → stay logged in (session persists) |
| | Open new tab → auto-logged in |
| | Session expiry → redirect to login |

### FT-005: Auth Middleware
| Field | Detail |
|-------|--------|
| **Protected routes** | All `/dashboard/*` paths |
| **Unprotected** | `/`, `/login`, `/pricing`, `/privacy`, `/api/*` |
| **Test** | Hit each protected route without auth → 302 to `/login` |

## B2. Dashboard Stats

### FT-006: Dashboard Stats API
| Field | Detail |
|-------|--------|
| **API** | `GET /api/dashboard/stats` |
| **Expected Response** | `{ locations, expiring_certs, open_actions, pending_approvals, recent_events }` |
| **Verify** | Each count matches direct DB query |

## B3. Order Functions

### FT-007: Create Order
| Field | Detail |
|-------|--------|
| **API** | `POST /api/orders` |
| **Valid** | `{ location_id: "uuid", channel: "phone", customer_name: "John", items: [...], total: 25.99 }` |
| **Expected** | 200, order created with `status: "new"`, auto `order_number` |
| **Negative** | Missing location_id → 400/500, missing channel → error |

### FT-008: Update Order Status
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/orders/[id]` |
| **Valid transitions** | new → preparing → ready → completed |
| **Expected** | Status updates, `completed_at` set on "completed" |
| **Negative** | Invalid ID → 404, invalid status value → 400 |

### FT-009: Cancel Order
| Field | Detail |
|-------|--------|
| **Input** | `{ status: "cancelled", cancel_reason: "Customer request" }` |
| **Expected** | Status → cancelled, `cancelled_at` set, `cancel_reason` saved |

### FT-010: Order Queue
| Field | Detail |
|-------|--------|
| **API** | `GET /api/orders/queue` |
| **Expected** | Only orders with status: new, preparing, ready. Sorted by created_at |
| **Verify** | Completed/cancelled orders excluded |

### FT-011: Order Analytics
| Field | Detail |
|-------|--------|
| **API** | `GET /api/orders/analytics` |
| **Expected** | `{ total_orders, avg_prep_time, by_channel, by_hour, by_status }` |

### FT-012: Report Order Issue
| Field | Detail |
|-------|--------|
| **API** | `POST /api/orders/issues` (or inline) |
| **Valid** | `{ order_id, issue_type: "wrong_item", description: "Got pancakes instead of waffles" }` |
| **Expected** | Issue logged, linked to order |

## B4. Menu Functions

### FT-013: List Menu Items
| Field | Detail |
|-------|--------|
| **API** | `GET /api/menu` |
| **Expected** | Array of items with: id, name, category, price, available, prep_time_mins |
| **Filter** | `?location_id=xxx` → only that location's items |

### FT-014: Create Menu Item
| Field | Detail |
|-------|--------|
| **API** | `POST /api/menu` |
| **Valid** | `{ location_id, name: "Pancake Stack", category: "Breakfast", price: 9.99, prep_time_mins: 12 }` |
| **Negative** | Missing name → error, negative price → error |

### FT-015: Update Menu Item
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/menu/[id]` |
| **Valid** | `{ price: 10.99 }` or `{ available: false }` |
| **Expected** | Field updated, other fields unchanged |

### FT-016: Delete Menu Item
| Field | Detail |
|-------|--------|
| **API** | `DELETE /api/menu/[id]` |
| **Expected** | Item removed, no longer in GET response |
| **Negative** | Invalid ID → 404 |

## B5. Checklist Functions

### FT-017: List Templates
| Field | Detail |
|-------|--------|
| **API** | `GET /api/checklists/templates` |
| **Expected** | Templates with: id, name, type (opening/closing/safety), items array |

### FT-018: Create Template
| Field | Detail |
|-------|--------|
| **API** | `POST /api/checklists/templates` |
| **Valid** | `{ name: "Deep Clean", type: "safety", items: [{task, required}], location_id }` |

### FT-019: Start Checklist
| Field | Detail |
|-------|--------|
| **API** | `POST /api/checklists/start` |
| **Valid** | `{ template_id, location_id, completed_by: "John", shift_type: "opening" }` |
| **Expected** | Completion created: `status: "in_progress"`, `completion_pct: 0` |

### FT-020: Update Checklist Progress
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/checklists/[id]` |
| **Valid** | `{ items_completed: [{task, done: true}], completion_pct: 75 }` |
| **Expected** | Progress saved |

### FT-021: Complete Checklist
| Field | Detail |
|-------|--------|
| **Input** | `{ status: "completed", completion_pct: 100, handoff_notes: "All good" }` |
| **Expected** | `completed_at` set, appears in history |

### FT-022: Handoff Notes
| Field | Detail |
|-------|--------|
| **API** | `POST /api/checklists/handoff` |
| **Expected** | Notes saved, visible to next shift |

### FT-023: Checklist History
| Field | Detail |
|-------|--------|
| **API** | `GET /api/checklists/history` |
| **Filters** | `?location_id=xxx&shift_type=opening&from=2026-04-01` |
| **Expected** | Past completions sorted by date |

## B6. Food Safety Functions

### FT-024: Log Temperature (Normal)
| Field | Detail |
|-------|--------|
| **API** | `POST /api/temp-logs` |
| **Valid** | `{ location_id, equipment: "Walk-In Cooler", temperature: 38, recorded_by: "Cook" }` |
| **Expected** | 200, `status: "normal"` (38°F < 41°F threshold) |

### FT-025: Log Temperature (Violation)
| Field | Detail |
|-------|--------|
| **Input** | `{ equipment: "Walk-In Cooler", temperature: 50 }` |
| **Expected** | Log saved, `status: "violation"` (50°F > 41°F) |

### FT-026: Log Temperature (Hot Hold Violation)
| Field | Detail |
|-------|--------|
| **Input** | `{ equipment: "Hot Hold Station", temperature: 120 }` |
| **Expected** | `status: "violation"` (120°F < 135°F minimum) |

### FT-027: Certification CRUD
| Field | Detail |
|-------|--------|
| **Read** | `GET` via dashboard → certs with expiry dates, status |
| **Verify** | Expired certs → status: "expired". Expiring <30d → flagged |

### FT-028: Corrective Action Resolution
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/corrective-actions/[id]` |
| **Input** | `{ status: "resolved", resolution: "Moved items to backup cooler" }` |
| **Expected** | Status → resolved, `completed_at` set |

### FT-029: Temp Log Schedules
| Field | Detail |
|-------|--------|
| **API** | `GET /api/temp-log-schedules` |
| **Expected** | Schedules with: equipment, times, assigned_role, grace period |

## B7. Hiring Functions

### FT-030: Get Candidate
| Field | Detail |
|-------|--------|
| **API** | `GET /api/candidates/[id]` |
| **Expected** | Full candidate: name, role, AI score, status, phone, resume_url |

### FT-031: Advance Candidate
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/candidates/[id]` |
| **Valid transitions** | applied → screened → interviewing → offered → hired |
| **Expected** | Status updated, pipeline counts change |

### FT-032: Reject Candidate
| Field | Detail |
|-------|--------|
| **Input** | `{ status: "rejected", reject_reason: "No food handler cert" }` |
| **Expected** | Removed from active pipeline |

### FT-033: AI Candidate Screening
| Field | Detail |
|-------|--------|
| **API** | `GET /api/cron/screen-candidates` |
| **Expected** | Unscored candidates get AI scores (1-10), status → screened |

### FT-034: Offer Letter Generation
| Field | Detail |
|-------|--------|
| **API** | `GET /api/offer-letter/[candidateId]` |
| **Expected** | HTML offer letter with candidate name, role, pay, start date |

### FT-035: E-Signature Accept
| Field | Detail |
|-------|--------|
| **Page** | `/offer/[candidateId]` |
| **Steps** | Draw signature on canvas → click Accept |
| **Expected** | Signature data saved, status → hired |

### FT-036: Text-to-Apply Webhook
| Field | Detail |
|-------|--------|
| **API** | `POST /api/sms/text-to-apply` |
| **Input** | Twilio webhook payload with applicant phone |
| **Expected** | New candidate created, auto-reply SMS sent |

### FT-037: Job Postings CRUD
| Field | Detail |
|-------|--------|
| **API** | `GET /api/jobs/[id]`, `PATCH /api/jobs/[id]` |
| **Expected** | Job posting with: title, description, requirements, pay_range, status |

## B8. Invoice Functions

### FT-038: List Invoices
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices` |
| **Filters** | `?status=pending`, `?location_id=xxx` |
| **Expected** | Invoices with: vendor, total, status, due_date |

### FT-039: Invoice Detail
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices/[id]` |
| **Expected** | Full invoice with line items array, amounts, vendor info |

### FT-040: Update Invoice Status
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/invoices/[id]` |
| **Valid** | `{ status: "approved" }`, `{ status: "paid" }`, `{ status: "disputed" }` |
| **Expected** | Status updated, audit trail entry created |

### FT-041: Price Alert Detection
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices/price-alerts` |
| **Expected** | Items where vendor price changed >15% from last invoice |

### FT-042: Invoice Aging
| Field | Detail |
|-------|--------|
| **API** | `GET /api/invoices/aging` |
| **Expected** | Grouped: current, 1-30d, 31-60d, 61-90d, 90+d overdue |

## B9. Vendor Functions

### FT-043: List Vendors
| Field | Detail |
|-------|--------|
| **API** | `GET /api/vendors` |
| **Expected** | Vendors with: name, contact_name, email, phone, location |

### FT-044: Create Vendor
| Field | Detail |
|-------|--------|
| **API** | `POST /api/vendors` |
| **Valid** | `{ location_id, name: "Fresh Farm", contact_name: "Bob", contact_email: "bob@farm.com" }` |
| **Expected** | Vendor created with ID |
| **Negative** | Missing name → error |

### FT-045: Update Vendor
| Field | Detail |
|-------|--------|
| **API** | `PUT /api/vendors/[id]` |
| **Input** | `{ contact_email: "new@email.com", phone: "555-1234" }` |
| **Expected** | Contact info updated |

### FT-046: Delete Vendor
| Field | Detail |
|-------|--------|
| **API** | `DELETE /api/vendors/[id]` |
| **Expected** | Vendor removed |
| **Negative** | Vendor with active invoices → warning or prevent |

## B10. Inventory Functions

### FT-047: List Inventory
| Field | Detail |
|-------|--------|
| **API** | `GET /api/inventory` |
| **Expected** | Items with: name, quantity, unit, par_level, category, expiry_date |

### FT-048: Update Inventory Item
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/inventory/[id]` |
| **Input** | `{ quantity: 25, par_level: 30 }` |
| **Expected** | Quantity updated |

### FT-049: Inventory Alerts
| Field | Detail |
|-------|--------|
| **API** | `GET /api/inventory/alerts` |
| **Expected** | `{ below_par: [...], expiring: [...], out_of_stock: [...] }` |

### FT-050: Physical Count
| Field | Detail |
|-------|--------|
| **API** | `POST /api/inventory/count` |
| **Valid** | `{ item_id, counted_qty: 15, counted_by: "Manager" }` |
| **Expected** | Count recorded, variance = system_qty - counted_qty |

### FT-051: Purchase Order CRUD
| Field | Detail |
|-------|--------|
| **Create** | `POST /api/purchase-orders` → `{ vendor_id, items: [...], estimated_total }` |
| **Read** | `GET /api/purchase-orders` → list with status |
| **Update** | `PATCH /api/purchase-orders/[id]` → `{ status: "approved" }` |

## B11. Waste Functions

### FT-052: Log Waste Entry
| Field | Detail |
|-------|--------|
| **API** | `POST /api/waste` |
| **Valid** | `{ location_id, item_name: "Lettuce", quantity: 5, unit: "lbs", reason: "expired", cost: 12.50 }` |
| **Negative** | Missing item_name → error, negative cost → error |

### FT-053: Waste Dashboard
| Field | Detail |
|-------|--------|
| **API** | `GET /api/waste/dashboard` |
| **Expected** | `{ total_cost, total_items, top_wasted, waste_pct_of_food_cost }` |

### FT-054: Prep Targets
| Field | Detail |
|-------|--------|
| **API** | `GET /api/waste/prep-targets` |
| **Expected** | AI-adjusted prep quantities per item per day of week |

### FT-055: Waste Reports
| Field | Detail |
|-------|--------|
| **API** | `GET /api/waste/reports` |
| **Expected** | Weekly summaries with trends, $ impact, suggestions |

## B12. Financial Functions

### FT-056: Financial Summary
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/summary` |
| **Expected** | `{ total_revenue, food_cost_pct, labor_cost_pct, net_profit, margin }` |

### FT-057: Daily Financial Entry
| Field | Detail |
|-------|--------|
| **API** | `POST /api/financials/daily` |
| **Valid** | `{ location_id, date: "2026-04-03", revenue: 5000, food_cost: 1500, labor_cost: 1200 }` |
| **Expected** | Saved, `net_profit` = 5000 - 1500 - 1200 = 2300, `food_cost_pct` = 30% |

### FT-058: Expense Tracking
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/expenses`, `POST /api/financials/expenses` |
| **Expected** | Expenses by category with monthly totals vs budgets |

### FT-059: Financial Forecast
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/forecast` |
| **Expected** | 30/60/90 day projections based on historical trends |

### FT-060: Expense Categories
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/categories` |
| **Expected** | Categories with: name, monthly_budget |

### FT-061: Financial Alerts
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/alerts` |
| **Expected** | Alerts for: food cost >35%, labor >30%, margin <5% |

### FT-062: Financial Reports
| Field | Detail |
|-------|--------|
| **API** | `GET /api/financials/reports` |
| **Expected** | P&L reports for selected date ranges |

## B13. Campaign & Review Functions

### FT-063: List Campaigns
| Field | Detail |
|-------|--------|
| **API** | `GET /api/campaigns` |
| **Expected** | Campaigns with: name, type, status, channel, reach, engagement |

### FT-064: Create Campaign
| Field | Detail |
|-------|--------|
| **API** | `POST /api/campaigns` |
| **Valid** | `{ location_id, name: "Taco Tuesday", type: "social", content: "...", channel: "instagram" }` |

### FT-065: Update Campaign
| Field | Detail |
|-------|--------|
| **API** | `PUT /api/campaigns` |
| **Input** | `{ id, status: "active", scheduled_at: "2026-04-05T12:00:00Z" }` |

### FT-066: List Reviews
| Field | Detail |
|-------|--------|
| **API** | `GET /api/reviews` |
| **Expected** | Reviews with: platform, rating, text, sentiment, ai_response |

### FT-067: Respond to Review
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/reviews/[id]` |
| **Input** | `{ response_status: "responded", ai_response: "Thank you for..." }` |

## B14. Approval Functions

### FT-068: List Approvals
| Field | Detail |
|-------|--------|
| **API** | `GET /api/approvals` (from approval_queue) |
| **Expected** | Pending items with: type, payload, location, created_at |

### FT-069: Approve Item
| Field | Detail |
|-------|--------|
| **API** | `PATCH /api/approvals/[id]` |
| **Input** | `{ status: "approved", approved_by: "Manager" }` |
| **Expected** | Status updated, action executed |

### FT-070: Reject Item
| Field | Detail |
|-------|--------|
| **Input** | `{ status: "rejected", reject_reason: "Budget exceeded" }` |
| **Expected** | Status updated, item removed from active queue |

## B15. Export & Audit Functions

### FT-071: CSV Export — Employees
| Field | Detail |
|-------|--------|
| **API** | `GET /api/export/employees` |
| **Expected** | CSV file with headers: name, email, phone, role, location, hire_date |

### FT-072: CSV Export — Candidates
| Field | Detail |
|-------|--------|
| **API** | `GET /api/export/candidates` |
| **Expected** | CSV with: name, role, score, status, applied_date |

### FT-073: CSV Export — Temp Logs
| Field | Detail |
|-------|--------|
| **API** | `GET /api/export/temp_logs` |
| **Expected** | CSV with: location, equipment, temperature, status, recorded_at |

### FT-074: CSV Export — Events
| Field | Detail |
|-------|--------|
| **API** | `GET /api/export/events` |
| **Expected** | CSV with: agent_type, event_type, severity, description, created_at |

### FT-075: Audit Trail
| Field | Detail |
|-------|--------|
| **API** | `GET /api/audit` |
| **Expected** | All actions with: user, action, resource, timestamp, metadata |

## B16. Notification & Staffing Functions

### FT-076: Notification Preferences
| Field | Detail |
|-------|--------|
| **API** | `GET /api/notifications/preferences` |
| **Expected** | Per-location prefs: sms_enabled, email_enabled, severity thresholds |

### FT-077: Staffing Targets
| Field | Detail |
|-------|--------|
| **API** | `GET /api/staffing-targets` |
| **Expected** | Per-location/role: target_count, min_count, current count |

### FT-078: Employee List
| Field | Detail |
|-------|--------|
| **API** | `GET /api/employees` |
| **Filters** | `?location_id=xxx`, `?role=cook` |
| **Expected** | Employees with: name, email, phone, role, location, status |

## B17. Stripe Billing Functions

### FT-079: Checkout Session
| Field | Detail |
|-------|--------|
| **API** | `POST /api/stripe/checkout` |
| **Input** | `{ price_id: "price_xxx", success_url, cancel_url }` |
| **Expected** | Stripe checkout URL returned |

### FT-080: Customer Portal
| Field | Detail |
|-------|--------|
| **API** | `POST /api/stripe/portal` |
| **Expected** | Stripe billing portal URL returned |

### FT-081: Webhook Processing
| Field | Detail |
|-------|--------|
| **API** | `POST /api/stripe/webhook` |
| **Expected** | Processes: checkout.session.completed, subscription events |

## B18. Onboarding & Location Functions

### FT-082: Create Organization
| Field | Detail |
|-------|--------|
| **API** | `POST /api/onboarding/create-org` |
| **Input** | `{ name: "My Restaurant", type: "restaurant" }` |

### FT-083: Add Location
| Field | Detail |
|-------|--------|
| **API** | `POST /api/onboarding/add-location` |
| **Input** | `{ org_id, name, address, phone, email }` |

### FT-084: Setup Agents
| Field | Detail |
|-------|--------|
| **API** | `POST /api/onboarding/setup-agents` |
| **Expected** | Default agent config created for location |

**Functional Test Total: 84 tests**

---

# PART C: END-TO-END TEST CASES
*Complete user journeys crossing multiple features*

## E2E-001: New Restaurant Onboarding → First Agent Run (P0)
| # | Action | Expected |
|---|--------|----------|
| 1 | Navigate to `/` | Landing page loads |
| 2 | Click Get Started → `/login` | Login page |
| 3 | Sign up with email/password | Account created → `/dashboard` |
| 4 | Check Command Center | Stats visible, empty agent activity |
| 5 | Go to Settings | 14 agents listed |
| 6 | Click "Run All 14 Agents" | JSON with 14 agent results |
| 7 | Return to `/dashboard` | New agent events in feed |
| 8 | Check `/dashboard/events` | Full event log |

## E2E-002: Food Safety Violation → Alert → Resolution (P0)
| # | Action | Expected |
|---|--------|----------|
| 1 | Go to `/dashboard/safety` | Safety dashboard loads |
| 2 | POST temp log: 50°F for Walk-In Cooler | Violation status |
| 3 | Trigger `/api/cron/check-temps` | Agent detects violation |
| 4 | Check SMS | Cook receives alert SMS |
| 5 | Check `/dashboard/safety` | Red violation badge |
| 6 | Check `/dashboard/events` | "temp_violation" event |
| 7 | Check corrective actions | Auto-created action with due date |
| 8 | Resolve corrective action | Status → resolved |
| 9 | Re-trigger check-temps | No new overdue events |

## E2E-003: Hiring Pipeline → Offer → Onboarding (P0)
| # | Action | Expected |
|---|--------|----------|
| 1 | Go to `/dashboard/hiring` | Pipeline visible |
| 2 | Check staffing bars | Understaffed roles highlighted |
| 3 | Trigger `/api/cron/screen-candidates` | AI scores candidates |
| 4 | Check candidate table | AI scores visible |
| 5 | Advance top candidate → Interview | Status updates |
| 6 | Advance → Offered | Offer letter generated |
| 7 | Open `/offer/[candidateId]` | Offer page with signature |
| 8 | Sign + Accept | Candidate → hired |
| 9 | Check store detail | New employee reflected |

## E2E-004: Invoice → Price Alert → Vendor Tracking (P1)
| # | Action | Expected |
|---|--------|----------|
| 1 | Go to `/dashboard/invoices/upload` | Upload form |
| 2 | Upload invoice | Parsed and saved |
| 3 | Check invoice list | New invoice "pending" |
| 4 | Open invoice detail | Line items visible |
| 5 | Approve invoice | Status → approved |
| 6 | Trigger check-invoices | Price anomalies detected |
| 7 | Check price alerts | Alerts visible |
| 8 | Check vendor page | Invoice history |
| 9 | Check audit log | Approval action logged |

## E2E-005: Inventory Alert → Purchase Order → Restock (P1)
| # | Action | Expected |
|---|--------|----------|
| 1 | Go to `/dashboard/inventory` | Items with par levels |
| 2 | Trigger check-inventory | Below-par detected |
| 3 | Check alerts | Below-par items listed |
| 4 | Check purchase orders | Suggested POs |
| 5 | Approve PO | Status → approved |
| 6 | Enter physical count | Updated quantity |
| 7 | Check item | No longer below par |
| 8 | Check events | Inventory agent events |

## E2E-006: Daily Operations Cycle (P0)
| # | Action | Expected |
|---|--------|----------|
| 1 | Start opening checklist | Checklist begins |
| 2 | Complete all items | 100% completion |
| 3 | Submit checklist | Logged in history |
| 4 | Log temp readings | All within range = green |
| 5 | Receive/process orders | Queue management works |
| 6 | Update orders → completed | Status progression |
| 7 | Log waste item | Entry saved |
| 8 | Start closing checklist | Checklist begins |
| 9 | Complete + handoff notes | Notes saved |
| 10 | Check daily financials | Today's P&L visible |
| 11 | Trigger daily summary | Summary generated |

## E2E-007: Multi-Store Regional Overview (P0)
| # | Action | Expected |
|---|--------|----------|
| 1 | Go to `/dashboard` | Aggregate stats |
| 2 | Go to stores | All 30 stores visible |
| 3 | Sort by status | Critical stores first |
| 4 | Drill into worst store | Detail page with issues |
| 5 | Check financials | Cross-store P&L |
| 6 | Check events | Events from all stores |
| 7 | Check approvals | All-store approval queue |
| 8 | Export employees CSV | Download works |

## E2E-008: Waste Reduction Cycle (P1)
| # | Action | Expected |
|---|--------|----------|
| 1 | Log 5+ waste entries | Entries saved |
| 2 | Trigger check-waste | Agent analyzes |
| 3 | Check waste dashboard | Top wasted items, cost |
| 4 | Check prep targets | AI-adjusted quantities |
| 5 | Check waste reports | Weekly trends |
| 6 | Check events | Waste agent events |

## E2E-009: Financial Health Monitoring (P1)
| # | Action | Expected |
|---|--------|----------|
| 1 | Check daily financials | P&L entries |
| 2 | Check expenses | By category |
| 3 | Check forecast | Projections |
| 4 | Generate report | P&L report |
| 5 | Check overview | Food/labor cost % |
| 6 | Trigger check-financials | Threshold checks |
| 7 | Check alerts | Alert if cost too high |

## E2E-010: Cross-Product AI Intelligence (P2)
| # | Action | Expected |
|---|--------|----------|
| 1 | Trigger run-all | 14 agents execute |
| 2 | Check cross_product results | Safety↔staffing correlations |
| 3 | Check training gaps | Certs + understaffing = recommendations |
| 4 | Check high-risk stores | Multi-issue stores flagged |
| 5 | Check weekly insights | AI summary |
| 6 | Filter events by cross_product | Events visible |

**E2E Total: 10 journeys, 81 steps**

---

# PART D: USER ACCEPTANCE TESTING

## UAT Scenarios

### UAT-001: Restaurant Owner Morning Routine (P0)
*"I open the app each morning to see what needs my attention"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | Log in via Google | Land on Command Center | ☐ |
| 2 | Glance at stat cards | Location count, expiring certs, open actions, approvals | ☐ |
| 3 | Scan agent activity | Last 24h of AI actions with severity colors | ☐ |
| 4 | Handle any approvals | Approve/reject with one click | ☐ |
| 5 | Check worst store | Click through to see specific issues | ☐ |
| 6 | Check today's money | Revenue, costs, profit for today | ☐ |
| 7 | Review hiring needs | Who needs interviews, any new applicants | ☐ |

### UAT-002: Food Safety Compliance (P0)
*"I need to pass health inspections and keep customers safe"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | Check safety dashboard | Temp logs, certs, corrective actions all in one place | ☐ |
| 2 | See if any temps missed | Missed logs highlighted with who was responsible | ☐ |
| 3 | Check for violations | Out-of-range temps shown in RED immediately | ☐ |
| 4 | Check expiring certs | Know who needs renewal before they expire | ☐ |
| 5 | Review open actions | Due dates and assignees clear | ☐ |
| 6 | Get SMS if critical | Phone buzzes when something needs immediate attention | ☐ |
| 7 | Resolve an action | Mark done, add what I did, timestamp recorded | ☐ |

### UAT-003: Hiring Manager Workflow (P0)
*"I need to fill positions fast when we're short-staffed"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | See hiring pipeline | Visual funnel of all candidates by stage | ☐ |
| 2 | Check AI-scored candidates | Each candidate rated 1-10 so I know who to call first | ☐ |
| 3 | Move candidate forward | One click to advance through stages | ☐ |
| 4 | Send offer | Offer letter auto-generated with our details | ☐ |
| 5 | Candidate signs digitally | They open a link, sign on phone, we're done | ☐ |
| 6 | See updated headcount | New hire reflects in staffing numbers | ☐ |

### UAT-004: Regional Manager 30-Store View (P0)
*"I manage 30 stores and need to know which ones need help"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | See all stores at once | Grid with status badges — red/yellow/green | ☐ |
| 2 | Find the problem stores | Critical stores obvious, sorted to top | ☐ |
| 3 | Drill into a store | Full detail: employees, safety, staffing, financials | ☐ |
| 4 | Compare financials | See P&L across all stores | ☐ |
| 5 | Export data | Download CSV for my weekly report | ☐ |
| 6 | See AI insights | Cross-store patterns I wouldn't catch manually | ☐ |

### UAT-005: Shift Manager Order Flow (P0)
*"During rush hour, I need to track every order"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | See active orders | All current orders in a queue | ☐ |
| 2 | Create phone order | Quick form, order in queue immediately | ☐ |
| 3 | Update status | New → Preparing → Ready → Done, one click each | ☐ |
| 4 | Handle a problem | Report wrong item, log the issue | ☐ |
| 5 | See today's stats | Total orders, avg time, busiest hours | ☐ |
| 6 | Review past orders | Search/filter completed orders | ☐ |

### UAT-006: Kitchen Manager Inventory (P1)
*"I need to know what's running low before we run out"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | See all inventory | Items with current qty vs par level | ☐ |
| 2 | Get alerts | Below-par items automatically flagged | ☐ |
| 3 | Do physical count | Enter actual counts, see variance | ☐ |
| 4 | Check orders | See pending purchase orders | ☐ |
| 5 | Track expiring items | Know what to use first | ☐ |

### UAT-007: Owner Financial Picture (P1)
*"Am I making money? Where is it going?"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | See today's P&L | Revenue - costs = profit, right there | ☐ |
| 2 | Check food cost % | Know if I'm over 35% (industry target) | ☐ |
| 3 | Review expenses | Where my money goes, by category | ☐ |
| 4 | See forecast | Next 30 days projected revenue | ☐ |
| 5 | Get a report | P&L report I can print or share | ☐ |
| 6 | Get alerts | Automatic warning if costs spike | ☐ |

### UAT-008: Invoice & Vendor Management (P1)
*"I don't want to overpay vendors"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | See all invoices | List with vendor, amount, status, due date | ☐ |
| 2 | Review invoice detail | Every line item, prices, quantities | ☐ |
| 3 | Approve/dispute | One click to approve or flag a problem | ☐ |
| 4 | Catch price increases | Alert if a vendor raised prices >15% | ☐ |
| 5 | Track vendor performance | See each vendor's invoice history | ☐ |

### UAT-009: Waste Reduction (P1)
*"Food waste is killing my margins"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | Log waste easily | Quick form: what, how much, why | ☐ |
| 2 | See waste dashboard | Total waste cost, top wasted items | ☐ |
| 3 | Get prep guidance | AI tells me how much to prep per day | ☐ |
| 4 | Track improvement | Weekly reports showing trends | ☐ |

### UAT-010: Shift Checklist Compliance (P1)
*"Every shift needs to complete their checklist"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | Pick my checklist | Opening, closing, or safety | ☐ |
| 2 | Check items off | Progress bar fills up | ☐ |
| 3 | Add handoff notes | Leave message for next shift | ☐ |
| 4 | Submit when done | Completion logged with timestamp | ☐ |
| 5 | Review history | See who completed what, when | ☐ |

### UAT-011: AI Agents Working For Me (P0)
*"The AI should catch problems before I do"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | Check agent activity | See what all 14 agents found today | ☐ |
| 2 | Get SMS for critical issues | Phone buzzes for violations, expired certs | ☐ |
| 3 | Get email for warnings | Inbox has expiring cert notices, understaffing | ☐ |
| 4 | See cross-store patterns | AI connects dots I can't see manually | ☐ |
| 5 | Run agents manually | "Run All 14 Agents" button works | ☐ |
| 6 | Filter by agent | See what each specific agent found | ☐ |
| 7 | Filter by severity | See only critical, or only warnings | ☐ |
| 8 | Trust the data | Events have correct timestamps, locations, details | ☐ |

### UAT-012: Billing & Subscription (P2)
*"I want to subscribe and manage my plan"*

| # | I do this... | I expect... | ☐ |
|---|-------------|-------------|---|
| 1 | See pricing | Starter $49, Pro $149, Enterprise $499 | ☐ |
| 2 | Click subscribe | Stripe checkout opens | ☐ |
| 3 | Complete payment | Subscription active, back to dashboard | ☐ |
| 4 | Manage billing | Stripe portal for upgrades/cancellation | ☐ |

**UAT Total: 12 scenarios, 68 steps**

---

# PART E: API CONTRACT TESTS
*Verify all 88 API endpoints respond correctly*

## Health & System
| # | Method | Endpoint | Expected Status | Expected Body |
|---|--------|----------|----------------|---------------|
| 1 | GET | `/api/health` | 200 | `{ status: "healthy", checks: [...] }` |
| 2 | GET | `/api/audit` | 200 | Array of audit entries |
| 3 | GET | `/api/dashboard/stats` | 200 | `{ locations, certs, actions, approvals }` |

## Orders (6 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 4 | GET | `/api/orders` | 200 — order list |
| 5 | POST | `/api/orders` | 200 — created order |
| 6 | PATCH | `/api/orders/[id]` | 200 — updated order |
| 7 | GET | `/api/orders/queue` | 200 — active orders only |
| 8 | GET | `/api/orders/analytics` | 200 — stats object |
| 9 | GET | `/api/orders/issues` | 200 — issues list |

## Menu (3 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 10 | GET | `/api/menu` | 200 — items list |
| 11 | POST | `/api/menu` | 200 — created item |
| 12 | PATCH | `/api/menu/[id]` | 200 — updated item |

## Checklists (7 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 13 | GET | `/api/checklists/templates` | 200 — templates |
| 14 | POST | `/api/checklists/templates` | 200 — created |
| 15 | GET | `/api/checklists/templates/[id]` | 200 — single template |
| 16 | POST | `/api/checklists/start` | 200 — started |
| 17 | PATCH | `/api/checklists/[id]` | 200 — updated |
| 18 | GET | `/api/checklists/history` | 200 — history |
| 19 | POST | `/api/checklists/handoff` | 200 — handoff saved |

## Food Safety (4 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 20 | GET | `/api/temp-logs` | 200 — logs |
| 21 | POST | `/api/temp-logs` | 200 — created |
| 22 | GET | `/api/temp-log-schedules` | 200 — schedules |
| 23 | PATCH | `/api/corrective-actions/[id]` | 200 — updated |

## Hiring (6 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 24 | GET | `/api/candidates/[id]` | 200 — candidate |
| 25 | PATCH | `/api/candidates/[id]` | 200 — updated |
| 26 | GET | `/api/jobs/[id]` | 200 — job posting |
| 27 | PATCH | `/api/jobs/[id]` | 200 — updated |
| 28 | GET | `/api/offer-letter/[candidateId]` | 200 — HTML |
| 29 | POST | `/api/sms/text-to-apply` | 200 — processed |

## Invoices (5 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 30 | GET | `/api/invoices` | 200 — list |
| 31 | GET | `/api/invoices/[id]` | 200 — detail |
| 32 | PATCH | `/api/invoices/[id]` | 200 — updated |
| 33 | GET | `/api/invoices/aging` | 200 — aging report |
| 34 | GET | `/api/invoices/price-alerts` | 200 — alerts |

## Vendors (3 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 35 | GET | `/api/vendors` | 200 — list |
| 36 | POST | `/api/vendors` | 200 — created |
| 37 | PUT | `/api/vendors/[id]` | 200 — updated |

## Inventory (5 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 38 | GET | `/api/inventory` | 200 — items |
| 39 | PATCH | `/api/inventory/[id]` | 200 — updated |
| 40 | GET | `/api/inventory/alerts` | 200 — alerts |
| 41 | POST | `/api/inventory/count` | 200 — count saved |
| 42 | GET/POST | `/api/purchase-orders` | 200 — POs |

## Waste (4 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 43 | GET | `/api/waste` | 200 — entries |
| 44 | POST | `/api/waste` | 200 — created |
| 45 | GET | `/api/waste/dashboard` | 200 — summary |
| 46 | GET | `/api/waste/prep-targets` | 200 — targets |
| 47 | GET | `/api/waste/reports` | 200 — reports |

## Financials (7 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 48 | GET | `/api/financials/summary` | 200 — summary |
| 49 | GET/POST | `/api/financials/daily` | 200 — daily entries |
| 50 | GET/POST | `/api/financials/expenses` | 200 — expenses |
| 51 | GET | `/api/financials/forecast` | 200 — projections |
| 52 | GET | `/api/financials/categories` | 200 — categories |
| 53 | GET | `/api/financials/alerts` | 200 — alerts |
| 54 | GET | `/api/financials/reports` | 200 — reports |

## Campaigns & Reviews (4 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 55 | GET | `/api/campaigns` | 200 — list |
| 56 | POST | `/api/campaigns` | 200 — created |
| 57 | GET | `/api/reviews` | 200 — list |
| 58 | PATCH | `/api/reviews/[id]` | 200 — updated |

## Employees & Staffing (3 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 59 | GET | `/api/employees` | 200 — list |
| 60 | GET | `/api/staffing-targets` | 200 — targets |
| 61 | GET | `/api/notifications/preferences` | 200 — prefs |

## Agents & Crons (13 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 62 | GET | `/api/agents/run-all` | 200 — `{ agents: 14 }` |
| 63 | GET | `/api/cron/check-temps` | 200 — results |
| 64 | GET | `/api/cron/check-certs` | 200 — results |
| 65 | GET | `/api/cron/check-corrective` | 200 — results |
| 66 | GET | `/api/cron/check-staffing` | 200 — results |
| 67 | GET | `/api/cron/screen-candidates` | 200 — results |
| 68 | GET | `/api/cron/daily-summary` | 200 — results |
| 69 | GET | `/api/cron/check-invoices` | 200 — results |
| 70 | GET | `/api/cron/check-inventory` | 200 — results |
| 71 | GET | `/api/cron/check-orders` | 200 — results |
| 72 | GET | `/api/cron/check-checklists` | 200 — results |
| 73 | GET | `/api/cron/check-waste` | 200 — results |
| 74 | GET | `/api/cron/check-financials` | 200 — results |

## Exports (4 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 75 | GET | `/api/export/employees` | 200 — CSV |
| 76 | GET | `/api/export/candidates` | 200 — CSV |
| 77 | GET | `/api/export/temp_logs` | 200 — CSV |
| 78 | GET | `/api/export/events` | 200 — CSV |

## Stripe (3 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 79 | POST | `/api/stripe/checkout` | 200 — URL |
| 80 | POST | `/api/stripe/portal` | 200 — URL |
| 81 | POST | `/api/stripe/webhook` | 200 — processed |

## Onboarding (4 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 82 | POST | `/api/onboarding/create-org` | 200 — org created |
| 83 | POST | `/api/onboarding/add-location` | 200 — location added |
| 84 | POST | `/api/onboarding/add-manager` | 200 — manager added |
| 85 | POST | `/api/onboarding/setup-agents` | 200 — agents configured |

## Other (3 endpoints)
| # | Method | Endpoint | Expected |
|---|--------|----------|----------|
| 86 | POST | `/api/voice/greeting` | 200 — Twilio TwiML |
| 87 | GET | `/api/reports/regional` | 200 — regional data |
| 88 | POST | `/api/admin/new-signup` | 200 — notification sent |

---

# PART F: AGENT-SPECIFIC TESTS

## For Each of 14 Agents:

### Agent 1: 🛡️ Food Safety
| # | Test | Expected |
|---|------|----------|
| 1 | Missed temp log detection | Events created for schedules without logs |
| 2 | Out-of-range temp detection | Critical event + SMS for violations |
| 3 | Expiring cert detection | Warning events for <30 day certs |
| 4 | Overdue corrective actions | Escalation events for >24h/48h overdue |

### Agent 2: 👥 Hiring
| # | Test | Expected |
|---|------|----------|
| 1 | Understaffing detection | Events when count < target |
| 2 | AI candidate screening | Unscored candidates get scores |
| 3 | Interview follow-up | Events for stale interviews |
| 4 | Offer processing | Events for accepted offers |

### Agent 3: 📊 Staffing
| # | Test | Expected |
|---|------|----------|
| 1 | Busy day prediction | Warnings for predicted understaffing |
| 2 | No-show detection | Chronic pattern identification |

### Agent 4: 💸 Spend Optimizer
| # | Test | Expected |
|---|------|----------|
| 1 | Anomaly detection | Flags unusual spending |
| 2 | Overdue cost tracking | Alerts for mounting costs |

### Agent 5: 📈 Revenue Optimizer
| # | Test | Expected |
|---|------|----------|
| 1 | Weather impact | Recommendations based on forecast |
| 2 | Day patterns | Identifies slow/busy day trends |

### Agent 6: 🔗 Cross-Product
| # | Test | Expected |
|---|------|----------|
| 1 | Safety↔staffing correlation | Connects understaffing to safety issues |
| 2 | Cert↔training gaps | Identifies training needs |
| 3 | High-risk stores | Multi-factor risk scoring |
| 4 | Weekly insights | AI-generated summary |

### Agent 7: 💰 Accountant
| # | Test | Expected |
|---|------|----------|
| 1 | Financial health check | P&L monitoring events |

### Agent 8: 📋 Checklist Manager
| # | Test | Expected |
|---|------|----------|
| 1 | Missed checklist detection | Alerts for incomplete/missed checklists |

### Agent 9: 📦 Inventory
| # | Test | Expected |
|---|------|----------|
| 1 | Below-par detection | Alerts for low stock |
| 2 | Expiring items | Alerts for items near expiry |

### Agent 10: 🧾 Invoice Manager
| # | Test | Expected |
|---|------|----------|
| 1 | Overdue invoice detection | Alerts for unpaid invoices |
| 2 | Price anomaly detection | Flags >15% price changes |

### Agent 11: 📢 Marketing
| # | Test | Expected |
|---|------|----------|
| 1 | Slow day analysis | Promotion suggestions |
| 2 | Campaign tracking | Performance monitoring |

### Agent 12: 📞 Order Manager
| # | Test | Expected |
|---|------|----------|
| 1 | Stale order detection | Alerts for stuck orders |

### Agent 13: ⭐ Review Manager
| # | Test | Expected |
|---|------|----------|
| 1 | Negative review detection | Alerts for <3 star reviews |
| 2 | AI response generation | Auto-generated response suggestions |

### Agent 14: 🗑️ Waste Manager
| # | Test | Expected |
|---|------|----------|
| 1 | High waste detection | Alerts for excessive waste |
| 2 | Trend analysis | Identifies waste patterns |

**Agent Tests Total: 42 tests**

---

# PART G: NOTIFICATION TESTS

| # | Test | Trigger | Channel | Expected |
|---|------|---------|---------|----------|
| 1 | Critical SMS | Temp violation | Twilio SMS | Cook receives "⚠️ Walk-In Cooler: 50°F" |
| 2 | Warning SMS | Understaffing | Twilio SMS | Manager receives staffing alert |
| 3 | Cert expiry email | Cert <30 days | Resend Email | Employee gets HTML email |
| 4 | Expired cert SMS | Cert expired | Twilio SMS | Manager gets "🚨 EXPIRED" |
| 5 | Interview SMS | Candidate advanced | Twilio SMS | Candidate gets invite |
| 6 | Corrective action escalation | >48h overdue | Twilio SMS | Manager gets escalation |
| 7 | Email from correct address | Any email | Resend | From: hello@vertexlabsolutions.com |
| 8 | SMS from correct number | Any SMS | Twilio | From: +14788007647 |

---

# PART H: SECURITY TESTS

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1 | Auth guard on dashboard | Hit `/dashboard` without login | 302 → `/login` |
| 2 | API routes accessible | Hit `/api/health` without login | 200 (public) |
| 3 | Service role key hidden | Check browser network tab | Key not exposed to client |
| 4 | CORS headers | Check response headers | Appropriate CORS policy |
| 5 | SQL injection | Pass `'; DROP TABLE --` in inputs | No SQL execution, input sanitized |
| 6 | XSS prevention | Enter `<script>alert(1)</script>` in fields | Script not executed |
| 7 | Rate limiting | Hit text-to-apply 100x rapidly | Rate limited after threshold |
| 8 | Cron secret protection | Hit cron without CRON_SECRET | 401 (if configured) |
| 9 | RLS enforcement | Query Supabase with anon key | Only permitted rows returned |
| 10 | Sensitive data in logs | Check Vercel function logs | No passwords/keys logged |
| 11 | HTTPS enforcement | Try HTTP URL | Redirect to HTTPS |
| 12 | Session expiry | Leave idle 24h | Require re-login |

---

# PART I: PERFORMANCE TESTS

| # | Test | Metric | Target |
|---|------|--------|--------|
| 1 | Dashboard load | Time to interactive | <3 seconds |
| 2 | Store grid (30 stores) | Render time | <2 seconds |
| 3 | API response time | `/api/dashboard/stats` | <1 second |
| 4 | Run all 14 agents | Total execution | <60 seconds |
| 5 | CSV export (76 employees) | Download time | <2 seconds |
| 6 | Health check | All 10 checks | <15 seconds |
| 7 | Page bundle size | First load JS | <200KB |
| 8 | Mobile performance | Lighthouse score | >70 |

---

# PART J: CROSS-BROWSER & RESPONSIVE TESTS

| # | Browser/Device | Tests |
|---|---------------|-------|
| 1 | Chrome (Desktop) | All pages load, no console errors |
| 2 | Safari (Desktop) | All pages load, no layout breaks |
| 3 | Firefox (Desktop) | All pages load, forms work |
| 4 | Chrome (Android) | Mobile nav, touch targets, scrolling |
| 5 | Safari (iPhone) | Mobile nav, touch targets, scrolling |
| 6 | iPad | Tablet layout, sidebar behavior |
| 7 | 375px width | Cards stack, no horizontal overflow |
| 8 | 768px width | Grid adapts, sidebar collapses |
| 9 | 1920px width | Full layout, sidebar visible |
| 10 | Dark mode consistency | All pages use dark theme consistently |
| 11 | Font rendering | Text readable at all sizes |
| 12 | Touch interactions | Buttons/links have adequate tap targets (>44px) |

---

# DEFECT MANAGEMENT

## Severity Levels
| Level | Definition | SLA |
|-------|-----------|-----|
| **Critical** | System unusable, data loss, security | Fix within 4 hours |
| **High** | Major feature broken, no workaround | Fix within 24 hours |
| **Medium** | Feature partially broken, workaround exists | Fix within 3 days |
| **Low** | Cosmetic, minor UX | Fix in next sprint |

## Bug Report Template
```
Bug ID: BUG-XXX
Test ID: [QA-XXX / FT-XXX / E2E-XXX / UAT-XXX]
Severity: Critical / High / Medium / Low
Summary: One-line description

Steps to Reproduce:
1. Go to [URL]
2. Click [element]
3. Enter [data]

Expected: What should happen
Actual: What actually happened

Browser: Chrome 120 / Safari 18 / etc.
Device: Desktop / iPhone 15 / etc.
Screenshot: [attach]
Console Errors: [paste if any]
```

---

# SIGN-OFF

## Test Execution Summary
| Part | Total Tests | Passed | Failed | Blocked | Not Run |
|------|-----------|--------|--------|---------|---------|
| A. QA Checklist | 92 | | | | |
| B. Functional | 84 | | | | |
| C. E2E Journeys | 81 steps | | | | |
| D. UAT Scenarios | 68 steps | | | | |
| E. API Contracts | 88 | | | | |
| F. Agent Tests | 42 | | | | |
| G. Notifications | 8 | | | | |
| H. Security | 12 | | | | |
| I. Performance | 8 | | | | |
| J. Cross-Browser | 12 | | | | |
| **TOTAL** | **~495** | | | | |

## Approval

| Role | Name | Date | Status | Signature |
|------|------|------|--------|-----------|
| QA Lead | Max | April 3, 2026 | ✅ Prepared | _________ |
| Product Owner | Hasan | _________ | ☐ Pending | _________ |
| Dev Lead | — | _________ | ☐ Pending | _________ |

### Release Criteria
- [ ] All P0 tests PASS
- [ ] All P1 tests PASS (or accepted with known issues documented)
- [ ] No Critical or High bugs open
- [ ] Performance targets met (<3s page load)
- [ ] SMS and Email notifications confirmed
- [ ] Mobile responsive confirmed
- [ ] Product owner sign-off received

**Release Decision:** ☐ GO / ☐ CONDITIONAL GO / ☐ NO-GO

---

*Vertex Autopilot v1.0 — Master Test Document*
*~495 test cases across 10 categories*
*Generated: April 3, 2026*
