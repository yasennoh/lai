"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { useLanguage } from './components/LanguageContext';
import { useTheme } from './components/ThemeContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, toggleLanguage, locale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [userObj, setUserObj] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem('user');
    if (!user && pathname !== '/login') {
      router.push('/login');
    } else if (user) {
      const parsedUser = JSON.parse(user);
      setUserObj(parsedUser);
      if (parsedUser.role === 'DATA_ENTRY' && pathname === '/') {
        router.push('/data-entry');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [pathname, router]);

  if (!mounted) return null; // Avoid hydration mismatch

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        {children}
      </main>
    );
  }

  if (!userObj) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header */}
        <header style={{ 
          height: '70px', 
          backgroundColor: 'var(--surface)', 
          borderBottom: '1px solid var(--border)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 2rem'
        }}>
          <div>
            <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'var(--background)', border: '1px solid var(--border)', width: '40px', height: '40px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '1.2rem' }}>
              ☰
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              style={{ 
                width: '35px', 
                height: '35px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--background)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                fontSize: '1.1rem',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              title={theme === 'light' ? (locale === 'ar' ? 'تفعيل الوضع الداكن' : 'Switch to Dark Mode') : (locale === 'ar' ? 'تفعيل الوضع المضيء' : 'Switch to Light Mode')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Language Selector */}
            <div 
              onClick={toggleLanguage} 
              style={{ 
                width: '35px', 
                height: '35px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--background)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                userSelect: 'none'
              }}
              title={locale === 'ar' ? 'Switch to English' : 'تحويل إلى العربية'}
            >
              {locale === 'ar' ? 'EN' : 'ع'}
            </div>
            <div onClick={() => setDropdownOpen(!dropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--background)', padding: '4px', borderRadius: '30px', border: '1px solid var(--border)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {userObj.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '55px',
                left: locale === 'ar' ? '0' : 'auto',
                right: locale === 'en' ? '0' : 'auto',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                width: '220px',
                zIndex: 1000,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem', fontSize: '1rem' }}>{t('goodMorning')} {userObj.username}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{userObj.role}</div>
                </div>
                <div 
                  onClick={() => {
                    localStorage.removeItem('user');
                    router.push('/login');
                  }} 
                  style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-main)', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  {t('logout')}
                </div>
              </div>
            )}
          </div>
        </header>
        
        {/* Main Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
