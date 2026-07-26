"""Funland Adventure Park CRM backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import base64
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
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
    category: str = "Ride"
    price: float
    offer_price: Optional[float] = None
    duration_min: Optional[int] = None
    description: Optional[str] = ""
    active: bool = True

class PackageIn(BaseModel):
    name: str
    type: Literal["birthday", "party", "group", "other"] = "birthday"
    price: float
    offer_price: Optional[float] = None
    pax: int = 10
    inclusions: List[str] = []
    description: Optional[str] = ""
    active: bool = True

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

class BillIn(BaseModel):
    customer_name: str
    customer_phone: str = ""
    customer_email: Optional[str] = ""
    items: List[BillItem]
    discount: float = 0            # flat rupees discount
    discount_percent: float = 0    # OR percent discount (5-100)
    gst_percent: float = 0         # legacy: applied only if no per-item GST provided
    payment_method: Literal["cash", "upi_qr", "razorpay", "card", "other"] = "cash"
    payment_status: Literal["pending", "paid"] = "pending"
    notes: Optional[str] = ""

class AttendanceCheckIn(BaseModel):
    notes: Optional[str] = ""

class SettingsIn(BaseModel):
    park_name: Optional[str] = None
    gst_rate: Optional[float] = None
    upi_qr_url: Optional[str] = None
    upi_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

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

DEFAULT_EMP_PERMS = ["dashboard", "inquiries", "visit", "bills", "customers", "games", "packages", "attendance"]
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
async def list_inquiries(user: dict = Depends(get_current_user)):
    return await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

# Webhook endpoint - accepts inquiries from external sources (WhatsApp/Twilio, Meta, Zapier, etc.)
async def _pick_next_marketing_exec() -> Optional[dict]:
    """Round-robin pick next marketing executive."""
    execs = await db.users.find({"is_marketing_exec": True}, {"_id": 0, "id": 1, "name": 1}).sort("name", 1).to_list(100)
    if not execs:
        return None
    counter_doc = await db.counters.find_one_and_update(
        {"id": "rr_marketing"}, {"$inc": {"v": 1}}, upsert=True, return_document=True
    )
    idx = ((counter_doc or {}).get("v", 0) - 1) % len(execs)
    return execs[max(idx, 0)]

@api.post("/inquiries/webhook/{source}")
async def inquiry_webhook(source: str, payload: dict):
    """Public webhook - configure your channel provider to POST here.
    Expected payload: {name?, phone?, email?, message?, notes?}."""
    src_map = {"whatsapp": "whatsapp", "instagram": "instagram", "facebook": "facebook", "sms": "phone", "call": "phone", "web": "other"}
    assignee = await _pick_next_marketing_exec()
    doc = {
        "id": new_id(),
        "name": payload.get("name") or payload.get("from") or "Unknown",
        "phone": payload.get("phone") or payload.get("from") or "",
        "email": payload.get("email", ""),
        "source": src_map.get(source, "other"),
        "interest": payload.get("interest", ""),
        "notes": payload.get("message") or payload.get("notes", ""),
        "status": "new",
        "remarks": [],
        "assigned_to": assignee["id"] if assignee else None,
        "assigned_to_name": assignee["name"] if assignee else None,
        "created_by": "webhook",
        "created_by_name": f"{source} webhook",
        "created_at": now_iso(),
    }
    await db.inquiries.insert_one(doc)
    doc.pop("_id", None)
    logger.info(f"Webhook inquiry from {source}: {doc['name']} → {assignee['name'] if assignee else 'unassigned'}")
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

# ---------------- Bills / Visits ----------------
def _compute_bill_totals(items, discount, discount_percent, legacy_gst_percent):
    """Return (subtotal, discount_amount, gst_amount, total) with per-item GST support.
    If any item has gst_percent > 0, per-item GST is used. Otherwise legacy_gst_percent applies to (subtotal - discount)."""
    subtotal = round(sum(i["price"] * i["qty"] for i in items), 2)
    # discount: percent takes precedence if > 0
    if discount_percent and discount_percent > 0:
        pct = min(max(discount_percent, 0), 100)
        disc_amount = round(subtotal * pct / 100.0, 2)
    else:
        disc_amount = round(min(max(discount, 0), subtotal), 2)
    after_discount = max(subtotal - disc_amount, 0)
    ratio = (after_discount / subtotal) if subtotal > 0 else 0
    has_line_gst = any((i.get("gst_percent") or 0) > 0 for i in items)
    if has_line_gst:
        gst_amount = 0.0
        for it in items:
            line_taxable = it["price"] * it["qty"] * ratio
            gst_amount += line_taxable * ((it.get("gst_percent") or 0) / 100.0)
        gst_amount = round(gst_amount, 2)
    else:
        gst_amount = round(after_discount * (legacy_gst_percent / 100.0), 2)
    total = round(after_discount + gst_amount, 2)
    return subtotal, disc_amount, gst_amount, total

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
    items = [i.model_dump() for i in data.items]
    subtotal, disc_amount, gst_amount, total = _compute_bill_totals(items, data.discount, data.discount_percent, data.gst_percent)
    doc = {
        "id": new_id(),
        "bill_no": _bill_number(),
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
        "items": items,
        "discount": disc_amount,
        "discount_percent": data.discount_percent,
        "gst_percent": data.gst_percent,
        "gst_amount": gst_amount,
        "subtotal": subtotal,
        "total": total,
        "payment_method": data.payment_method,
        "payment_status": data.payment_status,
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
        }
        await db.settings.insert_one(s)
    s.pop("_id", None)
    return s

@api.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    return await _get_settings()

@api.patch("/settings")
async def update_settings(data: SettingsIn, _: dict = Depends(require_admin)):
    update = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
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

    inquiries_new = await db.inquiries.count_documents({"status": "new"})
    total_inquiries = await db.inquiries.count_documents({})
    pending_bills = await db.bills.count_documents({"payment_status": "pending"})

    # Revenue trend last 7 days
    trend = {}
    for i in range(7):
        d = (date.today() - timedelta(days=i)).isoformat()
        trend[d] = 0
    for b in bills_week:
        d = b["created_at"][:10]
        if d in trend and b.get("payment_status") == "paid":
            trend[d] += b.get("total", 0)
    trend_list = [{"date": d, "revenue": round(v, 2)} for d, v in sorted(trend.items())]

    # Top games
    pipeline_games = await db.bills.find({}, {"_id": 0, "items": 1}).to_list(5000)
    game_counts = {}
    for b in pipeline_games:
        for it in b.get("items", []):
            if it.get("kind") == "game":
                game_counts[it["name"]] = game_counts.get(it["name"], 0) + it.get("qty", 1)
    top_games = sorted([{"name": k, "count": v} for k, v in game_counts.items()], key=lambda x: -x["count"])[:5]

    return {
        "revenue_today": round(revenue_today, 2),
        "footfall_today": footfall_today,
        "inquiries_new": inquiries_new,
        "total_inquiries": total_inquiries,
        "pending_bills": pending_bills,
        "revenue_trend": trend_list,
        "top_games": top_games,
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
        inqs = await db.inquiries.find({}, {"_id": 0, "phone": 1, "email": 1}).to_list(5000)
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
        "",
    ]
    for it in bill["items"]:
        lines.append(f"- {it['name']} x{it['qty']}  ₹{it['price']*it['qty']}")
    lines.append("")
    lines.append(f"Subtotal: ₹{bill['subtotal']}")
    if bill["discount"]:
        lines.append(f"Discount: -₹{bill['discount']}")
    if bill["gst_amount"]:
        lines.append(f"GST ({bill['gst_percent']}%): ₹{bill['gst_amount']}")
    lines.append(f"*Total: ₹{bill['total']}*")
    lines.append(f"Status: {bill['payment_status'].upper()}")
    if bill.get("razorpay_link"):
        lines.append(f"Pay online: {bill['razorpay_link']}")
    if settings.get("upi_id"):
        lines.append(f"UPI: {settings['upi_id']}")
    lines.append("")
    lines.append("Thank you for visiting!")
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

@app.on_event("startup")
async def startup():
    await ensure_indexes()
    await seed_admin()
    await _get_settings()
    logger.info("Funland CRM startup complete")

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
