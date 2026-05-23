"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useCurrency } from '../components/CurrencyContext';

const API = 'http://127.0.0.1:8000/api/crm/brokers/';

interface Broker {
  id: number;
  name: string;
  phone: string;
  default_commission_amount: string;
  created_at: string;
}

interface Policy {
  id: number;
  policy_number: string;
  policy_type: string;
  premium_amount: string;
  net_premium: string;
  status: string;
  broker?: number;
  commission_amount?: string;
  commission_percentage?: string;
  client: number;
  created_at: string;
}

interface Client {
  id: number;
  first_name?: string;
  second_name?: string;
  third_name?: string;
  last_name?: string;
  company_name?: string;
  client_type?: string;
  phone?: string;
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

export default function BrokersPage() {
  const { t, locale } = useLanguage();
  const { formatAmount } = useCurrency();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ name: '', phone: '', default_commission_amount: '0' });

  // Additional states for broker profile details
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [brokersRes, policiesRes, clientsRes] = await Promise.all([
        fetch(API),
        fetch('http://127.0.0.1:8000/api/crm/policies/'),
        fetch('http://127.0.0.1:8000/api/crm/clients/')
      ]);
      if (brokersRes.ok) setBrokers(await brokersRes.json());
      if (policiesRes.ok) setPolicies(await policiesRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchBrokers = fetchData;

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { 
    setIsEditMode(false); setSelectedId(null); 
    setForm({ name: '', phone: '', default_commission_amount: '0' }); 
    setIsModalOpen(true); 
  };
  
  const openEdit = (b: Broker) => { 
    setIsEditMode(true); setSelectedId(b.id); 
    setForm({ name: b.name, phone: b.phone || '', default_commission_amount: b.default_commission_amount || '0' }); 
    setIsModalOpen(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `${API}${selectedId}/` : API;
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form) 
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchBrokers();
    } else {
      alert(t('errorSaving'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`${API}${id}/`, { method: 'DELETE' });
    if (res.ok) fetchBrokers();
    else alert(t('errorDeleting'));
  };

  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];

  return (
    <div style={{ direction: locale === 'ar' ? 'rtl' : 'ltr', padding: '2rem' }}>
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{t('brokersTitle')}</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('brokersSubtitle')}</span>
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AddOutlinedIcon /> {t('addBroker')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{t('loadingBrokers')}</div>
      ) : brokers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <PersonOutlinedIcon style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>{t('noBrokers')}</p>
          <button className="btn-primary" onClick={openAdd}>
            {t('addFirstBroker')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {brokers.map((broker, idx) => {
            const color = colors[idx % colors.length];
            return (
              <div key={broker.id} className="glass-panel" style={{ padding: '1.5rem', borderTop: `4px solid ${color}`, position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonOutlinedIcon style={{ fontSize: '1.8rem' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{broker.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <PhoneInTalkOutlinedIcon style={{ fontSize: '1rem' }} /> {broker.phone || t('phoneNotSpecified')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEdit(broker)} title={t('edit')} style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: 6, padding: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <EditOutlinedIcon style={{ fontSize: '1rem' }} />
                    </button>
                    <button onClick={() => handleDelete(broker.id)} title={t('delete')} style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 6, padding: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <DeleteOutlineOutlinedIcon style={{ fontSize: '1rem' }} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBroker(broker);
                    setIsProfileOpen(true);
                  }}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg, rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(10px)',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card-bg, rgba(255, 255, 255, 0.05))';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <PersonOutlinedIcon style={{ fontSize: '1.15rem' }} />
                  {t('viewProfile')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, direction: locale === 'ar' ? 'rtl' : 'ltr' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              {selectedId ? t('editBroker') : t('addBroker')}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{t('brokerName')}</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{t('phoneOptional')}</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{t('saveChanges')}</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileOpen && selectedBroker && (() => {
        const brokerPolicies = policies.filter(p => p.broker === selectedBroker.id);
        const activePolicies = brokerPolicies.filter(p => p.status === 'ACTIVE');
        const totalEarningsAmount = activePolicies.reduce((sum, p) => sum + (parseFloat(p.commission_amount || '0') || 0), 0);

        const statusLabels: Record<string, string> = {
          ACTIVE: t('statusActive'),
          EXPIRED: t('statusExpired'),
          CANCELLED: t('statusCancelled'),
          PENDING: t('statusPending'),
          SUSPENDED: t('statusSuspended'),
        };

        const typeLabels: Record<string, string> = {
          AUTO: t('typeAuto'),
          HEALTH: t('typeHealth'),
          LIFE: t('typeLife'),
          PROPERTY: t('typeProperty'),
          TRAVEL: t('typeTravel'),
          MARINE: t('typeMarine'),
          FIRE: t('typeFire'),
          LIABILITY: t('typeLiability'),
          ENGINEERING: t('typeEngineering'),
        };

        const getStatusColor = (status: string) => {
          switch (status) {
            case 'ACTIVE': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
            case 'PENDING': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
            case 'CANCELLED': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
            case 'EXPIRED': return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
            default: return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
          }
        };

        const getClientName = (clientId: number) => {
          const c = clients.find(x => x.id === clientId);
          if (!c) return '-';
          if (c.client_type === 'CORPORATE' && c.company_name) {
            return c.company_name;
          }
          return `${c.first_name || ''} ${c.second_name || ''} ${c.third_name ? c.third_name + ' ' : ''}${c.last_name || ''}`.trim();
        };

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, direction: locale === 'ar' ? 'rtl' : 'ltr', padding: '1rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              
              {/* Close Button */}
              <button 
                onClick={() => { setIsProfileOpen(false); setSelectedBroker(null); }}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  [locale === 'ar' ? 'left' : 'right']: '1.25rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.borderColor = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Header */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: `${colors[brokers.indexOf(selectedBroker) % colors.length]}15`, color: colors[brokers.indexOf(selectedBroker) % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PersonOutlinedIcon style={{ fontSize: '2.2rem' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedBroker.name}</h2>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <PhoneInTalkOutlinedIcon style={{ fontSize: '0.95rem' }} /> {selectedBroker.phone || t('phoneNotSpecified')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings & Details Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccountBalanceWalletOutlinedIcon style={{ fontSize: '1.6rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('totalEarnings')}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10B981', marginTop: '0.2rem' }}>
                      {formatAmount(totalEarningsAmount)}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('brokerPolicies')}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {brokerPolicies.length} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{locale === 'ar' ? 'وثائق' : 'policies'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policies List Section */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.75rem 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{t('brokerPolicies')}</h3>
                
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: locale === 'en' ? '6px' : '0', paddingLeft: locale === 'ar' ? '6px' : '0', maxHeight: '350px' }}>
                  {brokerPolicies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.75rem', opacity: 0.6 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>{t('noPoliciesLinked')}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {brokerPolicies.map(p => {
                        const statusColor = getStatusColor(p.status);
                        const isPerc = parseFloat(p.commission_percentage || '0') > 0;
                        return (
                          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', transition: 'background-color 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: 'var(--primary)' }}>#</span>
                                {p.policy_number}
                                <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {typeLabels[p.policy_type.toUpperCase()] || p.policy_type}
                                </span>
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '20px', background: statusColor.bg, color: statusColor.color }}>
                                {statusLabels[p.status.toUpperCase()] || p.status}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              <div>
                                <span style={{ opacity: 0.7 }}>{t('clientLabel')}</span>{' '}
                                <strong style={{ color: 'var(--text-main)' }}>{getClientName(p.client)}</strong>
                              </div>
                              <div>
                                <span style={{ opacity: 0.7 }}>{t('netPremium')}:</span>{' '}
                                <strong style={{ color: 'var(--text-main)' }}>{formatAmount(parseFloat(p.net_premium || '0'))}</strong>
                              </div>
                              <div>
                                <span style={{ opacity: 0.7 }}>{locale === 'ar' ? 'العمولة:' : 'Commission:'}</span>{' '}
                                <strong style={{ color: '#10B981' }}>
                                  {formatAmount(parseFloat(p.commission_amount || '0'))}
                                  {isPerc && ` (${parseFloat(p.commission_percentage || '0')}%)`}
                                </strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
