"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import ElectricalServicesOutlinedIcon from '@mui/icons-material/ElectricalServicesOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import LocalTaxiOutlinedIcon from '@mui/icons-material/LocalTaxiOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import { useCurrency } from '../components/CurrencyContext';

interface ExpenseRecord {
  id: number;
  title: string;
  expense_type: 'RENT' | 'UTILITIES' | 'MAINTENANCE' | 'TRANSPORT' | 'SUPPLIES' | 'OTHER';
  amount: string;
  expense_date: string;
  paid_to: string;
  status: 'PENDING' | 'PAID';
  notes: string;
}

const API = 'http://127.0.0.1:8000/api/crm/expenses/';

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

const typeLabels: Record<string, string> = {
  RENT: 'إيجارات المكاتب والفروع',
  UTILITIES: 'الكهرباء والمياه والإنترنت',
  MAINTENANCE: 'صيانة الأجهزة والمعدات',
  TRANSPORT: 'النقل والوقود والمواصلات',
  SUPPLIES: 'مستلزمات ومطبوعات العمل',
  OTHER: 'مصاريف تشغيلية أخرى'
};

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  PAID: 'تم السداد'
};

const translateExpenseType = (type: string, locale: string) => {
  const types: Record<string, { ar: string; en: string }> = {
    RENT: { ar: 'إيجارات المكاتب والفروع', en: 'Office & Branch Rent' },
    UTILITIES: { ar: 'الكهرباء والمياه والإنترنت', en: 'Electricity, Water & Internet' },
    MAINTENANCE: { ar: 'صيانة الأجهزة والمعدات', en: 'Equipment & Device Maintenance' },
    TRANSPORT: { ar: 'النقل والوقود والمواصلات', en: 'Transport, Fuel & Commuting' },
    SUPPLIES: { ar: 'مستلزمات ومطبوعات العمل', en: 'Work Supplies & Printing' },
    OTHER: { ar: 'مصاريف تشغيلية أخرى', en: 'Other Operational Expenses' }
  };
  return types[type] ? (locale === 'ar' ? types[type].ar : types[type].en) : type;
};

const translateExpenseStatus = (status: string, locale: string) => {
  const statuses: Record<string, { ar: string; en: string }> = {
    PENDING: { ar: 'قيد الانتظار', en: 'Pending' },
    PAID: { ar: 'تم السداد', en: 'Paid' }
  };
  return statuses[status] ? (locale === 'ar' ? statuses[status].ar : statuses[status].en) : status;
};

const cardBorder = (color: string) => `3px solid ${color}`;

