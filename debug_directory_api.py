import requests

BASE_URL = "http://localhost:8000/api"

def test_select_directory():
    print("Testing POST /api/select-directory...")
    try:
        # This might block until a directory is selected or dialog is closed
        print("Waiting for response (please interact with the dialog if it appears)...")
        res = requests.post(f"{BASE_URL}/select-directory")
        if res.status_code == 200:
            print(f"Success: {res.json()}")
        else:
            print(f"Failed: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    test_select_directory()
