"use client";
import { useLanguage } from '../components/LanguageContext';
import { useEffect, useRef, useState } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { useCurrency } from '../components/CurrencyContext';

const EMP_API = 'http://127.0.0.1:8000/api/crm/employees/';
const DEPT_API = 'http://127.0.0.1:8000/api/crm/departments/';
const MEDIA_BASE = 'http://127.0.0.1:8000';

interface Department { id: number; name: string; }
interface Employee {
  id: number;
  full_name: string;
  national_id: string;
  residence_card: string;
  basic_salary: string;
  department: number | null;
  department_name: string;
  id_image_front: string | null;
  id_image_back: string | null;
  other_documents: string | null;
  created_at: string;
}

const inp: React.CSSProperties = {
  padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)',
  background: 'var(--background)', color: 'var(--text-main)', outline: 'none',
  width: '100%', fontFamily: 'inherit', fontSize: '0.95rem',
};

const BLANK_FORM = {
  full_name: '', national_id: '', residence_card: '',
  basic_salary: '', department: '',
};

export default function EmployeesPage() {
  const { locale } = useLanguage();
  const { formatAmount } = useCurrency();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);

  // File refs
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [eRes, dRes] = await Promise.all([fetch(EMP_API), fetch(DEPT_API)]);
    setEmployees(await eRes.json());
    setDepartments(await dRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setIsEditMode(false); setSelectedId(null);
    setForm({ ...BLANK_FORM });
    setFrontFile(null); setBackFile(null); setDocFile(null);
    setIsModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setIsEditMode(true); setSelectedId(emp.id);
    setForm({
      full_name: emp.full_name, national_id: emp.national_id || '',
      residence_card: emp.residence_card || '',
      basic_salary: emp.basic_salary || '',
      department: emp.department?.toString() || '',
    });
    setFrontFile(null); setBackFile(null); setDocFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (frontFile) fd.append('id_image_front', frontFile);
    if (backFile) fd.append('id_image_back', backFile);
    if (docFile) fd.append('other_documents', docFile);

    const method = isEditMode ? 'PATCH' : 'POST';
    const url = isEditMode ? `${EMP_API}${selectedId}/` : EMP_API;
    const res = await fetch(url, { method, body: fd });
    if (res.ok) {
      setIsModalOpen(false);
      fetchAll();
      alert(isEditMode ? locale === 'ar' ? 'تم تعديل بيانات الموظف بنجاح' : 'Employee data updated successfully' : locale === 'ar' ? 'تم إضافة الموظف بنجاح' : 'Employee added successfully');
    } else {
      const err = await res.json();
      alert('حدث خطأ: ' + JSON.stringify(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) return;
    const res = await fetch(`${EMP_API}${id}/`, { method: 'DELETE' });
    if (res.ok) fetchAll();
    else alert(locale === 'ar' ? 'فشل الحذف' : 'Failed to delete');
  };

  const filtered = employees.filter(emp => {
    const matchSearch = emp.full_name.includes(search) || (emp.national_id || '').includes(search);
    const matchDept = filterDept === 'ALL' || emp.department?.toString() === filterDept;
    return matchSearch && matchDept;
  });

  const totalSalaries = employees.reduce((a, e) => a + parseFloat(e.basic_salary || '0'), 0);

  return (
    <div style={{ direction: 'rtl', padding: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{locale === 'ar' ? 'إدارة الموظفين' : 'Employees Management'}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HR / Employees</span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { l: 'إجمالي الموظفين', v: employees.length, c: '#3B82F6', icon: GroupsOutlinedIcon },
          { l: 'إجمالي الرواتب الأساسية', v: formatAmount(totalSalaries), c: '#10B981', icon: AccountBalanceWalletOutlinedIcon },
          { l: 'عدد الأقسام', v: departments.length, c: '#8B5CF6', icon: ApartmentOutlinedIcon },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${kpi.c}15`, color: kpi.c }}>
                <Icon style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: kpi.c }}>{kpi.v}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{kpi.l}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters + Actions */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text" placeholder={locale === 'ar' ? 'بحث بالاسم أو رقم الهوية...' : 'Search by name or ID...'}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, width: '260px' }}
          />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ ...inp, width: 'auto' }}>
            <option value="ALL">{locale === 'ar' ? 'كل الأقسام' : 'All Departments'}</option>
            {departments.map(d => <option key={d.id} value={d.id.toString()}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem' }}>
          <AddCircleOutlineOutlinedIcon style={{ fontSize: '1.2rem' }} />
          إضافة موظف جديد
        </button>
      </div>

      {/* Employees Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <GroupsOutlinedIcon style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>{locale === 'ar' ? 'لا يوجد موظفون مطابقون للبحث' : 'No employees matching the search'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'الاسم الكامل' : 'Full Name'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'القسم' : 'Department'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'رقم الهوية' : 'National ID'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'بطاقة السكن' : 'Residence Card'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                <th style={{ padding: '1rem' }}>{locale === 'ar' ? 'المستندات' : 'Documents'}</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>{locale === 'ar' ? 'العمليات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                        {emp.full_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{emp.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          أضيف: {new Date(emp.created_at).toLocaleDateString('ar-IQ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {emp.department_name ? (
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: 999, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        {emp.department_name}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{emp.national_id || '—'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{emp.residence_card || '—'}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: '#10B981' }}>{formatAmount(parseFloat(emp.basic_salary || '0'))}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {emp.id_image_front && <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.75rem' }}>{locale === 'ar' ? 'هوية أ' : 'Front ID'}</span>}
                      {emp.id_image_back && <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: '0.75rem' }}>{locale === 'ar' ? 'هوية خ' : 'Back ID'}</span>}
                      {emp.other_documents && <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontSize: '0.75rem' }}>{locale === 'ar' ? 'وثائق' : 'Documents'}</span>}
                      {!emp.id_image_front && !emp.id_image_back && !emp.other_documents && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{locale === 'ar' ? 'لا يوجد' : 'None'}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button onClick={() => setViewEmployee(emp)} title="استعراض" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: 6, padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <VisibilityOutlinedIcon style={{ fontSize: '1.1rem' }} />
                      </button>
                      <button onClick={() => openEdit(emp)} title="تعديل" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: 6, padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <EditOutlinedIcon style={{ fontSize: '1.1rem' }} />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} title="حذف" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 6, padding: '0.35rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <DeleteOutlineOutlinedIcon style={{ fontSize: '1.1rem' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Employee Modal */}
      {viewEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>{locale === 'ar' ? 'بيانات الموظف' : 'Employee Data'}</h2>
              <button onClick={() => setViewEmployee(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <CloseOutlinedIcon />
              </button>
            </div>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold' }}>
                {viewEmployee.full_name.charAt(0)}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{viewEmployee.full_name}</h3>
                <span style={{ padding: '0.2rem 0.75rem', borderRadius: 999, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: '0.82rem', fontWeight: 'bold' }}>
                  {viewEmployee.department_name || locale === 'ar' ? 'بدون قسم' : 'No Department'}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { l: 'رقم الهوية', v: viewEmployee.national_id || '—', icon: BadgeOutlinedIcon },
                { l: 'بطاقة السكن', v: viewEmployee.residence_card || '—', icon: PersonOutlinedIcon },
                { l: 'الراتب الأساسي', v: formatAmount(parseFloat(viewEmployee.basic_salary || '0')), icon: AccountBalanceWalletOutlinedIcon },
                { l: 'القسم', v: viewEmployee.department_name || '—', icon: ApartmentOutlinedIcon },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ padding: '1rem', borderRadius: 8, background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <Icon style={{ fontSize: '1rem' }} /> {item.l}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.v}</div>
                  </div>
                );
              })}
            </div>

            {/* Documents */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>{locale === 'ar' ? 'المستندات والوثائق' : 'Documents'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {viewEmployee.id_image_front && (
                  <div>
                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'صورة الهوية الأمامية' : 'Front ID Image'}</p>
                    <img src={`${MEDIA_BASE}${viewEmployee.id_image_front}`} alt="هوية أمامية" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                  </div>
                )}
                {viewEmployee.id_image_back && (
                  <div>
                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'صورة الهوية الخلفية' : 'Back ID Image'}</p>
                    <img src={`${MEDIA_BASE}${viewEmployee.id_image_back}`} alt="هوية خلفية" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                  </div>
                )}
                {viewEmployee.other_documents && (
                  <a href={`${MEDIA_BASE}${viewEmployee.other_documents}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <UploadFileOutlinedIcon /> تحميل الوثائق الأخرى
                  </a>
                )}
                {!viewEmployee.id_image_front && !viewEmployee.id_image_back && !viewEmployee.other_documents && (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{locale === 'ar' ? 'لا توجد وثائق مرفقة' : 'No attached documents'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontWeight: 'bold' }}>{isEditMode ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {/* Section: Personal Info */}
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.3rem' }}>{locale === 'ar' ? 'البيانات الشخصية' : 'Personal Data'}</div>
              <div>
                <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الاسم الكامل *</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="الاسم الرباعي للموظف" style={inp} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'رقم الهوية' : 'National ID'}</label>
                  <input type="text" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} placeholder="رقم الهوية الوطنية" style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'رقم بطاقة السكن' : 'Residence Card Number'}</label>
                  <input type="text" value={form.residence_card} onChange={e => setForm({ ...form, residence_card: e.target.value })} placeholder="رقم بطاقة السكن" style={inp} />
                </div>
              </div>

              {/* Section: Work Info */}
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.3rem', marginTop: '0.5rem' }}>{locale === 'ar' ? 'بيانات العمل' : 'Work Data'}</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الراتب الأساسي *</label>
                  <input type="number" step="0.01" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: e.target.value })} required placeholder="مثال: 1500000" style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'القسم' : 'Department'}</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={inp}>
                    <option value="">اختر القسم...</option>
                    {departments.map(d => <option key={d.id} value={d.id.toString()}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Section: Documents */}
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.3rem', marginTop: '0.5rem' }}>{locale === 'ar' ? 'المستندات والوثائق' : 'Documents'}</div>

              {/* Front ID */}
              <div>
                <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'صورة الهوية الأمامية' : 'Front ID Image'}</label>
                <div
                  onClick={() => frontRef.current?.click()}
                  style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '1.2rem', cursor: 'pointer', textAlign: 'center', background: frontFile ? 'rgba(16,185,129,0.05)' : 'transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <UploadFileOutlinedIcon style={{ color: frontFile ? '#10B981' : 'var(--text-muted)', fontSize: '1.5rem' }} />
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: frontFile ? '#10B981' : 'var(--text-muted)' }}>
                    {frontFile ? frontFile.name : 'انقر لرفع صورة'}
                  </p>
                  <input ref={frontRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFrontFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* Back ID */}
              <div>
                <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'صورة الهوية الخلفية' : 'Back ID Image'}</label>
                <div
                  onClick={() => backRef.current?.click()}
                  style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '1.2rem', cursor: 'pointer', textAlign: 'center', background: backFile ? 'rgba(59,130,246,0.05)' : 'transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <UploadFileOutlinedIcon style={{ color: backFile ? '#3B82F6' : 'var(--text-muted)', fontSize: '1.5rem' }} />
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: backFile ? '#3B82F6' : 'var(--text-muted)' }}>
                    {backFile ? backFile.name : 'انقر لرفع صورة'}
                  </p>
                  <input ref={backRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setBackFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* Other Docs */}
              <div>
                <label style={{ fontSize: '0.83rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>وثائق أخرى (PDF, صورة)</label>
                <div
                  onClick={() => docRef.current?.click()}
                  style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '1.2rem', cursor: 'pointer', textAlign: 'center', background: docFile ? 'rgba(139,92,246,0.05)' : 'transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <UploadFileOutlinedIcon style={{ color: docFile ? '#8B5CF6' : 'var(--text-muted)', fontSize: '1.5rem' }} />
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: docFile ? '#8B5CF6' : 'var(--text-muted)' }}>
                    {docFile ? docFile.name : 'انقر لرفع ملف'}
                  </p>
                  <input ref={docRef} type="file" style={{ display: 'none' }} onChange={e => setDocFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>{isEditMode ? 'حفظ التعديلات' : 'إضافة الموظف'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, ...inp, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)' }}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
