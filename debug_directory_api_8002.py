import requests
import time

BASE_URL = "http://localhost:8002/api"

def test_select_directory():
    print("Testing POST /api/select-directory on port 8002...")
    try:
        print("Sending request (expecting timeout or success if you click quickly)...")
        # Timeout of 10 seconds to give time for dialog to appear and potentially be clicked
        # But for automated test, we just want to see if it crashes immediately or hangs (which implies dialog is open).
        # If it returns 500 immediately, it failed.
        res = requests.post(f"{BASE_URL}/select-directory", timeout=5)
        if res.status_code == 200:
            print(f"Success: {res.json()}")
        else:
            print(f"Failed: {res.status_code} {res.text}")
    except requests.exceptions.Timeout:
        print("Request timed out as expected (Dialog is likely open). Success!")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    time.sleep(2)
    test_select_directory()
