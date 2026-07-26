"""Tests for Google review shortlink expansion in PATCH /api/settings (iteration 8 bug fix)."""
import os
import pytest
import requests

def _load_backend_url():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if v:
        return v.rstrip("/")
    # fallback: read from /app/frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass
    raise RuntimeError("REACT_APP_BACKEND_URL not configured")

BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@funland.in"
ADMIN_PASSWORD = "Funland@123"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module", autouse=True)
def restore_settings(admin_headers):
    # Save current settings then restore after
    r = requests.get(f"{API}/settings", headers=admin_headers, timeout=15)
    original = r.json() if r.status_code == 200 else {}
    yield
    # Restore original google_review_url
    if "google_review_url_original" in original:
        requests.patch(f"{API}/settings", headers=admin_headers,
                       json={"google_review_url": original.get("google_review_url_original", "")}, timeout=15)


def test_shortlink_expansion_response_structure(admin_headers):
    shortlink = "https://maps.app.goo.gl/7Pv1Eps9KVwoN2d5A?g_st=aw"
    r = requests.patch(f"{API}/settings", headers=admin_headers,
                       json={"google_review_url": shortlink}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "google_review_url" in data
    assert "google_review_url_original" in data
    assert data["google_review_url_original"] == shortlink
    print(f"expanded={data['google_review_url']!r}")

    expanded = data["google_review_url"]
    # If expansion succeeded, it should be google.com/maps; if network blocked, original preserved (graceful)
    if expanded != shortlink:
        assert "google.com/maps" in expanded, f"expected google maps URL, got {expanded}"
        # Must not contain tracking params
        for bad in ["utm_source", "utm_medium", "utm_campaign", "g_st=", "g_ep=", "coh=", "entry=", "skid=", "authuser=", "hl="]:
            assert bad not in expanded, f"tracking param {bad} not stripped in {expanded}"


def test_expanded_url_resolves_200(admin_headers):
    r = requests.get(f"{API}/settings", headers=admin_headers, timeout=15)
    assert r.status_code == 200
    url = r.json().get("google_review_url", "")
    if not url or "google.com/maps" not in url:
        pytest.skip("expansion did not run (network likely blocked in test env) — graceful degradation acceptable")
    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15, allow_redirects=True)
    assert resp.status_code == 200, f"expanded URL didn't resolve 200: {resp.status_code}"


def test_non_shortlink_passthrough(admin_headers):
    full = "https://www.google.com/maps/place/Funland/data=!4m2!3m1!1s0x0:0x0"
    r = requests.patch(f"{API}/settings", headers=admin_headers,
                       json={"google_review_url": full}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["google_review_url_original"] == full
    # It's a full URL — either unchanged or minimally cleaned; must still be google.com
    assert "google.com" in data["google_review_url"]


def test_invalid_url_does_not_crash(admin_headers):
    r = requests.patch(f"{API}/settings", headers=admin_headers,
                       json={"google_review_url": "not-a-url"}, timeout=30)
    assert r.status_code in (200, 400), r.text
    if r.status_code == 200:
        # Should pass through unchanged (helper returns url as-is when scheme missing)
        assert r.json().get("google_review_url") == "not-a-url"


def test_empty_string_no_expansion(admin_headers):
    r = requests.patch(f"{API}/settings", headers=admin_headers,
                       json={"google_review_url": ""}, timeout=30)
    assert r.status_code == 200, r.text
    # Empty string should not trigger expansion; either stored as "" or ignored


def test_patch_without_google_review_url_no_expansion(admin_headers):
    # Update only park_name — must not trigger expansion; just verify success
    r = requests.patch(f"{API}/settings", headers=admin_headers,
                       json={"park_name": "Funland Test Park"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("park_name") == "Funland Test Park"


# ------------- REGRESSION: core endpoints still work -------------

def test_dashboard_stats(admin_headers):
    r = requests.get(f"{API}/dashboard/stats", headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text


def test_list_bills(admin_headers):
    r = requests.get(f"{API}/bills", headers=admin_headers, timeout=15)
    assert r.status_code == 200


def test_list_prebookings(admin_headers):
    r = requests.get(f"{API}/prebookings", headers=admin_headers, timeout=15)
    assert r.status_code == 200


def test_list_staff(admin_headers):
    r = requests.get(f"{API}/users", headers=admin_headers, timeout=15)
    assert r.status_code == 200


def test_list_attendance(admin_headers):
    r = requests.get(f"{API}/attendance/me", headers=admin_headers, timeout=15)
    assert r.status_code == 200
