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
### 2026-07-27 — Indian GST compliance + Inquiries Excel import/export
- **GST-compliant tax invoice** across bills & packages: Food 5%, Activities 18%, per-item HSN/SAC codes, CGST+SGST for intra-state, IGST for inter-state
- Bills now store a `gst_breakup` (per-rate taxable/CGST/SGST/IGST/total), `customer_gstin`, `customer_state_code`, and auto-detect `is_interstate`
- Games get a `gst_category` (food/activity/goods) → GST rate + default HSN auto-applied at billing
- Packages get `food_portion` + `activity_portion` inputs — a package on a bill **auto-splits into two lines** (food@5% + activity@18%)
- Settings has a new **GST / Tax Invoice details** card: `firm_name`, `firm_gstin`, `firm_state_code`, `firm_pan`, `firm_fssai`, `invoice_prefix`
- Print receipt (`/bills/:id/print`) now renders a full-format tax invoice: firm GSTIN/FSSAI header, customer GSTIN + state, HSN column per line, GST breakup table
- **Inquiries Excel**: `Import Excel` / `Export` / `Template` buttons with `/api/inquiries/export.xlsx`, `/api/inquiries/template.xlsx`, and `POST /api/inquiries/import` (multipart). Round-trip verified.
- Tests: `/app/backend/tests/test_gst_compliance.py` (16/16 pass) + Playwright UI smoke on 5 pages + 2 file downloads

### 2026-07-26 — Dashboard "Sales Mix" upgrade
- Removed "Popular rides" leaderboard card from Dashboard
- Added `Packages Sold` and `Games/Activities Played` cards driven by the same date-range filter as the analytics panel
- Backend `/api/dashboard/stats` + `/api/dashboard/analytics` now return `total_packages_sold`, `total_games_played`, `packages_revenue`, `games_revenue`, `top_packages`, and per-bucket `packages_sold` / `games_played` in the trend
- New stacked bar chart shows Packages vs Games volume per bucket, plus Top-3 packages and Top-3 games lists
