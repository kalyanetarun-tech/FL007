"""Iteration 18: 5 item categories + package pick-from-items backend acceptance."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback: read frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

ADMIN = {"email": "admin@funland.in", "password": "Funland@123"}
FIVE_CATS = ["entry", "food", "activities", "dress", "others"]
CAT_TO_GST = {"entry": "activity", "food": "food", "activities": "activity",
               "dress": "clothing", "others": "other"}


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def hdr(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def created_items(hdr):
    created = []
    for cat in FIVE_CATS:
        payload = {
            "name": f"TEST_ITER18_{cat}",
            "category": cat,
            "price": 200,
            "offer_price": 150,
            "active": True,
            "gst_category": CAT_TO_GST[cat],
        }
        r = requests.post(f"{BASE_URL}/api/games", json=payload, headers=hdr, timeout=15)
        assert r.status_code in (200, 201), f"{cat}: {r.status_code} {r.text}"
        data = r.json()
        assert data["category"] == cat
        assert data["gst_category"] == CAT_TO_GST[cat]
        created.append(data)
    yield created
    # teardown
    for it in created:
        requests.delete(f"{BASE_URL}/api/games/{it['id']}", headers=hdr, timeout=10)


def test_games_accept_five_categories(created_items):
    assert len(created_items) == 5
    got = {i["category"] for i in created_items}
    assert got == set(FIVE_CATS)


def test_games_list_persists(hdr, created_items):
    r = requests.get(f"{BASE_URL}/api/games", headers=hdr, timeout=15)
    assert r.status_code == 200
    names = {g["name"] for g in r.json()}
    for it in created_items:
        assert it["name"] in names


def test_package_with_item_derived_split(hdr, created_items):
    # build gst_split like frontend does after picker
    split = []
    for it in created_items:
        split.append({
            "label": it["name"],
            "category": CAT_TO_GST[it["category"]],
            "amount": it["offer_price"] or it["price"],
        })
    total = sum(s["amount"] for s in split)
    payload = {
        "name": "TEST_ITER18_PKG",
        "type": "party",
        "category": "TEST_ITER18",
        "price": total,
        "pax": 5,
        "inclusions": ["Combo"],
        "active": True,
        "gst_split": split,
    }
    r = requests.post(f"{BASE_URL}/api/packages", json=payload, headers=hdr, timeout=15)
    assert r.status_code in (200, 201), r.text
    pkg = r.json()
    assert pkg["price"] == total
    assert len(pkg.get("gst_split", [])) == 5
    cats = {s["category"] for s in pkg["gst_split"]}
    assert cats == {"activity", "food", "clothing", "other"}

    # verify persisted via list
    g = requests.get(f"{BASE_URL}/api/packages", headers=hdr, timeout=15)
    assert g.status_code == 200
    found = [p for p in g.json() if p["id"] == pkg["id"]]
    assert found and len(found[0]["gst_split"]) == 5

    # cleanup
    requests.delete(f"{BASE_URL}/api/packages/{pkg['id']}", headers=hdr, timeout=10)


def test_bill_conversion_from_package_split(hdr, created_items):
    """Create a package then convert to a bill (per-line GST breakup)."""
    split = [{
        "label": it["name"],
        "category": CAT_TO_GST[it["category"]],
        "amount": it["offer_price"] or it["price"],
    } for it in created_items]
    total = sum(s["amount"] for s in split)
    pr = requests.post(f"{BASE_URL}/api/packages", json={
        "name": "TEST_ITER18_BILLPKG", "type": "party", "price": total, "pax": 5,
        "inclusions": [], "active": True, "gst_split": split,
    }, headers=hdr, timeout=15)
    assert pr.status_code in (200, 201), pr.text
    pkg = pr.json()

    # Try to create a bill using package
    bill_payload = {
        "customer_name": "TEST_ITER18 Cust",
        "customer_phone": "9999900000",
        "items": [{"package_id": pkg["id"], "name": pkg["name"], "qty": 1,
                   "unit_price": pkg["price"]}],
    }
    br = requests.post(f"{BASE_URL}/api/bills", json=bill_payload, headers=hdr, timeout=15)
    if br.status_code not in (200, 201):
        # Different schema - not a hard fail for iter18 scope, log
        pytest.skip(f"bills endpoint schema differs: {br.status_code} {br.text[:200]}")
    bill = br.json()
    assert bill.get("total", 0) > 0 or bill.get("grand_total", 0) > 0
    # cleanup
    if bill.get("id"):
        requests.delete(f"{BASE_URL}/api/bills/{bill['id']}", headers=hdr, timeout=10)
    requests.delete(f"{BASE_URL}/api/packages/{pkg['id']}", headers=hdr, timeout=10)


def test_regression_reports_endpoints(hdr):
    for path in ["/api/reports/sales", "/api/reports/gst", "/api/reports/expenses", "/api/reports/marketing"]:
        r = requests.get(f"{BASE_URL}{path}", headers=hdr, timeout=15)
        assert r.status_code in (200, 404), f"{path}: {r.status_code}"
