from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'مدير النظام'),
        ('DATA_ENTRY', 'مدخل بيانات'),
        ('AUDITOR', 'مدقق فني'),
        ('ACCOUNTANT', 'محاسب'),
        ('HR', 'مسؤول الموارد البشرية'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DATA_ENTRY')

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

class Client(models.Model):
    CLIENT_TYPES = [
        ('INDIVIDUAL', 'فردي'),
        ('CORPORATE', 'شركات'),
    ]
    CLIENT_STATUS = [
        ('LEAD', 'عميل محتمل (Lead)'),
        ('ACTIVE', 'عميل نشط'),
        ('INACTIVE', 'عميل غير نشط'),
    ]

    first_name = models.CharField(max_length=100, blank=True, null=True)
    second_name = models.CharField(max_length=100, blank=True, null=True, default='')
    third_name = models.CharField(max_length=100, blank=True, null=True, default='')
    last_name = models.CharField(max_length=100, blank=True, null=True)
    mother_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='اسم الأم')
    grandfather_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='اسم الجد')
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, default='')
    phone2 = models.CharField(max_length=20, blank=True, null=True, verbose_name='رقم هاتف بديل')
    address = models.TextField(default='')
    date_of_birth = models.DateField(blank=True, null=True)
    
    GENDER_CHOICES = [
        ('MALE', 'ذكر'),
        ('FEMALE', 'أنثى'),
    ]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True, verbose_name='الجنس')
    passport_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='رقم جواز السفر')
    id_issue_date = models.DateField(blank=True, null=True, verbose_name='تاريخ إصدار الهوية')
    id_issue_place = models.CharField(max_length=100, blank=True, null=True, verbose_name='مكان إصدار الهوية')
    place_of_birth = models.CharField(max_length=100, blank=True, null=True, verbose_name='مكان الميلاد')
    
    # --- معلومات العمل ---
    employment_type = models.CharField(max_length=100, blank=True, null=True, verbose_name='نوع العمل')
    job_title = models.CharField(max_length=100, blank=True, null=True, verbose_name='المسمى الوظيفي')
    annual_income = models.CharField(max_length=100, blank=True, null=True, verbose_name='الدخل السنوي')
    source_of_funds = models.CharField(max_length=100, blank=True, null=True, verbose_name='مصادر الأموال')
    
    # --- التصنيف والمتابعة ---
    client_type = models.CharField(max_length=20, choices=CLIENT_TYPES, default='INDIVIDUAL', verbose_name='تصنيف العميل')
    status = models.CharField(max_length=20, choices=CLIENT_STATUS, default='LEAD', verbose_name='حالة العميل')

    # --- الحقول الخاصة بالشركات ---
    company_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='اسم الشركة')
    company_type = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('GOVERNMENT', 'حكومية'),
        ('PRIVATE', 'قطاع خاص'),
        ('MIXED', 'قطاع مشترك'),
    ], verbose_name='نوع الشركة')
    industry = models.CharField(max_length=100, blank=True, null=True, verbose_name='مجال النشاط')
    chamber_of_commerce = models.CharField(max_length=50, blank=True, null=True, verbose_name='رقم غرفة التجارة')
    registration_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='رقم التسجيل')
    governorate = models.CharField(max_length=100, blank=True, null=True, verbose_name='المحافظة')
    ceo_name = models.CharField(max_length=150, blank=True, null=True, verbose_name='اسم المدير التنفيذي')
    company_nationality = models.CharField(max_length=100, blank=True, null=True, verbose_name='جنسية الشركة')
    num_branches = models.IntegerField(blank=True, null=True, verbose_name='عدد الفروع')
    num_employees = models.IntegerField(blank=True, null=True, verbose_name='عدد الموظفين')
    registration_date = models.DateField(blank=True, null=True, verbose_name='تاريخ التسجيل')
    authorized_capital = models.CharField(max_length=100, blank=True, null=True, verbose_name='رأس المال المصرح به')
    paid_capital = models.CharField(max_length=100, blank=True, null=True, verbose_name='رأس المال المدفوع')
    annual_financials = models.FileField(upload_to='companies/financials/', blank=True, null=True, verbose_name='بيانات الشركة المالية السنوية')
    company_annual_income = models.CharField(max_length=100, blank=True, null=True, verbose_name='الدخل السنوي للشركة')
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name='الرمز البريدي')
    po_box = models.CharField(max_length=20, blank=True, null=True, verbose_name='رقم صندوق البريد')

    # --- حقول الهوية والوثائق ---
    national_id = models.CharField(max_length=50, blank=True, null=True, verbose_name='رقم الهوية')
    id_image_front = models.ImageField(upload_to='clients/id_images/', blank=True, null=True, verbose_name='صورة الهوية (الوجه الأمامي)')
    id_image_back = models.ImageField(upload_to='clients/id_images/', blank=True, null=True, verbose_name='صورة الهوية (الوجه الخلفي)')
    other_documents = models.FileField(upload_to='clients/documents/', blank=True, null=True, verbose_name='وثائق أخرى')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_clients')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_clients')

    def __str__(self):
        if self.client_type == 'CORPORATE' and self.company_name:
            return self.company_name
        return f"{self.first_name or ''} {self.last_name or ''}".strip()

