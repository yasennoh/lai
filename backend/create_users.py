import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.contrib.auth.models import User
from crm.models import UserProfile

# Create Admin
if not User.objects.filter(username='admin').exists():
    u = User.objects.create_superuser('admin', 'admin@company.com', 'admin123')
    UserProfile.objects.create(user=u, role='ADMIN')
    print('Admin created: admin / admin123')
else:
    print('Admin already exists')

# Create Data Entry
if not User.objects.filter(username='entry').exists():
    u = User.objects.create_user('entry', 'entry@company.com', 'entry123')
    UserProfile.objects.create(user=u, role='DATA_ENTRY')
    print('Data Entry created: entry / entry123')
else:
    print('Data Entry already exists')
