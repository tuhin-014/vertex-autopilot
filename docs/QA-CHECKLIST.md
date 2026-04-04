# Vertex Autopilot — Manual QA Checklist
**URL:** https://app-khaki-pi-37.vercel.app
**Date:** ___________
**Tester:** ___________

---

## 🔑 1. Authentication & Onboarding
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 1.1 | Landing page loads | Go to `/` → See hero, features, CTA | ☐ |
| 1.2 | Login page loads | Go to `/login` → See email/password form + Google button | ☐ |
| 1.3 | Google Sign-In | Click "Continue with Google" → Complete OAuth → Land on `/dashboard` | ☐ |
| 1.4 | Email/Password Sign Up | Enter new email + password → Click "Create Account" → Success | ☐ |
| 1.5 | Email/Password Login | Enter existing email + password → Click "Sign In" → Land on `/dashboard` | ☐ |
| 1.6 | Invalid login error | Enter wrong password → See error message | ☐ |
| 1.7 | Pricing page | Go to `/pricing` → See Starter/Pro/Enterprise plans, "14 Agents" | ☐ |
| 1.8 | Privacy page | Go to `/privacy` → Page loads with content | ☐ |

---

## 🎯 2. Command Center (Dashboard Home)
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 2.1 | Dashboard loads | Go to `/dashboard` → See stats cards, agent activity, approvals | ☐ |
| 2.2 | Stats cards show data | Verify: locations count, expiring certs, open actions, pending approvals | ☐ |
| 2.3 | Agent activity feed | See recent agent events with timestamps, severity badges | ☐ |
| 2.4 | Pending approvals | See approval items (if any) with approve/reject buttons | ☐ |
| 2.5 | Navigation sidebar | All 15 nav items visible: Command Center through Settings | ☐ |
| 2.6 | "14 agents active" | Bottom of sidebar shows green dot + "14 agents active" | ☐ |
| 2.7 | Mobile nav | Resize to mobile → Hamburger menu works, all items accessible | ☐ |

---

## 📍 3. All Stores
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 3.1 | Store grid loads | Go to `/dashboard/stores` → See store cards with safety scores | ☐ |
| 3.2 | Status badges | Cards show Critical/Warning/Healthy status colors | ☐ |
| 3.3 | Staffing bars | Each card shows staffing % progress bars | ☐ |
| 3.4 | Store detail drill-down | Click a store → Go to `/dashboard/stores/[id]` → See full detail | ☐ |
| 3.5 | Store detail sections | Verify: employees, certs, staffing, temp logs, corrective actions, candidates | ☐ |

---

## 📞 4. Orders
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 4.1 | Order queue | Go to `/dashboard/orders` → See active orders list | ☐ |
| 4.2 | New order | Go to `/dashboard/orders/new` → Create an order → Confirm it appears in queue | ☐ |
| 4.3 | Order history | Go to `/dashboard/orders/history` → See completed/cancelled orders | ☐ |
| 4.4 | Order analytics | Go to `/dashboard/orders/analytics` → See charts/stats | ☐ |
| 4.5 | Order issues | Go to `/dashboard/orders/issues` → See reported issues | ☐ |

---

## 🍽️ 5. Menu
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 5.1 | Menu page loads | Go to `/dashboard/menu` → See menu items by category | ☐ |
| 5.2 | Add menu item | Click add → Fill form → Save → Item appears in list | ☐ |
| 5.3 | Edit menu item | Click an item → Modify price/name → Save → Changes reflected | ☐ |
| 5.4 | Toggle availability | Toggle item on/off → Status updates | ☐ |

---

## ✅ 6. Checklists
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 6.1 | Checklists overview | Go to `/dashboard/checklists` → See active checklists | ☐ |
| 6.2 | Templates | Go to `/dashboard/checklists/templates` → See opening/closing/safety templates | ☐ |
| 6.3 | Start checklist | Go to `/dashboard/checklists/start` → Select template → Begin checklist | ☐ |
| 6.4 | Complete checklist | Check off items → See completion % update → Submit | ☐ |
| 6.5 | Checklist detail | Go to `/dashboard/checklists/[id]` → See item-by-item status | ☐ |
| 6.6 | Checklist history | Go to `/dashboard/checklists/history` → See past completions | ☐ |

