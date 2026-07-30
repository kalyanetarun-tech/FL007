"""Iteration 16 bundle tests:
 - GET /api/health (no auth)
 - GameIn expanded categories (rooms/food/etc.)
 - BillIn digital-audit compulsory fields for non-cash + paid
 - Cash + paid still works without checked_by/payment_reference
 - Pending status doesn't require audit fields
 - Excel import: 3 rows persist across GETs (soft-delete regression)
 - Prebooking lock: converted → non-admin blocked, admin allowed
 - Convert endpoint returns bill_doc with 'id'
"""
import io
import os
import pytest
import requests
from openpyxl import Workbook

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://game-package-tracker.preview.emergentagent.com").rstrip("/")
ADMIN = {"email": "admin@funland.in", "password": "Funland@123"}


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_hdr(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------- Health ----------------
def test_health_endpoint_no_auth():
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j.get("ok") is True
    assert "ts" in j


# ---------------- Games categories ----------------
@pytest.mark.parametrize("category,gst_cat", [
    ("rooms", "room"),
    ("food", "food"),
    ("activities", "activity"),
    ("games", "activity"),
    ("miscellaneous", "other"),
    ("merchandise", "merchandise"),
])
def test_create_game_new_categories(admin_hdr, category, gst_cat):
    payload = {"name": f"TEST_ITER16_{category}", "category": category, "price": 500, "gst_category": gst_cat}
    r = requests.post(f"{BASE_URL}/api/games", json=payload, headers=admin_hdr, timeout=10)
    assert r.status_code == 200, r.text
    g = r.json()
    assert g["category"] == category
    assert g["gst_category"] == gst_cat
    # cleanup
    requests.delete(f"{BASE_URL}/api/games/{g['id']}", headers=admin_hdr, timeout=10)


# ---------------- Bill payment audit ----------------
def _bill_payload(method, status, ref="", chk=""):
    return {
        "customer_name": "TEST_ITER16_Cust",
        "customer_phone": "9998887777",
        "items": [{"kind": "custom", "name": "Test", "price": 100, "qty": 1, "gst_percent": 18, "category": "activity"}],
        "payment_method": method, "payment_status": status,
        "payment_reference": ref, "checked_by": chk,
    }


@pytest.mark.parametrize("method", ["rtgs", "netbanking", "cheque", "upi_qr", "card"])
def test_non_cash_paid_requires_audit(admin_hdr, method):
    r = requests.post(f"{BASE_URL}/api/bills", json=_bill_payload(method, "paid"), headers=admin_hdr, timeout=10)
    assert r.status_code == 400, f"Expected 400 for {method}, got {r.status_code}: {r.text}"
    msg = r.json().get("detail", "").lower()
    assert "checked_by" in msg or "payment_reference" in msg


@pytest.mark.parametrize("method", ["rtgs", "netbanking", "cheque"])
def test_non_cash_paid_with_audit_succeeds(admin_hdr, method):
    r = requests.post(f"{BASE_URL}/api/bills", json=_bill_payload(method, "paid", ref=f"TXN_{method}_1", chk="Ravi"), headers=admin_hdr, timeout=10)
    assert r.status_code == 200, r.text
    b = r.json()
    assert b["payment_method"] == method
    assert b["payment_reference"] == f"TXN_{method}_1"
    assert b["checked_by"] == "Ravi"


def test_cash_paid_does_not_require_audit(admin_hdr):
    r = requests.post(f"{BASE_URL}/api/bills", json=_bill_payload("cash", "paid"), headers=admin_hdr, timeout=10)
    assert r.status_code == 200, r.text


def test_non_cash_pending_does_not_require_audit(admin_hdr):
    r = requests.post(f"{BASE_URL}/api/bills", json=_bill_payload("rtgs", "pending"), headers=admin_hdr, timeout=10)
    assert r.status_code == 200, r.text


# ---------------- Excel import soft-delete regression ----------------
def _make_xlsx(rows):
    wb = Workbook()
    ws = wb.active
    ws.append(["Name", "Phone", "Notes"])
    for r in rows:
        ws.append(r)
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


def test_import_xlsx_persists_across_gets(admin_hdr):
    marker = "TEST_ITER16_IMP"
    rows = [(f"{marker}_A", "9111100001", "note A"),
            (f"{marker}_B", "9111100002", "note B"),
            (f"{marker}_C", "9111100003", "note C")]
    buf = _make_xlsx(rows)
    files = {"file": ("test.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    r = requests.post(f"{BASE_URL}/api/inquiries/import", files=files, headers=admin_hdr, timeout=30)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["inserted"] == 3, j

    # 3 consecutive GETs should all return the 3 records
    for _ in range(3):
        r = requests.get(f"{BASE_URL}/api/inquiries", headers=admin_hdr, timeout=15)
        assert r.status_code == 200
        names = [x.get("name") for x in r.json()]
        found = sum(1 for n in names if n and n.startswith(marker))
        assert found == 3, f"Expected 3 imported inquiries, found {found}"


# ---------------- Prebook lock & convert ----------------
def test_convert_prebook_returns_bill_id_and_locks(admin_hdr):
    # Create a prebook (public endpoint, no auth)
    pb_payload = {
        "customer_name": "TEST_ITER16_PBK",
        "customer_phone": "9111100999",
        "booking_date": "2026-12-31",
        "pax": 2,
        "items": [{"kind": "game", "ref_id": "x", "name": "Test Ride", "price": 100, "qty": 2}],
    }
    r = requests.post(f"{BASE_URL}/api/prebook", json=pb_payload, timeout=15)
    assert r.status_code == 200, r.text
    pb = r.json()

    # Convert (admin)
    r = requests.post(f"{BASE_URL}/api/prebookings/{pb['id']}/convert", headers=admin_hdr, timeout=15)
    assert r.status_code == 200, r.text
    bill_doc = r.json()
    assert "id" in bill_doc and bill_doc["id"], "Convert must return bill_doc.id for frontend nav"

    # Admin can still update status
    r = requests.patch(f"{BASE_URL}/api/prebookings/{pb['id']}/status",
                        json={"status": "confirmed"}, headers=admin_hdr, timeout=10)
    assert r.status_code == 200, r.text

    # Create non-admin user, get token, try to update -> should 403
    emp_email = "test_iter16_emp@funland.in"
    requests.post(f"{BASE_URL}/api/users", json={
        "email": emp_email, "password": "Emp@12345", "name": "TEST_ITER16 Emp", "role": "employee"
    }, headers=admin_hdr, timeout=10)  # may 400 if exists — ok
    login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": emp_email, "password": "Emp@12345"}, timeout=10)
    if login.status_code == 200:
        emp_hdr = {"Authorization": f"Bearer {login.json()['token']}"}
        r = requests.patch(f"{BASE_URL}/api/prebookings/{pb['id']}/status",
                            json={"status": "cancelled"}, headers=emp_hdr, timeout=10)
        assert r.status_code == 403, f"Expected 403 lock for non-admin, got {r.status_code}: {r.text}"
        assert "lock" in r.json().get("detail", "").lower()
    else:
        pytest.skip(f"Could not create/login employee user: {login.text}")
