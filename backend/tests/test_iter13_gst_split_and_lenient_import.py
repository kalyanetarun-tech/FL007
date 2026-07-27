"""Iteration 13: (A) gst_split multi-category packages → bill auto-expansion,
(B) lenient inquiries/import (any xlsx format, hindi headers, junk rows,
float phone, +91 prefix, source shortcuts, phone-only rows → Unknown)."""
import os
import io
import uuid
import pytest
import requests
from openpyxl import Workbook

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for ln in f:
            if ln.startswith("REACT_APP_BACKEND_URL="):
                BASE = ln.split("=", 1)[1].strip().rstrip("/")
                break
API = f"{BASE}/api"

ADMIN = ("admin@funland.in", "Funland@123")


@pytest.fixture(scope="session")
def h():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN[0], "password": ADMIN[1]})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ---------------------- BACKEND GST SPLIT ---------------------- #

def _make_pkg(h, name, price, pax, gst_split=None, food_portion=0, activity_portion=0):
    body = {
        "name": name, "type": "birthday", "price": price, "pax": pax,
        "inclusions": ["auto"], "gst_split": gst_split or [],
        "food_portion": food_portion, "activity_portion": activity_portion,
    }
    r = requests.post(f"{API}/packages", headers=h, json=body)
    assert r.status_code == 200, r.text
    return r.json()


def _make_bill(h, package):
    body = {
        "customer_name": f"TEST_it13_{uuid.uuid4().hex[:5]}",
        "customer_phone": f"98{uuid.uuid4().int % 100000000:08d}",
        "items": [{"kind": "package", "ref_id": package["id"], "name": package["name"], "price": package["price"], "qty": 1}],
        "gst_percent": 0, "payment_method": "cash", "payment_status": "pending",
    }
    r = requests.post(f"{API}/bills", headers=h, json=body)
    assert r.status_code == 200, r.text
    return r.json()


def test_pkg_4category_gst_split_expands_to_4_lines(h):
    pkg = _make_pkg(h, f"TEST_4cat_{uuid.uuid4().hex[:5]}", 5000, 4, gst_split=[
        {"label": "Games", "category": "activity", "amount": 2000},
        {"label": "Dinner", "category": "food", "amount": 1200},
        {"label": "Room stay", "category": "room", "amount": 1500},
        {"label": "Party T-shirt", "category": "clothing", "amount": 300},
    ])
    try:
        bill = _make_bill(h, pkg)
        items = bill["items"]
        # 4 lines expected
        pkg_lines = [i for i in items if i.get("kind") == "package"]
        assert len(pkg_lines) == 4, f"Expected 4 package lines, got {len(pkg_lines)}: {pkg_lines}"

        by_label = {}
        for it in pkg_lines:
            for lab in ("Games", "Dinner", "Room stay", "Party T-shirt"):
                if lab in it["name"]:
                    by_label[lab] = it

        assert set(by_label.keys()) == {"Games", "Dinner", "Room stay", "Party T-shirt"}

        # Check per-line GST% and HSN
        expected = {
            "Games":          (18.0, "999721", 2000),
            "Dinner":         (5.0,  "996331", 1200),
            "Room stay":      (12.0, "996311", 1500),
            "Party T-shirt":  (12.0, "6109",   300),
        }
        for lab, (rate, hsn, amt) in expected.items():
            it = by_label[lab]
            assert float(it["gst_percent"]) == rate, f"{lab} rate: {it['gst_percent']} vs {rate}"
            assert it["hsn_code"] == hsn, f"{lab} hsn: {it['hsn_code']} vs {hsn}"
            assert float(it["price"]) == amt, f"{lab} amount: {it['price']} vs {amt}"

        # gst_breakup must have 3 unique rates (5, 12, 18)
        rates = sorted({round(float(b["rate"])) for b in bill["gst_breakup"]})
        assert rates == [5, 12, 18], f"breakup rates {rates}"

        # Intra-state → CGST+SGST split, IGST=0
        for br in bill["gst_breakup"]:
            assert br["igst"] == 0.0
            assert br["cgst"] > 0 and br["sgst"] > 0
    finally:
        requests.delete(f"{API}/packages/{pkg['id']}", headers=h)


