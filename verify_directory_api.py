import requests
import os

BASE_URL = "http://localhost:8000/api"

def test_directory_api():
    # 1. Get current directory
    print("Testing GET /api/directory...")
    try:
        res = requests.get(f"{BASE_URL}/directory")
        if res.status_code == 200:
            print(f"Current directory: {res.json()['path']}")
        else:
            print(f"Failed to get directory: {res.status_code} {res.text}")
            return False
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return False

    # 2. Set directory (to the same one or a subfolder)
    # Let's try setting it to the current directory explicitly
    current_dir = os.getcwd()
    print(f"Testing POST /api/directory with {current_dir}...")
    try:
        res = requests.post(f"{BASE_URL}/directory", json={"path": current_dir})
        if res.status_code == 200:
            print("Successfully set directory.")
            if res.json()['path'] == current_dir:
                print("Path matches.")
            else:
                print(f"Path mismatch: expected {current_dir}, got {res.json()['path']}")
        else:
            print(f"Failed to set directory: {res.status_code} {res.text}")
            return False
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return False

    # 3. Test invalid directory
    print("Testing POST /api/directory with invalid path...")
    try:
        res = requests.post(f"{BASE_URL}/directory", json={"path": "C:/Invalid/Path/XYZ"})
        if res.status_code == 404:
            print("Correctly rejected invalid path.")
        else:
            print(f"Unexpected response for invalid path: {res.status_code}")
            return False
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return False

    return True

if __name__ == "__main__":
    if test_directory_api():
        print("\nBackend Directory API Verification PASSED")
    else:
        print("\nBackend Directory API Verification FAILED")