class PolicyTemplateText(models.Model):
    TEMPLATE_TYPES = [
        ('TERMS', 'الشروط والأحكام'),
        ('EXCLUSIONS', 'الاستثناءات'),
    ]
    title = models.CharField(max_length=150, verbose_name="عنوان النموذج")
    content = models.TextField(verbose_name="نص النموذج")
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, default='TERMS', verbose_name="نوع النموذج")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_template_type_display()})"


class Broker(models.Model):
    name = models.CharField(max_length=150, verbose_name="اسم الوسيط/المندوب")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="رقم الهاتف")
    default_commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="المبلغ المقطوع الافتراضي للعمولة")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Policy(models.Model):
    POLICY_TYPES = [
        ('AUTO', 'Auto Insurance'),
        ('HEALTH', 'Health Insurance'),
        ('LIFE', 'Life Insurance'),
        ('PROPERTY', 'Property Insurance'),
        ('TRAVEL', 'Travel Insurance'),
        ('MARINE', 'Marine Insurance'),
        ('FIRE', 'Fire Insurance'),
        ('LIABILITY', 'Liability Insurance'),
        ('ENGINEERING', 'Engineering Insurance'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending/Draft'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('AWAITING_PAYMENT', 'Awaiting Payment'),
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
        ('SUSPENDED', 'Suspended'),
    ]
    PAYMENT_FREQUENCY = [
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('SEMI_ANNUAL', 'Semi-Annual'),
        ('ANNUAL', 'Annual'),
        ('ONE_TIME', 'One-Time Payment'),
    ]
    PAYMENT_METHOD = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CREDIT_CARD', 'Credit Card'),
        ('CHECK', 'Check'),
    ]

    CURRENCY_CHOICES = [
        ('IQD', 'دينار'),
        ('USD', 'دولار'),
    ]

    # --- البيانات الأساسية ---
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='policies')
    policy_number = models.CharField(max_length=50, unique=True, verbose_name='رقم الوثيقة', blank=True, null=True)
    sequence_number = models.IntegerField(default=0, verbose_name='رقم تسلسلي')
    policy_type = models.CharField(max_length=20, choices=POLICY_TYPES, verbose_name='نوع الوثيقة')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    issue_date = models.DateField(auto_now_add=True, verbose_name='تاريخ الإصدار')
    start_date = models.DateField(verbose_name='بداية فترة التأمين')
    end_date = models.DateField(verbose_name='نهاية فترة التأمين')

    # --- التغطية والأقساط ---
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='IQD', verbose_name='العملة')
    coverage_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='مبلغ التغطية')
    premium_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='مبلغ القسط') # legacy compatibility
    
    # Financial Details
    net_premium = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='قسط الاشتراك الصافي')
    stamp_duty_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='نسبة رسم الطابع (%)')
    stamp_duty_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='قيمة رسم الطابع')
    diwan_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='نسبة رسم الديوان (%)')
    diwan_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='قيمة رسم الديوان')
    admin_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='رسوم إدارية')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='المبلغ الكامل')

    deductible = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='مبلغ التحمل')
    payment_frequency = models.CharField(max_length=20, choices=PAYMENT_FREQUENCY, default='ANNUAL', verbose_name='دورية الدفع')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, default='CASH', verbose_name='طريقة الدفع')

    # --- المستفيد ---
    beneficiary_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='اسم المستفيد')
    beneficiary_relation = models.CharField(max_length=100, blank=True, null=True, verbose_name='صلة القرابة')
    beneficiary_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='هاتف المستفيد')

    # --- الوسيط / المندوب ---
    broker = models.ForeignKey(Broker, on_delete=models.SET_NULL, null=True, blank=True, related_name='policies', verbose_name='الوسيط / المندوب')
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='نسبة العمولة (%)')
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='مبلغ العمولة المقطوع')

    # --- تفاصيل إضافية ---
    # --- بيانات المركبة (تأمين السيارات) ---
    vehicles = models.JSONField(default=list, blank=True, null=True, verbose_name="المركبات المؤمنة")
    
    # --- بيانات التأمين الصحي ---
    health_coverage_details = models.JSONField(default=dict, blank=True, null=True, verbose_name="تفاصيل التغطية الصحية والشبكة الطبية")
    family_members = models.JSONField(default=list, blank=True, null=True, verbose_name="أفراد العائلة")
    
    # --- بيانات تأمين الممتلكات ---
    property_details = models.JSONField(default=dict, blank=True, null=True, verbose_name="تفاصيل الممتلكات")
    
    # --- بيانات التأمين الهندسي ---
    engineering_details = models.JSONField(default=dict, blank=True, null=True, verbose_name="التفاصيل الهندسية")
    engineering_equipment = models.JSONField(default=list, blank=True, null=True, verbose_name="المعدات الهندسية")
    
    insured_item_details = models.TextField(blank=True, null=True, verbose_name='تفاصيل الشيء المؤمن عليه')
    terms_and_conditions = models.TextField(blank=True, null=True, verbose_name='الشروط والأحكام')
    exclusions = models.TextField(blank=True, null=True, verbose_name='الاستثناءات')
    notes = models.TextField(blank=True, null=True, verbose_name='ملاحظات')
    policy_document = models.FileField(upload_to='policies/documents/', blank=True, null=True, verbose_name='وثيقة البوليصة')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_policies')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='updated_policies')

    def save(self, *args, **kwargs):
        if not self.policy_number:
            import datetime
            now = datetime.datetime.now()
            if not self.sequence_number:
                last_policy = Policy.objects.order_by('-sequence_number').first()
                if last_policy and last_policy.sequence_number > 0:
                    self.sequence_number = last_policy.sequence_number + 1
                else:
                    self.sequence_number = 1
            self.policy_number = f"{now.year}-{now.month:02d}-{self.policy_type}-{self.sequence_number}"
        
        if self.broker and self.commission_percentage > 0:
            from decimal import Decimal
            self.commission_amount = self.net_premium * (self.commission_percentage / Decimal('100'))
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.policy_number} - {self.get_policy_type_display()}"

