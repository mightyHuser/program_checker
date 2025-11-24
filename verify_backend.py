import requests
import time
import sys

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("Waiting for server to start...")
    for _ in range(10):
        try:
            requests.get(f"{BASE_URL}/files")
            break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    else:
        print("Server failed to start")
        sys.exit(1)

    print("Server started. Running tests...")

    # 1. List files
    res = requests.get(f"{BASE_URL}/files")
    files = res.json()["files"]
    print(f"Files found: {files}")
    assert "test_pass.py" in files
    assert "test_timeout.py" in files

    # 2. Test Pass
    res = requests.post(f"{BASE_URL}/grade", json={
        "filename": "test_pass.py",
        "input_data": "10",
        "expected_output": "20"
    })
    data = res.json()
    print(f"Test Pass Result: {data['status']}")
    assert data["status"] == "PASS"
    assert data["output"].strip() == "20"

    # 3. Test Fail (Wrong Expected)
    res = requests.post(f"{BASE_URL}/grade", json={
        "filename": "test_pass.py",
        "input_data": "10",
        "expected_output": "30"
    })
    data = res.json()
    print(f"Test Fail Result: {data['status']}")
    assert data["status"] == "FAIL"
    assert "Diff" in str(data) or data["diff"] is not None

    # 4. Test Timeout
    res = requests.post(f"{BASE_URL}/grade", json={
        "filename": "test_timeout.py",
        "input_data": "",
        "expected_output": ""
    })
    data = res.json()
    print(f"Test Timeout Result: {data['status']}")
    assert data["status"] == "TIMEOUT"

    # 5. Test Error
    res = requests.post(f"{BASE_URL}/grade", json={
        "filename": "test_error.py",
        "input_data": "",
        "expected_output": ""
    })
    data = res.json()
    print(f"Test Error Result: {data['status']}")
    assert data["status"] == "ERROR"

    print("All backend tests passed!")

if __name__ == "__main__":
    test_api()
