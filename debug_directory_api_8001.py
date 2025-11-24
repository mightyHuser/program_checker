import requests
import time
import threading

BASE_URL = "http://localhost:8001/api"

def test_select_directory():
    print("Testing POST /api/select-directory on port 8001...")
    try:
        # Set a short timeout because we can't easily interact with the dialog programmatically
        # and we don't want to hang forever.
        # However, if the dialog opens, the request blocks. 
        # If we get a timeout, it effectively means the server received the request and is waiting (which is good!).
        # If we get connection refused, the server isn't running.
        # If we get 500/404, it's broken.
        print("Sending request (expecting timeout or success if you click quickly)...")
        res = requests.post(f"{BASE_URL}/select-directory", timeout=5)
        if res.status_code == 200:
            print(f"Success: {res.json()}")
        else:
            print(f"Failed: {res.status_code} {res.text}")
    except requests.exceptions.Timeout:
        print("Request timed out as expected (Dialog is likely open).")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    # Give server a moment to start
    time.sleep(2)
    test_select_directory()