class Claim(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('AWAITING_PAYMENT', 'Awaiting Payment'),
        ('PAID', 'Paid'),
    ]

    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name='claims')
    claim_number = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    claim_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name="سبب الرفض")
    filed_date = models.DateField(auto_now_add=True)
    resolved_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"Claim {self.claim_number} - {self.get_status_display()}"


class Communication(models.Model):
    TYPE_CHOICES = [
        ('CALL', 'Call'),
        ('EMAIL', 'Email'),
        ('MEETING', 'Meeting'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='communications')
    agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='communications')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    notes = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} with {self.client} on {self.date.strftime('%Y-%m-%d')}"

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="اسم القسم")
    description = models.TextField(blank=True, null=True, verbose_name="وصف القسم")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_profile', verbose_name="حساب النظام")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees', verbose_name="القسم")
    full_name = models.CharField(max_length=150, verbose_name="الاسم الكامل")
    national_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="رقم الهوية")
    residence_card = models.CharField(max_length=50, blank=True, null=True, verbose_name="رقم بطاقة السكن")
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="الراتب الأساسي")
    
    # Files
    id_image_front = models.ImageField(upload_to='employees/id_images/', blank=True, null=True, verbose_name='صورة الهوية الأمامية')
    id_image_back = models.ImageField(upload_to='employees/id_images/', blank=True, null=True, verbose_name='صورة الهوية الخلفية')
    other_documents = models.FileField(upload_to='employees/documents/', blank=True, null=True, verbose_name='وثائق أخرى')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

