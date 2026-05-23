"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import { useCurrency } from '../components/CurrencyContext';

const API = 'https://ynoah.pythonanywhere.com/api/crm/dashboard-stats/';

interface ExpiringPolicy {
  id: number;
  policy_number: string;
  client_name: string;
  end_date: string;
  type: string;
  net_premium: string;
}

export default function RemindersPage() {
  const { t, locale } = useLanguage();
  const { formatAmount } = useCurrency();
  const [policies, setPolicies] = useState<ExpiringPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => {
        setPolicies(data.expiring_policies || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  // Helper to calculate days remaining
  const daysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div style={{ direction: locale === 'ar' ? 'rtl' : 'ltr', padding: '2rem' }}>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <NotificationsActiveOutlinedIcon style={{ color: '#EF4444' }} />
          {t('remindersTitle')}
        </h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('remindersSubtitle')}</span>
      </div>

      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <WarningAmberOutlinedIcon />
        <span style={{ fontSize: '0.95rem' }}>{t('remindersWarning')}</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{t('loadingReminders')}</div>
      ) : policies.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <NotificationsActiveOutlinedIcon style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('noReminders')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {policies.map(p => {
            const days = daysRemaining(p.end_date);
            const isUrgent = days <= 15;
            
            return (
              <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', borderRight: `4px solid ${isUrgent ? '#EF4444' : '#F59E0B'}`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{p.client_name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('policyNo')} {p.policy_number} ({p.type})</span>
                  </div>
                  <div style={{ background: isUrgent ? '#EF4444' : '#F59E0B', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {days < 0 ? `${t('expiredSince')} ${Math.abs(days)} ${t('days')}` : days === 0 ? t('endsToday') : `${t('remaining')} ${days} ${t('days')}`}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('expiryDate')}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{p.end_date}</span>
                  </div>
                  <div style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('netPremium')}</span>
                    <span style={{ fontWeight: 'bold', color: '#10B981', fontSize: '1rem' }}>{formatAmount(parseFloat(p.net_premium))}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem' }} onClick={() => window.location.href = '/policies'}>
                    <PhoneInTalkOutlinedIcon style={{ fontSize: '1.1rem' }} /> {t('callToRenew')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
