import json
import base64
import hmac
import hashlib
import time

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def generate_jwt(payload: dict, secret: str, expires_in_seconds: int = 7200) -> str:
    """
    Generates a HMAC-SHA256 signed JWT token.
    Default expiry is 2 hours (7200 seconds).
    """
    header = {"alg": "HS256", "typ": "JWT"}
    
    # Add expiration time to payload
    payload_copy = payload.copy()
    payload_copy['exp'] = int(time.time()) + expires_in_seconds
    
    header_encoded = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_encoded = base64url_encode(json.dumps(payload_copy).encode('utf-8'))
    
    signing_input = f"{header_encoded}.{payload_encoded}".encode('utf-8')
    signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_encoded = base64url_encode(signature)
    
    return f"{header_encoded}.{payload_encoded}.{signature_encoded}"

def verify_jwt(token: str, secret: str) -> dict | None:
    """
    Verifies a JWT token's signature and expiration.
    Returns the payload if valid, otherwise None.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_encoded, payload_encoded, signature_encoded = parts
        
        # Verify signature
        signing_input = f"{header_encoded}.{payload_encoded}".encode('utf-8')
        expected_signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
        expected_signature_encoded = base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_encoded, expected_signature_encoded):
            return None
        
        # Parse payload
        payload_bytes = base64url_decode(payload_encoded)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        # Check expiration
        if 'exp' in payload and payload['exp'] < time.time():
            return None
            
        return payload
    except Exception:
        return None
