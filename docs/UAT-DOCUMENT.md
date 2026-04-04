# Vertex Autopilot — User Acceptance Testing (UAT) Document
**Product:** Vertex Autopilot — AI Restaurant Operations Platform
**Version:** 1.0
**Date:** April 3, 2026
**Prepared by:** Max (QA Architect)
**UAT Owner:** Hasan (Product Owner)

---

## 1. UAT Overview

### Purpose
Validate that Vertex Autopilot meets all business requirements and is ready for production use by restaurant operators and regional managers.

### Scope
- All 14 AI agents functioning correctly
- All 39 dashboard pages rendering with real data
- All 88 API endpoints responding correctly
- SMS/Email notifications delivering
- Stripe billing flow working
- Multi-store monitoring operational

### Entry Criteria
- ✅ All unit/functional tests passed
- ✅ E2E test cases executed
- ✅ Build deploys successfully to Vercel
- ✅ Health check: 10/10 passing
- ✅ All database tables created and seeded

### Exit Criteria
- All P0 scenarios pass
- No critical/high severity bugs open
- Product owner (Hasan) signs off
- Performance acceptable (<3s page load)

---

## 2. UAT Environment

| Item | Detail |
|------|--------|
| **URL** | https://app-khaki-pi-37.vercel.app |
| **Login** | Google OAuth or email/password |
| **Database** | Supabase (iatdvwzenpjrwwotlewg) |
| **Test Data** | 30 IHOP locations, 76 employees, 40 certs, 50 staffing targets |
| **Integrations** | Twilio SMS ✅, Resend Email ✅, Stripe ✅, Weather API ✅ |
| **Browser** | Chrome (latest), Safari, Mobile Chrome/Safari |

---

## 3. UAT Scenarios

### UAT-001: Restaurant Owner Daily Workflow ⭐ P0
**As a** restaurant owner/manager
**I want to** open my dashboard each morning and see what needs my attention
**So that** I can run my restaurant efficiently without missing critical issues

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Log in via Google | Land on Command Center | ☐ | |
| 2 | Review stat cards at top | See: total locations, expiring certs, open corrective actions, pending approvals | ☐ | |
| 3 | Scan agent activity feed | See recent AI agent actions with severity colors (red/yellow/blue) | ☐ | |
| 4 | Check if any approvals pending | See approve/reject buttons if items exist | ☐ | |
| 5 | Navigate to worst-performing store | Store detail shows specific issues to address | ☐ | |
| 6 | Check today's financials | Daily revenue, costs, profit visible | ☐ | |
| 7 | Review hiring pipeline | See who needs interviews, offers pending | ☐ | |
| 8 | Log out | Session ends, redirected to login | ☐ | |

**Acceptance:** Owner gets full situational awareness in < 2 minutes.

---

### UAT-002: Food Safety Compliance ⭐ P0
**As a** restaurant manager
**I want to** ensure all food safety requirements are met
**So that** we pass health inspections and keep customers safe

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Food Safety dashboard | See temp logs, certifications, corrective actions | ☐ | |
| 2 | Check temp log schedule | All scheduled readings visible with status | ☐ | |
| 3 | Verify violations are highlighted | Out-of-range temps shown in RED | ☐ | |
| 4 | Check expiring certifications | Employees with certs expiring <30 days listed | ☐ | |
| 5 | Review corrective actions | Open actions have due dates, assignees, descriptions | ☐ | |
| 6 | Verify SMS alerts work | Trigger violation → SMS received by assigned cook | ☐ | |
| 7 | Resolve a corrective action | Mark as resolved → status updates, timestamp set | ☐ | |

**Acceptance:** Manager can track all food safety in one place, gets alerted automatically.

---

### UAT-003: Staff Hiring & Management ⭐ P0
**As a** hiring manager
**I want to** manage the entire hiring pipeline from one screen
**So that** I can fill positions quickly when understaffed

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Hiring dashboard | See pipeline funnel with counts per stage | ☐ | |
| 2 | Review AI-scored candidates | Candidates show scores (1-10) with reasoning | ☐ | |
| 3 | Advance a candidate | Move from "Screened" → "Interviewing" | ☐ | |
| 4 | Send offer | Move to "Offered" → offer letter generated | ☐ | |
| 5 | Test e-signature | Open offer link → draw signature → accept | ☐ | |
| 6 | Verify new hire | Candidate shows as "Hired" in pipeline | ☐ | |

**Acceptance:** Hire from application to onboarding without leaving the platform.

---

