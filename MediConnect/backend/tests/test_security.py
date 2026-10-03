import os
import string
import time

os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only-32chars!!"
os.environ["JWT_REFRESH_SECRET_KEY"] = "test-refresh-secret-key-for-testing-only-32"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "15"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "mediconnect_test"

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    generate_numeric_otp,
    generate_otp_secret,
    verify_otp,
    generate_reset_token,
    validate_password_strength,
    COMMON_PASSWORDS,
    revoke_token,
)


class TestPasswordHashing:
    def test_hash_password(self):
        hashed = hash_password("TestPassword123!")
        assert hashed != "TestPassword123!"
        assert verify_password("TestPassword123!", hashed)

    def test_verify_wrong_password(self):
        hashed = hash_password("TestPassword123!")
        assert not verify_password("WrongPassword123!", hashed)

    def test_different_hashes(self):
        h1 = hash_password("TestPassword123!")
        h2 = hash_password("TestPassword123!")
        assert h1 != h2


class TestJWT:
    def test_access_token_create_decode(self):
        token = create_access_token("user-123", {"role": "doctor"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["role"] == "doctor"
        assert payload["type"] == "access"

    def test_refresh_token_create_decode(self):
        token = create_refresh_token("user-123")
        payload = decode_refresh_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["type"] == "refresh"
        assert "jti" in payload

    def test_revoke_token(self):
        token = create_refresh_token("user-123")
        assert decode_refresh_token(token) is not None
        revoke_token(token)
        assert decode_refresh_token(token) is None

    def test_invalid_token(self):
        assert decode_access_token("invalid-token") is None
        assert decode_refresh_token("invalid-token") is None

    def test_access_token_as_refresh_fails(self):
        token = create_access_token("user-123")
        assert decode_refresh_token(token) is None

    def test_refresh_token_as_access_fails(self):
        token = create_refresh_token("user-123")
        assert decode_access_token(token) is None


class TestOTP:
    def test_generate_numeric_otp(self):
        otp = generate_numeric_otp()
        assert len(otp) == 6
        assert otp.isdigit()

    def test_generate_otp_secret(self):
        secret = generate_otp_secret()
        assert len(secret) > 0

    def test_verify_otp(self):
        secret = generate_otp_secret()
        import pyotp
        totp = pyotp.TOTP(secret)
        otp = totp.now()
        assert verify_otp(secret, otp)

    def test_verify_wrong_otp(self):
        secret = generate_otp_secret()
        assert not verify_otp(secret, "000000")


class TestPasswordValidation:
    def test_valid_password(self):
        valid, msg = validate_password_strength("StrongP@ss1")
        assert valid
        assert msg == "Password is strong"

    def test_too_short(self):
        valid, msg = validate_password_strength("Sh@1")
        assert not valid
        assert "8 characters" in msg

    def test_no_uppercase(self):
        valid, msg = validate_password_strength("nouppercase@1")
        assert not valid
        assert "uppercase" in msg

    def test_no_lowercase(self):
        valid, msg = validate_password_strength("NOLOWERCASE@1")
        assert not valid
        assert "lowercase" in msg

    def test_no_number(self):
        valid, msg = validate_password_strength("NoNumber@abc")
        assert not valid
        assert "number" in msg

    def test_no_special_char(self):
        valid, msg = validate_password_strength("NoSpecial1abc")
        assert not valid
        assert "special character" in msg

    def test_common_password(self):
        valid, msg = validate_password_strength("password1")
        assert not valid
        assert "common" in msg

    def test_too_long(self):
        valid, msg = validate_password_strength("A@" + "a" * 65)
        assert not valid
        assert "64 characters" in msg

    def test_common_password_list_populated(self):
        assert len(COMMON_PASSWORDS) > 0
        assert "password" in COMMON_PASSWORDS
        assert "123456" in COMMON_PASSWORDS
