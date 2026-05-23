"use client";
import { useLanguage } from '../components/LanguageContext';

import { useEffect, useState, useMemo } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useCurrency } from '../components/CurrencyContext';

interface PayrollRecord {
  id: number;
  employee_name: string;
  employee: number | null;
  employee_details: { id: number; full_name: string; basic_salary: string; department: number | null; department_name: string; } | null;
  basic_salary: string;
  bonuses: string;
  overtime: string;
  social_security: string;
  end_of_service: string;
  month: string;
  payout_date: string | null;
  status: 'PENDING' | 'PAID';
  notes: string;
}

interface Employee {
  id: number;
  full_name: string;
  basic_salary: string;
  department_name: string;
}

interface Department {
  id: number;
  name: string;
}

const API = 'http://127.0.0.1:8000/api/crm/payrolls/';
const EMP_API = 'http://127.0.0.1:8000/api/crm/employees/';
const DEPT_API = 'http://127.0.0.1:8000/api/crm/departments/';

const inp: React.CSSProperties = { 
  padding: '0.75rem 1rem', 
  borderRadius: '8px', 
  border: '1px solid var(--border)', 
  background: 'var(--background)', 
  color: 'var(--text-main)', 
  outline: 'none', 
  width: '100%', 
  fontFamily: 'inherit', 
  fontSize: '0.95rem',
  transition: 'border 0.2s ease'
};

const cardBorder = (color: string) => `3px solid ${color}`;

const translateDepartment = (name: string, locale: string) => {
  if (!name) return '';
  if (locale === 'ar') return name;
  const depts: Record<string, string> = {
    'المبيعات': 'Sales',
    'مبيعات': 'Sales',
    'الموارد البشرية': 'HR & Personnel',
    'الموارد البشريه': 'HR & Personnel',
    'المالية': 'Finance',
    'الماليه': 'Finance',
    'التسويق': 'Marketing',
    'تكنولوجيا المعلومات': 'IT',
    'الإدارة': 'Administration',
    'الادارة': 'Administration',
    'الاداره': 'Administration',
    'خدمة العملاء': 'Customer Service',
    'خدمه العملاء': 'Customer Service',
    'الدعم الفني': 'Technical Support',
    'العمليات': 'Operations',
    'القانونية': 'Legal',
    'القانونيه': 'Legal',
    'قسم الحسابات': 'Accounts Department',
    'قسم ادارة الجودة': 'Quality Management Department',
    'قسم إدارة الجودة': 'Quality Management Department',
    'قسم ادارة المشتريات': 'Purchasing Department',
    'قسم إدارة المشتريات': 'Purchasing Department',
  };
  return depts[name.trim()] || name;
};

