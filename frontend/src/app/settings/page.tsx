"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../components/LanguageContext';
import { useCurrency } from '../components/CurrencyContext';

export default function SettingsPage() {
  const { t, locale, toggleLanguage } = useLanguage();
  const { currency, setCurrency, exchangeRate, setExchangeRate } = useCurrency();
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [systemSettings, setSystemSettings] = useState({ company_phones_left: '', branches_phones_right: '', company_logo: null as any });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    setUser(parsed);
    fetch('https://ynoah.pythonanywhere.com/api/crm/settings/')
      .then(r => r.json())
      .then(data => {
        setSystemSettings({
          company_phones_left: data.company_phones_left || '',
          branches_phones_right: data.branches_phones_right || '',
          company_logo: null
        });
        if (data.company_logo) setLogoPreview(data.company_logo);
      })
      .catch(e => console.error(e));
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('company_phones_left', systemSettings.company_phones_left);
      formData.append('branches_phones_right', systemSettings.branches_phones_right);
      if (systemSettings.company_logo instanceof File) {
        formData.append('company_logo', systemSettings.company_logo);
      }

      const res = await fetch('https://ynoah.pythonanywhere.com/api/crm/settings/', {
        method: 'POST',
        body: formData
      });
      if (res.ok) alert(locale === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
      else alert(t('saveError'));
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--background)', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{t('settings')}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'} / {t('settings')}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '600px' }}>
        {/* Currency Card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {locale === 'ar' ? 'عملة النظام' : 'System Currency'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {locale === 'ar' 
              ? 'تغيير العملة المستخدمة في عرض الإحصائيات، الأقساط، والوثائق عبر كافة صفحات النظام.' 
              : 'Change the currency used to display statistics, premiums, and policies across all system pages.'}
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setCurrency('USD')}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: currency === 'USD' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                background: currency === 'USD' ? 'rgba(15,118,110,0.1)' : 'rgba(0,0,0,0.02)',
                color: currency === 'USD' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>$</span>
              <span>{locale === 'ar' ? 'دولار أمريكي (USD)' : 'US Dollar (USD)'}</span>
            </button>

            <button
              onClick={() => setCurrency('IQD')}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: currency === 'IQD' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                background: currency === 'IQD' ? 'rgba(15,118,110,0.1)' : 'rgba(0,0,0,0.02)',
                color: currency === 'IQD' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>د.ع</span>
              <span>{locale === 'ar' ? 'دينار عراقي (IQD)' : 'Iraqi Dinar (IQD)'}</span>
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '6px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {locale === 'ar' 
                  ? `سعر الصرف المعتمد للتحويل (1 دولار):` 
                  : `Used Exchange Rate (1 USD):`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  value={exchangeRate} 
                  onChange={(e) => setExchangeRate(Number(e.target.value))} 
                  style={{ width: '80px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'white', color: 'var(--text-main)', outline: 'none' }} 
                />
                <span>{locale === 'ar' ? 'دينار عراقي' : 'IQD'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Language Card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {locale === 'ar' ? 'لغة النظام' : 'System Language'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {locale === 'ar' 
              ? 'تغيير اللغة الافتراضية لعرض الواجهات وعناوين البيانات.' 
              : 'Change the default language for displaying user interfaces and data labels.'}
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => locale !== 'ar' && toggleLanguage()}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: locale === 'ar' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                background: locale === 'ar' ? 'rgba(15,118,110,0.1)' : 'rgba(0,0,0,0.02)',
                color: locale === 'ar' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>العربية</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arabic</span>
            </button>

            <button
              onClick={() => locale !== 'en' && toggleLanguage()}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: locale === 'en' ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                background: locale === 'en' ? 'rgba(15,118,110,0.1)' : 'rgba(0,0,0,0.02)',
                color: locale === 'en' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>English</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الإنجليزية</span>
            </button>
          </div>
        </div>

        {/* Print Template Settings */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {locale === 'ar' ? 'إعدادات الطباعة' : 'Print Settings'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {locale === 'ar' 
              ? 'تخصيص أرقام الهواتف التي تظهر في أسفل صفحة طباعة الوثيقة (أرقام الشركة يميناً ويساراً).' 
              : 'Customize the phone numbers that appear at the bottom of the printed policy page.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                {locale === 'ar' ? 'أرقام الشركة (اليسار)' : 'Company Phones (Left)'}
                <span style={{ fontSize: '0.75rem', opacity: 0.7, marginRight: '8px' }}>({locale === 'ar' ? 'أدخل كل رقم في سطر جديد' : 'Enter each on a new line'})</span>
              </label>
              <textarea 
                value={systemSettings.company_phones_left} 
                onChange={(e) => setSystemSettings({ ...systemSettings, company_phones_left: e.target.value })} 
                placeholder={locale === 'ar' ? "مثال:\n07700000000\n07800000000" : "Example:\n07700000000\n07800000000"}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)', color: 'var(--text-main)', outline: 'none' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                {locale === 'ar' ? 'أرقام وتفاصيل الفروع (اليمين)' : 'Branches Details (Right)'}
                <span style={{ fontSize: '0.75rem', opacity: 0.7, marginRight: '8px' }}>({locale === 'ar' ? 'أدخل كل فرع في سطر جديد' : 'Enter each branch on a new line'})</span>
              </label>
              <textarea 
                value={systemSettings.branches_phones_right} 
                onChange={(e) => setSystemSettings({ ...systemSettings, branches_phones_right: e.target.value })} 
                placeholder={locale === 'ar' ? "مثال:\nفرع بغداد: 07900000000\nفرع البصرة: 07800000000" : "Example:\nBaghdad Branch: 07900000000\nBasra Branch: 07800000000"}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)', color: 'var(--text-main)', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                {locale === 'ar' ? 'شعار الشركة (اللوكو)' : 'Company Logo'}
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSystemSettings({ ...systemSettings, company_logo: file });
                    setLogoPreview(URL.createObjectURL(file));
                  }
                }}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)', color: 'var(--text-main)', outline: 'none', marginBottom: '1rem' }} 
              />
              {logoPreview && (
                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                  <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '150px', maxHeight: '100px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                </div>
              )}
            </div>

            <button  
              onClick={saveSettings} 
              disabled={saving}
              className="btn-primary" 
              style={{ marginTop: '0.5rem', padding: '0.8rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center' }}
            >
              {saving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (locale === 'ar' ? 'حفظ إعدادات الطباعة' : 'Save Print Settings')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
