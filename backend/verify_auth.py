import asyncio
import httpx
from app.core.config import get_settings

settings = get_settings()
BASE_URL = "http://localhost:8000" + settings.API_V1_STR

async def verify_auth():
    valid_email = "test@vanderbilt.edu"
    invalid_email = "test@gmail.com"
    password = "secret_password"
    
    async with httpx.AsyncClient() as client:
        # 0. Test Invalid Signup
        print("Testing Invalid Signup (@gmail.com)...")
        response = await client.post(f"{BASE_URL}/auth/signup", json={
            "email": invalid_email,
            "password": password,
            "full_name": "Bad User"
        })
        if response.status_code == 422:
            print("Invalid signup correctly rejected.")
        else:
            print(f"Invalid signup failed to reject! Status: {response.status_code}")
            return

        # 1. Signup
        print("Testing Valid Signup (@vanderbilt.edu)...")
        response = await client.post(f"{BASE_URL}/auth/signup", json={
            "email": valid_email,
            "password": password,
            "full_name": "Test User"
        })
        if response.status_code == 400 and "already exists" in response.text:
            print("User already exists, proceeding to login.")
        elif response.status_code != 200:
            print(f"Signup failed: {response.text}")
            return
        else:
            print("Signup successful.")

        # 2. Login
        print("Testing Login...")
        response = await client.post(f"{BASE_URL}/auth/login", data={
            "username": valid_email,
            "password": password
        })
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return
        
        token = response.json()["access_token"]
        print("Login successful. Token received.")

        # 3. access /me
        print("Testing /me endpoint...")
        response = await client.get(f"{BASE_URL}/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        if response.status_code != 200:
            print(f"Me endpoint failed: {response.text}")
            return
        
        user_data = response.json()
        print(f"Verification successful! User: {user_data['email']}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(verify_auth())
