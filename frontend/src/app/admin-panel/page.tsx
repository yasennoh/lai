"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '../components/CurrencyContext';
import { useLanguage } from '../components/LanguageContext';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
const API = 'https://ynoah.pythonanywhere.com/api/crm';

const sColor = (s: string) => s === 'ACTIVE' ? '#10B981' : s === 'PENDING' ? '#F59E0B' : s === 'EXPIRED' ? '#64748B' : '#EF4444';

interface Policy {
  id: number;
  client: number;
  policy_number: string;
  policy_type: string;
  premium_amount: string;
  coverage_amount: string;
  deductible: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_frequency: string;
  payment_method: string;
  beneficiary_name: string;
  beneficiary_relation: string;
  beneficiary_phone: string;
  insured_item_details: string;
  notes: string;
}
interface Client {
  id: number;
  first_name: string;
  second_name?: string;
  third_name?: string;
  last_name: string;
  client_type?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  national_id?: string;
  governorate?: string;
  address?: string;
}
interface Claim {
  id: number;
  policy: number;
  claim_number: string;
  description: string;
  claim_amount: string;
  status: string;
  rejection_reason?: string;
  filed_date?: string;
  resolved_date?: string;
}

const inpStyle: React.CSSProperties = {
  padding: '0.6rem 0.8rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'rgba(0,0,0,0.05)',
  color: 'var(--text-main)',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '0.9rem'
};

