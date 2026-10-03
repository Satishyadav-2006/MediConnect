import requests

BASE = "http://127.0.0.1:8001/api/v1"

user = {
    "email": "integration_test_user@example.com",
    "password": "Testpass123!",
    "first_name": "Integration",
    "last_name": "Tester"
}
# Add required fields expected by the registration schema
user.update({
    "confirm_password": user["password"],
    "username": "integration_tester",
    "role": "doctor",
    "country": "Testland",
    "state": "Test State",
    "city": "Test City"
})

s = requests.Session()

print('Registering...')
r = s.post(f"{BASE}/auth/register", json=user)
print('Register status:', r.status_code)
print('Register body:', r.text)

print('\nLogging in...')
creds = {"email": user['email'], "password": user['password']}
r2 = s.post(f"{BASE}/auth/login", json=creds)
print('Login status:', r2.status_code)
print('Login body:', r2.text)

if r2.status_code == 200:
    token = r2.json().get('access_token') or r2.json().get('token')
    headers = {'Authorization': f'Bearer {token}'}
    r3 = s.get(f"{BASE}/auth/me", headers=headers)
    print('\nMe status:', r3.status_code)
    print('Me body:', r3.text)
else:
    print('\nSkipping /me because login failed')
