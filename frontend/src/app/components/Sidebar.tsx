"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';

interface User { username: string; role: string; }

interface SidebarProps {
  isOpen: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [expiringPolicies, setExpiringPolicies] = useState(0);
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const pathname = usePathname();
  const { t, locale } = useLanguage();

  useEffect(() => {
    fetch('https://ynoah.pythonanywhere.com/api/crm/settings/')
      .then(res => res.json())
      .then(data => {
        if (data.company_logo) {
          setLogoUrl(data.company_logo);
        }
      })
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      setUser(JSON.parse(u));
      fetch('https://ynoah.pythonanywhere.com/api/crm/policies/')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const now = new Date();
          const nextMonth = new Date();
          nextMonth.setDate(now.getDate() + 30);
          const count = data.filter((p: any) => {
            if (p.status !== 'ACTIVE') return false;
            const ed = new Date(p.end_date);
            return ed > now && ed <= nextMonth;
          }).length;
          setExpiringPolicies(count);
        }).catch(() => { });
    }
  }, [pathname]);



  const isActive = (path: string) => pathname === path;

  const linkStyle = (path: string): React.CSSProperties => {
    const active = isActive(path);
    return {
      padding: '0.75rem 1rem',
      color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
      textDecoration: 'none',
      outline: 'none',
      border: 'none',
      fontWeight: active ? '600' : '500',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: isOpen ? 'flex-start' : 'center',
      gap: isOpen ? '12px' : '0',
      backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      marginBottom: '4px'
    };
  };

  const renderLink = (href: string, label: string, Icon?: any) => (
    <Link href={href} style={linkStyle(href)} title={label}>
      {Icon && <Icon style={{ fontSize: '1.25rem', flexShrink: 0 }} />}
      {isOpen && <span style={{ fontSize: '0.95rem' }}>{label}</span>}
    </Link>
  );

  return (
    <aside style={{
      width: isOpen ? '260px' : '80px',
      backgroundColor: 'var(--sidebar-bg)',
      borderInlineEnd: '1px solid var(--border)', /* Logical property: Left border in RTL, Right border in LTR */
      display: 'flex',
      flexDirection: 'column',
      padding: isOpen ? '1.5rem 1rem' : '1.5rem 0.5rem',
      position: 'sticky',
      top: 0,
      height: '100vh',
      zIndex: 100,
      transition: 'width 0.3s ease, padding 0.3s ease'
    }}>
      {/* Header & Toggle */}
      <div style={{ padding: isOpen ? '1.5rem' : '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', justifyContent: isOpen ? 'flex-start' : 'center' }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ width: isOpen ? '45px' : '40px', height: isOpen ? '45px' : '40px', objectFit: 'contain', borderRadius: '8px', transition: 'all 0.3s' }} />
        ) : (
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 4px 12px rgba(15,118,110,0.3)' }}>
            P
          </div>
        )}
        {isOpen && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.5px' }}>تأمين</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Insurance Management Software</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
          {(!user || user.role !== 'DATA_ENTRY') && renderLink('/', t('dashboard'), GridViewOutlinedIcon)}
          {user && ['ADMIN', 'AUDITOR', 'ACCOUNTANT'].includes(user.role) && renderLink(
            '/admin-panel', 
            user.role === 'ADMIN' ? t('staffManagement') : user.role === 'AUDITOR' ? (locale === 'ar' ? 'لوحة التدقيق' : 'Auditor Panel') : (locale === 'ar' ? 'لوحة المحاسبة' : 'Accountant Panel'), 
            PeopleAltOutlinedIcon
          )}
        </nav>

        {/* Client Management Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          {isOpen && (
            <div style={{ padding: '0 1rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {locale === 'ar' ? 'إدارة العملاء' : 'Client Management'}
            </div>
          )}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {renderLink('/crm', t('customers'), PersonOutlinedIcon)}
            {renderLink('/leads', t('leads'), PersonAddOutlinedIcon)}
            {user?.role === 'ADMIN' && renderLink('/brokers', t('brokers'), HandshakeOutlinedIcon)}
            {renderLink('/reminders', locale === 'ar' ? 'وثائق تنتهي قريباً' : 'Expiring Policies', NotificationsActiveOutlinedIcon)}
          </nav>
        </div>

        {/* Operations Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          {isOpen && (
            <div style={{ padding: '0 1rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {locale === 'ar' ? 'العمليات والتأمين' : 'Operations & Insurance'}
            </div>
          )}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {renderLink('/data-entry', t('dataEntry'), BadgeOutlinedIcon)}
            {renderLink('/policies', t('policies'), DescriptionOutlinedIcon)}
            {renderLink('/claims', t('claims'), GavelOutlinedIcon)}
            {user && ['ADMIN', 'ACCOUNTANT'].includes(user.role) && renderLink('/reports', t('reports'), BarChartOutlinedIcon)}
            {user && ['ADMIN', 'ACCOUNTANT'].includes(user.role) && renderLink('/payroll', t('payroll'), AccountBalanceWalletOutlinedIcon)}
            {user && ['ADMIN', 'ACCOUNTANT'].includes(user.role) && renderLink('/expenses', t('expenses'), ReceiptLongOutlinedIcon)}
          </nav>
        </div>

        {/* HR Management Section */}
        {user?.role === 'ADMIN' && (
          <div style={{ marginBottom: '1.5rem' }}>
            {isOpen && (
              <div style={{ padding: '0 1rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {locale === 'ar' ? 'الموارد البشرية' : 'HR Management'}
              </div>
            )}
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {renderLink('/employees', t('employees'), GroupsOutlinedIcon)}
              {renderLink('/departments', t('departments'), ApartmentOutlinedIcon)}
            </nav>
          </div>
        )}

        {/* Separator and Settings */}
        {user?.role === 'ADMIN' && (
          <>
            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '1rem 0' }} />
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {renderLink('/templates', t('termsAndExclusions'), MenuBookOutlinedIcon)}
              {renderLink('/settings', t('settings'), SettingsOutlinedIcon)}
            </nav>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--sidebar-text)', display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'flex-start' : 'center', gap: isOpen ? '12px' : 0, transition: 'all 0.2s ease', overflow: 'hidden', whiteSpace: 'nowrap' }}
            title={user.username}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            </span>
            {isOpen && <span style={{ fontWeight: '500' }}>{user.username}</span>}
          </div>
        )}
      </div>
    </aside>
  );
}
