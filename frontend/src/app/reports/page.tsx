"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { useCurrency } from '../components/CurrencyContext';

interface Client {
  id: number;
  first_name: string; second_name: string; third_name: string; last_name: string;
  email: string; phone: string; phone2: string; address: string;
  client_type: string; status: string; national_id: string; created_at: string;
  created_by_name: string;
}

interface Policy {
  id: number; client: number; policy_number: string; policy_type: string;
  premium_amount: string; coverage_amount: string;
  start_date: string; end_date: string; status: string;
  created_at: string; created_by_name: string;
}

interface Claim {
  id: number;
  policy: number;
  claim_number: string;
  description: string;
  claim_amount: string;
  status: string;
  filed_date: string;
}


const inputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text-main)', outline: 'none',
  width: '100%', fontFamily: 'inherit', fontSize: '0.95rem'
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'right',
  borderBottom: '2px solid var(--border)',
  color: 'var(--text-muted)',
  fontSize: '0.9rem',
  fontWeight: '600'
};

const tableCellStyle: React.CSSProperties = {
  padding: '1rem',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-main)',
  fontSize: '0.95rem'
};

const translatePolicyType = (type: string, locale: string) => {
  const types: Record<string, { ar: string; en: string }> = {
    AUTO: { ar: 'تأمين السيارات', en: 'Auto Insurance' },
    HEALTH: { ar: 'تأمين صحي', en: 'Health Insurance' },
    LIFE: { ar: 'تأمين على الحياة', en: 'Life Insurance' },
    PROPERTY: { ar: 'تأمين الممتلكات', en: 'Property Insurance' },
    TRAVEL: { ar: 'تأمين السفر', en: 'Travel Insurance' },
    MARINE: { ar: 'تأمين النقل والبحري', en: 'Marine & Transport Insurance' },
    FIRE: { ar: 'تأمين ضد الحريق', en: 'Fire Insurance' },
    LIABILITY: { ar: 'تأمين المسؤولية', en: 'Liability Insurance' },
    ENGINEERING: { ar: 'تأمين هندسي', en: 'Engineering Insurance' },
  };
  return types[type] ? (locale === 'ar' ? types[type].ar : types[type].en) : (locale === 'ar' ? 'أخرى' : 'Other');
};

const translatePolicyStatus = (status: string, locale: string) => {
  const statuses: Record<string, { ar: string; en: string }> = {
    ACTIVE: { ar: 'فعالة', en: 'Active' },
    EXPIRED: { ar: 'منتهية', en: 'Expired' },
    CANCELLED: { ar: 'ملغاة', en: 'Cancelled' },
    PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
    SUSPENDED: { ar: 'معلقة', en: 'Suspended' },
  };
  return statuses[status] ? (locale === 'ar' ? statuses[status].ar : statuses[status].en) : (locale === 'ar' ? 'غير معروف' : 'Unknown');
};

