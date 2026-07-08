import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_endpoints():
    # 1. Login to get token for GTU Admin or Teacher
    login_data = {
        "registration_number": "GTU_T_003",
        "password": "Teach@123"
    }
    r = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    if r.status_code != 200:
        print("Login failed!", r.status_code, r.text)
        return
    token = r.json().get('access')
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Run Analysis
    print("\n--- Testing Run Analysis ---")
    r_run = requests.post(f"{BASE_URL}/analytics/predictions/run-analysis/", headers=headers)
    print(f"Status: {r_run.status_code}")
    print(f"Response: {r_run.text}")

    # 3. Test Dashboard Stats
    print("\n--- Testing Dashboard Stats ---")
    r_stats = requests.get(f"{BASE_URL}/analytics/predictions/dashboard-stats/", headers=headers)
    print(f"Status: {r_stats.status_code}")
    print(f"Response: {r_stats.text}")

if __name__ == "__main__":
    test_endpoints()
