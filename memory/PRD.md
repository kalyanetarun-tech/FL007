# Funland Adventure Park CRM — PRD

## Original Problem Statement
Manager of Funland Adventure Park Indore needs a CRM to:
- Capture inquiries (walk-in, phone, WhatsApp, Instagram, Facebook)
- Manage game prices with base + offer pricing
- Manage birthday/party packages
- Multi-user login for employees to enter customer visits, add games played, generate bills
- Staff attendance
- Marketing to customers via Instagram/Facebook/WhatsApp
- Direct customer entry with package selection

Added later:
- Direct printer output (thermal 80mm receipt) for bills
- Unified inquiry inbox from all channels
- Customer history with lifetime spend
- Mobile-installable (PWA)

## User Choices Confirmed
- Auth: JWT email+password with two roles (admin full access except inquiry immutability, employee limited)
- Payment: Razorpay + UPI QR (GPay/Paytm)
- Bill delivery: WhatsApp + SMS + Email (Twilio + Resend, placeholder keys)
- Data starter: empty (user adds)
- Design: vibrant/playful (ARCHETYPE 6) light theme, Nunito + Fraunces fonts, orange+teal palette

## Personas
- **Admin/Manager**: Full CRUD on games, packages, staff, settings, marketing. Views all attendance.
- **Employee**: Creates inquiries, customer visits & bills; marks own attendance; views games/packages read-only; NO access to staff/marketing/settings.

## What's Been Implemented (2026-02)

### Backend (`/app/backend/server.py`)
- JWT bearer auth (`bcrypt` + `pyjwt`), admin auto-seed
- REST endpoints under `/api`:
  - `/auth/login`, `/auth/me`
  - `/users` (admin CRUD staff)
  - `/games`, `/packages` (admin write, all read)
  - `/inquiries` + `/inquiries/webhook/{source}` (public webhook for WhatsApp/IG/FB/SMS/Call ingestion via Zapier/Twilio)
  - `/inquiries/{id}/status` (both roles can update status)
  - `/bills` (create/list/detail/status/send) — computes subtotal/discount/gst/total, generates `FL-YYMMDD-XXXXX` bill_no
  - `/customers` + `/customers/{key}` (auto-upserted from bills, tracks visits + lifetime spend)
  - `/attendance` check-in/out/me/today/all
  - `/settings` (park info, GST, UPI QR)
  - `/campaigns` (marketing — social=draft, whatsapp/sms/email=send via Twilio/Resend)
  - `/dashboard/stats` (revenue today, footfall, inquiries, pending bills, 7-day trend, top games)
  - `/integrations/status`
- Razorpay payment link creation when creds set; simulated fallback otherwise
- Twilio (WhatsApp+SMS) + Resend (email) integration with `simulated=true` fallback when keys empty

### Frontend (`/app/frontend/src`)
- React 19 + shadcn/ui + Tailwind + recharts + sonner
- Pages: Login, Dashboard, Inquiries, Games, Packages, NewVisit (billing entry), Bills list + detail, PrintBill (80mm thermal), Customers list + detail, Attendance, Staff, Marketing, Settings
- Role-gated routing via `Protected` wrapper (adminOnly for staff/marketing/settings)
- Playful vibrant light theme with Fraunces headings + Nunito body
- PWA manifest so users can "Add to Home Screen" and use it like a native app on phone
- Mobile-first responsive with drawer nav

### Test Coverage
- 20 backend pytest tests: 100% passing (`/app/backend/tests/backend_test.py`)
- Frontend flows: admin+employee login, KPI, CRUD dialogs, role-gating all validated

## What's Pending / Backlog (P1/P2)

### P1 (short-term next asks)
- Real Instagram/Facebook DM sync (needs Meta Business API app approval + Page verification — provide config UI once user gets approval)
- Native mobile app (React Native or Capacitor wrapper — separate project)
- CSV export for bills & customers
- SMS/WhatsApp inbound webhook handler for two-way conversation (Twilio Inbound URL)

### P2
- Whatsapp Business message templates & broadcast scheduling
- Loyalty points / repeat-visit discount automation
- Multi-branch support if Funland expands
- Employee shift roster and payroll integration
- Photo capture during customer entry (attach photo to bill)
- Barcode / RFID band scanning for game entry

