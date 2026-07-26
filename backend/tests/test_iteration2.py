"""Iteration 2: permissions, marketing exec round-robin, remarks, per-item GST, percent discount."""
import os
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
    body = r.json()
    # Admin login response should include permissions + is_marketing_exec
    assert "permissions" in body["user"]
    assert "is_marketing_exec" in body["user"]
    assert body["user"]["is_marketing_exec"] is False
    # admin should have full perms including staff/marketing/settings
    for p in ["dashboard", "staff", "marketing", "settings", "inquiries", "bills"]:
        assert p in body["user"]["permissions"], f"missing perm {p}"
    return {"Authorization": f"Bearer {body['token']}"}


def _make_employee(admin_h, permissions, is_mkexec=False, name_prefix="TEST_emp"):
    email = f"{name_prefix}_{uuid.uuid4().hex[:6]}@funland.in"
    payload = {
        "email": email,
        "password": "Emp@12345",
        "name": f"{name_prefix} {uuid.uuid4().hex[:4]}",
        "role": "employee",
        "permissions": permissions,
        "is_marketing_exec": is_mkexec,
    }
    r = requests.post(f"{API}/users", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    return r.json(), email


# ---------------- Users: permissions + marketing exec ----------------
def test_create_user_with_permissions_and_mkexec(admin_h):
    perms = ["dashboard", "inquiries", "bills"]
    user, email = _make_employee(admin_h, perms, is_mkexec=True)
    assert user["permissions"] == perms
    assert user["is_marketing_exec"] is True
    # login and verify /auth/me returns them
    tok = requests.post(f"{API}/auth/login", json={"email": email, "password": "Emp@12345"}).json()["token"]
    me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}).json()
    assert me["permissions"] == perms
    assert me["is_marketing_exec"] is True
    # cleanup
    requests.delete(f"{API}/users/{user['id']}", headers=admin_h)


def test_patch_user_permissions_and_mkexec(admin_h):
    user, _ = _make_employee(admin_h, ["dashboard"], is_mkexec=False)
    new_perms = ["dashboard", "inquiries", "customers"]
    r = requests.patch(f"{API}/users/{user['id']}", headers=admin_h,
                       json={"permissions": new_perms, "is_marketing_exec": True})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["permissions"] == new_perms
    assert body["is_marketing_exec"] is True
    requests.delete(f"{API}/users/{user['id']}", headers=admin_h)


def test_login_default_perms_for_new_employee(admin_h):
    # No permissions given → should default to DEFAULT_EMP_PERMS
    email = f"TEST_defp_{uuid.uuid4().hex[:6]}@funland.in"
    r = requests.post(f"{API}/users", headers=admin_h, json={
        "email": email, "password": "Emp@12345", "name": "TEST Default", "role": "employee",
    })
    assert r.status_code == 200
    u = r.json()
    for p in ["dashboard", "inquiries", "bills", "attendance"]:
        assert p in u["permissions"]
    # admin/staff/settings NOT in default emp perms
    for p in ["staff", "marketing", "settings"]:
        assert p not in u["permissions"]
    requests.delete(f"{API}/users/{u['id']}", headers=admin_h)