export default function PayrollPage() {
  const { locale } = useLanguage();
  const { formatAmount } = useCurrency();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const blankForm = {
    employee: '',
    employee_name: '',
    basic_salary: '',
    bonuses: '0',
    overtime: '0',
    social_security: '0',
    end_of_service: '0',
    month: new Date().toISOString().substring(0, 7),
    status: 'PENDING' as 'PENDING' | 'PAID',
    notes: ''
  };

  const [form, setForm] = useState(blankForm);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [pRes, eRes, dRes] = await Promise.all([
        fetch(API), fetch(EMP_API), fetch(DEPT_API)
      ]);
      if (pRes.ok) setRecords(await pRes.json());
      if (eRes.ok) setEmployees(await eRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `${API}${selectedId}/` : API;
    
    // Auto-calculate end-of-service provision (standard: 8.33% monthly which is 1/12th of basic salary)
    const basicNum = parseFloat(form.basic_salary) || 0;
    const computedEOS = form.end_of_service === '0' || form.end_of_service === '' 
      ? (basicNum * 0.0833).toFixed(2) 
      : form.end_of_service;

    const payload = {
      ...form,
      end_of_service: computedEOS
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm(blankForm);
        fetchRecords();
        alert(isEditMode ? locale === 'ar' ? 'تم تعديل سجل الرواتب بنجاح' : 'Payroll record updated successfully' : locale === 'ar' ? 'تم إضافة سجل الرواتب بنجاح' : 'Payroll record added successfully');
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء حفظ السجل، يرجى التأكد من البيانات المدخلة' : 'Error saving record, please check entered data');
      }
    } catch (err) {
      alert(locale === 'ar' ? 'فشل الاتصال بالخادم' : 'Failed to connect to server');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا السجل المالي بشكل نهائي؟' : 'Are you sure you want to permanently delete this payroll record?')) return;
    try {
      const res = await fetch(`${API}${id}/`, { method: 'DELETE' });
      if (res.ok) {
        fetchRecords();
        alert(locale === 'ar' ? 'تم حذف سجل الرواتب بنجاح' : 'Payroll record deleted successfully');
      } else {
        alert(locale === 'ar' ? 'فشل حذف السجل' : 'Failed to delete record');
      }
    } catch (err) {
      alert(locale === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    }
  };

  const handleMarkAsPaid = async (record: PayrollRecord) => {
    if (!confirm(locale === 'ar' ? `هل تريد تأكيد صرف راتب الموظف ${record.employee_name} لشهر ${record.month}؟` : `Are you sure you want to confirm the payment of employee ${record.employee_name} for the month of ${record.month}?`)) return;
    try {
      const res = await fetch(`${API}${record.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          payout_date: new Date().toISOString().substring(0, 10)
        })
      });
      if (res.ok) {
        fetchRecords();
        alert(locale === 'ar' ? 'تم تأكيد صرف الراتب بنجاح وتسجيل تاريخ الصرف اللحظي' : 'Salary payment confirmed successfully and instantaneous payment date recorded');
      } else {
        alert(locale === 'ar' ? 'فشل تحديث حالة الصرف' : 'Failed to update payment status');
      }
    } catch (err) {
      alert(locale === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setForm(blankForm);
    setIsModalOpen(true);
  };

  const openEditModal = (record: PayrollRecord) => {
    setIsEditMode(true);
    setSelectedId(record.id);
    setForm({
      employee: record.employee?.toString() || '',
      employee_name: record.employee_name || (record.employee_details?.full_name || ''),
      basic_salary: record.basic_salary,
      bonuses: record.bonuses,
      overtime: record.overtime,
      social_security: record.social_security,
      end_of_service: record.end_of_service,
      month: record.month,
      status: record.status,
      notes: record.notes || ''
    });
    setIsModalOpen(true);
  };

  const months = ['ALL', ...Array.from(new Set(records.map(r => r.month))).sort().reverse()];

  const filteredRecords = records.filter(r => {
    const matchMonth = selectedMonth === 'ALL' || r.month === selectedMonth;
    const empDept = r.employee_details?.department?.toString();
    const matchDept = filterDept === 'ALL' || empDept === filterDept;
    return matchMonth && matchDept;
  });

  // Per-department salary breakdown
  const deptStats = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => {
      const dbName = r.employee_details?.department_name;
      const dName = dbName ? translateDepartment(dbName, locale) : (locale === 'ar' ? 'غير محدد' : 'Not Specified');
      const net = parseFloat(r.basic_salary || '0') + parseFloat(r.bonuses || '0') + parseFloat(r.overtime || '0') - parseFloat(r.social_security || '0');
      map[dName] = (map[dName] || 0) + net;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [records, locale]);

  // Financial aggregates
  const totalBasic = filteredRecords.reduce((acc, r) => acc + parseFloat(r.basic_salary || '0'), 0);
  const totalBonuses = filteredRecords.reduce((acc, r) => acc + parseFloat(r.bonuses || '0'), 0);
  const totalOvertime = filteredRecords.reduce((acc, r) => acc + parseFloat(r.overtime || '0'), 0);
  const totalSocialSec = filteredRecords.reduce((acc, r) => acc + parseFloat(r.social_security || '0'), 0);
  const totalEOS = filteredRecords.reduce((acc, r) => acc + parseFloat(r.end_of_service || '0'), 0);
  
  // Net salary payout sum
  const totalNet = totalBasic + totalBonuses + totalOvertime - totalSocialSec;

  const exportToExcel = () => {
    const rows = filteredRecords.map(r => {
      const basic = parseFloat(r.basic_salary);
      const bonus = parseFloat(r.bonuses);
      const ot = parseFloat(r.overtime);
      const ss = parseFloat(r.social_security);
      const net = basic + bonus + ot - ss;
      return {
        [locale === 'ar' ? 'اسم الموظف' : 'Employee Name']: r.employee_name,
        [locale === 'ar' ? 'القسم' : 'Department']: r.employee_details?.department_name ? translateDepartment(r.employee_details.department_name, locale) : (locale === 'ar' ? 'غير محدد' : 'Not Specified'),
        [locale === 'ar' ? 'الشهر' : 'Month']: r.month,
        [locale === 'ar' ? 'الراتب الأساسي' : 'Basic Salary']: basic,
        [locale === 'ar' ? 'الحوافز والبونص' : 'Incentives & Bonus']: bonus,
        [locale === 'ar' ? 'العمل الإضافي' : 'Overtime']: ot,
        [locale === 'ar' ? 'التأمينات الاجتماعية (خصم)' : 'Social Security (Deduction)']: ss,
        [locale === 'ar' ? 'صافي الراتب' : 'Net Salary']: net,
        [locale === 'ar' ? 'مخصصات نهاية الخدمة' : 'End of Service Benefits']: parseFloat(r.end_of_service),
        [locale === 'ar' ? 'الحالة' : 'Status']: r.status === 'PAID' ? (locale === 'ar' ? 'تم الصرف' : 'Paid') : (locale === 'ar' ? 'قيد الانتظار' : 'Pending'),
        [locale === 'ar' ? 'تاريخ الصرف' : 'Payout Date']: r.payout_date || '—',
        [locale === 'ar' ? 'ملاحظات' : 'Notes']: r.notes || ''
      };
    });

    import('xlsx').then(XLSX => {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, locale === 'ar' ? 'مسير الرواتب والأجور' : 'Payroll Sheet');
      XLSX.writeFile(workbook, `Payroll_Report_${selectedMonth === 'ALL' ? 'All_Time' : selectedMonth}.xlsx`);
    }).catch(() => {
      alert(locale === 'ar' ? 'خطأ في تصدير البيانات إلى Excel' : 'Error exporting data to Excel');
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'جاري تحميل مسير الرواتب والمستحقات الماليّة...' : 'Loading payroll and financial dues...'}</p>
      </div>
    );
  }

  return (
    <div style={{ direction: locale === 'ar' ? 'rtl' : 'ltr', padding: '2rem' }}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{locale === 'ar' ? 'إدارة مسير الرواتب والمستحقات الماليّة (Payroll)' : 'Payroll & Financial Dues Management'}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'لوحة التحكم / الموارد البشرية والرواتب' : 'Dashboard / HR & Payroll'}</span>
      </div>

      {/* Dynamic Month filter & Actions bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{locale === 'ar' ? 'الشهر:' : 'Month:'}</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...inp, width: 'auto' }}>
              {months.map(m => <option key={m} value={m}>{m === 'ALL' ? (locale === 'ar' ? 'الكل' : 'All') : m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{locale === 'ar' ? 'القسم:' : 'Department:'}</label>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ ...inp, width: 'auto' }}>
              <option value="ALL">{locale === 'ar' ? 'كل الأقسام' : 'All Departments'}</option>
              {departments.map(d => <option key={d.id} value={d.id.toString()}>{translateDepartment(d.name, locale)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
            <AddCircleOutlineOutlinedIcon style={{ fontSize: '1.2rem' }} />
            {locale === 'ar' ? 'إضافة سجل مالي' : 'Add Payroll Record'}
          </button>
          <button 
            onClick={exportToExcel} 
            style={{ 
              backgroundColor: 'rgba(16,185,129,0.15)', 
              color: '#10B981', 
              border: '1px solid #10B981', 
              borderRadius: '8px', 
              padding: '0.6rem 1.2rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            <DescriptionOutlinedIcon style={{ fontSize: '1.2rem' }} />
            {locale === 'ar' ? 'تصدير كشف الرواتب (Excel)' : 'Export Payroll (Excel)'}
          </button>
        </div>
      </div>

      {/* Aggregate financial KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { l: locale === 'ar' ? 'إجمالي صافي الرواتب المصروفة' : 'Total Net Paid Salaries', v: formatAmount(totalNet), c: '#10B981', icon: LocalAtmOutlinedIcon },
          { l: locale === 'ar' ? 'إجمالي الحوافز والبونص' : 'Total Incentives & Bonuses', v: formatAmount(totalBonuses), c: '#3B82F6', icon: StarOutlineOutlinedIcon },
          { l: locale === 'ar' ? 'إجمالي العمل الإضافي' : 'Total Overtime Dues', v: formatAmount(totalOvertime), c: '#F59E0B', icon: TimerOutlinedIcon },
          { l: locale === 'ar' ? 'التأمينات الاجتماعية المستقطعة' : 'Deducted Social Security', v: formatAmount(totalSocialSec), c: '#EF4444', icon: SecurityOutlinedIcon },
          { l: locale === 'ar' ? 'مخصصات نهاية الخدمة (EOS)' : 'End of Service Provisions (EOS)', v: formatAmount(totalEOS), c: '#8B5CF6', icon: SavingsOutlinedIcon }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="glass-panel" 
              style={{ 
                padding: '1.5rem', 
                borderRight: cardBorder(kpi.c), 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                transition: 'transform 0.2s ease'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${kpi.c}15`, color: kpi.c }}>
                <Icon style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0.2rem 0' }}>{kpi.v}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{kpi.l}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dept Stats */}
      {deptStats.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 'bold' }}>{locale === 'ar' ? 'إجمالي الرواتب بحسب القسم' : 'Total Salaries by Department'}</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {deptStats.map(([dName, total], i) => {
              const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
              const color = colors[i % colors.length];
              return (
                <div key={dName} style={{ padding: '0.75rem 1.25rem', borderRadius: 10, background: `${color}10`, border: `1px solid ${color}30`, display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 160 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{dName}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color }}>{formatAmount(total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.2rem', color: 'var(--text-main)' }}>{locale === 'ar' ? 'سجلات وكشوفات الرواتب والأجور' : 'Payroll & Wages Records'}</h2>
        {filteredRecords.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'لا توجد سجلات رواتب مدخلة لهذا الشهر.' : 'No payroll records entered for this month.'}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'اسم الموظف' : 'Employee Name'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'الحوافز والبونص' : 'Incentives & Bonus'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'العمل الإضافي' : 'Overtime'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'التأمينات (خصم)' : 'Social Security (Ded.)'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'صافي الراتب' : 'Net Salary'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'مخصصات نهاية الخدمة' : 'End of Service Benefits'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'حالة الصرف' : 'Payment Status'}</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>{locale === 'ar' ? 'العمليات الإجرائية' : 'Procedural Operations'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => {
                const basic = parseFloat(r.basic_salary || '0');
                const bonus = parseFloat(r.bonuses || '0');
                const ot = parseFloat(r.overtime || '0');
                const ss = parseFloat(r.social_security || '0');
                const net = basic + bonus + ot - ss;
                
                return (
                  <tr 
                    key={r.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border)', 
                      fontSize: '0.92rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0 }}>
                          {(r.employee_details?.full_name || r.employee_name || '?').charAt(0)}
                        </div>
                        <div>
                          <div>{r.employee_details?.full_name || r.employee_name || '—'}</div>
                          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
                            {r.employee_details?.department_name && (
                              <span style={{ padding: '0.1rem 0.5rem', borderRadius: 999, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: '0.72rem', fontWeight: 'bold' }}>
                                {translateDepartment(r.employee_details.department_name, locale)}
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'شهر' : 'Month'} {r.month} {r.payout_date && `• ${locale === 'ar' ? 'صرف' : 'Paid'} ${r.payout_date}`}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{formatAmount(basic)}</td>
                    <td style={{ padding: '1rem', color: bonus > 0 ? '#10B981' : 'inherit' }}>{bonus > 0 ? `+ ${formatAmount(bonus)}` : '—'}</td>
                    <td style={{ padding: '1rem', color: ot > 0 ? '#3B82F6' : 'inherit' }}>{ot > 0 ? `+ ${formatAmount(ot)}` : '—'}</td>
                    <td style={{ padding: '1rem', color: ss > 0 ? '#EF4444' : 'inherit' }}>{ss > 0 ? `- ${formatAmount(ss)}` : '—'}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{formatAmount(net)}</td>
                    <td style={{ padding: '1rem', color: '#8B5CF6' }}>{formatAmount(r.end_of_service)}</td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        style={{ 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          color: 'white', 
                          backgroundColor: r.status === 'PAID' ? '#10B981' : '#F59E0B'
                        }}
                      >
                        {r.status === 'PAID' ? (locale === 'ar' ? 'تم الصرف' : 'Paid') : (locale === 'ar' ? 'قيد الانتظار' : 'Pending')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {r.status === 'PENDING' && (
                        <button 
                          onClick={() => handleMarkAsPaid(r)}
                          title={locale === 'ar' ? "تأكيد صرف الراتب" : "Confirm Salary Payment"} 
                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid #10B981', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <CheckCircleOutlineOutlinedIcon style={{ fontSize: '1.1rem' }} />
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(r)}
                        title={locale === 'ar' ? "تعديل السجل" : "Edit Record"} 
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid #F59E0B', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <EditOutlinedIcon style={{ fontSize: '1.1rem' }} />
                      </button>
                      <button 
                        onClick={() => handleDelete(r.id)}
                        title={locale === 'ar' ? "حذف السجل" : "Delete Record"} 
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid #EF4444', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <DeleteOutlineOutlinedIcon style={{ fontSize: '1.1rem' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{isEditMode ? (locale === 'ar' ? 'تعديل السجل المالي للموظف' : 'Edit Employee Payroll Record') : (locale === 'ar' ? 'إضافة سجل مالي جديد لموظف' : 'Add New Employee Payroll Record')}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'اختيار الموظف *' : 'Select Employee *'}</label>
                <select
                  value={form.employee}
                  onChange={e => {
                    const empId = e.target.value;
                    const emp = employees.find(em => em.id.toString() === empId);
                    setForm({
                      ...form,
                      employee: empId,
                      employee_name: emp ? emp.full_name : form.employee_name,
                      basic_salary: emp ? emp.basic_salary : form.basic_salary,
                    });
                  }}
                  required
                  style={inp}
                >
                  <option value="">{locale === 'ar' ? 'اختر الموظف من القائمة...' : 'Select employee from the list...'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id.toString()}>
                      {emp.full_name} {emp.department_name ? `(${translateDepartment(emp.department_name, locale)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الراتب الأساسي *' : 'Basic Salary *'}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="basic_salary" 
                    value={form.basic_salary} 
                    onChange={handleInputChange} 
                    required 
                    placeholder={locale === 'ar' ? "مثال: 2500" : "e.g., 2500"} 
                    style={inp}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الشهر المستهدف *' : 'Target Month *'}</label>
                  <input 
                    type="month" 
                    name="month" 
                    value={form.month} 
                    onChange={handleInputChange} 
                    required 
                    style={inp}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الحوافز والبونص' : 'Incentives & Bonus'}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="bonuses" 
                    value={form.bonuses} 
                    onChange={handleInputChange} 
                    placeholder="0" 
                    style={inp}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'العمل الإضافي' : 'Overtime'}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="overtime" 
                    value={form.overtime} 
                    onChange={handleInputChange} 
                    placeholder="0" 
                    style={inp}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'التأمينات الاجتماعية (استقطاع)' : 'Social Security (Deduction)'}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="social_security" 
                    value={form.social_security} 
                    onChange={handleInputChange} 
                    placeholder="0" 
                    style={inp}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'مخصصات نهاية الخدمة (EOS)' : 'End of Service Provision (EOS)'}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="end_of_service" 
                    value={form.end_of_service} 
                    onChange={handleInputChange} 
                    placeholder={locale === 'ar' ? "اتركه فارغاً للحساب التلقائي (8.33%)" : "Leave blank for auto-calculation (8.33%)"} 
                    style={inp}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الحالة الإبتدائية' : 'Initial Status'}</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleInputChange} 
                  style={inp}
                >
                  <option value="PENDING">{locale === 'ar' ? 'قيد الانتظار (حساب مستحق)' : 'Pending (Accrued)'}</option>
                  <option value="PAID">{locale === 'ar' ? 'تم الصرف فوراً' : 'Paid Immediately'}</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'ملاحظات وتفاصيل الدفع' : 'Payment Notes & Details'}</label>
                <textarea 
                  name="notes" 
                  value={form.notes} 
                  onChange={handleInputChange} 
                  placeholder={locale === 'ar' ? 'أدخل أي ملاحظات بخصوص بدلات العمل الإضافي أو البونص...' : 'Enter notes regarding overtime or bonus...'} 
                  style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                  {isEditMode ? (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (locale === 'ar' ? 'إدراج السجل المالي' : 'Insert Payroll Record')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ flex: 1, ...inp, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)' }}
                >
                  {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
