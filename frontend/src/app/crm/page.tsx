"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FiberNewOutlinedIcon from '@mui/icons-material/FiberNewOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';

interface Client {
  id: number;
  first_name: string;
  second_name: string;
  third_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  phone2: string;
  address: string;
  date_of_birth: string;
  client_type: string;
  status: string;
  national_id: string;
  mother_name?: string;
  grandfather_name?: string;
  gender?: string;
  passport_number?: string;
  id_issue_date?: string;
  id_issue_place?: string;
  place_of_birth?: string;
  employment_type?: string;
  job_title?: string;
  annual_income?: string;
  source_of_funds?: string;
  company_nationality?: string;
  authorized_capital?: string;
  paid_capital?: string;
  company_annual_income?: string;
  postal_code?: string;
  po_box?: string;
  company_name?: string;
  company_type?: string;
  industry?: string;
  chamber_of_commerce?: string;
  registration_number?: string;
  governorate?: string;
  ceo_name?: string;
  num_branches?: number;
  num_employees?: number;
  registration_date?: string;
  id_image_front: string;
  id_image_back: string;
  other_documents: string;
  created_at: string;
  created_by_name?: string;
  updated_by_name?: string;
}

interface Policy {
  id: number;
  client: number;
  policy_number: string;
  policy_type: string;
  status: string;
  start_date?: string;
  end_date?: string;
  premium_amount?: string;
}

interface Communication {
  id: number;
  client: number;
  type: string;
  notes: string;
  date: string;
}

const inputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'rgba(0,0,0,0.05)',
  color: 'var(--text-main)',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '1rem',
};

const getMediaUrl = (url: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://ynoah.pythonanywhere.com${url}`;
};