def test_pkg_merchandise_and_other_categories(h):
    pkg = _make_pkg(h, f"TEST_merch_{uuid.uuid4().hex[:5]}", 2000, 2, gst_split=[
        {"label": "Souvenir", "category": "merchandise", "amount": 800},
        {"label": "Misc", "category": "other", "amount": 1200},
    ])
    try:
        bill = _make_bill(h, pkg)
        pkg_lines = [i for i in bill["items"] if i.get("kind") == "package"]
        assert len(pkg_lines) == 2
        for it in pkg_lines:
            assert float(it["gst_percent"]) == 18.0, it
            assert it["hsn_code"] == "999799", it
        rates = sorted({round(float(b["rate"])) for b in bill["gst_breakup"]})
        assert rates == [18], rates
    finally:
        requests.delete(f"{API}/packages/{pkg['id']}", headers=h)


def test_legacy_food_activity_portion_still_splits(h):
    pkg = _make_pkg(h, f"TEST_legacy_{uuid.uuid4().hex[:5]}", 3000, 10, food_portion=1000, activity_portion=2000)
    try:
        bill = _make_bill(h, pkg)
        pkg_lines = [i for i in bill["items"] if i.get("kind") == "package"]
        assert len(pkg_lines) == 2, pkg_lines
        by_cat = {i["category"]: i for i in pkg_lines}
        assert by_cat["food"]["gst_percent"] == 5.0
        assert by_cat["food"]["hsn_code"] == "996331"
        assert by_cat["activity"]["gst_percent"] == 18.0
        assert by_cat["activity"]["hsn_code"] == "999721"
        assert float(by_cat["food"]["price"]) == 1000
        assert float(by_cat["activity"]["price"]) == 2000
        rates = sorted({round(float(b["rate"])) for b in bill["gst_breakup"]})
        assert rates == [5, 18]
    finally:
        requests.delete(f"{API}/packages/{pkg['id']}", headers=h)


# ---------------------- INQUIRIES IMPORT — LENIENT ---------------------- #