export default function ExpensesPage() {
  const { locale } = useLanguage();
  const { formatAmount } = useCurrency();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const blankForm = {
    title: '',
    expense_type: 'RENT' as 'RENT' | 'UTILITIES' | 'MAINTENANCE' | 'TRANSPORT' | 'SUPPLIES' | 'OTHER',
    amount: '',
    expense_date: new Date().toISOString().substring(0, 10),
    paid_to: '',
    status: 'PAID' as 'PENDING' | 'PAID',
    notes: ''
  };

  const [form, setForm] = useState(blankForm);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm(blankForm);
        fetchRecords();
        alert(isEditMode 
          ? (locale === 'ar' ? 'تم تعديل سند الصرف بنجاح' : 'Expense voucher updated successfully') 
          : (locale === 'ar' ? 'تم تسجيل المصروف التشغيلي بنجاح' : 'Operational expense registered successfully')
        );
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء حفظ المستند، يرجى التحقق من المدخلات' : 'An error occurred while saving the document, please check inputs');
      }
    } catch (err) {
      alert(locale === 'ar' ? 'فشل الاتصال بخادم قاعدة البيانات' : 'Failed to connect to the database server');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف سند الصرف هذا بشكل نهائي؟' : 'Are you sure you want to permanently delete this expense voucher?')) return;
    try {
      const res = await fetch(`${API}${id}/`, { method: 'DELETE' });
      if (res.ok) {
        fetchRecords();
        alert(locale === 'ar' ? 'تم حذف مستند الصرف بنجاح' : 'Expense document deleted successfully');
      } else {
        alert(locale === 'ar' ? 'فشل حذف مستند الصرف' : 'Failed to delete expense document');
      }
    } catch (err) {
      alert(locale === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
    }
  };

  const handleMarkAsPaid = async (record: ExpenseRecord) => {
    if (!confirm(locale === 'ar' 
      ? `هل تريد تأكيد سداد قيمة "${record.title}" البالغة ${formatAmount(parseFloat(record.amount))}؟`
      : `Are you sure you want to confirm payment for "${record.title}" of amount ${formatAmount(parseFloat(record.amount))}?`
    )) return;
    try {
      const res = await fetch(`${API}${record.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' })
      });
      if (res.ok) {
        fetchRecords();
        alert(locale === 'ar' ? 'تم تأكيد سداد السند بنجاح وتحويل حالته المالية' : 'Voucher payment confirmed successfully and status updated');
      } else {
        alert(locale === 'ar' ? 'فشل تحديث حالة السند المالي' : 'Failed to update financial voucher status');
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

  const openEditModal = (record: ExpenseRecord) => {
    setIsEditMode(true);
    setSelectedId(record.id);
    setForm({
      title: record.title,
      expense_type: record.expense_type,
      amount: record.amount,
      expense_date: record.expense_date,
      paid_to: record.paid_to || '',
      status: record.status,
      notes: record.notes || ''
    });
    setIsModalOpen(true);
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                        (r.paid_to && r.paid_to.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === 'ALL' || r.expense_type === filterType;
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // Aggregates
  const totalExpenses = filteredRecords.reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);
  const totalRent = filteredRecords.filter(r => r.expense_type === 'RENT').reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);
  const totalUtilities = filteredRecords.filter(r => r.expense_type === 'UTILITIES').reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);
  const totalMaintenance = filteredRecords.filter(r => r.expense_type === 'MAINTENANCE').reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);
  const totalTransportSupplies = filteredRecords.filter(r => r.expense_type === 'TRANSPORT' || r.expense_type === 'SUPPLIES' || r.expense_type === 'OTHER').reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);

  const exportToExcel = () => {
    const rows = filteredRecords.map(r => ({
      [locale === 'ar' ? 'عنوان المصروف' : 'Expense Title']: r.title,
      [locale === 'ar' ? 'نوع المصروف' : 'Expense Type']: translateExpenseType(r.expense_type, locale),
      [locale === 'ar' ? 'القيمة' : 'Amount']: parseFloat(r.amount),
      [locale === 'ar' ? 'تاريخ الدفع/الاستحقاق' : 'Payment/Due Date']: r.expense_date,
      [locale === 'ar' ? 'الجهة المستلمة (المدفوع له)' : 'Recipient (Paid To)']: r.paid_to || '—',
      [locale === 'ar' ? 'حالة السداد' : 'Payment Status']: translateExpenseStatus(r.status, locale),
      [locale === 'ar' ? 'ملاحظات وتفاصيل' : 'Notes & Details']: r.notes || ''
    }));

    import('xlsx').then(XLSX => {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, locale === 'ar' ? 'المصاريف التشغيلية' : 'Operational Expenses');
      XLSX.writeFile(workbook, locale === 'ar' ? 'Operational_Expenses_Report.xlsx' : 'Operational_Expenses_Report_en.xlsx');
    }).catch(() => {
      alert(locale === 'ar' ? 'خطأ في تصدير البيانات إلى Excel' : 'Error exporting data to Excel');
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>
          {locale === 'ar' ? 'جاري تحميل سندات ومستندات الصرف التشغيلي...' : 'Loading operational expense vouchers and documents...'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ direction: locale === 'ar' ? 'rtl' : 'ltr', padding: '2rem' }}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>
          {locale === 'ar' ? 'إدارة المصاريف التشغيلية (Expenses)' : 'Operational Expenses Management (Expenses)'}
        </h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {locale === 'ar' ? 'لوحة التحكم / المصاريف التشغيلية' : 'Dashboard / Corporate Expenses'}
        </span>
      </div>

      {/* Control & Search Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{locale === 'ar' ? 'أدوات التصفية والبحث' : 'Filtering and Search Tools'}</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
              <AddCircleOutlineOutlinedIcon style={{ fontSize: '1.2rem' }} />
              {locale === 'ar' ? 'تسجيل مصروف تشغيلي' : 'Record Operational Expense'}
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
              {locale === 'ar' ? 'تصدير الكشف (Excel)' : 'Export Statement (Excel)'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder={locale === 'ar' ? 'بحث في عنوان المصروف أو الجهة المدفوع لها...' : 'Search expense title or payee...'} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={inp} 
          />
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)} 
            style={inp}
          >
            <option value="ALL">{locale === 'ar' ? 'جميع أنواع المصاريف' : 'All Expense Types'}</option>
            {Object.entries(typeLabels).map(([k, v]) => (
              <option key={k} value={k}>{translateExpenseType(k, locale)}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            style={inp}
          >
            <option value="ALL">{locale === 'ar' ? 'جميع الحالات المالية' : 'All Financial Statuses'}</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{translateExpenseStatus(k, locale)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { l: locale === 'ar' ? 'إجمالي المصاريف التشغيلية' : 'Total Operational Expenses', v: formatAmount(totalExpenses), c: '#EF4444', icon: ReceiptLongOutlinedIcon },
          { l: locale === 'ar' ? 'إيجارات المكاتب والفروع' : 'Office & Branch Rent', v: formatAmount(totalRent), c: '#3B82F6', icon: HomeWorkOutlinedIcon },
          { l: locale === 'ar' ? 'فواتير المياه والكهرباء والنت' : 'Water, Electricity & Internet Bills', v: formatAmount(totalUtilities), c: '#F59E0B', icon: ElectricalServicesOutlinedIcon },
          { l: locale === 'ar' ? 'صيانة الأجهزة والمعدات' : 'Equipment & Device Maintenance', v: formatAmount(totalMaintenance), c: '#10B981', icon: ConstructionOutlinedIcon },
          { l: locale === 'ar' ? 'المواصلات والمستلزمات المكتبية' : 'Transport & Office Supplies', v: formatAmount(totalTransportSupplies), c: '#8B5CF6', icon: DrawOutlinedIcon }
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

      {/* Expenses Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.2rem', color: 'var(--text-main)' }}>{locale === 'ar' ? 'مسير كشوفات وسجلات الصرف التشغيلي' : 'Operational Expenses Statements and Records'}</h2>
        {filteredRecords.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {locale === 'ar' ? 'لا توجد سجلات مصاريف مطابقة للتصفية الحالية.' : 'No expense records match the current filter.'}
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'عنوان السند' : 'Voucher Title'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'النوع والتصنيف' : 'Type & Category'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'القيمة المالية' : 'Financial Value'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'تاريخ السند' : 'Voucher Date'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'الجهة المستلمة' : 'Recipient'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>{locale === 'ar' ? 'العمليات الإجرائية' : 'Procedural Operations'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => (
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
                    {r.title}
                    {r.notes && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '0.25rem' }}>
                        📝 {r.notes}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{translateExpenseType(r.expense_type, locale)}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: '#EF4444' }}>{formatAmount(parseFloat(r.amount))}</td>
                  <td style={{ padding: '1rem' }}>📅 {r.expense_date}</td>
                  <td style={{ padding: '1rem' }}>{r.paid_to || '—'}</td>
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
                      {translateExpenseStatus(r.status, locale)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {r.status === 'PENDING' && (
                      <button 
                        onClick={() => handleMarkAsPaid(r)}
                        title={locale === 'ar' ? 'تأكيد سداد السند' : 'Confirm Voucher Payment'} 
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid #10B981', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <CheckCircleOutlineOutlinedIcon style={{ fontSize: '1.1rem' }} />
                      </button>
                    )}
                    <button 
                      onClick={() => openEditModal(r)}
                      title={locale === 'ar' ? 'تعديل السند' : 'Edit Voucher'} 
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid #F59E0B', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <EditOutlinedIcon style={{ fontSize: '1.1rem' }} />
                    </button>
                    <button 
                      onClick={() => handleDelete(r.id)}
                      title={locale === 'ar' ? 'حذف السند' : 'Delete Voucher'} 
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid #EF4444', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <DeleteOutlineOutlinedIcon style={{ fontSize: '1.1rem' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>
                {isEditMode 
                  ? (locale === 'ar' ? 'تعديل سند الصرف التشغيلي' : 'Edit Operational Expense Voucher') 
                  : (locale === 'ar' ? 'سند صرف مصروف تشغيلي جديد' : 'New Operational Expense Voucher')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  {locale === 'ar' ? 'عنوان المصروف / البيان *' : 'Expense Title / Description *'}
                </label>
                <input 
                  type="text" 
                  name="title" 
                  value={form.title} 
                  onChange={handleInputChange} 
                  required 
                  placeholder={locale === 'ar' ? 'مثال: فاتورة مياه وكهرباء الفرع الرئيسي...' : 'e.g., Main Branch water and electricity bill...'} 
                  style={inp}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    {locale === 'ar' ? 'نوع وتصنيف المصروف *' : 'Expense Type & Category *'}
                  </label>
                  <select 
                    name="expense_type" 
                    value={form.expense_type} 
                    onChange={handleInputChange} 
                    style={inp}
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{translateExpenseType(k, locale)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    {locale === 'ar' ? 'تاريخ الصرف/الاستحقاق *' : 'Payment/Due Date *'}
                  </label>
                  <input 
                    type="date" 
                    name="expense_date" 
                    value={form.expense_date} 
                    onChange={handleInputChange} 
                    required 
                    style={inp}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    {locale === 'ar' ? 'المبلغ المالي *' : 'Amount *'}
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="amount" 
                    value={form.amount} 
                    onChange={handleInputChange} 
                    required 
                    placeholder={locale === 'ar' ? 'مثال: 500' : 'e.g., 500'} 
                    style={inp}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    {locale === 'ar' ? 'الجهة المستلمة (المدفوع له)' : 'Recipient (Paid To)'}
                  </label>
                  <input 
                    type="text" 
                    name="paid_to" 
                    value={form.paid_to} 
                    onChange={handleInputChange} 
                    placeholder={locale === 'ar' ? 'مثال: مصلحة المياه والكهرباء...' : 'e.g., Water & Electricity Company...'} 
                    style={inp}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  {locale === 'ar' ? 'حالة السداد المالية' : 'Financial Payment Status'}
                </label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleInputChange} 
                  style={inp}
                >
                  <option value="PAID">{locale === 'ar' ? 'تم الدفع (سند مدفوع)' : 'Paid (Paid Voucher)'}</option>
                  <option value="PENDING">{locale === 'ar' ? 'قيد الانتظار (سند مستحق)' : 'Pending (Due Voucher)'}</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  {locale === 'ar' ? 'ملاحظات وتفاصيل إضافية' : 'Additional Notes & Details'}
                </label>
                <textarea 
                  name="notes" 
                  value={form.notes} 
                  onChange={handleInputChange} 
                  placeholder={locale === 'ar' ? 'أدخل أي ملاحظات إجرائية حول السداد...' : 'Enter payment notes...'} 
                  style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>
                  {isEditMode 
                    ? (locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes') 
                    : (locale === 'ar' ? 'تسجيل السند المالي' : 'Register Financial Voucher')}
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
