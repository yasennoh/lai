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

# Create Auditor
if not User.objects.filter(username='auditor').exists():
    u = User.objects.create_user('auditor', 'auditor@company.com', 'auditor123')
    UserProfile.objects.create(user=u, role='AUDITOR')
    print('Auditor created: auditor / auditor123')
else:
    print('Auditor already exists')

# Create Accountant
if not User.objects.filter(username='accountant').exists():
    u = User.objects.create_user('accountant', 'accountant@company.com', 'accountant123')
    UserProfile.objects.create(user=u, role='ACCOUNTANT')
    print('Accountant created: accountant / accountant123')
else:
    print('Accountant already exists')

# Create HR
if not User.objects.filter(username='hr').exists():
    u = User.objects.create_user('hr', 'hr@company.com', 'hr123')
    UserProfile.objects.create(user=u, role='HR')
    print('HR created: hr / hr123')
else:
    print('HR already exists')


