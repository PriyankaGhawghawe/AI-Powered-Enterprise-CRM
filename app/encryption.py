import os
import base64
import hashlib
from cryptography.fernet import Fernet
from app.auth import SECRET_KEY

# Derive a 32-byte url-safe base64 key from the SECRET_KEY
_hash = hashlib.sha256(SECRET_KEY.encode('utf-8')).digest()
_fernet_key = base64.urlsafe_b64encode(_hash)
_fernet = Fernet(_fernet_key)

def encrypt_data(data: str) -> str:
    """Encrypts a string and returns the url-safe base64 encoded string."""
    if not data:
        return data
    return _fernet.encrypt(data.encode('utf-8')).decode('utf-8')

def decrypt_data(token: str) -> str:
    """Decrypts a url-safe base64 encoded string and returns the original string."""
    if not token:
        return token
    try:
        return _fernet.decrypt(token.encode('utf-8')).decode('utf-8')
    except Exception:
        # If it fails to decrypt (e.g. legacy plaintext keys), return the token itself
        # This allows a graceful migration if there are already plaintext keys in the DB.
        return token
