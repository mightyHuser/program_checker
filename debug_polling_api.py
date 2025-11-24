import requests

BASE_URL = "http://localhost:8000/api"

def test_polling_api():
    print("Testing POST /api/select-directory/start...")
    try:
        res = requests.post(f"{BASE_URL}/select-directory/start")
        if res.status_code == 200:
            print(f"Success: {res.json()}")
        else:
            print(f"Failed: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    test_polling_api()