---

## 🛡️ 7. Food Safety
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 7.1 | Safety dashboard | Go to `/dashboard/safety` → See temp logs, certs, corrective actions | ☐ |
| 7.2 | Temp log entries | Verify temp logs show equipment, temperature, time, status | ☐ |
| 7.3 | Out-of-range highlighting | Temps outside safe range (>41°F cold, <135°F hot) flagged red | ☐ |
| 7.4 | Certifications list | See employee certs with expiry dates, color-coded by urgency | ☐ |
| 7.5 | Corrective actions | See open/resolved corrective actions with due dates | ☐ |

---

## 👥 8. Hiring
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 8.1 | Hiring pipeline | Go to `/dashboard/hiring` → See funnel: Applied→Screened→Interview→Offered→Hired | ☐ |
| 8.2 | Candidate table | See candidates with AI scores, status, role applied | ☐ |
| 8.3 | Candidate actions | Click candidate → See detail, advance/reject buttons | ☐ |
| 8.4 | Job postings | See open positions with location, role, source | ☐ |
| 8.5 | Staffing health | See per-role staffing bars (current vs target) | ☐ |

---

## 💰 9. Invoices
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 9.1 | Invoice list | Go to `/dashboard/invoices` → See invoices with status badges | ☐ |
| 9.2 | Invoice detail | Click invoice → Go to `/dashboard/invoices/[id]` → See line items, total | ☐ |
| 9.3 | Upload invoice | Go to `/dashboard/invoices/upload` → Upload a file → Confirm processing | ☐ |
| 9.4 | Price alerts | Go to `/dashboard/invoices/price-alerts` → See vendor price change alerts | ☐ |
| 9.5 | Invoice actions | Approve/dispute/mark-paid buttons work | ☐ |

---

## 🏢 10. Vendors
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 10.1 | Vendor list | Go to `/dashboard/vendors` → See vendors with contact info | ☐ |
| 10.2 | Add vendor | Click add → Fill form → Save → Vendor appears | ☐ |
| 10.3 | Vendor detail | Click vendor → See invoices, price history, performance | ☐ |

---

## 📦 11. Inventory
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 11.1 | Inventory overview | Go to `/dashboard/inventory` → See items with par levels | ☐ |
| 11.2 | Alerts | Go to `/dashboard/inventory/alerts` → See below-par + expiring items | ☐ |
| 11.3 | Count | Go to `/dashboard/inventory/count` → Enter physical counts | ☐ |
| 11.4 | Purchase orders | Go to `/dashboard/inventory/orders` → See POs with status | ☐ |
| 11.5 | Waste tracking | Go to `/dashboard/inventory/waste` → Log waste items | ☐ |

---

## 🗑️ 12. Waste
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 12.1 | Waste dashboard | Go to `/dashboard/waste` → See waste summary, top wasted items | ☐ |
| 12.2 | Log waste | Go to `/dashboard/waste/log` → Add waste entry → Confirm saved | ☐ |
| 12.3 | Prep targets | Go to `/dashboard/waste/prep` → See AI-suggested prep quantities | ☐ |
| 12.4 | Waste reports | Go to `/dashboard/waste/reports` → See weekly/monthly waste reports | ☐ |

---

## 💵 13. Financials
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 13.1 | Financial overview | Go to `/dashboard/financials` → See P&L summary, food/labor cost % | ☐ |
| 13.2 | Daily tracker | Go to `/dashboard/financials/daily` → See daily revenue, costs, profit | ☐ |
| 13.3 | Expenses | Go to `/dashboard/financials/expenses` → See expense list by category | ☐ |
| 13.4 | Forecast | Go to `/dashboard/financials/forecast` → See projected revenue/costs | ☐ |
| 13.5 | Reports | Go to `/dashboard/financials/reports` → Generate/view financial reports | ☐ |

