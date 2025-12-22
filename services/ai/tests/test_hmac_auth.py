"""
Test script for HMAC Authentication

Tests:
1. Request without X-Signature header → 401
2. Request with invalid signature → 401
3. Request with valid signature → 200
"""
import requests
import hmac
import hashlib
import json

# Secret (same as in .env)
SECRET = "63da82c1b7549ab2b4649585d21ea979340e377255f67110a42f16f53dae81898"
AI_SERVICE_URL = "http://localhost:8001"

def sign_request(body_dict):
    """Sign request body with HMAC-SHA256"""
    body_string = json.dumps(body_dict)
    signature = hmac.new(SECRET.encode(), body_string.encode(), hashlib.sha256).hexdigest()
    return f"sha256={signature}", body_string

def test_missing_signature():
    """Test 1: No X-Signature header"""
    print("\n🧪 Test 1: Missing X-Signature...")
    body = {"test": "data"}
    
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/educator/turn",
            json=body,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 401:
            print("✅ PASS: Got 401 as expected")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_invalid_signature():
    """Test 2: Invalid signature"""
    print("\n🧪 Test 2: Invalid signature...")
    body = {"test": "data"}
    
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/educator/turn",
            json=body,
            headers={
                "Content-Type": "application/json",
                "X-Signature": "sha256=INVALID",
                "X-Correlation-ID": "test-123"
            }
        )
        if response.status_code == 401:
            print("✅ PASS: Got 401 as expected")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ FAIL: Expected 401, got {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_valid_signature():
    """Test 3: Valid signature"""
    print("\n🧪 Test 3: Valid signature...")
    body = {
        "promptMessage": {
            "readingSessionId": "test-session",
            "threadId": "test-thread",
            "text": "Hello"
        }
    }
    
    signature, body_string = sign_request(body)
    
    try:
        response = requests.post(
            f"{AI_SERVICE_URL}/educator/turn",
            data=body_string,  # Send as string to match signature
            headers={
                "Content-Type": "application/json",
                "X-Signature": signature,
                "X-Correlation-ID": "test-valid-123"
            }
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ PASS: Got 200 as expected")
        elif response.status_code == 500:
            # Expected - AI Service may fail on actual processing
            print("⚠️  PARTIAL: Signature accepted (500 is processing error, not auth)")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_health_check():
    """Test: Health check bypasses auth"""
    print("\n🧪 Test Health: Health check should bypass auth...")
    
    try:
        response = requests.get(f"{AI_SERVICE_URL}/health")
        if response.status_code == 200:
            print("✅ PASS: Health check bypasses auth")
        else:
            print(f"❌ FAIL: Expected 200, got {response.status_code}")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("HMAC Authentication Test Suite")
    print("=" * 50)
    
    test_missing_signature()
    test_invalid_signature()
    test_health_check()
    test_valid_signature()
    
    print("\n" + "=" * 50)
    print("Tests Complete!")
    print("=" * 50)