export default function Reports() {
  const { locale } = useLanguage();
  const { currency } = useCurrency();

  const POLICY_TYPE_MAP: Record<string, { label: string; icon: string }> = {
    AUTO: { label: locale === 'ar' ? 'تأمين السيارات' : 'Auto Insurance', icon: '🚗' },
    HEALTH: { label: locale === 'ar' ? 'تأمين صحي' : 'Health Insurance', icon: '🏥' },
    LIFE: { label: locale === 'ar' ? 'تأمين على الحياة' : 'Life Insurance', icon: '🛡️' },
    PROPERTY: { label: locale === 'ar' ? 'تأمين الممتلكات' : 'Property Insurance', icon: '🏠' },
    TRAVEL: { label: locale === 'ar' ? 'تأمين السفر' : 'Travel Insurance', icon: '✈️' },
    MARINE: { label: locale === 'ar' ? 'تأمين النقل والبحري' : 'Marine & Transport Insurance', icon: '🚢' },
    FIRE: { label: locale === 'ar' ? 'تأمين ضد الحريق' : 'Fire Insurance', icon: '🔥' },
    LIABILITY: { label: locale === 'ar' ? 'تأمين المسؤولية' : 'Liability Insurance', icon: '⚖️' },
    ENGINEERING: { label: locale === 'ar' ? 'تأمين هندسي' : 'Engineering Insurance', icon: '⚙️' },
  };
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Navigation
  const [activeTab, setActiveTab] = useState<'analytics' | 'exports'>('analytics');

  // Global/Dashboard Filters
  const [dashboardDateRange, setDashboardDateRange] = useState('ALL');
  const [dashboardStartDate, setDashboardStartDate] = useState('');
  const [dashboardEndDate, setDashboardEndDate] = useState('');

  // General Exports Filters
  const [clientDateRange, setClientDateRange] = useState('ALL');
  const [clientStartDate, setClientStartDate] = useState('');
  const [clientEndDate, setClientEndDate] = useState('');

  const [leadDateRange, setLeadDateRange] = useState('ALL');
  const [leadStartDate, setLeadStartDate] = useState('');
  const [leadEndDate, setLeadEndDate] = useState('');

  const [policyDateRange, setPolicyDateRange] = useState('ALL');
  const [policyStartDate, setPolicyStartDate] = useState('');
  const [policyEndDate, setPolicyEndDate] = useState('');
  const [policyStatus, setPolicyStatus] = useState('ALL');

  const [claimDateRange, setClaimDateRange] = useState('ALL');
  const [claimStartDate, setClaimStartDate] = useState('');
  const [claimEndDate, setClaimEndDate] = useState('');
  const [claimStatus, setClaimStatus] = useState('ALL');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) { router.push('/login'); return; }
    if (JSON.parse(user).role !== 'ADMIN') { router.push('/crm'); return; }

    Promise.all([
      fetch('https://ynoah.pythonanywhere.com/api/crm/clients/').then(r => r.json()),
      fetch('https://ynoah.pythonanywhere.com/api/crm/policies/').then(r => r.json()),
      fetch('https://ynoah.pythonanywhere.com/api/crm/claims/').then(r => r.json())
    ]).then(([c, p, cl]) => {
      setClients(c);
      setPolicies(p);
      setClaims(cl);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  const filterByDate = (dateString: string, range: string, start: string, end: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    
    const now = new Date();
    if (range === '1_MONTH') {
      const monthAgo = new Date(); monthAgo.setMonth(now.getMonth() - 1);
      return d >= monthAgo;
    } else if (range === '6_MONTHS') {
      const sixAgo = new Date(); sixAgo.setMonth(now.getMonth() - 6);
      return d >= sixAgo;
    } else if (range === '1_YEAR') {
      const yearAgo = new Date(); yearAgo.setFullYear(now.getFullYear() - 1);
      return d >= yearAgo;
    } else if (range === 'CUSTOM') {
      if (start && new Date(start) > d) return false;
      if (end && new Date(end) < d) return false;
      return true;
    }
    return true; // ALL
  };

  const getFilteredPolicies = () => {
    return policies.filter(p => filterByDate(p.created_at, dashboardDateRange, dashboardStartDate, dashboardEndDate));
  };

  const getFilteredClaims = () => {
    return claims.filter(c => filterByDate(c.filed_date, dashboardDateRange, dashboardStartDate, dashboardEndDate));
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'IQD') {
      return `${Math.round(amount * 1450).toLocaleString('en-US')} IQD`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  const getCustomerName = (policyId: number) => {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return locale === 'ar' ? 'غير معروف' : 'Unknown';
    const client = clients.find(c => c.id === policy.client);
    if (!client) return locale === 'ar' ? 'غير معروف' : 'Unknown';
    return `${client.first_name} ${client.second_name} ${client.third_name ? client.third_name + ' ' : ''}${client.last_name}`;
  };

  // Policy type analysis calculations
  const getPolicyTypeStats = () => {
    const filteredP = getFilteredPolicies();
    const filteredC = getFilteredClaims();

    const totalPremiumSum = filteredP.reduce((acc, p) => acc + parseFloat(p.premium_amount || '0'), 0);

    return Object.entries(POLICY_TYPE_MAP).map(([key, info]) => {
      const typePolicies = filteredP.filter(p => p.policy_type === key);
      const count = typePolicies.length;
      
      const revenue = typePolicies.reduce((acc, p) => acc + parseFloat(p.premium_amount || '0'), 0);
      const share = totalPremiumSum > 0 ? (revenue / totalPremiumSum) * 100 : 0;

      // Find claims associated with this policy type
      const typeClaims = filteredC.filter(c => {
        const policy = policies.find(p => p.id === c.policy);
        return policy && policy.policy_type === key;
      });
      const claimsCount = typeClaims.length;

      // Total approved claims represent actual losses/paid claims
      const approvedClaimsAmount = typeClaims
        .filter(c => c.status === 'APPROVED')
        .reduce((acc, c) => acc + parseFloat(c.claim_amount || '0'), 0);

      // Loss Ratio = (Approved Claims Amount / Total Premium Amount) * 100
      const lossRatio = revenue > 0 ? (approvedClaimsAmount / revenue) * 100 : 0;

      return {
        key,
        label: info.label,
        icon: info.icon,
        count,
        revenue,
        share,
        claimsCount,
        approvedClaimsAmount,
        lossRatio
      };
    });
  };

  // KPI Computations for the active filtered dashboard
  const filteredPoliciesList = getFilteredPolicies();
  const filteredClaimsList = getFilteredClaims();

  const totalRevenue = filteredPoliciesList.reduce((acc, p) => acc + parseFloat(p.premium_amount || '0'), 0);
  
  // Total losses = Approved claims amount
  const totalLosses = filteredClaimsList
    .filter(c => c.status === 'APPROVED')
    .reduce((acc, c) => acc + parseFloat(c.claim_amount || '0'), 0);

  const netOperatingIncome = totalRevenue - totalLosses;
  const overallLossRatio = totalRevenue > 0 ? (totalLosses / totalRevenue) * 100 : 0;

  // Custom Targeted Exports
  const exportRevenueByType = (typeKey: string, typeLabel: string) => {
    const filtered = getFilteredPolicies().filter(p => p.policy_type === typeKey);
    if (filtered.length === 0) {
      alert(locale === 'ar' ? `لا توجد وثائق من نوع ${typeLabel} في الفترة المحددة لتصديرها` : `No policies of type ${typeLabel} found in the specified period for export`);
      return;
    }

    const data = filtered.map(p => {
      const clientName = getCustomerName(p.id);
      return {
        [locale === 'ar' ? 'رقم الوثيقة' : 'Policy Number']: p.policy_number,
        [locale === 'ar' ? 'العميل' : 'Client']: clientName,
        [locale === 'ar' ? 'نوع التأمين' : 'Insurance Type']: typeLabel,
        [locale === 'ar' ? 'مبلغ القسط' : 'Premium Amount']: currency === 'IQD' ? Math.round(parseFloat(p.premium_amount) * 1450) : parseFloat(p.premium_amount),
        [locale === 'ar' ? 'مبلغ التغطية' : 'Coverage Amount']: currency === 'IQD' ? Math.round(parseFloat(p.coverage_amount) * 1450) : parseFloat(p.coverage_amount),
        [locale === 'ar' ? 'العملة' : 'Currency']: currency === 'IQD' ? 'IQD' : 'USD',
        [locale === 'ar' ? 'تاريخ الإصدار' : 'Issue Date']: new Date(p.start_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date']: new Date(p.end_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'حالة الوثيقة' : 'Policy Status']: translatePolicyStatus(p.status, locale),
        [locale === 'ar' ? 'تاريخ الإضافة' : 'Date Added']: new Date(p.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'المستخدم المدخل' : 'Entered By']: p.created_by_name || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? `إيرادات ${typeLabel}` : `${typeLabel} Revenue`);
    XLSX.writeFile(wb, `revenue_${typeKey.toLowerCase()}_report.xlsx`);
  };

  const exportLossesByType = (typeKey: string, typeLabel: string) => {
    const filtered = getFilteredClaims().filter(c => {
      const policy = policies.find(p => p.id === c.policy);
      return policy && policy.policy_type === typeKey;
    });

    if (filtered.length === 0) {
      alert(locale === 'ar' ? `لا توجد مطالبات/خسائر من نوع ${typeLabel} في الفترة المحددة لتصديرها` : `No claims/losses of type ${typeLabel} found in the specified period for export`);
      return;
    }

    const data = filtered.map(c => {
      const policy = policies.find(p => p.id === c.policy);
      const policyNum = policy ? policy.policy_number : locale === 'ar' ? 'غير معروف' : 'Unknown';
      const clientName = getCustomerName(c.policy);
      
      const statusLabels: Record<string, string> = {
        PENDING: locale === 'ar' ? 'قيد المراجعة' : 'Pending',
        UNDER_REVIEW: locale === 'ar' ? 'تحت الإجراء' : 'Under Review',
        APPROVED: locale === 'ar' ? 'مقبولة (خسارة معتمدة)' : 'Approved (Loss Confirmed)',
        REJECTED: locale === 'ar' ? 'مرفوضة' : 'Rejected',
      };

      return {
        [locale === 'ar' ? 'رقم المطالبة' : 'Claim Number']: c.claim_number,
        [locale === 'ar' ? 'رقم الوثيقة' : 'Policy Number']: policyNum,
        [locale === 'ar' ? 'نوع التأمين' : 'Insurance Type']: typeLabel,
        [locale === 'ar' ? 'العميل' : 'Client']: clientName,
        [locale === 'ar' ? 'مبلغ المطالبة (الخسارة)' : 'Claim Amount (Loss)']: currency === 'IQD' ? Math.round(parseFloat(c.claim_amount) * 1450) : parseFloat(c.claim_amount),
        [locale === 'ar' ? 'العملة' : 'Currency']: currency === 'IQD' ? 'IQD' : 'USD',
        [locale === 'ar' ? 'حالة المطالبة' : 'Claim Status']: statusLabels[c.status] || c.status,
        [locale === 'ar' ? 'تاريخ التقديم' : 'Date Filed']: new Date(c.filed_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'تفاصيل المطالبة' : 'Claim Details']: c.description || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? `خسائر ${typeLabel}` : `${typeLabel} Losses`);
    XLSX.writeFile(wb, `losses_${typeKey.toLowerCase()}_report.xlsx`);
  };

  // General exports
  const exportActiveClients = () => {
    const filtered = clients.filter(c => c.status !== 'LEAD' && filterByDate(c.created_at, clientDateRange, clientStartDate, clientEndDate));
    if (filtered.length === 0) { alert(locale === 'ar' ? 'لا يوجد بيانات لتصديرها' : 'No data to export'); return; }
    
    const data = filtered.map(c => ({
      [locale === 'ar' ? 'رقم التعريفي' : 'ID Number']: c.id,
      [locale === 'ar' ? 'الاسم الأول' : 'First Name']: c.first_name,
      [locale === 'ar' ? 'الاسم الثاني' : 'Second Name']: c.second_name,
      [locale === 'ar' ? 'الاسم الثالث' : 'Third Name']: c.third_name || '',
      [locale === 'ar' ? 'اللقب' : 'Last Name']: c.last_name || '',
      [locale === 'ar' ? 'التصنيف' : 'Classification']: c.client_type === 'CORPORATE' ? (locale === 'ar' ? 'شركات' : 'Corporate') : (locale === 'ar' ? 'فردي' : 'Individual'),
      [locale === 'ar' ? 'الحالة' : 'Status']: c.status === 'ACTIVE' ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'غير نشط' : 'Inactive'),
      [locale === 'ar' ? 'رقم الهوية' : 'National ID']: c.national_id || '',
      [locale === 'ar' ? 'البريد الإلكتروني' : 'Email']: c.email || '',
      [locale === 'ar' ? 'الهاتف' : 'Phone']: c.phone || '',
      [locale === 'ar' ? 'الهاتف 2' : 'Phone 2']: c.phone2 || '',
      [locale === 'ar' ? 'العنوان' : 'Address']: c.address || '',
      [locale === 'ar' ? 'تاريخ الإضافة' : 'Date Added']: new Date(c.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
      [locale === 'ar' ? 'المدخل' : 'Entered By']: c.created_by_name || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? "تقرير العملاء" : "Clients Report");
    XLSX.writeFile(wb, locale === 'ar' ? "active_clients_report.xlsx" : "active_clients_report_en.xlsx");
  };

  const exportLeads = () => {
    const filtered = clients.filter(c => c.status === 'LEAD' && filterByDate(c.created_at, leadDateRange, leadStartDate, leadEndDate));
    if (filtered.length === 0) { alert(locale === 'ar' ? 'لا يوجد بيانات لتصديرها' : 'No data to export'); return; }
    
    const data = filtered.map(c => ({
      [locale === 'ar' ? 'رقم التعريفي' : 'ID Number']: c.id,
      [locale === 'ar' ? 'الاسم الأول' : 'First Name']: c.first_name,
      [locale === 'ar' ? 'الاسم الثاني' : 'Second Name']: c.second_name,
      [locale === 'ar' ? 'الاسم الثالث' : 'Third Name']: c.third_name || '',
      [locale === 'ar' ? 'اللقب' : 'Last Name']: c.last_name || '',
      [locale === 'ar' ? 'التصنيف' : 'Classification']: c.client_type === 'CORPORATE' ? (locale === 'ar' ? 'شركات' : 'Corporate') : (locale === 'ar' ? 'فردي' : 'Individual'),
      [locale === 'ar' ? 'الحالة' : 'Status']: locale === 'ar' ? 'محتمل' : 'Lead',
      [locale === 'ar' ? 'رقم الهوية' : 'National ID']: c.national_id || '',
      [locale === 'ar' ? 'البريد الإلكتروني' : 'Email']: c.email || '',
      [locale === 'ar' ? 'الهاتف' : 'Phone']: c.phone || '',
      [locale === 'ar' ? 'الهاتف 2' : 'Phone 2']: c.phone2 || '',
      [locale === 'ar' ? 'العنوان' : 'Address']: c.address || '',
      [locale === 'ar' ? 'تاريخ الإضافة' : 'Date Added']: new Date(c.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
      [locale === 'ar' ? 'المدخل' : 'Entered By']: c.created_by_name || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? "تقرير العملاء المحتملين" : "Leads Report");
    XLSX.writeFile(wb, locale === 'ar' ? "leads_report.xlsx" : "leads_report_en.xlsx");
  };

  const exportPolicies = () => {
    const now = new Date();
    const next30Days = new Date(); next30Days.setDate(now.getDate() + 30);

    const filtered = policies.filter(p => {
      const isDateValid = filterByDate(p.created_at, policyDateRange, policyStartDate, policyEndDate);
      if (!isDateValid) return false;

      if (policyStatus === 'ALL') return true;
      if (policyStatus === 'NEAREXPIRY') {
        if (p.status !== 'ACTIVE') return false;
        const ed = new Date(p.end_date);
        return ed > now && ed <= next30Days;
      }
      return p.status === policyStatus;
    });

    if (filtered.length === 0) { alert(locale === 'ar' ? 'لا يوجد بيانات لتصديرها' : 'No data to export'); return; }

    const data = filtered.map(p => {
      const client = clients.find(c => c.id === p.client);
      const clientName = client ? `${client.first_name} ${client.second_name} ${client.third_name ? client.third_name + ' ' : ''}${client.last_name}` : '';
      return {
        [locale === 'ar' ? 'رقم الوثيقة' : 'Policy Number']: p.policy_number,
        [locale === 'ar' ? 'العميل' : 'Client']: clientName,
        [locale === 'ar' ? 'النوع' : 'Type']: translatePolicyType(p.policy_type, locale),
        [locale === 'ar' ? 'الحالة' : 'Status']: translatePolicyStatus(p.status, locale),
        [locale === 'ar' ? 'مبلغ القسط' : 'Premium Amount']: currency === 'IQD' ? Math.round(parseFloat(p.premium_amount) * 1450) : parseFloat(p.premium_amount),
        [locale === 'ar' ? 'مبلغ التغطية' : 'Coverage Amount']: currency === 'IQD' ? Math.round(parseFloat(p.coverage_amount) * 1450) : parseFloat(p.coverage_amount),
        [locale === 'ar' ? 'العملة' : 'Currency']: currency === 'IQD' ? (locale === 'ar' ? 'دينار عراقي (IQD)' : 'Iraqi Dinar (IQD)') : (locale === 'ar' ? 'دولار أمريكي (USD)' : 'US Dollar (USD)'),
        [locale === 'ar' ? 'تاريخ الإصدار' : 'Issue Date']: new Date(p.start_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date']: new Date(p.end_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'تاريخ الإضافة' : 'Date Added']: new Date(p.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'المدخل' : 'Entered By']: p.created_by_name || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? "تقرير الوثائق" : "Policies Report");
    XLSX.writeFile(wb, locale === 'ar' ? "policies_report.xlsx" : "policies_report_en.xlsx");
  };

  const exportClaims = () => {
    const filtered = claims.filter(c => {
      const isDateValid = filterByDate(c.filed_date, claimDateRange, claimStartDate, claimEndDate);
      if (!isDateValid) return false;
      if (claimStatus !== 'ALL' && c.status !== claimStatus) return false;
      return true;
    });

    if (filtered.length === 0) { alert(locale === 'ar' ? 'لا يوجد بيانات لتصديرها' : 'No data to export'); return; }

    const data = filtered.map(c => {
      const policy = policies.find(p => p.id === c.policy);
      const policyNum = policy ? policy.policy_number : (locale === 'ar' ? 'غير معروف' : 'Unknown');
      const clientName = getCustomerName(c.policy);
      return {
        [locale === 'ar' ? 'رقم المطالبة' : 'Claim Number']: c.claim_number,
        [locale === 'ar' ? 'العميل' : 'Client']: clientName,
        [locale === 'ar' ? 'رقم الوثيقة' : 'Policy Number']: policyNum,
        [locale === 'ar' ? 'مبلغ المطالبة' : 'Claim Amount']: currency === 'IQD' ? Math.round(parseFloat(c.claim_amount) * 1450) : parseFloat(c.claim_amount),
        [locale === 'ar' ? 'الحالة' : 'Status']: c.status === 'PENDING' || c.status === 'Submitted' ? (locale === 'ar' ? 'قيد المراجعة' : 'Pending') :
                  c.status === 'UNDER_REVIEW' ? (locale === 'ar' ? 'تحت الإجراء' : 'Under Review') :
                  c.status === 'APPROVED' ? (locale === 'ar' ? 'مقبولة' : 'Approved') :
                  c.status === 'REJECTED' ? (locale === 'ar' ? 'مرفوضة' : 'Rejected') :
                  c.status === 'CLOSED' ? (locale === 'ar' ? 'مغلقة' : 'Closed') : c.status,
        [locale === 'ar' ? 'تاريخ التقديم' : 'Date Filed']: new Date(c.filed_date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US'),
        [locale === 'ar' ? 'الوصف' : 'Description']: c.description || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? "تقرير المطالبات" : "Claims Report");
    XLSX.writeFile(wb, locale === 'ar' ? "claims_report.xlsx" : "claims_report_en.xlsx");
  };

  const getLossRatioColor = (ratio: number) => {
    if (ratio === 0) return 'var(--text-muted)';
    if (ratio < 40) return '#10B981'; // Green (Safe / profitable)
    if (ratio < 75) return '#F59E0B'; // Orange (Medium Risk)
    return '#EF4444'; // Red (High Risk / Loss)
  };

  const getLossRatioLabel = (ratio: number) => {
    if (ratio === 0) return locale === 'ar' ? 'لا يوجد خسائر' : 'No Losses';
    if (ratio < 40) return locale === 'ar' ? 'آمن ومربح ممتاز' : 'Safe & Highly Profitable';
    if (ratio < 75) return locale === 'ar' ? 'مخاطر معتدلة مقبولة' : 'Moderate Acceptable Risk';
    return locale === 'ar' ? 'خسائر مرتفعة (حرجة)' : 'High Losses (Critical)';
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><p style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p></div>;

  const policyStats = getPolicyTypeStats();

  return (
    <div style={{ direction: locale === 'ar' ? 'rtl' : 'ltr', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{locale === 'ar' ? 'التقارير وتحليل الأداء المالي' : 'Reports & Financial Performance Analysis'}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'لوحة التحكم / التقارير والمالية' : 'Dashboard / Reports & Financials'}</span>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.6rem 1.2rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'analytics' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          {locale === 'ar' ? 'المؤشرات المالية والتحليلات' : 'Financial Indicators & Analytics'}
        </button>
        <button 
          onClick={() => setActiveTab('exports')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.6rem 1.2rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            color: activeTab === 'exports' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'exports' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.2s ease',
          }}
        >
          {locale === 'ar' ? 'استخراج تقرير العامة (Excel)' : 'General Reports Export (Excel)'}
        </button>
      </div>

      {/* Tab 1: Financial Analytics Dashboard */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Dashboard Date Filter Panel */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-main)' }}>{locale === 'ar' ? 'تصفية التقارير المالية والتحليلات' : 'Filter Financial Reports & Analytics'}</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>{locale === 'ar' ? 'فترة التحليل المالي' : 'Financial Analysis Period'}</label>
                <select value={dashboardDateRange} onChange={e => setDashboardDateRange(e.target.value)} style={inputStyle}>
                  <option value="ALL">{locale === 'ar' ? 'جميع الأوقات (تاريخ تراكمي)' : 'All Time (Cumulative)'}</option>
                  <option value="1_MONTH">{locale === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
                  <option value="6_MONTHS">{locale === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}</option>
                  <option value="1_YEAR">{locale === 'ar' ? 'آخر سنة' : 'Last Year'}</option>
                  <option value="CUSTOM">{locale === 'ar' ? 'تحديد فترة مخصصة (تواريخ)' : 'Custom Date Range'}</option>
                </select>
              </div>
              {dashboardDateRange === 'CUSTOM' && (
                <>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>{locale === 'ar' ? 'من تاريخ' : 'From Date'}</label>
                    <input type="date" value={dashboardStartDate} onChange={e => setDashboardStartDate(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>{locale === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
                    <input type="date" value={dashboardEndDate} onChange={e => setDashboardEndDate(e.target.value)} style={inputStyle} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Core Financial KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            
            {/* KPI 1: Total Premium Revenues */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '5px solid #10B981' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>{locale === 'ar' ? 'إيرادات أقساط التأمين المكتتبة' : 'Written Premium Revenue'}</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10B981' }}>{formatCurrency(totalRevenue)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? `${filteredPoliciesList.length} وثيقة صادرة خلال الفترة` : `${filteredPoliciesList.length} policies issued in the period`}</span>
            </div>

            {/* KPI 2: Total Losses (Approved Claims) */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '5px solid #EF4444' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>{locale === 'ar' ? 'التعويضات والخسائر المعتمدة' : 'Approved Claims & Losses'}</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#EF4444' }}>{formatCurrency(totalLosses)}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {locale === 'ar' ? `${filteredClaimsList.filter(c => c.status === 'APPROVED').length} مطالبة مقبولة ومدفوعة` : `${filteredClaimsList.filter(c => c.status === 'APPROVED').length} claims approved & paid`}
              </span>
            </div>

            {/* KPI 3: Net Operating Income */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: `5px solid ${netOperatingIncome >= 0 ? 'var(--primary)' : '#EF4444'}` }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>{locale === 'ar' ? 'صافي الإيراد التشغيلي (الفائض)' : 'Net Operating Income (Surplus)'}</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: netOperatingIncome >= 0 ? 'var(--primary)' : '#EF4444' }}>
                {formatCurrency(netOperatingIncome)}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'بعد خصم الخسائر المسددة من الإيرادات' : 'After deducting paid losses from revenues'}</span>
            </div>

            {/* KPI 4: Overall Loss Ratio */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: `5px solid ${getLossRatioColor(overallLossRatio)}` }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>{locale === 'ar' ? 'معدل الخسارة الإجمالي (Loss Ratio)' : 'Overall Loss Ratio'}</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: getLossRatioColor(overallLossRatio) }}>
                {overallLossRatio.toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: getLossRatioColor(overallLossRatio) }}>
                {getLossRatioLabel(overallLossRatio)}
              </span>
            </div>

          </div>

          {/* Report 1: Revenue by Policy Type */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--primary)' }}>{locale === 'ar' ? 'تقرير إيرادات وثائق التأمين (حسب النوع)' : 'Insurance Policies Revenue Report (by Type)'}</h2>
                <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'مجموع مبالغ الأقساط ونسب المساهمة المالية لكل نوع تأمين' : 'Total premium amounts and financial contribution rates for each insurance type'}</p>
              </div>
              <button 
                onClick={() => {
                  const data = policyStats.map(s => ({
                    [locale === 'ar' ? 'نوع التأمين' : 'Insurance Type']: s.label,
                    [locale === 'ar' ? 'عدد الوثائق الصادرة' : 'Issued Policies Count']: s.count,
                    [locale === 'ar' ? 'إجمالي الإيرادات (الأقساط)' : 'Total Revenues (Premiums)']: currency === 'IQD' ? Math.round(s.revenue * 1450) : s.revenue,
                    [locale === 'ar' ? 'نسبة المساهمة من المبيعات' : 'Sales Contribution Share']: `${s.share.toFixed(1)}%`,
                    [locale === 'ar' ? 'العملة' : 'Currency']: currency === 'IQD' ? 'IQD' : 'USD'
                  }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? "تقرير إيرادات وثائق التأمين" : "Policies Revenue Summary");
                  XLSX.writeFile(wb, locale === 'ar' ? "policies_revenue_summary.xlsx" : "policies_revenue_summary_en.xlsx");
                }}
                className="btn-primary"
              >
                {locale === 'ar' ? 'تصدير ملخص الإيرادات (Excel)' : 'Export Revenue Summary (Excel)'}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'نوع التأمين' : 'Insurance Type'}</th>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'عدد الوثائق النشطة' : 'Number of Active Policies'}</th>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'إجمالي إيرادات الأقساط' : 'Total Premium Revenues'}</th>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'نسبة المساهمة المالية' : 'Financial Contribution Percentage'}</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>{locale === 'ar' ? 'التحميل والاستخراج' : 'Download and Extraction'}</th>
                  </tr>
                </thead>
                <tbody>
                  {policyStats.map((stat) => (
                    <tr key={stat.key} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                          <span>{stat.label}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>{locale === 'ar' ? `${stat.count} وثيقة` : `${stat.count} Policies`}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 'bold', color: stat.revenue > 0 ? '#10B981' : 'var(--text-muted)' }}>
                        {formatCurrency(stat.revenue)}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', minWidth: '80px' }}>
                            <div style={{ width: `${stat.share}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', width: '40px', textAlign: locale === 'ar' ? 'left' : 'right' }}>
                            {stat.share.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                        <button 
                          onClick={() => exportRevenueByType(stat.key, stat.label)}
                          className="btn-primary" 
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'rgba(0,150,136,0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', boxShadow: 'none' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,150,136,0.1)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        >
                          {locale === 'ar' ? 'تصدير كشف إيرادات Excel' : 'Export Revenue Excel'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report 2: Losses & Claims Ratio Analysis */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#EF4444' }}>{locale === 'ar' ? 'تقرير الخسائر ومطالبات التعويض (حسب النوع)' : 'Claims & Losses Report (by Type)'}</h2>
                <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'تحليل المطالبات المعتمدة (الخسائر المدفوعة) ونسب الخسارة مقابل الأقساط' : 'Analysis of approved claims (paid losses) and loss ratios vs premiums'}</p>
              </div>
              <button 
                onClick={() => {
                  const data = policyStats.map(s => ({
                    [locale === 'ar' ? 'نوع التأمين' : 'Insurance Type']: s.label,
                    [locale === 'ar' ? 'المطالبات المقدمة' : 'Submitted Claims']: s.claimsCount,
                    [locale === 'ar' ? 'الخسائر المعتمدة (المدفوعة)' : 'Approved Losses (Paid)']: currency === 'IQD' ? Math.round(s.approvedClaimsAmount * 1450) : s.approvedClaimsAmount,
                    [locale === 'ar' ? 'معدل الخسارة (Loss Ratio)' : 'Loss Ratio']: `${s.lossRatio.toFixed(1)}%`,
                    [locale === 'ar' ? 'مستوى تقييم الخسارة' : 'Loss Assessment Level']: getLossRatioLabel(s.lossRatio),
                    [locale === 'ar' ? 'العملة' : 'Currency']: currency === 'IQD' ? 'IQD' : 'USD'
                  }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, locale === 'ar' ? "تقرير خسائر ومطالبات التأمين" : "Insurance Claims & Losses Report");
                  XLSX.writeFile(wb, locale === 'ar' ? "losses_claims_summary.xlsx" : "losses_claims_summary_en.xlsx");
                }}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #EF4444, #C53030)' }}
              >
                {locale === 'ar' ? 'تصدير ملخص الخسائر (Excel)' : 'Export Loss Summary (Excel)'}
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'نوع التأمين' : 'Insurance Type'}</th>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'المطالبات المقدمة' : 'Submitted Claims'}</th>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'الخسائر المعتمدة' : 'Approved Losses'}</th>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'معدل خسارة التأمين (Loss Ratio)' : 'Loss Ratio'}</th>
                    <th style={tableHeaderStyle}>{locale === 'ar' ? 'درجة الخطورة' : 'Risk Level'}</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>{locale === 'ar' ? 'التحميل والاستخراج' : 'Download and Extraction'}</th>
                  </tr>
                </thead>
                <tbody>
                  {policyStats.map((stat) => (
                    <tr key={stat.key} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                          <span>{stat.label}</span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>{locale === 'ar' ? `${stat.claimsCount} مطالبات` : `${stat.claimsCount} Claims`}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 'bold', color: stat.approvedClaimsAmount > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                        {formatCurrency(stat.approvedClaimsAmount)}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ fontWeight: 'bold', color: getLossRatioColor(stat.lossRatio) }}>
                          {stat.lossRatio.toFixed(1)}%
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px',
                            background: `${getLossRatioColor(stat.lossRatio)}15`,
                            color: getLossRatioColor(stat.lossRatio),
                            border: `1px solid ${getLossRatioColor(stat.lossRatio)}40`
                          }}
                        >
                          {getLossRatioLabel(stat.lossRatio)}
                        </span>
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                        <button 
                          onClick={() => exportLossesByType(stat.key, stat.label)}
                          className="btn-primary" 
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid #EF4444', boxShadow: 'none' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444'; }}
                        >
                          {locale === 'ar' ? 'تصدير تفاصيل الخسائر Excel' : 'Export Loss Details Excel'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: General Exporters (Legacy Panels) */}
      {activeTab === 'exports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
          
          {/* Active Clients Report */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#3B82F6' }}>{locale === 'ar' ? 'تقرير العملاء (النشطين)' : 'Active Clients Report'}</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الفترة الزمنية (تاريخ الإضافة)' : 'Time Period (Date Added)'}</label>
                  <select value={clientDateRange} onChange={e => setClientDateRange(e.target.value)} style={inputStyle}>
                    <option value="ALL">{locale === 'ar' ? 'الكل' : 'All'}</option>
                    <option value="1_MONTH">{locale === 'ar' ? 'آخر شهر' : 'Last Month'}</option>
                    <option value="6_MONTHS">{locale === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}</option>
                    <option value="1_YEAR">{locale === 'ar' ? 'آخر سنة' : 'Last Year'}</option>
                    <option value="CUSTOM">{locale === 'ar' ? 'مخصص (اختيار تواريخ)' : 'Custom (Select Dates)'}</option>
                  </select>
                </div>
                {clientDateRange === 'CUSTOM' && (
                  <>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'من تاريخ' : 'From Date'}</label>
                      <input type="date" value={clientStartDate} onChange={e => setClientStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
                      <input type="date" value={clientEndDate} onChange={e => setClientEndDate(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
              </div>
            </div>
            <button onClick={exportActiveClients} className="btn-primary" style={{ padding: '0.8rem 2rem', width: 'fit-content' }}>
              {locale === 'ar' ? 'استخراج تقرير العملاء (Excel)' : 'Export Clients Report (Excel)'}
            </button>
          </div>

          {/* Leads Report */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#F59E0B' }}>{locale === 'ar' ? 'تقرير العملاء المحتملين' : 'Leads Report'}</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الفترة الزمنية (تاريخ الإضافة)' : 'Time Period (Date Added)'}</label>
                  <select value={leadDateRange} onChange={e => setLeadDateRange(e.target.value)} style={inputStyle}>
                    <option value="ALL">{locale === 'ar' ? 'الكل' : 'All'}</option>
                    <option value="1_MONTH">{locale === 'ar' ? 'آخر شهر' : 'Last Month'}</option>
                    <option value="6_MONTHS">{locale === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}</option>
                    <option value="1_YEAR">{locale === 'ar' ? 'آخر سنة' : 'Last Year'}</option>
                    <option value="CUSTOM">{locale === 'ar' ? 'مخصص (اختيار تواريخ)' : 'Custom (Select Dates)'}</option>
                  </select>
                </div>
                {leadDateRange === 'CUSTOM' && (
                  <>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'من تاريخ' : 'From Date'}</label>
                      <input type="date" value={leadStartDate} onChange={e => setLeadStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
                      <input type="date" value={leadEndDate} onChange={e => setLeadEndDate(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
              </div>
            </div>
            <button onClick={exportLeads} className="btn-primary" style={{ padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #F59E0B, #D97706)', width: 'fit-content' }}>
              {locale === 'ar' ? 'استخراج العملاء المحتملين (Excel)' : 'Export Leads (Excel)'}
            </button>
          </div>

          {/* Policies Report */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#10B981' }}>{locale === 'ar' ? 'تقرير كافة الوثائق' : 'All Policies Report'}</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الفترة الزمنية (تاريخ الإضافة)' : 'Time Period (Date Added)'}</label>
                  <select value={policyDateRange} onChange={e => setPolicyDateRange(e.target.value)} style={inputStyle}>
                    <option value="ALL">{locale === 'ar' ? 'الكل' : 'All'}</option>
                    <option value="1_MONTH">{locale === 'ar' ? 'آخر شهر' : 'Last Month'}</option>
                    <option value="6_MONTHS">{locale === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}</option>
                    <option value="1_YEAR">{locale === 'ar' ? 'آخر سنة' : 'Last Year'}</option>
                    <option value="CUSTOM">{locale === 'ar' ? 'مخصص (اختيار تواريخ)' : 'Custom (Select Dates)'}</option>
                  </select>
                </div>
                {policyDateRange === 'CUSTOM' && (
                  <>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'من تاريخ' : 'From Date'}</label>
                      <input type="date" value={policyStartDate} onChange={e => setPolicyStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
                      <input type="date" value={policyEndDate} onChange={e => setPolicyEndDate(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'حالة الوثيقة' : 'Policy Status'}</label>
                  <select value={policyStatus} onChange={e => setPolicyStatus(e.target.value)} style={inputStyle}>
                    <option value="ALL">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                    <option value="ACTIVE">{locale === 'ar' ? 'فعالة' : 'Active'}</option>
                    <option value="PENDING">{locale === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                    <option value="SUSPENDED">{locale === 'ar' ? 'معلقة' : 'Suspended'}</option>
                    <option value="CANCELLED">{locale === 'ar' ? 'ملغاة' : 'Cancelled'}</option>
                    <option value="EXPIRED">{locale === 'ar' ? 'منتهية' : 'Expired'}</option>
                    <option value="NEAREXPIRY">{locale === 'ar' ? 'شارفت على الانتهاء (خلال 30 يوم)' : 'Expiring Soon (Within 30 Days)'}</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={exportPolicies} className="btn-primary" style={{ padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #10B981, #059669)', width: 'fit-content' }}>
              {locale === 'ar' ? 'استخراج تقرير الوثائق (Excel)' : 'Export Policies Report (Excel)'}
            </button>
          </div>

          {/* Claims Report */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#8B5CF6' }}>{locale === 'ar' ? 'تقرير كافة المطالبات' : 'All Claims Report'}</h2>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الفترة الزمنية (تاريخ التقديم)' : 'Time Period (Date Filed)'}</label>
                  <select value={claimDateRange} onChange={e => setClaimDateRange(e.target.value)} style={inputStyle}>
                    <option value="ALL">{locale === 'ar' ? 'الكل' : 'All'}</option>
                    <option value="1_MONTH">{locale === 'ar' ? 'آخر شهر' : 'Last Month'}</option>
                    <option value="6_MONTHS">{locale === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months'}</option>
                    <option value="1_YEAR">{locale === 'ar' ? 'آخر سنة' : 'Last Year'}</option>
                    <option value="CUSTOM">{locale === 'ar' ? 'مخصص (اختيار تواريخ)' : 'Custom (Select Dates)'}</option>
                  </select>
                </div>
                {claimDateRange === 'CUSTOM' && (
                  <>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'من تاريخ' : 'From Date'}</label>
                      <input type="date" value={claimStartDate} onChange={e => setClaimStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'إلى تاريخ' : 'To Date'}</label>
                      <input type="date" value={claimEndDate} onChange={e => setClaimEndDate(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'حالة المطالبة' : 'Claim Status'}</label>
                  <select value={claimStatus} onChange={e => setClaimStatus(e.target.value)} style={inputStyle}>
                    <option value="ALL">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                    <option value="PENDING">{locale === 'ar' ? 'قيد المراجعة' : 'Pending'}</option>
                    <option value="UNDER_REVIEW">{locale === 'ar' ? 'تحت الإجراء' : 'Under Review'}</option>
                    <option value="APPROVED">{locale === 'ar' ? 'مقبولة' : 'Approved'}</option>
                    <option value="REJECTED">{locale === 'ar' ? 'مرفوضة' : 'Rejected'}</option>
                    <option value="CLOSED">{locale === 'ar' ? 'مغلقة' : 'Closed'}</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={exportClaims} className="btn-primary" style={{ padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', width: 'fit-content' }}>
              {locale === 'ar' ? 'استخراج تقرير المطالبات (Excel)' : 'Export Claims Report (Excel)'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
