#!/usr/bin/env python
"""Test script to verify JWT token includes role in payload"""
import json
import base64
import urllib.request
import urllib.parse

# Login as staff
url = "http://127.0.0.1:8000/api/auth/login/"
data = json.dumps({"email": "staff@example.com", "password": "StaffPass123!"}).encode('utf-8')
headers = {'Content-Type': 'application/json'}
req = urllib.request.Request(url, data=data, headers=headers)

with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode('utf-8'))
    access_token = result['access']
    
    # Decode JWT payload (middle part between the dots)
    parts = access_token.split('.')
    payload = parts[1]
    # Add padding if needed
    payload += '=' * (4 - len(payload) % 4)
    decoded = base64.b64decode(payload)
    token_data = json.loads(decoded)
    
    print("JWT Token Payload for staff@example.com:")
    print(json.dumps(token_data, indent=2))
    
    # Verify role is present
    if 'role' in token_data:
        print(f"\n✅ Role field present: {token_data['role']}")
    else:
        print("\n❌ Role field missing!")
    
    if 'email' in token_data:
        print(f"✅ Email field present: {token_data['email']}")
    else:
        print("❌ Email field missing!")
