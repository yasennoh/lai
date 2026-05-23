from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, PolicyViewSet, ClaimViewSet, CommunicationViewSet, PayrollViewSet, ExpenseViewSet, PolicyTemplateTextViewSet, DepartmentViewSet, EmployeeViewSet, BrokerViewSet, PromotionalOfferViewSet, login_view, system_settings_view, dashboard_stats_view

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'policies', PolicyViewSet)
router.register(r'claims', ClaimViewSet)
router.register(r'communications', CommunicationViewSet)
router.register(r'payrolls', PayrollViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'templates', PolicyTemplateTextViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'brokers', BrokerViewSet)
router.register(r'offers', PromotionalOfferViewSet)
urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', dashboard_stats_view, name='dashboard-stats'),
    path('settings/', system_settings_view, name='system-settings'),
    path('login/', login_view, name='login'),
]
