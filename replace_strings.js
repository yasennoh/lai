const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/admin-panel/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { useCurrency } from '../components/CurrencyContext';",
  "import { useCurrency } from '../components/CurrencyContext';\nimport { useLanguage } from '../components/LanguageContext';"
);

content = content.replace(
  /const typeL: Record<string, string> = \{[^\}]+\};\nconst statusL: Record<string, string> = \{[^\}]+\};\nconst freqL: Record<string, string> = \{[^\}]+\};\nconst payL: Record<string, string> = \{[^\}]+\};/,
  ""
);

content = content.replace(
  "export default function AdminPanel() {",
  `export default function AdminPanel() {
  const { t, isRtl } = useLanguage();
  const typeL: Record<string, string> = { AUTO: t('typeAuto'), HEALTH: t('typeHealth'), LIFE: t('typeLife'), PROPERTY: t('typeProperty'), TRAVEL: t('typeTravel'), MARINE: t('typeMarine'), FIRE: t('typeFire'), LIABILITY: t('typeLiability') };
  const statusL: Record<string, string> = { ACTIVE: t('statusActive'), EXPIRED: t('statusExpired'), CANCELLED: t('statusCancelled'), PENDING: t('statusPending'), SUSPENDED: t('statusSuspended') };
  const freqL: Record<string, string> = { MONTHLY: t('freqMonthly'), QUARTERLY: t('freqQuarterly'), SEMI_ANNUAL: t('freqSemiAnnual'), ANNUAL: t('freqAnnual'), ONE_TIME: t('freqOneTime') };
  const payL: Record<string, string> = { CASH: t('payCash'), BANK_TRANSFER: t('payBank'), CREDIT_CARD: t('payCredit'), CHECK: t('payCheck') };`
);

// Replace directions
content = content.replace(/direction: 'rtl'/g, "direction: isRtl ? 'rtl' : 'ltr'");

// Top labels
content = content.replace("لوحة المدير ", "{t('staffManagement')}");
content = content.replace(/'وثائق قيد الموافقة'/g, "t('pendingPoliciesTab')");
content = content.replace(/'وثائق فعالة'/g, "t('activePoliciesCount')");
content = content.replace(/'إجمالي العملاء'/g, "t('totalClients')");
content = content.replace(/'إجمالي الأقساط'/g, "t('totalPremiums')");
content = content.replace(/'إجمالي التغطية'/g, "t('totalCoverage')");

// Tabs
content = content.replace(/'قيد الموافقة'/g, "t('pendingPoliciesTab')");
content = content.replace(/'كل الوثائق'/g, "t('allPoliciesTab')");
content = content.replace(/'المطالبات'/g, "t('claims')");

content = content.replace("وثائق تنتظر موافقتك", "{t('policiesAwaitingApproval')}");
content = content.replace("لا توجد وثائق قيد الانتظار 🎉", "{t('noPendingPolicies')}");

content = content.replace("العميل:", "{t('clientLabel')}");
content = content.replace("القسط:", "{t('premiumLabel')}");
content = content.replace("التغطية:", "{t('coverageLabel')}");
content = content.replace("من {p.start_date} إلى {p.end_date}", "{t('fromLabel')} {p.start_date} {t('toLabel')} {p.end_date}");

content = content.replace(/>فتح الوثيقة</g, ">{t('openPolicy')}<");
content = content.replace(/>موافقة</g, ">{t('approve')}<");
content = content.replace(/>رفض</g, ">{t('reject')}<");

content = content.replace("جميع الوثائق", "{t('allPolicies')}");

// Table Headers
content = content.replace(/>رقم الوثيقة</g, ">{t('policyNumber')}<");
content = content.replace(/>العميل</g, ">{t('customers')}<");
content = content.replace(/>النوع</g, ">{t('policyType')}<");
content = content.replace(/>القسط</g, ">{t('premiumAmount').replace(' *', '')}<");
content = content.replace(/>الحالة</g, ">{t('status')}<"); // We need to add t('status') if not present, but let's just use string literal or we can use the English text. Actually status is 'الحالة', we can add it to context or hardcode English for now. Let's just do t('status') and we will add it.
content = content.replace(/>إجراءات</g, ">{t('actions')}<");

// Claims Table
content = content.replace(/>إضافة مطالبة</g, ">{t('addClaim')}<");
content = content.replace(/>رقم المطالبة</g, ">{t('claimNumber')}<");
content = content.replace(/>المبلغ</g, ">{t('amount')}<");
content = content.replace(/'مقبولة' : c.status === 'REJECTED' \? 'مرفوضة' : 'قيد المراجعة'/g, "t('claimStatusApproved') : c.status === 'REJECTED' ? t('claimStatusRejected') : t('claimStatusReview')");
content = content.replace(/>معلومات المطالب</g, ">{t('claimantInfo')}<");

content = content.replace(/إضافة مطالبة جديدة/g, "{t('addNewClaim')}");
content = content.replace(/ابحث برقم الوثيقة أو اسم العميل.../g, "{t('searchPolicyOrClient')}");
content = content.replace(/لا توجد وثائق مطابقة 🔍/g, "{t('noMatchingPolicies')}");
content = content.replace(/مبلغ المطالبة \*/g, "{t('claimAmount')}");
content = content.replace(/وصف المطالبة \*/g, "{t('claimDescription')}");
content = content.replace(/>حفظ المطالبة</g, ">{t('saveClaim')}<");
content = content.replace(/>إلغاء</g, ">{t('cancel')}<");

// Alignments based on RTL
content = content.replace(/textAlign: 'right'/g, "textAlign: isRtl ? 'right' : 'left'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replacements done!');
