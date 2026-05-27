from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from django.conf import settings
from .jwt_helper import verify_jwt

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        
        token = parts[1]
        payload = verify_jwt(token, settings.SECRET_KEY)
        if not payload:
            raise AuthenticationFailed('Token invalid or expired')
        
        try:
            user = User.objects.get(id=payload.get('user_id'))
            return (user, None)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')