export default function AdminPanel() {
  const { t, isRtl, locale } = useLanguage();
  const typeL: Record<string, string> = { AUTO: t('typeAuto'), HEALTH: t('typeHealth'), LIFE: t('typeLife'), PROPERTY: t('typeProperty'), TRAVEL: t('typeTravel'), MARINE: t('typeMarine'), FIRE: t('typeFire'), LIABILITY: t('typeLiability'), ENGINEERING: t('typeEngineering') };
  const statusL: Record<string, string> = { ACTIVE: t('statusActive'), EXPIRED: t('statusExpired'), CANCELLED: t('statusCancelled'), PENDING: t('statusPending'), SUSPENDED: t('statusSuspended') };
  const claimStatusLabels: Record<string, string> = locale === 'ar' ? {
    PENDING: 'تم التقديم',
    UNDER_REVIEW: 'قيد التدقيق',
    APPROVED: 'معتمدة فنيّاً',
    REJECTED: 'مرفوضة فنيّاً',
    AWAITING_PAYMENT: 'بانتظار الصرف',
    PAID: 'تم الصرف',
  } : {
    PENDING: 'Submitted / Pending',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved (Technical)',
    REJECTED: 'Rejected (Technical)',
    AWAITING_PAYMENT: 'Awaiting Payment',
    PAID: 'Paid / Resolved',
  };

  const claimStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING': return '#F59E0B';
      case 'UNDER_REVIEW': return '#3B82F6';
      case 'APPROVED': return '#8B5CF6';
      case 'REJECTED': return '#EF4444';
      case 'AWAITING_PAYMENT': return '#EC4899';
      case 'PAID': return '#10B981';
      default: return '#64748B';
    }
  };
  const freqL: Record<string, string> = { MONTHLY: t('freqMonthly'), QUARTERLY: t('freqQuarterly'), SEMI_ANNUAL: t('freqSemiAnnual'), ANNUAL: t('freqAnnual'), ONE_TIME: t('freqOneTime') };
  const payL: Record<string, string> = { CASH: t('payCash'), BANK_TRANSFER: t('payBank'), CREDIT_CARD: t('payCredit'), CHECK: t('payCheck') };
  const { formatAmount } = useCurrency();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [tab, setTab] = useState('pending');
  const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ policy: '', claim_number: '', description: '', claim_amount: '' });
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const router = useRouter();
  const [rejectingClaimId, setRejectingClaimId] = useState<number | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejectReasonOpen, setIsRejectReasonOpen] = useState(false);
  const [policySearchQuery, setPolicySearchQuery] = useState('');
  const [isPolicyDropdownOpen, setIsPolicyDropdownOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [claimsSearch, setClaimsSearch] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (!['ADMIN', 'AUDITOR', 'ACCOUNTANT', 'HR'].includes(parsed.role)) { router.push('/login'); return; }
    setUser(parsed);
    if (parsed.role === 'HR') {
      setTab('hr_employees');
    }
    fetchAll();
  }, []);

  const fetchAll = () => {
    Promise.all([
      fetch(`${API}/policies/`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/clients/`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/claims/`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/employees/`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/departments/`).then(r => r.ok ? r.json() : []),
      fetch(`${API}/payrolls/`).then(r => r.ok ? r.json() : []),
    ]).then(([p, c, cl, emp, dep, pay]) => {
      setPolicies(p);
      setClients(c);
      setClaims(cl);
      setEmployees(emp);
      setDepartments(dep);
      setPayrolls(pay);
    }).catch(e => console.error("Fetch all error:", e));
  };

  const clientName = (id: number) => { const c = clients.find(x => x.id === id); return c ? `${c.first_name} ${c.last_name}` : '—'; };

  const handleReview = async (id: number) => {
    await fetch(`${API}/policies/${id}/review/`, { method: 'POST' });
    fetchAll();
  };
  const handleApprove = async (id: number) => {
    await fetch(`${API}/policies/${id}/approve/`, { method: 'POST' });
    fetchAll();
  };
  const handleReject = async (id: number) => {
    await fetch(`${API}/policies/${id}/reject/`, { method: 'POST' });
    fetchAll();
  };
  const handleAwaitPayment = async (id: number) => {
    await fetch(`${API}/policies/${id}/await_payment/`, { method: 'POST' });
    fetchAll();
  };
  const handleActivate = async (id: number) => {
    await fetch(`${API}/policies/${id}/activate/`, { method: 'POST' });
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`${API}/policies/${id}/`, { method: 'DELETE' });
    fetchAll();
  };

  const handleEditClick = (p: Policy) => {
    setEditForm({ ...p });
    setIsEditMode(true);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/policies/${editForm.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    if (res.ok) {
      const updated = await res.json();
      setSelectedPolicy(updated);
      setIsEditMode(false);
      fetchAll();
      alert('تم تحديث بيانات الوثيقة بنجاح');
    } else {
      alert('حدث خطأ أثناء حفظ التعديلات');
    }
  };

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API}/claims/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimForm)
    });
    if (res.ok) {
      setIsAddClaimOpen(false);
      setClaimForm({ policy: '', claim_number: '', description: '', claim_amount: '' });
      setPolicySearchQuery('');
      fetchAll();
      alert('تم إضافة المطالبة بنجاح');
    } else {
      alert('حدث خطأ أثناء حفظ المطالبة');
    }
  };

  const handleReviewClaim = async (id: number) => {
    await fetch(`${API}/claims/${id}/review/`, { method: 'POST' });
    fetchAll();
  };

  const handleApproveClaim = async (id: number) => {
    await fetch(`${API}/claims/${id}/approve/`, { method: 'POST' });
    fetchAll();
  };

  const handleAwaitPaymentClaim = async (id: number) => {
    await fetch(`${API}/claims/${id}/await_payment/`, { method: 'POST' });
    fetchAll();
  };

  const handlePayClaim = async (id: number) => {
    await fetch(`${API}/claims/${id}/pay/`, { method: 'POST' });
    fetchAll();
  };

  const handleRejectClaim = (id: number) => {
    setRejectingClaimId(id);
    setRejectReasonInput('');
    setIsRejectReasonOpen(true);
  };

  const handleConfirmRejectClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingClaimId) return;
    if (!rejectReasonInput.trim()) {
      alert("الرجاء كتابة سبب رفض المطالبة");
      return;
    }
    const res = await fetch(`${API}/claims/${rejectingClaimId}/reject/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: rejectReasonInput })
    });
    if (res.ok) {
      setIsRejectReasonOpen(false);
      setRejectingClaimId(null);
      setRejectReasonInput('');
      setIsClaimModalOpen(false);
      setSelectedClaim(null);
      fetchAll();
      alert('تم رفض المطالبة وتسجيل السبب بنجاح');
    } else {
      alert('حدث خطأ أثناء رفض المطالبة');
    }
  };



  const pending = policies.filter(p => {
    if (!user) return p.status === 'PENDING';
    if (user.role === 'AUDITOR') {
      return p.status === 'PENDING' || p.status === 'UNDER_REVIEW';
    } else if (user.role === 'ACCOUNTANT') {
      return p.status === 'APPROVED' || p.status === 'AWAITING_PAYMENT';
    } else {
      // ADMIN or default
      return p.status === 'PENDING' || p.status === 'UNDER_REVIEW' || p.status === 'APPROVED' || p.status === 'AWAITING_PAYMENT';
    }
  });
  const pendingClaims = claims.filter(c => {
    if (!user) return c.status === 'PENDING';
    if (user.role === 'AUDITOR') {
      return c.status === 'PENDING' || c.status === 'UNDER_REVIEW';
    } else if (user.role === 'ACCOUNTANT') {
      return c.status === 'APPROVED' || c.status === 'AWAITING_PAYMENT';
    } else {
      // ADMIN or default
      return c.status === 'PENDING' || c.status === 'UNDER_REVIEW' || c.status === 'APPROVED' || c.status === 'AWAITING_PAYMENT';
    }
  });
  const active = policies.filter(p => p.status === 'ACTIVE');
  const totalPrem = active.reduce((s, p) => s + parseFloat(p.premium_amount || '0'), 0);
  const totalCov = active.reduce((s, p) => s + parseFloat(p.coverage_amount || '0'), 0);

  const filteredAllPolicies = policies.filter(p => {
    const term = globalSearch.toLowerCase();
    const pNum = p.policy_number?.toLowerCase() || '';
    const cName = clientName(p.client).toLowerCase();
    return pNum.includes(term) || cName.includes(term);
  });

  const filteredClaims = claims.filter(c => {
    const term = claimsSearch.toLowerCase();
    const cNum = c.claim_number?.toLowerCase() || '';
    return cNum.includes(term);
  });

  if (!user) return null;

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr', padding: '2rem', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>
          {user.role === 'ADMIN' 
            ? t('staffManagement') 
            : user.role === 'AUDITOR' 
              ? (locale === 'ar' ? 'لوحة التدقيق الفني للوثائق' : 'Technical Audit Panel') 
              : user.role === 'ACCOUNTANT'
                ? (locale === 'ar' ? 'لوحة العمليات المالية والمحاسبة' : 'Financial Accounting Panel')
                : (locale === 'ar' ? 'لوحة الموارد البشرية' : 'HR Panel')}
        </h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dashboard / Admin Panel</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {(() => {
          let kpis = [];
          if (user.role === 'AUDITOR') {
            kpis = [
              { l: locale === 'ar' ? 'بانتظار التدقيق' : 'Awaiting Audit', v: policies.filter(p => p.status === 'PENDING').length, c: '#F59E0B', icon: PendingActionsOutlinedIcon },
              { l: locale === 'ar' ? 'قيد التدقيق' : 'Under Review', v: policies.filter(p => p.status === 'UNDER_REVIEW').length, c: '#3B82F6', icon: DescriptionOutlinedIcon },
              { l: locale === 'ar' ? 'المعتمدة فنيّاً' : 'Approved Policies', v: policies.filter(p => p.status === 'APPROVED').length, c: '#8B5CF6', icon: CheckCircleOutlineOutlinedIcon },
              { l: locale === 'ar' ? 'المرفوضة' : 'Rejected Policies', v: policies.filter(p => p.status === 'REJECTED').length, c: '#EF4444', icon: CancelOutlinedIcon },
              { l: locale === 'ar' ? 'مجموع الوثائق' : 'Total Policies', v: policies.length, c: '#64748B', icon: DescriptionOutlinedIcon },
            ];
          } else if (user.role === 'ACCOUNTANT') {
            const awaitingPaymentPolicies = policies.filter(p => p.status === 'AWAITING_PAYMENT');
            const totalAwaitingPayment = awaitingPaymentPolicies.reduce((s, p) => s + parseFloat(p.premium_amount || '0'), 0);
            kpis = [
              { l: locale === 'ar' ? 'معتمدة (بانتظار الفاتورة)' : 'Approved Policies', v: policies.filter(p => p.status === 'APPROVED').length, c: '#8B5CF6', icon: CheckCircleOutlineOutlinedIcon },
              { l: locale === 'ar' ? 'بانتظار الدفع' : 'Awaiting Payment', v: awaitingPaymentPolicies.length, c: '#EC4899', icon: PendingActionsOutlinedIcon },
              { l: locale === 'ar' ? 'الوثائق الفعالة' : 'Active Policies', v: active.length, c: '#10B981', icon: CheckCircleOutlineOutlinedIcon },
              { l: locale === 'ar' ? 'المبالغ المحصلة' : 'Collected Amount', v: formatAmount(totalPrem.toString()), c: '#10B981', icon: AccountBalanceWalletOutlinedIcon },
              { l: locale === 'ar' ? 'الديون المستحقة' : 'Outstanding Amount', v: formatAmount(totalAwaitingPayment.toString()), c: '#EF4444', icon: AccountBalanceWalletOutlinedIcon },
            ];
          } else if (user.role === 'HR') {
            const currentMonthStr = new Date().toISOString().substring(0, 7);
            const currentMonthSalaries = payrolls
              .filter(py => py.month === currentMonthStr)
              .reduce((sum, py) => sum + parseFloat(py.basic_salary || '0') + parseFloat(py.bonuses || '0') + parseFloat(py.overtime || '0') - parseFloat(py.social_security || '0') + parseFloat(py.end_of_service || '0'), 0);
            const pendingPayrolls = payrolls.filter(py => py.status === 'PENDING').length;
            const paidPayrolls = payrolls.filter(py => py.status === 'PAID').length;

            kpis = [
              { l: locale === 'ar' ? 'إجمالي الموظفين' : 'Total Employees', v: employees.length, c: '#3B82F6', icon: GroupsOutlinedIcon },
              { l: locale === 'ar' ? 'الأقسام' : 'Departments', v: departments.length, c: '#8B5CF6', icon: ApartmentOutlinedIcon },
              { l: locale === 'ar' ? 'رواتب الشهر الحالي' : 'Current Month Salaries', v: formatAmount(currentMonthSalaries.toString()), c: '#10B981', icon: AccountBalanceWalletOutlinedIcon },
              { l: locale === 'ar' ? 'مسيرات رواتب معلقة' : 'Pending Payrolls', v: pendingPayrolls, c: '#F59E0B', icon: PendingActionsOutlinedIcon },
              { l: locale === 'ar' ? 'مسيرات رواتب مصروفة' : 'Disbursed Payrolls', v: paidPayrolls, c: '#10B981', icon: CheckCircleOutlineOutlinedIcon },
            ];
          } else {
            kpis = [
              { l: t('pendingPoliciesTab'), v: pending.length, c: '#F59E0B', icon: PendingActionsOutlinedIcon },
              { l: t('activePoliciesCount'), v: active.length, c: '#10B981', icon: CheckCircleOutlineOutlinedIcon },
              { l: t('totalClients'), v: clients.length, c: '#3B82F6', icon: PeopleAltOutlinedIcon },
              { l: t('totalPremiums'), v: formatAmount(totalPrem.toString()), c: '#8B5CF6', icon: AccountBalanceWalletOutlinedIcon },
              { l: t('totalCoverage'), v: formatAmount(totalCov.toString()), c: '#EC4899', icon: SecurityOutlinedIcon },
            ];
          }

          return kpis.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${s.c}15`, color: s.c }}>
                  <Icon style={{ fontSize: '1.25rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: s.c }}>{s.v}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.l}</div>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          ...(user.role === 'HR' ? [
            { k: 'hr_employees', l: locale === 'ar' ? 'الموظفون' : 'Employees', n: employees.length },
            { k: 'hr_payrolls', l: locale === 'ar' ? 'مسيرات الرواتب' : 'Payrolls', n: payrolls.length },
            { k: 'hr_departments', l: locale === 'ar' ? 'الأقسام' : 'Departments', n: departments.length },
          ] : [
            { 
              k: 'pending', 
              l: user.role === 'ADMIN' 
                ? (locale === 'ar' ? 'بوالص تحتاج إجراء' : 'Policies Needing Action') 
                : user.role === 'AUDITOR' 
                  ? (locale === 'ar' ? 'بوالص قيد المراجعة والتدقيق' : 'Policies Awaiting Audit') 
                  : (locale === 'ar' ? 'تحصيل البوالص' : 'Policies Awaiting Payment'), 
              n: pending.length 
            },
            { 
              k: 'pending_claims', 
              l: user.role === 'ADMIN' 
                ? (locale === 'ar' ? 'مطالبات تحتاج إجراء' : 'Claims Needing Action') 
                : user.role === 'AUDITOR' 
                  ? (locale === 'ar' ? 'مطالبات قيد المراجعة والتدقيق' : 'Claims Awaiting Audit') 
                  : (locale === 'ar' ? 'صرف المطالبات' : 'Claims Awaiting Payment'), 
              n: pendingClaims.length 
            },
            ...(user.role === 'ADMIN' ? [
              { k: 'all', l: t('allPoliciesTab'), n: policies.length },
              { k: 'claims', l: t('claims'), n: claims.length }
            ] : user.role === 'ACCOUNTANT' ? [
              { k: 'claims', l: t('claims'), n: claims.length }
            ] : [])
          ])
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '0.9rem', background: tab === t.k ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: tab === t.k ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>
            {t.l} ({t.n})
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>{t('policiesAwaitingApproval')}</h2>
          {pending.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{t('noPendingPolicies')}</p> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pending.map(p => (
                <div key={p.id} onClick={() => { setSelectedPolicy(p); setIsDetailModalOpen(true); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{p.policy_number} — {typeL[p.policy_type]}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('clientLabel')} {clientName(p.client)} • {t('premiumLabel')} {formatAmount(p.premium_amount)} • {t('coverageLabel')} {formatAmount(p.coverage_amount || '0')}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('fromLabel')} {p.start_date} {t('toLabel')} {p.end_date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setSelectedPolicy(p); setIsDetailModalOpen(true); }} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#3B82F6', color: 'white' }}>{t('openPolicy')}</button>
                    
                    {p.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                      <button onClick={() => handleReview(p.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#3B82F6', color: 'white' }}>{locale === 'ar' ? 'بدء التدقيق' : 'Start Review'}</button>
                    )}
                    
                    {p.status === 'UNDER_REVIEW' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                      <>
                        <button onClick={() => handleApprove(p.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}>{locale === 'ar' ? 'موافقة فنية' : 'Approve'}</button>
                        <button onClick={() => handleReject(p.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EF4444', color: 'white' }}>{locale === 'ar' ? 'رفض فني' : 'Reject'}</button>
                      </>
                    )}
                    
                    {p.status === 'APPROVED' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                      <button onClick={() => handleAwaitPayment(p.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EC4899', color: 'white' }}>{locale === 'ar' ? 'طلب الدفع' : 'Request Payment'}</button>
                    )}
                    
                    {p.status === 'AWAITING_PAYMENT' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                      <button onClick={() => handleActivate(p.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}>{locale === 'ar' ? 'تأكيد الدفع والتفعيل' : 'Confirm & Activate'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>}
        </div>
      )}

      {tab === 'pending_claims' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>
            {user.role === 'AUDITOR' 
              ? (locale === 'ar' ? 'مطالبات بانتظار التدقيق والمراجعة' : 'Claims Awaiting Technical Audit') 
              : user.role === 'ACCOUNTANT' 
                ? (locale === 'ar' ? 'مطالبات بانتظار الصرف والدفع' : 'Claims Awaiting Disbursement') 
                : (locale === 'ar' ? 'مطالبات بانتظار اتخاذ إجراء' : 'Claims Awaiting Action')}
          </h2>
          {pendingClaims.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{locale === 'ar' ? 'لا توجد مطالبات معلقة حالياً' : 'No pending claims'}</p> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingClaims.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderRadius: '12px', background: 'rgba(236,72,153,0.03)', border: '1px solid rgba(236,72,153,0.15)', transition: 'all 0.2s' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                      {c.claim_number}
                      <span style={{ marginRight: '0.75rem', marginLeft: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', color: 'white', background: claimStatusColor(c.status) }}>
                        {claimStatusLabels[c.status]}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                      {locale === 'ar' ? 'قيمة المطالبة:' : 'Claim Amount:'} {formatAmount(c.claim_amount)} • {locale === 'ar' ? 'الوصف:' : 'Description:'} {c.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    
                    {c.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                      <button onClick={() => handleReviewClaim(c.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#3B82F6', color: 'white' }}>{locale === 'ar' ? 'بدء المراجعة' : 'Start Review'}</button>
                    )}
                    
                    {c.status === 'UNDER_REVIEW' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                      <>
                        <button onClick={() => handleApproveClaim(c.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}>{locale === 'ar' ? 'موافقة فنية' : 'Approve'}</button>
                        <button onClick={() => handleRejectClaim(c.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EF4444', color: 'white' }}>{locale === 'ar' ? 'رفض فني' : 'Reject'}</button>
                      </>
                    )}
                    
                    {c.status === 'APPROVED' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                      <button onClick={() => handleAwaitPaymentClaim(c.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EC4899', color: 'white' }}>{locale === 'ar' ? 'طلب الصرف' : 'Request Payment'}</button>
                    )}
                    
                    {c.status === 'AWAITING_PAYMENT' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                      <button onClick={() => handlePayClaim(c.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}>{locale === 'ar' ? 'تأكيد الصرف' : 'Confirm & Paid'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>}
        </div>
      )}

      {/* All Policies */}
      {tab === 'all' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{t('allPolicies')}</h2>
            <input 
              type="text" 
              placeholder={isRtl ? 'بحث برقم الوثيقة أو اسم العميل...' : 'Search by policy number or client name...'} 
              value={globalSearch} 
              onChange={e => setGlobalSearch(e.target.value)} 
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', outline: 'none', width: '300px', maxWidth: '100%', fontFamily: 'inherit', fontSize: '0.9rem' }} 
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: isRtl ? 'right' : 'left', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('policyNumber')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('customers')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('policyType')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('premiumAmount').replace(' *', '')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('status')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllPolicies.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 1 ? 'rgba(0,0,0,0.01)' : 'transparent', transition: 'all 0.2s' }}>
                    <td style={{ padding: '1.2rem 1rem', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: idx === policies.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{p.policy_number}</td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === policies.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{clientName(p.client)}</td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === policies.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{typeL[p.policy_type]}</td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === policies.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0', color: 'var(--primary)', fontWeight: 'bold' }}>{formatAmount(p.premium_amount)}</td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === policies.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', color: 'white', background: sColor(p.status), fontWeight: 'bold', display: 'inline-block' }}>
                        {statusL[p.status]}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === policies.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <VisibilityOutlinedIcon 
                          onClick={() => { setSelectedPolicy(p); setIsDetailModalOpen(true); }} 
                          style={{ color: '#3B82F6', cursor: 'pointer', fontSize: '1.3rem' }} 
                          titleAccess="التفاصيل"
                        />
                        {p.status === 'PENDING' && (
                          <CheckCircleOutlineOutlinedIcon 
                            onClick={() => handleApprove(p.id)} 
                            style={{ color: '#10B981', cursor: 'pointer', fontSize: '1.3rem' }} 
                            titleAccess="موافقة"
                          />
                        )}
                        <DeleteOutlineOutlinedIcon 
                          onClick={() => handleDelete(p.id)} 
                          style={{ color: '#EF4444', cursor: 'pointer', fontSize: '1.3rem' }} 
                          titleAccess="حذف"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claims */}
      {tab === 'claims' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{t('claims')}</h2>
            <input 
              type="text" 
              placeholder={isRtl ? 'بحث برقم المطالبة...' : 'Search by claim number...'} 
              value={claimsSearch} 
              onChange={e => setClaimsSearch(e.target.value)} 
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', outline: 'none', width: '300px', maxWidth: '100%', fontFamily: 'inherit', fontSize: '0.9rem' }} 
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: isRtl ? 'right' : 'left', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('claimNumber')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('amount')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{t('status')}</th>
                  <th style={{ padding: '1.2rem 1rem', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '1rem', borderBottom: '2px solid #E2E8F0' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((c, idx) => (
                  <tr key={c.id} style={{ background: idx % 2 === 1 ? 'rgba(0,0,0,0.01)' : 'transparent', transition: 'all 0.2s' }}>
                    <td style={{ padding: '1.2rem 1rem', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: idx === claims.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{c.claim_number}</td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === claims.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0', color: 'var(--primary)', fontWeight: 'bold' }}>{formatAmount(c.claim_amount)}</td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === claims.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', color: 'white', background: claimStatusColor(c.status), fontWeight: 'bold', display: 'inline-block' }}>
                        {claimStatusLabels[c.status]}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem', fontSize: '0.95rem', borderBottom: idx === claims.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => { setSelectedClaim(c); setIsClaimModalOpen(true); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            border: '1px solid #3B82F6',
                            background: 'rgba(59, 130, 246, 0.05)',
                            color: '#3B82F6',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; }}
                        >
                          <VisibilityOutlinedIcon style={{ fontSize: '1rem' }} />
                          {locale === 'ar' ? 'معلومات المطالب' : 'Claim Details'}
                        </button>

                        {c.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                          <button onClick={() => handleReviewClaim(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #3B82F6', background: 'rgba(59, 130, 246, 0.05)', color: '#3B82F6', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.8rem' }}>{locale === 'ar' ? 'بدء التدقيق' : 'Start Review'}</button>
                        )}
                        {c.status === 'UNDER_REVIEW' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                          <>
                            <button onClick={() => handleApproveClaim(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.05)', color: '#10B981', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.8rem' }}>{locale === 'ar' ? 'موافقة فنية' : 'Approve'}</button>
                            <button onClick={() => handleRejectClaim(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #EF4444', background: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.8rem' }}>{locale === 'ar' ? 'رفض فني' : 'Reject'}</button>
                          </>
                        )}
                        {c.status === 'APPROVED' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                          <button onClick={() => handleAwaitPaymentClaim(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #EC4899', background: 'rgba(236, 72, 153, 0.05)', color: '#EC4899', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.8rem' }}>{locale === 'ar' ? 'طلب الصرف' : 'Request Payment'}</button>
                        )}
                        {c.status === 'AWAITING_PAYMENT' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                          <button onClick={() => handlePayClaim(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.05)', color: '#10B981', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.8rem' }}>{locale === 'ar' ? 'تأكيد الصرف' : 'Confirm Paid'}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'hr_employees' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{locale === 'ar' ? 'قائمة الموظفين' : 'Employees List'}</h2>
            <button 
              onClick={() => router.push('/employees')} 
              className="btn-primary" 
              style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}
            >
              {locale === 'ar' ? 'إدارة الموظفين ➔' : 'Manage Employees ➔'}
            </button>
          </div>
          {employees.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              {locale === 'ar' ? 'لا يوجد موظفين مسجلين حالياً' : 'No employees registered'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: isRtl ? 'right' : 'left', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'القسم' : 'Department'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'رقم الهوية الوطنية' : 'National ID'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0' }}>{locale === 'ar' ? 'حساب النظام' : 'System Username'}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, idx) => (
                    <tr key={emp.id} style={{ background: idx % 2 === 1 ? 'rgba(0,0,0,0.01)' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold', borderBottom: idx === employees.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{emp.full_name}</td>
                      <td style={{ padding: '1rem', borderBottom: idx === employees.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{emp.department_name || '—'}</td>
                      <td style={{ padding: '1rem', borderBottom: idx === employees.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{emp.national_id || '—'}</td>
                      <td style={{ padding: '1rem', borderBottom: idx === employees.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0', color: 'var(--primary)', fontWeight: 'bold' }}>{formatAmount(emp.basic_salary)}</td>
                      <td style={{ padding: '1rem', borderBottom: idx === employees.length - 1 ? 'none' : '1px solid #E2E8F0' }}>{emp.username || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'hr_payrolls' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{locale === 'ar' ? 'مسيرات الرواتب' : 'Payroll Registry'}</h2>
            <button 
              onClick={() => router.push('/payroll')} 
              className="btn-primary" 
              style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}
            >
              {locale === 'ar' ? 'إدارة الرواتب ➔' : 'Manage Payroll ➔'}
            </button>
          </div>
          {payrolls.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              {locale === 'ar' ? 'لا توجد مسيرات رواتب مسجلة حالياً' : 'No payroll records registered'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: isRtl ? 'right' : 'left', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'الموظف' : 'Employee'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'الشهر' : 'Month'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'الصافي المستحق' : 'Net Salary'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0' }}>{locale === 'ar' ? 'تاريخ الصرف' : 'Payout Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((py, idx) => {
                    const net = parseFloat(py.basic_salary || '0') + parseFloat(py.bonuses || '0') + parseFloat(py.overtime || '0') - parseFloat(py.social_security || '0') + parseFloat(py.end_of_service || '0');
                    return (
                      <tr key={py.id} style={{ background: idx % 2 === 1 ? 'rgba(0,0,0,0.01)' : 'transparent' }}>
                        <td style={{ padding: '1rem', fontWeight: 'bold', borderBottom: idx === payrolls.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{py.employee_details?.full_name || py.employee_name || '—'}</td>
                        <td style={{ padding: '1rem', borderBottom: idx === payrolls.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{py.month}</td>
                        <td style={{ padding: '1rem', borderBottom: idx === payrolls.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0', color: 'var(--primary)', fontWeight: 'bold' }}>{formatAmount(net.toString())}</td>
                        <td style={{ padding: '1rem', borderBottom: idx === payrolls.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '999px', 
                            fontSize: '0.8rem', 
                            color: 'white', 
                            background: py.status === 'PAID' ? '#10B981' : '#F59E0B', 
                            fontWeight: 'bold', 
                            display: 'inline-block' 
                          }}>
                            {py.status === 'PAID' ? (locale === 'ar' ? 'تم الصرف' : 'Paid') : (locale === 'ar' ? 'قيد الانتظار' : 'Pending')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', borderBottom: idx === payrolls.length - 1 ? 'none' : '1px solid #E2E8F0' }}>{py.payout_date || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'hr_departments' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{locale === 'ar' ? 'أقسام الشركة' : 'Company Departments'}</h2>
            <button 
              onClick={() => router.push('/departments')} 
              className="btn-primary" 
              style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}
            >
              {locale === 'ar' ? 'إدارة الأقسام ➔' : 'Manage Departments ➔'}
            </button>
          </div>
          {departments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              {locale === 'ar' ? 'لا توجد أقسام مسجلة حالياً' : 'No departments registered'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: isRtl ? 'right' : 'left', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'اسم القسم' : 'Department Name'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{locale === 'ar' ? 'الوصف' : 'Description'}</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 'bold', borderBottom: '2px solid #E2E8F0' }}>{locale === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dep, idx) => (
                    <tr key={dep.id} style={{ background: idx % 2 === 1 ? 'rgba(0,0,0,0.01)' : 'transparent' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold', borderBottom: idx === departments.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{dep.name}</td>
                      <td style={{ padding: '1rem', borderBottom: idx === departments.length - 1 ? 'none' : '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0' }}>{dep.description || '—'}</td>
                      <td style={{ padding: '1rem', borderBottom: idx === departments.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
                        {dep.created_at ? new Date(dep.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Claim Modal */}
      {isAddClaimOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1F2937' }}>{t('addNewClaim')}</h2>
              <button onClick={() => setIsAddClaimOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6B7280' }}>✕</button>
            </div>
            <form onSubmit={handleAddClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.85rem', color: '#4B5563', display: 'block', marginBottom: '0.3rem' }}>رقم الوثيقة *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="{t('searchPolicyOrClient')}" 
                    value={policySearchQuery}
                    onFocus={() => setIsPolicyDropdownOpen(true)}
                    onChange={e => {
                      setPolicySearchQuery(e.target.value);
                      setIsPolicyDropdownOpen(true);
                      if (e.target.value === '') {
                        setClaimForm({ ...claimForm, policy: '' });
                      }
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      paddingLeft: '2rem',
                      borderRadius: '6px',
                      border: '1px solid #D1D5DB',
                      background: 'white',
                      color: '#1F2937',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }} 
                  />
                  <span 
                    onClick={() => setIsPolicyDropdownOpen(!isPolicyDropdownOpen)}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: '#6B7280',
                      fontSize: '0.75rem',
                      userSelect: 'none'
                    }}
                  >
                    ▼
                  </span>
                </div>

                {isPolicyDropdownOpen && (
                  <>
                    <div 
                      onClick={() => setIsPolicyDropdownOpen(false)} 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1005, background: 'transparent' }} 
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 1010,
                        marginTop: '0.25rem'
                      }}
                    >
                      {policies.filter(p => {
                        const cName = clientName(p.client).toLowerCase();
                        const pNum = p.policy_number.toLowerCase();
                        const query = policySearchQuery.toLowerCase();
                        return pNum.includes(query) || cName.includes(query);
                      }).length === 0 ? (
                        <div style={{ padding: '0.75rem', color: '#6B7280', textAlign: 'center', fontSize: '0.85rem' }}>
                          {t('noMatchingPolicies')}
                        </div>
                      ) : (
                        policies.filter(p => {
                          const cName = clientName(p.client).toLowerCase();
                          const pNum = p.policy_number.toLowerCase();
                          const query = policySearchQuery.toLowerCase();
                          return pNum.includes(query) || cName.includes(query);
                        }).map(p => {
                          const desc = `${p.policy_number} - ${clientName(p.client)}`;
                          const isSelected = claimForm.policy === p.id.toString();
                          return (
                            <div 
                              key={p.id}
                              onClick={() => {
                                setClaimForm({ ...claimForm, policy: p.id.toString() });
                                setPolicySearchQuery(desc);
                                setIsPolicyDropdownOpen(false);
                              }}
                              style={{
                                padding: '0.75rem 1rem',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                color: isSelected ? '#2563EB' : '#1F2937',
                                borderBottom: '1px solid #F3F4F6'
                              }}
                              onMouseOver={e => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = '#F9FAFB';
                              }}
                              onMouseOut={e => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {desc}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#4B5563', display: 'block', marginBottom: '0.3rem' }}>رقم المطالبة *</label>
                <input type="text" value={claimForm.claim_number} onChange={e => setClaimForm({ ...claimForm, claim_number: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#4B5563', display: 'block', marginBottom: '0.3rem' }}>{t('claimAmount')}</label>
                <input type="number" step="0.01" value={claimForm.claim_amount} onChange={e => setClaimForm({ ...claimForm, claim_amount: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#4B5563', display: 'block', marginBottom: '0.3rem' }}>{t('claimDescription')}</label>
                <textarea value={claimForm.description} onChange={e => setClaimForm({ ...claimForm, description: e.target.value })} required rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #D1D5DB', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>{t('saveClaim')}</button>
                <button type="button" onClick={() => setIsAddClaimOpen(false)} style={{ flex: 1, backgroundColor: 'transparent', color: '#4B5563', border: '1px solid #D1D5DB', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details & Edit Modal */}
      {isDetailModalOpen && selectedPolicy && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', direction: isRtl ? 'rtl' : 'ltr', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
                {isEditMode ? `تعديل وثيقة رقم: ${selectedPolicy.policy_number}` : `تفاصيل الوثيقة: ${selectedPolicy.policy_number}`}
              </h2>
              <button onClick={() => { setIsDetailModalOpen(false); setIsEditMode(false); }} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {isEditMode ? (
              <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem' }}>البيانات الأساسية</div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{t('policyNumber')}</label>
                    <input name="policy_number" value={editForm.policy_number} onChange={e => setEditForm({ ...editForm, policy_number: e.target.value })} required style={inpStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>نوع التأمين</label>
                    <select name="policy_type" value={editForm.policy_type} onChange={e => setEditForm({ ...editForm, policy_type: e.target.value })} style={inpStyle}>
                      {Object.entries(typeL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>تاريخ البدء</label>
                    <input type="date" name="start_date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} required style={inpStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>تاريخ الانتهاء</label>
                    <input type="date" name="end_date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} required style={inpStyle} />
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginTop: '0.5rem' }}>التغطية والأقساط</div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>مبلغ التغطية</label>
                    <input type="number" step="0.01" value={editForm.coverage_amount} onChange={e => setEditForm({ ...editForm, coverage_amount: e.target.value })} style={inpStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>مبلغ القسط *</label>
                    <input type="number" step="0.01" value={editForm.premium_amount} onChange={e => setEditForm({ ...editForm, premium_amount: e.target.value })} required style={inpStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>مبلغ التحمل</label>
                    <input type="number" step="0.01" value={editForm.deductible} onChange={e => setEditForm({ ...editForm, deductible: e.target.value })} style={inpStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>دورية الدفع</label>
                    <select value={editForm.payment_frequency} onChange={e => setEditForm({ ...editForm, payment_frequency: e.target.value })} style={inpStyle}>
                      {Object.entries(freqL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>طريقة الدفع</label>
                    <select value={editForm.payment_method} onChange={e => setEditForm({ ...editForm, payment_method: e.target.value })} style={inpStyle}>
                      {Object.entries(payL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginTop: '0.5rem' }}>المستفيد (اختياري)</div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>اسم المستفيد</label>
                    <input value={editForm.beneficiary_name} onChange={e => setEditForm({ ...editForm, beneficiary_name: e.target.value })} style={inpStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>صلة القرابة</label>
                    <input value={editForm.beneficiary_relation} onChange={e => setEditForm({ ...editForm, beneficiary_relation: e.target.value })} style={inpStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>هاتف المستفيد</label>
                    <input value={editForm.beneficiary_phone} onChange={e => setEditForm({ ...editForm, beneficiary_phone: e.target.value })} style={inpStyle} />
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginTop: '0.5rem' }}>تفاصيل إضافية</div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>تفاصيل الشيء المؤمن عليه</label>
                  <textarea value={editForm.insured_item_details} onChange={e => setEditForm({ ...editForm, insured_item_details: e.target.value })} style={{ ...inpStyle, minHeight: '60px', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>ملاحظات</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={{ ...inpStyle, minHeight: '50px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, fontWeight: 'bold' }}>حفظ التعديلات</button>
                  <button type="button" onClick={() => setIsEditMode(false)} style={{ flex: 1, ...inpStyle, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)', fontWeight: 'bold' }}>{t('cancel')}</button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { l: locale === 'ar' ? 'العميل' : 'Client', v: clientName(selectedPolicy.client) },
                    { l: locale === 'ar' ? 'نوع التأمين' : 'Policy Type', v: typeL[selectedPolicy.policy_type] || '—' },
                    { l: locale === 'ar' ? 'الحالة' : 'Status', v: statusL[selectedPolicy.status] || '—', c: sColor(selectedPolicy.status) },
                    { l: locale === 'ar' ? 'المبلغ الكامل' : 'Total Amount', v: `${formatAmount((selectedPolicy as any).total_amount || selectedPolicy.premium_amount || '0')} ${(selectedPolicy as any).currency === 'USD' ? (locale === 'ar' ? 'دولار' : 'USD') : (locale === 'ar' ? 'دينار' : 'IQD')}` },
                    { l: locale === 'ar' ? 'قسط الاشتراك' : 'Net Premium', v: formatAmount((selectedPolicy as any).net_premium || '0') },
                    { l: locale === 'ar' ? 'رسم الطابع' : 'Stamp Duty', v: `${formatAmount((selectedPolicy as any).stamp_duty_amount || '0')} (${(selectedPolicy as any).stamp_duty_percentage || 0}%)` },
                    { l: locale === 'ar' ? 'رسم الديوان' : 'Diwan Fee', v: `${formatAmount((selectedPolicy as any).diwan_fee_amount || '0')} (${(selectedPolicy as any).diwan_fee_percentage || 0}%)` },
                    { l: locale === 'ar' ? 'رسوم إدارية' : 'Admin Fees', v: formatAmount((selectedPolicy as any).admin_fees || '0') },
                    { l: locale === 'ar' ? 'مبلغ التغطية' : 'Coverage', v: formatAmount(selectedPolicy.coverage_amount || '0') },
                    { l: locale === 'ar' ? 'مبلغ التحمل' : 'Deductible', v: formatAmount(selectedPolicy.deductible || '0') },
                    { l: locale === 'ar' ? 'تاريخ الإصدار' : 'Issue Date', v: (selectedPolicy as any).issue_date || '—' },
                    { l: locale === 'ar' ? 'بداية التغطية' : 'Start Date', v: selectedPolicy.start_date },
                    { l: locale === 'ar' ? 'نهاية التغطية' : 'End Date', v: selectedPolicy.end_date },
                    { l: locale === 'ar' ? 'دورية الدفع' : 'Payment Freq', v: freqL[selectedPolicy.payment_frequency] || '—' },
                    { l: locale === 'ar' ? 'طريقة الدفع' : 'Payment Method', v: payL[selectedPolicy.payment_method] || '—' },
                    { l: locale === 'ar' ? 'المستفيد' : 'Beneficiary', v: selectedPolicy.beneficiary_name || '—' },
                    { l: locale === 'ar' ? 'صلة القرابة' : 'Relation', v: selectedPolicy.beneficiary_relation || '—' },
                    { l: locale === 'ar' ? 'هاتف المستفيد' : 'Beneficiary Phone', v: selectedPolicy.beneficiary_phone || '—' },
                    { l: locale === 'ar' ? 'إصدار بواسطة' : 'Issued By', v: (selectedPolicy as any).created_by_name || '—' },
                  ].map((f, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{f.l}</div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: (f as any).c || 'inherit' }}>{f.v}</div>
                    </div>
                  ))}
                </div>

                {selectedPolicy.insured_item_details && (
                  <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{locale === 'ar' ? 'تفاصيل الشيء المؤمن عليه' : 'Insured Details'}</div>
                    <div style={{ fontSize: '0.9rem' }}>{selectedPolicy.insured_item_details}</div>
                  </div>
                )}
                {(selectedPolicy as any).terms_and_conditions && (
                  <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</div>
                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{(selectedPolicy as any).terms_and_conditions}</div>
                  </div>
                )}
                {(selectedPolicy as any).exclusions && (
                  <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{locale === 'ar' ? 'الاستثناءات' : 'Exclusions'}</div>
                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{(selectedPolicy as any).exclusions}</div>
                  </div>
                )}
                {selectedPolicy.notes && (
                  <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{locale === 'ar' ? 'ملاحظات' : 'Notes'}</div>
                    <div style={{ fontSize: '0.9rem' }}>{selectedPolicy.notes}</div>
                  </div>
                )}
                {(selectedPolicy as any).details && Object.keys((selectedPolicy as any).details).length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginBottom: '0.5rem' }}>{locale === 'ar' ? 'تفاصيل إضافية' : 'Dynamic Details'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {Object.entries((selectedPolicy as any).details).map(([k, v]) => (
                        <div key={k} style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '6px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{k}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                  {selectedPolicy.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                    <button onClick={async () => { await handleReview(selectedPolicy.id); setIsDetailModalOpen(false); alert(locale === 'ar' ? 'تم بدء التدقيق الفني للوثيقة' : 'Auditing started'); }} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#3B82F6', color: 'white' }}>
                      {locale === 'ar' ? 'بدء التدقيق' : 'Start Review'}
                    </button>
                  )}
                  {selectedPolicy.status === 'UNDER_REVIEW' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                    <>
                      <button onClick={async () => { await handleApprove(selectedPolicy.id); setIsDetailModalOpen(false); alert(locale === 'ar' ? 'تمت الموافقة الفنية على الوثيقة' : 'Policy approved'); }} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}>
                        {locale === 'ar' ? 'موافقة فنية' : 'Approve'}
                      </button>
                      <button onClick={async () => { await handleReject(selectedPolicy.id); setIsDetailModalOpen(false); alert(locale === 'ar' ? 'تم رفض الوثيقة فنيّاً' : 'Policy rejected'); }} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EF4444', color: 'white' }}>
                        {locale === 'ar' ? 'رفض فني' : 'Reject'}
                      </button>
                    </>
                  )}
                  {selectedPolicy.status === 'APPROVED' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                    <button onClick={async () => { await handleAwaitPayment(selectedPolicy.id); setIsDetailModalOpen(false); alert(locale === 'ar' ? 'تم إرسال طلب الدفع للبوليصة' : 'Payment requested'); }} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EC4899', color: 'white' }}>
                      {locale === 'ar' ? 'طلب الدفع' : 'Request Payment'}
                    </button>
                  )}
                  {selectedPolicy.status === 'AWAITING_PAYMENT' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                    <button onClick={async () => { await handleActivate(selectedPolicy.id); setIsDetailModalOpen(false); alert(locale === 'ar' ? 'تم تأكيد الدفع وتفعيل البوليصة' : 'Policy activated'); }} style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}>
                      {locale === 'ar' ? 'تأكيد الدفع والتفعيل' : 'Confirm Payment & Activate'}
                    </button>
                  )}
                  <button onClick={() => { setIsDetailModalOpen(false); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--text-muted)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-main)' }}>
                    إغلاق
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Claimant & Claim Details Modal */}
      {isClaimModalOpen && selectedClaim && (() => {
        const policy = policies.find(p => p.id === selectedClaim.policy);
        const client = policy ? clients.find(cl => cl.id === policy.client) : null;
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', direction: isRtl ? 'rtl' : 'ltr', position: 'relative' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
                  تفاصيل المطالبة والمعلومات الشخصية
                </h2>
                <button onClick={() => { setIsClaimModalOpen(false); setSelectedClaim(null); }} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              </div>

              <div>
                {/* Claimant Details */}
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>معلومات المطالب (العميل)</div>
                {client ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { l: 'الاسم الكامل', v: `${client.first_name || ''} ${client.second_name || ''} ${client.third_name || ''} ${client.last_name || ''}`.replace(/\s+/g, ' ').trim() },
                      { l: 'نوع العميل', v: client.client_type === 'CORPORATE' ? 'شركة' : 'فردي' },
                      { l: 'رقم الهاتف', v: client.phone || '—' },
                      { l: 'رقم هاتف بديل', v: client.phone2 || '—' },
                      { l: 'البريد الإلكتروني', v: client.email || '—' },
                      { l: 'رقم الهوية الوطنية', v: client.national_id || '—' },
                      { l: 'المحافظة', v: client.governorate || '—' },
                      { l: 'العنوان', v: client.address || '—' },
                    ].map((f, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{f.l}</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>بيانات العميل غير متوفرة</p>
                )}

                {/* Policy Details */}
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>معلومات بوليصة التأمين المرتبطة</div>
                {policy ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { l: 'رقم الوثيقة', v: policy.policy_number },
                      { l: 'نوع التأمين', v: typeL[policy.policy_type] || '—' },
                      { l: 'مبلغ التغطية', v: formatAmount(policy.coverage_amount || '0') },
                      { l: 'مبلغ القسط السنوي', v: formatAmount(policy.premium_amount || '0') },
                      { l: 'بداية التغطية', v: policy.start_date },
                      { l: 'نهاية التغطية', v: policy.end_date },
                    ].map((f, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{f.l}</div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>بيانات الوثيقة غير متوفرة</p>
                )}

                {/* Claim Details */}
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>بيانات المطالبة</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { l: 'رقم المطالبة', v: selectedClaim.claim_number },
                    { l: 'مبلغ المطالبة', v: formatAmount(selectedClaim.claim_amount) },
                    { l: 'تاريخ التقديم', v: selectedClaim.filed_date || '—' },
                    { l: 'حالة المطالبة', v: claimStatusLabels[selectedClaim.status] || selectedClaim.status, c: claimStatusColor(selectedClaim.status) },
                  ].map((f, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{f.l}</div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: f.c || 'inherit' }}>{f.v}</div>
                    </div>
                  ))}
                </div>

                {selectedClaim.description && (
                  <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: selectedClaim.status === 'REJECTED' && selectedClaim.rejection_reason ? '0.5rem' : '2rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>وصف وتفاصيل الحادث/المطالبة</div>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedClaim.description}</div>
                  </div>
                )}

                {selectedClaim.status === 'REJECTED' && selectedClaim.rejection_reason && (
                  <div style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#EF4444', marginBottom: '0.2rem', fontWeight: 'bold' }}>سبب الرفض</div>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedClaim.rejection_reason}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                  {selectedClaim.status === 'PENDING' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                    <button 
                      onClick={async () => { 
                        await handleReviewClaim(selectedClaim.id); 
                        setIsClaimModalOpen(false); 
                        setSelectedClaim(null); 
                        alert(locale === 'ar' ? 'تم بدء دراسة المطالبة' : 'Claim review started'); 
                      }} 
                      style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#3B82F6', color: 'white' }}
                    >
                      {locale === 'ar' ? 'بدء المراجعة' : 'Start Review'}
                    </button>
                  )}
                  {selectedClaim.status === 'UNDER_REVIEW' && (user.role === 'ADMIN' || user.role === 'AUDITOR') && (
                    <>
                      <button 
                        onClick={async () => { 
                          await handleApproveClaim(selectedClaim.id); 
                          setIsClaimModalOpen(false); 
                          setSelectedClaim(null); 
                          alert(locale === 'ar' ? 'تمت الموافقة الفنية على المطالبة' : 'Claim approved'); 
                        }} 
                        style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}
                      >
                        {locale === 'ar' ? 'موافقة فنية' : 'Approve'}
                      </button>
                      <button 
                        onClick={async () => { 
                          await handleRejectClaim(selectedClaim.id); 
                          setIsClaimModalOpen(false); 
                          setSelectedClaim(null); 
                        }} 
                        style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EF4444', color: 'white' }}
                      >
                        {locale === 'ar' ? 'رفض المطالبة' : 'Reject'}
                      </button>
                    </>
                  )}
                  {selectedClaim.status === 'APPROVED' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                    <button 
                      onClick={async () => { 
                        await handleAwaitPaymentClaim(selectedClaim.id); 
                        setIsClaimModalOpen(false); 
                        setSelectedClaim(null); 
                        alert(locale === 'ar' ? 'تم تحويل المطالبة للصرف المالي' : 'Disbursement requested'); 
                      }} 
                      style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#EC4899', color: 'white' }}
                    >
                      {locale === 'ar' ? 'طلب الصرف' : 'Request Payment'}
                    </button>
                  )}
                  {selectedClaim.status === 'AWAITING_PAYMENT' && (user.role === 'ADMIN' || user.role === 'ACCOUNTANT') && (
                    <button 
                      onClick={async () => { 
                        await handlePayClaim(selectedClaim.id); 
                        setIsClaimModalOpen(false); 
                        setSelectedClaim(null); 
                        alert(locale === 'ar' ? 'تم تأكيد الصرف بنجاح' : 'Payment confirmed'); 
                      }} 
                      style={{ flex: 1, minWidth: '120px', padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', background: '#10B981', color: 'white' }}
                    >
                      {locale === 'ar' ? 'تأكيد الصرف' : 'Confirm Disbursement'}
                    </button>
                  )}
                  <button onClick={() => { setIsClaimModalOpen(false); setSelectedClaim(null); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--text-muted)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-main)', flex: selectedClaim.status === 'APPROVED' || selectedClaim.status === 'REJECTED' ? 1 : 'none' }}>
                    إغلاق
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Reject Reason Input Modal */}
      {isRejectReasonOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '12px', direction: isRtl ? 'rtl' : 'ltr' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#EF4444', fontWeight: 'bold' }}>سبب رفض المطالبة</h3>
              <button onClick={() => { setIsRejectReasonOpen(false); setRejectingClaimId(null); }} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleConfirmRejectClaim} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>الرجاء إدخال سبب وتفاصيل رفض هذه المطالبة لتوثيقها في النظام:</label>
                <textarea 
                  value={rejectReasonInput} 
                  onChange={e => setRejectReasonInput(e.target.value)} 
                  required 
                  rows={4} 
                  placeholder="مثال: المستندات الطبية المرفقة غير مكتملة، أو الحادث يقع خارج نطاق التغطية الجغرافية..."
                  style={{ ...inpStyle, minHeight: '100px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
                  تأكيد الرفض
                </button>
                <button type="button" onClick={() => { setIsRejectReasonOpen(false); setRejectingClaimId(null); }} style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '0.6rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
