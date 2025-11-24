import requests
import time

BASE_URL = "http://localhost:8003/api"

def test_select_directory():
    print("Testing POST /api/select-directory on port 8003...")
    try:
        # We expect this to fail or timeout. 
        # If it fails, we want to see the error code.
        res = requests.post(f"{BASE_URL}/select-directory", timeout=5)
        if res.status_code == 200:
            print(f"Success: {res.json()}")
        else:
            print(f"Failed: {res.status_code} {res.text}")
    except requests.exceptions.Timeout:
        print("Request timed out (Dialog might be open).")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    time.sleep(2)
    test_select_directory()
