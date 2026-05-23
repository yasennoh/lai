import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from crm.models import Client, Policy
from django.contrib.auth.models import User
import random
from datetime import date, timedelta

admin_user = User.objects.filter(is_superuser=True).first()

clients_data = [
    {"first_name": "أحمد", "second_name": "محمد", "last_name": "علي", "phone": "01012345671", "email": "ahmed@example.com", "address": "القاهرة، مدينة نصر", "status": "ACTIVE"},
    {"first_name": "فاطمة", "second_name": "محمود", "last_name": "حسن", "phone": "01012345672", "email": "fatma@example.com", "address": "الإسكندرية، سموحة", "status": "ACTIVE"},
    {"first_name": "عمر", "second_name": "خالد", "last_name": "سعد", "phone": "01012345673", "email": "omar@example.com", "address": "الجيزة، الدقي", "status": "LEAD"},
    {"first_name": "مريم", "second_name": "يوسف", "last_name": "إبراهيم", "phone": "01012345674", "email": "maryam@example.com", "address": "القاهرة، المعادي", "status": "ACTIVE"},
    {"first_name": "طارق", "second_name": "سامي", "last_name": "عبدالله", "phone": "01012345675", "email": "tareq@example.com", "address": "المنصورة، حي الجامعة", "status": "ACTIVE"},
    {"first_name": "سارة", "second_name": "أحمد", "last_name": "مصطفى", "phone": "01012345676", "email": "sara@example.com", "address": "القاهرة، التجمع الخامس", "status": "ACTIVE"},
    {"first_name": "ياسين", "second_name": "حسين", "last_name": "شوقي", "phone": "01012345677", "email": "yassin@example.com", "address": "طنطا، شارع البحر", "status": "LEAD"},
    {"first_name": "ليلى", "second_name": "كريم", "last_name": "عثمان", "phone": "01012345678", "email": "layla@example.com", "address": "القاهرة، مصر الجديدة", "status": "ACTIVE"},
    {"first_name": "زياد", "second_name": "طارق", "last_name": "نور", "phone": "01012345679", "email": "ziad@example.com", "address": "الإسكندرية، محطة الرمل", "status": "ACTIVE"},
    {"first_name": "نور", "second_name": "هاني", "last_name": "جمال", "phone": "01012345680", "email": "nour@example.com", "address": "القاهرة، الزمالك", "status": "ACTIVE"},
]

policy_types = ['AUTO', 'HEALTH', 'LIFE', 'PROPERTY', 'TRAVEL']
statuses = ['ACTIVE', 'PENDING', 'EXPIRED']

created_clients = []
for data in clients_data:
    client, created = Client.objects.get_or_create(
        email=data['email'],
        defaults={
            'first_name': data['first_name'],
            'second_name': data['second_name'],
            'last_name': data['last_name'],
            'phone': data['phone'],
            'address': data['address'],
            'status': data['status'],
            'client_type': 'INDIVIDUAL',
            'created_by': admin_user
        }
    )
    created_clients.append(client)

for i, client in enumerate(created_clients):
    policy_num = f"POL-2026-{1000 + i}"
    start_date = date.today() - timedelta(days=random.randint(0, 30))
    end_date = start_date + timedelta(days=365)
    
    policy, p_created = Policy.objects.get_or_create(
        policy_number=policy_num,
        defaults={
            'client': client,
            'policy_type': random.choice(policy_types),
            'status': random.choice(statuses),
            'start_date': start_date,
            'end_date': end_date,
            'coverage_amount': random.randint(50000, 500000),
            'premium_amount': random.randint(1000, 10000),
            'deductible': random.randint(500, 2000),
            'payment_frequency': 'ANNUAL',
            'payment_method': 'BANK_TRANSFER',
            'created_by': admin_user
        }
    )
