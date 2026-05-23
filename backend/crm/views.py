from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.db.models import Sum, Count
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Client, Policy, Claim, Communication, UserProfile, Payroll, Expense, PolicyTemplateText, SystemSettings, Department, Employee, Broker, PromotionalOffer
from .serializers import ClientSerializer, PolicySerializer, ClaimSerializer, CommunicationSerializer, PayrollSerializer, ExpenseSerializer, PolicyTemplateTextSerializer, SystemSettingsSerializer, DepartmentSerializer, EmployeeSerializer, BrokerSerializer, PromotionalOfferSerializer

@api_view(['GET', 'POST'])
def system_settings_view(request):
    settings = SystemSettings.get_settings()
    if request.method == 'POST':
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer = SystemSettingsSerializer(settings, context={'request': request})
    return Response(serializer.data)

class PolicyTemplateTextViewSet(viewsets.ModelViewSet):
    queryset = PolicyTemplateText.objects.all().order_by('-created_at')
    serializer_class = PolicyTemplateTextSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PolicyViewSet(viewsets.ModelViewSet):
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        policy = self.get_object()
        policy.status = 'ACTIVE'
        policy.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        policy = self.get_object()
        policy.status = 'CANCELLED'
        policy.save()
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        old_policy = self.get_object()
        
        # Mark old policy as EXPIRED
        old_policy.status = 'EXPIRED'
        old_policy.save()

        # Create new policy by duplicating the old one
        new_policy = Policy.objects.get(pk=old_policy.pk)
        new_policy.pk = None
        
        # Add a suffix to make policy number unique if not provided
        new_policy.policy_number = request.data.get('policy_number', old_policy.policy_number + '-REN')
        
        if 'start_date' in request.data:
            new_policy.start_date = request.data['start_date']
        if 'end_date' in request.data:
            new_policy.end_date = request.data['end_date']
        if 'premium_amount' in request.data:
            new_policy.premium_amount = request.data['premium_amount']
            
        new_policy.status = 'PENDING'
        new_policy.save()
        
        serializer = self.get_serializer(new_policy)
        return Response({'status': 'renewed', 'new_policy': serializer.data})

class ClaimViewSet(viewsets.ModelViewSet):
    queryset = Claim.objects.all()
    serializer_class = ClaimSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        claim = self.get_object()
        claim.status = 'APPROVED'
        claim.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        claim = self.get_object()
        claim.status = 'REJECTED'
        claim.rejection_reason = request.data.get('rejection_reason', '')
        claim.save()
        return Response({'status': 'rejected', 'rejection_reason': claim.rejection_reason})


class CommunicationViewSet(viewsets.ModelViewSet):
    queryset = Communication.objects.all()
    serializer_class = CommunicationSerializer

class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class BrokerViewSet(viewsets.ModelViewSet):
    queryset = Broker.objects.all()
    serializer_class = BrokerSerializer

class PromotionalOfferViewSet(viewsets.ModelViewSet):
    queryset = PromotionalOffer.objects.all().order_by('-created_at')
    serializer_class = PromotionalOfferSerializer

@api_view(['GET'])
def dashboard_stats_view(request):
    today = timezone.now().date()
    sixty_days_from_now = today + timedelta(days=60)
    
    total_clients = Client.objects.count()
    active_policies = Policy.objects.filter(status='ACTIVE')
    total_active_policies = active_policies.count()
    total_income = active_policies.aggregate(total=Sum('net_premium'))['total'] or 0
    
    expiring_policies_qs = active_policies.filter(end_date__lte=sixty_days_from_now).order_by('end_date')
    expiring_policies = [{
        'id': p.id,
        'policy_number': p.policy_number,
        'client_name': str(p.client),
        'end_date': p.end_date.strftime('%Y-%m-%d'),
        'type': p.get_policy_type_display(),
        'net_premium': str(p.net_premium)
    } for p in expiring_policies_qs]
    
    six_months_ago = today - timedelta(days=180)
    recent_policies = Policy.objects.filter(issue_date__gte=six_months_ago)
    
    months_data = {}
    for p in recent_policies:
        m = p.issue_date.strftime('%Y-%m')
        if m not in months_data:
            months_data[m] = {'count': 0, 'income': 0}
        months_data[m]['count'] += 1
        months_data[m]['income'] += float(p.net_premium or 0)
    
    bar_chart_data = [{'month': k, 'count': v['count'], 'income': v['income']} for k, v in sorted(months_data.items())]
    
    type_map = dict(Policy.POLICY_TYPES)
    types_data = active_policies.values('policy_type').annotate(count=Count('id'))
    pie_chart_data = [{'type': type_map.get(t['policy_type'], t['policy_type']), 'count': t['count']} for t in types_data]
    
    claims_status_data = Claim.objects.values('status').annotate(count=Count('id'))
    claim_status_map = dict(Claim.STATUS_CHOICES)
    claims_chart_data = [{'status': claim_status_map.get(c['status'], c['status']), 'count': c['count']} for c in claims_status_data]
    
    policy_status_data = Policy.objects.values('status').annotate(count=Count('id'))
    policy_status_map = dict(Policy.STATUS_CHOICES)
    policy_status_chart_data = [{'status': policy_status_map.get(p['status'], p['status']), 'count': p['count']} for p in policy_status_data]
    
    return Response({
        'kpis': {
            'total_clients': total_clients,
            'active_policies': total_active_policies,
            'total_income': total_income
        },
        'expiring_policies': expiring_policies,
        'bar_chart': bar_chart_data,
        'pie_chart': pie_chart_data,
        'claims_chart': claims_chart_data,
        'policy_status_chart': policy_status_chart_data
    })

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is not None:
        try:
            profile = user.profile
            role = profile.role
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user, role='ADMIN' if user.is_superuser else 'DATA_ENTRY')
            role = profile.role
        return Response({
            'success': True,
            'user': {'id': user.id, 'username': user.username, 'role': role, 'first_name': user.first_name, 'last_name': user.last_name}
        })
    return Response({'success': False, 'error': 'بيانات الدخول غير صحيحة'}, status=status.HTTP_401_UNAUTHORIZED)