### UAT-004: Multi-Store Regional Overview ⭐ P0
**As a** regional manager overseeing 30+ stores
**I want to** see all my stores' health at a glance
**So that** I can focus on the stores that need the most attention

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to All Stores page | Grid of all 30 stores with status badges | ☐ | |
| 2 | Identify critical stores | Red badges on stores with safety/staffing issues | ☐ | |
| 3 | Drill into worst store | Detail page shows all issues, recent events | ☐ | |
| 4 | Check financials across stores | P&L summary shows all-store aggregate | ☐ | |
| 5 | Export employee data | CSV download works with all employees | ☐ | |
| 6 | Review cross-store insights | Agent activity shows patterns across stores | ☐ | |

**Acceptance:** Regional manager monitors 30 stores from one screen.

---

### UAT-005: Order Management ⭐ P0
**As a** shift manager
**I want to** track all incoming orders and their status
**So that** nothing falls through the cracks during rush hours

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Orders page | See active order queue | ☐ | |
| 2 | Create a new order | Fill form → submit → order appears in queue | ☐ | |
| 3 | Update order status | New → Preparing → Ready → Completed | ☐ | |
| 4 | Report an issue | Log wrong item/late order → appears in issues | ☐ | |
| 5 | Check order analytics | See total orders, avg time, orders by channel | ☐ | |
| 6 | Review order history | Past orders searchable and viewable | ☐ | |

**Acceptance:** All orders tracked from creation to completion.

---

### UAT-006: Inventory & Supply Chain ⭐ P1
**As a** kitchen manager
**I want to** know what's running low before we run out
**So that** I can order supplies proactively

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Inventory page | See all items with quantities and par levels | ☐ | |
| 2 | Check alerts | Below-par items highlighted | ☐ | |
| 3 | Do a physical count | Enter counted quantities → variance shown | ☐ | |
| 4 | Review purchase orders | See pending/approved POs | ☐ | |
| 5 | Track expiring items | Items near expiry flagged | ☐ | |

**Acceptance:** Never run out of critical ingredients unexpectedly.

---

### UAT-007: Financial Tracking ⭐ P1
**As a** restaurant owner
**I want to** track daily revenue, costs, and profit
**So that** I know if my restaurant is making money

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Financials overview | See P&L summary, food cost %, labor cost % | ☐ | |
| 2 | Check daily tracker | Today's revenue, costs, net profit visible | ☐ | |
| 3 | Review expenses by category | Expenses grouped: food, labor, utilities, etc. | ☐ | |
| 4 | Check forecast | 30-day revenue projection based on trends | ☐ | |
| 5 | Generate a report | P&L report for selected date range | ☐ | |
| 6 | Check financial alerts | Alert if food cost >35% | ☐ | |

**Acceptance:** Owner has clear financial picture without spreadsheets.

---

### UAT-008: Invoice & Vendor Management ⭐ P1
**As a** restaurant manager
**I want to** manage vendor invoices and catch price increases
**So that** I don't overpay for supplies

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Invoices page | See invoices with status, vendor, amount | ☐ | |
| 2 | View invoice detail | Line items, amounts, vendor info | ☐ | |
| 3 | Approve an invoice | Status changes to "approved" | ☐ | |
| 4 | Check price alerts | See items where price changed >15% | ☐ | |
| 5 | Review vendors | See vendor list with performance metrics | ☐ | |

**Acceptance:** All vendor billing tracked and price increases caught.

---

### UAT-009: Waste Reduction ⭐ P1
**As a** kitchen manager
**I want to** track food waste and reduce it
**So that** we save money and reduce food cost %

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Waste dashboard | See waste summary, top wasted items | ☐ | |
| 2 | Log a waste entry | Enter item, quantity, reason → saved | ☐ | |
| 3 | Check prep targets | AI-adjusted prep quantities visible | ☐ | |
| 4 | View waste report | Weekly summary with $ impact | ☐ | |

**Acceptance:** Waste tracked and prep optimized to reduce food cost.

---

### UAT-010: Checklist Compliance ⭐ P1
**As a** shift lead
**I want to** complete opening/closing checklists
**So that** nothing gets missed during shift transitions

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Start an opening checklist | Select template → checklist begins | ☐ | |
| 2 | Complete items | Check off items → % updates | ☐ | |
| 3 | Submit completed checklist | Status → completed, logged | ☐ | |
| 4 | Add handoff notes | Notes for next shift saved | ☐ | |
| 5 | Review checklist history | Past completions visible with details | ☐ | |

