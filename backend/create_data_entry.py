import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from crm.models import UserProfile

username = "employee1"
password = "123"

if User.objects.filter(username=username).exists():
    print(f"User {username} already exists.")
else:
    user = User.objects.create_user(username=username, password=password, first_name="موظف", last_name="إدخال")
    # Role will be automatically handled by our login_view if missing, but let's create it properly
    UserProfile.objects.get_or_create(user=user, defaults={'role': 'DATA_ENTRY'})
    print(f"Created data entry user: {username} / {password} successfully!")