---

## 📋 14. Agent Activity
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 14.1 | Event log | Go to `/dashboard/events` → See all agent events with filters | ☐ |
| 14.2 | Filter by agent | Filter by agent type → Only those events shown | ☐ |
| 14.3 | Filter by severity | Filter by critical/warning/info → Correct events shown | ☐ |
| 14.4 | Event detail | Click event → See full description, metadata, action taken | ☐ |

---

## 🔔 15. Approvals
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 15.1 | Approval queue | Go to `/dashboard/approvals` → See pending approvals | ☐ |
| 15.2 | Approve action | Click Approve → Status changes, item removed from queue | ☐ |
| 15.3 | Reject action | Click Reject → Status changes, item removed from queue | ☐ |

---

## ⚙️ 16. Settings
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 16.1 | Settings page | Go to `/dashboard/settings` → See all 14 agents listed | ☐ |
| 16.2 | Agent toggle | Toggle agent on/off → Status updates | ☐ |
| 16.3 | Run all agents | Click "▶ Run All 14 Agents" → Opens API response with results | ☐ |
| 16.4 | Notification prefs | See SMS/Email notification toggle per severity | ☐ |
| 16.5 | Integration status | See Twilio, Resend, Stripe connection status | ☐ |

---

## 📱 17. QR Codes
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 17.1 | QR page | Go to `/dashboard/qrcodes` → See QR codes for temp logging | ☐ |
| 17.2 | QR functionality | Scan QR → Opens temp log form for that equipment/location | ☐ |

---

## 🔗 18. API & Integrations
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 18.1 | Health check | Go to `/api/health` → All 10 checks pass (green) | ☐ |
| 18.2 | Run all agents | Go to `/api/agents/run-all` → Returns JSON with 14 agent results | ☐ |
| 18.3 | CSV export | Go to `/api/export/employees` → Downloads CSV file | ☐ |
| 18.4 | Audit log | Go to `/api/audit` → Returns audit trail entries | ☐ |

---

## 📱 19. Responsive Design
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 19.1 | Mobile layout | View on phone-width → Hamburger nav, stacked cards, no overflow | ☐ |
| 19.2 | Tablet layout | View on tablet-width → Proper grid, sidebar may collapse | ☐ |
| 19.3 | Desktop layout | Full width → Sidebar visible, multi-column grids | ☐ |

---

## 🚨 20. Edge Cases
| # | Test | Steps | Pass? |
|---|------|-------|-------|
| 20.1 | Empty state | New location with no data → Graceful empty states, no crashes | ☐ |
| 20.2 | Unauthorized access | Open `/dashboard` while logged out → Redirect to `/login` | ☐ |
| 20.3 | 404 page | Go to `/dashboard/nonexistent` → Graceful error page | ☐ |
| 20.4 | Slow network | Throttle to 3G → Pages still load, loading states visible | ☐ |

---

## Summary
| Section | Tests | Passed | Failed | Notes |
|---------|-------|--------|--------|-------|
| Auth & Onboarding | 8 | | | |
| Command Center | 7 | | | |
| All Stores | 5 | | | |
| Orders | 5 | | | |
| Menu | 4 | | | |
| Checklists | 6 | | | |
| Food Safety | 5 | | | |
| Hiring | 5 | | | |
| Invoices | 5 | | | |
| Vendors | 3 | | | |
| Inventory | 5 | | | |
| Waste | 4 | | | |
| Financials | 5 | | | |
| Agent Activity | 4 | | | |
| Approvals | 3 | | | |
| Settings | 5 | | | |
| QR Codes | 2 | | | |
| API & Integrations | 4 | | | |
| Responsive | 3 | | | |
| Edge Cases | 4 | | | |
| **TOTAL** | **97** | | | |

---
*Vertex Autopilot v1.0 — QA Checklist*
*Generated: April 3, 2026*
