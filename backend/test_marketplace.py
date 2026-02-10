import requests

BASE_URL = "http://localhost:8000/api/v1"

# Test User Data
EMAIL = "test_marketplace@vanderbilt.edu"
PASSWORD = "password123"
FULL_NAME = "Marketplace Tester"


def main():
    print("Starting Marketplace Verification...")

    # 1. Signup / Login
    print("\n1. Authentication (Signup/Login)...")
    token = get_auth_token()
    if not token:
        print("Failed to authenticate. Exiting.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Listing
    print("\n2. Creating a Listing...")
    listing_data = {
        "title": "Vintage Lamp",
        "description": "A beautiful vintage lamp from the 60s.",
        "price": 45.00,
        "category": "Furniture",
        "images": ["https://example.com/lamp.jpg"],
    }
    response = requests.post(
        f"{BASE_URL}/listings/", json=listing_data, headers=headers
    )
    if response.status_code == 200:
        listing = response.json()
        listing_id = listing["id"]
        print(f"   SUCCESS: Created listing '{listing['title']}' (ID: {listing_id})")
    else:
        print(f"   FAILED: {response.status_code} - {response.text}")
        return

    # 3. Get All Listings
    print("\n3. Fetching All Listings...")
    response = requests.get(f"{BASE_URL}/listings/", headers=headers)
    if response.status_code == 200:
        listings = response.json()
        print(f"   SUCCESS: Found {len(listings)} listings.")
    else:
        print(f"   FAILED: {response.status_code} - {response.text}")

    # 4. Filter Listings (by Category)
    print("\n4. Filtering by Category 'Furniture'...")
    response = requests.get(f"{BASE_URL}/listings/?category=Furniture", headers=headers)
    if response.status_code == 200:
        listings = response.json()
        print(f"   SUCCESS: Found {len(listings)} listings in Furniture.")
    else:
        print(f"   FAILED: {response.status_code} - {response.text}")

    # 5. Update Listing
    print(f"\n5. Updating Listing {listing_id}...")
    update_data = {"price": 40.00, "status": "pending"}
    response = requests.put(
        f"{BASE_URL}/listings/{listing_id}", json=update_data, headers=headers
    )
    if response.status_code == 200:
        updated = response.json()
        print(
            f"   SUCCESS: updated price to {updated['price']} and status to {updated['status']}"
        )
    else:
        print(f"   FAILED: {response.status_code} - {response.text}")

    # 6. Delete Listing
    print(f"\n6. Deleting Listing {listing_id}...")
    response = requests.delete(f"{BASE_URL}/listings/{listing_id}", headers=headers)
    if response.status_code == 200:
        print("   SUCCESS: Listing deleted.")
    else:
        print(f"   FAILED: {response.status_code} - {response.text}")

    # Verify Deletion
    response = requests.get(f"{BASE_URL}/listings/{listing_id}", headers=headers)
    if response.status_code == 404:
        print("   SUCCESS: Listing correctly not found after deletion.")
    else:
        print(f"   FAILED: Listing still exists? Status: {response.status_code}")


def get_auth_token():
    # Try login first
    login_data = {"username": EMAIL, "password": PASSWORD}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)

    if response.status_code == 200:
        return response.json()["access_token"]

    # If login fails, try signup
    signup_data = {"email": EMAIL, "password": PASSWORD, "full_name": FULL_NAME}
    response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)

    if response.status_code == 200:
        # After signup, need to verify (mock it or auto-verify logic enabled?)
        # For simplicity, let's assume we need to manually verify or just login if auto-login was enabled?
        # WAIT: Our current auth requires verification.
        # Hack: Login might fail if not verified.

        # We need to grab the token from the user created? No, we need to verify.
        # This script might fail if we don't handle verification.
        # Let's hope the user exists from previous tests or manual creation?

        # Actually, let's try to verify dynamically if we can, or just print warning.
        print("   Signed up new user. Please verify email if not auto-verified.")

        # Try login again
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            return response.json()["access_token"]

    print(f"   Auth failed: {response.status_code} - {response.text}")
    return None


if __name__ == "__main__":
    main()
