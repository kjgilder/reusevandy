import urllib.request
import urllib.parse
import json

base_url = "http://127.0.0.1:8000/api/v1"

# Login
data = urllib.parse.urlencode({"username": "katie@vanderbilt.edu", "password": "password"}).encode("utf-8")
req = urllib.request.Request(f"{base_url}/auth/login", data=data)
try:
    response = urllib.request.urlopen(req)
    token = json.loads(response.read())["access_token"]
except Exception as e:
    print(f"Login failed: {e}")
    exit(1)

# Get Messages
req = urllib.request.Request(f"{base_url}/messages/")
req.add_header("Authorization", f"Bearer {token}")
try:
    response = urllib.request.urlopen(req)
    print("SUCCESS")
except Exception as e:
    print(f"Messages failed: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