# ---------------- Round-robin webhook ----------------
def test_webhook_round_robin_two_execs(admin_h):
    # Clean existing marketing execs by unsetting flag to isolate the test
    users = requests.get(f"{API}/users", headers=admin_h).json()
    existing_exec_ids = [u["id"] for u in users if u.get("is_marketing_exec")]
    for uid in existing_exec_ids:
        requests.patch(f"{API}/users/{uid}", headers=admin_h, json={"is_marketing_exec": False})

    # Create two execs
    e1, _ = _make_employee(admin_h, ["dashboard", "inquiries"], is_mkexec=True, name_prefix="TEST_mkA")
    e2, _ = _make_employee(admin_h, ["dashboard", "inquiries"], is_mkexec=True, name_prefix="TEST_mkB")
    exec_ids = {e1["id"], e2["id"]}

    try:
        # Fire 4 webhook inquiries
        created = []
        for i in range(4):
            r = requests.post(f"{API}/inquiries/webhook/whatsapp", json={
                "name": f"TEST_rr_{i}", "phone": f"98000000{i:02d}", "message": "hi"
            })
            assert r.status_code == 200
            created.append(r.json())

        # fetch inquiries
        inqs = requests.get(f"{API}/inquiries", headers=admin_h).json()
        by_id = {i["id"]: i for i in inqs}
        assigned = [by_id[c["id"]]["assigned_to"] for c in created]
        # all must be one of the two execs
        for a in assigned:
            assert a in exec_ids, f"assigned {a} not in {exec_ids}"
        # each exec should be picked twice (fairness)
        counts = {eid: assigned.count(eid) for eid in exec_ids}
        assert counts[e1["id"]] == 2 and counts[e2["id"]] == 2, f"round-robin unfair: {counts}"
        # names populated
        for c in created:
            inq = by_id[c["id"]]
            assert inq["assigned_to_name"]
    finally:
        requests.delete(f"{API}/users/{e1['id']}", headers=admin_h)
        requests.delete(f"{API}/users/{e2['id']}", headers=admin_h)
        # restore
        for uid in existing_exec_ids:
            requests.patch(f"{API}/users/{uid}", headers=admin_h, json={"is_marketing_exec": True})


def test_webhook_no_exec_unassigned(admin_h):
    # Temporarily disable all execs
    users = requests.get(f"{API}/users", headers=admin_h).json()
    existing_exec_ids = [u["id"] for u in users if u.get("is_marketing_exec")]
    for uid in existing_exec_ids:
        requests.patch(f"{API}/users/{uid}", headers=admin_h, json={"is_marketing_exec": False})
    try:
        r = requests.post(f"{API}/inquiries/webhook/instagram", json={"name": "TEST_noexec", "phone": "9"})
        assert r.status_code == 200
        assert r.json().get("assigned_to") in (None, "")
    finally:
        for uid in existing_exec_ids:
            requests.patch(f"{API}/users/{uid}", headers=admin_h, json={"is_marketing_exec": True})


# ---------------- Assign / Remarks ----------------
def test_assign_and_remarks(admin_h):
    # Create an exec + employee
    exec_u, exec_email = _make_employee(admin_h, ["dashboard", "inquiries"], is_mkexec=True)
    emp_u, emp_email = _make_employee(admin_h, ["dashboard", "inquiries"], is_mkexec=False)
    emp_tok = requests.post(f"{API}/auth/login", json={"email": emp_email, "password": "Emp@12345"}).json()["token"]
    emp_h = {"Authorization": f"Bearer {emp_tok}"}

    try:
        # Create inquiry via webhook (assigned to some exec, maybe our exec_u)
        r = requests.post(f"{API}/inquiries/webhook/sms", json={"name": "TEST_assign", "phone": "9"})
        iid = r.json()["id"]

        # Admin reassigns to exec_u
        ra = requests.patch(f"{API}/inquiries/{iid}/assign", headers=admin_h, json={"assigned_to": exec_u["id"]})
        assert ra.status_code == 200
        assert ra.json()["assigned_to"] == exec_u["id"]
        assert ra.json()["assigned_to_name"] == exec_u["name"]

        # Employee cannot reassign
        rb = requests.patch(f"{API}/inquiries/{iid}/assign", headers=emp_h, json={"assigned_to": emp_u["id"]})
        assert rb.status_code == 403

        # Unassign
        ru = requests.patch(f"{API}/inquiries/{iid}/assign", headers=admin_h, json={"assigned_to": None})
        assert ru.status_code == 200
        assert ru.json()["assigned_to"] is None

        # Add remark by employee
        rr = requests.post(f"{API}/inquiries/{iid}/remarks", headers=emp_h, json={"text": "customer not responding"})
        assert rr.status_code == 200
        remarks = rr.json()["remarks"]
        assert len(remarks) == 1
        assert remarks[0]["text"] == "customer not responding"
        assert remarks[0]["by"] == emp_u["name"]
        assert "at" in remarks[0]

        # Add remark by admin
        rr2 = requests.post(f"{API}/inquiries/{iid}/remarks", headers=admin_h, json={"text": "please retry tomorrow"})
        assert rr2.status_code == 200
        assert len(rr2.json()["remarks"]) == 2

        # Empty remark rejected
        re = requests.post(f"{API}/inquiries/{iid}/remarks", headers=admin_h, json={"text": "   "})
        assert re.status_code == 400
    finally:
        requests.delete(f"{API}/users/{exec_u['id']}", headers=admin_h)
        requests.delete(f"{API}/users/{emp_u['id']}", headers=admin_h)