export default function CRM() {
  const { locale } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [successMessage, setSuccessMessage] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modals
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isAddCommOpen, setIsAddCommOpen] = useState(false);
  const [isRenewPolicyOpen, setIsRenewPolicyOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [renewForm, setRenewForm] = useState({ start_date: '', end_date: '', premium_amount: '' });

  const [clientForm, setClientForm] = useState({
    first_name: '', second_name: '', third_name: '', last_name: '', email: '', phone: '', phone2: '', address: '', date_of_birth: '',
    client_type: 'INDIVIDUAL', status: 'LEAD', national_id: '',
    mother_name: '', grandfather_name: '', company_name: '', company_type: '', industry: '', chamber_of_commerce: '', registration_number: '', governorate: ''
  });
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [otherDocs, setOtherDocs] = useState<File | null>(null);
  const [commForm, setCommForm] = useState({ type: 'CALL', notes: '' });

  const fetchData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    Promise.all([
      fetch('https://ynoah.pythonanywhere.com/api/crm/clients/').then(r => r.json()),
      fetch('https://ynoah.pythonanywhere.com/api/crm/policies/').then(r => r.json()),
      fetch('https://ynoah.pythonanywhere.com/api/crm/communications/').then(r => r.json()),
    ]).then(([c, p, comm]) => {
      setClients(c);
      setPolicies(p);
      setCommunications(comm);
      if (showLoading) setLoading(false);
    }).catch(() => {
      if (showLoading) setLoading(false);
    });
  };

  useEffect(() => { 
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchData(); 
  }, []);

  const clientPolicies = (id: number) => policies.filter(p => p.client === id);
  const clientComms = (id: number) => communications.filter(c => c.client === id);

  const policyTypeLabel: Record<string, string> = { AUTO: locale === 'ar' ? 'سيارات' : 'Auto', HEALTH: locale === 'ar' ? 'صحي' : 'Health', LIFE: locale === 'ar' ? 'حياة' : 'Life', PROPERTY: locale === 'ar' ? 'ممتلكات' : 'Property' };
  const statusLabel: Record<string, string> = { ACTIVE: locale === 'ar' ? 'فعالة' : 'Active', EXPIRED: locale === 'ar' ? 'منتهية' : 'Expired', CANCELLED: locale === 'ar' ? 'ملغاة' : 'Cancelled' };
  const commTypeLabel: Record<string, string> = { CALL: locale === 'ar' ? 'مكالمة' : 'Call', EMAIL: locale === 'ar' ? 'بريد' : 'Email', MEETING: locale === 'ar' ? 'اجتماع' : 'Meeting' };

  const filteredClients = clients.filter(c => {
    if (c.status === 'LEAD') return false;
    if (filterType !== 'ALL' && c.client_type !== filterType) return false;
    return `${c.first_name || ''} ${c.second_name || ''} ${c.third_name || ''} ${c.last_name || ''} ${c.company_name || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase());
  });
  
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleClientInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    if (e.target.name === 'national_id') {
      const val = e.target.value.replace(/\D/g, '');
      setClientForm(prev => ({ ...prev, [e.target.name]: val }));
      return;
    }
    setClientForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = (isEdit: boolean) => {
    const errs: Record<string, string> = {};
    if (clientForm.client_type === 'INDIVIDUAL') {
      if (!clientForm.first_name) errs.first_name = locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      if (!clientForm.second_name) errs.second_name = locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      if (!clientForm.third_name) errs.third_name = locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      if (!clientForm.address) errs.address = locale === 'ar' ? 'العنوان مطلوب' : 'Address is required';
    } else {
      if (!clientForm.company_name) errs.company_name = locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      if (!clientForm.company_type) errs.company_type = locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      if (!clientForm.industry) errs.industry = locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      if (!clientForm.governorate) errs.governorate = locale === 'ar' ? 'المحافظة مطلوبة' : 'Governorate is required';
      if (!clientForm.email) errs.email = locale === 'ar' ? 'البريد الإلكتروني مطلوب للشركات' : 'Email is required for corporate';
    }
    
    if (!clientForm.phone) {
      errs.phone = locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
    } else if (clientForm.phone.length !== 11) {
      errs.phone = locale === 'ar' ? 'يجب أن يتكون من 11 رقم' : 'Must be 11 digits';
    } else if (clients.some(c => c.phone === clientForm.phone && (!isEdit || c.id !== selectedClient?.id))) {
      errs.phone = locale === 'ar' ? 'رقم الهاتف مكرر لايمكن اضافة عميل' : 'Phone number is duplicated, cannot add client';
    }

    if (clientForm.phone2 && clientForm.phone2.length !== 11) errs.phone2 = locale === 'ar' ? 'يجب أن يتكون من 11 رقم' : 'Must be 11 digits';
    if (clientForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.email)) errs.email = locale === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const renderInput = (name: string, placeholder: string, type: string = "text", extraProps: any = {}) => (
    <div style={{ flex: 1 }}>
      <input type={type} name={name} placeholder={placeholder} value={(clientForm as any)[name] || ''} onChange={handleClientInput} style={{ ...inputStyle, border: errors[name] ? '1px solid #EF4444' : '1px solid var(--glass-border)' }} {...extraProps} />
      {errors[name] && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors[name]}</div>}
    </div>
  );

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    const data = new FormData();
    Object.entries(clientForm).forEach(([k, v]) => { if (v) data.append(k, v); });
    if (idFront) data.append('id_image_front', idFront);
    if (idBack) data.append('id_image_back', idBack);
    if (otherDocs) data.append('other_documents', otherDocs);
    const userStr = localStorage.getItem('user');
    if (userStr) data.append('created_by', JSON.parse(userStr).id);
    const res = await fetch('https://ynoah.pythonanywhere.com/api/crm/clients/', { method: 'POST', body: data });
    if (res.ok) {
      setIsAddClientOpen(false);
      setClientForm({ first_name: '', second_name: '', third_name: '', last_name: '', mother_name: '', grandfather_name: '', email: '', phone: '', phone2: '', address: '', date_of_birth: '', client_type: 'INDIVIDUAL', status: 'LEAD', national_id: '', company_name: '', company_type: '', industry: '', chamber_of_commerce: '', registration_number: '', governorate: '' });
      setIdFront(null); setIdBack(null); setOtherDocs(null);
      fetchData(false);
      setSuccessMessage(locale === 'ar' ? 'تم إضافة عميل بنجاح' : 'Client added successfully');
    } else {
      const err = await res.json();
      if (err.email) {
        alert(locale === 'ar' ? 'حدث خطأ: البريد الإلكتروني مستخدم بالفعل لعميل آخر.' : 'Error: Email is already used for another client.');
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء الحفظ: ' : 'Error during saving: ' + JSON.stringify(err));
      }
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!validateForm(true)) return;
    const data = new FormData();
    Object.entries(clientForm).forEach(([k, v]) => { if (v) data.append(k, v); });
    if (idFront) data.append('id_image_front', idFront);
    if (idBack) data.append('id_image_back', idBack);
    if (otherDocs) data.append('other_documents', otherDocs);
    const userStr = localStorage.getItem('user');
    if (userStr) data.append('updated_by', JSON.parse(userStr).id);
    const res = await fetch(`https://ynoah.pythonanywhere.com/api/crm/clients/${selectedClient.id}/`, { method: 'PATCH', body: data });
    if (res.ok) {
      const updated = await res.json();
      setSelectedClient(updated);
      setIsEditClientOpen(false);
      setIdFront(null); setIdBack(null); setOtherDocs(null);
      fetchData();
    } else {
      const err = await res.json();
      if (err.email) {
        alert(locale === 'ar' ? 'حدث خطأ: البريد الإلكتروني مستخدم بالفعل لعميل آخر.' : 'Error: Email is already used for another client.');
      } else {
        alert(locale === 'ar' ? 'حدث خطأ أثناء التحديث: ' : 'Error during update: ' + JSON.stringify(err));
      }
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this client?')) return;
    const res = await fetch(`https://ynoah.pythonanywhere.com/api/crm/clients/${id}/`, { method: 'DELETE' });
    if (res.ok) { setSelectedClient(null); fetchData(); }
  };

  const handleAddComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const res = await fetch('https://ynoah.pythonanywhere.com/api/crm/communications/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...commForm, client: selectedClient.id })
    });
    if (res.ok) { setIsAddCommOpen(false); setCommForm({ type: 'CALL', notes: '' }); fetchData(); }
    else alert('حدث خطأ أثناء الحفظ');
  };

  const handleRenewPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    const res = await fetch(`https://ynoah.pythonanywhere.com/api/crm/policies/${selectedPolicy.id}/renew/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renewForm)
    });
    if (res.ok) {
      setIsRenewPolicyOpen(false);
      fetchData();
      alert(locale === 'ar' ? 'تم تجديد الوثيقة بنجاح!' : 'Policy renewed successfully!');
    } else {
      alert(locale === 'ar' ? 'حدث خطأ أثناء التجديد' : 'Error during renewal');
    }
  };

  const openEdit = (client: Client) => {
    setClientForm({
      first_name: client.first_name, second_name: client.second_name || '',
      third_name: client.third_name || '', last_name: client.last_name,
      email: client.email || '', phone: client.phone || '', phone2: client.phone2 || '',
      address: client.address || '', date_of_birth: client.date_of_birth || '',
      client_type: client.client_type || 'INDIVIDUAL', status: client.status || 'LEAD',
      national_id: client.national_id || '',
      mother_name: client.mother_name || '', grandfather_name: client.grandfather_name || '',
      company_name: client.company_name || '', company_type: client.company_type || '',
      industry: client.industry || '', chamber_of_commerce: client.chamber_of_commerce || '',
      registration_number: client.registration_number || '', governorate: client.governorate || ''
    });
    setIdFront(null); setIdBack(null); setOtherDocs(null);
    setIsEditClientOpen(true);
  };

  const totalActive = policies.filter(p => p.status === 'ACTIVE').length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><p style={{ fontSize: '1.5rem' }}>جاري التحميل...</p></div>;

  return (
    <div style={{ direction: 'rtl', padding: '2rem' }}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{locale === 'ar' ? 'إدارة العملاء (CRM)' : 'Customer Management (CRM)'}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dashboard / Customers</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: locale === 'ar' ? 'إجمالي العملاء الفعليين' : 'Total Active Clients', value: clients.filter(c => c.status !== 'LEAD').length, color: '#3B82F6', icon: PeopleAltOutlinedIcon },
          { label: locale === 'ar' ? 'وثائق نشطة' : 'Active Policies', value: totalActive, color: '#10B981', icon: DescriptionOutlinedIcon },
          { label: locale === 'ar' ? 'عملاء هذا الشهر' : 'Clients This Month', value: clients.filter(c => c.status !== 'LEAD' && new Date(c.created_at).getMonth() === new Date().getMonth()).length, color: '#8B5CF6', icon: FiberNewOutlinedIcon },
          { label: locale === 'ar' ? 'سجلات تواصل' : 'Communication Logs', value: communications.length, color: '#F59E0B', icon: ChatBubbleOutlineOutlinedIcon },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${stat.color}15`, color: stat.color }}>
                <Icon style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stat.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Client List Panel */}
        {!selectedClient && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{locale === 'ar' ? 'قائمة العملاء' : 'Client List'}</h2>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text" placeholder={locale === 'ar' ? 'ابحث بالاسم أو البريد أو الهاتف...' : 'Search by name, email, or phone...'}
              value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ ...inputStyle, flex: 2 }}
            />
            <select 
              value={filterType} 
              onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }} 
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="ALL">{locale === 'ar' ? 'الكل (أفراد وشركات)' : 'All (Individuals & Corporate)'}</option>
              <option value="INDIVIDUAL">{locale === 'ar' ? 'أفراد فقط' : 'Individuals Only'}</option>
              <option value="CORPORATE">{locale === 'ar' ? 'شركات فقط' : 'Corporate Only'}</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
            {currentClients.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}</p>
            ) : currentClients.map(client => {
              const polCount = clientPolicies(client.id).length;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    padding: '1rem', borderRadius: '12px', cursor: 'pointer',
                    border: '2px solid var(--glass-border)',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>
                      {client.client_type === 'CORPORATE' ? client.company_name : `${client.first_name || ''} ${client.second_name || ''} ${client.third_name ? client.third_name + ' ' : ''}${client.last_name || ''}`.trim()}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{client.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{client.phone || locale === 'ar' ? 'لا يوجد هاتف' : 'No phone'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ background: polCount > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)', color: polCount > 0 ? '#10B981' : '#64748B', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                      {polCount} وثيقة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: currentPage === 1 ? 'rgba(0,0,0,0.02)' : 'var(--secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                السابق
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
                صفحة {currentPage} من {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: currentPage === totalPages ? 'rgba(0,0,0,0.02)' : 'var(--secondary)', color: currentPage === totalPages ? 'var(--text-muted)' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                التالي
              </button>
            </div>
          )}
        </div>
        )}

        {/* Client Detail Panel */}
        {selectedClient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Profile Card */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {selectedClient.client_type === 'CORPORATE' ? (selectedClient.company_name ? selectedClient.company_name.substring(0, 2) : 'ش') : `${selectedClient.first_name ? selectedClient.first_name[0] : ''}${selectedClient.last_name ? selectedClient.last_name[0] : ''}` || 'ع'}
                  </div>
                  <div>
                    <h2 style={{ margin: 0 }}>
                      {selectedClient.client_type === 'CORPORATE' ? selectedClient.company_name : `${selectedClient.first_name || ''} ${selectedClient.second_name || ''} ${selectedClient.third_name ? selectedClient.third_name + ' ' : ''}${selectedClient.last_name || ''}`.trim()}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>عميل منذ {new Date(selectedClient.created_at).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setSelectedClient(null)} style={{ ...inputStyle, width: 'auto', padding: '0.5rem 1rem', cursor: 'pointer', background: 'rgba(100,116,139,0.15)', color: '#64748B', border: '1px solid #64748B', borderRadius: '8px', fontSize: '0.9rem' }}>{locale === 'ar' ? 'إغلاق' : 'Close'}</button>
                  <button onClick={() => openEdit(selectedClient)} style={{ ...inputStyle, width: 'auto', padding: '0.5rem 1rem', cursor: 'pointer', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '8px', fontSize: '0.9rem' }}>{locale === 'ar' ? 'تعديل' : 'Edit'}</button>
                  {user?.role !== 'DATA_ENTRY' && (
                    <button onClick={() => handleDeleteClient(selectedClient.id)} style={{ ...inputStyle, width: 'auto', padding: '0.5rem 1rem', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', fontSize: '0.9rem' }}>{locale === 'ar' ? 'حذف' : 'Delete'}</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {(() => {
                  const baseFields = [
                    { label: locale === 'ar' ? 'البريد الإلكتروني' : 'Email', value: selectedClient.email || '—' },
                    { label: locale === 'ar' ? 'رقم الهاتف' : 'Phone Number', value: selectedClient.phone || '—' },
                    { label: locale === 'ar' ? 'رقم هاتف إضافي' : 'Additional Phone', value: selectedClient.phone2 || '—' },
                    { label: locale === 'ar' ? 'التصنيف' : 'Classification', value: selectedClient.client_type === 'CORPORATE' ? locale === 'ar' ? 'شركات' : 'Corporate' : locale === 'ar' ? 'فردي' : 'Individual' },
                    { label: locale === 'ar' ? 'الحالة' : 'Status', value: selectedClient.status === 'LEAD' ? locale === 'ar' ? 'عميل محتمل (Lead)' : 'Lead' : selectedClient.status === 'ACTIVE' ? locale === 'ar' ? 'نشط' : 'Active' : locale === 'ar' ? 'غير نشط' : 'Inactive' },
                    { label: locale === 'ar' ? 'العنوان' : 'Address', value: selectedClient.address || '—' }
                  ];
                  
                  const individualFields = [
                    { label: locale === 'ar' ? 'رقم الهوية' : 'National ID', value: selectedClient.national_id || '—' },
                    { label: locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth', value: selectedClient.date_of_birth ? new Date(selectedClient.date_of_birth).toLocaleDateString('ar-EG') : '—' },
                    { label: locale === 'ar' ? 'مكان الميلاد' : 'Place of Birth', value: selectedClient.place_of_birth || '—' },
                    { label: locale === 'ar' ? 'اسم الأم' : 'Mother Name', value: selectedClient.mother_name || '—' },
                    { label: locale === 'ar' ? 'اسم الجد' : 'Grandfather Name', value: selectedClient.grandfather_name || '—' },
                    { label: locale === 'ar' ? 'الجنس' : 'Gender', value: selectedClient.gender === 'MALE' ? (locale === 'ar' ? 'ذكر' : 'Male') : selectedClient.gender === 'FEMALE' ? (locale === 'ar' ? 'أنثى' : 'Female') : '—' },
                    { label: locale === 'ar' ? 'رقم جواز السفر' : 'Passport Number', value: selectedClient.passport_number || '—' },
                    { label: locale === 'ar' ? 'تاريخ إصدار الهوية' : 'ID Issue Date', value: selectedClient.id_issue_date ? new Date(selectedClient.id_issue_date).toLocaleDateString('ar-EG') : '—' },
                    { label: locale === 'ar' ? 'مكان إصدار الهوية' : 'ID Issue Place', value: selectedClient.id_issue_place || '—' },
                    { label: locale === 'ar' ? 'نوع العمل' : 'Employment Type', value: selectedClient.employment_type || '—' },
                    { label: locale === 'ar' ? 'المسمى الوظيفي' : 'Job Title', value: selectedClient.job_title || '—' },
                    { label: locale === 'ar' ? 'الدخل السنوي' : 'Annual Income', value: selectedClient.annual_income || '—' },
                    { label: locale === 'ar' ? 'مصادر الأموال' : 'Source of Funds', value: selectedClient.source_of_funds || '—' }
                  ];

                  const corporateFields = [
                    { label: locale === 'ar' ? 'نوع الشركة' : 'Company Type', value: selectedClient.company_type || '—' },
                    { label: locale === 'ar' ? 'القطاع / النشاط' : 'Industry', value: selectedClient.industry || '—' },
                    { label: locale === 'ar' ? 'غرفة التجارة' : 'Chamber of Commerce', value: selectedClient.chamber_of_commerce || '—' },
                    { label: locale === 'ar' ? 'رقم التسجيل' : 'Registration Number', value: selectedClient.registration_number || '—' },
                    { label: locale === 'ar' ? 'المحافظة' : 'Governorate', value: selectedClient.governorate || '—' },
                    { label: locale === 'ar' ? 'اسم المدير المفوض' : 'CEO Name', value: selectedClient.ceo_name || '—' },
                    { label: locale === 'ar' ? 'جنسية الشركة' : 'Company Nationality', value: selectedClient.company_nationality || '—' },
                    { label: locale === 'ar' ? 'عدد الفروع' : 'Number of Branches', value: selectedClient.num_branches || '—' },
                    { label: locale === 'ar' ? 'عدد الموظفين' : 'Number of Employees', value: selectedClient.num_employees || '—' },
                    { label: locale === 'ar' ? 'تاريخ التسجيل' : 'Registration Date', value: selectedClient.registration_date ? new Date(selectedClient.registration_date).toLocaleDateString('ar-EG') : '—' },
                    { label: locale === 'ar' ? 'رأس المال المصرح به' : 'Authorized Capital', value: selectedClient.authorized_capital || '—' },
                    { label: locale === 'ar' ? 'رأس المال المدفوع' : 'Paid Capital', value: selectedClient.paid_capital || '—' },
                    { label: locale === 'ar' ? 'الدخل السنوي للشركة' : 'Annual Income', value: selectedClient.company_annual_income || '—' },
                    { label: locale === 'ar' ? 'الرمز البريدي' : 'Postal Code', value: selectedClient.postal_code || '—' },
                    { label: locale === 'ar' ? 'رقم صندوق البريد' : 'P.O. Box', value: selectedClient.po_box || '—' }
                  ];

                  const auditFields = [
                    { label: locale === 'ar' ? 'أُضيف بواسطة' : 'Added By', value: selectedClient.created_by_name || '—' },
                    { label: locale === 'ar' ? 'آخر تعديل' : 'Last Modified', value: selectedClient.updated_by_name || '—' },
                  ];

                  const fields = selectedClient.client_type === 'CORPORATE' 
                    ? [...baseFields, ...corporateFields, ...auditFields]
                    : [...baseFields, ...individualFields, ...auditFields];

                  return fields.map((item, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{item.label}</div>
                      <div style={{ fontWeight: '600' }}>{item.value}</div>
                    </div>
                  ));
                })()}
              </div>
              {/* Document Images */}
              {(selectedClient.id_image_front || selectedClient.id_image_back || selectedClient.other_documents) && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 'bold' }}>{locale === 'ar' ? 'وثائق العميل' : 'Client Documents'}</div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {selectedClient.id_image_front && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الهوية - الوجه الأمامي' : 'ID - Front'}</div>
                        <a href={getMediaUrl(selectedClient.id_image_front)} target="_blank" rel="noreferrer">
                          <img src={getMediaUrl(selectedClient.id_image_front)} alt={locale === 'ar' ? 'الهوية الأمامية' : 'Front ID'} style={{ width: '120px', height: '75px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--glass-border)' }} />
                        </a>
                      </div>
                    )}
                    {selectedClient.id_image_back && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الهوية - الوجه الخلفي' : 'ID - Back'}</div>
                        <a href={getMediaUrl(selectedClient.id_image_back)} target="_blank" rel="noreferrer">
                          <img src={getMediaUrl(selectedClient.id_image_back)} alt={locale === 'ar' ? 'الهوية الخلفية' : 'Back ID'} style={{ width: '120px', height: '75px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--glass-border)' }} />
                        </a>
                      </div>
                    )}
                    {selectedClient.other_documents && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'وثائق أخرى' : 'Other Documents'}</div>
                        <a href={getMediaUrl(selectedClient.other_documents)} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', borderRadius: '8px', fontSize: '0.85rem', textDecoration: 'none' }}>{locale === 'ar' ? 'عرض الوثيقة' : 'View Document'}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Policies for this client */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>{locale === 'ar' ? 'وثائق العميل (' : 'Client Policies ('}{clientPolicies(selectedClient.id).length})</h2>
              {selectedClient.status === 'LEAD' ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontWeight: 'bold' }}>
                  {locale === 'ar' ? 'العملاء المحتملين لا يمكن أن يمتلكوا وثائق تأمين. يجب تحويل الحالة إلى نشط أولاً.' : 'Leads cannot have insurance policies. Please change status to Active first.'}
                </p>
              ) : clientPolicies(selectedClient.id).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{locale === 'ar' ? 'لا توجد وثائق لهذا العميل' : 'No policies for this client'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {clientPolicies(selectedClient.id).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.04)' }}>
                      <div>
                        <span style={{ fontWeight: 'bold' }}>{p.policy_number}</span>
                        <span style={{ color: 'var(--text-muted)', marginRight: '0.75rem', fontSize: '0.9rem' }}>{policyTypeLabel[p.policy_type]}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ padding: '0.2rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', background: p.status === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)', color: p.status === 'ACTIVE' ? '#10B981' : '#64748B' }}>
                          {statusLabel[p.status]}
                        </span>
                        {(p.status === 'ACTIVE' || p.status === 'EXPIRED') && (
                          <button onClick={() => { setSelectedPolicy(p); setRenewForm({ start_date: '', end_date: '', premium_amount: p.premium_amount || '' }); setIsRenewPolicyOpen(true); }} style={{ padding: '0.2rem 0.5rem', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid #3B82F6', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>{locale === 'ar' ? 'تجديد' : 'Renew'}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Communications log */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{locale === 'ar' ? 'سجل التواصل (' : 'Communication Log ('}{clientComms(selectedClient.id).length})</h2>
                <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => setIsAddCommOpen(true)}>{locale === 'ar' ? 'إضافة تواصل' : 'Add Communication'}</button>
              </div>
              {clientComms(selectedClient.id).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{locale === 'ar' ? 'لا يوجد سجل تواصل بعد' : 'No communication log yet'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {clientComms(selectedClient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(comm => (
                    <div key={comm.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', borderRight: '3px solid #3B82F6' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{commTypeLabel[comm.type]}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(comm.date).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{comm.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {isAddClientOpen && (
        <Modal title="إضافة عميل جديد" onClose={() => setIsAddClientOpen(false)}>
          <form onSubmit={handleAddClient} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" onClick={() => setClientForm({ ...clientForm, client_type: 'INDIVIDUAL' })} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', flex: 1, background: clientForm.client_type === 'INDIVIDUAL' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: clientForm.client_type === 'INDIVIDUAL' ? 'white' : 'var(--text-muted)' }}>{locale === 'ar' ? 'فردي' : 'Individual'}</button>
              <button type="button" onClick={() => setClientForm({ ...clientForm, client_type: 'CORPORATE' })} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', flex: 1, background: clientForm.client_type === 'CORPORATE' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: clientForm.client_type === 'CORPORATE' ? 'white' : 'var(--text-muted)' }}>{locale === 'ar' ? 'شركة' : 'Corporate'}</button>
            </div>
            {clientForm.client_type === 'INDIVIDUAL' ? (
              <>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('first_name', locale === 'ar' ? 'الاسم الأول *' : 'First Name *')}
                  {renderInput('second_name', locale === 'ar' ? 'الاسم الثاني *' : 'Second Name *')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('third_name', locale === 'ar' ? 'الاسم الثالث *' : 'Third Name *')}
                  {renderInput('last_name', locale === 'ar' ? 'اللقب (اختياري)' : 'Last Name (Optional)')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('mother_name', locale === 'ar' ? 'اسم الأم (اختياري)' : 'Mother Name (Optional)')}
                  {renderInput('grandfather_name', locale === 'ar' ? 'اسم الجد من الأم (اختياري)' : 'Grandfather Name (Optional)')}
                </div>
                {renderInput('national_id', locale === 'ar' ? 'رقم الهوية' : 'National ID', 'text', { pattern: '\\d*', title: locale === 'ar' ? 'الرجاء إدخال أرقام فقط' : 'Please enter numbers only' })}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                    <input type="date" name="date_of_birth" value={clientForm.date_of_birth} onChange={handleClientInput} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</label>
                    <select name="status" value={clientForm.status} onChange={handleClientInput} style={inputStyle}>
                      <option value="LEAD">{locale === 'ar' ? 'عميل محتمل' : 'Lead'}</option>
                      <option value="ACTIVE">{locale === 'ar' ? 'عميل نشط' : 'Active Client'}</option>
                      <option value="INACTIVE">{locale === 'ar' ? 'عميل غير نشط' : 'Inactive Client'}</option>
                    </select>
                  </div>
                </div>
                {renderInput('email', locale === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)', 'email')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('phone', locale === 'ar' ? 'رقم الهاتف *' : 'Phone Number *', 'text', { maxLength: 11 })}
                  {renderInput('phone2', locale === 'ar' ? 'رقم هاتف إضافي' : 'Additional Phone', 'text', { maxLength: 11 })}
                </div>
                <div>
                  <textarea name="address" placeholder={locale === 'ar' ? 'العنوان *' : 'Address *'} value={clientForm.address} onChange={handleClientInput} style={{ ...inputStyle, width: '100%', minHeight: '70px', resize: 'vertical', border: errors.address ? '1px solid #EF4444' : '1px solid var(--glass-border)' }} />
                  {errors.address && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.address}</div>}
                </div>
              </>
            ) : (
              <>
                {renderInput('company_name', locale === 'ar' ? 'اسم الشركة (عربي / إنكليزي) *' : 'Company Name (Arabic/English) *')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <select name="company_type" value={clientForm.company_type} onChange={handleClientInput} style={{ ...inputStyle, border: errors.company_type ? '1px solid #EF4444' : '1px solid var(--glass-border)' }}>
                      <option value="">{locale === 'ar' ? 'نوع الشركة *' : 'Company Type *'}</option>
                      <option value="GOVERNMENT">{locale === 'ar' ? 'حكومية' : 'Governmental'}</option>
                      <option value="PRIVATE">{locale === 'ar' ? 'قطاع خاص' : 'Private Sector'}</option>
                      <option value="MIXED">{locale === 'ar' ? 'قطاع مشترك' : 'Mixed Sector'}</option>
                    </select>
                    {errors.company_type && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.company_type}</div>}
                  </div>
                  {renderInput('industry', locale === 'ar' ? 'مجال النشاط *' : 'Industry *')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'تاريخ التأسيس' : 'Foundation Date'}</label>
                    <input type="date" name="date_of_birth" value={clientForm.date_of_birth} onChange={handleClientInput} style={inputStyle} />
                  </div>
                  {renderInput('chamber_of_commerce', locale === 'ar' ? 'رقم غرفة التجارة (إن وجد)' : 'Chamber of Commerce (if any)')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('registration_number', locale === 'ar' ? 'رقم التسجيل في دائرة تسجيل الشركات' : 'Company Registration Number')}
                  {renderInput('governorate', locale === 'ar' ? 'المحافظة *' : 'Governorate *')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</label>
                    <select name="status" value={clientForm.status} onChange={handleClientInput} style={inputStyle}>
                      <option value="LEAD">{locale === 'ar' ? 'عميل محتمل' : 'Lead'}</option>
                      <option value="ACTIVE">{locale === 'ar' ? 'عميل نشط' : 'Active Client'}</option>
                      <option value="INACTIVE">{locale === 'ar' ? 'عميل غير نشط' : 'Inactive Client'}</option>
                    </select>
                  </div>
                </div>
                {renderInput('email', locale === 'ar' ? 'البريد الإلكتروني الرسمي *' : 'Official Email *', 'email')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('phone', locale === 'ar' ? 'رقم الموبايل *' : 'Mobile Number *', 'text', { maxLength: 11 })}
                  {renderInput('phone2', locale === 'ar' ? 'رقم هاتف إضافي' : 'Additional Phone', 'text', { maxLength: 11 })}
                </div>
                <div>
                  <textarea name="address" placeholder={locale === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'} value={clientForm.address} onChange={handleClientInput} style={{ ...inputStyle, width: '100%', minHeight: '70px', resize: 'vertical' }} />
                </div>
              </>
            )}
            {/* Document Uploads */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{locale === 'ar' ? 'وثائق الهوية' : 'Identity Documents'}</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>{locale === 'ar' ? 'صورة الهوية (الأمام)' : 'ID Image (Front)'}</label>
                  <input type="file" accept="image/*" onChange={e => setIdFront(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.4rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>{locale === 'ar' ? 'صورة الهوية (الخلف)' : 'ID Image (Back)'}</label>
                  <input type="file" accept="image/*" onChange={e => setIdBack(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.4rem' }} />
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>{locale === 'ar' ? 'وثائق أخرى (PDF, صور...)' : 'Other Documents (PDF, images...)'}</label>
                <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => setOtherDocs(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.4rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>{locale === 'ar' ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setIsAddClientOpen(false)} style={{ flex: 1, ...inputStyle, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)' }}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}


      {/* Edit Client Modal */}
      {isEditClientOpen && selectedClient && (
        <Modal title="تعديل بيانات العميل" onClose={() => setIsEditClientOpen(false)}>
          <form onSubmit={handleEditClient} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" onClick={() => setClientForm({ ...clientForm, client_type: 'INDIVIDUAL' })} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', flex: 1, background: clientForm.client_type === 'INDIVIDUAL' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: clientForm.client_type === 'INDIVIDUAL' ? 'white' : 'var(--text-muted)' }}>{locale === 'ar' ? 'فردي' : 'Individual'}</button>
              <button type="button" onClick={() => setClientForm({ ...clientForm, client_type: 'CORPORATE' })} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', flex: 1, background: clientForm.client_type === 'CORPORATE' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: clientForm.client_type === 'CORPORATE' ? 'white' : 'var(--text-muted)' }}>{locale === 'ar' ? 'شركة' : 'Corporate'}</button>
            </div>
            {clientForm.client_type === 'INDIVIDUAL' ? (
              <>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('first_name', locale === 'ar' ? 'الاسم الأول *' : 'First Name *')}
                  {renderInput('second_name', locale === 'ar' ? 'الاسم الثاني *' : 'Second Name *')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('third_name', locale === 'ar' ? 'الاسم الثالث *' : 'Third Name *')}
                  {renderInput('last_name', locale === 'ar' ? 'اللقب (اختياري)' : 'Last Name (Optional)')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('mother_name', locale === 'ar' ? 'اسم الأم (اختياري)' : 'Mother Name (Optional)')}
                  {renderInput('grandfather_name', locale === 'ar' ? 'اسم الجد من الأم (اختياري)' : 'Grandfather Name (Optional)')}
                </div>
                {renderInput('national_id', locale === 'ar' ? 'رقم الهوية' : 'National ID', 'text', { pattern: '\\d*', title: locale === 'ar' ? 'الرجاء إدخال أرقام فقط' : 'Please enter numbers only' })}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}</label>
                    <input type="date" name="date_of_birth" value={clientForm.date_of_birth} onChange={handleClientInput} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</label>
                    <select name="status" value={clientForm.status} onChange={handleClientInput} style={inputStyle}>
                      <option value="LEAD">{locale === 'ar' ? 'عميل محتمل' : 'Lead'}</option>
                      <option value="ACTIVE">{locale === 'ar' ? 'عميل نشط' : 'Active Client'}</option>
                      <option value="INACTIVE">{locale === 'ar' ? 'عميل غير نشط' : 'Inactive Client'}</option>
                    </select>
                  </div>
                </div>
                {renderInput('email', locale === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)', 'email')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('phone', locale === 'ar' ? 'رقم الهاتف *' : 'Phone Number *', 'text', { maxLength: 11 })}
                  {renderInput('phone2', locale === 'ar' ? 'رقم هاتف إضافي' : 'Additional Phone', 'text', { maxLength: 11 })}
                </div>
                <div>
                  <textarea name="address" placeholder={locale === 'ar' ? 'العنوان *' : 'Address *'} value={clientForm.address} onChange={handleClientInput} style={{ ...inputStyle, width: '100%', minHeight: '70px', resize: 'vertical', border: errors.address ? '1px solid #EF4444' : '1px solid var(--glass-border)' }} />
                  {errors.address && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.address}</div>}
                </div>
              </>
            ) : (
              <>
                {renderInput('company_name', locale === 'ar' ? 'اسم الشركة (عربي / إنكليزي) *' : 'Company Name (Arabic/English) *')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <select name="company_type" value={clientForm.company_type} onChange={handleClientInput} style={{ ...inputStyle, border: errors.company_type ? '1px solid #EF4444' : '1px solid var(--glass-border)' }}>
                      <option value="">{locale === 'ar' ? 'نوع الشركة *' : 'Company Type *'}</option>
                      <option value="GOVERNMENT">{locale === 'ar' ? 'حكومية' : 'Governmental'}</option>
                      <option value="PRIVATE">{locale === 'ar' ? 'قطاع خاص' : 'Private Sector'}</option>
                      <option value="MIXED">{locale === 'ar' ? 'قطاع مشترك' : 'Mixed Sector'}</option>
                    </select>
                    {errors.company_type && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.company_type}</div>}
                  </div>
                  {renderInput('industry', locale === 'ar' ? 'مجال النشاط *' : 'Industry *')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'تاريخ التأسيس' : 'Foundation Date'}</label>
                    <input type="date" name="date_of_birth" value={clientForm.date_of_birth} onChange={handleClientInput} style={inputStyle} />
                  </div>
                  {renderInput('chamber_of_commerce', locale === 'ar' ? 'رقم غرفة التجارة (إن وجد)' : 'Chamber of Commerce (if any)')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('registration_number', locale === 'ar' ? 'رقم التسجيل في دائرة تسجيل الشركات' : 'Company Registration Number')}
                  {renderInput('governorate', locale === 'ar' ? 'المحافظة *' : 'Governorate *')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'الحالة' : 'Status'}</label>
                    <select name="status" value={clientForm.status} onChange={handleClientInput} style={inputStyle}>
                      <option value="LEAD">{locale === 'ar' ? 'عميل محتمل' : 'Lead'}</option>
                      <option value="ACTIVE">{locale === 'ar' ? 'عميل نشط' : 'Active Client'}</option>
                      <option value="INACTIVE">{locale === 'ar' ? 'عميل غير نشط' : 'Inactive Client'}</option>
                    </select>
                  </div>
                </div>
                {renderInput('email', locale === 'ar' ? 'البريد الإلكتروني الرسمي *' : 'Official Email *', 'email')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('phone', locale === 'ar' ? 'رقم الموبايل *' : 'Mobile Number *', 'text', { maxLength: 11 })}
                  {renderInput('phone2', locale === 'ar' ? 'رقم هاتف إضافي' : 'Additional Phone', 'text', { maxLength: 11 })}
                </div>
                <div>
                  <textarea name="address" placeholder={locale === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'} value={clientForm.address} onChange={handleClientInput} style={{ ...inputStyle, width: '100%', minHeight: '70px', resize: 'vertical' }} />
                </div>
              </>
            )}
            {/* Document Uploads */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{locale === 'ar' ? 'تحديث وثائق الهوية (اتركها فارغة للإبقاء على الحالية)' : 'Update ID Documents (Leave empty to keep current)'}</div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>{locale === 'ar' ? 'صورة الهوية (الأمام)' : 'ID Image (Front)'}</label>
                  <input type="file" accept="image/*" onChange={e => setIdFront(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.4rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>{locale === 'ar' ? 'صورة الهوية (الخلف)' : 'ID Image (Back)'}</label>
                  <input type="file" accept="image/*" onChange={e => setIdBack(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.4rem' }} />
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>{locale === 'ar' ? 'وثائق أخرى' : 'Other Documents'}</label>
                <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => setOtherDocs(e.target.files?.[0] || null)} style={{ ...inputStyle, padding: '0.4rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>حفظ التعديلات</button>
              <button type="button" onClick={() => setIsEditClientOpen(false)} style={{ flex: 1, ...inputStyle, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)' }}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}


      {/* Add Communication Modal */}
      {isAddCommOpen && selectedClient && (
        <Modal title={`إضافة تواصل مع ${selectedClient.first_name}`} onClose={() => setIsAddCommOpen(false)}>
          <form onSubmit={handleAddComm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select name="type" value={commForm.type} onChange={e => setCommForm(prev => ({ ...prev, type: e.target.value }))} style={inputStyle}>
              <option value="CALL">{locale === 'ar' ? 'مكالمة هاتفية' : 'Phone Call'}</option>
              <option value="EMAIL">{locale === 'ar' ? 'بريد إلكتروني' : 'Email'}</option>
              <option value="MEETING">{locale === 'ar' ? 'اجتماع' : 'Meeting'}</option>
            </select>
            <textarea name="notes" placeholder={locale === 'ar' ? 'ملاحظات التواصل...' : 'Communication Notes...'} value={commForm.notes} onChange={e => setCommForm(prev => ({ ...prev, notes: e.target.value }))} required style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>{locale === 'ar' ? 'حفظ' : 'Save'}</button>
              <button type="button" onClick={() => setIsAddCommOpen(false)} style={{ flex: 1, ...inputStyle, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)' }}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renew Policy Modal */}
      {isRenewPolicyOpen && selectedPolicy && (
        <Modal title={`تجديد الوثيقة: ${selectedPolicy.policy_number}`} onClose={() => setIsRenewPolicyOpen(false)}>
          <form onSubmit={handleRenewPolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>يرجى إدخال البيانات الجديدة لتجديد الوثيقة.</p>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'تاريخ البدء الجديد' : 'New Start Date'}</label>
              <input type="date" value={renewForm.start_date} onChange={e => setRenewForm(prev => ({ ...prev, start_date: e.target.value }))} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'تاريخ الانتهاء الجديد' : 'New End Date'}</label>
              <input type="date" value={renewForm.end_date} onChange={e => setRenewForm(prev => ({ ...prev, end_date: e.target.value }))} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>مبلغ القسط الجديد</label>
              <input type="number" placeholder="مثال: 5000" value={renewForm.premium_amount} onChange={e => setRenewForm(prev => ({ ...prev, premium_amount: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>{locale === 'ar' ? 'تأكيد التجديد' : 'Confirm Renewal'}</button>
              <button type="button" onClick={() => setIsRenewPolicyOpen(false)} style={{ flex: 1, ...inputStyle, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)' }}>إلغاء</button>
            </div>
          </form>
        </Modal>
      )}

      {successMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%', border: '1px solid var(--glass-border)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
              ✓
            </div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>{successMessage}</h3>
            <button onClick={() => setSuccessMessage('')} className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}>{locale === 'ar' ? 'حسناً' : 'OK'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, backdropFilter: 'blur(5px)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem', animation: 'fadeInUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
