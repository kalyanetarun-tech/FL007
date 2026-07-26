"""Iteration 5: public prebooking flow + CRM management + convert-to-bill."""
import os
import re
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
                break
API = f"{BASE}/api"

ADMIN_EMAIL = "admin@funland.in"
ADMIN_PASSWORD = "Funland@123"


@pytest.fixture(scope="module")
def admin_h():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ---------- Public catalog ----------
def test_prebook_catalog_public_no_auth():
    r = requests.get(f"{API}/prebook/catalog")
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["park_name", "games", "packages", "upi_qr_url", "upi_id", "phone", "address"]:
        assert k in d, f"missing {k}"
    assert isinstance(d["games"], list)
    assert isinstance(d["packages"], list)


# ---------- Public create prebooking ----------
@pytest.fixture(scope="module")
def prebooking(admin_h):
    payload = {
        "customer_name": "TEST_Prebook_Cust",
        "customer_phone": "9111100022",
        "customer_email": "prebook@test.com",
        "booking_date": "2026-02-15",
        "booking_time": "5:30 PM",
        "pax": 4,
        "items": [
            {"kind": "game", "ref_id": "g1", "name": "Go Kart", "price": 250, "qty": 2},
            {"kind": "package", "ref_id": "p1", "name": "Birthday Pack", "price": 1500, "qty": 1},
        ],
        "notes": "Please arrange cake",
        "source": "web",
    }
    r = requests.post(f"{API}/prebook", json=payload)  # NOTE: no auth
    assert r.status_code == 200, r.text
    return r.json()


def test_prebook_create_public_no_auth(prebooking):
    b = prebooking
    assert "id" in b and b["id"]
    assert re.match(r"^BK-\d{6}-[A-F0-9]{5}$", b["booking_no"]), b["booking_no"]
    # total = 250*2 + 1500 = 2000
    assert b["total"] == 2000.0
    assert b["payment_status"] == "pending"
    assert b["status"] == "pending"
    assert "razorpay_link" in b  # may be null when creds missing
    assert "_id" not in b


def test_prebook_create_requires_items():
    r = requests.post(f"{API}/prebook", json={
        "customer_name": "X", "customer_phone": "9", "booking_date": "2026-02-15", "items": []
    })
    assert r.status_code == 400


def test_prebook_get_by_booking_no_public(prebooking):
    r = requests.get(f"{API}/prebook/{prebooking['booking_no']}")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["id"] == prebooking["id"]
    assert "_park" in d
    assert "name" in d["_park"]


def test_prebook_get_by_uuid_public(prebooking):
    r = requests.get(f"{API}/prebook/{prebooking['id']}")
    assert r.status_code == 200
    assert r.json()["booking_no"] == prebooking["booking_no"]


def test_prebook_get_nonexistent_404():
    r = requests.get(f"{API}/prebook/BK-999999-ZZZZZ")
    assert r.status_code == 404


# ---------- Auth: list prebookings ----------
def test_list_prebookings_requires_auth():
    r = requests.get(f"{API}/prebookings")
    assert r.status_code == 401


def test_list_prebookings_admin(admin_h, prebooking):
    r = requests.get(f"{API}/prebookings", headers=admin_h)
    assert r.status_code == 200
    lst = r.json()
    assert any(b["id"] == prebooking["id"] for b in lst)
    # sorted by created_at desc (first result recent)
    assert lst[0]["created_at"] >= lst[-1]["created_at"] if len(lst) > 1 else True


# ---------- Status update ----------
def test_status_paid_sets_payment_status(admin_h, prebooking):
    r = requests.patch(f"{API}/prebookings/{prebooking['id']}/status",
                       headers=admin_h, json={"status": "paid"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["status"] == "paid"
    assert d["payment_status"] == "paid"


def test_status_cancelled_sets_payment_cancelled(admin_h):
    # create new booking
    b = requests.post(f"{API}/prebook", json={
        "customer_name": "TEST_Cancel", "customer_phone": "9111100099",
        "booking_date": "2026-03-01", "items": [{"kind": "game", "ref_id": "g1", "name": "X", "price": 100, "qty": 1}]
    }).json()
    r = requests.patch(f"{API}/prebookings/{b['id']}/status",
                       headers=admin_h, json={"status": "cancelled"})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "cancelled"
    assert d["payment_status"] == "cancelled"


# ---------- Convert to bill ----------
def test_convert_to_bill(admin_h):
    # create a fresh prebooking
    payload = {
        "customer_name": "TEST_ConvertCust",
        "customer_phone": "9111100055",
        "booking_date": "2026-02-20",
        "items": [{"kind": "game", "ref_id": "g1", "name": "Ride", "price": 200, "qty": 3}],
    }
    b = requests.post(f"{API}/prebook", json=payload).json()
    assert b["total"] == 600.0

    r = requests.post(f"{API}/prebookings/{b['id']}/convert", headers=admin_h)
    assert r.status_code == 200, r.text
    bill = r.json()
    assert bill["bill_no"].startswith("FL-")
    assert bill["subtotal"] == 600.0
    assert bill["total"] == 600.0
    assert bill["prebooking_id"] == b["id"]
    # prebook now shows arrived + converted_bill_id
    pb = requests.get(f"{API}/prebook/{b['id']}").json()
    assert pb["status"] == "arrived"
    assert pb["converted_bill_id"] == bill["id"]
    # bill exists in /api/bills
    bills = requests.get(f"{API}/bills", headers=admin_h).json()
    assert any(x["id"] == bill["id"] for x in bills)


# ---------- Send link ----------
@pytest.mark.parametrize("channel", ["whatsapp", "sms", "email"])
def test_send_prebook_link(admin_h, prebooking, channel):
    r = requests.post(f"{API}/prebook/{prebooking['id']}/send",
                      headers=admin_h, json={"channel": channel})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ok"] is True
    assert "public_url" in d
    assert prebooking["booking_no"] in d["public_url"]
    assert d["delivery"].get("simulated") is True  # no creds


# ---------- Dashboard stats includes pending_prebookings ----------
def test_dashboard_has_pending_prebookings(admin_h):
    r = requests.get(f"{API}/dashboard/stats", headers=admin_h)
    assert r.status_code == 200
    assert "pending_prebookings" in r.json()
    assert isinstance(r.json()["pending_prebookings"], int)


# ---------- Employee default perms include prebookings ----------
def test_new_employee_has_prebookings_perm(admin_h):
    email = f"TEST_pbperm_{uuid.uuid4().hex[:6]}@funland.in"
    r = requests.post(f"{API}/users", headers=admin_h, json={
        "email": email, "password": "Emp@12345", "name": "TEST PB Perm", "role": "employee",
    })
    assert r.status_code == 200
    u = r.json()
    assert "prebookings" in u["permissions"]
    requests.delete(f"{API}/users/{u['id']}", headers=admin_h)
