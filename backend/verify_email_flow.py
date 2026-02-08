import asyncio
import uuid
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

def test_signup_verify_login():
    print("Starting Verification Flow Test...")
    
    # Generate random email
    random_id = str(uuid.uuid4())[:8]
    email = f"test_{random_id}@vanderbilt.edu"
    password = "password123"
    full_name = "Test User"

    with TestClient(app) as client:
        # Mock the email sending function where it is IMPORTED in auth.py
        with patch("app.api.v1.endpoints.auth.send_verification_email") as mock_email:
            
            # 1. Signup
            print(f"1. Attempting Signup for {email}...")
            response = client.post(
                "/api/v1/auth/signup",
                json={"email": email, "password": password, "full_name": full_name}
            )
            
            if response.status_code != 200:
                print(f"FAILED: Signup failed with {response.status_code}: {response.text}")
                return

            print("   Signup Successful.")
            
            # Check if email was 'sent'
            if not mock_email.called:
                print("FAILED: Email function was not called.")
                return
            
            # Capture the token
            args, _ = mock_email.call_args
            # args[0] is email, args[1] is token (based on definition send_verification_email(email_to, token))
            sent_token = args[1]
            print(f"   Captured Verification Token: {sent_token[:10]}...")

            # 2. Login (Should Fail)
            print("2. Attempting Login BEFORE verification...")
            login_response = client.post(
                "/api/v1/auth/login",
                data={"username": email, "password": password}
            )
            
            if login_response.status_code == 400 and "verified" in login_response.text:
                print("   Login correctly blocked (Email not verified).")
            else:
                print(f"FAILED: Login should have proved failed but got {login_response.status_code}: {login_response.text}")
                return

            # 3. Verify Email
            print("3. Verifying Email...")
            verify_response = client.post(f"/api/v1/auth/verify-email?token={sent_token}")
            
            if verify_response.status_code == 200:
                print("   Verification Successful.")
            else:
                print(f"FAILED: Verification failed with {verify_response.status_code}: {verify_response.text}")
                return

            # 4. Login (Should Succeed)
            print("4. Attempting Login AFTER verification...")
            login_response_2 = client.post(
                "/api/v1/auth/login",
                data={"username": email, "password": password}
            )
            
            if login_response_2.status_code == 200:
                print("   Login Successful!")
                print("TEST PASSED")
            else:
                print(f"FAILED: Login failed after verification with {login_response_2.status_code}: {login_response_2.text}")

if __name__ == "__main__":
    test_signup_verify_login()