**Acceptance:** Every shift transition documented and trackable.

---

### UAT-011: AI Agent Intelligence ⭐ P0
**As a** restaurant operator
**I want to** AI agents automatically detect and alert me to issues
**So that** problems are caught before they become emergencies

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Run all 14 agents | `/api/agents/run-all` returns results for all 14 | ☐ | |
| 2 | Verify food safety agent | Detects: missed logs, violations, expiring certs, overdue actions | ☐ | |
| 3 | Verify hiring agent | Detects: understaffing, screens candidates, schedules interviews | ☐ | |
| 4 | Verify inventory agent | Detects: below-par, expiring items | ☐ | |
| 5 | Verify cross-product agent | Correlates safety + staffing, identifies high-risk stores | ☐ | |
| 6 | Check event log | All 14 agent types appear in event log | ☐ | |
| 7 | Verify SMS delivery | Critical alerts trigger real SMS | ☐ | |
| 8 | Verify email delivery | Warning/info alerts send emails | ☐ | |

**Acceptance:** AI agents are the "extra manager" that never sleeps.

---

### UAT-012: Billing & Subscription ⭐ P2
**As a** new customer
**I want to** subscribe to a plan and manage billing
**So that** I can start using the platform

| Step | Action | Expected | Pass? | Notes |
|------|--------|----------|-------|-------|
| 1 | Go to Pricing page | See Starter ($49), Pro ($149), Enterprise ($499) | ☐ | |
| 2 | Click "Get Started" on a plan | Stripe checkout opens | ☐ | |
| 3 | Complete payment | Subscription created, redirected to dashboard | ☐ | |
| 4 | Access customer portal | `/api/stripe/portal` → Stripe billing portal | ☐ | |

**Acceptance:** Self-service billing without manual intervention.

---

## 4. Defect Severity Classification

| Severity | Definition | Example |
|----------|-----------|---------|
| **Critical** | System unusable, data loss, security breach | Can't log in, data deleted, auth bypass |
| **High** | Major feature broken, no workaround | Orders page crashes, SMS not sending |
| **Medium** | Feature partially broken, workaround exists | Filter doesn't work but data visible, chart wrong |
| **Low** | Cosmetic, minor UX issue | Alignment off, typo, color slightly wrong |

---

## 5. Defect Report Template

```
**Bug ID:** UAT-BUG-XXX
**Scenario:** UAT-XXX, Step X
**Severity:** Critical / High / Medium / Low
**Summary:** One-line description
**Steps to Reproduce:**
1. ...
2. ...
3. ...
**Expected Result:** What should happen
**Actual Result:** What actually happened
**Screenshot:** (attach if applicable)
**Browser/Device:** Chrome 120 / iPhone 15 / etc.
**Notes:** Additional context
```

---

## 6. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | Hasan | _________ | _________ |
| QA Lead | Max | April 3, 2026 | ✅ |
| Dev Lead | — | _________ | _________ |

### Sign-Off Criteria
- [ ] All P0 scenarios PASS
- [ ] All P1 scenarios PASS (or accepted with known issues)
- [ ] No Critical or High bugs open
- [ ] Performance acceptable (pages load <3s)
- [ ] SMS/Email notifications confirmed working
- [ ] Mobile responsive confirmed

**UAT Status:** ☐ PASS / ☐ CONDITIONAL PASS / ☐ FAIL

---

## 7. Test Execution Tracker

| Scenario | Priority | Tester | Status | Date | Bugs Found |
|----------|----------|--------|--------|------|------------|
| UAT-001: Daily Workflow | P0 | | ☐ Not Started | | |
| UAT-002: Food Safety | P0 | | ☐ Not Started | | |
| UAT-003: Hiring | P0 | | ☐ Not Started | | |
| UAT-004: Multi-Store | P0 | | ☐ Not Started | | |
| UAT-005: Orders | P0 | | ☐ Not Started | | |
| UAT-006: Inventory | P1 | | ☐ Not Started | | |
| UAT-007: Financials | P1 | | ☐ Not Started | | |
| UAT-008: Invoices | P1 | | ☐ Not Started | | |
| UAT-009: Waste | P1 | | ☐ Not Started | | |
| UAT-010: Checklists | P1 | | ☐ Not Started | | |
| UAT-011: AI Agents | P0 | | ☐ Not Started | | |
| UAT-012: Billing | P2 | | ☐ Not Started | | |

---

*Vertex Autopilot v1.0 — UAT Document*
*Generated: April 3, 2026*
