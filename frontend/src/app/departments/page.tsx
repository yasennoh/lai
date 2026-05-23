"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

const API = 'http://127.0.0.1:8000/api/crm/departments/';

interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

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
};

export default function DepartmentsPage() {
  const { locale } = useLanguage();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [employeeCounts, setEmployeeCounts] = useState<Record<number, number>>({});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dRes, eRes] = await Promise.all([
        fetch(API),
        fetch('http://127.0.0.1:8000/api/crm/employees/')
      ]);
      const depts: Department[] = await dRes.json();
      const emps: any[] = await eRes.json();
      setDepartments(depts);
      const counts: Record<number, number> = {};
      emps.forEach(e => { if (e.department) counts[e.department] = (counts[e.department] || 0) + 1; });
      setEmployeeCounts(counts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setIsEditMode(false); setSelectedId(null); setForm({ name: '', description: '' }); setIsModalOpen(true); };
  const openEdit = (d: Department) => { setIsEditMode(true); setSelectedId(d.id); setForm({ name: d.name, description: d.description || '' }); setIsModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `${API}${selectedId}/` : API;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      setIsModalOpen(false);
      fetchAll();
    } else {
      alert(locale === 'ar' ? 'حدث خطأ أثناء حفظ القسم' : 'Error saving department');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم فصل الموظفين المنتسبين له.')) return;
    const res = await fetch(`${API}${id}/`, { method: 'DELETE' });
    if (res.ok) fetchAll();
    else alert(locale === 'ar' ? 'فشل حذف القسم' : 'Failed to delete department');
  };

  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

  return (
    <div style={{ direction: 'rtl', padding: '2rem' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{locale === 'ar' ? 'إدارة الأقسام' : 'Departments Management'}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HR / Departments</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
            <ApartmentOutlinedIcon style={{ fontSize: '1.6rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>{departments.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{locale === 'ar' ? 'إجمالي الأقسام' : 'Total Departments'}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
            <GroupsOutlinedIcon style={{ fontSize: '1.6rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
              {Object.values(employeeCounts).reduce((a, b) => a + b, 0)}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{locale === 'ar' ? 'إجمالي الموظفين' : 'Total Employees'}</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem' }}>
          <AddCircleOutlineOutlinedIcon style={{ fontSize: '1.2rem' }} />
          إضافة قسم جديد
        </button>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>جاري تحميل الأقسام...</div>
      ) : departments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <ApartmentOutlinedIcon style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{locale === 'ar' ? 'لا توجد أقسام مضافة بعد' : 'No departments added yet'}</p>
          <button className="btn-primary" onClick={openAdd} style={{ marginTop: '1rem', padding: '0.6rem 1.5rem' }}>{locale === 'ar' ? 'إضافة أول قسم' : 'Add first department'}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {departments.map((dept, idx) => {
            const color = colors[idx % colors.length];
            const empCount = employeeCounts[dept.id] || 0;
            return (
              <div key={dept.id} className="glass-panel" style={{ padding: '1.5rem', borderTop: `4px solid ${color}`, position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15`, color }}>
                      <ApartmentOutlinedIcon style={{ fontSize: '1.4rem' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{dept.name}</h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(dept.created_at).toLocaleDateString('ar-IQ')}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEdit(dept)} title="تعديل" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: 6, padding: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <EditOutlinedIcon style={{ fontSize: '1rem' }} />
                    </button>
                    <button onClick={() => handleDelete(dept.id)} title="حذف" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 6, padding: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <DeleteOutlineOutlinedIcon style={{ fontSize: '1rem' }} />
                    </button>
                  </div>
                </div>
                {dept.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1rem 0', lineHeight: 1.6 }}>{dept.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: `${color}10`, borderRadius: 8 }}>
                  <GroupsOutlinedIcon style={{ fontSize: '1.1rem', color }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color }}>{empCount}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'موظف منتسب' : 'Associated Employee'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: 'bold' }}>{isEditMode ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>اسم القسم *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="مثال: قسم المبيعات" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>وصف القسم (اختياري)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="وصف مختصر لمهام هذا القسم..." style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>{isEditMode ? 'حفظ التعديلات' : 'إضافة القسم'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, ...inp, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)' }}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
