# Funland CRM — Complete Source Code Dump
_Generated: 2026-08-03 12:48 IST_

This single file concatenates every important source file of the Funland CRM (backend + frontend + PWA configs + docs).
For a working extractable archive, use `/app/funland_source.tar.gz` (all files preserved as-is).

## Table of Contents
1. [README](#1-readme)
2. [BACKEND — Main server](#2-backend--main-server)
3. [BACKEND — requirements.txt](#3-backend--requirementstxt)
4. [BACKEND — .env (redact keys before sharing)](#4-backend--env-redact-keys-before-sharing)
5. [FRONTEND — package.json](#5-frontend--packagejson)
6. [FRONTEND — .env](#6-frontend--env)
7. [FRONTEND — App.js](#7-frontend--appjs)
8. [FRONTEND — App.css](#8-frontend--appcss)
9. [FRONTEND — index.css](#9-frontend--indexcss)
10. [FRONTEND — auth.jsx](#10-frontend--authjsx)
11. [FRONTEND — api.js](#11-frontend--apijs)
12. [FRONTEND — clipboard.js](#12-frontend--clipboardjs)
13. [FRONTEND — reliability.js](#13-frontend--reliabilityjs)
14. [FRONTEND — Layout](#14-frontend--layout)
15. [FRONTEND — ErrorBoundary](#15-frontend--errorboundary)
16. [FRONTEND — Page](#16-frontend--page)
17. [FRONTEND — InstallPWA](#17-frontend--installpwa)
18. [FRONTEND — UpiPayBlock](#18-frontend--upipayblock)
19. [PAGE — Dashboard](#19-page--dashboard)
20. [PAGE — Login (Auth)](#20-page--login-auth)
21. [PAGE — NewVisit (Billing)](#21-page--newvisit-billing)
22. [PAGE — Bills](#22-page--bills)
23. [PAGE — PrintBill](#23-page--printbill)
24. [PAGE — Games (Items/Activities)](#24-page--games-itemsactivities)
25. [PAGE — Packages](#25-page--packages)
26. [PAGE — Customers](#26-page--customers)
27. [PAGE — Inquiries](#27-page--inquiries)
28. [PAGE — Prebookings](#28-page--prebookings)
29. [PAGE — PublicBook](#29-page--publicbook)
30. [PAGE — Marketing (with Team Report)](#30-page--marketing-with-team-report)
31. [PAGE — Reports (Sales/GST/Payment/Expense)](#31-page--reports-salesgstpaymentexpense)
32. [PAGE — Attendance](#32-page--attendance)
33. [PAGE — Staff](#33-page--staff)
34. [PAGE — Settings](#34-page--settings)
35. [PUBLIC — manifest.json (PWA)](#35-public--manifestjson-pwa)
36. [PUBLIC — service-worker.js (Offline)](#36-public--service-workerjs-offline)
37. [PUBLIC — index.html](#37-public--indexhtml)
38. [DOCS — Mobile App Guide](#38-docs--mobile-app-guide)
39. [DOCS — test_credentials.md](#39-docs--test_credentialsmd)

---

## 1. README
**File:** `memory/PRD.md`

```markdown
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

```

---

## 2. BACKEND — Main server
**File:** `backend/server.py`

```python
"""Funland Adventure Park CRM backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import secrets
import logging
import base64
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, UploadFile, File, Query
from fastapi.responses import Response, PlainTextResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------- Setup ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=15000,
    maxPoolSize=50,
    retryWrites=True,
)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
JWT_EXPIRE_HOURS = 24 * 7

app = FastAPI(title="Funland CRM")
api = APIRouter(prefix="/api")

@api.get("/health")
async def health():
    """Lightweight health/warm-up endpoint (no auth). Frontend pings this on app load."""
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}

security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("funland")

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def new_id():
    return str(uuid.uuid4())

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    if user.get("role") != "admin" and not user.get("permissions"):
        user["permissions"] = DEFAULT_EMP_PERMS
    if user.get("role") == "admin":
        user["permissions"] = ALL_PERMS
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user

# ---------------- Models ----------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = ""
    role: Literal["admin", "employee"] = "employee"
    permissions: List[str] = []
    is_marketing_exec: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[Literal["admin", "employee"]] = None
    password: Optional[str] = None
    permissions: Optional[List[str]] = None
    is_marketing_exec: Optional[bool] = None

class GameIn(BaseModel):
    name: str
    category: str = "activity"  # top-level item bucket: food / rooms / activities / miscellaneous / games / other
    price: float
    offer_price: Optional[float] = None
    duration_min: Optional[int] = None
    description: Optional[str] = ""
    active: bool = True
    # GST fields (Indian compliance) — kept internal, hidden from customer-facing receipts
    gst_category: Literal["food", "activity", "goods", "room", "clothing", "merchandise", "other"] = "activity"
    hsn_code: Optional[str] = ""

class PackageSplitLine(BaseModel):
    label: str                       # user-facing name shown on invoice
    category: Literal["food", "activity", "room", "clothing", "merchandise", "other"] = "activity"
    amount: float                    # ₹ portion of the package attributable to this line
    gst_percent: Optional[float] = None  # override auto rate if needed
    hsn_code: Optional[str] = ""

class PackageIn(BaseModel):
    name: str
    type: Literal["birthday", "party", "group", "other"] = "birthday"
    category: Optional[str] = ""  # free-text category eg: "Kids Special", "Corporate", "Weekend"
    price: float
    offer_price: Optional[float] = None
    pax: int = 10
    inclusions: List[str] = []
    description: Optional[str] = ""
    active: bool = True
    # NEW — arbitrary breakup lines with their own GST (activity/food/rooms/clothing/other)
    gst_split: List[PackageSplitLine] = []
    # LEGACY — kept for backward compat; auto-migrated to gst_split at bill time
    food_portion: float = 0
    activity_portion: float = 0
    hsn_food: Optional[str] = "996331"
    hsn_activity: Optional[str] = "999721"

class InquiryIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    source: Literal["walk-in", "phone", "instagram", "facebook", "whatsapp", "referral", "other"] = "walk-in"
    interest: Optional[str] = ""
    notes: Optional[str] = ""
    follow_up_date: Optional[str] = None
    status: Literal["new", "contacted", "converted", "lost"] = "new"

class InquiryStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "converted", "lost"]
    notes: Optional[str] = None

class InquiryAssign(BaseModel):
    assigned_to: Optional[str] = None  # user id, null to unassign

class RemarkIn(BaseModel):
    text: str

class BillItem(BaseModel):
    kind: Literal["game", "package", "custom"]
    ref_id: Optional[str] = None
    name: str
    price: float
    qty: int = 1
    gst_percent: float = 0  # per-line GST (e.g. food 5%, activity 18%)
    category: Optional[str] = None  # optional label: "food" / "activity" / "entry"
    hsn_code: Optional[str] = ""    # HSN/SAC — for GST invoice

class BillIn(BaseModel):
    customer_name: str
    customer_phone: str = ""
    customer_email: Optional[str] = ""
    customer_gstin: Optional[str] = ""      # 15-char GSTIN if B2B
    customer_state_code: Optional[str] = ""  # 2-digit GST state code (e.g. "23" for MP). Blank = intra-state
    items: List[BillItem]
    discount: float = 0            # flat rupees discount
    discount_percent: float = 0    # OR percent discount (5-100)
    gst_percent: float = 0         # legacy: applied only if no per-item GST provided
    payment_method: Literal["cash", "upi_qr", "razorpay", "card", "rtgs", "netbanking", "cheque", "other"] = "cash"
    payment_status: Literal["pending", "paid"] = "pending"
    # Digital payment audit trail — REQUIRED when payment_method is not cash and status is paid
    payment_reference: Optional[str] = ""   # UPI RRN / txn id / card auth code / cheque no / RTGS UTR
    payment_at: Optional[str] = ""          # ISO datetime of the actual payment
    checked_by: Optional[str] = ""          # Name of staff who verified receipt
    notes: Optional[str] = ""

class AttendanceCheckIn(BaseModel):
    notes: Optional[str] = ""

class PrebookItem(BaseModel):
    kind: Literal["game", "package"]
    ref_id: str
    name: str
    price: float
    qty: int = 1

class PrebookIn(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    booking_date: str  # YYYY-MM-DD
    booking_time: Optional[str] = ""  # e.g. "5:30 PM"
    pax: int = 1
    items: List[PrebookItem]
    notes: Optional[str] = ""
    source: str = "web"  # web / whatsapp / phone etc.

class PrebookStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "paid", "cancelled", "arrived"]

class SettingsIn(BaseModel):
    park_name: Optional[str] = None
    gst_rate: Optional[float] = None
    upi_qr_url: Optional[str] = None
    upi_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    google_review_url: Optional[str] = None
    google_reviews_shown: Optional[int] = None
    google_rating: Optional[float] = None
    # GST / firm compliance
    firm_name: Optional[str] = None            # legal name printed on tax invoice
    firm_gstin: Optional[str] = None           # 15-char GSTIN
    firm_state_code: Optional[str] = None      # 2-digit GST state code, e.g. "23" for MP
    firm_pan: Optional[str] = None
    firm_fssai: Optional[str] = None           # FSSAI for food service
    invoice_prefix: Optional[str] = None       # e.g. "FL/24-25/"

class CampaignIn(BaseModel):
    title: str
    channel: Literal["instagram", "facebook", "whatsapp", "sms", "email"]
    message: str
    image_url: Optional[str] = ""
    audience: Literal["all_customers", "recent_customers", "inquiries", "custom"] = "all_customers"
    custom_phones: List[str] = []

class SendBillIn(BaseModel):
    channel: Literal["whatsapp", "sms", "email"]

# ---------------- Auth ----------------
@api.post("/auth/login")
async def login(data: LoginIn):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_pw(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"],
            "phone": user.get("phone", ""),
            "permissions": user.get("permissions") or (ALL_PERMS if user["role"] == "admin" else DEFAULT_EMP_PERMS),
            "is_marketing_exec": user.get("is_marketing_exec", False),
        },
    }

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

# ---------------- Users (staff) - admin ----------------
@api.get("/users")
async def list_users(_: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users

DEFAULT_EMP_PERMS = ["dashboard", "inquiries", "visit", "bills", "customers", "games", "packages", "attendance", "prebookings"]
ALL_PERMS = DEFAULT_EMP_PERMS + ["staff", "marketing", "settings"]

@api.post("/users")
async def create_user(data: UserCreate, _: dict = Depends(require_admin)):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already exists")
    perms = data.permissions if data.permissions else (ALL_PERMS if data.role == "admin" else DEFAULT_EMP_PERMS)
    doc = {
        "id": new_id(),
        "email": email,
        "name": data.name,
        "phone": data.phone or "",
        "role": data.role,
        "permissions": perms,
        "is_marketing_exec": data.is_marketing_exec,
        "password_hash": hash_pw(data.password),
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    doc.pop("password_hash")
    doc.pop("_id", None)
    return doc

@api.patch("/users/{uid}")
async def update_user(uid: str, data: UserUpdate, _: dict = Depends(require_admin)):
    update = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if "password" in update:
        update["password_hash"] = hash_pw(update.pop("password"))
    # If role is being changed and permissions were not explicitly provided, reset perms
    if "role" in update and "permissions" not in update:
        update["permissions"] = ALL_PERMS if update["role"] == "admin" else DEFAULT_EMP_PERMS
    if update:
        await db.users.update_one({"id": uid}, {"$set": update})
    return await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})

@api.delete("/users/{uid}")
async def delete_user(uid: str, admin: dict = Depends(require_admin)):
    if uid == admin["id"]:
        raise HTTPException(400, "Cannot delete self")
    await db.users.delete_one({"id": uid})
    return {"ok": True}

# ---------------- Games ----------------
@api.get("/games")
async def list_games(user: dict = Depends(get_current_user)):
    games = await db.games.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return games

@api.post("/games")
async def create_game(data: GameIn, _: dict = Depends(require_admin)):
    doc = {"id": new_id(), **data.model_dump(), "created_at": now_iso()}
    await db.games.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/games/{gid}")
async def update_game(gid: str, data: GameIn, _: dict = Depends(require_admin)):
    await db.games.update_one({"id": gid}, {"$set": data.model_dump()})
    return await db.games.find_one({"id": gid}, {"_id": 0})

@api.delete("/games/{gid}")
async def delete_game(gid: str, _: dict = Depends(require_admin)):
    await db.games.delete_one({"id": gid})
    return {"ok": True}

# ---------------- Packages ----------------
@api.get("/packages")
async def list_packages(user: dict = Depends(get_current_user)):
    return await db.packages.find({}, {"_id": 0}).sort("name", 1).to_list(1000)

@api.post("/packages")
async def create_package(data: PackageIn, _: dict = Depends(require_admin)):
    doc = {"id": new_id(), **data.model_dump(), "created_at": now_iso()}
    await db.packages.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/packages/{pid}")
async def update_package(pid: str, data: PackageIn, _: dict = Depends(require_admin)):
    await db.packages.update_one({"id": pid}, {"$set": data.model_dump()})
    return await db.packages.find_one({"id": pid}, {"_id": 0})

@api.delete("/packages/{pid}")
async def delete_package(pid: str, _: dict = Depends(require_admin)):
    await db.packages.delete_one({"id": pid})
    return {"ok": True}

# ---------------- Inquiries ----------------
@api.get("/inquiries")
async def list_inquiries(include_archived: bool = False, only_archived: bool = False, user: dict = Depends(get_current_user)):
    """Active inquiries by default. Archived (soft-deleted) are hidden unless include_archived=1 or only_archived=1."""
    q = {}
    if only_archived:
        q["is_deleted"] = True
    elif not include_archived:
        q["$or"] = [{"is_deleted": {"$exists": False}}, {"is_deleted": False}]
    return await db.inquiries.find(q, {"_id": 0}).sort("created_at", -1).to_list(20000)

# Webhook endpoint - accepts inquiries from external sources (WhatsApp/Twilio, Meta, Zapier, etc.)
async def _pick_next_marketing_exec() -> Optional[dict]:
    """Fair-share pick — chooses the marketing exec who currently has the FEWEST OPEN inquiries.
    Ties are broken by fewest total assigned all-time (so newer joiners catch up),
    then finally by round-robin counter for stability."""
    execs = await db.users.find({"is_marketing_exec": True}, {"_id": 0, "id": 1, "name": 1}).sort("name", 1).to_list(100)
    if not execs:
        return None
    # Open inquiries per exec (new + contacted)
    open_counts = {e["id"]: 0 for e in execs}
    total_counts = {e["id"]: 0 for e in execs}
    async for row in db.inquiries.aggregate([
        {"$match": {"assigned_to": {"$in": [e["id"] for e in execs]}, "$or": [{"is_deleted": {"$exists": False}}, {"is_deleted": False}]}},
        {"$group": {"_id": {"a": "$assigned_to", "s": "$status"}, "n": {"$sum": 1}}},
    ]):
        rid = row["_id"]["a"]
        st = row["_id"]["s"]
        total_counts[rid] = total_counts.get(rid, 0) + row["n"]
        if st in ("new", "contacted"):
            open_counts[rid] = open_counts.get(rid, 0) + row["n"]
    # Increment RR counter (used as tie-breaker for deterministic distribution)
    counter_doc = await db.counters.find_one_and_update(
        {"id": "rr_marketing"}, {"$inc": {"v": 1}}, upsert=True, return_document=True
    )
    rr_idx = ((counter_doc or {}).get("v", 0) - 1) % len(execs)
    # Sort: least open first, then least total, then round-robin order
    ordered = sorted(execs, key=lambda e: (open_counts.get(e["id"], 0), total_counts.get(e["id"], 0), (execs.index(e) - rr_idx) % len(execs)))
    return ordered[0]

async def _create_inquiry_from_normalized(name: str, phone: str, email: str, source: str, message: str, meta: dict = None):
    """Shared helper: create + assign inquiry from normalized fields."""
    src_map = {"whatsapp": "whatsapp", "instagram": "instagram", "facebook": "facebook", "sms": "phone", "phone": "phone", "call": "phone", "web": "other", "twilio_sms": "phone", "twilio_wa": "whatsapp"}
    # Normalise phone: keep digits, strip +91
    if phone:
        import re as _re
        digits = _re.sub(r"\D", "", str(phone))
        if len(digits) > 10 and digits.startswith("91"):
            digits = digits[-10:]
        phone = digits[-10:] if len(digits) >= 10 else digits
    if not name and phone:
        name = "Unknown"
    if not name and not phone:
        return None
    assignee = await _pick_next_marketing_exec()
    doc = {
        "id": new_id(),
        "name": name or "Unknown",
        "phone": phone or "",
        "email": email or "",
        "source": src_map.get(source, "other"),
        "interest": (meta or {}).get("interest", ""),
        "notes": message or "",
        "status": "new",
        "remarks": [],
        "assigned_to": assignee["id"] if assignee else None,
        "assigned_to_name": assignee["name"] if assignee else None,
        "created_by": "webhook",
        "created_by_name": f"{source} webhook",
        "created_at": now_iso(),
        "channel_raw": meta or {},
    }
    await db.inquiries.insert_one(doc)
    doc.pop("_id", None)
    logger.info(f"Webhook inquiry from {source}: {doc['name']} ({doc['phone']}) → {assignee['name'] if assignee else 'unassigned'}")
    return doc

def _verify_webhook_secret(settings: dict, provided: Optional[str]) -> bool:
    expected = (settings or {}).get("inquiry_webhook_secret") or ""
    if not expected:
        return True  # never generated — allow through
    return provided == expected

# --- Meta WhatsApp / Instagram / Messenger Cloud API (defined BEFORE the parameterised /{source} route) ---
@api.get("/inquiries/webhook/meta")
async def meta_webhook_verify(hub_mode: str = Query(None, alias="hub.mode"), hub_verify_token: str = Query(None, alias="hub.verify_token"), hub_challenge: str = Query(None, alias="hub.challenge")):
    """Meta requires GET verification when you register the webhook URL in the app dashboard."""
    settings = await _get_settings()
    if hub_mode == "subscribe" and hub_verify_token == (settings.get("meta_verify_token") or ""):
        return PlainTextResponse(hub_challenge or "ok")
    raise HTTPException(403, "verify_token mismatch")

@api.post("/inquiries/webhook/meta")
async def meta_webhook_inbound(request: Request):
    """Meta Cloud API delivers to this endpoint for WhatsApp / Instagram / FB Messenger.
    We inspect entry[*].changes[*].value / entry[*].messaging[*] and create an inquiry per message."""
    try: payload = await request.json()
    except Exception: payload = {}
    created = []
    entries = payload.get("entry", []) if isinstance(payload, dict) else []
    for entry in entries:
        # WhatsApp Cloud API shape
        for ch in entry.get("changes", []) or []:
            v = ch.get("value") or {}
            contacts = { c.get("wa_id"): (c.get("profile") or {}).get("name") for c in (v.get("contacts") or []) }
            for msg in v.get("messages") or []:
                wa_id = msg.get("from")
                name = contacts.get(wa_id) or ""
                text = ""
                if msg.get("type") == "text":
                    text = (msg.get("text") or {}).get("body", "")
                elif msg.get("type") == "interactive":
                    ir = msg.get("interactive") or {}
                    text = (ir.get("button_reply") or ir.get("list_reply") or {}).get("title", "")
                else:
                    text = f"[{msg.get('type')} message]"
                doc = await _create_inquiry_from_normalized(name, wa_id, "", "whatsapp", text, meta={"raw": msg})
                if doc: created.append(doc["id"])
        # Instagram / Messenger shape
        for m in entry.get("messaging", []) or []:
            sender = (m.get("sender") or {}).get("id") or ""
            text = ((m.get("message") or {}).get("text")) or ""
            src = "instagram"  # FB pages under Meta API deliver to same endpoint; caller can distinguish via entry.id
            doc = await _create_inquiry_from_normalized(f"IG/FB user {sender[-6:]}" if sender else "", "", "", src, text, meta={"raw": m, "sender_id": sender})
            if doc: created.append(doc["id"])
    return {"ok": True, "created": created}


@api.post("/inquiries/webhook/{source}")
async def inquiry_webhook(source: str, request: Request, secret: Optional[str] = Query(None), x_webhook_secret: Optional[str] = None):
    """Public inbound webhook - accepts many payload shapes.

    Auth: pass ?secret=<inquiry_webhook_secret> OR header X-Webhook-Secret.

    Supported payloads (auto-detected):
    - Generic JSON: {name?, phone?, email?, message?/notes?}
    - Twilio SMS/WhatsApp (form-urlencoded): From=..., Body=..., ProfileName?
    - Android SMS Forwarder v3: {from, text, sentStamp, ...}
    - Zapier flat: any of the above keys
    """
    settings = await _get_settings()
    provided = secret or request.headers.get("x-webhook-secret") or request.headers.get("X-Webhook-Secret")
    if not _verify_webhook_secret(settings, provided):
        raise HTTPException(401, "Invalid webhook secret")

    ctype = (request.headers.get("content-type") or "").lower()
    body_payload = {}
    if "application/x-www-form-urlencoded" in ctype or "multipart/form-data" in ctype:
        form = await request.form()
        body_payload = dict(form)
    else:
        try: body_payload = await request.json()
        except Exception: body_payload = {}

    # Normalise across shapes
    name = body_payload.get("name") or body_payload.get("ProfileName") or body_payload.get("profile_name") or body_payload.get("sender_name") or body_payload.get("from_name")
    phone = body_payload.get("phone") or body_payload.get("from") or body_payload.get("From") or body_payload.get("wa_id") or body_payload.get("mobile")
    email = body_payload.get("email") or body_payload.get("Email")
    message = body_payload.get("message") or body_payload.get("Body") or body_payload.get("text") or body_payload.get("notes") or body_payload.get("msg")

    # Twilio WhatsApp: From="whatsapp:+9198..." → normalise
    if phone and isinstance(phone, str) and phone.lower().startswith("whatsapp:"):
        phone = phone.split(":", 1)[1]
        source = "whatsapp"
    # Twilio SMS: From="+9198..."
    if source == "twilio":
        source = "whatsapp" if body_payload.get("MessagingServiceSid", "").lower().startswith("mg") or "whatsapp" in str(body_payload.get("MessageStatus", "")) else "sms"

    doc = await _create_inquiry_from_normalized(name, phone, email, source, message, meta={"raw": body_payload})
    if not doc:
        return {"ok": False, "reason": "no_name_or_phone"}

    # Twilio expects a TwiML response (optional; empty is fine)
    if "twilio" in source or "MessageSid" in body_payload:
        return PlainTextResponse("<Response></Response>", media_type="application/xml")
    return {"ok": True, "id": doc["id"], "assigned_to": doc.get("assigned_to_name")}


@api.post("/inquiries")
async def create_inquiry(data: InquiryIn, user: dict = Depends(get_current_user)):
    assignee = await _pick_next_marketing_exec()
    doc = {
        "id": new_id(),
        **data.model_dump(),
        "remarks": [],
        "assigned_to": assignee["id"] if assignee else None,
        "assigned_to_name": assignee["name"] if assignee else None,
        "created_by": user["id"],
        "created_by_name": user["name"],
        "created_at": now_iso(),
    }
    await db.inquiries.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/inquiries/{iid}/status")
async def update_inquiry_status(iid: str, data: InquiryStatusUpdate, user: dict = Depends(get_current_user)):
    """Both roles can update status (mark as contacted/converted)."""
    update = {"status": data.status}
    if data.notes is not None:
        update["notes"] = data.notes
    await db.inquiries.update_one({"id": iid}, {"$set": update})
    return await db.inquiries.find_one({"id": iid}, {"_id": 0})

@api.patch("/inquiries/{iid}/assign")
async def assign_inquiry(iid: str, data: InquiryAssign, _: dict = Depends(require_admin)):
    """Admin can reassign inquiry to a specific executive (or unassign with null)."""
    upd = {"assigned_to": None, "assigned_to_name": None}
    if data.assigned_to:
        target = await db.users.find_one({"id": data.assigned_to}, {"_id": 0, "id": 1, "name": 1})
        if not target:
            raise HTTPException(404, "User not found")
        upd = {"assigned_to": target["id"], "assigned_to_name": target["name"]}
    await db.inquiries.update_one({"id": iid}, {"$set": upd})
    return await db.inquiries.find_one({"id": iid}, {"_id": 0})

@api.post("/inquiries/{iid}/remarks")
async def add_remark(iid: str, data: RemarkIn, user: dict = Depends(get_current_user)):
    """Any staff can add a remark (why not converted, follow-up etc.)."""
    if not data.text.strip():
        raise HTTPException(400, "Remark text required")
    remark = {"text": data.text.strip(), "by": user["name"], "by_id": user["id"], "at": now_iso()}
    await db.inquiries.update_one({"id": iid}, {"$push": {"remarks": remark}})
    return await db.inquiries.find_one({"id": iid}, {"_id": 0})

@api.delete("/inquiries/{iid}")
async def soft_delete_inquiry(iid: str, user: dict = Depends(get_current_user)):
    """SOFT delete — moves inquiry to archive, doesn't actually erase.
    Restore via POST /api/inquiries/{iid}/restore. Admin can force-erase via ?permanent=1 (not exposed on this endpoint)."""
    doc = await db.inquiries.find_one({"id": iid}, {"_id": 0, "id": 1})
    if not doc:
        raise HTTPException(404, "Inquiry not found")
    await db.inquiries.update_one({"id": iid}, {"$set": {"is_deleted": True, "deleted_at": now_iso(), "deleted_by": user["id"], "deleted_by_name": user["name"]}})
    return {"ok": True, "id": iid, "archived": True}

@api.post("/inquiries/{iid}/restore")
async def restore_inquiry(iid: str, user: dict = Depends(get_current_user)):
    """Un-archive a previously soft-deleted inquiry."""
    r = await db.inquiries.update_one({"id": iid}, {"$set": {"is_deleted": False}, "$unset": {"deleted_at": "", "deleted_by": "", "deleted_by_name": ""}})
    if r.matched_count == 0:
        raise HTTPException(404, "Inquiry not found")
    return await db.inquiries.find_one({"id": iid}, {"_id": 0})

# --- Inquiries Excel import/export ---
INQUIRY_XLSX_COLUMNS = [
    "Name", "Phone", "Email", "Source", "Interest", "Notes",
    "Follow Up Date", "Status", "Assigned To", "Created At",
]

@api.get("/inquiries/export.xlsx")
async def export_inquiries_xlsx(user: dict = Depends(get_current_user)):
    """Download all inquiries as an .xlsx file. Same columns are accepted by the import endpoint."""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    from io import BytesIO
    rows = await db.inquiries.find({"$or": [{"is_deleted": {"$exists": False}}, {"is_deleted": False}]}, {"_id": 0}).sort("created_at", -1).to_list(20000)
    wb = Workbook()
    ws = wb.active
    ws.title = "Inquiries"
    ws.append(INQUIRY_XLSX_COLUMNS)
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="FF7A00")
    for c in ws[1]:
        c.font = header_font
        c.fill = header_fill
    for r in rows:
        ws.append([
            r.get("name", ""),
            r.get("phone", ""),
            r.get("email", ""),
            r.get("source", ""),
            r.get("interest", ""),
            r.get("notes", ""),
            r.get("follow_up_date", "") or "",
            r.get("status", ""),
            r.get("assigned_to_name", "") or "",
            (r.get("created_at", "") or "")[:19].replace("T", " "),
        ])
    # Auto width
    for col in ws.columns:
        max_len = max((len(str(c.value)) if c.value is not None else 0) for c in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 40)
    buf = BytesIO()
    wb.save(buf)
    filename = f"inquiries_{date.today().isoformat()}.xlsx"
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@api.get("/inquiries/template.xlsx")
async def download_inquiry_template(user: dict = Depends(get_current_user)):
    """Blank template with headers + 2 example rows so users know the format to upload."""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    from io import BytesIO
    wb = Workbook()
    ws = wb.active
    ws.title = "Inquiries"
    ws.append(INQUIRY_XLSX_COLUMNS)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="FF7A00")
    ws.append(["Rahul Sharma", "9876543210", "rahul@example.com", "whatsapp", "Birthday package", "Sat evening slot", "2026-08-10", "new", "", ""])
    ws.append(["Priya Patel", "9998887777", "", "instagram", "Corporate group", "20 pax", "", "contacted", "", ""])
    for col in ws.columns:
        ws.column_dimensions[col[0].column_letter].width = 22
    buf = BytesIO()
    wb.save(buf)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="inquiries_template.xlsx"'},
    )

@api.post("/inquiries/import")
async def import_inquiries_xlsx(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Bulk import inquiries from ANY .xlsx file — very lenient.
    We auto-detect Name and Phone columns from common aliases (English + Hindi).
    If header is missing or weird, we scan every row and pluck the first phone-like
    cell + the first text cell for name. Phone with no name → 'Unknown'."""
    from openpyxl import load_workbook
    from io import BytesIO
    import re

    if not (file.filename or "").lower().endswith((".xlsx", ".xls", ".xlsm")):
        raise HTTPException(400, "Please upload an .xlsx file")
    content = await file.read()
    try:
        wb = load_workbook(BytesIO(content), data_only=True)
    except Exception as e:
        raise HTTPException(400, f"Cannot read spreadsheet: {e}")

    valid_sources = {"walk-in", "phone", "instagram", "facebook", "whatsapp", "referral", "other"}
    valid_status = {"new", "contacted", "converted", "lost"}

    NAME_ALIASES   = {"name", "customer", "customer name", "cust name", "full name", "guest name", "guest", "party", "client", "person", "नाम", "ग्राहक", "customer_name"}
    PHONE_ALIASES  = {"phone", "mobile", "mob", "mobile no", "mobile number", "contact", "contact no", "phone no", "number", "no", "no.", "cell", "whatsapp", "wa", "फोन", "मोबाइल", "नंबर", "phone_number", "mobile_number"}
    EMAIL_ALIASES  = {"email", "e-mail", "mail", "email id", "email_id"}
    SOURCE_ALIASES = {"source", "channel", "from", "via", "platform"}
    INTEREST_ALIASES = {"interest", "package", "requirement", "for", "purpose", "event"}
    NOTES_ALIASES  = {"notes", "note", "remark", "remarks", "comment", "comments", "message", "msg", "detail", "description"}
    FOLLOWUP_ALIASES = {"follow up", "follow-up", "followup", "follow up date", "next follow up", "date", "follow_up_date"}
    STATUS_ALIASES = {"status", "stage", "state"}
    ASSIGNED_ALIASES = {"assigned to", "assignee", "assigned", "owner", "executive", "sales", "staff"}

    def norm(v):
        return str(v).strip().lower() if v is not None else ""

    def phone_from(cell) -> str:
        """Return normalised phone number if the cell looks like one, else empty."""
        if cell is None:
            return ""
        s = str(cell).strip()
        if not s:
            return ""
        # Excel may hand us floats for numeric cells (e.g. 9.876543E9)
        if isinstance(cell, float) and cell.is_integer():
            s = str(int(cell))
        # keep only digits
        digits = re.sub(r"\D", "", s)
        if 10 <= len(digits) <= 14:
            # Strip country prefix
            if len(digits) > 10 and digits.startswith("91"):
                digits = digits[-10:]
            if len(digits) == 10 and digits[0] in "6789":
                return digits
        return ""

    def looks_like_name(s: str) -> bool:
        if not s: return False
        s = s.strip()
        if len(s) < 2 or len(s) > 80: return False
        # reject pure numeric / phone-looking / status / email / date
        if re.fullmatch(r"[\d\s\-\+\(\)]+", s): return False
        if "@" in s: return False
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s): return False
        low = s.lower()
        if low in valid_status or low in valid_sources: return False
        return True

    total_inserted = 0
    total_skipped = 0
    errors: List[str] = []

    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue

        # -------- Detect header row (may not be row 0) --------
        header_idx = -1
        idx_map = {"name": -1, "phone": -1, "email": -1, "source": -1, "interest": -1, "notes": -1, "follow_up_date": -1, "status": -1, "assigned_to": -1}

        for hi, row in enumerate(rows[:5]):  # search first 5 rows
            cells = [norm(c) for c in row]
            hit_name = any(c in NAME_ALIASES for c in cells)
            hit_phone = any(c in PHONE_ALIASES for c in cells)
            if hit_name or hit_phone:
                header_idx = hi
                for ci, c in enumerate(cells):
                    if c in NAME_ALIASES and idx_map["name"] < 0: idx_map["name"] = ci
                    elif c in PHONE_ALIASES and idx_map["phone"] < 0: idx_map["phone"] = ci
                    elif c in EMAIL_ALIASES and idx_map["email"] < 0: idx_map["email"] = ci
                    elif c in SOURCE_ALIASES and idx_map["source"] < 0: idx_map["source"] = ci
                    elif c in INTEREST_ALIASES and idx_map["interest"] < 0: idx_map["interest"] = ci
                    elif c in NOTES_ALIASES and idx_map["notes"] < 0: idx_map["notes"] = ci
                    elif c in FOLLOWUP_ALIASES and idx_map["follow_up_date"] < 0: idx_map["follow_up_date"] = ci
                    elif c in STATUS_ALIASES and idx_map["status"] < 0: idx_map["status"] = ci
                    elif c in ASSIGNED_ALIASES and idx_map["assigned_to"] < 0: idx_map["assigned_to"] = ci
                break

        data_rows = rows[header_idx + 1:] if header_idx >= 0 else rows

        for row_no, row in enumerate(data_rows, start=(header_idx + 2 if header_idx >= 0 else 1)):
            try:
                if not row or all(c is None or str(c).strip() == "" for c in row):
                    continue

                # ----- Extract name & phone with fallback scanning -----
                name = ""
                phone = ""

                if idx_map["name"] >= 0 and idx_map["name"] < len(row):
                    v = row[idx_map["name"]]
                    if v is not None and str(v).strip():
                        name = str(v).strip()

                if idx_map["phone"] >= 0 and idx_map["phone"] < len(row):
                    phone = phone_from(row[idx_map["phone"]])

                # Fallback: scan every cell for a phone-shaped value
                if not phone:
                    for c in row:
                        p = phone_from(c)
                        if p:
                            phone = p
                            break

                # Fallback: pick the first name-like text cell (not the phone cell)
                if not name:
                    for ci, c in enumerate(row):
                        if c is None: continue
                        s = str(c).strip()
                        if not s: continue
                        if s == phone or phone_from(c): continue
                        if looks_like_name(s):
                            name = s
                            break

                if not phone and not name:
                    total_skipped += 1
                    continue

                if not name:
                    name = "Unknown"

                # ----- Optional fields -----
                def cell(k):
                    i = idx_map.get(k, -1)
                    if i < 0 or i >= len(row): return ""
                    v = row[i]
                    return str(v).strip() if v is not None else ""

                email = cell("email")
                if email and "@" not in email:
                    # scan any other cell for a valid-ish email
                    for c in row:
                        if c and "@" in str(c):
                            email = str(c).strip(); break

                source = cell("source").lower().replace(" ", "-") or "other"
                if source not in valid_sources:
                    # allow "insta" → instagram etc
                    if source.startswith("insta"): source = "instagram"
                    elif source.startswith("face") or source == "fb": source = "facebook"
                    elif source.startswith("what") or source == "wa": source = "whatsapp"
                    elif source in {"walkin", "walk_in"}: source = "walk-in"
                    else: source = "other"

                status_val = cell("status").lower() or "new"
                if status_val not in valid_status:
                    status_val = "new"

                assignee_name = cell("assigned_to")
                assignee_doc = None
                if assignee_name:
                    assignee_doc = await db.users.find_one({"name": assignee_name}, {"_id": 0, "id": 1, "name": 1})
                if not assignee_doc:
                    assignee_doc = await _pick_next_marketing_exec()

                doc = {
                    "id": new_id(),
                    "name": name,
                    "phone": phone,
                    "email": email,
                    "source": source,
                    "interest": cell("interest"),
                    "notes": cell("notes"),
                    "follow_up_date": cell("follow_up_date") or None,
                    "status": status_val,
                    "remarks": [],
                    "assigned_to": (assignee_doc or {}).get("id"),
                    "assigned_to_name": (assignee_doc or {}).get("name"),
                    "created_by": user["id"],
                    "created_by_name": user["name"] + " (import)",
                    "created_at": now_iso(),
                }
                await db.inquiries.insert_one(doc)
                total_inserted += 1
            except Exception as e:
                errors.append(f"{ws.title} row {row_no}: {e}")

    return {"ok": True, "inserted": total_inserted, "skipped": total_skipped, "errors": errors[:20]}


# ---------------- Expenses ----------------
class ExpenseIn(BaseModel):
    date: str                          # ISO YYYY-MM-DD
    category: str = "other"           # rent, salary, utility, food, maintenance, marketing, other
    description: str = ""
    amount: float
    payment_method: str = "cash"      # cash / upi / bank / cheque / other
    payment_reference: Optional[str] = ""
    vendor: Optional[str] = ""
    bill_url: Optional[str] = ""       # attached vendor bill image URL

@api.get("/expenses")
async def list_expenses(user: dict = Depends(get_current_user)):
    return await db.expenses.find({}, {"_id": 0}).sort("date", -1).to_list(5000)

@api.post("/expenses")
async def create_expense(data: ExpenseIn, user: dict = Depends(get_current_user)):
    doc = {"id": new_id(), **data.model_dump(), "created_by": user["id"], "created_by_name": user["name"], "created_at": now_iso()}
    await db.expenses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.patch("/expenses/{eid}")
async def update_expense(eid: str, data: ExpenseIn, user: dict = Depends(get_current_user)):
    await db.expenses.update_one({"id": eid}, {"$set": data.model_dump()})
    return await db.expenses.find_one({"id": eid}, {"_id": 0})

@api.delete("/expenses/{eid}")
async def delete_expense(eid: str, user: dict = Depends(get_current_user)):
    r = await db.expenses.delete_one({"id": eid})
    if r.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


# ---------------- Business Reports (Sales / GST-3B / Payment / Expense) ----------------
async def _fetch_bills_in_range(f_iso: str, t_iso: str):
    """Bills with created_at in [f_iso, t_iso). Only paid bills contribute to revenue/GST."""
    return await db.bills.find({"created_at": {"$gte": f_iso, "$lt": t_iso}}, {"_id": 0}).to_list(50000)

@api.get("/reports/sales")
async def sales_report(from_date: Optional[str] = Query(None, alias="from"), to_date: Optional[str] = Query(None, alias="to"), preset: Optional[str] = None, user: dict = Depends(get_current_user)):
    f_iso, t_iso, label = _parse_range_yyyymmdd(from_date, to_date, preset)
    bills = await _fetch_bills_in_range(f_iso, t_iso)
    total_revenue = 0.0
    total_bills = 0
    total_paid = 0
    total_pending = 0
    category_totals = {}      # by item category (food/activity/room/…): {taxable, tax, gross}
    daily = {}                # date → revenue
    top_items = {}
    for b in bills:
        total_bills += 1
        if b.get("payment_status") == "paid":
            amt = float(b.get("total") or 0)
            total_revenue += amt
            total_paid += 1
            d = (b.get("created_at") or "")[:10]
            if d: daily[d] = daily.get(d, 0) + amt
        else:
            total_pending += 1
        for it in b.get("items", []):
            cat = (it.get("category") or "other").lower()
            gross = float(it.get("price") or 0) * int(it.get("qty") or 0)
            rate = float(it.get("gst_percent") or 0)
            taxable = gross / (1 + rate/100) if rate else gross
            tax = gross - taxable
            slot = category_totals.setdefault(cat, {"taxable": 0.0, "tax": 0.0, "gross": 0.0, "count": 0})
            slot["taxable"] += taxable
            slot["tax"] += tax
            slot["gross"] += gross
            slot["count"] += int(it.get("qty") or 0)
            top_items[it.get("name", "?")] = top_items.get(it.get("name", "?"), 0) + int(it.get("qty") or 0)
    daily_list = sorted([{"date": d, "revenue": round(v, 2)} for d, v in daily.items()], key=lambda x: x["date"])
    top = sorted([{"name": k, "qty": v} for k, v in top_items.items()], key=lambda x: -x["qty"])[:10]
    for k, v in category_totals.items():
        v["taxable"] = round(v["taxable"], 2)
        v["tax"] = round(v["tax"], 2)
        v["gross"] = round(v["gross"], 2)
    return {
        "from": f_iso, "to": t_iso, "label": label,
        "total_revenue": round(total_revenue, 2),
        "total_bills": total_bills,
        "paid_bills": total_paid,
        "pending_bills": total_pending,
        "avg_bill_value": round(total_revenue / total_paid, 2) if total_paid else 0,
        "category_totals": category_totals,
        "daily": daily_list,
        "top_items": top,
    }

@api.get("/reports/gstr3b")
async def gstr3b_report(from_date: Optional[str] = Query(None, alias="from"), to_date: Optional[str] = Query(None, alias="to"), preset: Optional[str] = None, user: dict = Depends(get_current_user)):
    """GSTR-3B style outward supplies summary: per-rate taxable, CGST, SGST, IGST."""
    f_iso, t_iso, label = _parse_range_yyyymmdd(from_date, to_date, preset)
    bills = await _fetch_bills_in_range(f_iso, t_iso)
    by_rate = {}
    total_taxable = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0
    invoices = 0
    for b in bills:
        if b.get("payment_status") != "paid":
            continue
        invoices += 1
        for br in (b.get("gst_breakup") or []):
            rate = float(br.get("rate") or 0)
            slot = by_rate.setdefault(rate, {"rate": rate, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "igst": 0.0})
            slot["taxable"] += float(br.get("taxable") or 0)
            slot["cgst"] += float(br.get("cgst") or 0)
            slot["sgst"] += float(br.get("sgst") or 0)
            slot["igst"] += float(br.get("igst") or 0)
            total_taxable += float(br.get("taxable") or 0)
            total_cgst += float(br.get("cgst") or 0)
            total_sgst += float(br.get("sgst") or 0)
            total_igst += float(br.get("igst") or 0)
    breakup = sorted([{**v, "taxable": round(v["taxable"], 2), "cgst": round(v["cgst"], 2), "sgst": round(v["sgst"], 2), "igst": round(v["igst"], 2)} for v in by_rate.values()], key=lambda x: x["rate"])
    return {
        "from": f_iso, "to": t_iso, "label": label,
        "invoice_count": invoices,
        "total_taxable": round(total_taxable, 2),
        "total_cgst": round(total_cgst, 2),
        "total_sgst": round(total_sgst, 2),
        "total_igst": round(total_igst, 2),
        "total_tax": round(total_cgst + total_sgst + total_igst, 2),
        "rate_wise": breakup,
    }

@api.get("/reports/payment-mode")
async def payment_mode_report(from_date: Optional[str] = Query(None, alias="from"), to_date: Optional[str] = Query(None, alias="to"), preset: Optional[str] = None, user: dict = Depends(get_current_user)):
    f_iso, t_iso, label = _parse_range_yyyymmdd(from_date, to_date, preset)
    bills = await _fetch_bills_in_range(f_iso, t_iso)
    by_mode = {}
    total_paid = 0.0
    total_pending = 0.0
    for b in bills:
        method = b.get("payment_method") or "cash"
        amt = float(b.get("total") or 0)
        slot = by_mode.setdefault(method, {"method": method, "paid_amount": 0.0, "paid_count": 0, "pending_amount": 0.0, "pending_count": 0})
        if b.get("payment_status") == "paid":
            slot["paid_amount"] += amt
            slot["paid_count"] += 1
            total_paid += amt
        else:
            slot["pending_amount"] += amt
            slot["pending_count"] += 1
            total_pending += amt
    modes = sorted([{**v, "paid_amount": round(v["paid_amount"], 2), "pending_amount": round(v["pending_amount"], 2)} for v in by_mode.values()], key=lambda x: -x["paid_amount"])
    return {
        "from": f_iso, "to": t_iso, "label": label,
        "total_paid": round(total_paid, 2),
        "total_pending": round(total_pending, 2),
        "modes": modes,
    }

@api.get("/reports/expenses")
async def expense_report(from_date: Optional[str] = Query(None, alias="from"), to_date: Optional[str] = Query(None, alias="to"), preset: Optional[str] = None, user: dict = Depends(get_current_user)):
    f_iso, t_iso, label = _parse_range_yyyymmdd(from_date, to_date, preset)
    rows = await db.expenses.find({"date": {"$gte": f_iso[:10], "$lt": t_iso[:10]}}, {"_id": 0}).sort("date", -1).to_list(20000)
    by_cat = {}
    by_month = {}
    total = 0.0
    for r in rows:
        cat = (r.get("category") or "other").lower()
        amt = float(r.get("amount") or 0)
        total += amt
        by_cat[cat] = by_cat.get(cat, 0) + amt
        m = r.get("date", "")[:7]
        by_month[m] = by_month.get(m, 0) + amt
    cats = sorted([{"category": k, "amount": round(v, 2)} for k, v in by_cat.items()], key=lambda x: -x["amount"])
    months = sorted([{"month": k, "amount": round(v, 2)} for k, v in by_month.items()], key=lambda x: x["month"])
    return {
        "from": f_iso, "to": t_iso, "label": label,
        "total": round(total, 2),
        "count": len(rows),
        "by_category": cats,
        "by_month": months,
        "expenses": rows,
    }

@api.get("/reports/business.xlsx")
async def business_xlsx(from_date: Optional[str] = Query(None, alias="from"), to_date: Optional[str] = Query(None, alias="to"), preset: Optional[str] = None, user: dict = Depends(get_current_user)):
    """One workbook, four sheets: Sales, GSTR-3B, Payment Modes, Expenses."""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from io import BytesIO

    sales   = await sales_report(from_date=from_date, to_date=to_date, preset=preset, user=user)
    gst     = await gstr3b_report(from_date=from_date, to_date=to_date, preset=preset, user=user)
    pay     = await payment_mode_report(from_date=from_date, to_date=to_date, preset=preset, user=user)
    exp     = await expense_report(from_date=from_date, to_date=to_date, preset=preset, user=user)

    wb = Workbook()
    settings = await _get_settings()
    park = settings.get("firm_name") or settings.get("park_name") or "Funland"

    def header(ws, cols):
        ws.append(cols)
        for c in ws[ws.max_row]:
            c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="FF7A00")

    # -- Sales --
    ws = wb.active; ws.title = "Sales"
    ws.append([f"{park} — Sales Report", sales["label"]]); ws["A1"].font = Font(bold=True, size=14)
    ws.append([f"Range: {sales['from']} → {sales['to']}"]); ws.append([])
    ws.append(["Total revenue", sales["total_revenue"]])
    ws.append(["Bills paid", sales["paid_bills"]])
    ws.append(["Bills pending", sales["pending_bills"]])
    ws.append(["Avg bill value", sales["avg_bill_value"]]); ws.append([])
    header(ws, ["Category", "Qty", "Taxable", "Tax", "Gross"])
    for cat, v in sales["category_totals"].items():
        ws.append([cat, v["count"], v["taxable"], v["tax"], v["gross"]])
    ws.append([]); header(ws, ["Date", "Revenue"])
    for d in sales["daily"]:
        ws.append([d["date"], d["revenue"]])
    ws.append([]); header(ws, ["Top item", "Qty sold"])
    for it in sales["top_items"]:
        ws.append([it["name"], it["qty"]])

    # -- GSTR-3B --
    ws2 = wb.create_sheet(title="GSTR-3B")
    ws2.append([f"{park} — GSTR-3B", gst["label"]]); ws2["A1"].font = Font(bold=True, size=14)
    ws2.append([f"Range: {gst['from']} → {gst['to']}"]); ws2.append([])
    ws2.append(["Invoices", gst["invoice_count"]])
    ws2.append(["Total taxable", gst["total_taxable"]])
    ws2.append(["Total CGST", gst["total_cgst"]])
    ws2.append(["Total SGST", gst["total_sgst"]])
    ws2.append(["Total IGST", gst["total_igst"]])
    ws2.append(["Total tax", gst["total_tax"]]); ws2.append([])
    header(ws2, ["Rate %", "Taxable value", "CGST", "SGST", "IGST"])
    for r in gst["rate_wise"]:
        ws2.append([r["rate"], r["taxable"], r["cgst"], r["sgst"], r["igst"]])

    # -- Payment modes --
    ws3 = wb.create_sheet(title="Payment Modes")
    ws3.append([f"{park} — Payment Mode Report", pay["label"]]); ws3["A1"].font = Font(bold=True, size=14)
    ws3.append([f"Range: {pay['from']} → {pay['to']}"]); ws3.append([])
    ws3.append(["Total collected (paid)", pay["total_paid"]])
    ws3.append(["Pending amount", pay["total_pending"]]); ws3.append([])
    header(ws3, ["Method", "Paid count", "Paid amount", "Pending count", "Pending amount"])
    for m in pay["modes"]:
        ws3.append([m["method"], m["paid_count"], m["paid_amount"], m["pending_count"], m["pending_amount"]])

    # -- Expenses --
    ws4 = wb.create_sheet(title="Expenses")
    ws4.append([f"{park} — Expense Report", exp["label"]]); ws4["A1"].font = Font(bold=True, size=14)
    ws4.append([f"Range: {exp['from']} → {exp['to']}"]); ws4.append([])
    ws4.append(["Total expenses", exp["total"]])
    ws4.append(["Entries", exp["count"]]); ws4.append([])
    header(ws4, ["Category", "Amount"])
    for c in exp["by_category"]:
        ws4.append([c["category"], c["amount"]])
    ws4.append([]); header(ws4, ["Date", "Category", "Description", "Vendor", "Method", "Ref", "Amount"])
    for e in exp["expenses"]:
        ws4.append([e.get("date",""), e.get("category",""), e.get("description",""), e.get("vendor",""), e.get("payment_method",""), e.get("payment_reference",""), e.get("amount",0)])

    for wsx in wb.worksheets:
        for col in wsx.columns:
            wsx.column_dimensions[col[0].column_letter].width = 18

    buf = BytesIO(); wb.save(buf)
    filename = f"business_report_{sales['from']}_{sales['to'][:10]}.xlsx".replace(" ", "_")
    return Response(content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'})



# ---------------- Marketing Reports ----------------
def _parse_range_yyyymmdd(from_date: Optional[str], to_date: Optional[str], preset: Optional[str]):
    """Return (from_iso, to_iso_exclusive, label) for use in Mongo string compare of created_at."""
    today = datetime.now(timezone.utc).date()
    if preset:
        p = preset.lower()
        if p == "today":
            f, t = today, today; label = "Today"
        elif p in ("week", "7d"):
            f, t = today - timedelta(days=6), today; label = "Last 7 days"
        elif p in ("month", "30d"):
            f, t = today - timedelta(days=29), today; label = "Last 30 days"
        elif p in ("year", "365d"):
            f, t = today - timedelta(days=364), today; label = "Last 12 months"
        elif p == "all":
            f, t = date(2020, 1, 1), today; label = "All time"
        else:
            f, t = today - timedelta(days=29), today; label = "Last 30 days"
    else:
        try:
            f = datetime.fromisoformat(from_date).date() if from_date else today - timedelta(days=29)
            t = datetime.fromisoformat(to_date).date() if to_date else today
        except Exception:
            f, t = today - timedelta(days=29), today
        label = f"{f} → {t}"
    return f.isoformat(), (t + timedelta(days=1)).isoformat(), label


@api.get("/marketing/report")
async def marketing_report(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    preset: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Per-executive marketing performance report in the given window.

    Returns each exec's: assigned, new, contacted, converted, lost, conversion_rate,
    remarks_added, avg_response_hours (time to first remark by that exec),
    source_breakdown, and a per-day trend."""
    f_iso, t_iso, label = _parse_range_yyyymmdd(from_date, to_date, preset)

    execs = await db.users.find({"is_marketing_exec": True}, {"_id": 0, "id": 1, "name": 1, "email": 1}).sort("name", 1).to_list(200)
    inquiries = await db.inquiries.find(
        {"created_at": {"$gte": f_iso, "$lt": t_iso}, "$or": [{"is_deleted": {"$exists": False}}, {"is_deleted": False}]},
        {"_id": 0}
    ).to_list(50000)

    per_exec = {e["id"]: {
        **e,
        "assigned": 0, "new": 0, "contacted": 0, "converted": 0, "lost": 0,
        "remarks_added": 0,
        "response_hours_sum": 0.0, "response_samples": 0,
        "source_breakdown": {},
        "day_trend": {},
    } for e in execs}
    unassigned = {"assigned": 0, "new": 0, "contacted": 0, "converted": 0, "lost": 0}
    totals = {"assigned": 0, "new": 0, "contacted": 0, "converted": 0, "lost": 0}

    for inq in inquiries:
        aid = inq.get("assigned_to")
        status_val = (inq.get("status") or "new").lower()
        bucket = per_exec.get(aid) if aid in per_exec else unassigned
        bucket["assigned"] = bucket.get("assigned", 0) + 1
        bucket[status_val] = bucket.get(status_val, 0) + 1
        totals["assigned"] += 1
        totals[status_val] = totals.get(status_val, 0) + 1
        if aid in per_exec:
            e = per_exec[aid]
            src = inq.get("source", "other") or "other"
            e["source_breakdown"][src] = e["source_breakdown"].get(src, 0) + 1
            day = (inq.get("created_at") or "")[:10]
            if day:
                d = e["day_trend"].setdefault(day, {"assigned": 0, "converted": 0})
                d["assigned"] += 1
                if status_val == "converted":
                    d["converted"] += 1
            remarks = inq.get("remarks") or []
            first_action = None
            for r in remarks:
                if r.get("by_id") == aid:
                    e["remarks_added"] += 1
                    if r.get("at") and (first_action is None or r["at"] < first_action):
                        first_action = r["at"]
            if first_action and inq.get("created_at"):
                try:
                    delta = datetime.fromisoformat(first_action.replace("Z", "+00:00")) - datetime.fromisoformat(inq["created_at"].replace("Z", "+00:00"))
                    hours = max(delta.total_seconds() / 3600.0, 0)
                    e["response_hours_sum"] += hours
                    e["response_samples"] += 1
                except Exception:
                    pass

    executives = []
    for e in per_exec.values():
        assigned = e["assigned"]
        converted = e.get("converted", 0)
        conv_rate = round((converted / assigned) * 100, 1) if assigned else 0.0
        avg_resp = round(e["response_hours_sum"] / e["response_samples"], 1) if e["response_samples"] else None
        trend = sorted([{"date": d, **v} for d, v in e["day_trend"].items()], key=lambda x: x["date"])
        executives.append({
            "id": e["id"], "name": e["name"], "email": e.get("email"),
            "assigned": assigned, "new": e.get("new", 0), "contacted": e.get("contacted", 0),
            "converted": converted, "lost": e.get("lost", 0),
            "conversion_rate": conv_rate,
            "remarks_added": e["remarks_added"],
            "avg_response_hours": avg_resp,
            "source_breakdown": e["source_breakdown"],
            "day_trend": trend,
        })
    executives.sort(key=lambda x: (-x["conversion_rate"], -x["assigned"]))

    totals["conversion_rate"] = round((totals["converted"] / totals["assigned"]) * 100, 1) if totals["assigned"] else 0.0
    return {
        "from": f_iso, "to": t_iso, "label": label,
        "executives": executives, "totals": totals, "unassigned": unassigned,
    }


@api.get("/marketing/report.xlsx")
async def marketing_report_xlsx(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    preset: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from io import BytesIO

    report = await marketing_report(from_date=from_date, to_date=to_date, preset=preset, user=user)
    wb = Workbook()
    ws = wb.active
    ws.title = "Summary"
    settings = await _get_settings()
    park = settings.get("firm_name") or settings.get("park_name") or "Funland"

    ws.append([f"{park} — Marketing Report", report.get("label", "")])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append([f"Range: {report['from']} to {report['to']}"])
    ws.append([])

    headers = ["Executive", "Email", "Assigned", "New", "Contacted", "Converted", "Lost", "Conv. Rate %", "Remarks", "Avg Response (hrs)"]
    ws.append(headers)
    for c in ws[ws.max_row]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="FF7A00")
        c.alignment = Alignment(horizontal="center")

    for e in report["executives"]:
        ws.append([
            e["name"], e.get("email", ""),
            e["assigned"], e["new"], e["contacted"], e["converted"], e["lost"],
            e["conversion_rate"], e["remarks_added"],
            e["avg_response_hours"] if e["avg_response_hours"] is not None else "—",
        ])
    t = report["totals"]
    ws.append([])
    ws.append(["TOTAL", "", t["assigned"], t.get("new", 0), t.get("contacted", 0), t.get("converted", 0), t.get("lost", 0), t.get("conversion_rate", 0), "", ""])
    for c in ws[ws.max_row]:
        c.font = Font(bold=True)
        c.fill = PatternFill("solid", fgColor="FFE5CC")

    for e in report["executives"]:
        sheet_name = (e["name"] or "Exec")[:28]
        try:
            ws2 = wb.create_sheet(title=sheet_name)
        except Exception:
            ws2 = wb.create_sheet(title=f"Exec-{report['executives'].index(e)}")
        ws2.append([e["name"]])
        ws2["A1"].font = Font(bold=True, size=13)
        ws2.append([])
        ws2.append(["Source", "Count"])
        for c in ws2[ws2.max_row]:
            c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="0080FF")
        for src, n in sorted(e["source_breakdown"].items(), key=lambda x: -x[1]):
            ws2.append([src, n])
        ws2.append([]); ws2.append([]); ws2.append(["Date", "Assigned", "Converted"])
        for c in ws2[ws2.max_row]:
            c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="0080FF")
        for d in e["day_trend"]:
            ws2.append([d["date"], d.get("assigned", 0), d.get("converted", 0)])
        for col in ws2.columns:
            ws2.column_dimensions[col[0].column_letter].width = 18

    for col in ws.columns:
        ws.column_dimensions[col[0].column_letter].width = 18

    buf = BytesIO()
    wb.save(buf)
    filename = f"marketing_report_{report['from']}_{report['to'][:10]}.xlsx".replace(" ", "_")
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------- Bills / Visits ----------------
# ---------------- GST helpers (Indian compliance) ----------------
GST_RATE_BY_CATEGORY = {
    "food": 5.0,          # restaurant / catering
    "activity": 18.0,     # amusement / rides
    "goods": 18.0,        # generic goods
    "room": 12.0,         # hotel room < 7500/night
    "clothing": 12.0,     # apparel > 1000
    "merchandise": 18.0,  # merchandise
    "other": 18.0,
}
HSN_BY_CATEGORY = {
    "food": "996331",
    "activity": "999721",
    "goods": "999799",
    "room": "996311",
    "clothing": "6109",
    "merchandise": "999799",
    "other": "999799",
}

def _resolve_line_gst(it: dict) -> (float, str, str):
    """Return (rate, hsn, category) for a bill line, filling from category/kind if missing."""
    rate = float(it.get("gst_percent") or 0)
    cat = (it.get("category") or "").lower()
    hsn = it.get("hsn_code") or ""
    if rate <= 0 and cat in GST_RATE_BY_CATEGORY:
        rate = GST_RATE_BY_CATEGORY[cat]
    if not hsn and cat in HSN_BY_CATEGORY:
        hsn = HSN_BY_CATEGORY[cat]
    if rate <= 0 and it.get("kind") == "game":
        # default for games/activities
        rate = 18.0
        cat = cat or "activity"
        hsn = hsn or HSN_BY_CATEGORY["activity"]
    return rate, hsn, cat

def _compute_bill_totals(items, discount, discount_percent, legacy_gst_percent, is_interstate: bool = False):
    """Compute subtotal / discount / GST breakup / total.
    - Each item can carry its own gst_percent (5% food, 18% activity).
    - GST is calculated on the taxable amount (after proportional discount).
    - Breakup groups by rate; splits into CGST/SGST (intra-state) or IGST (inter-state).
    Returns (subtotal, discount_amount, gst_amount, total, gst_breakup)."""
    subtotal = round(sum(i["price"] * i["qty"] for i in items), 2)
    if discount_percent and discount_percent > 0:
        pct = min(max(discount_percent, 0), 100)
        disc_amount = round(subtotal * pct / 100.0, 2)
    else:
        disc_amount = round(min(max(discount, 0), subtotal), 2)
    after_discount = max(subtotal - disc_amount, 0)
    ratio = (after_discount / subtotal) if subtotal > 0 else 0

    has_line_gst = any((i.get("gst_percent") or 0) > 0 for i in items)
    rate_map = {}   # rate -> {taxable, tax}
    gst_amount = 0.0

    if has_line_gst:
        for it in items:
            rate = float(it.get("gst_percent") or 0)
            line_gross = it["price"] * it["qty"]
            line_taxable = round(line_gross * ratio, 2)
            line_tax = round(line_taxable * rate / 100.0, 2)
            if rate > 0:
                slot = rate_map.setdefault(rate, {"taxable": 0.0, "tax": 0.0})
                slot["taxable"] = round(slot["taxable"] + line_taxable, 2)
                slot["tax"] = round(slot["tax"] + line_tax, 2)
                gst_amount += line_tax
        gst_amount = round(gst_amount, 2)
    elif legacy_gst_percent and legacy_gst_percent > 0:
        gst_amount = round(after_discount * (legacy_gst_percent / 100.0), 2)
        rate_map[float(legacy_gst_percent)] = {"taxable": after_discount, "tax": gst_amount}

    breakup = []
    for rate in sorted(rate_map.keys()):
        row = rate_map[rate]
        if is_interstate:
            breakup.append({
                "rate": rate,
                "taxable": row["taxable"],
                "cgst": 0.0, "sgst": 0.0,
                "igst": round(row["tax"], 2),
                "total_tax": round(row["tax"], 2),
            })
        else:
            half = round(row["tax"] / 2.0, 2)
            breakup.append({
                "rate": rate,
                "taxable": row["taxable"],
                "cgst": half,
                "sgst": round(row["tax"] - half, 2),
                "igst": 0.0,
                "total_tax": round(row["tax"], 2),
            })

    total = round(after_discount + gst_amount, 2)
    return subtotal, disc_amount, gst_amount, total, breakup

def _bill_number():
    return "FL-" + datetime.now(timezone.utc).strftime("%y%m%d") + "-" + uuid.uuid4().hex[:5].upper()

@api.get("/bills")
async def list_bills(user: dict = Depends(get_current_user)):
    return await db.bills.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api.get("/bills/{bid}")
async def get_bill(bid: str, user: dict = Depends(get_current_user)):
    b = await db.bills.find_one({"id": bid}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Bill not found")
    return b

@api.post("/bills")
async def create_bill(data: BillIn, user: dict = Depends(get_current_user)):
    # Expand package items into food/activity lines with proper GST rates
    raw_items = [i.model_dump() for i in data.items]
    expanded: List[dict] = []
    # Pre-fetch referenced game/package docs for HSN/category enrichment
    pkg_ids = {i.get("ref_id") for i in raw_items if i.get("kind") == "package" and i.get("ref_id")}
    game_ids = {i.get("ref_id") for i in raw_items if i.get("kind") == "game" and i.get("ref_id")}
    pkgs = {p["id"]: p for p in await db.packages.find({"id": {"$in": list(pkg_ids)}}, {"_id": 0}).to_list(500)} if pkg_ids else {}
    games = {g["id"]: g for g in await db.games.find({"id": {"$in": list(game_ids)}}, {"_id": 0}).to_list(500)} if game_ids else {}

    for it in raw_items:
        if it["kind"] == "package" and it.get("ref_id") and it["ref_id"] in pkgs:
            p = pkgs[it["ref_id"]]
            qty = it.get("qty", 1)
            splits = list(p.get("gst_split") or [])
            # Legacy migration: food_portion + activity_portion → 2-line split
            if not splits:
                fp = float(p.get("food_portion") or 0)
                ap = float(p.get("activity_portion") or 0)
                if fp > 0:
                    splits.append({"label": "Food", "category": "food", "amount": fp, "hsn_code": p.get("hsn_food")})
                if ap > 0:
                    splits.append({"label": "Activity", "category": "activity", "amount": ap, "hsn_code": p.get("hsn_activity")})
            if splits:
                for s in splits:
                    cat = (s.get("category") or "activity").lower()
                    rate = float(s.get("gst_percent") or GST_RATE_BY_CATEGORY.get(cat, 18.0))
                    hsn = s.get("hsn_code") or HSN_BY_CATEGORY.get(cat, "999721")
                    expanded.append({
                        "kind": "package", "ref_id": it["ref_id"],
                        "name": f"{it['name']} · {s.get('label') or cat.title()}",
                        "price": round(float(s.get("amount") or 0), 2),
                        "qty": qty,
                        "gst_percent": rate, "category": cat, "hsn_code": hsn,
                    })
                continue
            # Fallback — single-category package (default activity 18%)
            it["gst_percent"] = it.get("gst_percent") or 18.0
            it["category"] = it.get("category") or "activity"
            it["hsn_code"] = it.get("hsn_code") or HSN_BY_CATEGORY["activity"]
            expanded.append(it)
        elif it["kind"] == "game" and it.get("ref_id") and it["ref_id"] in games:
            g = games[it["ref_id"]]
            cat = (g.get("gst_category") or "activity").lower()
            it["gst_percent"] = it.get("gst_percent") or GST_RATE_BY_CATEGORY.get(cat, 18.0)
            it["category"] = it.get("category") or cat
            it["hsn_code"] = it.get("hsn_code") or (g.get("hsn_code") or HSN_BY_CATEGORY.get(cat, "999721"))
            expanded.append(it)
        else:
            # Custom line — fill category-derived defaults
            rate, hsn, cat = _resolve_line_gst(it)
            it["gst_percent"] = rate or it.get("gst_percent") or 0
            it["category"] = cat or it.get("category")
            it["hsn_code"] = hsn or it.get("hsn_code") or ""
            expanded.append(it)

    # Determine intra vs inter-state
    settings = await _get_settings()
    firm_sc = (settings.get("firm_state_code") or "").strip()
    cust_sc = (data.customer_state_code or "").strip()
    is_interstate = bool(firm_sc and cust_sc and firm_sc != cust_sc)

    subtotal, disc_amount, gst_amount, total, gst_breakup = _compute_bill_totals(
        expanded, data.discount, data.discount_percent, data.gst_percent, is_interstate
    )

    # Enforce digital payment audit trail — if paid via non-cash, checked_by + payment_reference are required
    _digital_methods = {"upi_qr", "razorpay", "card", "rtgs", "netbanking", "cheque"}
    if data.payment_status == "paid" and data.payment_method in _digital_methods:
        if not (data.checked_by or "").strip():
            raise HTTPException(400, "checked_by is compulsory for digital payments — batao kisne verify kiya")
        if not (data.payment_reference or "").strip():
            raise HTTPException(400, "payment_reference (txn id / UTR / RRN / cheque no) compulsory hai non-cash payments ke liye")

    doc = {
        "id": new_id(),
        "bill_no": (settings.get("invoice_prefix") or "") + _bill_number(),
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
        "customer_gstin": (data.customer_gstin or "").strip().upper(),
        "customer_state_code": cust_sc,
        "items": expanded,
        "discount": disc_amount,
        "discount_percent": data.discount_percent,
        "gst_percent": data.gst_percent,
        "gst_amount": gst_amount,
        "gst_breakup": gst_breakup,
        "is_interstate": is_interstate,
        "subtotal": subtotal,
        "total": total,
        "payment_method": data.payment_method,
        "payment_status": data.payment_status,
        "payment_reference": (data.payment_reference or "").strip(),
        "payment_at": (data.payment_at or "").strip() or (now_iso() if data.payment_status == "paid" else ""),
        "checked_by": (data.checked_by or "").strip(),
        "razorpay_link": None,
        "notes": data.notes,
        "created_by": user["id"],
        "created_by_name": user["name"],
        "created_at": now_iso(),
    }
    # Optional razorpay link
    if data.payment_method == "razorpay":
        link = await _create_razorpay_link(doc)
        if link:
            doc["razorpay_link"] = link
    await db.bills.insert_one(doc)
    # Upsert customer profile with history
    if data.customer_phone or data.customer_name:
        key = data.customer_phone or data.customer_name.lower()
        existing = await db.customers.find_one({"key": key})
        if existing:
            await db.customers.update_one({"key": key}, {"$set": {
                "name": data.customer_name,
                "phone": data.customer_phone,
                "email": data.customer_email or existing.get("email", ""),
                "last_visit": now_iso(),
            }, "$inc": {"visits": 1, "total_spent": doc["total"]}})
        else:
            await db.customers.insert_one({
                "id": new_id(),
                "key": key,
                "name": data.customer_name,
                "phone": data.customer_phone,
                "email": data.customer_email or "",
                "visits": 1,
                "total_spent": doc["total"],
                "first_visit": now_iso(),
                "last_visit": now_iso(),
            })
    doc.pop("_id", None)
    return doc

# ---------------- Customers ----------------
@api.get("/customers")
async def list_customers(user: dict = Depends(get_current_user)):
    return await db.customers.find({}, {"_id": 0}).sort("last_visit", -1).to_list(2000)

@api.get("/customers/{key}")
async def customer_detail(key: str, user: dict = Depends(get_current_user)):
    c = await db.customers.find_one({"$or": [{"id": key}, {"key": key}]}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Not found")
    bills = await db.bills.find({"$or": [{"customer_phone": c["key"]}, {"customer_name": c["name"]}]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"customer": c, "bills": bills}

@api.patch("/bills/{bid}/status")
async def update_bill_status(bid: str, payload: dict, user: dict = Depends(get_current_user)):
    ps = payload.get("payment_status")
    if ps not in ("pending", "paid"):
        raise HTTPException(400, "Invalid status")
    await db.bills.update_one({"id": bid}, {"$set": {"payment_status": ps}})
    return await db.bills.find_one({"id": bid}, {"_id": 0})

@api.post("/bills/{bid}/send")
async def send_bill(bid: str, data: SendBillIn, user: dict = Depends(get_current_user)):
    bill = await db.bills.find_one({"id": bid}, {"_id": 0})
    if not bill:
        raise HTTPException(404, "Bill not found")
    settings = await _get_settings()
    msg = _format_bill_message(bill, settings)
    result = await _send_message(data.channel, bill.get("customer_phone", ""), bill.get("customer_email", ""), f"Your Bill {bill['bill_no']} from {settings.get('park_name','Funland')}", msg)
    return {"ok": True, "delivery": result}

# ---------------- Prebookings (public + internal) ----------------
def _prebook_no():
    return "BK-" + datetime.now(timezone.utc).strftime("%y%m%d") + "-" + uuid.uuid4().hex[:5].upper()

@api.get("/prebook/catalog")
async def prebook_catalog():
    """Public: list of active games + packages for the booking page."""
    games = await db.games.find({"active": True}, {"_id": 0}).sort("name", 1).to_list(500)
    pkgs = await db.packages.find({"active": True}, {"_id": 0}).sort("name", 1).to_list(500)
    s = await _get_settings()
    return {
        "park_name": s.get("park_name", "Funland Adventure Park"),
        "phone": s.get("phone", ""),
        "address": s.get("address", ""),
        "upi_qr_url": s.get("upi_qr_url", ""),
        "upi_id": s.get("upi_id", ""),
        "games": games,
        "packages": pkgs,
    }

@api.post("/prebook")
async def create_prebook(data: PrebookIn):
    """Public: create a prebooking. Returns booking id + payment info."""
    if not data.items:
        raise HTTPException(400, "At least one item required")
    total = round(sum(i.price * i.qty for i in data.items), 2)
    doc = {
        "id": new_id(),
        "booking_no": _prebook_no(),
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email or "",
        "booking_date": data.booking_date,
        "booking_time": data.booking_time or "",
        "pax": data.pax,
        "items": [i.model_dump() for i in data.items],
        "total": total,
        "notes": data.notes or "",
        "source": data.source,
        "status": "pending",
        "payment_status": "pending",
        "razorpay_link": None,
        "created_at": now_iso(),
    }
    # Try to create Razorpay link
    fake_bill = {
        "total": total,
        "bill_no": doc["booking_no"],
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
    }
    link = await _create_razorpay_link(fake_bill)
    if link:
        doc["razorpay_link"] = link
    await db.prebookings.insert_one(doc)
    doc.pop("_id", None)
    logger.info(f"Prebooking created: {doc['booking_no']} for {data.customer_name}")
    return doc

@api.get("/prebook/{bid}")
async def get_prebook_public(bid: str):
    """Public: get a prebooking by id OR booking_no — customer link opens this."""
    b = await db.prebookings.find_one({"$or": [{"id": bid}, {"booking_no": bid.upper()}]}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Booking not found")
    s = await _get_settings()
    b["_park"] = {"name": s.get("park_name"), "upi_qr_url": s.get("upi_qr_url"), "upi_id": s.get("upi_id"), "phone": s.get("phone"), "address": s.get("address")}
    return b

@api.get("/prebookings")
async def list_prebookings(user: dict = Depends(get_current_user)):
    return await db.prebookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api.patch("/prebookings/{bid}/status")
async def update_prebook_status(bid: str, data: PrebookStatusUpdate, user: dict = Depends(get_current_user)):
    existing = await db.prebookings.find_one({"id": bid}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Booking not found")
    # Once a prebooking has been converted to a bill, only admins can further edit it
    if existing.get("converted_bill_id") and user.get("role") != "admin":
        raise HTTPException(403, "Locked — this prebooking has already been billed. Only admin can edit it now.")
    upd = {"status": data.status}
    if data.status == "paid":
        upd["payment_status"] = "paid"
    if data.status == "cancelled":
        upd["payment_status"] = "cancelled"
    await db.prebookings.update_one({"id": bid}, {"$set": upd})
    return await db.prebookings.find_one({"id": bid}, {"_id": 0})

@api.post("/prebookings/{bid}/convert")
async def convert_prebook_to_bill(bid: str, user: dict = Depends(get_current_user)):
    """Convert a prebooking into an actual bill on customer arrival."""
    b = await db.prebookings.find_one({"id": bid}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Booking not found")
    items = [{"kind": it["kind"], "ref_id": it.get("ref_id"), "name": it["name"], "price": it["price"], "qty": it["qty"], "gst_percent": 0, "category": None, "hsn_code": ""} for it in b.get("items", [])]
    subtotal, disc_amount, gst_amount, total, gst_breakup = _compute_bill_totals(items, 0, 0, 0, False)
    bill_doc = {
        "id": new_id(),
        "bill_no": _bill_number(),
        "customer_name": b["customer_name"],
        "customer_phone": b["customer_phone"],
        "customer_email": b.get("customer_email", ""),
        "customer_gstin": "",
        "customer_state_code": "",
        "items": items,
        "discount": 0, "discount_percent": 0,
        "gst_percent": 0, "gst_amount": gst_amount, "gst_breakup": gst_breakup, "is_interstate": False,
        "subtotal": subtotal, "total": total,
        "payment_method": "razorpay" if b.get("razorpay_link") else "cash",
        "payment_status": "paid" if b.get("payment_status") == "paid" else "pending",
        "razorpay_link": b.get("razorpay_link"),
        "notes": f"From prebooking {b['booking_no']}",
        "created_by": user["id"],
        "created_by_name": user["name"],
        "created_at": now_iso(),
        "prebooking_id": b["id"],
    }
    await db.bills.insert_one(bill_doc)
    await db.prebookings.update_one({"id": bid}, {"$set": {"status": "arrived", "converted_bill_id": bill_doc["id"]}})
    bill_doc.pop("_id", None)
    return bill_doc

@api.post("/prebook/{bid}/send")
async def send_prebook_link(bid: str, payload: dict, user: dict = Depends(get_current_user)):
    """Send prebooking link/QR to customer via WhatsApp/SMS/Email."""
    b = await db.prebookings.find_one({"id": bid}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Booking not found")
    channel = payload.get("channel", "whatsapp")
    frontend = os.environ.get("FRONTEND_URL", "").rstrip("/") or "https://game-package-tracker.preview.emergentagent.com"
    public_url = f"{frontend}/book/{b['booking_no']}"
    settings = await _get_settings()
    park = settings.get("park_name") or settings.get("firm_name") or "Funland Adventure Park"
    lines = [
        f"🎡 *{park}*",
        f"",
        f"Namaste {b['customer_name']}!",
        f"Aapki booking *{b['booking_no']}* confirm ho gayi ✅",
        f"Date: {b['booking_date']} {b.get('booking_time','')}",
        f"Amount: ₹{b['total']}",
        "",
        f"📋 View & Pay: {public_url}",
    ]
    if b.get("razorpay_link"):
        lines.append(f"💳 Pay online: {b['razorpay_link']}")
    if settings.get("upi_id"):
        lines.append(f"📲 UPI: {settings['upi_id']}")
    if settings.get("phone"):
        lines.append(f"📞 Contact: {settings['phone']}")
    lines.append("")
    lines.append("Thank you for choosing Funland! 🎉")
    msg = "\n".join(lines)
    res = await _send_message(channel, b.get("customer_phone", ""), b.get("customer_email", ""), f"{park} — Booking {b['booking_no']}", msg)
    return {"ok": True, "delivery": res, "public_url": public_url}

# ---------------- Attendance ----------------
@api.post("/attendance/checkin")
async def check_in(data: AttendanceCheckIn, user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    existing = await db.attendance.find_one({"user_id": user["id"], "date": today})
    if existing and existing.get("check_in"):
        raise HTTPException(400, "Already checked in today")
    doc = {
        "id": new_id(),
        "user_id": user["id"],
        "user_name": user["name"],
        "date": today,
        "check_in": now_iso(),
        "check_out": None,
        "notes": data.notes,
    }
    await db.attendance.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.post("/attendance/checkout")
async def check_out(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    rec = await db.attendance.find_one({"user_id": user["id"], "date": today})
    if not rec:
        raise HTTPException(400, "No check-in found for today")
    if rec.get("check_out"):
        raise HTTPException(400, "Already checked out today")
    await db.attendance.update_one({"id": rec["id"]}, {"$set": {"check_out": now_iso()}})
    return await db.attendance.find_one({"id": rec["id"]}, {"_id": 0})

@api.get("/attendance/me")
async def my_attendance(user: dict = Depends(get_current_user)):
    return await db.attendance.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).limit(60).to_list(60)

@api.get("/attendance/today")
async def today_attendance(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    rec = await db.attendance.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    return rec

@api.get("/attendance/all")
async def all_attendance(_: dict = Depends(require_admin), days: int = 30):
    since = (date.today() - timedelta(days=days)).isoformat()
    return await db.attendance.find({"date": {"$gte": since}}, {"_id": 0}).sort("date", -1).to_list(2000)

# ---------------- Settings ----------------
async def _get_settings():
    s = await db.settings.find_one({"id": "global"}, {"_id": 0})
    if not s:
        s = {
            "id": "global",
            "park_name": "Funland Adventure Park",
            "gst_rate": 0.0,
            "upi_qr_url": "",
            "upi_id": "",
            "phone": "",
            "address": "Indore, MP",
            "google_review_url": "",
            "google_reviews_shown": 0,
            "google_rating": 0.0,
            "firm_name": "",
            "firm_gstin": "",
            "firm_state_code": "23",
            "firm_pan": "",
            "firm_fssai": "",
            "invoice_prefix": "",
        }
        await db.settings.insert_one(s)
    # Backfill new fields for existing rows
    defaults = {
        "firm_name": s.get("park_name", ""),
        "firm_gstin": "",
        "firm_state_code": "23",
        "firm_pan": "",
        "firm_fssai": "",
        "invoice_prefix": "",
        "inquiry_webhook_secret": secrets.token_urlsafe(24),
        "meta_verify_token": secrets.token_urlsafe(16),
    }
    missing = {k: v for k, v in defaults.items() if k not in s or (k.endswith("_secret") or k.endswith("_token")) and not s.get(k)}
    if missing:
        await db.settings.update_one({"id": "global"}, {"$set": missing})
        s.update(missing)
    s.pop("_id", None)
    return s

async def _expand_shortlink(url: str) -> str:
    """Follow HTTP redirects for shortlinks and strip tracking params so QR encodes clean URL."""
    if not url or not url.startswith(("http://", "https://")):
        return url
    try:
        import httpx
        from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
        async with httpx.AsyncClient(follow_redirects=True, timeout=6.0, headers={"User-Agent": "Mozilla/5.0"}) as c:
            r = await c.get(url)
            final = str(r.url)
            if not final or final == url:
                return url
            # Strip tracking / referral params from the expanded URL
            parsed = urlparse(final)
            keep_params = []
            drop_prefixes = ("utm_", "g_st", "g_ep", "coh", "entry", "skid")
            drop_keys = {"utm_source", "utm_medium", "utm_campaign", "g_st", "g_ep", "coh", "entry", "skid", "authuser", "hl"}
            for k, v in parse_qsl(parsed.query, keep_blank_values=False):
                if k.lower() in drop_keys or any(k.lower().startswith(p) for p in drop_prefixes):
                    continue
                keep_params.append((k, v))
            cleaned = urlunparse(parsed._replace(query=urlencode(keep_params)))
            logger.info(f"Expanded {url} -> {cleaned}")
            return cleaned
    except Exception as e:
        logger.warning(f"Shortlink expand failed for {url}: {e}")
    return url

@api.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    return await _get_settings()

@api.patch("/settings")
async def update_settings(data: SettingsIn, _: dict = Depends(require_admin)):
    update = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    # Auto-expand Google review shortlink so QR + click always work
    if "google_review_url" in update and update["google_review_url"]:
        expanded = await _expand_shortlink(update["google_review_url"])
        update["google_review_url_original"] = update["google_review_url"]
        update["google_review_url"] = expanded
    if update:
        await db.settings.update_one({"id": "global"}, {"$set": update}, upsert=True)
    return await _get_settings()

# ---------------- Dashboard ----------------
@api.get("/dashboard/stats")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    today = date.today().isoformat()
    since_7 = (date.today() - timedelta(days=7)).isoformat()

    bills_today = await db.bills.find({"created_at": {"$gte": today}}, {"_id": 0}).to_list(2000)
    revenue_today = sum(b.get("total", 0) for b in bills_today if b.get("payment_status") == "paid")
    footfall_today = len(bills_today)

    bills_week = await db.bills.find({"created_at": {"$gte": since_7}}, {"_id": 0, "total": 1, "created_at": 1, "payment_status": 1}).to_list(5000)

    _not_deleted = {"$or": [{"is_deleted": {"$exists": False}}, {"is_deleted": False}]}
    inquiries_new = await db.inquiries.count_documents({"status": "new", **_not_deleted})
    total_inquiries = await db.inquiries.count_documents(_not_deleted)
    pending_bills = await db.bills.count_documents({"payment_status": "pending"})
    pending_prebookings = await db.prebookings.count_documents({"status": {"$in": ["pending", "confirmed"]}})

    trend = {}
    for i in range(7):
        d = (date.today() - timedelta(days=i)).isoformat()
        trend[d] = 0
    for b in bills_week:
        d = b["created_at"][:10]
        if d in trend and b.get("payment_status") == "paid":
            trend[d] += b.get("total", 0)
    trend_list = [{"date": d, "revenue": round(v, 2)} for d, v in sorted(trend.items())]

    pipeline_games = await db.bills.find({}, {"_id": 0, "items": 1}).to_list(5000)
    game_counts = {}
    package_counts = {}
    total_games_played = 0
    total_packages_sold = 0
    games_revenue = 0.0
    packages_revenue = 0.0
    for b in pipeline_games:
        for it in b.get("items", []):
            qty = it.get("qty", 1)
            line_total = float(it.get("price", 0)) * qty
            if it.get("kind") == "game":
                game_counts[it["name"]] = game_counts.get(it["name"], 0) + qty
                total_games_played += qty
                games_revenue += line_total
            elif it.get("kind") == "package":
                package_counts[it["name"]] = package_counts.get(it["name"], 0) + qty
                total_packages_sold += qty
                packages_revenue += line_total
    top_games = sorted([{"name": k, "count": v} for k, v in game_counts.items()], key=lambda x: -x["count"])[:5]
    top_packages = sorted([{"name": k, "count": v} for k, v in package_counts.items()], key=lambda x: -x["count"])[:5]

    return {
        "revenue_today": round(revenue_today, 2),
        "footfall_today": footfall_today,
        "inquiries_new": inquiries_new,
        "total_inquiries": total_inquiries,
        "pending_bills": pending_bills,
        "pending_prebookings": pending_prebookings,
        "revenue_trend": trend_list,
        "top_games": top_games,
        "top_packages": top_packages,
        "total_games_played": total_games_played,
        "total_packages_sold": total_packages_sold,
        "games_revenue": round(games_revenue, 2),
        "packages_revenue": round(packages_revenue, 2),
    }

@api.get("/dashboard/analytics")
async def dashboard_analytics(
    from_date: str,
    to_date: str,
    granularity: Literal["day", "week", "month", "year"] = "day",
    user: dict = Depends(get_current_user),
):
    """Aggregated revenue + footfall between [from_date, to_date] inclusive, bucketed by granularity."""
    try:
        d_from = datetime.strptime(from_date, "%Y-%m-%d").date()
        d_to = datetime.strptime(to_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Invalid date format, use YYYY-MM-DD")
    if d_to < d_from:
        raise HTTPException(400, "to_date must be >= from_date")

    # inclusive end-of-day
    to_boundary = (d_to + timedelta(days=1)).isoformat()

    bills = await db.bills.find(
        {"created_at": {"$gte": d_from.isoformat(), "$lt": to_boundary}},
        {"_id": 0, "total": 1, "created_at": 1, "payment_status": 1, "items": 1, "customer_phone": 1},
    ).to_list(50000)

    def bucket_key(iso_str: str) -> str:
        d = datetime.fromisoformat(iso_str.replace("Z", "+00:00")).date()
        if granularity == "day":
            return d.isoformat()
        if granularity == "week":
            iso = d.isocalendar()
            return f"{iso[0]}-W{iso[1]:02d}"
        if granularity == "month":
            return f"{d.year}-{d.month:02d}"
        return str(d.year)

    def all_buckets():
        cur = d_from
        seen = []
        while cur <= d_to:
            k = bucket_key(cur.isoformat())
            if not seen or seen[-1] != k:
                seen.append(k)
            cur = cur + timedelta(days=1)
        return seen

    buckets_ordered = all_buckets()
    revenue_map = {k: 0.0 for k in buckets_ordered}
    footfall_map = {k: 0 for k in buckets_ordered}
    games_map = {k: 0 for k in buckets_ordered}
    packages_map = {k: 0 for k in buckets_ordered}
    total_revenue = 0.0
    total_footfall = 0
    total_paid = 0
    total_pending = 0
    game_counts = {}
    package_counts = {}
    total_games_played = 0
    total_packages_sold = 0
    games_revenue = 0.0
    packages_revenue = 0.0

    for b in bills:
        k = bucket_key(b["created_at"])
        if k in footfall_map:
            footfall_map[k] += 1
            total_footfall += 1
        if b.get("payment_status") == "paid":
            amt = b.get("total", 0)
            if k in revenue_map:
                revenue_map[k] += amt
            total_revenue += amt
            total_paid += 1
        else:
            total_pending += 1
        for it in b.get("items", []):
            qty = it.get("qty", 1)
            line_total = float(it.get("price", 0)) * qty
            if it.get("kind") == "game":
                game_counts[it["name"]] = game_counts.get(it["name"], 0) + qty
                total_games_played += qty
                games_revenue += line_total
                if k in games_map:
                    games_map[k] += qty
            elif it.get("kind") == "package":
                package_counts[it["name"]] = package_counts.get(it["name"], 0) + qty
                total_packages_sold += qty
                packages_revenue += line_total
                if k in packages_map:
                    packages_map[k] += qty

    trend = [{"date": k, "revenue": round(revenue_map[k], 2), "footfall": footfall_map[k], "games_played": games_map[k], "packages_sold": packages_map[k]} for k in buckets_ordered]
    top_games = sorted([{"name": k, "count": v} for k, v in game_counts.items()], key=lambda x: -x["count"])[:5]
    top_packages = sorted([{"name": k, "count": v} for k, v in package_counts.items()], key=lambda x: -x["count"])[:5]
    unique_customers = len({b.get("customer_phone", "") for b in bills if b.get("customer_phone")})

    return {
        "from": from_date,
        "to": to_date,
        "granularity": granularity,
        "total_revenue": round(total_revenue, 2),
        "total_footfall": total_footfall,
        "unique_customers": unique_customers,
        "bills_paid": total_paid,
        "bills_pending": total_pending,
        "average_bill": round(total_revenue / total_paid, 2) if total_paid else 0,
        "total_games_played": total_games_played,
        "total_packages_sold": total_packages_sold,
        "games_revenue": round(games_revenue, 2),
        "packages_revenue": round(packages_revenue, 2),
        "trend": trend,
        "top_games": top_games,
        "top_packages": top_packages,
    }

# ---------------- Marketing ----------------
@api.get("/campaigns")
async def list_campaigns(_: dict = Depends(require_admin)):
    return await db.campaigns.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.post("/campaigns")
async def create_campaign(data: CampaignIn, admin: dict = Depends(require_admin)):
    # Determine audience phones
    phones: List[str] = []
    emails: List[str] = []
    if data.audience == "custom":
        phones = [p.strip() for p in data.custom_phones if p.strip()]
    elif data.audience == "all_customers":
        bills = await db.bills.find({}, {"_id": 0, "customer_phone": 1, "customer_email": 1}).to_list(5000)
        phones = list({b.get("customer_phone", "") for b in bills if b.get("customer_phone")})
        emails = list({b.get("customer_email", "") for b in bills if b.get("customer_email")})
    elif data.audience == "recent_customers":
        since = (date.today() - timedelta(days=30)).isoformat()
        bills = await db.bills.find({"created_at": {"$gte": since}}, {"_id": 0, "customer_phone": 1, "customer_email": 1}).to_list(5000)
        phones = list({b.get("customer_phone", "") for b in bills if b.get("customer_phone")})
        emails = list({b.get("customer_email", "") for b in bills if b.get("customer_email")})
    elif data.audience == "inquiries":
        inqs = await db.inquiries.find({"$or": [{"is_deleted": {"$exists": False}}, {"is_deleted": False}]}, {"_id": 0, "phone": 1, "email": 1}).to_list(5000)
        phones = list({i.get("phone", "") for i in inqs if i.get("phone")})
        emails = list({i.get("email", "") for i in inqs if i.get("email")})

    sent = 0
    failed = 0
    channel = data.channel
    if channel in ("instagram", "facebook"):
        # Save as content draft; social APIs not integrated
        sent = 0
    else:
        recipients = emails if channel == "email" else phones
        for r in recipients:
            res = await _send_message(channel, r if channel != "email" else "", r if channel == "email" else "", data.title, data.message)
            if res.get("ok"):
                sent += 1
            else:
                failed += 1

    doc = {
        "id": new_id(),
        "title": data.title,
        "channel": channel,
        "message": data.message,
        "image_url": data.image_url or "",
        "audience": data.audience,
        "target_count": len(emails) if channel == "email" else len(phones),
        "sent_count": sent,
        "failed_count": failed,
        "status": "draft" if channel in ("instagram", "facebook") else ("sent" if sent > 0 else "failed"),
        "created_by": admin["id"],
        "created_at": now_iso(),
    }
    await db.campaigns.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ---------------- Integrations ----------------
def _integrations_status():
    return {
        "razorpay": bool(os.environ.get("RAZORPAY_KEY_ID") and os.environ.get("RAZORPAY_KEY_SECRET")),
        "twilio_sms": bool(os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN") and os.environ.get("TWILIO_SMS_FROM")),
        "twilio_whatsapp": bool(os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN") and os.environ.get("TWILIO_WHATSAPP_FROM")),
        "resend": bool(os.environ.get("RESEND_API_KEY")),
    }

@api.get("/integrations/status")
async def integrations_status(user: dict = Depends(get_current_user)):
    return _integrations_status()

async def _create_razorpay_link(bill: dict) -> Optional[str]:
    kid = os.environ.get("RAZORPAY_KEY_ID")
    ksec = os.environ.get("RAZORPAY_KEY_SECRET")
    if not (kid and ksec):
        return None
    try:
        import razorpay
        rc = razorpay.Client(auth=(kid, ksec))
        link = rc.payment_link.create({
            "amount": int(round(bill["total"] * 100)),
            "currency": "INR",
            "accept_partial": False,
            "description": f"Funland Bill {bill['bill_no']}",
            "customer": {
                "name": bill.get("customer_name", ""),
                "contact": bill.get("customer_phone", ""),
                "email": bill.get("customer_email", "") or None,
            },
            "notify": {"sms": bool(bill.get("customer_phone")), "email": bool(bill.get("customer_email"))},
            "reminder_enable": True,
        })
        return link.get("short_url")
    except Exception as e:
        logger.error(f"Razorpay error: {e}")
        return None

def _format_bill_message(bill: dict, settings: dict) -> str:
    park = settings.get("park_name", "Funland Adventure Park")
    lines = [
        f"*{park}*",
        f"Bill: {bill['bill_no']}",
        f"Customer: {bill['customer_name']}",
    ]
    if bill.get("customer_gstin"):
        lines.append(f"GSTIN: {bill['customer_gstin']}")
    lines.append("")
    for it in bill["items"]:
        gst = it.get("gst_percent") or 0
        tag = f" [{int(gst)}%]" if gst else ""
        lines.append(f"- {it['name']}{tag} x{it['qty']}  ₹{round(it['price']*it['qty'], 2)}")
    lines.append("")
    lines.append(f"Subtotal: ₹{bill['subtotal']}")
    if bill.get("discount"):
        lines.append(f"Discount: -₹{bill['discount']}")
    for br in (bill.get("gst_breakup") or []):
        rate = br.get("rate", 0)
        if bill.get("is_interstate"):
            lines.append(f"IGST @{int(rate)}%: ₹{br.get('igst', 0)}")
        else:
            lines.append(f"CGST @{rate/2:g}% + SGST @{rate/2:g}% ({int(rate)}% on ₹{br.get('taxable',0)}): ₹{br.get('total_tax', 0)}")
    if not bill.get("gst_breakup") and bill.get("gst_amount"):
        lines.append(f"GST ({bill.get('gst_percent', 0)}%): ₹{bill['gst_amount']}")
    lines.append(f"*Total: ₹{bill['total']}*")
    lines.append(f"Status: {bill['payment_status'].upper()}")
    if bill.get("razorpay_link"):
        lines.append(f"Pay online: {bill['razorpay_link']}")
    if settings.get("upi_id"):
        lines.append(f"UPI: {settings['upi_id']}")
    lines.append("")
    lines.append("Thank you for visiting!")
    if settings.get("google_review_url"):
        lines.append(f"⭐ Rate us on Google: {settings['google_review_url']}")
    return "\n".join(lines)

async def _send_message(channel: str, phone: str, email: str, subject: str, message: str) -> dict:
    """Try to send via configured provider; otherwise return simulated=True."""
    try:
        if channel in ("sms", "whatsapp"):
            sid = os.environ.get("TWILIO_ACCOUNT_SID")
            tok = os.environ.get("TWILIO_AUTH_TOKEN")
            frm = os.environ.get("TWILIO_SMS_FROM") if channel == "sms" else os.environ.get("TWILIO_WHATSAPP_FROM")
            if not (sid and tok and frm and phone):
                logger.info(f"[SIMULATED {channel}] to={phone} msg={message[:80]}")
                return {"ok": True, "simulated": True, "channel": channel}
            from twilio.rest import Client as TwilioClient
            client_t = TwilioClient(sid, tok)
            to = f"whatsapp:{phone}" if channel == "whatsapp" else phone
            from_ = f"whatsapp:{frm}" if channel == "whatsapp" else frm
            m = client_t.messages.create(body=message, from_=from_, to=to)
            return {"ok": True, "sid": m.sid, "channel": channel}
        if channel == "email":
            key = os.environ.get("RESEND_API_KEY")
            if not (key and email):
                logger.info(f"[SIMULATED email] to={email} sub={subject}")
                return {"ok": True, "simulated": True, "channel": "email"}
            import resend
            resend.api_key = key
            r = resend.Emails.send({
                "from": os.environ.get("RESEND_FROM_EMAIL", "Funland <onboarding@resend.dev>"),
                "to": [email],
                "subject": subject,
                "text": message,
            })
            return {"ok": True, "id": r.get("id"), "channel": "email"}
    except Exception as e:
        logger.error(f"send_message {channel} failed: {e}")
        return {"ok": False, "error": str(e), "channel": channel}
    return {"ok": False, "error": "unknown_channel"}

# ---------------- Bootstrap ----------------
async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@funland.in").lower()
    pw = os.environ.get("ADMIN_PASSWORD", "Funland@123")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": new_id(),
            "email": email,
            "name": "Funland Manager",
            "phone": "",
            "role": "admin",
            "permissions": ALL_PERMS,
            "is_marketing_exec": False,
            "password_hash": hash_pw(pw),
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin: {email}")
    else:
        # Backfill missing fields for existing users
        upd = {}
        if "permissions" not in existing:
            upd["permissions"] = ALL_PERMS if existing.get("role") == "admin" else DEFAULT_EMP_PERMS
        if "is_marketing_exec" not in existing:
            upd["is_marketing_exec"] = False
        if upd:
            await db.users.update_one({"id": existing["id"]}, {"$set": upd})

async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.games.create_index("id", unique=True)
    await db.packages.create_index("id", unique=True)
    await db.inquiries.create_index("id", unique=True)
    await db.bills.create_index("id", unique=True)
    await db.attendance.create_index([("user_id", 1), ("date", 1)])
    await db.prebookings.create_index("id", unique=True)
    await db.prebookings.create_index("booking_no", unique=True)

import asyncio

async def _startup_async():
    """Non-blocking startup - runs in background so /api endpoints answer fast even on cold start."""
    try:
        await ensure_indexes()
        await seed_admin()
        await _get_settings()
        logger.info("Funland CRM background init complete")
    except Exception as e:
        logger.error(f"Startup init failed (will retry on demand): {e}")

@app.on_event("startup")
async def startup():
    # Kick off init in background - do NOT block the HTTP server
    asyncio.create_task(_startup_async())
    logger.info("Funland CRM listening (background init in progress)")

@app.on_event("shutdown")
async def shutdown():
    client.close()

@api.get("/")
async def root():
    return {"service": "Funland CRM", "status": "ok"}

@api.get("/ping")
async def ping():
    """Ultra-lightweight health probe used by frontend heartbeat."""
    try:
        # tiny mongodb touch — verifies DB is reachable
        await db.command("ping")
        return {"ok": True, "ts": now_iso()}
    except Exception as e:
        raise HTTPException(503, f"db unavailable: {e}")

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

```

---

## 3. BACKEND — requirements.txt
**File:** `backend/requirements.txt`

```txt
aiohappyeyeballs==2.7.1
aiohttp==3.14.2
aiohttp-retry==2.9.1
aiosignal==1.4.0
annotated-doc==0.0.4
annotated-types==0.7.0
anyio==4.14.2
ast_serialize==0.6.0
attrs==26.1.0
bcrypt==4.1.3
black==26.5.1
boto3==1.43.53
botocore==1.43.53
certifi==2026.7.22
cffi==2.1.0
charset-normalizer==3.4.9
click==8.4.2
cryptography==49.0.0
distro==1.9.0
dnspython==2.8.0
ecdsa==0.19.2
email-validator==2.3.0
emergentintegrations==0.2.0
et_xmlfile==2.0.0
execnet==2.1.2
fastapi==0.110.1
fastuuid==0.14.0
filelock==3.32.0
flake8==7.3.0
frozenlist==1.8.0
fsspec==2026.6.0
google-ai-generativelanguage==0.6.15
google-api-core==2.32.0
google-api-python-client==2.198.0
google-auth==2.56.2
google-auth-httplib2==0.4.0
google-genai==2.13.0
google-generativeai==0.8.6
googleapis-common-protos==1.75.0
grpcio==1.82.1
grpcio-status==1.71.2
h11==0.16.0
hf-xet==1.5.2
httpcore==1.0.9
httplib2==0.32.0
httpx==0.28.1
huggingface_hub==1.24.0
idna==3.18
importlib_metadata==9.0.0
iniconfig==2.3.0
isort==8.0.1
Jinja2==3.1.6
jiter==0.16.0
jmespath==1.1.0
jq==1.12.0
jsonschema==4.26.0
jsonschema-specifications==2025.9.1
librt==0.13.0
litellm @ https://customer-assets.emergentagent.com/internal-asset/library/litellm-1.80.0-py3-none-any.whl#sha256=adf398c513273de9341f61822296c6b2145f7f2dc4a69daf3ac04829f5bde3f8
markdown-it-py==4.2.0
MarkupSafe==3.0.3
mccabe==0.7.0
mdurl==0.1.2
motor==3.3.1
multidict==6.7.1
mypy==2.3.0
mypy_extensions==1.1.0
numpy==2.4.6
oauthlib==3.3.1
openai==1.99.9
openpyxl==3.1.5
packaging==26.2
pandas==3.0.3
passlib==1.7.4
pathspec==1.1.1
pillow==12.3.0
platformdirs==4.11.0
pluggy==1.6.0
propcache==0.5.2
proto-plus==1.28.1
protobuf==5.29.6
pyasn1==0.6.4
pyasn1_modules==0.4.2
pycodestyle==2.14.0
pycparser==3.0
pydantic==2.13.4
pydantic_core==2.46.4
pyflakes==3.4.0
Pygments==2.20.0
PyJWT==2.13.0
pymongo==4.6.3
pyparsing==3.3.2
pytest==9.1.1
pytest-xdist==3.8.0
python-dateutil==2.9.0.post0
python-dotenv==1.2.2
python-jose==3.5.0
python-multipart==0.0.32
pytokens==0.4.1
PyYAML==6.0.3
qrcode==8.2
razorpay==2.0.1
referencing==0.37.0
regex==2026.7.19
reportlab==5.0.0
requests==2.34.2
requests-oauthlib==2.0.0
resend==2.34.0
rich==15.0.0
rpds-py==2026.6.3
rsa==4.9.1
s3transfer==0.19.1
s5cmd==0.2.0
shellingham==1.5.4
six==1.17.0
sniffio==1.3.1
starlette==0.37.2
stripe==14.4.1
tenacity==9.1.4
tiktoken==0.13.0
tokenizers==0.23.1
tqdm==4.69.0
twilio==9.10.9
typer==0.27.0
typing-inspection==0.4.2
typing_extensions==4.16.0
tzdata==2026.3
uritemplate==4.2.0
urllib3==2.7.0
uvicorn==0.25.0
watchfiles==1.2.0
websockets==16.1.1
yarl==1.24.5
zipp==4.1.0

```

---

## 4. BACKEND — .env (redact keys before sharing)
**File:** `backend/.env`

```text
MONGO_URL=<redacted>
DB_NAME=<redacted>
CORS_ORIGINS=<redacted>
JWT_SECRET=<redacted>
ADMIN_EMAIL=<redacted>
ADMIN_PASSWORD=<redacted>
RAZORPAY_KEY_ID=<redacted>
RAZORPAY_KEY_SECRET=<redacted>
TWILIO_ACCOUNT_SID=<redacted>
TWILIO_AUTH_TOKEN=<redacted>
TWILIO_SMS_FROM=<redacted>
TWILIO_WHATSAPP_FROM=<redacted>
RESEND_API_KEY=<redacted>
RESEND_FROM_EMAIL=<redacted>
```

---

## 5. FRONTEND — package.json
**File:** `frontend/package.json`

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@capacitor/android": "7",
    "@capacitor/app": "7",
    "@capacitor/core": "7",
    "@capacitor/status-bar": "7",
    "@hookform/resolvers": "5.0.1",
    "@radix-ui/react-accordion": "1.2.8",
    "@radix-ui/react-alert-dialog": "1.1.11",
    "@radix-ui/react-aspect-ratio": "1.1.4",
    "@radix-ui/react-avatar": "1.1.7",
    "@radix-ui/react-checkbox": "1.2.3",
    "@radix-ui/react-collapsible": "1.1.8",
    "@radix-ui/react-context-menu": "2.2.12",
    "@radix-ui/react-dialog": "1.1.11",
    "@radix-ui/react-dropdown-menu": "2.1.12",
    "@radix-ui/react-hover-card": "1.1.11",
    "@radix-ui/react-label": "2.1.4",
    "@radix-ui/react-menubar": "1.1.12",
    "@radix-ui/react-navigation-menu": "1.2.10",
    "@radix-ui/react-popover": "1.1.11",
    "@radix-ui/react-progress": "1.1.4",
    "@radix-ui/react-radio-group": "1.3.4",
    "@radix-ui/react-scroll-area": "1.2.6",
    "@radix-ui/react-select": "2.2.2",
    "@radix-ui/react-separator": "1.1.4",
    "@radix-ui/react-slider": "1.3.2",
    "@radix-ui/react-slot": "1.2.0",
    "@radix-ui/react-switch": "1.2.2",
    "@radix-ui/react-tabs": "1.1.9",
    "@radix-ui/react-toast": "1.2.11",
    "@radix-ui/react-toggle": "1.1.6",
    "@radix-ui/react-toggle-group": "1.1.7",
    "@radix-ui/react-tooltip": "1.2.4",
    "@tanstack/react-query": "5.56.2",
    "axios": "1.18.0",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "cmdk": "1.1.1",
    "cra-template": "1.2.0",
    "date-fns": "4.1.0",
    "dayjs": "1.11.13",
    "embla-carousel-react": "8.6.0",
    "framer-motion": "11.18.0",
    "input-otp": "1.4.2",
    "lodash": "4.18.1",
    "lucide-react": "0.516.0",
    "next-themes": "0.4.6",
    "react": "19.0.0",
    "react-day-picker": "8.10.1",
    "react-dom": "19.0.0",
    "react-hook-form": "7.56.2",
    "react-qr-code": "^2.2.0",
    "react-resizable-panels": "3.0.1",
    "react-router-dom": "7.15.0",
    "react-scripts": "5.0.1",
    "recharts": "3.6.0",
    "sonner": "2.0.3",
    "swr": "2.3.8",
    "tailwind-merge": "3.2.0",
    "tailwindcss-animate": "1.0.7",
    "vaul": "1.1.2",
    "zod": "3.24.4"
  },
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@babel/plugin-proposal-private-property-in-object": "7.21.11",
    "@capacitor/cli": "7",
    "@craco/craco": "7.1.0",
    "@emergentbase/visual-edits": "https://assets.emergent.sh/npm/emergentbase-visual-edits-1.0.13.tgz",
    "@eslint/js": "9.23.0",
    "@types/lodash": "4.17.24",
    "autoprefixer": "10.4.20",
    "dotenv": "16.4.5",
    "eslint": "9.23.0",
    "eslint-plugin-import": "2.31.0",
    "eslint-plugin-jsx-a11y": "6.10.2",
    "eslint-plugin-react": "7.37.4",
    "eslint-plugin-react-hooks": "5.2.0",
    "globals": "15.15.0",
    "postcss": "8.5.10",
    "tailwindcss": "3.4.17"
  },
  "resolutions": {
    "react-router": "7.15.1",
    "node-forge": "1.4.0",
    "fast-uri": "3.1.2",
    "flatted": "3.4.2",
    "qs": "6.15.2",
    "diff": "4.0.4",
    "follow-redirects": "1.16.0",
    "path-to-regexp": "0.1.13",
    "rollup": "2.80.0",
    "underscore": "1.13.8",
    "@babel/plugin-transform-modules-systemjs": "7.29.4",
    "@eslint/plugin-kit": "0.3.4",
    "shell-quote": "1.9.0",
    "jsonpath": "1.3.0",
    "nth-check": "2.0.1",
    "serialize-javascript": "7.0.5",
    "uuid": "11.1.1",
    "@tootallnate/once": "2.0.1",
    "webpack-dev-server": "5.2.6",
    "resolve-url-loader": "5.0.0",
    "**/resolve-url-loader/postcss": "8.5.10",
    "**/axios/form-data": "4.0.6",
    "**/jsdom/form-data": "3.0.5",
    "**/postcss-svgo/svgo": "2.8.1",
    "**/webpack-dev-server/ws": "8.21.0",
    "**/postcss-load-config/yaml": "2.8.3",
    "**/cosmiconfig/yaml": "1.10.3",
    "**/cssnano/yaml": "1.10.3",
    "**/eslint/js-yaml": "4.3.0",
    "**/@eslint/eslintrc/js-yaml": "4.3.0",
    "**/svgo/js-yaml": "3.15.0",
    "**/@istanbuljs/load-nyc-config/js-yaml": "3.15.0",
    "**/css-loader/postcss": "8.5.10",
    "**/css-minimizer-webpack-plugin/postcss": "8.5.10",
    "**/react-scripts/postcss": "8.5.10",
    "**/filelist/minimatch": "5.1.8",
    "**/anymatch/picomatch": "2.3.2",
    "**/micromatch/picomatch": "2.3.2",
    "**/readdirp/picomatch": "2.3.2",
    "**/jest-util/picomatch": "2.3.2",
    "**/tinyglobby/picomatch": "4.0.4",
    "http-proxy-middleware": "2.0.10"
  },
  "packageManager": "yarn@1.22.22+sha512.a6b2f7906b721bba3d67d4aff083df04dad64c399707841b7acf00f6b133b7ac24255f2652fa22ae3534329dc6180534e98d17432037ff6fd140556e2bb3137e"
}

```

---

## 6. FRONTEND — .env
**File:** `frontend/.env`

```text
REACT_APP_BACKEND_URL=<redacted>
WDS_SOCKET_PORT=<redacted>
ENABLE_HEALTH_CHECK=<redacted>
```

---

## 7. FRONTEND — App.js
**File:** `frontend/src/App.js`

```javascript
import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inquiries from "@/pages/Inquiries";
import Games from "@/pages/Games";
import Packages from "@/pages/Packages";
import NewVisit from "@/pages/NewVisit";
import { BillsList, BillDetail } from "@/pages/Bills";
import Attendance from "@/pages/Attendance";
import Staff from "@/pages/Staff";
import Marketing from "@/pages/Marketing";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import { CustomersList, CustomerDetail } from "@/pages/Customers";
import PrintBill from "@/pages/PrintBill";
import Prebookings from "@/pages/Prebookings";
import { PublicBook, PublicBookConfirm } from "@/pages/PublicBook";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConnectionStatus from "@/components/ConnectionStatus";
import InstallPWA from "@/components/InstallPWA";
import { Loader2 } from "lucide-react";

function Protected({ children, adminOnly, perm }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (perm && !isAdmin && !(user.permissions || []).includes(perm)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  // Warm-up ping the backend as soon as the app opens so cold-start latency is hidden
  useEffect(() => {
    api.get("/health").catch(() => {});
    // Keep-alive ping every 4 min so backend stays warm during active use
    const t = setInterval(() => { api.get("/health").catch(() => {}); }, 4 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <ConnectionStatus />
          <InstallPWA />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/book" element={<PublicBook />} />
            <Route path="/book/:id" element={<PublicBookConfirm />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/prebookings" element={<Protected perm="prebookings"><Prebookings /></Protected>} />
            <Route path="/inquiries" element={<Protected perm="inquiries"><Inquiries /></Protected>} />
            <Route path="/visit" element={<Protected perm="visit"><NewVisit /></Protected>} />
            <Route path="/bills" element={<Protected perm="bills"><BillsList /></Protected>} />
            <Route path="/bills/:id" element={<Protected perm="bills"><BillDetail /></Protected>} />
            <Route path="/bills/:id/print" element={<PrintBill />} />
            <Route path="/customers" element={<Protected perm="customers"><CustomersList /></Protected>} />
            <Route path="/customers/:key" element={<Protected perm="customers"><CustomerDetail /></Protected>} />
            <Route path="/games" element={<Protected perm="games"><Games /></Protected>} />
            <Route path="/packages" element={<Protected perm="packages"><Packages /></Protected>} />
            <Route path="/attendance" element={<Protected perm="attendance"><Attendance /></Protected>} />
            <Route path="/staff" element={<Protected adminOnly><Staff /></Protected>} />
            <Route path="/marketing" element={<Protected adminOnly><Marketing /></Protected>} />
            <Route path="/reports" element={<Protected adminOnly><Reports /></Protected>} />
            <Route path="/settings" element={<Protected adminOnly><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

```

---

## 8. FRONTEND — App.css
**File:** `frontend/src/App.css`

```css
.App { min-height: 100vh; }

```

---

## 9. FRONTEND — index.css
**File:** `frontend/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,600;9..144,800&display=swap');

body {
    margin: 0;
    font-family: 'Nunito', ui-sans-serif, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

@layer base {
    :root {
        --background: 210 100% 97%;
        --foreground: 216 65% 11%;
        --card: 0 0% 100%;
        --card-foreground: 216 65% 11%;
        --popover: 0 0% 100%;
        --popover-foreground: 216 65% 11%;
        --primary: 43 100% 51%;
        --primary-foreground: 216 65% 11%;
        --secondary: 192 70% 43%;
        --secondary-foreground: 0 0% 100%;
        --muted: 204 100% 94%;
        --muted-foreground: 215 19% 35%;
        --accent: 28 100% 49%;
        --accent-foreground: 0 0% 100%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 0 0% 98%;
        --border: 204 100% 86%;
        --input: 204 60% 92%;
        --ring: 28 100% 49%;
        --chart-1: 28 100% 49%;
        --chart-2: 192 70% 43%;
        --chart-3: 43 100% 51%;
        --chart-4: 155 65% 45%;
        --chart-5: 340 75% 55%;
        --radius: 0.75rem;
    }
}

@layer base {
    * { @apply border-border; }
    body { @apply bg-background text-foreground; }
    h1, h2, h3, h4 { font-family: 'Fraunces', 'Nunito', serif; letter-spacing: -0.02em; }
}

@layer base {
    [data-debug-wrapper="true"] { display: contents !important; }
    [data-debug-wrapper="true"] > * {
        margin-left: inherit; margin-right: inherit; margin-top: inherit; margin-bottom: inherit;
        padding-left: inherit; padding-right: inherit; padding-top: inherit; padding-bottom: inherit;
        column-gap: inherit; row-gap: inherit; gap: inherit;
        border-left-width: inherit; border-right-width: inherit; border-top-width: inherit; border-bottom-width: inherit;
        border-left-style: inherit; border-right-style: inherit; border-top-style: inherit; border-bottom-style: inherit;
        border-left-color: inherit; border-right-color: inherit; border-top-color: inherit; border-bottom-color: inherit;
    }
}

/* Custom decorative pattern for park vibe */
.confetti-bg {
    background-image:
        radial-gradient(circle at 12% 24%, hsl(43 100% 51% / 0.18) 0 6px, transparent 7px),
        radial-gradient(circle at 82% 12%, hsl(192 70% 43% / 0.18) 0 5px, transparent 6px),
        radial-gradient(circle at 44% 88%, hsl(28 100% 49% / 0.18) 0 5px, transparent 6px),
        radial-gradient(circle at 92% 78%, hsl(340 75% 55% / 0.15) 0 4px, transparent 5px);
}

.stagger > * { animation: fade-in-up 0.4s ease-out both; }
.stagger > *:nth-child(1) { animation-delay: 0.04s; }
.stagger > *:nth-child(2) { animation-delay: 0.08s; }
.stagger > *:nth-child(3) { animation-delay: 0.12s; }
.stagger > *:nth-child(4) { animation-delay: 0.16s; }
.stagger > *:nth-child(5) { animation-delay: 0.20s; }
.stagger > *:nth-child(6) { animation-delay: 0.24s; }

```

---

## 10. FRONTEND — auth.jsx
**File:** `frontend/src/lib/auth.jsx`

```jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("funland_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const refresh = (background = false) =>
    api.get("/auth/me", { _background: background })
      .then((r) => {
        setUser(r.data);
        localStorage.setItem("funland_user", JSON.stringify(r.data));
      })
      .catch((err) => {
        // Only clear session on explicit 401 during INITIAL foreground load
        if (!background && err?.response?.status === 401) {
          localStorage.removeItem("funland_token");
          localStorage.removeItem("funland_user");
          setUser(null);
        }
        // Silent fail on network hiccups so PWA stays usable offline
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    const token = localStorage.getItem("funland_token");
    if (!token) { setLoading(false); return; }
    refresh(false);
    // Re-sync permissions on window focus (silent — won't logout on failure)
    const onFocus = () => { if (localStorage.getItem("funland_token")) refresh(true); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("funland_token", data.token);
    localStorage.setItem("funland_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("funland_token");
    localStorage.removeItem("funland_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh: () => refresh(true), isAdmin: user?.role === "admin" }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

```

---

## 11. FRONTEND — api.js
**File:** `frontend/src/lib/api.js`

```javascript
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 30000, // 30s ceiling — don't hang forever
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("funland_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Simple retry helper for GETs on transient network errors
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const cfg = err.config || {};
    const status = err?.response?.status;
    const isNetwork = !err.response; // no response = network drop / timeout
    const method = (cfg.method || "get").toLowerCase();

    // Auto-retry GETs on network errors up to 2 times with backoff
    if (isNetwork && method === "get" && (cfg._retryCount || 0) < 2) {
      cfg._retryCount = (cfg._retryCount || 0) + 1;
      await new Promise((r) => setTimeout(r, 500 * cfg._retryCount));
      return api(cfg);
    }

    // 401: token invalid/expired -> only redirect on user-initiated requests, not background auth checks
    if (status === 401) {
      const isBackgroundAuth = cfg.url && cfg.url.endsWith("/auth/me") && cfg._background;
      if (!isBackgroundAuth && window.location.pathname !== "/login") {
        localStorage.removeItem("funland_token");
        localStorage.removeItem("funland_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export const fmtErr = (e) => {
  if (!e?.response) return "Network problem — checking connection…";
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(", ");
  return e?.message || "Something went wrong";
};

export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

```

---

## 12. FRONTEND — clipboard.js
**File:** `frontend/src/lib/clipboard.js`

```javascript
/**
 * Robust clipboard copy that works across:
 * - Modern browsers (uses navigator.clipboard.writeText)
 * - PWAs / iframes / older browsers (falls back to document.execCommand)
 * - Insecure / permission-blocked contexts (shows prompt fallback)
 * Returns true on success, false if fallback prompt was shown.
 */
export async function copyToClipboard(text) {
  const value = String(text || "");
  // Try modern async API first
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      // fall through to legacy
    }
  }
  // Legacy fallback via hidden textarea + execCommand
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return true;
  } catch (_) {
    // Both methods failed — final fallback below
  }
  // Final fallback: show the text so user can copy manually
  try { window.prompt("Copy manually (Ctrl+C):", value); } catch (_) { /* ignore */ }
  return false;
}

```

---

## 13. FRONTEND — reliability.js
**File:** `frontend/src/lib/reliability.js`

```javascript
/**
 * Reliability layer for Funland CRM:
 * 1. Register service worker for offline shell
 * 2. Auto-reload on chunk load errors (stale bundle after deploy)
 * 3. Global unhandled error / promise rejection catcher (logs, prevents crash)
 * 4. Backend heartbeat ping every 45s → sets navigator-like offline state
 */
import { api } from "@/lib/api";

let backendOnline = true;
const listeners = new Set();

export function onBackendStatusChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function isBackendOnline() { return backendOnline; }

const setStatus = (v) => {
  if (backendOnline === v) return;
  backendOnline = v;
  listeners.forEach((l) => { try { l(v); } catch { /* ignore */ } });
};

async function ping() {
  try {
    const r = await api.get("/ping", { timeout: 8000, _background: true });
    setStatus(r.status === 200);
  } catch {
    setStatus(false);
  }
}

export function startReliability() {
  // 1. Register service worker (PWA offline shell)
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch(() => { /* silent */ });
    });
  }

  // 2. Auto-reload on chunk load errors (happens when new deploy invalidates old chunks)
  const chunkErrRe = /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module/i;
  window.addEventListener("error", (e) => {
    const msg = String(e?.message || e?.error?.message || "");
    if (chunkErrRe.test(msg)) {
      // eslint-disable-next-line no-console
      console.warn("[reliability] chunk load error, hard-reloading");
      try { window.location.reload(); } catch { /* ignore */ }
    }
  });

  // 3. Global unhandled promise rejection catcher — prevents silent freezes
  window.addEventListener("unhandledrejection", (e) => {
    // eslint-disable-next-line no-console
    console.warn("[reliability] unhandled rejection:", e?.reason);
    // Don't crash the app — just log
    e.preventDefault?.();
  });

  // 4. Heartbeat: check backend every 45s (only when logged in)
  const heartbeat = () => {
    if (localStorage.getItem("funland_token")) ping();
  };
  heartbeat(); // immediate
  setInterval(heartbeat, 45000);

  // Recheck on tab focus + on network back
  window.addEventListener("focus", heartbeat);
  window.addEventListener("online", heartbeat);
}

```

---

## 14. FRONTEND — Layout
**File:** `frontend/src/components/Layout.jsx`

```jsx
import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, MessageSquare, Gamepad2, PartyPopper, Receipt,
  UserCheck, Users, Megaphone, Settings as SettingsIcon, LogOut, Menu, X, Contact, CalendarCheck, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", perm: "dashboard" },
  { to: "/prebookings", label: "Prebookings", icon: CalendarCheck, testid: "nav-prebookings", perm: "prebookings" },
  { to: "/inquiries", label: "Inquiries", icon: MessageSquare, testid: "nav-inquiries", perm: "inquiries" },
  { to: "/visit", label: "New Bill", icon: Receipt, testid: "nav-visit", perm: "visit" },
  { to: "/bills", label: "Bills", icon: Receipt, testid: "nav-bills", perm: "bills" },
  { to: "/customers", label: "Customers", icon: Contact, testid: "nav-customers", perm: "customers" },
  { to: "/games", label: "Items / Activities", icon: Gamepad2, testid: "nav-games", perm: "games" },
  { to: "/packages", label: "Packages", icon: PartyPopper, testid: "nav-packages", perm: "packages" },
  { to: "/attendance", label: "Attendance", icon: UserCheck, testid: "nav-attendance", perm: "attendance" },
  { to: "/staff", label: "Staff", icon: Users, testid: "nav-staff", perm: "staff", adminOnly: true },
  { to: "/marketing", label: "Marketing", icon: Megaphone, testid: "nav-marketing", perm: "marketing", adminOnly: true },
  { to: "/reports", label: "Reports", icon: BarChart3, testid: "nav-reports", perm: "reports", adminOnly: true },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testid: "nav-settings", perm: "settings", adminOnly: true },
];

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const perms = user?.permissions || [];
  const items = NAV.filter((n) => isAdmin ? true : perms.includes(n.perm) && !n.adminOnly);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-white">
        <BrandHeader />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((n) => <NavItem key={n.to} item={n} current={loc.pathname === n.to} />)}
        </nav>
        <UserFooter user={user} onLogout={logout} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)}>
          <aside className="w-72 h-full bg-white flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <BrandHeader onClose={() => setOpen(false)} />
            <nav className="flex-1 px-3 py-4 space-y-1">
              {items.map((n) => <NavItem key={n.to} item={n} current={loc.pathname === n.to} onClick={() => setOpen(false)} />)}
            </nav>
            <UserFooter user={user} onLogout={logout} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-white sticky top-0 z-30">
          <button data-testid="mobile-menu-btn" onClick={() => setOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted"><Menu className="h-6 w-6" /></button>
          <div className="font-black text-lg tracking-tight">
            <span className="text-accent">Fun</span><span className="text-secondary">land</span>
          </div>
          <div className="w-10" />
        </header>
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function BrandHeader({ onClose }) {
  return (
    <div className="h-20 px-6 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="Funland" className="w-10 h-10 rounded-xl border border-border object-contain bg-white shadow-sm" />
        <div>
          <div className="font-black text-lg leading-none tracking-tight">
            <span className="text-accent">Fun</span><span className="text-secondary">land</span>
          </div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Indore CRM</div>
        </div>
      </div>
      {onClose && <button onClick={onClose} data-testid="mobile-menu-close" className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>}
    </div>
  );
}

function NavItem({ item, current, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} onClick={onClick} data-testid={item.testid}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${current ? "bg-accent text-accent-foreground shadow-sm" : "text-foreground hover:bg-muted hover:text-secondary"}`}>
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </NavLink>
  );
}

function UserFooter({ user, onLogout }) {
  return (
    <div className="border-t border-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black">
        {user?.name?.[0]?.toUpperCase() || "U"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate" data-testid="current-user-name">{user?.name}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{user?.role}</div>
      </div>
      <Button variant="ghost" size="icon" onClick={onLogout} data-testid="logout-btn"><LogOut className="h-5 w-5" /></Button>
    </div>
  );
}

```

---

## 15. FRONTEND — ErrorBoundary
**File:** `frontend/src/components/ErrorBoundary.jsx`

```jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App error boundary:", error, info);
  }
  reset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-black mb-2">Kuch galat ho gaya</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Screen crash ho gayi. Aapka data safe hai — bas refresh karke wapas try karo.
            </p>
            <Button onClick={this.reset} data-testid="error-reload" className="rounded-full bg-accent hover:bg-accent/90 font-black h-11 px-6">
              <RefreshCw className="h-4 w-4 mr-2" /> Reload App
            </Button>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">Technical details</summary>
                <pre className="text-xs mt-2 p-3 bg-muted rounded-lg overflow-auto max-h-40">{String(this.state.error?.message || this.state.error)}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

```

---

## 16. FRONTEND — Page
**File:** `frontend/src/components/Page.jsx`

```jsx
import React from "react";

export function PageHead({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2">Funland CRM</div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 text-sm md:text-base">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center bg-white/50">
      <div className="text-lg font-bold mb-1">{title}</div>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {action}
    </div>
  );
}

```

---

## 17. FRONTEND — InstallPWA
**File:** `frontend/src/components/InstallPWA.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, X } from "lucide-react";

/**
 * Prominent Install PWA button.
 * - On Android/Chrome: captures beforeinstallprompt and shows one-tap install
 * - On iOS Safari: shows "Share → Add to Home Screen" instructions
 * - Hides itself when already installed (running in standalone) or dismissed
 */
export default function InstallPWA() {
  const [deferred, setDeferred] = useState(null);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("funland_install_dismissed") === "1");

  useEffect(() => {
    // Detect already-installed (running from home screen)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isStandalone) { setInstalled(true); return; }

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else if (isIOS) {
      setShowIOSHelp(true);
    } else {
      setShowIOSHelp(true); // Show generic manual instructions
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem("funland_install_dismissed", "1");
  };

  if (installed || dismissed) return null;

  return (
    <>
      <div data-testid="install-pwa-banner" className="fixed bottom-4 left-4 right-4 z-40 md:bottom-6 md:left-auto md:right-6 md:w-80 bg-white border-2 border-accent rounded-2xl shadow-xl p-4 flex items-start gap-3 animate-fade-in-up">
        <div className="w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm">Install Funland App</div>
          <div className="text-xs text-muted-foreground mb-3">Home screen pe icon banao — native app jaisa experience</div>
          <div className="flex gap-2">
            <Button data-testid="install-pwa-btn" onClick={install} className="rounded-full bg-accent hover:bg-accent/90 h-9 px-4 font-bold text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Install
            </Button>
            <Button data-testid="install-pwa-later" onClick={dismiss} variant="ghost" className="rounded-full h-9 px-3 text-xs">Later</Button>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIOSHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowIOSHelp(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="h-6 w-6 text-accent" />
              <div className="font-black text-lg">Install manually</div>
            </div>
            {isIOS ? (
              <ol className="space-y-3 text-sm">
                <li><span className="font-bold text-accent">1.</span> Safari me neeche <b>Share</b> button (⬆️ arrow) tap karo</li>
                <li><span className="font-bold text-accent">2.</span> Scroll down → <b>"Add to Home Screen"</b> tap karo</li>
                <li><span className="font-bold text-accent">3.</span> <b>Add</b> confirm karo — home screen pe Funland icon aa jayega 🎡</li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm">
                <li><span className="font-bold text-accent">1.</span> Chrome me right-upar <b>⋮ (3 dots)</b> menu tap karo</li>
                <li><span className="font-bold text-accent">2.</span> <b>"Install app"</b> ya <b>"Add to Home Screen"</b> tap karo</li>
                <li><span className="font-bold text-accent">3.</span> <b>Install</b> confirm karo — home screen pe icon aa jayega 🎡</li>
              </ol>
            )}
            <Button onClick={() => setShowIOSHelp(false)} className="w-full mt-5 rounded-full bg-accent hover:bg-accent/90 font-bold">Got it</Button>
          </div>
        </div>
      )}
    </>
  );
}

```

---

## 18. FRONTEND — UpiPayBlock
**File:** `frontend/src/components/UpiPayBlock.jsx`

```jsx
import React from "react";
import { QrCode as QrIcon, Copy, IndianRupee } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

/**
 * UpiPayBlock — a single reusable UPI/QR payment card.
 * Renders the merchant's uploaded QR image if available, else generates a UPI intent QR live.
 * Props:
 *  - settings: {upi_id, upi_qr_url, park_name, firm_name, phone}
 *  - amount: number (optional — if given, encodes am= in UPI intent + shows amount)
 *  - variant: "full" (default) | "compact" | "print"
 *  - note: optional string appended to UPI intent tn= param (e.g. bill_no)
 */
export default function UpiPayBlock({ settings, amount = 0, variant = "full", note = "" }) {
  if (!settings) return null;
  const upiId = settings.upi_id;
  const qrUrl = settings.upi_qr_url;
  const payeeName = settings.firm_name || settings.park_name || "Funland";
  const phone = settings.phone;
  if (!upiId && !qrUrl) return null;

  // Build UPI intent URI (used as fallback QR + as clickable link on mobile)
  const upiIntent = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}` +
      (amount > 0 ? `&am=${Number(amount).toFixed(2)}` : "") +
      `&cu=INR` +
      (note ? `&tn=${encodeURIComponent(note.slice(0, 40))}` : "")
    : null;

  const copyUpi = async () => {
    if (!upiId) return;
    const ok = await copyToClipboard(upiId);
    ok ? toast.success("UPI ID copied") : toast.error("Copy failed");
  };

  const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  if (variant === "print") {
    // Optimised for 80mm thermal receipts — pure black/white, no shadows
    return (
      <div className="mt-3 border-t border-dashed border-black pt-2 text-center" data-testid="upi-pay-block-print">
        <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Pay via UPI</div>
        <div className="inline-block p-1 bg-white">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI QR" style={{ width: 120, height: 120, objectFit: "contain" }} />
          ) : upiIntent ? (
            <QRCode value={upiIntent} size={120} />
          ) : null}
        </div>
        {upiId && <div className="text-[10px] mt-1"><b>UPI:</b> {upiId}</div>}
        {payeeName && <div className="text-[10px]">{payeeName}</div>}
        {phone && <div className="text-[10px]">{phone}</div>}
        {amount > 0 && <div className="text-[11px] font-bold">Amount: {inr(amount)}</div>}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5" data-testid="upi-pay-block-compact">
        <div className="w-16 h-16 flex-shrink-0 bg-white p-1 rounded-lg border">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI QR" className="w-full h-full object-contain" />
          ) : upiIntent ? (
            <QRCode value={upiIntent} size={56} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest font-bold text-secondary">UPI Payment</div>
          <div className="text-sm font-black truncate">{payeeName}</div>
          {upiId && (
            <button onClick={copyUpi} className="text-xs font-bold text-primary hover:underline flex items-center gap-1" data-testid="upi-copy-id">
              {upiId} <Copy className="h-3 w-3" />
            </button>
          )}
          {amount > 0 && <div className="text-xs font-bold flex items-center"><IndianRupee className="h-3 w-3" />{amount.toFixed(2)}</div>}
        </div>
      </div>
    );
  }

  // full
  return (
    <div className="p-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5" data-testid="upi-pay-block">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-secondary">Pay via UPI / QR</div>
          <div className="text-lg font-black">{payeeName}</div>
        </div>
        <QrIcon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-40 h-40 bg-white p-2 rounded-xl border shadow-sm flex-shrink-0">
          {qrUrl ? (
            <img src={qrUrl} alt="UPI QR" className="w-full h-full object-contain" data-testid="upi-qr-img" />
          ) : upiIntent ? (
            <QRCode value={upiIntent} size={144} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          {upiId && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">UPI ID</div>
              <button onClick={copyUpi} className="text-base font-black text-primary hover:underline break-all flex items-center gap-1" data-testid="upi-id-btn">
                {upiId} <Copy className="h-3 w-3" />
              </button>
            </div>
          )}
          {phone && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Phone</div>
              <div className="text-sm font-bold">{phone}</div>
            </div>
          )}
          {amount > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Amount</div>
              <div className="text-2xl font-black text-accent tabular-nums">{inr(amount)}</div>
            </div>
          )}
          {upiIntent && (
            <a href={upiIntent} className="inline-block text-xs font-black uppercase tracking-widest bg-accent text-accent-foreground rounded-full px-4 py-2 hover:bg-accent/90" data-testid="upi-open-app-btn">
              Open in UPI App
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

```

---

## 19. PAGE — Dashboard
**File:** `frontend/src/pages/Dashboard.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { inr } from "@/lib/api";
import { Wallet, Users, MessageSquare, Receipt, Package as PackageIcon, Gamepad2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "react-qr-code";
import { copyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";
import { Star, Copy, ExternalLink, Calendar as CalIcon } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today);
  const [granularity, setGranularity] = useState("day");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);

  const setPreset = (p) => {
    if (p === "today") { setFrom(today); setTo(today); setGranularity("day"); }
    else if (p === "7d") { setFrom(daysAgo(6)); setTo(today); setGranularity("day"); }
    else if (p === "30d") { setFrom(daysAgo(29)); setTo(today); setGranularity("day"); }
    else if (p === "3m") { setFrom(daysAgo(89)); setTo(today); setGranularity("week"); }
    else if (p === "1y") { setFrom(daysAgo(364)); setTo(today); setGranularity("month"); }
    else if (p === "all") { setFrom("2024-01-01"); setTo(today); setGranularity("month"); }
  };

  useEffect(() => {
    let mounted = true;
    api.get("/dashboard/stats").then((r) => mounted && setStats(r.data)).catch(() => mounted && setError(true));
    api.get("/settings").then((r) => mounted && setSettings(r.data)).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setAnalyticsBusy(true);
    api.get(`/dashboard/analytics?from_date=${from}&to_date=${to}&granularity=${granularity}`)
      .then((r) => mounted && setAnalytics(r.data))
      .catch(() => mounted && setAnalytics(null))
      .finally(() => mounted && setAnalyticsBusy(false));
    return () => { mounted = false; };
  }, [from, to, granularity]);

  const reviewUrl = settings?.google_review_url || "";
  const copyReview = async () => {
    const ok = await copyToClipboard(reviewUrl);
    toast[ok ? "success" : "info"](ok ? "Review link copied" : "Manual copy fallback shown");
  };

  return (
    <div>
      <PageHead
        title={`Namaste, ${user?.name?.split(" ")[0] || "Manager"} 🎡`}
        subtitle="Aaj ke park operations aur revenue ka overview"
        action={
          <div className="flex gap-3">
            <Link to="/visit"><Button data-testid="dash-new-bill" className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold">+ New Bill</Button></Link>
            <Link to="/inquiries"><Button data-testid="dash-new-inquiry" variant="outline" className="rounded-full h-11 px-6 font-bold">+ Inquiry</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        <KpiCard icon={Wallet} tint="bg-primary/20 text-accent" label="Aaj ka revenue" value={stats ? inr(stats.revenue_today) : "—"} testid="kpi-revenue" />
        <KpiCard icon={Users} tint="bg-secondary/20 text-secondary" label="Aaj ki footfall" value={stats?.footfall_today ?? "—"} testid="kpi-footfall" />
        <KpiCard icon={MessageSquare} tint="bg-accent/20 text-accent" label="Nayi inquiries" value={stats?.inquiries_new ?? "—"} testid="kpi-inq-new" />
        <KpiCard icon={Receipt} tint="bg-destructive/10 text-destructive" label={stats?.pending_prebookings ? `Pending: ${stats.pending_prebookings} bookings + ${stats.pending_bills} bills` : "Pending bills"} value={stats ? ((stats.pending_prebookings || 0) + (stats.pending_bills || 0)) : "—"} testid="kpi-pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="lg:col-span-2 p-6 rounded-2xl" data-testid="analytics-card">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Analytics</div>
              <h3 className="text-xl font-black">Revenue &amp; footfall trend</h3>
              <p className="text-xs text-muted-foreground mt-1">{from} → {to} · {granularity}wise · {analytics ? `${analytics.trend?.length || 0} data points` : "…"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: "today", l: "Today" },
                { k: "7d", l: "7d" },
                { k: "30d", l: "30d" },
                { k: "3m", l: "3m" },
                { k: "1y", l: "1y" },
                { k: "all", l: "All" },
              ].map((p) => (
                <button key={p.k} data-testid={`preset-${p.k}`} onClick={() => setPreset(p.k)} className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors">{p.l}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">From</label>
              <Input data-testid="date-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">To</label>
              <Input data-testid="date-to" type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Group by</label>
              <div className="grid grid-cols-4 gap-1 mt-1">
                {["day", "week", "month", "year"].map((g) => (
                  <button key={g} data-testid={`gran-${g}`} onClick={() => setGranularity(g)} className={`h-9 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${granularity === g ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>{g}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <MiniStat label="Revenue" value={analytics ? `₹${(analytics.total_revenue || 0).toLocaleString("en-IN")}` : "—"} testid="ms-revenue" tint="text-accent" />
            <MiniStat label="Footfall" value={analytics?.total_footfall ?? "—"} testid="ms-footfall" tint="text-secondary" />
            <MiniStat label="Avg. bill" value={analytics ? `₹${(analytics.average_bill || 0).toLocaleString("en-IN")}` : "—"} testid="ms-avg" />
            <MiniStat label="Unique customers" value={analytics?.unique_customers ?? "—"} testid="ms-uniq" />
          </div>

          <div className="h-72">
            {analyticsBusy && !analytics ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : analytics?.trend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 100% 90%)" />
                  <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => granularity === "day" ? d.slice(5) : d} />
                  <YAxis fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(v, name) => name === "revenue" ? `₹${Number(v).toLocaleString("en-IN")}` : v} labelClassName="font-bold" />
                  <Bar dataKey="revenue" fill="hsl(28 100% 49%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data in this range</div>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl" data-testid="sales-mix-card">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Sales mix</div>
            <h3 className="text-xl font-black">Packages vs Games</h3>
            <p className="text-xs text-muted-foreground mt-1">{from} → {to}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 rounded-2xl bg-accent/10 border-2 border-accent/30" data-testid="metric-packages-sold">
              <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center mb-3">
                <PackageIcon className="h-5 w-5" />
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Packages sold</div>
              <div className="text-3xl font-black tabular-nums mt-1">{analytics?.total_packages_sold ?? "—"}</div>
              <div className="text-xs font-bold text-accent mt-1">₹{Number(analytics?.packages_revenue || 0).toLocaleString("en-IN")}</div>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/10 border-2 border-secondary/30" data-testid="metric-games-played">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center mb-3">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Games / activities played</div>
              <div className="text-3xl font-black tabular-nums mt-1">{analytics?.total_games_played ?? "—"}</div>
              <div className="text-xs font-bold text-secondary mt-1">₹{Number(analytics?.games_revenue || 0).toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="h-40">
            {analytics?.trend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(204 100% 90%)" />
                  <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => granularity === "day" ? d.slice(5) : d} />
                  <YAxis fontSize={10} allowDecimals={false} />
                  <Tooltip labelClassName="font-bold" />
                  <Bar dataKey="packages_sold" stackId="a" fill="hsl(28 100% 49%)" radius={[0,0,0,0]} name="Packages" />
                  <Bar dataKey="games_played" stackId="a" fill="hsl(204 100% 45%)" radius={[4,4,0,0]} name="Games" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No sales in this range</div>
            )}
          </div>

          {(analytics?.top_packages?.length || analytics?.top_games?.length) ? (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div data-testid="top-packages-list">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Top packages</div>
                <ul className="space-y-1.5">
                  {(analytics?.top_packages || []).slice(0,3).map((p) => (
                    <li key={p.name} className="flex items-center justify-between text-xs">
                      <span className="font-bold truncate mr-2">{p.name}</span>
                      <span className="font-black text-accent tabular-nums">{p.count}</span>
                    </li>
                  ))}
                  {!(analytics?.top_packages?.length) && <li className="text-xs text-muted-foreground">—</li>}
                </ul>
              </div>
              <div data-testid="top-games-list">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Top games</div>
                <ul className="space-y-1.5">
                  {(analytics?.top_games || []).slice(0,3).map((g) => (
                    <li key={g.name} className="flex items-center justify-between text-xs">
                      <span className="font-bold truncate mr-2">{g.name}</span>
                      <span className="font-black text-secondary tabular-nums">{g.count}</span>
                    </li>
                  ))}
                  {!(analytics?.top_games?.length) && <li className="text-xs text-muted-foreground">—</li>}
                </ul>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      {/* Google Reviews */}
      <Card className="p-6 rounded-2xl mt-6" data-testid="google-reviews-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 48 48" width="26" height="26"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Google Reviews</div>
                <h3 className="text-xl font-black">Ratings aur customer voice</h3>
              </div>
            </div>
            {settings?.google_rating > 0 || settings?.google_reviews_shown > 0 ? (
              <div className="flex items-center gap-6 my-4">
                <div>
                  <div className="text-4xl font-black tracking-tight">{Number(settings?.google_rating || 0).toFixed(1)}</div>
                  <div className="flex gap-0.5 mt-1" data-testid="stars">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= Math.round(settings?.google_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-secondary">{settings?.google_reviews_shown || 0}</div>
                  <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total reviews</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">Google Business ka review link Settings me daalo — bills par QR aur customers ka feedback yahaan track karo.</p>
            )}
            {reviewUrl ? (
              <div className="flex flex-wrap gap-2 mt-4">
                <a href={reviewUrl} target="_blank" rel="noreferrer"><Button data-testid="dash-review-open" size="sm" className="rounded-full bg-accent hover:bg-accent/90 font-bold"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Open on Google</Button></a>
                <Button data-testid="dash-review-copy" size="sm" variant="outline" onClick={copyReview} className="rounded-full font-bold"><Copy className="h-3.5 w-3.5 mr-1" /> Copy Review Link</Button>
                <Link to="/settings"><Button size="sm" variant="ghost" className="rounded-full font-bold">Update rating</Button></Link>
              </div>
            ) : (
              <Link to="/settings"><Button data-testid="dash-review-setup" size="sm" className="rounded-full mt-4 bg-accent hover:bg-accent/90 font-bold">Setup Google Review Link →</Button></Link>
            )}
          </div>
          <div className="flex flex-col items-center">
            {reviewUrl ? (
              <>
                <div className="p-3 bg-white rounded-2xl border-2 border-primary shadow-sm">
                  <QRCode value={reviewUrl} size={140} />
                </div>
                <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-2">Scan to review</div>
              </>
            ) : (
              <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground text-center p-4">QR yahaan generate hoga jab review link daaloge</div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, tint, label, value, testid }) {
  return (
    <Card className="p-6 rounded-2xl border-border hover:shadow-md transition-shadow" data-testid={testid}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
    </Card>
  );
}

function MiniStat({ label, value, testid, tint }) {
  return (
    <div className="p-3 bg-muted rounded-xl" data-testid={testid}>
      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className={`text-lg font-black mt-0.5 tabular-nums ${tint || ""}`}>{value}</div>
    </div>
  );
}

```

---

## 20. PAGE — Login (Auth)
**File:** `frontend/src/pages/Login.jsx`

```jsx
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fmtErr } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Welcome back!");
      nav("/");
    } catch (err) {
      toast.error(fmtErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:block confetti-bg">
        <img src="https://images.pexels.com/photos/17467601/pexels-photo-17467601.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
             alt="Amusement park" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 via-secondary/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <div className="text-xs uppercase tracking-[0.3em] font-bold mb-4 opacity-90">Adventure Park · Indore</div>
          <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] mb-4" style={{fontFamily: 'Fraunces, serif'}}>
            Manage every ride, every smile.
          </h1>
          <p className="text-lg opacity-90 max-w-md">Inquiries, packages, billing, staff and marketing — all in one playful command center.</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <img src="/icon-192.png" alt="Funland" className="w-14 h-14 rounded-2xl border border-border shadow-sm object-contain bg-white" />
            <div>
              <div className="text-2xl font-black">
                <span className="text-accent">Fun</span><span className="text-secondary">land</span>
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Manager Login</div>
            </div>
          </div>

          <h2 className="text-3xl font-black mb-2 tracking-tight">Sign in</h2>
          <p className="text-muted-foreground mb-8">Apne credentials daalo park manager se milte hi.</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="uppercase text-xs font-bold tracking-[0.2em]">Email</Label>
              <Input id="email" data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="apna@email.com" autoComplete="email" className="mt-2 h-12" />
            </div>
            <div>
              <Label htmlFor="password" className="uppercase text-xs font-bold tracking-[0.2em]">Password</Label>
              <Input id="password" data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="mt-2 h-12" />
            </div>
            <Button data-testid="login-submit" type="submit" disabled={busy}
              className="w-full h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black text-base">
              {busy ? <Loader2 className="animate-spin h-5 w-5" /> : "Enter Funland"}
            </Button>
          </form>

          <p className="mt-10 text-xs text-center text-muted-foreground">Naya staff? Manager se apna account banwao.</p>
        </div>
      </div>
    </div>
  );
}

```

---

## 21. PAGE — NewVisit (Billing)
**File:** `frontend/src/pages/NewVisit.jsx`

```jsx
import React, { useEffect, useMemo, useState } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Minus, X, Gamepad2, PartyPopper, Receipt, Percent, IndianRupee } from "lucide-react";
import UpiPayBlock from "@/components/UpiPayBlock";

const CATEGORIES = [
  { v: "activity", label: "Activity", defaultGst: 18 },
  { v: "food", label: "Food/F&B", defaultGst: 5 },
  { v: "entry", label: "Entry Ticket", defaultGst: 18 },
  { v: "merchandise", label: "Merchandise", defaultGst: 12 },
];

export default function NewVisit() {
  const [games, setGames] = useState([]);
  const [packages, setPackages] = useState([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("games");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", gstin: "", state_code: "" });
  const [discountMode, setDiscountMode] = useState("percent"); // "percent" | "flat"
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAt, setPaymentAt] = useState("");
  const [checkedBy, setCheckedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/games").then((r) => setGames(r.data.filter((g) => g.active))).catch(() => {});
    api.get("/packages").then((r) => setPackages(r.data.filter((p) => p.active))).catch(() => {});
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const priceOf = (item) => (item.offer_price && item.offer_price < item.price ? item.offer_price : item.price);

  const add = (item, kind) => {
    setCart((c) => {
      const idx = c.findIndex((x) => x.ref_id === item.id);
      if (idx >= 0) { const nc = [...c]; nc[idx] = { ...nc[idx], qty: nc[idx].qty + 1 }; return nc; }
      // Auto-derive category & GST from item metadata
      let catV = "activity", gst = 18;
      if (kind === "game") {
        const gc = (item.gst_category || "activity").toLowerCase();
        if (gc === "food") { catV = "food"; gst = 5; }
        else if (gc === "goods") { catV = "merchandise"; gst = 12; }
        else { catV = "activity"; gst = 18; }
      } else if (kind === "package") {
        // Package will be exploded on backend into food + activity lines with 5% + 18%
        catV = "activity"; gst = 18;
      }
      return [...c, { kind, ref_id: item.id, name: item.name, price: priceOf(item), qty: 1, category: catV, gst_percent: gst, is_package_split: kind === "package" && ((Array.isArray(item.gst_split) && item.gst_split.length > 0) || (item.food_portion > 0 && item.activity_portion > 0)), split_preview: kind === "package" ? (Array.isArray(item.gst_split) && item.gst_split.length ? item.gst_split : ((item.food_portion > 0 || item.activity_portion > 0) ? [item.food_portion > 0 && { label: "Food", category: "food", amount: item.food_portion }, item.activity_portion > 0 && { label: "Activity", category: "activity", amount: item.activity_portion }].filter(Boolean) : [])) : [] }];
    });
  };
  const setQty = (idx, qty) => setCart((c) => c.map((x, i) => i === idx ? { ...x, qty: Math.max(1, qty) } : x));
  const setLineField = (idx, field, value) => setCart((c) => c.map((x, i) => i === idx ? { ...x, [field]: value } : x));
  const removeAt = (idx) => setCart((c) => c.filter((_, i) => i !== idx));
  const changeCategory = (idx, catV) => {
    const cat = CATEGORIES.find((c) => c.v === catV) || CATEGORIES[0];
    setCart((c) => c.map((x, i) => i === idx ? { ...x, category: cat.v, gst_percent: cat.defaultGst } : x));
  };

  const filteredGames = useMemo(() => games.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())), [games, q]);
  const filteredPackages = useMemo(() => packages.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())), [packages, q]);

  // Totals
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const discPct = discountMode === "percent" ? Math.min(Math.max(+discountValue || 0, 0), 100) : 0;
  const discFlat = discountMode === "flat" ? Math.min(Math.max(+discountValue || 0, 0), subtotal) : 0;
  const discAmount = discountMode === "percent" ? +(subtotal * discPct / 100).toFixed(2) : discFlat;
  const afterDiscount = Math.max(subtotal - discAmount, 0);
  const ratio = subtotal > 0 ? afterDiscount / subtotal : 0;
  const gstByCategory = cart.reduce((acc, it) => {
    const line = it.price * it.qty * ratio;
    const g = +(line * (it.gst_percent || 0) / 100).toFixed(2);
    if (!g) return acc;
    const key = `${it.category || "other"}@${it.gst_percent}%`;
    acc[key] = (acc[key] || 0) + g;
    return acc;
  }, {});
  const gstTotal = +Object.values(gstByCategory).reduce((a, b) => a + b, 0).toFixed(2);
  const total = +(afterDiscount + gstTotal).toFixed(2);

  const submit = async () => {
    if (!customer.name) return toast.error("Customer name is required");
    if (cart.length === 0) return toast.error("Add at least one item");
    if (discountMode === "percent" && (+discountValue < 0 || +discountValue > 100)) return toast.error("Discount 0-100% only");
    setBusy(true);
    try {
      const { data } = await api.post("/bills", {
        customer_name: customer.name, customer_phone: customer.phone, customer_email: customer.email,
        customer_gstin: customer.gstin, customer_state_code: customer.state_code,
        items: cart.map((c) => ({ kind: c.kind, ref_id: c.ref_id, name: c.name, price: c.price, qty: c.qty, gst_percent: +c.gst_percent || 0, category: c.category })),
        discount: discountMode === "flat" ? discFlat : 0,
        discount_percent: discountMode === "percent" ? discPct : 0,
        gst_percent: 0,
        payment_method: paymentMethod, payment_status: paymentStatus,
        payment_reference: paymentReference, payment_at: paymentAt, checked_by: checkedBy,
        notes,
      });
      toast.success(`Bill ${data.bill_no} created! Print button click karo`, {
        duration: 6000,
        action: { label: "🖨️ Print Now", onClick: () => window.open(`/bills/${data.id}/print`, "_blank") },
      });
      nav(`/bills/${data.id}`);
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHead title="New Bill" subtitle="Customer entry, items, per-item GST aur percent-based discount" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5 rounded-2xl">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Customer Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Name*</Label><Input data-testid="cust-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input data-testid="cust-phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input data-testid="cust-email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="md:col-span-2">
                <Label className="flex items-center gap-1">Customer GSTIN <span className="text-[10px] font-normal text-muted-foreground">(optional — B2B tax invoice ke liye)</span></Label>
                <Input data-testid="cust-gstin" value={customer.gstin} onChange={(e) => setCustomer({ ...customer, gstin: e.target.value.toUpperCase() })} placeholder="22ABCDE1234F1Z5" maxLength={15} />
              </div>
              <div>
                <Label>State code</Label>
                <Input data-testid="cust-state" value={customer.state_code} onChange={(e) => setCustomer({ ...customer, state_code: e.target.value })} placeholder="e.g. 23 (MP)" maxLength={2} />
                <div className="text-[10px] text-muted-foreground mt-1">Blank = intra-state (CGST+SGST)</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-2">
                <button data-testid="tab-games" onClick={() => setTab("games")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${tab === "games" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>Games</button>
                <button data-testid="tab-packages" onClick={() => setTab("packages")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${tab === "packages" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>Packages</button>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input data-testid="visit-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {tab === "games" && filteredGames.map((g) => (
                <button key={g.id} data-testid={`add-game-${g.id}`} onClick={() => add(g, "game")} className="text-left p-4 rounded-xl border border-border bg-white hover:border-accent hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-secondary" /><div className="font-bold">{g.name}</div></div>
                    <Plus className="h-4 w-4 text-accent shrink-0" />
                  </div>
                  <div className="mt-2 text-lg font-black text-accent">{inr(priceOf(g))}</div>
                </button>
              ))}
              {tab === "packages" && filteredPackages.map((p) => (
                <button key={p.id} data-testid={`add-pkg-${p.id}`} onClick={() => add(p, "package")} className="text-left p-4 rounded-xl border border-border bg-white hover:border-accent hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2"><PartyPopper className="h-4 w-4 text-accent" /><div className="font-bold">{p.name}</div></div>
                    <Plus className="h-4 w-4 text-accent shrink-0" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-1">{p.type} · {p.pax} pax</div>
                  <div className="mt-2 text-lg font-black text-accent">{inr(priceOf(p))}</div>
                </button>
              ))}
              {tab === "games" && filteredGames.length === 0 && <div className="col-span-full text-center py-8 text-muted-foreground text-sm">No games found</div>}
              {tab === "packages" && filteredPackages.length === 0 && <div className="col-span-full text-center py-8 text-muted-foreground text-sm">No packages found</div>}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-5 rounded-2xl sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-secondary" />
              <div className="font-black text-lg">Bill Summary</div>
              <Badge variant="outline" className="ml-auto">{cart.reduce((s, i) => s + i.qty, 0)} items</Badge>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Add games or packages</div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto mb-4" data-testid="cart-items">
                {cart.map((it, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{inr(it.price)} × {it.qty}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button data-testid={`qty-dec-${i}`} size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, it.qty - 1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-6 text-center font-bold text-sm">{it.qty}</span>
                        <Button data-testid={`qty-inc-${i}`} size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, it.qty + 1)}><Plus className="h-3 w-3" /></Button>
                        <Button data-testid={`qty-rm-${i}`} size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeAt(i)}><X className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={it.category} onValueChange={(v) => changeCategory(i, v)}>
                        <SelectTrigger className="h-8 text-xs" data-testid={`line-cat-${i}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="relative">
                        <Input data-testid={`line-gst-${i}`} type="number" value={it.gst_percent} onChange={(e) => setLineField(i, "gst_percent", +e.target.value || 0)} className="h-8 text-xs pr-8" />
                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    {it.kind === "package" && it.is_package_split && (
                      <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-2 py-1 space-y-0.5">
                        <div>📦 Bill par yeh package auto-split hoga:</div>
                        {(it.split_preview || []).map((s, si) => {
                          const rateMap = { food: 5, activity: 18, room: 12, clothing: 12, merchandise: 18, other: 18 };
                          const r = rateMap[s.category] || 18;
                          return <div key={si} className="pl-4">· {s.label || s.category} ₹{s.amount} @{r}%</div>;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <Label className="text-xs">Discount</Label>
                <div className="flex gap-2 mt-1">
                  <button data-testid="disc-mode-percent" onClick={() => setDiscountMode("percent")} className={`flex-1 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-1 ${discountMode === "percent" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}><Percent className="h-3 w-3" /> %</button>
                  <button data-testid="disc-mode-flat" onClick={() => setDiscountMode("flat")} className={`flex-1 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-1 ${discountMode === "flat" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}><IndianRupee className="h-3 w-3" /> Flat</button>
                </div>
                <Input data-testid="bill-discount" type="number" min={0} max={discountMode === "percent" ? 100 : undefined} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountMode === "percent" ? "0-100 %" : "₹"} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="bill-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi_qr">UPI (QR)</SelectItem>
                    <SelectItem value="razorpay">Razorpay Link</SelectItem>
                    <SelectItem value="card">Card (Debit / Credit)</SelectItem>
                    <SelectItem value="rtgs">RTGS / NEFT</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger data-testid="bill-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea data-testid="bill-notes" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm" />
            </div>

            {paymentStatus === "paid" && paymentMethod !== "cash" && (
              <div className="mt-4 p-4 rounded-xl bg-secondary/10 border-2 border-secondary/30" data-testid="digital-audit-fields">
                <div className="text-xs uppercase tracking-widest font-black text-secondary mb-3">Digital payment audit (compulsory)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Reference No / UTR / RRN*</Label>
                    <Input data-testid="bill-payment-ref" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Txn ID / UTR / Card auth code" />
                  </div>
                  <div>
                    <Label className="text-xs">Payment Date & Time</Label>
                    <Input data-testid="bill-payment-at" type="datetime-local" value={paymentAt} onChange={(e) => setPaymentAt(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Checked By*</Label>
                    <Input data-testid="bill-checked-by" value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} placeholder="Staff name" />
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">Ye fields payment ki verification ke liye zaruri hain. Cash ke liye skip ho jaate hain.</div>
              </div>
            )}

            {paymentMethod === "upi_qr" && (settings?.upi_qr_url || settings?.upi_id) && (
              <div className="mt-4">
                <UpiPayBlock settings={settings} amount={total} note="New bill" variant="compact" />
              </div>
            )}

            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <Row label="Subtotal" value={inr(subtotal)} />
              {discAmount > 0 && <Row label={`Discount${discountMode === "percent" ? ` (${discPct}%)` : ""}`} value={`- ${inr(discAmount)}`} />}
              {Object.entries(gstByCategory).map(([k, v]) => <Row key={k} label={`GST ${k}`} value={inr(v)} small />)}
              {gstTotal > 0 && <Row label="Total GST" value={inr(gstTotal)} />}
              <Row label="Total" value={inr(total)} big />
            </div>

            <Button data-testid="bill-generate" onClick={submit} disabled={busy || cart.length === 0} className="w-full mt-5 h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black">
              {busy ? "Creating…" : "Generate Bill"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, big, small }) {
  return (
    <div className={`flex items-center justify-between ${big ? "text-xl pt-2 border-t border-border font-black" : small ? "text-xs" : "text-sm"}`}>
      <span className={big ? "" : "text-muted-foreground"}>{label}</span>
      <span className={big ? "text-accent" : "font-bold"}>{value}</span>
    </div>
  );
}

```

---

## 22. PAGE — Bills
**File:** `frontend/src/pages/Bills.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, fmtErr, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Receipt, Send, Printer, MessageCircle, Mail, Phone, ExternalLink } from "lucide-react";
import UpiPayBlock from "@/components/UpiPayBlock";

export function BillsList() {
  const [bills, setBills] = useState(null);
  useEffect(() => { api.get("/bills").then((r) => setBills(r.data)).catch(() => setBills([])); }, []);
  const openPrint = (id, e) => { e.preventDefault(); e.stopPropagation(); window.open(`/bills/${id}/print`, "_blank"); };
  return (
    <div>
      <PageHead title="Bills" subtitle="Sabhi customer bills aur payment status" />
      {bills === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <Card key={i} className="p-5 rounded-2xl h-40 animate-pulse bg-muted" />)}
        </div>
      ) : bills.length === 0 ? <EmptyState title="No bills yet" description="Naya bill banane ke liye 'New Bill' pe jao." /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {bills.map((b) => (
            <Card key={b.id} className="p-5 rounded-2xl hover:shadow-md transition-shadow" data-testid={`bill-card-${b.id}`}>
              <Link to={`/bills/${b.id}`} className="block">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{b.bill_no}</div>
                  <Badge className={`rounded-full ${b.payment_status === "paid" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-primary/20 text-accent border-primary"}`}>{b.payment_status}</Badge>
                </div>
                <div className="font-black text-lg mb-1">{b.customer_name}</div>
                <div className="text-sm text-muted-foreground mb-3">{b.customer_phone || "—"} · {b.items?.length || 0} items</div>
                <div className="text-3xl font-black text-accent">{inr(b.total)}</div>
                <div className="text-xs text-muted-foreground mt-2">{b.created_at ? new Date(b.created_at).toLocaleString() : ""}</div>
              </Link>
              <Button data-testid={`bill-quick-print-${b.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`/bills/${b.id}/print?mode=receipt`, "_blank"); }} variant="outline" size="sm" className="w-full mt-3 rounded-full font-bold border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Printer className="h-4 w-4 mr-1" /> Print Receipt
              </Button>
            </Card>
          ))}
        </div>}
    </div>
  );
}

export function BillDetail() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [settings, setSettings] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [error, setError] = useState(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState("whatsapp");

  const load = () => api.get(`/bills/${id}`).then((r) => setBill(r.data)).catch((e) => setError(fmtErr(e)));
  useEffect(() => { load(); api.get("/settings").then((r) => setSettings(r.data)).catch(() => {}); }, [id]);

  const markPaid = async () => {
    try { await api.patch(`/bills/${bill.id}/status`, { payment_status: "paid" }); toast.success("Marked paid"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const sendBill = async () => {
    try {
      const { data } = await api.post(`/bills/${bill.id}/send`, { channel: sendChannel });
      toast.success(data?.delivery?.simulated ? `Simulated ${sendChannel} send (configure integration)` : `Sent via ${sendChannel}`);
      setSendOpen(false);
    } catch (e) { toast.error(fmtErr(e)); }
  };

  if (error) return (
    <div className="p-8 text-center">
      <div className="text-lg font-bold mb-2">Bill load nahi ho paya</div>
      <div className="text-sm text-muted-foreground mb-4">{error}</div>
      <Button onClick={() => { setError(null); load(); }} className="rounded-full">Retry</Button>
    </div>
  );
  if (!bill) return (
    <div className="p-8 space-y-4">
      <div className="h-8 w-1/3 bg-muted rounded animate-pulse" />
      <Card className="p-8 rounded-2xl h-96 animate-pulse bg-muted/50" />
    </div>
  );

  const items = bill.items || [];
  const settingsSafe = settings || {};

  return (
    <div>
      <PageHead
        title={`Bill ${bill.bill_no || ""}`}
        subtitle={`${bill.customer_name} · ${bill.created_at ? new Date(bill.created_at).toLocaleString() : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            {bill.payment_status === "pending" && <Button data-testid="mark-paid" onClick={markPaid} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white">Mark Paid</Button>}
            <Button data-testid="print-receipt-btn" onClick={() => window.open(`/bills/${bill.id}/print?mode=receipt`, "_blank")} variant="outline" className="rounded-full font-bold h-11 px-4"><Printer className="h-4 w-4 mr-1" /> Customer Receipt</Button>
            <Button data-testid="print-invoice-btn" onClick={() => window.open(`/bills/${bill.id}/print?mode=invoice`, "_blank")} className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-11 px-4"><Printer className="h-4 w-4 mr-1" /> Tax Invoice</Button>
            <Button data-testid="send-btn" onClick={() => setSendOpen(true)} variant="outline" className="rounded-full"><Send className="h-4 w-4 mr-1" /> Send</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-8 rounded-2xl">
          <div className="flex items-start justify-between mb-6 pb-6 border-b border-border">
            <div>
              <div className="font-black text-3xl"><span className="text-accent">Fun</span><span className="text-secondary">land</span></div>
              <div className="text-sm text-muted-foreground mt-1">{settingsSafe.park_name || "Adventure Park"}</div>
              <div className="text-xs text-muted-foreground">{settingsSafe.address}</div>
              {settingsSafe.phone && <div className="text-xs text-muted-foreground">Ph: {settingsSafe.phone}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Invoice</div>
              <div className="font-black text-lg">{bill.bill_no}</div>
              <Badge className={`mt-2 rounded-full ${bill.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-primary/20 text-accent"}`}>{bill.payment_status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Bill To</div>
              <div className="font-bold">{bill.customer_name}</div>
              {bill.customer_phone && <div className="text-muted-foreground">{bill.customer_phone}</div>}
              {bill.customer_email && <div className="text-muted-foreground">{bill.customer_email}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Details</div>
              <div>Method: <span className="font-bold">{bill.payment_method}</span></div>
              <div>Staff: <span className="font-bold">{bill.created_by_name}</span></div>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-xs uppercase tracking-widest font-bold text-muted-foreground">Item</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest font-bold text-muted-foreground">Qty</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest font-bold text-muted-foreground">Price</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest font-bold text-muted-foreground">GST</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest font-bold text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-3 font-semibold">{it.name}<span className="ml-2 text-xs text-muted-foreground uppercase">{it.category || it.kind}</span></td>
                  <td className="text-right">{it.qty}</td>
                  <td className="text-right">{inr(it.price)}</td>
                  <td className="text-right text-xs">{it.gst_percent || 0}%</td>
                  <td className="text-right font-bold">{inr((it.price || 0) * (it.qty || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto max-w-xs space-y-2">
            <Row label="Subtotal" value={inr(bill.subtotal)} />
            {(bill.discount || 0) > 0 && <Row label={`Discount${bill.discount_percent ? ` (${bill.discount_percent}%)` : ""}`} value={`- ${inr(bill.discount)}`} />}
            {(bill.gst_amount || 0) > 0 && <Row label="GST" value={inr(bill.gst_amount)} />}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-lg font-black">Total</span>
              <span className="text-3xl font-black text-accent">{inr(bill.total)}</span>
            </div>
          </div>

          {bill.notes && <div className="mt-6 p-3 bg-muted rounded-xl text-sm italic text-muted-foreground">Note: {bill.notes}</div>}
        </Card>

        <div className="space-y-4">
          <Card className="p-5 rounded-2xl" data-testid="bill-pay-card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Pay Now</div>
              {(settingsSafe.upi_qr_url || settingsSafe.upi_id) && (
                <Button data-testid="bill-fullscreen-qr" size="sm" onClick={() => setQrOpen(true)} className="rounded-full bg-primary hover:bg-primary/90 h-8 px-3 font-bold text-xs">
                  Fullscreen QR
                </Button>
              )}
            </div>
            {bill.razorpay_link ? (
              <a href={bill.razorpay_link} target="_blank" rel="noreferrer" className="block p-4 border-2 border-accent rounded-xl text-center font-bold hover:bg-accent hover:text-accent-foreground transition-colors mb-3" data-testid="rzp-link">
                Pay via Razorpay <ExternalLink className="inline h-4 w-4" />
              </a>
            ) : bill.payment_method === "razorpay" ? (
              <div className="p-4 border border-border rounded-xl text-sm text-muted-foreground mb-3">Razorpay not configured. Add keys in .env.</div>
            ) : null}
            {(settingsSafe.upi_qr_url || settingsSafe.upi_id) ? (
              <UpiPayBlock settings={settingsSafe} amount={bill.total} note={`Bill ${bill.bill_no}`} />
            ) : (
              !bill.razorpay_link && <div className="text-sm text-muted-foreground">Configure UPI QR in Settings to display here.</div>
            )}
          </Card>

          {settingsSafe.google_review_url && (
            <Card className="p-5 rounded-2xl bg-primary/5 border-primary" data-testid="bill-review-card">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-accent mb-2">Loved your visit?</div>
              <div className="font-bold mb-3">Google par review dijiye ⭐</div>
              <div className="p-2 bg-white rounded-xl border border-border inline-block">
                <QRCode value={settingsSafe.google_review_url} size={120} />
              </div>
              <a href={settingsSafe.google_review_url} target="_blank" rel="noreferrer" className="block mt-3 text-xs text-secondary font-bold underline break-all">{settingsSafe.google_review_url}</a>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="rounded-2xl max-w-lg" data-testid="qr-fullscreen-modal">
          <DialogHeader><DialogTitle className="text-2xl font-black text-center">Pay {inr(bill.total)}</DialogTitle></DialogHeader>
          <div className="p-4 flex flex-col items-center">
            {settingsSafe.upi_qr_url ? (
              <img src={settingsSafe.upi_qr_url} alt="UPI QR" className="w-72 h-72 object-contain bg-white rounded-2xl border-4 border-accent shadow-2xl" data-testid="qr-fullscreen-img" />
            ) : (
              <div className="w-72 h-72 bg-white rounded-2xl border-4 border-accent p-3 shadow-2xl">
                <QRCode
                  value={`upi://pay?pa=${encodeURIComponent(settingsSafe.upi_id || "")}&pn=${encodeURIComponent(settingsSafe.firm_name || settingsSafe.park_name || "Funland")}&am=${Number(bill.total).toFixed(2)}&cu=INR&tn=${encodeURIComponent("Bill " + bill.bill_no)}`}
                  size={264}
                  data-testid="qr-fullscreen-svg"
                />
              </div>
            )}
            <div className="mt-4 text-center">
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">UPI ID</div>
              <div className="text-lg font-black text-primary">{settingsSafe.upi_id}</div>
              <div className="text-4xl font-black text-accent mt-3 tabular-nums">{inr(bill.total)}</div>
              <div className="text-xs text-muted-foreground mt-2">Scan any UPI app → Pay this exact amount</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">Send Bill</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: "whatsapp", label: "WhatsApp", icon: MessageCircle },
              { v: "sms", label: "SMS", icon: Phone },
              { v: "email", label: "Email", icon: Mail },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.v} data-testid={`send-channel-${c.v}`} onClick={() => setSendChannel(c.v)} className={`p-4 rounded-xl border-2 transition-colors ${sendChannel === c.v ? "border-accent bg-accent/10" : "border-border"}`}>
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-bold">{c.label}</div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="send-confirm" onClick={sendBill} className="rounded-full bg-accent hover:bg-accent/90">Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}</span></div>;
}

```

---

## 23. PAGE — PrintBill
**File:** `frontend/src/pages/PrintBill.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api, inr } from "@/lib/api";
import QRCode from "react-qr-code";
import UpiPayBlock from "@/components/UpiPayBlock";

export default function PrintBill() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const mode = sp.get("mode") === "receipt" ? "receipt" : "invoice";  // receipt hides GST, invoice shows full
  const [bill, setBill] = useState(null);
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    api.get(`/bills/${id}`).then((r) => setBill(r.data)).catch(() => {});
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, [id]);
  useEffect(() => { if (bill && settings) setTimeout(() => window.print(), 400); }, [bill, settings]);
  if (!bill) return <div className="p-8 text-sm">Loading…</div>;
  const park = settings?.firm_name || settings?.park_name || "Funland Adventure Park";
  const items = bill.items || [];
  const breakup = bill.gst_breakup || [];
  const isInter = !!bill.is_interstate;
  const firmGstin = settings?.firm_gstin || "";
  const isReceipt = mode === "receipt";
  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0 font-sans" data-testid="print-bill-root" data-mode={mode}>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 3mm; }
          body { background: white; }
        }
      `}</style>
      <div className="mx-auto" style={{ maxWidth: "80mm", fontFamily: "'Courier New', monospace" }}>
        {firmGstin && !isReceipt ? (
          <div className="text-center text-[10px] font-black uppercase tracking-widest border-b border-dashed border-black pb-1 mb-1">
            Tax Invoice
          </div>
        ) : isReceipt ? (
          <div className="text-center text-[10px] font-black uppercase tracking-widest border-b border-dashed border-black pb-1 mb-1">
            Customer Receipt
          </div>
        ) : null}
        <div className="text-center mb-3">
          <div className="text-xl font-black">{park}</div>
          {settings?.address && <div className="text-[11px]">{settings.address}</div>}
          {settings?.phone && <div className="text-[11px]">Ph: {settings.phone}</div>}
          {firmGstin && !isReceipt && <div className="text-[10px]"><b>GSTIN:</b> {firmGstin}</div>}
          {settings?.firm_fssai && !isReceipt && <div className="text-[10px]">FSSAI: {settings.firm_fssai}</div>}
        </div>
        <div className="text-[11px] border-t border-b border-dashed border-black py-1 mb-2">
          <div className="flex justify-between"><span>Bill:</span><span className="font-bold">{bill.bill_no}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{new Date(bill.created_at).toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Staff:</span><span>{bill.created_by_name}</span></div>
        </div>
        <div className="text-[11px] mb-2">
          <div><b>Customer:</b> {bill.customer_name}</div>
          {bill.customer_phone && <div>Ph: {bill.customer_phone}</div>}
          {bill.customer_gstin && !isReceipt && <div data-testid="print-cust-gstin"><b>GSTIN:</b> {bill.customer_gstin}</div>}
          {bill.customer_state_code && !isReceipt && <div>State: {bill.customer_state_code}{isInter ? " (Inter-state)" : " (Intra-state)"}</div>}
        </div>
        <table className="w-full text-[10px] mb-2" data-testid="print-items">
          <thead><tr className="border-t border-b border-dashed border-black">
            <th className="text-left py-1">Item{!isReceipt ? " / HSN" : ""}</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Rate</th>
            {!isReceipt && <th className="text-right">GST%</th>}
            <th className="text-right">Amt</th>
          </tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="py-0.5 align-top">
                  <div className="font-bold leading-tight">{it.name}</div>
                  {!isReceipt && <div className="text-[8px] uppercase text-gray-600">{it.category || it.kind}{it.hsn_code ? ` · HSN ${it.hsn_code}` : ""}</div>}
                </td>
                <td className="text-right align-top">{it.qty}</td>
                <td className="text-right align-top">{(it.price || 0).toFixed(0)}</td>
                {!isReceipt && <td className="text-right align-top">{it.gst_percent || 0}%</td>}
                <td className="text-right align-top">{((it.price || 0) * (it.qty || 0)).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-dashed border-black pt-1 text-[11px] space-y-0.5">
          <div className="flex justify-between"><span>Subtotal:</span><span>{inr(bill.subtotal)}</span></div>
          {(bill.discount || 0) > 0 && <div className="flex justify-between"><span>Discount{bill.discount_percent ? ` (${bill.discount_percent}%)` : ""}:</span><span>-{inr(bill.discount)}</span></div>}
          {breakup.length > 0 && !isReceipt ? (
            <div className="border-t border-dashed border-black pt-1 mt-1" data-testid="print-gst-breakup">
              <div className="text-[10px] font-black uppercase tracking-wider text-center mb-1">GST Breakup</div>
              <table className="w-full text-[10px]">
                <thead><tr>
                  <th className="text-left">Rate</th>
                  <th className="text-right">Taxable</th>
                  {isInter ? (
                    <th className="text-right">IGST</th>
                  ) : (
                    <>
                      <th className="text-right">CGST</th>
                      <th className="text-right">SGST</th>
                    </>
                  )}
                </tr></thead>
                <tbody>
                  {breakup.map((b, i) => (
                    <tr key={i}>
                      <td>{b.rate}%</td>
                      <td className="text-right">{inr(b.taxable)}</td>
                      {isInter ? (
                        <td className="text-right">{inr(b.igst)}</td>
                      ) : (
                        <>
                          <td className="text-right">{inr(b.cgst)}</td>
                          <td className="text-right">{inr(b.sgst)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between mt-1"><span>Total GST:</span><span>{inr(bill.gst_amount)}</span></div>
            </div>
          ) : (
            !isReceipt && (bill.gst_amount || 0) > 0 && <div className="flex justify-between"><span>GST ({bill.gst_percent}%):</span><span>{inr(bill.gst_amount)}</span></div>
          )}
          <div className="flex justify-between text-base font-black border-t border-dashed border-black pt-1"><span>TOTAL:</span><span>{inr(bill.total)}</span></div>
          <div className="flex justify-between"><span>Payment:</span><span>{bill.payment_method.toUpperCase()} - {bill.payment_status.toUpperCase()}</span></div>
        </div>
        <div className="text-center text-[10px] mt-3 border-t border-dashed border-black pt-2">
          Thank you for visiting!<br/>Visit again 🎡
        </div>
        {(settings?.upi_qr_url || settings?.upi_id) && bill.payment_status !== "paid" && (
          <UpiPayBlock settings={settings} amount={bill.total} note={`Bill ${bill.bill_no}`} variant="print" />
        )}
        {settings?.google_review_url && (
          <div className="mt-3 border-t border-dashed border-black pt-2 text-center">
            <div className="text-[10px] font-bold mb-1">⭐ Rate us on Google ⭐</div>
            <div className="inline-block p-1 bg-white">
              <QRCode value={settings.google_review_url} size={100} />
            </div>
            <div className="text-[8px] mt-1">Scan karke feedback do</div>
          </div>
        )}
      </div>
    </div>
  );
}

```

---

## 24. PAGE — Games (Items/Activities)
**File:** `frontend/src/pages/Games.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Gamepad2 } from "lucide-react";

const ITEM_CATEGORIES = [
  { v: "entry",       label: "Entry / Ticket",       gst: "activity" },
  { v: "food",        label: "Food & Beverage",       gst: "food" },
  { v: "activities",  label: "Activities / Games",    gst: "activity" },
  { v: "dress",       label: "Dress / Clothing",      gst: "clothing" },
  { v: "others",      label: "Others",                gst: "other" },
];
const gstFor = (cat) => (ITEM_CATEGORIES.find((c) => c.v === cat) || ITEM_CATEGORIES[0]).gst;

const empty = { name: "", category: "activities", price: 0, offer_price: null, duration_min: null, description: "", active: true, gst_category: "activity", hsn_code: "" };

export default function Games() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/games").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Name & price required");
    try {
      const payload = { ...form, price: +form.price, offer_price: form.offer_price ? +form.offer_price : null, duration_min: form.duration_min ? +form.duration_min : null };
      if (editing) await api.patch(`/games/${editing}`, payload);
      else await api.post("/games", payload);
      toast.success("Saved!");
      setOpen(false); setForm(empty); setEditing(null); load();
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this activity?")) return;
    try { await api.delete(`/games/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const FUNLAND_DEFAULTS = [
    { name: "Bungy Jumping", category: "Adventure", price: 200, description: "" },
    { name: "Bull Ride", category: "Adventure", price: 150 },
    { name: "Segway", category: "Ride", price: 100 },
    { name: "Shooting", category: "Games", price: 200 },
    { name: "ATV Ride", category: "Adventure", price: 220 },
    { name: "Buggy Ride", category: "Ride", price: 150 },
    { name: "Water Roller", category: "Water", price: 150 },
    { name: "Horse Riding", category: "Ride", price: 100 },
    { name: "Paddle Boat", category: "Water", price: 100 },
    { name: "Motor Boating", category: "Water", price: 150 },
    { name: "Sky Cycle", category: "Adventure", price: 200 },
    { name: "Water Zorbing", category: "Water", price: 150 },
  ];
  const seedFunland = async () => {
    if (!window.confirm(`${FUNLAND_DEFAULTS.length} default Funland activities add karne hain?`)) return;
    let ok = 0, fail = 0;
    for (const g of FUNLAND_DEFAULTS) {
      try { await api.post("/games", { ...g, active: true, offer_price: null }); ok++; }
      catch { fail++; }
    }
    toast.success(`Added ${ok} activities${fail ? `, ${fail} failed` : ""}`);
    load();
  };

  const edit = (g) => { setEditing(g.id); setForm({ ...g, offer_price: g.offer_price ?? "", duration_min: g.duration_min ?? "" }); setOpen(true); };

  return (
    <div>
      <PageHead
        title="Items / Activities"
        subtitle={isAdmin ? "Food, rooms, activities, games — sab yahin manage karo" : "Items / activities list (view only)"}
        action={isAdmin && (
          <div className="flex gap-2">
            {list.length === 0 && <Button data-testid="seed-games-btn" onClick={seedFunland} className="rounded-full bg-secondary hover:bg-secondary/90 h-11 px-5 font-bold text-secondary-foreground">Load Funland defaults</Button>}
            <Button data-testid="new-game-btn" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        )}
      />

      {list.length === 0 ? (
        <EmptyState title="No games added yet" description={isAdmin ? "Trampoline, VR, Bowling — jo bhi rides ho add karo." : "Admin needs to add games."} action={isAdmin && <Button data-testid="empty-add-game" onClick={() => setOpen(true)} className="rounded-full">Add first game</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {list.map((g) => {
            const themes = {
              "entry":         { bg: "from-blue-100 to-sky-100",       accent: "text-blue-700",    pill: "bg-blue-500 text-white" },
              "food":          { bg: "from-rose-100 to-pink-100",      accent: "text-rose-700",    pill: "bg-rose-500 text-white" },
              "activities":    { bg: "from-amber-100 to-yellow-100",   accent: "text-amber-700",   pill: "bg-amber-500 text-white" },
              "dress":         { bg: "from-violet-100 to-purple-100",  accent: "text-violet-700",  pill: "bg-violet-500 text-white" },
              "others":        { bg: "from-slate-100 to-gray-100",     accent: "text-slate-700",   pill: "bg-slate-500 text-white" },
              // Legacy support
              "Adventure": { bg: "from-orange-100 to-red-100", accent: "text-red-600", pill: "bg-red-500 text-white" },
              "Water": { bg: "from-cyan-100 to-blue-100", accent: "text-cyan-700", pill: "bg-cyan-500 text-white" },
              "Ride": { bg: "from-amber-100 to-yellow-100", accent: "text-amber-700", pill: "bg-amber-500 text-white" },
              "Games": { bg: "from-purple-100 to-fuchsia-100", accent: "text-fuchsia-700", pill: "bg-fuchsia-500 text-white" },
              "games": { bg: "from-purple-100 to-fuchsia-100", accent: "text-fuchsia-700", pill: "bg-fuchsia-500 text-white" },
              "rooms": { bg: "from-cyan-100 to-blue-100", accent: "text-cyan-700", pill: "bg-cyan-500 text-white" },
              "miscellaneous": { bg: "from-slate-100 to-gray-100", accent: "text-slate-700", pill: "bg-slate-500 text-white" },
              "merchandise": { bg: "from-indigo-100 to-purple-100", accent: "text-indigo-700", pill: "bg-indigo-500 text-white" },
              "other": { bg: "from-slate-100 to-gray-100", accent: "text-slate-700", pill: "bg-slate-500 text-white" },
            };
            const t = themes[g.category] || { bg: "from-emerald-100 to-teal-100", accent: "text-emerald-700", pill: "bg-emerald-500 text-white" };
            const catLabel = (ITEM_CATEGORIES.find((c) => c.v === g.category) || {}).label || g.category;
            return (
              <Card key={g.id} className={`p-5 rounded-2xl hover:shadow-lg transition-all relative overflow-hidden bg-gradient-to-br ${t.bg} border-0`} data-testid={`game-card-${g.id}`}>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/40" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${t.pill}`}>{catLabel}</span>
                    {!g.active && <Badge variant="outline" className="rounded-full bg-white/70">Inactive</Badge>}
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className={`h-5 w-5 ${t.accent}`} />
                      <div className="font-black text-xl leading-tight">{g.name}</div>
                    </div>
                    {g.description && <div className="text-xs text-foreground/70 mt-1">{g.description}</div>}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      {g.offer_price && g.offer_price < g.price ? (
                        <div>
                          <span className={`text-3xl font-black ${t.accent}`}>{inr(g.offer_price)}</span>
                          <span className="ml-2 text-xs line-through text-foreground/50">{inr(g.price)}</span>
                        </div>
                      ) : (
                        <span className={`text-3xl font-black ${t.accent}`}>{inr(g.price)}</span>
                      )}
                      {g.duration_min && <div className="text-[10px] uppercase tracking-widest font-bold text-foreground/60 mt-1">{g.duration_min} min</div>}
                      <div className="text-[10px] uppercase tracking-widest font-black text-foreground/60 mt-1">GST {g.gst_category === "food" ? "5%" : "18%"} · {g.gst_category || "activity"}</div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button data-testid={`edit-game-${g.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => edit(g)}><Pencil className="h-4 w-4" /></Button>
                        <Button data-testid={`del-game-${g.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => remove(g.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing ? "Edit" : "New"} Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="game-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category*</Label>
                <select
                  data-testid="game-category"
                  value={form.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setForm({ ...form, category: cat, gst_category: gstFor(cat) });
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {ITEM_CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
                </select>
                <div className="text-[10px] text-muted-foreground mt-1">Aur category chahiye to "Other" ya "Miscellaneous" me daal do</div>
              </div>
              <div><Label>Duration (min)</Label><Input type="number" data-testid="game-duration" value={form.duration_min || ""} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Price* ₹</Label><Input type="number" data-testid="game-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Offer Price ₹</Label><Input type="number" data-testid="game-offer" value={form.offer_price || ""} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea data-testid="game-desc" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <div>
                <Label>GST Category*</Label>
                <select
                  data-testid="game-gst-cat"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.gst_category || "activity"}
                  onChange={(e) => setForm({ ...form, gst_category: e.target.value })}
                >
                  <option value="activity">Activity / Ride (18%)</option>
                  <option value="food">Food & Beverage (5%)</option>
                  <option value="room">Room / Stay (12%)</option>
                  <option value="clothing">Clothing (12%)</option>
                  <option value="merchandise">Merchandise (18%)</option>
                  <option value="goods">Goods (18%)</option>
                  <option value="other">Other (18%)</option>
                </select>
                <div className="text-[10px] text-muted-foreground mt-1">Internal record ke liye — customer bill par hide rehta hai</div>
              </div>
              <div>
                <Label>HSN / SAC code</Label>
                <Input data-testid="game-hsn" value={form.hsn_code || ""} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} placeholder="Auto — 999721 / 996331" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <Label htmlFor="game-active-switch">Active</Label>
              <Switch id="game-active-switch" data-testid="game-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="game-save" onClick={save} className="rounded-full bg-accent hover:bg-accent/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

```

---

## 25. PAGE — Packages
**File:** `frontend/src/pages/Packages.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PartyPopper, X as XIcon } from "lucide-react";

// GST rate reference (must match backend GST_RATE_BY_CATEGORY)
const CAT_OPTIONS = [
  { v: "activity",    label: "Activity / Games",   rate: 18 },
  { v: "food",        label: "Food / F&B",          rate: 5 },
  { v: "room",        label: "Room / Stay",         rate: 12 },
  { v: "clothing",    label: "Clothing",            rate: 12 },
  { v: "merchandise", label: "Merchandise",         rate: 18 },
  { v: "other",       label: "Other",               rate: 18 },
];
const rateFor = (cat) => (CAT_OPTIONS.find((c) => c.v === cat) || CAT_OPTIONS[0]).rate;

const empty = { name: "", type: "birthday", category: "", price: 0, offer_price: null, pax: 10, inclusions: "", description: "", active: true, gst_split: [] };

export default function Packages() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);       // items from /api/games to pick into gst_split
  const [pickerOpen, setPickerOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => api.get("/packages").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); api.get("/games").then((r) => setItems(r.data.filter((g) => g.active))).catch(() => {}); }, []);

  // Collect unique categories from the list
  const categories = Array.from(new Set(list.map((p) => (p.category || "").trim()).filter(Boolean))).sort();
  const filtered = filter === "all" ? list : list.filter((p) => (p.category || "").trim() === filter);

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Name & price required");
    const inclusions = typeof form.inclusions === "string" ? form.inclusions.split(",").map((s) => s.trim()).filter(Boolean) : form.inclusions;
    const price = +form.price;
    const gst_split = (form.gst_split || [])
      .map((s) => ({ label: (s.label || "").trim(), category: s.category || "activity", amount: +s.amount || 0 }))
      .filter((s) => s.amount > 0 && s.label);
    const splitSum = gst_split.reduce((s, r) => s + r.amount, 0);
    if (gst_split.length > 0 && Math.abs(splitSum - price) > 0.5) {
      return toast.error(`Split sum ₹${splitSum} must equal Price ₹${price}`);
    }
    const payload = { ...form, inclusions, price, offer_price: form.offer_price ? +form.offer_price : null, pax: +form.pax || 1, gst_split, food_portion: 0, activity_portion: 0 };
    try {
      if (editing) await api.patch(`/packages/${editing}`, payload);
      else await api.post("/packages", payload);
      toast.success("Saved!"); setOpen(false); setForm(empty); setEditing(null); load();
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const remove = async (id) => { if (!window.confirm("Delete package?")) return; try { await api.delete(`/packages/${id}`); load(); } catch (e) { toast.error(fmtErr(e)); } };
  const edit = (p) => {
    // Migrate legacy food_portion + activity_portion into gst_split if needed
    let gst_split = Array.isArray(p.gst_split) ? p.gst_split : [];
    if (gst_split.length === 0 && ((p.food_portion || 0) + (p.activity_portion || 0) > 0)) {
      gst_split = [];
      if (p.food_portion > 0) gst_split.push({ label: "Food", category: "food", amount: p.food_portion });
      if (p.activity_portion > 0) gst_split.push({ label: "Activity", category: "activity", amount: p.activity_portion });
    }
    setEditing(p.id);
    setForm({ ...p, inclusions: (p.inclusions || []).join(", "), offer_price: p.offer_price ?? "", gst_split });
    setOpen(true);
  };
  const addSplitRow = () => setForm((f) => ({ ...f, gst_split: [...(f.gst_split || []), { label: "", category: "activity", amount: 0 }] }));
  // Map item categories from Items page (entry/food/activities/dress/others) → backend GST category
  const ITEM_TO_GST = { entry: "activity", food: "food", activities: "activity", dress: "clothing", others: "other" };
  const addItemToSplit = (item) => {
    const gcat = ITEM_TO_GST[(item.category || "").toLowerCase()] || item.gst_category || "activity";
    const price = +item.offer_price || +item.price || 0;
    setForm((f) => ({
      ...f,
      gst_split: [...(f.gst_split || []), { label: item.name, category: gcat, amount: price, item_ref_id: item.id }],
    }));
    toast.success(`Added ${item.name}`);
  };
  const updateSplitRow = (i, patch) => setForm((f) => ({ ...f, gst_split: (f.gst_split || []).map((r, idx) => idx === i ? { ...r, ...patch } : r) }));
  const removeSplitRow = (i) => setForm((f) => ({ ...f, gst_split: (f.gst_split || []).filter((_, idx) => idx !== i) }));
  const autoFillFromInclusions = () => {
    // Split the price equally across current gst_split lines that have empty amount, or across all if empty
    let rows = form.gst_split || [];
    if (rows.length === 0) {
      const items = (typeof form.inclusions === "string" ? form.inclusions.split(",") : form.inclusions || []).map((s) => s.trim()).filter(Boolean);
      rows = items.slice(0, 6).map((label) => ({ label, category: "activity", amount: 0 }));
    }
    if (rows.length === 0) return toast.error("Add inclusions or add a row first");
    const per = Math.floor((+form.price || 0) / rows.length);
    const remainder = (+form.price || 0) - per * rows.length;
    const next = rows.map((r, i) => ({ ...r, amount: per + (i === 0 ? remainder : 0) }));
    setForm((f) => ({ ...f, gst_split: next }));
  };

  return (
    <div>
      <PageHead
        title="Packages"
        subtitle={isAdmin ? "Birthday, party, group — sabhi packages" : "Available packages"}
        action={isAdmin && <Button data-testid="new-pkg-btn" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add Package</Button>}
      />

      {list.length === 0 ? (
        <EmptyState title="No packages yet" description={isAdmin ? "Birthday, group ya party packages banayen." : "Admin will add packages."} />
      ) : (
        <>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button data-testid="pkg-filter-all" onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${filter === "all" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>All ({list.length})</button>
              {categories.map((c) => (
                <button key={c} data-testid={`pkg-filter-${c}`} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${filter === c ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>{c} ({list.filter((p) => p.category === c).length})</button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
            {filtered.map((p) => {
              const themes = {
                birthday: { bg: "from-pink-100 via-rose-100 to-red-100", accent: "text-rose-600", pill: "bg-rose-500 text-white", icon: "🎂" },
                party: { bg: "from-yellow-100 via-amber-100 to-orange-100", accent: "text-orange-600", pill: "bg-orange-500 text-white", icon: "🎉" },
                group: { bg: "from-cyan-100 via-sky-100 to-blue-100", accent: "text-blue-600", pill: "bg-blue-500 text-white", icon: "👥" },
                other: { bg: "from-emerald-100 via-green-100 to-teal-100", accent: "text-emerald-600", pill: "bg-emerald-500 text-white", icon: "✨" },
              };
              const t = themes[p.type] || themes.other;
              return (
                <Card key={p.id} className={`p-6 rounded-2xl hover:shadow-lg transition-all relative overflow-hidden bg-gradient-to-br ${t.bg} border-0`} data-testid={`pkg-card-${p.id}`}>
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/30" />
                  <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-white/20" />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/70 backdrop-blur flex items-center justify-center text-2xl shadow-sm">{t.icon}</div>
                        <div>
                          <div className="font-black text-2xl leading-tight" style={{ fontFamily: "Fraunces, serif" }}>{p.name}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-foreground/70">{p.type} · {p.pax} pax</div>
                        </div>
                      </div>
                      {p.category && <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${t.pill}`}>{p.category}</span>}
                    </div>
                    {p.description && <p className="text-sm text-foreground/80 mb-3">{p.description}</p>}
                    {p.inclusions?.length > 0 && (
                      <ul className="text-sm space-y-1 mb-4 bg-white/40 rounded-xl p-3 backdrop-blur">
                        {p.inclusions.map((inc, i) => <li key={i} className="flex gap-2"><span className={t.accent}>✓</span>{inc}</li>)}
                      </ul>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        {p.offer_price && p.offer_price < p.price ? (
                          <div>
                            <span className={`text-4xl font-black ${t.accent}`}>{inr(p.offer_price)}</span>
                            <span className="ml-2 text-sm line-through text-foreground/50">{inr(p.price)}</span>
                          </div>
                        ) : <span className={`text-4xl font-black ${t.accent}`}>{inr(p.price)}</span>}
                        {(() => {
                          // Prefer new gst_split, fall back to legacy portions
                          let split = Array.isArray(p.gst_split) && p.gst_split.length ? p.gst_split : [];
                          if (split.length === 0 && ((p.food_portion || 0) + (p.activity_portion || 0) > 0)) {
                            split = [];
                            if (p.food_portion > 0) split.push({ category: "food", amount: p.food_portion });
                            if (p.activity_portion > 0) split.push({ category: "activity", amount: p.activity_portion });
                          }
                          if (split.length === 0) return null;
                          return (
                            <div className="text-[10px] uppercase tracking-widest font-black text-foreground/60 mt-1 space-y-0.5">
                              {split.map((s, i) => (
                                <div key={i}>· {s.label || s.category} ₹{s.amount} @{rateFor(s.category)}%</div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button data-testid={`edit-pkg-${p.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => edit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button data-testid={`del-pkg-${p.id}`} size="icon" variant="ghost" className="hover:bg-white/60" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing ? "Edit" : "New"} Package</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="pkg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger data-testid="pkg-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Pax</Label><Input type="number" data-testid="pkg-pax" value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} /></div>
            </div>
            <div>
              <Label>Category (custom)</Label>
              <Input data-testid="pkg-category" list="pkg-cat-suggest" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Kids Special, Corporate, Weekend Combo" />
              <datalist id="pkg-cat-suggest">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <div className="text-xs text-muted-foreground mt-1">Same category use karke pakages group ho jayenge. Purani categories dropdown me suggest hongi.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Full Price* ₹</Label><Input type="number" data-testid="pkg-price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Offer Price ₹</Label><Input type="number" data-testid="pkg-offer" value={form.offer_price || ""} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></div>
            </div>
            <div><Label>Inclusions (comma separated)</Label><Textarea data-testid="pkg-incl" value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} placeholder="Cake, Decoration, Unlimited games..." /></div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3" data-testid="pkg-gst-split-card">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs uppercase tracking-widest font-black">GST Split (invoice pe alag-alag lines)</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)} className="h-8 text-xs" data-testid="pkg-pick-items-btn">📦 Pick from Items</Button>
                  <Button type="button" size="sm" variant="outline" onClick={autoFillFromInclusions} className="h-8 text-xs" data-testid="pkg-autofill-btn">Auto-fill</Button>
                  <Button type="button" size="sm" onClick={addSplitRow} className="h-8 text-xs bg-accent hover:bg-accent/90" data-testid="pkg-add-split-btn"><Plus className="h-3 w-3 mr-1" /> Blank line</Button>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Har line pe alag GST auto lagegi — Food 5%, Activity/Games 18%, Room 12%, Clothing 12%. Invoice ek hi banega but har chiz alag column me GST breakup ke saath aayegi. Empty rakhoge to poora price 18% activity ho jayega.
              </div>
              {(form.gst_split || []).length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-2">Koi split nahi. "Add line" pe click karo (e.g. Games ₹1200, Food ₹800).</div>
              ) : (
                <div className="space-y-2">
                  {(form.gst_split || []).map((row, i) => {
                    const rate = rateFor(row.category);
                    return (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center" data-testid={`pkg-split-row-${i}`}>
                        <div className="col-span-4">
                          <Input data-testid={`pkg-split-label-${i}`} placeholder="Label (e.g. Games)" value={row.label} onChange={(e) => updateSplitRow(i, { label: e.target.value })} className="h-9 text-sm" />
                        </div>
                        <div className="col-span-4">
                          <select
                            data-testid={`pkg-split-cat-${i}`}
                            value={row.category}
                            onChange={(e) => updateSplitRow(i, { category: e.target.value })}
                            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            {CAT_OPTIONS.map((c) => <option key={c.v} value={c.v}>{c.label} ({c.rate}%)</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Input data-testid={`pkg-split-amt-${i}`} type="number" placeholder="₹" value={row.amount || ""} onChange={(e) => updateSplitRow(i, { amount: e.target.value })} className="h-9 text-sm" />
                        </div>
                        <button type="button" onClick={() => removeSplitRow(i)} className="col-span-1 h-9 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center" data-testid={`pkg-split-remove-${i}`}>
                          <XIcon className="h-4 w-4" />
                        </button>
                        <div className="col-span-12 -mt-1 text-[10px] text-muted-foreground pl-1">
                          GST @{rate}% on ₹{+row.amount || 0} = ₹{((+row.amount || 0) * rate / 100).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                  {(() => {
                    const sum = (form.gst_split || []).reduce((s, r) => s + (+r.amount || 0), 0);
                    const ok = Math.abs(sum - (+form.price || 0)) < 0.5;
                    return (
                      <div className={`text-xs font-black flex items-center justify-between p-2 rounded-lg ${ok ? "bg-emerald-50 text-emerald-700" : "bg-destructive/10 text-destructive"}`} data-testid="pkg-split-sum">
                        <span>Split sum: ₹{sum.toFixed(2)}</span>
                        <span>Package price: ₹{(+form.price || 0).toFixed(2)}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div><Label>Description</Label><Textarea data-testid="pkg-desc" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <Label htmlFor="pkg-active-switch">Active</Label>
              <Switch id="pkg-active-switch" data-testid="pkg-active" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="pkg-save" onClick={save} className="rounded-full bg-accent hover:bg-accent/90">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="pkg-picker-dialog">
          <DialogHeader><DialogTitle className="text-2xl font-black">Pick items to include</DialogTitle></DialogHeader>
          <div className="text-xs text-muted-foreground mb-3">Category se auto GST lag jayegi. Multiple items add kar sakte ho — price bhi baad me change kar sakte ho.</div>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Koi item nahi hai. Pehle <b>Items / Activities</b> page pe items banao.</div>
          ) : (
            <div className="space-y-4">
              {["entry", "food", "activities", "dress", "others"].map((cat) => {
                const rows = items.filter((i) => (i.category || "").toLowerCase() === cat);
                if (rows.length === 0) return null;
                return (
                  <div key={cat} data-testid={`pkg-picker-group-${cat}`}>
                    <div className="text-xs uppercase tracking-widest font-black text-secondary mb-2">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rows.map((it) => (
                        <button
                          key={it.id}
                          data-testid={`pkg-picker-item-${it.id}`}
                          type="button"
                          onClick={() => addItemToSplit(it)}
                          className="text-left p-3 rounded-xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold truncate">{it.name}</div>
                            <div className="text-[10px] uppercase text-muted-foreground tracking-widest">{cat}</div>
                          </div>
                          <div className="text-lg font-black text-accent tabular-nums">{inr(+it.offer_price || +it.price || 0)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <Button type="button" onClick={() => setPickerOpen(false)} data-testid="pkg-picker-done" className="w-full rounded-full bg-accent hover:bg-accent/90 font-black">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

```

---

## 26. PAGE — Customers
**File:** `frontend/src/pages/Customers.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, Mail, Wallet, Calendar } from "lucide-react";

export function CustomersList() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/customers").then((r) => setList(r.data)).catch(() => {}); }, []);
  const filtered = list.filter((c) => (c.name + " " + (c.phone || "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHead title="Customers" subtitle="Sabhi customers ka history aur spend" />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input data-testid="cust-search" placeholder="Search name/phone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-11" />
      </div>
      {filtered.length === 0 ? <EmptyState title="No customers yet" description="Bills banate hi customers yahan auto save honge." /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((c) => (
            <Link key={c.id} to={`/customers/${encodeURIComponent(c.key)}`} data-testid={`cust-card-${c.id}`}>
              <Card className="p-5 rounded-2xl hover:shadow-md transition-shadow h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-lg">{c.name?.[0]?.toUpperCase() || "?"}</div>
                  <div className="min-w-0">
                    <div className="font-black truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.phone}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-muted-foreground uppercase tracking-widest font-bold">Visits</div><div className="font-black text-lg">{c.visits}</div></div>
                  <div><div className="text-muted-foreground uppercase tracking-widest font-bold">Spent</div><div className="font-black text-lg text-accent">{inr(c.total_spent)}</div></div>
                </div>
                <div className="text-xs text-muted-foreground mt-3">Last visit: {new Date(c.last_visit).toLocaleDateString()}</div>
              </Card>
            </Link>
          ))}
        </div>}
    </div>
  );
}

export function CustomerDetail() {
  const { key } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/customers/${encodeURIComponent(key)}`).then((r) => setData(r.data)).catch(() => {}); }, [key]);
  if (!data) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const c = data.customer;
  return (
    <div>
      <PageHead title={c.name} subtitle={`${c.visits} visits · ${inr(c.total_spent)} lifetime spend`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Profile</div>
          <div className="space-y-3 text-sm">
            <Row icon={User} label="Name" value={c.name} />
            <Row icon={Phone} label="Phone" value={c.phone || "—"} />
            <Row icon={Mail} label="Email" value={c.email || "—"} />
            <Row icon={Wallet} label="Total Spent" value={inr(c.total_spent)} bold />
            <Row icon={Calendar} label="First Visit" value={new Date(c.first_visit).toLocaleDateString()} />
            <Row icon={Calendar} label="Last Visit" value={new Date(c.last_visit).toLocaleDateString()} />
          </div>
        </Card>
        <Card className="p-6 rounded-2xl lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Visit History</div>
          {data.bills.length === 0 ? <div className="text-sm text-muted-foreground">No bills yet.</div> :
            <div className="space-y-2" data-testid="cust-history">
              {data.bills.map((b) => (
                <Link key={b.id} to={`/bills/${b.id}`} className="block p-3 bg-muted rounded-lg hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold">{b.bill_no}</div>
                    <div className="text-sm font-black text-accent">{inr(b.total)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{b.items?.length} items · {b.payment_method}</span>
                    <Badge variant="outline" className="rounded-full text-[10px]">{b.payment_status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(b.created_at).toLocaleString()}</div>
                </Link>
              ))}
            </div>}
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, bold }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="text-muted-foreground text-xs uppercase tracking-widest font-bold w-24">{label}</div>
      <div className={`flex-1 ${bold ? "font-black text-accent" : "font-semibold"}`}>{value}</div>
    </div>
  );
}

```

---

## 27. PAGE — Inquiries
**File:** `frontend/src/pages/Inquiries.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { Plus, Phone, Instagram, Facebook, MessageCircle, User, Copy, MessagesSquare, Send, Download, Upload, FileSpreadsheet, Archive, ArchiveRestore, Trash2 } from "lucide-react";

const STATUS_COLORS = {
  new: "bg-primary/20 text-accent border-primary",
  contacted: "bg-secondary/20 text-secondary border-secondary",
  converted: "bg-emerald-100 text-emerald-800 border-emerald-300",
  lost: "bg-muted text-muted-foreground border-border",
};

const SOURCE_ICONS = {
  "walk-in": Phone, phone: Phone, instagram: Instagram, facebook: Facebook, whatsapp: MessageCircle, referral: Phone, other: Phone,
};

const empty = { name: "", phone: "", email: "", source: "walk-in", interest: "", notes: "", status: "new" };

export default function Inquiries() {
  const { user, isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [execs, setExecs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [scope, setScope] = useState(isAdmin ? "all" : "mine");
  const [showArchived, setShowArchived] = useState(false);
  const [detailInq, setDetailInq] = useState(null);
  const [newRemark, setNewRemark] = useState("");
  const [webhookOpen, setWebhookOpen] = useState(false);

  const load = () => api.get("/inquiries", { params: showArchived ? { only_archived: 1 } : {} }).then((r) => setList(r.data)).catch(() => {});
  useEffect(() => {
    load();
    if (isAdmin) api.get("/users").then((r) => setExecs(r.data.filter((u) => u.is_marketing_exec)));
    // eslint-disable-next-line
  }, [isAdmin, showArchived]);

  const create = async () => {
    if (!form.name || !form.phone) return toast.error("Name & phone required");
    setBusy(true);
    try {
      const { data } = await api.post("/inquiries", form);
      toast.success(data.assigned_to_name ? `Saved — assigned to ${data.assigned_to_name}` : "Saved!");
      setOpen(false); setForm(empty); load();
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };
  const updateStatus = async (id, status) => {
    try { await api.patch(`/inquiries/${id}/status`, { status }); toast.success(`Marked ${status}`); load(); if (detailInq?.id === id) setDetailInq({ ...detailInq, status }); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const addRemark = async () => {
    if (!newRemark.trim()) return;
    try {
      const { data } = await api.post(`/inquiries/${detailInq.id}/remarks`, { text: newRemark });
      setDetailInq(data); setNewRemark(""); load();
      toast.success("Remark added");
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const reassign = async (uid) => {
    try {
      const { data } = await api.patch(`/inquiries/${detailInq.id}/assign`, { assigned_to: uid || null });
      setDetailInq(data); load();
      toast.success("Reassigned");
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const archiveInq = async (id) => {
    if (!window.confirm("Move this inquiry to archive? Data safe rahega — Archive tab se restore kar sakte ho.")) return;
    try { await api.delete(`/inquiries/${id}`); toast.success("Moved to archive"); setDetailInq(null); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const restoreInq = async (id) => {
    try { await api.post(`/inquiries/${id}/restore`); toast.success("Restored"); setDetailInq(null); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const downloadXlsx = async (path, filename) => {
    try {
      const res = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const exportXlsx = () => downloadXlsx("/inquiries/export.xlsx", `inquiries_${new Date().toISOString().slice(0,10)}.xlsx`);
  const downloadTemplate = () => downloadXlsx("/inquiries/template.xlsx", "inquiries_template.xlsx");
  const importXlsx = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/inquiries/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const msg = `Imported ${data.inserted} inquiries` + (data.skipped ? `, skipped ${data.skipped}` : "") + (data.errors?.length ? ` (${data.errors.length} errors)` : "");
      toast.success(msg);
      if (data.errors?.length) console.warn("Import errors:", data.errors);
      load();
    } catch (err) { toast.error(fmtErr(err)); }
  };

  const backendBase = process.env.REACT_APP_BACKEND_URL;
  const scoped = scope === "mine" ? list.filter((i) => i.assigned_to === user?.id) : list;
  const filtered = filter === "all" ? scoped : scoped.filter((i) => i.status === filter);

  return (
    <div>
      <PageHead
        title="Inquiries"
        subtitle="Har phone, walk-in aur social lead — auto-assigned to marketing execs"
        action={
          <div className="flex flex-wrap gap-2">
            <input id="inq-import-file" type="file" accept=".xlsx,.xls" onChange={importXlsx} className="hidden" data-testid="inq-import-input" />
            <Button data-testid="inq-archive-toggle" onClick={() => setShowArchived(!showArchived)} variant={showArchived ? "default" : "outline"} className={`rounded-full h-11 px-4 font-bold ${showArchived ? "bg-primary text-primary-foreground" : ""}`}>
              <Archive className="h-4 w-4 mr-1" /> {showArchived ? "Show Active" : "Archived"}
            </Button>
            <Button data-testid="inq-template-btn" onClick={downloadTemplate} variant="outline" className="rounded-full h-11 px-4 font-bold"><FileSpreadsheet className="h-4 w-4 mr-1" /> Template</Button>
            <Button data-testid="inq-import-btn" onClick={() => document.getElementById("inq-import-file").click()} variant="outline" className="rounded-full h-11 px-4 font-bold"><Upload className="h-4 w-4 mr-1" /> Import Excel</Button>
            <Button data-testid="inq-export-btn" onClick={exportXlsx} variant="outline" className="rounded-full h-11 px-4 font-bold"><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button data-testid="webhook-btn" onClick={() => setWebhookOpen(true)} variant="outline" className="rounded-full h-11 px-5 font-bold"><MessagesSquare className="h-4 w-4 mr-1" /> Channel Setup</Button>
            <Button data-testid="new-inquiry-btn" onClick={() => setOpen(true)} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> New</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {!isAdmin && (
          <div className="flex gap-1 mr-3">
            <button data-testid="scope-mine" onClick={() => setScope("mine")} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${scope === "mine" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>Mine</button>
            <button data-testid="scope-all" onClick={() => setScope("all")} className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${scope === "all" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>All</button>
          </div>
        )}
        {["all", "new", "contacted", "converted", "lost"].map((s) => (
          <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors ${filter === s ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>
            {s} {s !== "all" && `(${scoped.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No inquiries yet" description="Nayi inquiries webhook se auto aayengi ya manually add karo." action={<Button data-testid="empty-add-inquiry" onClick={() => setOpen(true)} className="rounded-full">Add first</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filtered.map((i) => {
            const Icon = SOURCE_ICONS[i.source] || Phone;
            return (
              <Card key={i.id} className={`p-5 rounded-2xl hover:shadow-md transition-shadow cursor-pointer ${i.is_deleted ? "opacity-70 border-dashed" : ""}`} data-testid={`inquiry-card-${i.id}`} onClick={() => setDetailInq(i)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-black text-lg">{i.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Icon className="h-3.5 w-3.5" /> {i.source}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`rounded-full border ${STATUS_COLORS[i.status]} font-bold uppercase text-[10px] tracking-widest`}>{i.status}</Badge>
                    {i.is_deleted && <Badge className="rounded-full bg-muted text-muted-foreground border-muted font-bold uppercase text-[9px] tracking-widest" data-testid="archived-badge">Archived</Badge>}
                  </div>
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <div><span className="text-muted-foreground">Phone: </span><span className="font-semibold">{i.phone}</span></div>
                  {i.interest && <div><span className="text-muted-foreground">Interest: </span><span className="font-semibold">{i.interest}</span></div>}
                  {i.notes && <div className="text-muted-foreground italic line-clamp-2">&quot;{i.notes}&quot;</div>}
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-secondary font-bold">
                    <User className="h-3 w-3" />
                    {i.assigned_to_name || "Unassigned"}
                  </div>
                  {(i.remarks?.length || 0) > 0 && <Badge variant="outline" className="rounded-full text-[10px]"><MessagesSquare className="h-3 w-3 mr-1" />{i.remarks.length}</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Inquiry */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">New Inquiry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="inq-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone*</Label><Input data-testid="inq-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input data-testid="inq-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger data-testid="inq-source"><SelectValue /></SelectTrigger>
                  <SelectContent>{["walk-in", "phone", "instagram", "facebook", "whatsapp", "referral", "other"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Interest (package/game)</Label><Input data-testid="inq-interest" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></div>
            </div>
            <div><Label>Initial Notes</Label><Textarea data-testid="inq-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="inq-save" disabled={busy} onClick={create} className="rounded-full bg-accent hover:bg-accent/90">Save (Auto-Assign)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailInq} onOpenChange={(v) => !v && setDetailInq(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailInq && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  {detailInq.name}
                  <Badge className={`rounded-full border ${STATUS_COLORS[detailInq.status]} text-[10px] uppercase`}>{detailInq.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl text-sm">
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Phone</div><div className="font-bold">{detailInq.phone}</div></div>
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Source</div><div className="font-bold capitalize">{detailInq.source}</div></div>
                  {detailInq.email && <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Email</div><div className="font-bold">{detailInq.email}</div></div>}
                  {detailInq.interest && <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Interest</div><div className="font-bold">{detailInq.interest}</div></div>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-widest">Status</Label>
                    <Select value={detailInq.status} onValueChange={(v) => updateStatus(detailInq.id, v)}>
                      <SelectTrigger data-testid="detail-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isAdmin && (
                    <div>
                      <Label className="text-xs uppercase tracking-widest">Assigned To</Label>
                      <Select value={detailInq.assigned_to || "none"} onValueChange={(v) => reassign(v === "none" ? null : v)}>
                        <SelectTrigger data-testid="detail-assign"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Unassigned —</SelectItem>
                          {execs.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!isAdmin && (
                    <div>
                      <Label className="text-xs uppercase tracking-widest">Assigned To</Label>
                      <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm font-bold">{detailInq.assigned_to_name || "Unassigned"}</div>
                    </div>
                  )}
                </div>

                {detailInq.notes && (
                  <div className="p-3 bg-primary/10 rounded-xl text-sm">
                    <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Initial notes</div>
                    <div>{detailInq.notes}</div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {detailInq.is_deleted ? (
                    <Button data-testid="detail-restore-btn" onClick={() => restoreInq(detailInq.id)} className="rounded-full h-9 px-4 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                      <ArchiveRestore className="h-4 w-4 mr-1" /> Restore
                    </Button>
                  ) : (
                    <Button data-testid="detail-archive-btn" onClick={() => archiveInq(detailInq.id)} variant="outline" className="rounded-full h-9 px-4 font-bold text-destructive hover:bg-destructive/10 border-destructive/40">
                      <Archive className="h-4 w-4 mr-1" /> Move to Archive
                    </Button>
                  )}
                  <div className="text-[10px] text-muted-foreground self-center">Archive se restore hamesha possible hai — permanent delete kabhi nahi hoga</div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-2">Remarks / Timeline</div>
                  <div className="space-y-2 max-h-56 overflow-y-auto" data-testid="remark-list">
                    {(detailInq.remarks || []).length === 0 && <div className="text-sm text-muted-foreground italic">No remarks yet. Add pehla remark — kya problem aayi convert karne me?</div>}
                    {(detailInq.remarks || []).map((r, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <div className="text-sm">{r.text}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">— {r.by} · {new Date(r.at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Textarea data-testid="remark-input" placeholder="Kya reason? Kaunsi objection? Follow-up plan?" value={newRemark} onChange={(e) => setNewRemark(e.target.value)} rows={2} />
                    <Button data-testid="remark-add" onClick={addRemark} className="rounded-full bg-accent hover:bg-accent/90 self-end"><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Webhook / Channel setup */}
      <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
        <DialogContent className="rounded-2xl max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">Auto Inquiries — Channel Setup</DialogTitle></DialogHeader>
          <ChannelSetup backendBase={backendBase} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Channel Setup panel ----------------
function ChannelSetup({ backendBase }) {
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState("whatsapp");
  useEffect(() => { api.get("/settings").then((r) => setSettings(r.data)).catch(() => {}); }, []);
  if (!settings) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  const secret = settings.inquiry_webhook_secret || "";
  const metaToken = settings.meta_verify_token || "";
  const URL = (ch) => `${backendBase}/api/inquiries/webhook/${ch}?secret=${secret}`;
  const metaUrl = `${backendBase}/api/inquiries/webhook/meta`;

  const CopyRow = ({ label, value, testid }) => (
    <div className="p-3 bg-muted rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary">{label}</div>
        <button data-testid={testid} onClick={async () => { const ok = await copyToClipboard(value); toast[ok ? "success" : "info"](ok ? "Copied" : "Manual copy shown"); }} className="text-xs font-bold text-primary flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
      </div>
      <code className="text-xs break-all font-mono">{value}</code>
    </div>
  );

  const TABS = [
    { v: "whatsapp",  label: "WhatsApp" },
    { v: "sms",       label: "SMS" },
    { v: "instagram", label: "Instagram" },
    { v: "facebook",  label: "Facebook" },
    { v: "zapier",    label: "Zapier" },
  ];

  return (
    <div className="space-y-4 text-sm">
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
        <div className="font-black text-emerald-800 mb-1">Yeh secret share mat karna 🔐</div>
        <div className="text-emerald-800">Ye secret aapke webhook URL me embedded hai. Kisi ke haath lag gaya to woh bogus inquiries daal sakta hai. Settings me kabhi bhi rotate kar sakte ho.</div>
      </div>
      <CopyRow label="Your webhook secret" value={secret} testid="copy-webhook-secret" />

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button key={t.v} data-testid={`ch-tab-${t.v}`} onClick={() => setTab(t.v)} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${tab === t.v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "whatsapp" && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Phase 1 — WhatsApp Business App (FREE, aaj chalu)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <div className="font-bold">Setup via Android SMS/Notification Forwarder (5 min):</div>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Funland ke WhatsApp Business phone pe install karo: <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://play.google.com/store/apps/details?id=io.github.bareya.smsforwarder">SMS Forwarder</a> ya <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://play.google.com/store/apps/details?id=de.k3b.android.smsimport">MacroDroid + Webhook</a></li>
              <li>App me: <b>Add Rule</b> → Trigger: WhatsApp Notification / New Message → Action: <b>Webhook POST</b></li>
              <li>URL me neeche wala copy-paste karo, method POST, content-type JSON:</li>
            </ol>
          </div>
          <CopyRow label="WhatsApp webhook URL" value={URL("whatsapp")} testid="copy-url-whatsapp" />
          <div className="p-3 bg-muted rounded-xl text-xs">
            <div className="font-bold mb-1">Body template (paste in the app):</div>
            <code className="block font-mono text-[10px] whitespace-pre">{`{
  "name": "{{sender}}",
  "phone": "{{sender}}",
  "message": "{{text}}"
}`}</code>
          </div>

          <div className="text-xs uppercase tracking-widest font-black text-secondary mt-6">Phase 2 — Meta WhatsApp Cloud API (FREE tier, verified)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Go to <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://developers.facebook.com/apps/">developers.facebook.com/apps</a> → Create App → Business → add <b>WhatsApp</b> product</li>
              <li>Webhook section me Callback URL neeche wala paste karo, Verify Token bhi neeche wala:</li>
            </ol>
          </div>
          <CopyRow label="Meta Callback URL" value={metaUrl} testid="copy-meta-url" />
          <CopyRow label="Meta Verify Token" value={metaToken} testid="copy-meta-token" />
          <div className="p-3 bg-muted rounded-xl text-xs">Subscribe fields: <b>messages</b>. Meta ki verification pass hote hi live inquiries flow hone lagengi.</div>

          <div className="text-xs uppercase tracking-widest font-black text-secondary mt-6">Alternative — Twilio WhatsApp (paid, 2-3 din)</div>
          <div className="p-4 border border-border rounded-xl text-xs">
            <div className="font-bold mb-1">Twilio Console → Messaging → Settings → WhatsApp Sandbox / Sender:</div>
            <div className="text-muted-foreground">Point "When a message comes in" webhook to URL below (POST). Twilio bheji hui form-urlencoded body auto-parse ho jayegi.</div>
          </div>
          <CopyRow label="Twilio WhatsApp webhook URL" value={URL("twilio")} testid="copy-url-twilio-wa" />
        </div>
      )}

      {tab === "sms" && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Phase 1 — Android SMS Forwarder (FREE)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Play Store se install karo: <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://play.google.com/store/apps/details?id=tech.bogomolov.incomingsmsgateway">SMS to URL Forwarder</a></li>
              <li>App khol ke <b>Add rule</b> → Sender: * (all), URL: neeche wala paste karo, JSON body:</li>
            </ol>
            <div className="p-3 bg-background rounded mt-2">
              <code className="block font-mono text-[10px] whitespace-pre">{`{ "from": "%from%", "text": "%text%", "sentStamp": "%sentStamp%" }`}</code>
            </div>
            <div className="text-muted-foreground">SMS aate hi auto-forward ho jayegi CRM me — koi cost nahi.</div>
          </div>
          <CopyRow label="SMS webhook URL" value={URL("sms")} testid="copy-url-sms" />

          <div className="text-xs uppercase tracking-widest font-black text-secondary mt-6">Alternative — Twilio SMS / MSG91 (paid)</div>
          <div className="p-3 bg-muted rounded-xl text-xs">Twilio ka "Inbound SMS webhook" ho MSG91 ka "Two-way SMS Webhook" — dono aapka URL <code>{URL("twilio")}</code> pe POST karenge. Body auto-parse.</div>
        </div>
      )}

      {(tab === "instagram" || tab === "facebook") && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Meta Business API (Instagram + Facebook — same setup)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li><b>Prep:</b> Aapke pass Instagram Business account (Facebook Page se linked) hona chahiye. Personal account nahi chalega.</li>
              <li>Go to <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://developers.facebook.com/apps/">developers.facebook.com/apps</a> → Create App → Business type</li>
              <li>Add products: <b>Instagram Graph API</b> + <b>Messenger</b> + (optional) <b>WhatsApp</b></li>
              <li>Webhook section me: Callback URL + Verify Token daalo (neeche se copy karo)</li>
              <li>Subscribe to fields: <code>messages</code>, <code>messaging_postbacks</code>, <code>messaging_referrals</code></li>
              <li>App Review submit karo (~1-2 hafte). Approval ke baad live inquiries aane lagengi.</li>
            </ol>
          </div>
          <CopyRow label="Meta Callback URL" value={metaUrl} testid={`copy-meta-url-${tab}`} />
          <CopyRow label="Meta Verify Token" value={metaToken} testid={`copy-meta-token-${tab}`} />
          {tab === "instagram" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <b>Bonus:</b> Bina API ke, tab tak aap Instagram Story / Post ki DMs ko manually Zapier "Instagram for Business → Zap" se bhi CRM ko pass kar sakte ho (Zapier tab dekho).
            </div>
          )}
        </div>
      )}

      {tab === "zapier" && (
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-widest font-black text-secondary">Zapier — universal bridge (FREE 100 tasks/month)</div>
          <div className="p-4 border border-border rounded-xl text-xs space-y-2">
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Sign up at <a className="text-primary font-bold underline" target="_blank" rel="noreferrer" href="https://zapier.com/">zapier.com</a></li>
              <li>Create Zap → Trigger: (any app — Instagram / FB / Gmail / SMS / Webhook)</li>
              <li>Action: <b>Webhooks by Zapier</b> → <b>POST</b> → URL below → Data: map fields <code>name</code>, <code>phone</code>, <code>message</code></li>
            </ol>
          </div>
          <CopyRow label="Zapier POST URL (choose source)" value={URL("whatsapp")} testid="copy-url-zapier" />
          <div className="text-xs text-muted-foreground">Har channel ka URL Zap me alag rakhna — path ke last part ko badalke (whatsapp / sms / instagram / facebook / call / other). Zapier ke free plan me ~100 inquiries/month auto process ho jayengi.</div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground border-t border-border pt-3">
        Sab channels round-robin se aapke <b>Marketing Executive</b> staff members me distribute honge. Staff page pe checkbox laga do.
      </div>
    </div>
  );
}

```

---

## 28. PAGE — Prebookings
**File:** `frontend/src/pages/Prebookings.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";
import { api, fmtErr, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { Calendar, Users, ExternalLink, Copy, Send, CheckCircle2, ArrowRight, MessageCircle, Mail, Phone } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-primary/20 text-accent border-primary",
  confirmed: "bg-secondary/20 text-secondary border-secondary",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-300",
  arrived: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function Prebookings() {
  const nav = useNavigate();
  const { isAdmin } = useAuth();
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendChannel, setSendChannel] = useState("whatsapp");
  const backend = process.env.REACT_APP_BACKEND_URL;

  const load = () => api.get("/prebookings").then((r) => setList(r.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try { await api.patch(`/prebookings/${id}/status`, { status }); toast.success(`Marked ${status}`); if (detail?.id === id) setDetail({ ...detail, status }); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const convert = async (id) => {
    try {
      const { data } = await api.post(`/prebookings/${id}/convert`);
      toast.success(`Bill ${data.bill_no} created`);
      setDetail(null); load();
      // Redirect directly to the newly-created bill
      const billId = data.bill_id || data.id || data.converted_bill_id;
      if (billId) nav(`/bills/${billId}`);
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const send = async () => {
    try {
      const { data } = await api.post(`/prebook/${detail.id}/send`, { channel: sendChannel });
      toast.success(data?.delivery?.simulated ? `Simulated ${sendChannel} send` : `Sent via ${sendChannel}`);
      setSendOpen(false);
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const doCopy = async (text, label) => {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(`${label} copied`); else toast.info("Manual copy fallback shown");
  };

  const bookingUrl = detail ? `${window.location.origin}/book/${detail.booking_no}` : "";
  const publicLink = `${window.location.origin}/book`;

  const filtered = filter === "all" ? (list || []) : (list || []).filter((b) => b.status === filter);
  const isLoading = list === null;

  return (
    <div>
      <PageHead
        title="Prebookings"
        subtitle="Online bookings — payment link + QR ke saath"
        action={
          <div className="flex gap-2">
            <Button data-testid="copy-public-link" onClick={() => doCopy(publicLink, "Public link")} variant="outline" className="rounded-full h-11 px-5 font-bold"><Copy className="h-4 w-4 mr-1" /> Copy Booking Link</Button>
            <a href={publicLink} target="_blank" rel="noreferrer"><Button data-testid="open-public-link" className="rounded-full h-11 px-5 font-bold bg-accent hover:bg-accent/90"><ExternalLink className="h-4 w-4 mr-1" /> Open Booking Page</Button></a>
          </div>
        }
      />

      <div className="p-4 bg-primary/10 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-1">Public Booking URL</div>
          <code data-testid="public-url" className="text-xs md:text-sm break-all font-bold">{publicLink}</code>
        </div>
        <div className="text-xs text-muted-foreground">Ise WhatsApp / Instagram / Facebook bio me daal do — customers direct book kar sakte hain</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "pending", "confirmed", "paid", "arrived", "cancelled"].map((s) => (
          <button key={s} data-testid={`pbk-filter-${s}`} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${filter === s ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary/20"}`}>
            {s} {s !== "all" && `(${(list || []).filter((b) => b.status === s).length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <Card key={i} className="p-5 rounded-2xl h-52 animate-pulse bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No prebookings yet" description="Public link share karo — customers direct book karenge yahan." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((b) => (
            <Card key={b.id} data-testid={`pbk-card-${b.id}`} className="p-5 rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetail(b)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{b.booking_no}</div>
                  <div className="font-black text-lg mt-1">{b.customer_name}</div>
                </div>
                <Badge className={`rounded-full border ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>
              </div>
              <div className="text-sm space-y-1 mb-3">
                <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {b.booking_date} {b.booking_time}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-3.5 w-3.5" /> {b.pax} pax · {b.items?.length || 0} items</div>
                <div className="text-muted-foreground">{b.customer_phone}</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-2xl font-black text-accent">{inr(b.total)}</div>
                <Badge variant="outline" className={`rounded-full text-[10px] ${b.payment_status === "paid" ? "text-emerald-700 border-emerald-300" : ""}`}>{b.payment_status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                  {detail.booking_no}
                  <Badge className={`rounded-full border ${STATUS_COLORS[detail.status]}`}>{detail.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl text-sm">
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Customer</div><div className="font-bold">{detail.customer_name}</div><div className="text-xs text-muted-foreground">{detail.customer_phone}{detail.customer_email ? ` · ${detail.customer_email}` : ""}</div></div>
                  <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Booking</div><div className="font-bold">{detail.booking_date} {detail.booking_time}</div><div className="text-xs text-muted-foreground">{detail.pax} pax · {detail.source}</div></div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-2">Items</div>
                  <div className="space-y-1">
                    {(detail.items || []).map((it, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 bg-muted rounded-lg">
                        <span className="font-bold">{it.name} <span className="text-xs text-muted-foreground uppercase">{it.kind}</span></span>
                        <span>{inr(it.price)} × {it.qty} = <b>{inr(it.price * it.qty)}</b></span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-border">
                    <span className="font-bold">Total</span><span className="text-2xl font-black text-accent">{inr(detail.total)}</span>
                  </div>
                </div>

                {detail.notes && <div className="p-3 bg-primary/10 rounded-xl text-sm">Note: {detail.notes}</div>}

                <div className="p-3 bg-muted rounded-xl flex items-center justify-between text-xs">
                  <code className="break-all flex-1">{bookingUrl}</code>
                  <Button data-testid="copy-detail-link" size="sm" variant="ghost" onClick={() => doCopy(bookingUrl, "Booking link")}><Copy className="h-3 w-3" /></Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1">Change Status</div>
                    <Select value={detail.status} onValueChange={(v) => updateStatus(detail.id, v)} disabled={!!detail.converted_bill_id && !isAdmin}>
                      <SelectTrigger data-testid="pbk-status-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="arrived">Arrived</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    {detail.converted_bill_id && !isAdmin && (
                      <div className="text-[10px] text-muted-foreground mt-1">🔒 Bill ban chuki hai — edit sirf admin</div>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button data-testid="pbk-send-btn" onClick={() => setSendOpen(true)} className="w-full rounded-full" variant="outline"><Send className="h-4 w-4 mr-1" /> Send Link</Button>
                  </div>
                </div>

                {detail.converted_bill_id && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800" data-testid="pbk-locked-info">
                    ✅ Yeh prebooking bill me convert ho chuki hai. Invoice edit karne ke liye <Link to={`/bills/${detail.converted_bill_id}`} className="font-black underline">bill open karo</Link>.
                  </div>
                )}

                {detail.razorpay_link && (
                  <a href={detail.razorpay_link} target="_blank" rel="noreferrer" className="block p-3 border-2 border-accent rounded-xl text-center font-bold hover:bg-accent hover:text-accent-foreground transition-colors">
                    Razorpay Payment Link <ExternalLink className="inline h-4 w-4 ml-1" />
                  </a>
                )}

                {detail.status !== "arrived" && (
                  <Button data-testid="pbk-convert" onClick={() => convert(detail.id)} className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black h-12">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Customer Arrived — Convert to Bill <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {detail.converted_bill_id && <Link to={`/bills/${detail.converted_bill_id}`}><Button variant="outline" className="w-full rounded-full">View Converted Bill</Button></Link>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">Send Booking Link</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3 my-4">
            {[
              { v: "whatsapp", label: "WhatsApp", icon: MessageCircle },
              { v: "sms", label: "SMS", icon: Phone },
              { v: "email", label: "Email", icon: Mail },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.v} data-testid={`pbk-send-${c.v}`} onClick={() => setSendChannel(c.v)} className={`p-4 rounded-xl border-2 ${sendChannel === c.v ? "border-accent bg-accent/10" : "border-border"}`}>
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-bold">{c.label}</div>
                </button>
              );
            })}
          </div>
          <Button data-testid="pbk-send-confirm" onClick={send} className="w-full rounded-full bg-accent hover:bg-accent/90 font-black h-12">Send</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

```

---

## 29. PAGE — PublicBook
**File:** `frontend/src/pages/PublicBook.jsx`

```jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";
import UpiPayBlock from "@/components/UpiPayBlock";
import { copyToClipboard } from "@/lib/clipboard";
import { Loader2, Gamepad2, PartyPopper, Plus, Minus, X, Calendar, Users, CheckCircle2, ExternalLink, Copy, Receipt } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/* ---------- Public Book page (customer-facing) ---------- */
export function PublicBook() {
  const [catalog, setCatalog] = useState(null);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", customer_email: "", booking_date: new Date().toISOString().slice(0, 10), booking_time: "", pax: 1, notes: "" });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    axios.get(`${API}/prebook/catalog`).then((r) => setCatalog(r.data)).catch(() => setCatalog({ games: [], packages: [] }));
  }, []);

  const priceOf = (i) => (i.offer_price && i.offer_price < i.price ? i.offer_price : i.price);
  const add = (item, kind) => setCart((c) => {
    const idx = c.findIndex((x) => x.ref_id === item.id);
    if (idx >= 0) { const nc = [...c]; nc[idx].qty++; return nc; }
    const initialQty = kind === "game" ? Math.max(1, +form.pax || 1) : 1;
    return [...c, { kind, ref_id: item.id, name: item.name, price: priceOf(item), qty: initialQty }];
  });
  const setQty = (i, q) => setCart((c) => c.map((x, idx) => idx === i ? { ...x, qty: Math.max(1, q) } : x));

  // When pax count changes, auto-sync qty for GAME/ITEM lines (per-head pricing).
  // Packages remain flat qty=1 (their price already covers the pax bundled inside).
  useEffect(() => {
    const p = Math.max(1, +form.pax || 1);
    setCart((c) => c.map((x) => x.kind === "game" ? { ...x, qty: p } : x));
    // eslint-disable-next-line
  }, [form.pax]);
  const removeAt = (i) => setCart((c) => c.filter((_, idx) => idx !== i));
  const total = useMemo(() => cart.reduce((s, x) => s + x.price * x.qty, 0), [cart]);

  const submit = async () => {
    if (!form.customer_name || !form.customer_phone) return toast.error("Name aur phone required");
    if (!cart.length) return toast.error("Kam se kam 1 item select karo");
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/prebook`, { ...form, items: cart, pax: +form.pax || 1 });
      toast.success(`Booking ${data.booking_no} confirmed!`);
      nav(`/book/${data.booking_no}`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed to book"); }
    finally { setBusy(false); }
  };

  if (!catalog) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/icon-192.png" alt="Funland" className="w-10 h-10 rounded-xl border border-border object-contain bg-white shadow-sm" />
          <div className="flex-1">
            <div className="font-black leading-none text-lg"><span className="text-accent">Fun</span><span className="text-secondary">land</span> <span className="text-foreground/70 font-bold text-sm">Adventure Park</span></div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Prebooking Portal · Indore</div>
          </div>
          <a href="https://funlandindore.com" className="text-[10px] uppercase tracking-widest font-black text-muted-foreground hover:text-accent hidden sm:inline">funlandindore.com</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-2">{catalog.park_name}</div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2" style={{ fontFamily: "Fraunces, serif" }}>Advance booking karke aao — no wait!</h1>
        <p className="text-muted-foreground mb-8">Apna birthday ya party package pehle select karo, payment karo aur direct entry lo.</p>

        <div className="space-y-6">
          {(() => {
              const groups = {};
              catalog.packages.forEach((p) => {
                const key = (p.category || "").trim() || "Others";
                (groups[key] = groups[key] || []).push(p);
              });
              const groupKeys = Object.keys(groups).sort((a, b) => (a === "Others" ? 1 : b === "Others" ? -1 : a.localeCompare(b)));
              if (catalog.packages.length === 0) {
                return (
                  <Card className="p-5 rounded-2xl">
                    <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Available Packages</div>
                    <div className="text-center text-sm text-muted-foreground py-10">Packages abhi available nahi hain. Kripya park pe call karke booking karo.</div>
                  </Card>
                );
              }
              return groupKeys.map((cat) => (
                <Card key={cat} className="p-5 rounded-2xl" data-testid={`pub-pkg-group-${cat}`}>
                  <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">{cat}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groups[cat].map((p) => (
                      <button key={p.id} data-testid={`pub-pkg-${p.id}`} onClick={() => add(p, "package")} className="text-left p-4 rounded-2xl border-2 border-border hover:border-accent hover:shadow-lg bg-white transition-all group">
                        <div className="flex items-center gap-2 mb-1"><PartyPopper className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" /><div className="font-black">{p.name}</div></div>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-widest font-black">{p.type} · {p.pax} pax</div>
                        {p.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</div>}
                        {p.inclusions?.length > 0 && (
                          <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                            {p.inclusions.slice(0, 3).map((inc, i) => <li key={i} className="flex gap-1"><span className="text-accent">•</span>{inc}</li>)}
                            {p.inclusions.length > 3 && <li className="text-[10px]">+ {p.inclusions.length - 3} more</li>}
                          </ul>
                        )}
                        <div className="flex items-baseline gap-2 mt-3">
                          {p.offer_price && p.offer_price < p.price ? (
                            <>
                              <span className="text-2xl font-black text-accent">{inr(p.offer_price)}</span>
                              <span className="text-xs line-through text-muted-foreground">{inr(p.price)}</span>
                            </>
                          ) : (
                            <span className="text-2xl font-black text-accent">{inr(p.price)}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              ));
            })()}

            <Card className="p-5 rounded-2xl">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Aapki details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><Label>Name*</Label><Input data-testid="pub-name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
                <div><Label>Phone*</Label><Input data-testid="pub-phone" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input data-testid="pub-email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
                <div><Label>People (pax)</Label><Input data-testid="pub-pax" type="number" min={1} value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} /></div>
                <div><Label>Booking Date*</Label><Input type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} /></div>
                <div><Label>Preferred Time</Label><Input placeholder="e.g. 5:30 PM" value={form.booking_time} onChange={(e) => setForm({ ...form, booking_time: e.target.value })} /></div>
              </div>
              <div className="mt-3"><Label>Notes</Label><Textarea rows={2} placeholder="Special requests…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </Card>

            {/* Booking summary moved to BOTTOM */}
            <Card className="p-6 rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5" data-testid="pub-summary">
              <div className="font-black text-2xl mb-4 flex items-center gap-2"><Receipt className="h-6 w-6 text-accent" /> Booking Summary</div>
              {cart.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">Upar se koi package ya item select karo</div> :
                <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
                  {cart.map((it, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-border">
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-sm truncate">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{inr(it.price)} × {it.qty} = <span className="font-bold text-foreground">{inr(it.price * it.qty)}</span></div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQty(i, it.qty - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center font-black text-sm">{it.qty}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setQty(i, it.qty + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeAt(i)}><X className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  ))}
                </div>}
              <div className="flex items-center justify-between text-2xl font-black pt-3 border-t-2 border-accent/30">
                <span>Total</span><span className="text-accent tabular-nums" data-testid="pub-total">{inr(total)}</span>
              </div>
              <Button data-testid="pub-book-btn" onClick={submit} disabled={busy || cart.length === 0 || !form.customer_name || !form.customer_phone} className="w-full mt-4 h-14 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black text-lg">
                {busy ? <Loader2 className="animate-spin h-5 w-5" /> : "Book Now →"}
              </Button>
              <div className="text-[10px] text-center text-muted-foreground mt-3">Booking ke baad payment link + QR aayega</div>
            </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Public confirmation page after booking ---------- */
export function PublicBookConfirm() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    axios.get(`${API}/prebook/${id}`).then((r) => setB(r.data)).catch((e) => setError(e?.response?.data?.detail || "Not found"));
  }, [id]);
  if (error) return <div className="min-h-screen flex items-center justify-center p-6"><Card className="p-8 max-w-md w-full text-center rounded-2xl"><div className="text-lg font-bold mb-2">Booking not found</div><div className="text-sm text-muted-foreground">{error}</div></Card></div>;
  if (!b) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-accent" /></div>;

  const park = b._park || {};
  const copyLink = async () => {
    const ok = await copyToClipboard(window.location.href);
    toast[ok ? "success" : "info"](ok ? "Link copied" : "Copy karke share karo");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-8 rounded-2xl mb-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Booking confirmed</div>
            <h1 className="text-3xl font-black mt-1" style={{ fontFamily: "Fraunces, serif" }}>{b.booking_no}</h1>
            <div className="text-muted-foreground text-sm mt-1">{park.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Name</div><div className="font-bold">{b.customer_name}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Phone</div><div className="font-bold">{b.customer_phone}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Date</div><div className="font-bold flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{b.booking_date} {b.booking_time}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Pax</div><div className="font-bold flex items-center gap-1"><Users className="h-3.5 w-3.5" />{b.pax}</div></div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead><tr className="border-b border-border"><th className="text-left py-2 text-xs uppercase tracking-widest font-bold text-muted-foreground">Item</th><th className="text-right">Qty</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {b.items.map((it, i) => (
                <tr key={i} className="border-b border-border"><td className="py-2 font-semibold">{it.name}</td><td className="text-right">{it.qty}</td><td className="text-right font-bold">{inr(it.price * it.qty)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-lg font-black">Total</span><span className="text-3xl font-black text-accent">{inr(b.total)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge className={`rounded-full ${b.payment_status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-primary/20 text-accent"}`}>Payment: {b.payment_status}</Badge>
            <Badge variant="outline" className="rounded-full">Status: {b.status}</Badge>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl mb-4">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Pay Now</div>
          {b.razorpay_link && (
            <a href={b.razorpay_link} target="_blank" rel="noreferrer" className="block p-4 mb-3 border-2 border-accent rounded-xl text-center font-black hover:bg-accent hover:text-accent-foreground transition-colors">
              Pay ₹{b.total} via Razorpay <ExternalLink className="inline h-4 w-4 ml-1" />
            </a>
          )}
          {(park.upi_qr_url || park.upi_id) ? (
            <UpiPayBlock settings={park} amount={b.total} note={`Booking ${b.bill_no || b.id}`} />
          ) : (!b.razorpay_link && (
            <div className="text-sm text-muted-foreground text-center py-4">Payment options will be shared on WhatsApp shortly.</div>
          ))}
          <div className="text-xs text-muted-foreground text-center mt-4">Payment ke baad park pe aake booking dikha do — direct entry milegi</div>
        </Card>

        <Card className="p-4 rounded-2xl flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Share this link with your family/friends</div>
          <Button size="sm" variant="outline" onClick={copyLink} className="rounded-full"><Copy className="h-4 w-4 mr-1" /> Copy Link</Button>
        </Card>

        {park.phone && <div className="text-center mt-6 text-sm text-muted-foreground">Any questions? Call us: <a href={`tel:${park.phone}`} className="font-bold text-secondary">{park.phone}</a></div>}
      </div>
    </div>
  );
}

```

---

## 30. PAGE — Marketing (with Team Report)
**File:** `frontend/src/pages/Marketing.jsx`

```jsx
import React, { useEffect, useState, useMemo } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { Instagram, Facebook, MessageCircle, Send, Mail, Phone, Copy, Download, Share2, Trophy, Users, TrendingUp, Clock, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";

const CHANNEL_ICON = { instagram: Instagram, facebook: Facebook, whatsapp: MessageCircle, sms: Phone, email: Mail };

const TEMPLATES = [
  { title: "Weekend Offer", message: "🎡 Weekend special at Funland! Flat 20% off on all rides. Book now: Funland Adventure Park, Indore." },
  { title: "Birthday Package", message: "🎂 Make birthdays unforgettable at Funland! Full birthday package with games, cake & decoration. DM us for booking." },
  { title: "Summer Camp", message: "☀️ Summer holidays at Funland! Unlimited rides, food & fun. Special group discounts for families." },
];

const PRESETS = [
  { v: "today",   label: "Today" },
  { v: "week",    label: "This week" },
  { v: "month",   label: "This month" },
  { v: "year",    label: "This year" },
  { v: "all",     label: "All time" },
];

export default function Marketing() {
  const [tab, setTab] = useState("report");
  return (
    <div>
      <PageHead title="Marketing" subtitle="Team ki performance report + campaigns" />
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 mb-6" data-testid="marketing-tabs">
        <button data-testid="tab-report" onClick={() => setTab("report")} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${tab === "report" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
          <Trophy className="h-4 w-4 inline mr-1" /> Team Report
        </button>
        <button data-testid="tab-campaigns" onClick={() => setTab("campaigns")} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${tab === "campaigns" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
          <Send className="h-4 w-4 inline mr-1" /> Campaigns
        </button>
      </div>

      {tab === "report" ? <TeamReport /> : <Campaigns />}
    </div>
  );
}

// ---------------- Team Report ----------------
function TeamReport() {
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(false);
  const isCustom = preset === "custom";

  const load = async () => {
    setLoading(true);
    try {
      const params = isCustom
        ? { params: { from: customFrom, to: customTo } }
        : { params: { preset } };
      const { data } = await api.get("/marketing/report", params);
      setRep(data);
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [preset, customFrom, customTo]);

  const downloadXlsx = async () => {
    try {
      const params = isCustom ? { from: customFrom, to: customTo } : { preset };
      const res = await api.get("/marketing/report.xlsx", { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `marketing_report_${(rep?.from || "")}_${(rep?.to || "").slice(0,10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  const shareText = useMemo(() => {
    if (!rep) return "";
    const lines = [
      `🎡 *Funland Marketing Report* — ${rep.label || ""}`,
      "",
      `Total inquiries: *${rep.totals.assigned}*`,
      `Converted: *${rep.totals.converted}*  (${rep.totals.conversion_rate}%)`,
      `In progress: ${rep.totals.contacted}`,
      `New (untouched): ${rep.totals.new}`,
      `Lost: ${rep.totals.lost}`,
      "",
      "*Executive-wise:*",
    ];
    (rep.executives || []).forEach((e) => {
      lines.push(`• ${e.name}: ${e.assigned} assigned · ${e.converted} converted (${e.conversion_rate}%)`);
    });
    return lines.join("\n");
  }, [rep]);

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };
  const copySummary = async () => {
    const ok = await copyToClipboard(shareText);
    toast[ok ? "success" : "info"](ok ? "Report summary copied" : "Copy failed");
  };
  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Marketing Report", text: shareText }); } catch {}
    } else {
      copySummary();
    }
  };

  if (loading && !rep) return <div className="p-8 text-sm text-muted-foreground text-center">Loading report…</div>;
  if (!rep) return <div className="p-8 text-sm text-muted-foreground text-center">No data</div>;

  return (
    <div className="space-y-6">
      {/* Toolbar: preset + custom range + actions */}
      <Card className="p-4 rounded-2xl" data-testid="report-toolbar">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {PRESETS.map((p) => (
              <button key={p.v} data-testid={`preset-${p.v}`} onClick={() => setPreset(p.v)} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === p.v ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>
                {p.label}
              </button>
            ))}
            <button data-testid="preset-custom" onClick={() => setPreset("custom")} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === "custom" ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>
              Custom range
            </button>
          </div>
          <div className="flex gap-2">
            <Button data-testid="report-download" onClick={downloadXlsx} variant="outline" className="rounded-full h-10 px-4 font-bold"><Download className="h-4 w-4 mr-1" /> Excel</Button>
            <Button data-testid="report-share-wa" onClick={shareWhatsApp} className="rounded-full h-10 px-4 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
            <Button data-testid="report-share-native" onClick={shareNative} variant="outline" className="rounded-full h-10 px-4 font-bold"><Share2 className="h-4 w-4 mr-1" /> Share</Button>
          </div>
        </div>
        {isCustom && (
          <div className="grid grid-cols-2 gap-3 mt-3 max-w-sm">
            <div>
              <Label className="text-xs">From</Label>
              <Input data-testid="custom-from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input data-testid="custom-to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-3">
          Range: <span className="font-black text-foreground">{rep.label}</span>
          {rep.unassigned?.assigned > 0 && <span className="ml-3 text-destructive font-bold">⚠️ {rep.unassigned.assigned} unassigned</span>}
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Users} label="Total inquiries" value={rep.totals.assigned} sub={`${rep.totals.new} untouched`} color="bg-primary/10 text-primary" testid="kpi-total" />
        <KPI icon={TrendingUp} label="Converted" value={rep.totals.converted} sub={`${rep.totals.conversion_rate}% rate`} color="bg-emerald-100 text-emerald-700" testid="kpi-converted" />
        <KPI icon={Clock} label="In progress" value={rep.totals.contacted} sub="Contacted but not closed" color="bg-secondary/10 text-secondary" testid="kpi-contacted" />
        <KPI icon={ArrowUpRight} label="Lost" value={rep.totals.lost} sub="Couldn't convert" color="bg-destructive/10 text-destructive" testid="kpi-lost" />
      </div>

      {/* Per-exec table */}
      <Card className="p-6 rounded-2xl" data-testid="exec-leaderboard">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary">Team Leaderboard</div>
            <h3 className="text-xl font-black">Marketing Executives</h3>
          </div>
        </div>
        {rep.executives.length === 0 ? (
          <EmptyState title="No marketing executives yet" description="Staff page pe kisi employee ko 'Marketing Executive' mark karo. Wo automatic inquiries me distribute honge." />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">#</th>
                  <th className="text-left py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Executive</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Assigned</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">New</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">In progress</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Converted</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Lost</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Rate</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Remarks</th>
                  <th className="text-right py-3 font-bold text-xs uppercase tracking-widest text-muted-foreground">Avg Response</th>
                </tr>
              </thead>
              <tbody>
                {rep.executives.map((e, i) => (
                  <tr key={e.id} className="border-b border-border/40 hover:bg-muted/40" data-testid={`exec-row-${e.id}`}>
                    <td className="py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${i === 0 ? "bg-yellow-100 text-yellow-800" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-bold">{e.name}</div>
                      <div className="text-[10px] text-muted-foreground">{e.email}</div>
                    </td>
                    <td className="py-3 text-right font-black tabular-nums">{e.assigned}</td>
                    <td className="py-3 text-right tabular-nums">{e.new}</td>
                    <td className="py-3 text-right tabular-nums">{e.contacted}</td>
                    <td className="py-3 text-right font-black text-emerald-700 tabular-nums">{e.converted}</td>
                    <td className="py-3 text-right tabular-nums">{e.lost}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-black ${e.conversion_rate >= 30 ? "bg-emerald-100 text-emerald-700" : e.conversion_rate >= 10 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                        {e.conversion_rate}%
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{e.remarks_added}</td>
                    <td className="py-3 text-right tabular-nums text-muted-foreground">{e.avg_response_hours != null ? `${e.avg_response_hours}h` : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-black">
                  <td colSpan={2} className="py-3">TOTAL</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.assigned}</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.new}</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.contacted}</td>
                  <td className="py-3 text-right tabular-nums text-emerald-700">{rep.totals.converted}</td>
                  <td className="py-3 text-right tabular-nums">{rep.totals.lost}</td>
                  <td className="py-3 text-right">{rep.totals.conversion_rate}%</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Assigned vs Converted bar */}
      {rep.executives.length > 0 && (
        <Card className="p-6 rounded-2xl" data-testid="exec-bar-chart">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Assigned vs Converted (per executive)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rep.executives.map((e) => ({ name: e.name, assigned: e.assigned, converted: e.converted, contacted: e.contacted }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="hsl(204 100% 45%)" name="Assigned" radius={[6,6,0,0]} />
                <Bar dataKey="contacted" fill="hsl(28 100% 49%)" name="In progress" radius={[6,6,0,0]} />
                <Bar dataKey="converted" fill="#10b981" name="Converted" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, color, testid }) {
  return (
    <Card className="p-4 rounded-2xl" data-testid={testid}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className="text-3xl font-black tabular-nums mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}

// ---------------- Campaigns (existing composer) ----------------
function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ title: "", channel: "whatsapp", message: "", image_url: "", audience: "all_customers", custom_phones: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/campaigns").then((r) => setCampaigns(r.data)).catch(() => {});
  useEffect(() => { load(); api.get("/integrations/status").then((r) => setStatus(r.data)); }, []);

  const send = async () => {
    if (!form.title || !form.message) return toast.error("Title & message required");
    setBusy(true);
    try {
      const payload = { ...form, custom_phones: form.custom_phones ? form.custom_phones.split(",").map((s) => s.trim()) : [] };
      const { data } = await api.post("/campaigns", payload);
      if (data.status === "draft") toast.success(`Draft saved for ${data.channel}. Copy & post manually!`);
      else if (data.status === "sent") toast.success(`Sent to ${data.sent_count}/${data.target_count}`);
      else toast.error("Send failed. Check integration credentials.");
      load();
    } catch (e) { toast.error(fmtErr(e)); }
    finally { setBusy(false); }
  };

  const copyMsg = async () => { const ok = await copyToClipboard(form.message); toast[ok ? "success" : "info"](ok ? "Message copied" : "Manual copy fallback shown"); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3 p-6 rounded-2xl">
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Compose Campaign</div>
        <div className="space-y-4">
          <div><Label>Title / Campaign Name</Label><Input data-testid="mk-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <Label>Channel</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
              {["instagram", "facebook", "whatsapp", "sms", "email"].map((c) => {
                const Icon = CHANNEL_ICON[c];
                const active = form.channel === c;
                return (
                  <button key={c} data-testid={`mk-ch-${c}`} onClick={() => setForm({ ...form, channel: c })} className={`p-3 rounded-xl border-2 transition-colors ${active ? "border-accent bg-accent/10" : "border-border"}`}>
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-bold capitalize">{c}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Audience</Label>
            <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
              <SelectTrigger data-testid="mk-audience"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_customers">All Customers (from bills)</SelectItem>
                <SelectItem value="recent_customers">Recent Customers (30 days)</SelectItem>
                <SelectItem value="inquiries">Inquiries</SelectItem>
                <SelectItem value="custom">Custom Phone List</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.audience === "custom" && (
            <div><Label>Phone numbers (comma separated)</Label><Textarea data-testid="mk-custom-phones" value={form.custom_phones} onChange={(e) => setForm({ ...form, custom_phones: e.target.value })} placeholder="+919999999999, +918888888888" /></div>
          )}
          <div>
            <div className="flex items-center justify-between">
              <Label>Message*</Label>
              <button onClick={copyMsg} className="text-xs text-secondary font-bold flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
            </div>
            <Textarea data-testid="mk-message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div><Label>Image URL (for social posts)</Label><Input data-testid="mk-image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
          {["instagram", "facebook"].includes(form.channel) && (
            <div className="p-3 bg-primary/10 rounded-xl text-xs">Social posts: We save this as a draft. Copy the message and post from your Instagram/Facebook app.</div>
          )}
          {form.channel === "whatsapp" && status && !status.twilio_whatsapp && (
            <div className="p-3 bg-primary/10 rounded-xl text-xs">Twilio WhatsApp not configured — sends will be simulated. Add credentials in backend .env.</div>
          )}
          <Button data-testid="mk-send" onClick={send} disabled={busy} className="w-full h-12 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-black">
            <Send className="h-4 w-4 mr-2" /> {["instagram", "facebook"].includes(form.channel) ? "Save Draft" : "Send Campaign"}
          </Button>
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Quick Templates</div>
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <button key={t.title} data-testid={`tpl-${t.title}`} onClick={() => setForm({ ...form, title: t.title, message: t.message })} className="w-full text-left p-3 bg-muted rounded-lg hover:bg-secondary/20 transition-colors">
                <div className="font-bold text-sm">{t.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.message}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-3">Recent Campaigns</div>
          {campaigns.length === 0 ? <div className="text-sm text-muted-foreground">No campaigns yet.</div> :
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {campaigns.map((c) => {
                const Icon = CHANNEL_ICON[c.channel] || MessageCircle;
                return (
                  <div key={c.id} className="p-3 bg-muted rounded-lg" data-testid={`campaign-${c.id}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-secondary" />
                      <div className="font-bold text-sm flex-1">{c.title}</div>
                      <Badge variant="outline" className="rounded-full text-[10px]">{c.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{c.message}</div>
                    <div className="text-xs mt-1 flex justify-between">
                      <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      {c.channel !== "instagram" && c.channel !== "facebook" && <span className="font-bold">{c.sent_count}/{c.target_count}</span>}
                    </div>
                  </div>
                );
              })}
            </div>}
        </Card>
      </div>
    </div>
  );
}

```

---

## 31. PAGE — Reports (Sales/GST/Payment/Expense)
**File:** `frontend/src/pages/Reports.jsx`

```jsx
import React, { useEffect, useMemo, useState } from "react";
import { api, fmtErr, inr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { Download, Share2, MessageCircle, TrendingUp, Receipt, IndianRupee, CreditCard, Plus, Trash2, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const PRESETS = [
  { v: "today", label: "Today" },
  { v: "week",  label: "Week" },
  { v: "month", label: "Month" },
  { v: "year",  label: "Year" },
  { v: "all",   label: "All time" },
];

const PIE_COLORS = ["#f97316","#10b981","#3b82f6","#a855f7","#ec4899","#eab308","#06b6d4","#f43f5e"];

export default function Reports() {
  const [tab, setTab] = useState("sales");
  const [preset, setPreset] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const params = preset === "custom" ? { from: customFrom, to: customTo } : { preset };

  const downloadXlsx = async () => {
    try {
      const res = await api.get("/reports/business.xlsx", { params, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = `business_report_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  return (
    <div>
      <PageHead title="Reports" subtitle="Sales · GST-3B · Payment Modes · Expenses" />

      <Card className="p-4 rounded-2xl mb-6" data-testid="reports-toolbar">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            {PRESETS.map((p) => (
              <button key={p.v} data-testid={`rep-preset-${p.v}`} onClick={() => setPreset(p.v)} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === p.v ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>{p.label}</button>
            ))}
            <button data-testid="rep-preset-custom" onClick={() => setPreset("custom")} className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${preset === "custom" ? "bg-accent text-accent-foreground" : "bg-muted hover:bg-muted/70"}`}>Custom</button>
          </div>
          <Button data-testid="rep-download" onClick={downloadXlsx} variant="outline" className="rounded-full h-10 px-4 font-bold"><Download className="h-4 w-4 mr-1" /> Full Excel</Button>
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3 mt-3 max-w-md">
            <div><Label className="text-xs">From</Label><Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2 mb-6" data-testid="report-tabs">
        <TabBtn active={tab === "sales"}    onClick={() => setTab("sales")}    testid="tab-sales"   icon={TrendingUp}><span>Sales</span></TabBtn>
        <TabBtn active={tab === "gst"}      onClick={() => setTab("gst")}      testid="tab-gst"     icon={Receipt}><span>GST-3B</span></TabBtn>
        <TabBtn active={tab === "payment"}  onClick={() => setTab("payment")}  testid="tab-payment" icon={CreditCard}><span>Payment Mode</span></TabBtn>
        <TabBtn active={tab === "expense"}  onClick={() => setTab("expense")}  testid="tab-expense" icon={Wallet}><span>Expenses</span></TabBtn>
      </div>

      {tab === "sales"    && <SalesTab params={params} />}
      {tab === "gst"      && <GstTab params={params} />}
      {tab === "payment"  && <PaymentTab params={params} />}
      {tab === "expense"  && <ExpenseTab params={params} />}
    </div>
  );
}

function TabBtn({ active, onClick, testid, icon: Icon, children }) {
  return (
    <button data-testid={testid} onClick={onClick} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 ${active ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function ShareBar({ shareText, testid }) {
  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareNative = async () => {
    if (navigator.share) { try { await navigator.share({ text: shareText }); } catch {} }
    else { const ok = await copyToClipboard(shareText); toast[ok?"success":"info"](ok?"Copied":"Copy failed"); }
  };
  return (
    <div className="flex gap-2 mt-4" data-testid={`${testid}-share`}>
      <Button size="sm" onClick={shareWA} className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" data-testid={`${testid}-share-wa`}><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
      <Button size="sm" variant="outline" onClick={shareNative} className="rounded-full font-bold" data-testid={`${testid}-share-native`}><Share2 className="h-4 w-4 mr-1" /> Share</Button>
    </div>
  );
}

function SalesTab({ params }) {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.get("/reports/sales", { params }).then((r) => setRep(r.data)).catch(() => {}); }, [JSON.stringify(params)]);
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `📊 *Sales Report* — ${rep.label}\nTotal: ${inr(rep.total_revenue)}\nBills: ${rep.paid_bills} paid, ${rep.pending_bills} pending\nAvg bill: ${inr(rep.avg_bill_value)}\n\nTop items:\n${rep.top_items.slice(0,5).map(i=>`• ${i.name} × ${i.qty}`).join("\n")}`;
  return (
    <div className="space-y-6" data-testid="sales-tab">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={IndianRupee} label="Revenue"       value={inr(rep.total_revenue)} sub={`${rep.label}`} testid="sales-kpi-revenue" />
        <KPI icon={Receipt}     label="Paid bills"    value={rep.paid_bills}         sub={`Avg ${inr(rep.avg_bill_value)}`} testid="sales-kpi-paid" />
        <KPI icon={Receipt}     label="Pending"       value={rep.pending_bills}      sub="Not collected"                    testid="sales-kpi-pending" />
        <KPI icon={TrendingUp}  label="Total bills"   value={rep.total_bills}        sub="Including all statuses"           testid="sales-kpi-total" />
      </div>
      <Card className="p-6 rounded-2xl" data-testid="sales-daily-chart">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Daily revenue</div>
        <div className="h-64">
          {rep.daily.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rep.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(28 100% 49%)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No sales" description="Selected range me koi paid bill nahi hai" />}
        </div>
      </Card>
      <Card className="p-6 rounded-2xl">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Top items sold</div>
        {rep.top_items.length ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Item</th><th className="text-right">Qty</th></tr></thead>
            <tbody>{rep.top_items.map((i) => <tr key={i.name} className="border-b border-border/40"><td className="py-2 font-bold">{i.name}</td><td className="text-right tabular-nums">{i.qty}</td></tr>)}</tbody>
          </table>
        ) : <div className="text-sm text-muted-foreground text-center py-6">No items in this range</div>}
      </Card>
      <ShareBar shareText={share} testid="sales" />
    </div>
  );
}

function GstTab({ params }) {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.get("/reports/gstr3b", { params }).then((r) => setRep(r.data)).catch(() => {}); }, [JSON.stringify(params)]);
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `🧾 *GSTR-3B Summary* — ${rep.label}\nInvoices: ${rep.invoice_count}\nTaxable: ${inr(rep.total_taxable)}\nCGST: ${inr(rep.total_cgst)}\nSGST: ${inr(rep.total_sgst)}\nIGST: ${inr(rep.total_igst)}\n*Total Tax: ${inr(rep.total_tax)}*`;
  return (
    <div className="space-y-6" data-testid="gst-tab">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Receipt}    label="Taxable value" value={inr(rep.total_taxable)} sub={`${rep.invoice_count} invoices`} testid="gst-kpi-taxable" />
        <KPI icon={IndianRupee} label="Total tax"    value={inr(rep.total_tax)}     sub="Filed via GSTR-3B"               testid="gst-kpi-total" />
        <KPI icon={Receipt}    label="CGST + SGST"   value={inr(rep.total_cgst + rep.total_sgst)} sub="Intra-state"      testid="gst-kpi-cs" />
        <KPI icon={Receipt}    label="IGST"          value={inr(rep.total_igst)}    sub="Inter-state"                    testid="gst-kpi-igst" />
      </div>
      <Card className="p-6 rounded-2xl" data-testid="gst-rate-table">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Rate-wise breakup</div>
        {rep.rate_wise.length ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Rate</th><th className="text-right">Taxable</th><th className="text-right">CGST</th><th className="text-right">SGST</th><th className="text-right">IGST</th></tr></thead>
            <tbody>
              {rep.rate_wise.map((r) => (
                <tr key={r.rate} className="border-b border-border/40">
                  <td className="py-2 font-black">{r.rate}%</td>
                  <td className="text-right tabular-nums">{inr(r.taxable)}</td>
                  <td className="text-right tabular-nums">{inr(r.cgst)}</td>
                  <td className="text-right tabular-nums">{inr(r.sgst)}</td>
                  <td className="text-right tabular-nums">{inr(r.igst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="text-sm text-muted-foreground text-center py-6">No GST collected in this range</div>}
      </Card>
      <ShareBar shareText={share} testid="gst" />
    </div>
  );
}

function PaymentTab({ params }) {
  const [rep, setRep] = useState(null);
  useEffect(() => { api.get("/reports/payment-mode", { params }).then((r) => setRep(r.data)).catch(() => {}); }, [JSON.stringify(params)]);
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `💳 *Payment Mode Report* — ${rep.label}\nCollected: ${inr(rep.total_paid)}\nPending: ${inr(rep.total_pending)}\n\nBy method:\n${rep.modes.map(m => `• ${m.method}: ${m.paid_count} bills, ${inr(m.paid_amount)}`).join("\n")}`;
  const pie = rep.modes.map((m) => ({ name: m.method, value: m.paid_amount }));
  return (
    <div className="space-y-6" data-testid="payment-tab">
      <div className="grid grid-cols-2 gap-3">
        <KPI icon={IndianRupee} label="Collected" value={inr(rep.total_paid)} sub={rep.label} testid="pay-kpi-paid" />
        <KPI icon={Receipt}    label="Pending"   value={inr(rep.total_pending)} sub="Awaiting" testid="pay-kpi-pending" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Distribution</div>
          <div className="h-64">
            {pie.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" outerRadius={80} label={(d) => d.name}>
                    {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => inr(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>}
          </div>
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">Per method</div>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2">Method</th><th className="text-right">Paid</th><th className="text-right">Pending</th></tr></thead>
            <tbody>
              {rep.modes.map((m) => (
                <tr key={m.method} className="border-b border-border/40">
                  <td className="py-2 font-bold capitalize">{m.method.replace("_", " ")}</td>
                  <td className="text-right tabular-nums"><div>{m.paid_count}</div><div className="text-xs text-emerald-700 font-black">{inr(m.paid_amount)}</div></td>
                  <td className="text-right tabular-nums text-muted-foreground"><div>{m.pending_count}</div><div className="text-xs">{inr(m.pending_amount)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <ShareBar shareText={share} testid="payment" />
    </div>
  );
}

function ExpenseTab({ params }) {
  const [rep, setRep] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), category: "other", description: "", amount: "", payment_method: "cash", payment_reference: "", vendor: "" });
  const load = () => api.get("/reports/expenses", { params }).then((r) => setRep(r.data)).catch(() => {});
  useEffect(() => { load(); }, [JSON.stringify(params)]);

  const save = async () => {
    if (!form.amount || +form.amount <= 0) return toast.error("Amount required");
    try {
      await api.post("/expenses", { ...form, amount: +form.amount });
      toast.success("Expense saved");
      setOpen(false); setForm({ date: new Date().toISOString().slice(0,10), category: "other", description: "", amount: "", payment_method: "cash", payment_reference: "", vendor: "" });
      load();
    } catch (e) { toast.error(fmtErr(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await api.delete(`/expenses/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  if (!rep) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  const share = `💸 *Expense Report* — ${rep.label}\nTotal: ${inr(rep.total)}\nEntries: ${rep.count}\n\nBy category:\n${rep.by_category.slice(0,6).map(c => `• ${c.category}: ${inr(c.amount)}`).join("\n")}`;

  return (
    <div className="space-y-6" data-testid="expense-tab">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{rep.label}</div>
          <h3 className="text-3xl font-black tabular-nums">{inr(rep.total)}</h3>
          <div className="text-sm text-muted-foreground">{rep.count} entries</div>
        </div>
        <Button data-testid="exp-add-btn" onClick={() => setOpen(true)} className="rounded-full bg-accent hover:bg-accent/90 font-bold"><Plus className="h-4 w-4 mr-1" /> New Expense</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">By category</div>
          {rep.by_category.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rep.by_category}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="amount" fill="#ec4899" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-sm text-muted-foreground text-center py-6">No expenses in this range</div>}
        </Card>
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">By month</div>
          {rep.by_month.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rep.by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v) => inr(v)} />
                <Bar dataKey="amount" fill="#a855f7" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-sm text-muted-foreground text-center py-6">No data</div>}
        </Card>
      </div>
      <Card className="p-6 rounded-2xl">
        <div className="text-xs uppercase tracking-widest font-bold text-secondary mb-3">All expenses</div>
        {rep.expenses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Date</th><th className="text-left">Category</th><th className="text-left">Description</th><th className="text-left">Vendor</th><th className="text-right">Amount</th><th></th></tr></thead>
              <tbody>
                {rep.expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border/40" data-testid={`exp-row-${e.id}`}>
                    <td className="py-2">{e.date}</td>
                    <td className="capitalize">{e.category}</td>
                    <td className="text-muted-foreground">{e.description}</td>
                    <td>{e.vendor}</td>
                    <td className="text-right font-black tabular-nums">{inr(e.amount)}</td>
                    <td><Button size="icon" variant="ghost" onClick={() => remove(e.id)} data-testid={`exp-del-${e.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-sm text-muted-foreground text-center py-6">No expenses yet</div>}
      </Card>
      <ShareBar shareText={share} testid="expense" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">New Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} data-testid="exp-date" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger data-testid="exp-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["rent","salary","utility","food","maintenance","marketing","travel","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount ₹*</Label><Input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} data-testid="exp-amount" /></div>
              <div><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} data-testid="exp-vendor" /></div>
              <div>
                <Label>Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({...form, payment_method: v})}>
                  <SelectTrigger data-testid="exp-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["cash","upi","bank","cheque","card","other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Reference</Label><Input value={form.payment_reference} onChange={(e) => setForm({...form, payment_reference: e.target.value})} data-testid="exp-ref" placeholder="UTR / cheque no" /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} data-testid="exp-desc" /></div>
            <Button onClick={save} className="w-full h-11 rounded-full bg-accent hover:bg-accent/90 font-black" data-testid="exp-save">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, testid }) {
  return (
    <Card className="p-4 rounded-2xl" data-testid={testid}>
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div>
      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className="text-2xl font-black tabular-nums mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}

```

---

## 32. PAGE — Attendance
**File:** `frontend/src/pages/Attendance.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, CalendarDays } from "lucide-react";

function fmtTime(iso) { return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"; }
function fmtDate(d) { return new Date(d).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }); }

export default function Attendance() {
  const { user, isAdmin } = useAuth();
  const [today, setToday] = useState(null);
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const load = async () => {
    try {
      const t = await api.get("/attendance/today"); setToday(t.data);
      const m = await api.get("/attendance/me"); setMine(m.data);
      if (isAdmin) { const a = await api.get("/attendance/all"); setAll(a.data); }
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, [isAdmin]);

  const doCheckIn = async () => {
    try { await api.post("/attendance/checkin", { notes: "" }); toast.success("Checked in!"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };
  const doCheckOut = async () => {
    try { await api.post("/attendance/checkout"); toast.success("Checked out!"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const canCheckIn = !today || !today.check_in;
  const canCheckOut = today && today.check_in && !today.check_out;

  return (
    <div>
      <PageHead title="Attendance" subtitle="Aaj ki punch aur weekly log" />

      <Card className="p-6 rounded-2xl mb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-secondary/10" />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-1">Aaj</div>
            <div className="text-5xl font-black tracking-tight tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
            <div className="text-sm text-muted-foreground mt-1">{now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
          <div className="flex gap-3">
            <Button data-testid="check-in-btn" disabled={!canCheckIn} onClick={doCheckIn} className={`h-14 px-8 rounded-full font-black text-base ${canCheckIn ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}>
              <LogIn className="h-5 w-5 mr-2" /> Check In
            </Button>
            <Button data-testid="check-out-btn" disabled={!canCheckOut} onClick={doCheckOut} className={`h-14 px-8 rounded-full font-black text-base ${canCheckOut ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`} variant={canCheckOut ? "default" : "outline"}>
              <LogOut className="h-5 w-5 mr-2" /> Check Out
            </Button>
          </div>
        </div>
        {today && (
          <div className="relative mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Check-In</div><div className="text-lg font-black">{fmtTime(today.check_in)}</div></div>
            <div><div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Check-Out</div><div className="text-lg font-black">{fmtTime(today.check_out)}</div></div>
          </div>
        )}
      </Card>

      <Card className="p-6 rounded-2xl mb-6">
        <div className="flex items-center gap-2 mb-4"><CalendarDays className="h-5 w-5 text-secondary" /><div className="font-black text-lg">Meri last 60 days ki attendance</div></div>
        {mine.length === 0 ? <div className="text-sm text-muted-foreground">No records yet.</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {mine.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                <div className="font-bold">{fmtDate(r.date)}</div>
                <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-secondary" /><span>{fmtTime(r.check_in)} → {fmtTime(r.check_out)}</span></div>
              </div>
            ))}
          </div>}
      </Card>

      {isAdmin && (
        <Card className="p-6 rounded-2xl">
          <div className="font-black text-lg mb-4">Team attendance (last 30 days)</div>
          {all.length === 0 ? <div className="text-sm text-muted-foreground">No punches yet.</div> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                    <th className="py-2">Staff</th><th className="py-2">Date</th><th className="py-2">In</th><th className="py-2">Out</th>
                  </tr>
                </thead>
                <tbody data-testid="all-attendance-tbody">
                  {all.map((r) => (
                    <tr key={r.id} className="border-b border-border">
                      <td className="py-3 font-bold">{r.user_name}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{fmtTime(r.check_in)}</td>
                      <td>{fmtTime(r.check_out)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </Card>
      )}
    </div>
  );
}

```

---

## 33. PAGE — Staff
**File:** `frontend/src/pages/Staff.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { PageHead, EmptyState } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Megaphone } from "lucide-react";

const ALL_PERMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "prebookings", label: "Prebookings" },
  { key: "inquiries", label: "Inquiries" },
  { key: "visit", label: "New Bill / Visit" },
  { key: "bills", label: "Bills" },
  { key: "customers", label: "Customers" },
  { key: "games", label: "Games / Activities" },
  { key: "packages", label: "Packages" },
  { key: "attendance", label: "Attendance" },
];
const DEFAULT_PERMS = ALL_PERMS.map((p) => p.key);

const empty = { name: "", email: "", phone: "", password: "", role: "employee", permissions: DEFAULT_PERMS, is_marketing_exec: false };

export default function Staff() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/users").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing && (!form.email || !form.password || !form.name)) return toast.error("Name, email, password required");
    try {
      if (editing) {
        const payload = { name: form.name, phone: form.phone, role: form.role, permissions: form.permissions, is_marketing_exec: form.is_marketing_exec };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${editing}`, payload);
      } else {
        await api.post("/users", form);
      }
      toast.success("Saved"); setOpen(false); setForm(empty); setEditing(null); load();
    }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this staff?")) return;
    try { await api.delete(`/users/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtErr(e)); }
  };

  const edit = (u) => {
    setEditing(u.id);
    setForm({
      name: u.name, email: u.email, phone: u.phone || "", password: "",
      role: u.role, permissions: u.permissions || DEFAULT_PERMS, is_marketing_exec: !!u.is_marketing_exec,
    });
    setOpen(true);
  };

  const togglePerm = (k) => setForm((f) => ({ ...f, permissions: f.permissions.includes(k) ? f.permissions.filter((x) => x !== k) : [...f.permissions, k] }));

  return (
    <div>
      <PageHead
        title="Staff"
        subtitle="Employee accounts, permissions aur marketing exec assign karo"
        action={<Button data-testid="new-staff-btn" onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="rounded-full bg-accent hover:bg-accent/90 h-11 px-6 font-bold"><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>}
      />

      {list.length === 0 ? <EmptyState title="No staff yet" /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {list.map((u) => (
            <Card key={u.id} className="p-5 rounded-2xl" data-testid={`staff-card-${u.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-lg">{u.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="font-black">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>
                <Badge className={`rounded-full ${u.role === "admin" ? "bg-accent text-accent-foreground" : "bg-secondary/20 text-secondary border-secondary"}`}>{u.role}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-3">{u.phone || "—"}</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {(u.permissions || (u.role === "admin" ? ["all"] : [])).slice(0, 6).map((p) => (
                  <Badge key={p} variant="outline" className="rounded-full text-[10px] capitalize">{p}</Badge>
                ))}
                {(u.permissions || []).length > 6 && <Badge variant="outline" className="rounded-full text-[10px]">+{u.permissions.length - 6}</Badge>}
              </div>
              {u.is_marketing_exec && <Badge className="rounded-full bg-primary/20 text-accent border-primary mb-3"><Megaphone className="h-3 w-3 mr-1" /> Marketing Exec</Badge>}
              <div className="flex gap-2">
                <Button data-testid={`edit-staff-${u.id}`} onClick={() => edit(u)} size="sm" variant="outline" className="rounded-full"><Shield className="h-4 w-4 mr-1" /> Edit</Button>
                {u.role !== "admin" && <Button data-testid={`del-staff-${u.id}`} onClick={() => remove(u.id)} size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </Card>
          ))}
        </div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black">{editing ? "Edit" : "Add"} Staff</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name*</Label><Input data-testid="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email{!editing && "*"}</Label><Input data-testid="staff-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} /></div>
              <div><Label>Phone</Label><Input data-testid="staff-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div><Label>Password{editing && " (leave blank to keep)"}{!editing && "*"}</Label><Input data-testid="staff-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="staff-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role !== "admin" && (
              <>
                <div>
                  <Label className="mb-2 block">Allowed Sections (kya-kya dikhega isko)</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl">
                    {ALL_PERMS.map((p) => (
                      <label key={p.key} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox
                          data-testid={`perm-${p.key}`}
                          checked={form.permissions.includes(p.key)}
                          onCheckedChange={() => togglePerm(p.key)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
                  <div>
                    <Label htmlFor="mk-exec" className="font-bold">Marketing Executive</Label>
                    <div className="text-xs text-muted-foreground">Naye webhook inquiries auto-assign ho round-robin</div>
                  </div>
                  <Switch id="mk-exec" data-testid="staff-mkexec" checked={form.is_marketing_exec} onCheckedChange={(v) => setForm({ ...form, is_marketing_exec: v })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button data-testid="staff-save" onClick={save} className="rounded-full bg-accent hover:bg-accent/90">{editing ? "Update" : "Add Staff"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

```

---

## 34. PAGE — Settings
**File:** `frontend/src/pages/Settings.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { api, fmtErr } from "@/lib/api";
import { PageHead } from "@/components/Page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export default function Settings() {
  const [form, setForm] = useState({ park_name: "", gst_rate: 0, upi_qr_url: "", upi_id: "", phone: "", address: "", google_review_url: "", google_reviews_shown: 0, google_rating: 0, firm_name: "", firm_gstin: "", firm_state_code: "23", firm_pan: "", firm_fssai: "", invoice_prefix: "" });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get("/settings").then((r) => setForm((f) => ({ ...f, ...r.data }))).catch(() => {});
    api.get("/integrations/status").then((r) => setStatus(r.data));
  }, []);

  const save = async () => {
    try {
      await api.patch("/settings", {
        ...form,
        gst_rate: +form.gst_rate || 0,
        google_reviews_shown: +form.google_reviews_shown || 0,
        google_rating: +form.google_rating || 0,
      });
      toast.success("Settings saved");
    } catch (e) { toast.error(fmtErr(e)); }
  };

  return (
    <div>
      <PageHead title="Settings" subtitle="Park info, GST aur UPI QR code" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Park Info</div>
          <div className="space-y-4">
            <div><Label>Park Name</Label><Input data-testid="set-park" value={form.park_name || ""} onChange={(e) => setForm({ ...form, park_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input data-testid="set-phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Textarea data-testid="set-addr" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Default GST %</Label><Input type="number" data-testid="set-gst" value={form.gst_rate || 0} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} /></div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Payment QR (GPay / Paytm / UPI)</div>
          <div className="space-y-4">
            <div><Label>UPI QR Image URL</Label><Input data-testid="set-qr" value={form.upi_qr_url || ""} onChange={(e) => setForm({ ...form, upi_qr_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>UPI ID (optional)</Label><Input data-testid="set-upi-id" value={form.upi_id || ""} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} placeholder="funland@paytm" /></div>
            {form.upi_qr_url && <img src={form.upi_qr_url} alt="QR" className="max-w-[240px] rounded-xl border border-border" />}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Google Reviews</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <Label>Google Review Link</Label>
                <Input data-testid="set-gmap-url" value={form.google_review_url || ""} onChange={(e) => setForm({ ...form, google_review_url: e.target.value })} placeholder="https://g.page/r/CXXXXXXXX/review" />
                <div className="text-xs text-muted-foreground mt-1">Google Business Profile → "Get more reviews" → copy link</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Total Reviews</Label>
                  <Input type="number" min={0} data-testid="set-greview-count" value={form.google_reviews_shown || 0} onChange={(e) => setForm({ ...form, google_reviews_shown: e.target.value })} />
                </div>
                <div>
                  <Label>Star Rating</Label>
                  <Input type="number" step="0.1" min={0} max={5} data-testid="set-grating" value={form.google_rating || 0} onChange={(e) => setForm({ ...form, google_rating: e.target.value })} placeholder="4.6" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              {form.google_review_url ? (
                <>
                  <div className="p-2 bg-white rounded-xl border border-border">
                    <QRCode value={form.google_review_url} size={140} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-2 text-center">This QR bill par bhi print hoga</div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground text-center">Link daalte hi QR yahaan generate ho jayega</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl lg:col-span-2" data-testid="gst-firm-card">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">GST / Tax Invoice details (Indian compliance)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Legal / Firm Name</Label>
              <Input data-testid="set-firm-name" value={form.firm_name || ""} onChange={(e) => setForm({ ...form, firm_name: e.target.value })} placeholder="M/s Funland Adventure Park" />
              <div className="text-xs text-muted-foreground mt-1">Tax invoice pe yahi naam print hoga</div>
            </div>
            <div>
              <Label>Firm GSTIN</Label>
              <Input data-testid="set-firm-gstin" value={form.firm_gstin || ""} onChange={(e) => setForm({ ...form, firm_gstin: e.target.value.toUpperCase() })} placeholder="23ABCDE1234F1Z5" maxLength={15} />
            </div>
            <div>
              <Label>State code (2-digit)</Label>
              <Input data-testid="set-firm-state" value={form.firm_state_code || ""} onChange={(e) => setForm({ ...form, firm_state_code: e.target.value })} placeholder="23 (MP)" maxLength={2} />
              <div className="text-xs text-muted-foreground mt-1">Same as customer = CGST+SGST · Different = IGST</div>
            </div>
            <div>
              <Label>PAN</Label>
              <Input data-testid="set-firm-pan" value={form.firm_pan || ""} onChange={(e) => setForm({ ...form, firm_pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} />
            </div>
            <div>
              <Label>FSSAI (for food)</Label>
              <Input data-testid="set-firm-fssai" value={form.firm_fssai || ""} onChange={(e) => setForm({ ...form, firm_fssai: e.target.value })} placeholder="14-digit FSSAI number" maxLength={14} />
            </div>
            <div>
              <Label>Invoice prefix (optional)</Label>
              <Input data-testid="set-inv-prefix" value={form.invoice_prefix || ""} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} placeholder="FL/24-25/" />
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl lg:col-span-2" data-testid="integration-status-card">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-secondary mb-4">Integration Status</div>
          {status ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <IntRow name="Razorpay Payment Links" ok={status.razorpay} help="Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in backend .env" />
              <IntRow name="Twilio SMS" ok={status.twilio_sms} help="Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM" />
              <IntRow name="Twilio WhatsApp" ok={status.twilio_whatsapp} help="Set TWILIO_WHATSAPP_FROM (in addition to SID/TOKEN)" />
              <IntRow name="Resend Email" ok={status.resend} help="Set RESEND_API_KEY" />
            </div>
          ) : <div className="text-sm text-muted-foreground">Loading…</div>}
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button data-testid="set-save" onClick={save} className="rounded-full h-12 px-8 bg-accent hover:bg-accent/90 font-black">Save Settings</Button>
      </div>
    </div>
  );
}

function IntRow({ name, ok, help }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-white flex items-start gap-3">
      {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
      <div className="flex-1">
        <div className="font-bold">{name}</div>
        <div className="text-xs text-muted-foreground mt-1">{ok ? "Configured ✓" : help}</div>
      </div>
    </div>
  );
}

```

---

## 35. PUBLIC — manifest.json (PWA)
**File:** `frontend/public/manifest.json`

```json
{
  "short_name": "Funland",
  "name": "Funland Adventure Park CRM",
  "description": "Funland Adventure Park Indore — Manager CRM, bookings, billing and staff.",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#FB8500",
  "background_color": "#F0F8FF",
  "categories": ["business", "productivity"]
}

```

---

## 36. PUBLIC — service-worker.js (Offline)
**File:** `frontend/public/service-worker.js`

```javascript
/* Funland CRM service worker — offline shell for PWA */
const CACHE_NAME = "funland-shell-v3";
const SHELL = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL).catch(() => null)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // NEVER cache API requests - always go network fresh
  if (url.pathname.startsWith("/api/")) return;

  // For same-origin GET navigation / assets: network-first, fallback to cache
  if (req.method === "GET" && url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && (req.destination === "document" || req.destination === "script" || req.destination === "style" || req.destination === "image" || req.destination === "font")) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone).catch(() => null));
          }
          return resp;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("/index.html"))
        )
    );
  }
});

```

---

## 37. PUBLIC — index.html
**File:** `frontend/public/index.html`

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FB8500" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Funland" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="description" content="Funland Adventure Park CRM - Indore" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet" />
        <!--
        manifest.json provides metadata used when your web app is installed on a
        user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
        -->
        <!--
        Notice the use of %PUBLIC_URL% in the tags above.
        It will be replaced with the URL of the `public` folder during the build.
        Only files inside the `public` folder can be referenced from the HTML.

        Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
        work correctly both with client-side routing and a non-root public URL.
        Learn how to configure a non-root public URL by running `npm run build`.
        -->
        <title>Funland Adventure Park CRM</title>
        <script>window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);</script>
        <script src="https://assets.emergent.sh/scripts/emergent-main.js"></script>
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
        <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
        <script>
            !(function (t, e) {
                var o, n, p, r;
                e.__SV ||
                    ((window.posthog = e),
                    (e._i = []),
                    (e.init = function (i, s, a) {
                        function g(t, e) {
                            var o = e.split(".");
                            2 == o.length && ((t = t[o[0]]), (e = o[1])),
                                (t[e] = function () {
                                    t.push(
                                        [e].concat(
                                            Array.prototype.slice.call(
                                                arguments,
                                                0,
                                            ),
                                        ),
                                    );
                                });
                        }
                        ((p = t.createElement("script")).type =
                            "text/javascript"),
                            (p.crossOrigin = "anonymous"),
                            (p.async = !0),
                            (p.src =
                                s.api_host.replace(
                                    ".i.posthog.com",
                                    "-assets.i.posthog.com",
                                ) + "/static/array.js"),
                            (r =
                                t.getElementsByTagName(
                                    "script",
                                )[0]).parentNode.insertBefore(p, r);
                        var u = e;
                        for (
                            void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
                                u.people = u.people || [],
                                u.toString = function (t) {
                                    var e = "posthog";
                                    return (
                                        "posthog" !== a && (e += "." + a),
                                        t || (e += " (stub)"),
                                        e
                                    );
                                },
                                u.people.toString = function () {
                                    return u.toString(1) + ".people (stub)";
                                },
                                o =
                                    "init me ws ys ps bs capture je Di ks register register_once register_for_session unregister unregister_for_session Ps getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Es $s createPersonProfile Is opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing Ss debug xs getPageViewId captureTraceFeedback captureTraceMetric".split(
                                        " ",
                                    ),
                                n = 0;
                            n < o.length;
                            n++
                        )
                            g(u, o[n]);
                        e._i.push([i, s, a]);
                    }),
                    (e.__SV = 1));
            })(document, window.posthog || []);
            posthog.init("phc_DbsPb39SRc8z3EiQ6Dhj6ikv4H4rTKcht9d4sZSesceP", {
                api_host: "https://ap.emergent.sh",
                person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well,
                session_recording: {
                    recordCrossOriginIframes: true,
                    capturePerformance: false,
                },
            });
        </script>
    </body>
</html>

```

---

## 38. DOCS — Mobile App Guide
**File:** `MOBILE_APP_GUIDE.md`

```markdown
# 📱 Funland CRM — Android App Build Guide

## What's included

Your existing web app is now wrapped as a native Android app via **Capacitor**.
The app is a lightweight shell (~5 MB APK) that loads your live web app so **any web change auto-reflects in the mobile app** without a rebuild.

- App ID: `in.funland.crm`
- App Name: `Funland CRM`
- Points to: `https://game-package-tracker.preview.emergentagent.com`
- Android project: `/app/frontend/android/`

---

## 🚀 Option A — Install PWA in 30 seconds (No Play Store needed)

**Sabse simple aur fast option**. Yahi 95% users ke liye best hai:

1. Phone me Chrome browser kholo
2. `https://game-package-tracker.preview.emergentagent.com` open karo
3. Login karo (`admin@funland.in` / `Funland@123`)
4. Chrome menu (⋮ 3 dots) → **"Install app"** / **"Add to Home Screen"**
5. Bas! Home screen par Funland icon aa jayega — click karke native app jaisa chalta hai
6. Offline bhi partially work karta hai, full-screen mode, no browser bars

**iOS pe**: Safari kholo → Share button → "Add to Home Screen"

---

## 📦 Option B — Build actual APK for Play Store

Aapko chahiye:
- Android Studio installed on your laptop (Windows/Mac/Linux)
- Java JDK 21+
- (Optional) Google Play Console developer account ($25 one-time) for Play Store submission

### Steps

1. **Download the android project** to your laptop:
   ```bash
   # Copy /app/frontend/android/ folder aur /app/frontend/capacitor.config.json to your local machine
   # Aap Emergent dashboard se code download kar sakte ho
   ```

2. **Open in Android Studio**:
   - Android Studio → Open → select `frontend/android/` folder
   - First open par Gradle sync automatic ho jayegi (5-10 min lag sakti hai)

3. **Build the APK**:
   - Menu: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
   - Wait for build to finish (2-3 min)
   - Click "locate" to find `app-debug.apk`

4. **Install on your phone**:
   - Copy the APK to your phone (WhatsApp/USB/Drive)
   - Allow "Install from unknown sources" in phone settings
   - Tap the APK to install

5. **For Play Store release**:
   - Menu: `Build → Generate Signed Bundle / APK...`
   - Create a keystore (save this file safely — you'll need it for every update)
   - Fill in details, choose "release" variant
   - Upload the generated `.aab` file to [Play Console](https://play.google.com/console)

---

## 🔄 When you update the web app

**Do nothing!** Since Capacitor loads your live web URL, every web deploy auto-updates the mobile app content. No re-build needed unless you change native settings (icons, splash screen, permissions).

## 🖼️ Custom app icon (optional)

Replace the following files with your Funland logo (1024×1024 PNG):
- `android/app/src/main/res/mipmap-*/ic_launcher.png` (multiple sizes)
- Easy way: Android Studio → right-click `res` → New → Image Asset → drop logo

## 🐛 Troubleshooting

- **White screen on launch**: Check internet connection; the app loads from remote URL
- **Gradle sync fails**: Update Android Studio + Java JDK to latest
- **Login not working**: Verify the backend URL in `capacitor.config.json` matches your live domain

---

## 🍎 iOS App (future)

Same setup works for iOS — requires a Mac with Xcode.
Run: `cd /app/frontend && npx cap add ios` (after copying to a Mac).

---

## 📝 Summary

| Feature | PWA | Capacitor APK |
|---|---|---|
| Install time | 30 sec | Need Android Studio |
| Play Store | ❌ (browser only) | ✅ |
| Auto-updates | ✅ | ✅ (loads live URL) |
| Push notifications | Limited | Full support (needs config) |
| Native APIs (camera, GPS) | Limited | Full access |
| **Recommended for you** | ✅ **Start here** | ✅ Play Store launch |

```

---

## 39. DOCS — test_credentials.md
**File:** `memory/test_credentials.md`

```markdown
# Funland CRM - Test Credentials

## Admin (full access) — VERIFIED WORKING 2026-07-26
- Email: `admin@funland.in`
- Password: `Funland@123`
- Role: `admin`

## Employee (created by admin from Staff page)
- Create via `POST /api/users` with role="employee" while logged in as admin
- Or use the Staff → Add Employee UI

## Auth Endpoints
- POST /api/auth/login  { email, password } → { token, user }
- GET  /api/auth/me    (Bearer token)

Token stored in localStorage key: `funland_token`

```

---