# ---------------- Bill: per-item GST + percent discount ----------------
def test_bill_per_item_gst_with_percent_discount(admin_h):
    # activity 18% + food 5%, 10% discount
    payload = {
        "customer_name": "TEST_PctGst",
        "customer_phone": "9000010001",
        "items": [
            {"kind": "game", "name": "Go Kart", "price": 500, "qty": 2, "gst_percent": 18, "category": "activity"},
            {"kind": "custom", "name": "Burger", "price": 200, "qty": 3, "gst_percent": 5, "category": "food"},
        ],
        "discount_percent": 10,
        "payment_method": "cash",
    }
    r = requests.post(f"{API}/bills", headers=admin_h, json=payload)
    assert r.status_code == 200, r.text
    b = r.json()
    # subtotal = 1000 + 600 = 1600
    # disc = 160 → after = 1440; ratio = 0.9
    # gst = (1000*0.9)*0.18 + (600*0.9)*0.05 = 900*0.18 + 540*0.05 = 162 + 27 = 189
    # total = 1440 + 189 = 1629
    assert b["subtotal"] == 1600.0
    assert b["discount"] == 160.0
    assert b["discount_percent"] == 10
    assert b["gst_amount"] == 189.0
    assert b["total"] == 1629.0


def test_bill_full_percent_discount(admin_h):
    payload = {
        "customer_name": "TEST_100pct",
        "customer_phone": "9000010002",
        "items": [
            {"kind": "custom", "name": "Entry", "price": 100, "qty": 5, "gst_percent": 18},
        ],
        "discount_percent": 100,
    }
    r = requests.post(f"{API}/bills", headers=admin_h, json=payload)
    assert r.status_code == 200
    b = r.json()
    assert b["subtotal"] == 500.0
    assert b["discount"] == 500.0
    # after discount = 0 → gst = 0 → total = 0
    assert b["gst_amount"] == 0.0
    assert b["total"] == 0.0


def test_bill_legacy_flat_discount(admin_h):
    payload = {
        "customer_name": "TEST_flat",
        "customer_phone": "9000010003",
        "items": [
            {"kind": "custom", "name": "X", "price": 100, "qty": 2},
        ],
        "discount": 30,
    }
    r = requests.post(f"{API}/bills", headers=admin_h, json=payload)
    assert r.status_code == 200
    b = r.json()
    # no gst since no per-line, no legacy gst
    assert b["subtotal"] == 200.0
    assert b["discount"] == 30.0
    assert b["gst_amount"] == 0.0
    assert b["total"] == 170.0


def test_bill_legacy_gst_when_no_line_gst(admin_h):
    payload = {
        "customer_name": "TEST_legacygst",
        "customer_phone": "9000010004",
        "items": [
            {"kind": "custom", "name": "Y", "price": 100, "qty": 2},
        ],
        "gst_percent": 18,
    }
    r = requests.post(f"{API}/bills", headers=admin_h, json=payload)
    assert r.status_code == 200
    b = r.json()
    # subtotal 200, gst 36, total 236
    assert b["subtotal"] == 200.0
    assert b["gst_amount"] == 36.0
    assert b["total"] == 236.0


def test_bill_percent_takes_precedence_over_flat(admin_h):
    # Both provided → percent wins
    payload = {
        "customer_name": "TEST_prec",
        "customer_phone": "9000010005",
        "items": [{"kind": "custom", "name": "Z", "price": 100, "qty": 10}],
        "discount": 999,           # would exceed
        "discount_percent": 25,    # should be applied
    }
    r = requests.post(f"{API}/bills", headers=admin_h, json=payload)
    b = r.json()
    assert b["subtotal"] == 1000.0
    assert b["discount"] == 250.0  # 25%
    assert b["total"] == 750.0