## Next Action Items
1. **Get Razorpay + Twilio + Resend keys** and add to `/app/backend/.env` to unlock real messaging & payments
2. **Add games / packages** via Admin → Games/Packages pages
3. **Add employees** via Admin → Staff (each gets their own login)
4. **Configure UPI QR** in Settings so it prints on bills
5. When ready for social auto-sync, apply for Meta Business API access

## Changelog
### 2026-08-03 — Phase B: Reports · Expenses · Fullscreen QR · Print modes
- **Reports section** (new /reports admin route) with 4 tabs: Sales, GSTR-3B, Payment Mode, Expenses. Each has 6 date-range presets (today/week/month/year/all/custom), KPI cards, charts (bar/pie), WhatsApp + native share, and unified "Full Excel" download that produces one workbook with 4 sheets.
- **Expenses CRUD** — new collection + endpoints; frontend dialog to add/delete; category + payment-method + vendor tracked.
- **Fullscreen QR modal** on Bill Detail — one tap opens a large UPI QR encoding the exact bill total via UPI intent (`upi://pay?...&am=<total>`). Uses uploaded QR photo when set, else generates live.
- **Print modes** — customer receipt (`?mode=receipt` hides GST/HSN/customer GSTIN/state) vs full tax invoice (default). Bill Detail now has 2 buttons — Customer Receipt + Tax Invoice.

### 2026-07-30 — Phase A quick wins
Excel persistence re-verified · /api/health warm-up · Games → Items/Activities with new categories · Payment audit compulsory for non-cash paid · Prebook pax multiplier + summary at bottom + convert-to-bill navigation + admin-only lock after billing · Funland branding polish.

### 2026-07-29 — Soft-delete for inquiries · 2026-07-28 — Marketing Team Report · 2026-07-27 (v3/v4) — GST split, UPI, Excel, auto-inquiries webhook · 2026-07-27 — Indian GST compliance · 2026-07-26 — Dashboard Sales Mix
- **Excel inquiry disappearing bug** — re-verified fixed (soft-delete fix from 2026-07-29 iter-15 stands; imported rows persist across multiple GETs; is_deleted=false by default).
- **Server auto-wake** — new lightweight `/api/health` endpoint; frontend pings on mount + every 4 min to keep backend warm; no more perceived cold-start.
- **Games → Items / Activities** rename — sidebar + page title updated. New **Category dropdown** with 7 options (Activities / Games / Food & Beverage / Rooms / Miscellaneous / Merchandise / Other). Category auto-sets GST rate. GST dropdown expanded to 7 rates.
- **Payment audit trail** — new methods (RTGS/NEFT, Net Banking, Cheque) + compulsory `payment_reference` + `payment_at` + `checked_by` when any non-cash method is marked paid. Cash still simple.
- **Prebook pax multiplier** — increasing pax now auto-multiplies qty for game/item lines; packages stay at qty=1.
- **Prebook Booking Summary** moved to BOTTOM of page (single column layout).
- **Convert-to-bill** — now directly navigates to the new bill on success.
- **Prebook lock after billing** — once a prebooking has been converted to a bill, only admin can further edit status. Non-admin sees a "Locked" banner and disabled dropdown. Backend also returns 403 on non-admin edits post-conversion.
- **Funland branding** — public prebooking header polished (Fun/land + Adventure Park), WhatsApp/SMS confirmation message rebranded with Funland emojis + park name.

### 2026-07-29 — Soft-delete for inquiries (data safety)
Inquiries can never be permanently deleted from the app. DELETE = soft-archive; POST /restore = un-archive. All read paths filter is_deleted=true.

### 2026-07-28 — Marketing Team Report + fair-share allotment
- Least-loaded round-robin, `/api/marketing/report`, XLSX download, WhatsApp/native share

### 2026-07-27 (v4) — Auto Inquiries: WhatsApp + SMS + Instagram + Facebook
### 2026-07-27 (v3) — Multi-category package split · UPI everywhere · Lenient Excel import
### 2026-07-27 — Indian GST compliance + Inquiries Excel v1
### 2026-07-26 — Dashboard "Sales Mix" upgrade