def _upload_xlsx(h, rows, filename="test.xlsx"):
    wb = Workbook()
    ws = wb.active
    for r in rows:
        ws.append(r)
    buf = io.BytesIO()
    wb.save(buf); buf.seek(0)
    return requests.post(
        f"{API}/inquiries/import",
        headers=h,
        files={"file": (filename, buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )


def _get_inquiries(h):
    r = requests.get(f"{API}/inquiries", headers=h)
    assert r.status_code == 200
    return r.json()


def _cleanup_by_phones(h, phones):
    inqs = _get_inquiries(h)
    for i in inqs:
        if i.get("phone") in phones:
            requests.delete(f"{API}/inquiries/{i['id']}", headers=h)


def test_import_headerless_with_phone_only_row_becomes_unknown(h):
    # No header row at all
    phones = {"9876543210", "9998887777", "9111100000"}
    _cleanup_by_phones(h, phones)
    r = _upload_xlsx(h, [
        ["Rahul", 9876543210, "Birthday"],
        ["", "9998887777"],
        [9111100000],
    ])
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["inserted"] == 3, body
    inqs = _get_inquiries(h)
    by_phone = {i["phone"]: i for i in inqs if i["phone"] in phones}
    assert set(by_phone.keys()) == phones, by_phone.keys()
    # phone-only rows must get 'Unknown'
    assert by_phone["9998887777"]["name"] == "Unknown"
    assert by_phone["9111100000"]["name"] == "Unknown"
    assert by_phone["9876543210"]["name"] == "Rahul"
    _cleanup_by_phones(h, phones)


def test_import_hindi_header(h):
    phones = {"9111122233", "9111122244"}
    _cleanup_by_phones(h, phones)
    r = _upload_xlsx(h, [
        ["नाम", "मोबाइल", "Source", "Requirement"],
        ["Anil", "9111122233", "insta", "Birthday"],
        ["Sonia", "9111122244", "wa", "Party"],
    ])
    assert r.status_code == 200, r.text
    assert r.json()["inserted"] == 2, r.json()
    inqs = _get_inquiries(h)
    by = {i["phone"]: i for i in inqs if i["phone"] in phones}
    assert by["9111122233"]["name"] == "Anil"
    assert by["9111122233"]["source"] == "instagram"
    assert by["9111122244"]["source"] == "whatsapp"
    _cleanup_by_phones(h, phones)


def test_import_junk_row_before_header(h):
    phones = {"9111133300", "9111133311"}
    _cleanup_by_phones(h, phones)
    r = _upload_xlsx(h, [
        ["=== Funland Inquiries Master ==="],
        [""],
        ["Name", "Phone", "Source"],
        ["Kiran", "9111133300", "fb"],
        ["Meena", "9111133311", "walkin"],
    ])
    assert r.status_code == 200, r.text
    assert r.json()["inserted"] == 2, r.json()
    by = {i["phone"]: i for i in _get_inquiries(h) if i["phone"] in phones}
    assert by["9111133300"]["source"] == "facebook"
    assert by["9111133311"]["source"] == "walk-in"
    _cleanup_by_phones(h, phones)


def test_import_float_phone_numbers(h):
    phones = {"9111100007"}
    _cleanup_by_phones(h, phones)
    r = _upload_xlsx(h, [
        ["Name", "Phone"],
        ["Floaty", 9111100007.0],
    ])
    assert r.status_code == 200, r.text
    assert r.json()["inserted"] == 1, r.json()
    by = {i["phone"]: i for i in _get_inquiries(h) if i["phone"] in phones}
    assert "9111100007" in by
    _cleanup_by_phones(h, phones)


def test_import_plus_91_prefix_stripped(h):
    phones = {"9111100006", "8765432100"}
    _cleanup_by_phones(h, phones)
    r = _upload_xlsx(h, [
        ["Name", "Phone"],
        ["Prefixed1", "919111100006"],
        ["Prefixed2", "+91-8765432100"],
    ])
    assert r.status_code == 200, r.text
    assert r.json()["inserted"] == 2, r.json()
    have = {i["phone"] for i in _get_inquiries(h)}
    assert phones.issubset(have), phones - have
    _cleanup_by_phones(h, phones)


def test_import_source_shortcuts(h):
    phones = {"9222200001", "9222200002", "9222200003", "9222200004"}
    _cleanup_by_phones(h, phones)
    r = _upload_xlsx(h, [
        ["Name", "Phone", "Source"],
        ["A", "9222200001", "insta"],
        ["B", "9222200002", "fb"],
        ["C", "9222200003", "wa"],
        ["D", "9222200004", "walkin"],
    ])
    assert r.status_code == 200, r.text
    by = {i["phone"]: i for i in _get_inquiries(h) if i["phone"] in phones}
    assert by["9222200001"]["source"] == "instagram"
    assert by["9222200002"]["source"] == "facebook"
    assert by["9222200003"]["source"] == "whatsapp"
    assert by["9222200004"]["source"] == "walk-in"
    _cleanup_by_phones(h, phones)


def test_import_missing_name_phone_header_does_not_400(h):
    # Header has weird names but data rows have phone-shaped cells → should NOT 400
    phones = {"9333300001"}
    _cleanup_by_phones(h, phones)
    r = _upload_xlsx(h, [
        ["Foo", "Bar", "Baz"],   # No name/phone aliases
        ["Ram", "9333300001", "hello"],
    ])
    assert r.status_code == 200, r.text  # critical: NOT 400
    assert r.json()["inserted"] >= 1, r.json()
    _cleanup_by_phones(h, phones)
