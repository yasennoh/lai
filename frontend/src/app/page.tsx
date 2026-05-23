"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from './components/LanguageContext';
import { useCurrency } from './components/CurrencyContext';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import dynamic from 'next/dynamic';

// استيراد ResponsiveContainer ديناميكياً لضمان عدم حدوث مشاكل SSR أو خطأ في حساب الأبعاد
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);

const API = 'https://ynoah.pythonanywhere.com/api/crm/dashboard-stats/';

export default function Home() {
  const { t, locale } = useLanguage();
  const { formatAmount } = useCurrency();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(API)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--text-muted)' }}>{t('loadingStats')}</div>;
  }

  return (
    <main style={{ padding: '2rem', direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', margin: '0 0 0.2rem 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{t('dashboard')}</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('welcomeDesc')}</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #3B82F6' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
            <PeopleAltOutlinedIcon style={{ fontSize: '2rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>{stats?.kpis?.total_clients || 0}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('totalClients')}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #10B981' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
            <DescriptionOutlinedIcon style={{ fontSize: '2rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>{stats?.kpis?.active_policies || 0}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('activePoliciesCount')}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '4px solid #F59E0B' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
            <AccountBalanceWalletOutlinedIcon style={{ fontSize: '2rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.2 }}>{formatAmount(stats?.kpis?.total_income || 0)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('totalPremiums')}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Bar Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>{t('salesLast6Months')}</h2>
          <div style={{ width: '100%', height: '300px', minWidth: 0 }} dir="ltr">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.bar_chart || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="income" name={t('totalPremiumCurrency')} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>{t('policyDistribution')}</h2>
          <div style={{ width: '100%', height: '300px', minWidth: 0 }} dir="ltr">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.pie_chart || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="type"
                  >
                    {(stats?.pie_chart || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Secondary Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Policy Status Pie Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>{locale === 'ar' ? 'حالة الوثائق' : 'Policy Status'}</h2>
          <div style={{ width: '100%', height: '300px', minWidth: 0 }} dir="ltr">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.policy_status_chart || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {(stats?.policy_status_chart || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Claims Pie Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1.5rem 0', color: 'var(--text-main)' }}>{locale === 'ar' ? 'حالة المطالبات' : 'Claims Status'}</h2>
          <div style={{ width: '100%', height: '300px', minWidth: 0 }} dir="ltr">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.claims_chart || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {(stats?.claims_chart || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </main>
  );
}