class Payroll(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'قيد الانتظار'),
        ('PAID', 'تم الصرف'),
    ]

    employee_name = models.CharField(max_length=150, blank=True, null=True, verbose_name="اسم الموظف (قديم)")
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='payrolls', verbose_name="الموظف")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payrolls', verbose_name="مستخدم النظام")
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="الراتب الأساسي")
    bonuses = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="الحوافز والبونص")
    overtime = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="العمل الإضافي")
    social_security = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="التأمينات الاجتماعية")
    end_of_service = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="مخصصات نهاية الخدمة")
    month = models.CharField(max_length=7, verbose_name="الشهر (YYYY-MM)")  # Format: "2026-05"
    payout_date = models.DateField(blank=True, null=True, verbose_name="تاريخ الصرف")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="حالة الصرف")
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee_name} - {self.month} ({self.get_status_display()})"

class Expense(models.Model):
    EXPENSE_TYPES = [
        ('RENT', 'إيجارات المكاتب أو الفروع'),
        ('UTILITIES', 'فواتير الكهرباء والماء والإنترنت'),
        ('MAINTENANCE', 'صيانة الأجهزة والمعدات'),
        ('TRANSPORT', 'مصاريف النقل والوقود'),
        ('SUPPLIES', 'مستلزمات العمل المكتبية'),
        ('OTHER', 'مصاريف تشغيلية أخرى'),
    ]

    title = models.CharField(max_length=200, verbose_name="عنوان المصروف")
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPES, verbose_name="نوع المصروف")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="قيمة المصروف")
    expense_date = models.DateField(verbose_name="تاريخ الاستحقاق/الدفع")
    paid_to = models.CharField(max_length=150, blank=True, null=True, verbose_name="الجهة المستلمة")
    status = models.CharField(max_length=20, choices=[('PENDING', 'قيد الانتظار'), ('PAID', 'تم الدفع')], default='PAID', verbose_name="حالة الدفع")
    notes = models.TextField(blank=True, null=True, verbose_name="تفاصيل وملاحظات")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.get_expense_type_display()} ({self.amount})"

class SystemSettings(models.Model):
    company_phones_left = models.TextField(blank=True, null=True, verbose_name='هواتف الشركة (يسار)')
    branches_phones_right = models.TextField(blank=True, null=True, verbose_name='هواتف الفروع (يمين)')
    company_logo = models.ImageField(upload_to='settings/logos/', blank=True, null=True, verbose_name='شعار الشركة')

    def save(self, *args, **kwargs):
        if self.__class__.objects.count() > 0 and not self.pk:
            return
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "إعدادات النظام"

class PromotionalOffer(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='promotional_offers', verbose_name="العميل المحتمل")
    initial_price = models.CharField(max_length=100, verbose_name="السعر الابتدائي")
    special_discount = models.CharField(max_length=100, blank=True, null=True, verbose_name="خصم خاص")
    validity_period = models.CharField(max_length=100, verbose_name="فترة العرض")
    features = models.TextField(blank=True, null=True, verbose_name="المزايا")
    trust_licensed = models.BooleanField(default=True, verbose_name="شركة مرخصة")
    trust_clients_count = models.CharField(max_length=100, blank=True, null=True, verbose_name="عدد العملاء")
    trust_years_experience = models.CharField(max_length=100, blank=True, null=True, verbose_name="سنوات الخبرة")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"عرض لـ {self.client} - {self.initial_price}"
