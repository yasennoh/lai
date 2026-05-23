"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../components/LanguageContext';

const API = 'https://ynoah.pythonanywhere.com/api/crm';

export default function TemplatesPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ id: '', title: '', content: '', template_type: 'TERMS' });
  const [msg, setMsg] = useState('');

  const inp = { padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)', color: 'var(--text-main)', width: '100%', outline: 'none', fontFamily: 'inherit' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'ADMIN') { router.push('/'); return; }
    setUser(parsed);
    fetchTemplates();
  }, []);

  const fetchTemplates = () => {
    fetch(`${API}/templates/`)
      .then(r => r.json())
      .then(data => setTemplates(data))
      .catch(() => {});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `${API}/templates/${form.id}/` : `${API}/templates/`;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      setMsg(locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
      setIsModalOpen(false);
      fetchTemplates();
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg(locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    const res = await fetch(`${API}/templates/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      fetchTemplates();
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--background)' }}>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{locale === 'ar' ? 'الشروط والاستثناءات' : 'Terms & Exclusions'}</h1>
        <button className="btn-primary" onClick={() => { setForm({ id: '', title: '', content: '', template_type: 'TERMS' }); setIsModalOpen(true); }} style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
          + {locale === 'ar' ? 'إضافة نموذج' : 'Add Template'}
        </button>
      </div>

      {msg && <div style={{ padding: '0.75rem', background: msg.includes('نجاح') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.includes('نجاح') ? '#10B981' : '#EF4444', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {templates.map(t => (
          <div key={t.id} className="card" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ background: t.template_type === 'TERMS' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', color: t.template_type === 'TERMS' ? '#3B82F6' : '#EF4444', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {t.template_type === 'TERMS' ? (locale === 'ar' ? 'شروط وأحكام' : 'Terms & Conditions') : (locale === 'ar' ? 'استثناءات' : 'Exclusions')}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => { setForm(t); setIsModalOpen(true); }} style={{ background: 'transparent', border: 'none', color: '#F59E0B', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>{locale === 'ar' ? 'تعديل' : 'Edit'}</button>
                <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>{locale === 'ar' ? 'حذف' : 'Delete'}</button>
              </div>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>{t.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', flex: 1, maxHeight: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.content}
            </p>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem' }}>{form.id ? (locale === 'ar' ? 'تعديل نموذج' : 'Edit Template') : (locale === 'ar' ? 'نموذج جديد' : 'New Template')}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'عنوان النموذج' : 'Template Title'}</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'النوع' : 'Type'}</label>
                <select value={form.template_type} onChange={e => setForm({...form, template_type: e.target.value})} style={inp}>
                  <option value="TERMS">{locale === 'ar' ? 'شروط وأحكام' : 'Terms & Conditions'}</option>
                  <option value="EXCLUSIONS">{locale === 'ar' ? 'استثناءات' : 'Exclusions'}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'النص' : 'Content'}</label>
                <textarea required value={form.content} onChange={e => setForm({...form, content: e.target.value})} style={{...inp, minHeight: '150px', resize: 'vertical'}} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>{locale === 'ar' ? 'حفظ' : 'Save'}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
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
