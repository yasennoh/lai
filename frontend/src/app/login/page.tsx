"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('https://ynoah.pythonanywhere.com/api/crm/login/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify({ ...data.user, lastActive: Date.now() }));
        if (data.token) {
          sessionStorage.setItem('token', data.token);
        }
        router.push(data.user.role === 'ADMIN' ? '/admin-panel' : '/data-entry');
      } else { setError(data.error || 'خطأ في البيانات'); }
    } catch { setError('خطأ في الاتصال بالسيرفر'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h1 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '0.3rem' }}>شركة التأمين الشاملة</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>تسجيل الدخول إلى النظام</p>
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" placeholder="اسم المستخدم" value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }} />
          <input type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', outline: 'none', fontSize: '1rem', fontFamily: 'inherit' }} />
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

      </div>
    </div>
  );
}
