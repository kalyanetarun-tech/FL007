"""Funland CRM backend integration tests."""
import os
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback to frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE}/api"

ADMIN_EMAIL = "admin@funland.in"
ADMIN_PASSWORD = "Funland@123"

# unique employee for this test run
EMP_EMAIL = f"test_emp_{uuid.uuid4().hex[:6]}@funland.in"
EMP_PASSWORD = "Employee@123"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_h(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def employee_setup(admin_h):
    """Create employee via admin, return login token."""
    r = requests.post(f"{API}/users", headers=admin_h, json={
        "email": EMP_EMAIL,
        "password": EMP_PASSWORD,
        "name": "TEST Employee",
        "role": "employee",
    })
    assert r.status_code == 200, r.text
    emp_id = r.json()["id"]
    l = requests.post(f"{API}/auth/login", json={"email": EMP_EMAIL, "password": EMP_PASSWORD})
    assert l.status_code == 200
    tok = l.json()["token"]
    yield {"id": emp_id, "token": tok, "headers": {"Authorization": f"Bearer {tok}"}}
    # cleanup
    requests.delete(f"{API}/users/{emp_id}", headers=admin_h)


# ---------------- Auth ----------------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_login_bad():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_login_admin(admin_token):
    assert admin_token
    # bcrypt hash format via me
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_me_no_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------------- Dashboard ----------------
def test_dashboard_stats(admin_h):
    r = requests.get(f"{API}/dashboard/stats", headers=admin_h)
    assert r.status_code == 200
    d = r.json()
    for k in ["revenue_today", "footfall_today", "inquiries_new", "total_inquiries", "pending_bills", "revenue_trend", "top_games"]:
        assert k in d, f"missing {k}"


# ---------------- Games ----------------
def test_games_admin_create_and_employee_forbidden(admin_h, employee_setup):
    payload = {"name": f"TEST_Ride_{uuid.uuid4().hex[:5]}", "category": "Ride", "price": 200.0, "offer_price": 150.0}
    r = requests.post(f"{API}/games", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    gid = r.json()["id"]
    assert r.json()["offer_price"] == 150.0

    # employee cannot create
    r2 = requests.post(f"{API}/games", headers=employee_setup["headers"], json=payload)
    assert r2.status_code == 403

    # employee can view
    r3 = requests.get(f"{API}/games", headers=employee_setup["headers"])
    assert r3.status_code == 200
    assert any(g["id"] == gid for g in r3.json())

    # cleanup
    requests.delete(f"{API}/games/{gid}", headers=admin_h)


# ---------------- Packages ----------------
def test_package_create(admin_h):
    payload = {"name": f"TEST_Bday_{uuid.uuid4().hex[:5]}", "type": "birthday", "price": 5000, "pax": 15,
               "inclusions": ["Cake", "Games", "Decor"]}
    r = requests.post(f"{API}/packages", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    assert r.json()["inclusions"] == ["Cake", "Games", "Decor"]
    # persisted
    r2 = requests.get(f"{API}/packages", headers=admin_h)
    assert any(p["id"] == pid for p in r2.json())
    requests.delete(f"{API}/packages/{pid}", headers=admin_h)


# ---------------- Package Category (iteration 10) ----------------
def test_package_category_create_and_update(admin_h):
    # Create with category
    payload = {"name": f"TEST_Cat_{uuid.uuid4().hex[:5]}", "type": "birthday", "price": 2500, "pax": 10,
               "inclusions": ["Cake"], "category": "Kids Special"}
    r = requests.post(f"{API}/packages", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    pid = body["id"]
    assert body.get("category") == "Kids Special"

    # GET verifies persistence
    r2 = requests.get(f"{API}/packages", headers=admin_h)
    match = [p for p in r2.json() if p["id"] == pid]
    assert match and match[0].get("category") == "Kids Special"

    # PATCH category to "Weekend"
    upd = {**payload, "category": "Weekend"}
    r3 = requests.patch(f"{API}/packages/{pid}", headers=admin_h, json=upd)
    assert r3.status_code == 200
    assert r3.json().get("category") == "Weekend"

    # GET verifies update persistence
    r4 = requests.get(f"{API}/packages", headers=admin_h)
    match2 = [p for p in r4.json() if p["id"] == pid]
    assert match2 and match2[0].get("category") == "Weekend"

    requests.delete(f"{API}/packages/{pid}", headers=admin_h)


def test_package_no_category_defaults_empty(admin_h):
    # Package created WITHOUT category field should default to empty string, not crash
    payload = {"name": f"TEST_NoCat_{uuid.uuid4().hex[:5]}", "type": "birthday", "price": 1000, "pax": 5,
               "inclusions": []}
    r = requests.post(f"{API}/packages", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    pid = body["id"]
    # category should be present as empty string (default)
    assert body.get("category", "") == ""
    # GET should also work fine
    r2 = requests.get(f"{API}/packages", headers=admin_h)
    assert r2.status_code == 200
    requests.delete(f"{API}/packages/{pid}", headers=admin_h)


def test_public_book_includes_packages_with_category(admin_h):
    # Create an active package with a category
    payload = {"name": f"TEST_Pub_{uuid.uuid4().hex[:5]}", "type": "birthday", "price": 3000, "pax": 8,
               "inclusions": ["Cake"], "category": "Corporate", "active": True}
    r = requests.post(f"{API}/packages", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    # public prebook catalog endpoint
    rb = requests.get(f"{API}/prebook/catalog")
    assert rb.status_code == 200
    pkgs = rb.json().get("packages", [])
    match = [p for p in pkgs if p.get("id") == pid]
    assert match, "package not in prebook/catalog"
    assert match[0].get("category") == "Corporate"
    requests.delete(f"{API}/packages/{pid}", headers=admin_h)


# ---------------- Inquiries ----------------
def test_inquiry_create_and_status(admin_h, employee_setup):
    r = requests.post(f"{API}/inquiries", headers=employee_setup["headers"], json={
        "name": "TEST_Cust", "phone": "9999999999", "source": "walk-in"
    })
    assert r.status_code == 200
    iid = r.json()["id"]

    # employee updates status
    r2 = requests.patch(f"{API}/inquiries/{iid}/status", headers=employee_setup["headers"],
                        json={"status": "contacted", "notes": "called"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "contacted"

    # admin also updates
    r3 = requests.patch(f"{API}/inquiries/{iid}/status", headers=admin_h,
                        json={"status": "converted"})
    assert r3.status_code == 200
    assert r3.json()["status"] == "converted"


def test_inquiry_webhook_whatsapp():
    payload = {"name": "TEST_Whatsapp_Lead", "phone": "9111111111", "message": "birthday enquiry"}
    r = requests.post(f"{API}/inquiries/webhook/whatsapp", json=payload)
    assert r.status_code == 200, r.text
    iid = r.json()["id"]
    # verify source=whatsapp via list (needs auth)
    tok = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}).json()["token"]
    r2 = requests.get(f"{API}/inquiries", headers={"Authorization": f"Bearer {tok}"})
    found = [i for i in r2.json() if i["id"] == iid]
    assert found and found[0]["source"] == "whatsapp"


# ---------------- Bills / Customers ----------------
@pytest.fixture(scope="module")
def bill_data(admin_h):
    payload = {
        "customer_name": "TEST_Anil",
        "customer_phone": "9000000001",
        "customer_email": "anil@test.com",
        "items": [
            {"kind": "game", "name": "Bumper Car", "price": 100, "qty": 2},
            {"kind": "custom", "name": "Snacks", "price": 50, "qty": 3},
        ],
        "discount": 20,
        "gst_percent": 18,
        "payment_method": "cash",
        "payment_status": "pending",
    }
    r = requests.post(f"{API}/bills", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    return r.json()


def test_bill_totals(bill_data):
    # subtotal = 2*100 + 3*50 = 350; after discount=330; gst=59.4; total=389.4
    assert bill_data["subtotal"] == 350.0
    assert bill_data["gst_amount"] == 59.4
    assert bill_data["total"] == 389.4
    assert bill_data["bill_no"].startswith("FL-")


def test_customer_upserted(admin_h, bill_data):
    r = requests.get(f"{API}/customers", headers=admin_h)
    assert r.status_code == 200
    cust = [c for c in r.json() if c["key"] == "9000000001"]
    assert cust, "customer not created"
    # detail
    r2 = requests.get(f"{API}/customers/9000000001", headers=admin_h)
    assert r2.status_code == 200
    data = r2.json()
    assert "customer" in data and "bills" in data
    assert any(b["id"] == bill_data["id"] for b in data["bills"])


def test_bill_mark_paid_and_dashboard(admin_h, bill_data):
    r = requests.patch(f"{API}/bills/{bill_data['id']}/status", headers=admin_h,
                       json={"payment_status": "paid"})
    assert r.status_code == 200
    assert r.json()["payment_status"] == "paid"
    r2 = requests.get(f"{API}/dashboard/stats", headers=admin_h)
    assert r2.json()["revenue_today"] >= bill_data["total"]


@pytest.mark.parametrize("channel", ["whatsapp", "sms", "email"])
def test_bill_send(admin_h, bill_data, channel):
    r = requests.post(f"{API}/bills/{bill_data['id']}/send", headers=admin_h, json={"channel": channel})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    # since no keys configured -> simulated=true
    assert body["delivery"].get("simulated") is True


# ---------------- Attendance ----------------
def test_attendance_flow(employee_setup, admin_h):
    h = employee_setup["headers"]
    r = requests.post(f"{API}/attendance/checkin", headers=h, json={"notes": "start"})
    assert r.status_code == 200, r.text
    # double check-in blocked
    r2 = requests.post(f"{API}/attendance/checkin", headers=h, json={})
    assert r2.status_code == 400
    r3 = requests.post(f"{API}/attendance/checkout", headers=h)
    assert r3.status_code == 200
    assert r3.json()["check_out"]
    r4 = requests.get(f"{API}/attendance/me", headers=h)
    assert r4.status_code == 200 and len(r4.json()) >= 1
    # admin all
    r5 = requests.get(f"{API}/attendance/all", headers=admin_h)
    assert r5.status_code == 200
    # employee blocked from all
    r6 = requests.get(f"{API}/attendance/all", headers=h)
    assert r6.status_code == 403


# ---------------- Settings ----------------
def test_settings_admin_only(admin_h, employee_setup):
    r = requests.patch(f"{API}/settings", headers=admin_h,
                       json={"park_name": "Funland Test", "gst_rate": 18.0, "upi_qr_url": "https://x/qr.png"})
    assert r.status_code == 200
    assert r.json()["park_name"] == "Funland Test"
    assert r.json()["gst_rate"] == 18.0
    # employee blocked
    r2 = requests.patch(f"{API}/settings", headers=employee_setup["headers"], json={"park_name": "hack"})
    assert r2.status_code == 403
    # get allowed for employee
    r3 = requests.get(f"{API}/settings", headers=employee_setup["headers"])
    assert r3.status_code == 200


# ---------------- Campaigns ----------------
def test_campaign_admin(admin_h, employee_setup):
    r = requests.post(f"{API}/campaigns", headers=admin_h, json={
        "title": "TEST Campaign",
        "channel": "whatsapp",
        "message": "Hello TEST",
        "audience": "all_customers",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert "sent_count" in body
    # instagram/facebook draft
    r2 = requests.post(f"{API}/campaigns", headers=admin_h, json={
        "title": "TEST IG", "channel": "instagram", "message": "hi", "audience": "all_customers"
    })
    assert r2.status_code == 200
    # employee forbidden
    r3 = requests.post(f"{API}/campaigns", headers=employee_setup["headers"], json={
        "title": "x", "channel": "whatsapp", "message": "x", "audience": "all_customers"
    })
    assert r3.status_code == 403


# ---------------- Integrations ----------------
def test_integrations_status(admin_h):
    r = requests.get(f"{API}/integrations/status", headers=admin_h)
    assert r.status_code == 200
    d = r.json()
    for k in ["razorpay", "twilio_sms", "twilio_whatsapp", "resend"]:
        assert k in d and isinstance(d[k], bool)
    # all false as env is empty
    assert not any(d.values())


# ---------------- Staff (users) admin only ----------------
def test_staff_list_admin_only(admin_h, employee_setup):
    r = requests.get(f"{API}/users", headers=admin_h)
    assert r.status_code == 200
    r2 = requests.get(f"{API}/users", headers=employee_setup["headers"])
    assert r2.status_code == 403
