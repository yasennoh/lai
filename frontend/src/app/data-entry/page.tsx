"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../components/LanguageContext';

const API = 'https://ynoah.pythonanywhere.com/api/crm';
const inp: React.CSSProperties = { padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: '0.95rem' };

interface Client { id: number; first_name: string; second_name: string; third_name: string; last_name: string; email: string; phone: string; client_type?: string; address?: string; }

export default function DataEntry() {
  const { t, locale } = useLanguage();
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tab, setTab] = useState<'client' | 'policy' | 'claim'>('client');
  const [msg, setMsg] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brokers, setBrokers] = useState<any[]>([]);
  const router = useRouter();

  // Dynamic lists based on current locale
  const typeL: Record<string, string> = locale === 'ar'
    ? { AUTO: 'سيارات', HEALTH: 'صحي', LIFE: 'حياة', PROPERTY: 'ممتلكات', TRAVEL: 'سفر', MARINE: 'بحري', FIRE: 'حريق', LIABILITY: 'مسؤولية', ENGINEERING: 'هندسي' }
    : { AUTO: 'Motor', HEALTH: 'Health', LIFE: 'Life', PROPERTY: 'Property', TRAVEL: 'Travel', MARINE: 'Marine', FIRE: 'Fire', LIABILITY: 'Liability', ENGINEERING: 'Engineering' };

  const freqL: Record<string, string> = locale === 'ar'
    ? { MONTHLY: 'شهري', QUARTERLY: 'ربع سنوي', SEMI_ANNUAL: 'نصف سنوي', ANNUAL: 'سنوي', ONE_TIME: 'دفعة واحدة' }
    : { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', SEMI_ANNUAL: 'Semi-Annual', ANNUAL: 'Annual', ONE_TIME: 'One Time' };

  const payL: Record<string, string> = locale === 'ar'
    ? { CASH: 'نقدي', BANK_TRANSFER: 'تحويل بنكي', CREDIT_CARD: 'بطاقة ائتمان', CHECK: 'شيك' }
    : { CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', CREDIT_CARD: 'Credit Card', CHECK: 'Cheque' };

  const blankClient = { first_name: '', second_name: '', third_name: '', last_name: '', mother_name: '', grandfather_name: '', email: '', phone: '', phone2: '', address: '', date_of_birth: '', national_id: '', client_type: 'INDIVIDUAL', status: 'ACTIVE', company_name: '', company_type: '', industry: '', chamber_of_commerce: '', registration_number: '', governorate: '', gender: '', passport_number: '', id_issue_date: '', id_issue_place: '', place_of_birth: '', employment_type: '', job_title: '', annual_income: '', source_of_funds: '', ceo_name: '', company_nationality: '', num_branches: '', num_employees: '', registration_date: '', authorized_capital: '', paid_capital: '', company_annual_income: '', postal_code: '', po_box: '' };
  const blankPolicy = { client: '', policy_number: '', policy_type: 'AUTO', premium_amount: '0', coverage_amount: '', deductible: '0', start_date: '', end_date: '', status: 'PENDING', payment_frequency: 'ANNUAL', payment_method: 'CASH', beneficiary_name: '', beneficiary_relation: '', beneficiary_phone: '', insured_item_details: '', notes: '', currency: 'IQD', net_premium: '0', stamp_duty_percentage: '0', stamp_duty_amount: '0', diwan_fee_percentage: '0', diwan_fee_amount: '0', admin_fees: '0', total_amount: '0', terms_and_conditions: '', exclusions: '', broker: '', commission_percentage: '0', commission_amount: '0', vehicles: [{ plate_number: '', chassis_no: '', engine_no: '', type: '', model: '', year: '', color: '' }], health_coverage_details: { annual_limit: '', surgeries: '', medicines: '', emergency: '', dental: '', hospitals: '', clinics: '', pharmacies: '' }, family_members: [], property_details: { location: '', property_type: '', area: '', furniture: '', appliances: '', equipment: '', fire_cover: false, theft_cover: false, natural_disasters_cover: false, building_value: '', contents_value: '' }, engineering_details: { project_name: '', project_location: '', project_duration: '', installation_risks_cover: false, operation_risks_cover: false, breakdown_risks_cover: false }, engineering_equipment: [] };

  const [clientForm, setClientForm] = useState(blankClient);
  const [policyForm, setPolicyForm] = useState(blankPolicy);
  const blankClaim = { policy: '', claim_amount: '', description: '', status: 'PENDING' };
  const [claimForm, setClaimForm] = useState(blankClaim);
  const [policySearch, setPolicySearch] = useState('');
  const [showPolicyDropdown, setShowPolicyDropdown] = useState(false);
  const [idImageFront, setIdImageFront] = useState<File | null>(null);
  const [idImageBack, setIdImageBack] = useState<File | null>(null);
  const [otherDocuments, setOtherDocuments] = useState<File | null>(null);
  const [annualFinancials, setAnnualFinancials] = useState<File | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const getClientName = (c: any) => {
    if (!c) return '';
    return c.client_type === 'CORPORATE' ? (c.company_name || '') : `${c.first_name || ''} ${c.second_name || ''} ${c.last_name || ''}`.trim();
  };

  const docLabels = locale === 'ar' ? {
    idFront: 'صورة الهوية (الوجه الأمامي) / السجل التجاري',
    idBack: 'صورة الهوية (الوجه الخلفي) - اختياري',
    otherDocs: 'وثائق ومستندات أخرى - اختياري',
    uploadSec: 'الهوية والوثائق الثبوتية',
    financials: 'بيانات الشركة المالية السنوية - اختياري',
  } : {
    idFront: 'ID Front Image / Commercial Register',
    idBack: 'ID Back Image (Optional)',
    otherDocs: 'Other Documents (Optional)',
    uploadSec: 'Identity & Supporting Documents',
    financials: 'Annual Financial Statements (Optional)',
  };

  const renderFileInput = (label: string, file: File | null, onChange: (file: File | null) => void) => (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.05)',
        border: file ? '1px solid var(--secondary)' : '1px dashed var(--glass-border)',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minHeight: '43px'
      }}>
        <input 
          type="file" 
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer'
          }} 
        />
        <span style={{ fontSize: '0.85rem', color: file ? 'var(--secondary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
          {file ? file.name : (locale === 'ar' ? 'اختر ملفاً أو اسحبه هنا...' : 'Choose file or drag here...')}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'white', background: file ? 'var(--secondary)' : 'var(--text-muted)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
          {locale === 'ar' ? 'تصفح' : 'Browse'}
        </span>
      </div>
    </div>
  );

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    fetch(`${API}/clients/`).then(r => r.json()).then(setClients);
    fetch(`${API}/policies/`).then(r => r.json()).then(setPolicies);
    fetch(`${API}/templates/`).then(r => r.json()).then(setTemplates);
    fetch(`${API}/brokers/`).then(r => r.json()).then(setBrokers);
  }, []);

  const insertTemplate = (text: string, field: 'terms_and_conditions' | 'exclusions') => {
    if (!text) return;
    setPolicyForm((prev: any) => ({ ...prev, [field]: prev[field] ? prev[field] + '\n\n' + text : text }));
  };

  useEffect(() => {
    if (policyForm.net_premium !== undefined) {
      const net = parseFloat(policyForm.net_premium) || 0;
      const sd_pct = parseFloat(policyForm.stamp_duty_percentage) || 0;
      const df_pct = parseFloat(policyForm.diwan_fee_percentage) || 0;
      const admin = parseFloat(policyForm.admin_fees) || 0;
      const comm_pct = parseFloat(policyForm.commission_percentage) || 0;

      const sd_amt = (net * (sd_pct / 100)).toFixed(2);
      const df_amt = (net * (df_pct / 100)).toFixed(2);
      const total = (net + parseFloat(sd_amt) + parseFloat(df_amt) + admin).toFixed(2);

      let comm_amt = parseFloat(policyForm.commission_amount) || 0;
      if (comm_pct > 0) {
        comm_amt = net * (comm_pct / 100);
      }
      const comm_amt_str = comm_amt.toFixed(2);

      if (
        policyForm.stamp_duty_amount !== sd_amt ||
        policyForm.diwan_fee_amount !== df_amt ||
        policyForm.total_amount !== total ||
        policyForm.commission_amount !== comm_amt_str
      ) {
        setPolicyForm((prev: any) => ({
          ...prev,
          stamp_duty_amount: sd_amt,
          diwan_fee_amount: df_amt,
          total_amount: total,
          premium_amount: total,
          commission_amount: comm_amt_str
        }));
      }
    }
  }, [policyForm.net_premium, policyForm.stamp_duty_percentage, policyForm.diwan_fee_percentage, policyForm.admin_fees, policyForm.commission_percentage]);

  const addVehicle = () => {
    setPolicyForm((prev: any) => ({
      ...prev,
      vehicles: [...(prev.vehicles || []), { plate_number: '', chassis_no: '', engine_no: '', type: '', model: '', year: '', color: '' }]
    }));
  };

  const removeVehicle = (index: number) => {
    setPolicyForm((prev: any) => {
      const newVehicles = [...(prev.vehicles || [])];
      newVehicles.splice(index, 1);
      return { ...prev, vehicles: newVehicles };
    });
  };

  const onVehicleChange = (index: number, field: string, value: string) => {
    setPolicyForm((prev: any) => {
      const newVehicles = [...(prev.vehicles || [])];
      newVehicles[index] = { ...newVehicles[index], [field]: value };
      return { ...prev, vehicles: newVehicles };
    });
  };

  const onHealthCoverageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPolicyForm((prev: any) => ({
      ...prev,
      health_coverage_details: { ...prev.health_coverage_details, [name]: value }
    }));
  };

  const onPropertyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setPolicyForm((prev: any) => ({
      ...prev,
      property_details: { ...prev.property_details, [name]: val }
    }));
  };

  const onEngineeringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setPolicyForm((prev: any) => ({
      ...prev,
      engineering_details: { ...prev.engineering_details, [name]: val }
    }));
  };

  const addEngineeringEquipment = () => {
    setPolicyForm((prev: any) => ({
      ...prev,
      engineering_equipment: [...(prev.engineering_equipment || []), { type: '', value: '' }]
    }));
  };

  const removeEngineeringEquipment = (index: number) => {
    setPolicyForm((prev: any) => {
      const newEq = [...(prev.engineering_equipment || [])];
      newEq.splice(index, 1);
      return { ...prev, engineering_equipment: newEq };
    });
  };

  const onEngineeringEquipmentChange = (index: number, field: string, value: string) => {
    setPolicyForm((prev: any) => {
      const newEq = [...(prev.engineering_equipment || [])];
      newEq[index] = { ...newEq[index], [field]: value };
      return { ...prev, engineering_equipment: newEq };
    });
  };

  const addFamilyMember = () => {
    setPolicyForm((prev: any) => ({
      ...prev,
      family_members: [...(prev.family_members || []), { relation: '', name: '', age: '' }]
    }));
  };

  const removeFamilyMember = (index: number) => {
    setPolicyForm((prev: any) => {
      const newMembers = [...(prev.family_members || [])];
      newMembers.splice(index, 1);
      return { ...prev, family_members: newMembers };
    });
  };

  const onFamilyMemberChange = (index: number, field: string, value: string) => {
    setPolicyForm((prev: any) => {
      const newMembers = [...(prev.family_members || [])];
      newMembers[index] = { ...newMembers[index], [field]: value };
      return { ...prev, family_members: newMembers };
    });
  };

  const refreshClients = () => fetch(`${API}/clients/`).then(r => r.json()).then(setClients);

  const onClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    if (e.target.name === 'national_id') {
      const val = e.target.value.replace(/\D/g, '');
      setClientForm(p => ({ ...p, [e.target.name]: val }));
      return;
    }
    setClientForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (clientForm.client_type === 'INDIVIDUAL') {
      if (!clientForm.first_name) errs.first_name = t('required');
      if (!clientForm.second_name) errs.second_name = t('required');
      if (!clientForm.third_name) errs.third_name = t('required');
    } else {
      if (!clientForm.company_name) errs.company_name = t('required');
    }

    if (!clientForm.phone) {
      errs.phone = t('required');
    } else if (clientForm.phone.length !== 11) {
      errs.phone = t('phoneLengthError');
    } else if (clients.some(c => c.phone === clientForm.phone)) {
      errs.phone = t('phoneDuplicateError');
    }

    if (clientForm.phone2 && clientForm.phone2.length !== 11) errs.phone2 = t('phoneLengthError');
    if (clientForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientForm.email)) errs.email = t('emailInvalidError');
    if (!clientForm.address) errs.address = t('addressRequired');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const renderInput = (name: string, placeholder: string, type: string = "text", extraProps: any = {}) => (
    <div style={{ flex: 1 }}>
      <input type={type} name={name} placeholder={placeholder} value={(clientForm as any)[name]} onChange={onClientChange} style={{ ...inp, border: errors[name] ? '1px solid #EF4444' : '1px solid var(--glass-border)' }} {...extraProps} />
      {errors[name] && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors[name]}</div>}
    </div>
  );

  const onPolicyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'broker') {
      const selectedBroker = brokers.find(b => b.id.toString() === value);
      setPolicyForm(p => {
        const currentPercentage = parseFloat(p.commission_percentage) || 0;
        let newCommAmount = p.commission_amount;
        if (!value) {
          newCommAmount = '0';
        } else if (selectedBroker && currentPercentage === 0) {
          newCommAmount = selectedBroker.default_commission_amount || '0';
        }
        return { ...p, broker: value, commission_amount: newCommAmount };
      });
    } else {
      setPolicyForm(p => ({ ...p, [name]: value }));
    }
  };

  const submitClient = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const formData = new FormData();
    Object.entries(clientForm).forEach(([k, v]) => {
      if (k === 'status') return;
      if (v !== '' && v !== null && v !== undefined) {
        formData.append(k, v);
      }
    });
    formData.append('status', forceStatus || clientForm.status || 'ACTIVE');
    
    if (idImageFront) formData.append('id_image_front', idImageFront);
    if (idImageBack) formData.append('id_image_back', idImageBack);
    if (otherDocuments) formData.append('other_documents', otherDocuments);
    if (annualFinancials) formData.append('annual_financials', annualFinancials);
    if (user) formData.append('created_by', user.id.toString());

    const res = await fetch(`${API}/clients/`, { 
      method: 'POST', 
      body: formData 
    });

    if (res.ok) {
      setSuccessMessage('تم إضافة عميل بنجاح');
      setClientForm(blankClient);
      setIdImageFront(null);
      setIdImageBack(null);
      setOtherDocuments(null);
      setAnnualFinancials(null);
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => { input.value = ''; });
      refreshClients();
    } else {
      try {
        const errJson = await res.json();
        setMsg(`${t('saveError')}: ${JSON.stringify(errJson)}`);
      } catch (e) {
        setMsg(t('saveError'));
      }
    }
  };

  const submitPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend: any = { ...policyForm };
    if (user) dataToSend.created_by = user.id;
    const res = await fetch(`${API}/policies/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) });
    if (res.ok) {
      setSuccessMessage('تم ارسال الوثيقة للموافقة');
      setPolicyForm(blankPolicy);
      setClientSearch('');
    } else {
      setMsg(t('saveError'));
    }
  };

  const onClaimChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setClaimForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend: any = { 
      ...claimForm,
      claim_number: 'CLM-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000)
    };
    const res = await fetch(`${API}/claims/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) });
    if (res.ok) {
      setSuccessMessage('تم إضافة المطالبة بنجاح');
      setClaimForm(blankClaim);
      setPolicySearch('');
    } else {
      setMsg(t('saveError'));
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{t('dataEntryTitle')}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('dashboard')} / {t('dataEntry')}</span>
      </div>

      {msg && <div style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: msg.includes('✅') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.includes('✅') ? '#10B981' : '#EF4444', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('client')} style={{ padding: '0.7rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1rem', background: tab === 'client' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: tab === 'client' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>{t('addClient')}</button>
        <button onClick={() => setTab('policy')} style={{ padding: '0.7rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1rem', background: tab === 'policy' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: tab === 'policy' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>{t('issuePolicy')}</button>
        <button onClick={() => setTab('claim')} style={{ padding: '0.7rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: '1rem', background: tab === 'claim' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: tab === 'claim' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>{t('addClaim')}</button>
      </div>

      {tab === 'client' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '700px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>{clientForm.client_type === 'CORPORATE' ? t('addCompanyNew') : t('addClientNew')}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button onClick={() => setClientForm({ ...clientForm, client_type: 'INDIVIDUAL' })} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', flex: 1, background: clientForm.client_type === 'INDIVIDUAL' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: clientForm.client_type === 'INDIVIDUAL' ? 'white' : 'var(--text-muted)' }}>{t('individual')}</button>
            <button onClick={() => setClientForm({ ...clientForm, client_type: 'CORPORATE' })} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', flex: 1, background: clientForm.client_type === 'CORPORATE' ? 'var(--secondary)' : 'rgba(0,0,0,0.05)', color: clientForm.client_type === 'CORPORATE' ? 'white' : 'var(--text-muted)' }}>{t('corporate')}</button>
          </div>
          <form onSubmit={submitClient} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {clientForm.client_type === 'INDIVIDUAL' ? (
              <>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('first_name', t('firstName'))}
                  {renderInput('second_name', t('secondName'))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('third_name', t('thirdName'))}
                  {renderInput('last_name', t('lastName'))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('mother_name', t('motherName'))}
                  {renderInput('grandfather_name', t('grandfatherName'))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <select name="gender" value={clientForm.gender} onChange={onClientChange} style={inp}>
                      <option value="">{locale === 'ar' ? 'الجنس' : 'Gender'}</option>
                      <option value="MALE">{locale === 'ar' ? 'ذكر' : 'Male'}</option>
                      <option value="FEMALE">{locale === 'ar' ? 'أنثى' : 'Female'}</option>
                    </select>
                  </div>
                  {renderInput('passport_number', locale === 'ar' ? 'رقم جواز السفر' : 'Passport Number')}
                </div>
                {renderInput('national_id', t('nationalId'), 'text', { pattern: '\\d*', title: 'الرجاء إدخال أرقام فقط' })}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'تاريخ إصدار الهوية' : 'ID Issue Date'}</label>
                    <input type="date" name="id_issue_date" value={clientForm.id_issue_date} onChange={onClientChange} style={inp} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'مكان إصدار الهوية' : 'ID Issue Place'}</label>
                    <input type="text" name="id_issue_place" placeholder={locale === 'ar' ? 'مكان إصدار الهوية' : 'ID Issue Place'} value={clientForm.id_issue_place} onChange={onClientChange} style={inp} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{t('dob')}</label>
                    <input type="date" name="date_of_birth" value={clientForm.date_of_birth} onChange={onClientChange} style={inp} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>{locale === 'ar' ? 'مكان الميلاد' : 'Place of Birth'}</label>
                    <input type="text" name="place_of_birth" placeholder={locale === 'ar' ? 'مكان الميلاد' : 'Place of Birth'} value={clientForm.place_of_birth} onChange={onClientChange} style={inp} />
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '1rem' }}>
                    {locale === 'ar' ? 'معلومات العمل والوظيفة' : 'Employment Information'}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <select name="employment_type" value={clientForm.employment_type} onChange={onClientChange} style={inp}>
                      <option value="">{locale === 'ar' ? 'نوع العمل' : 'Type of Work'}</option>
                      <option value="GOVERNMENT">{locale === 'ar' ? 'قطاع حكومي' : 'Government Sector'}</option>
                      <option value="PRIVATE">{locale === 'ar' ? 'قطاع خاص' : 'Private Sector'}</option>
                      <option value="FREE">{locale === 'ar' ? 'أعمال حرة / تجارة' : 'Self-Employed / Business'}</option>
                      <option value="RETIRED">{locale === 'ar' ? 'متقاعد' : 'Retired'}</option>
                      <option value="UNEMPLOYED">{locale === 'ar' ? 'بلا عمل / طالب' : 'Unemployed / Student'}</option>
                    </select>
                  </div>
                  {renderInput('job_title', locale === 'ar' ? 'المسمى الوظيفي' : 'Job Title')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('annual_income', locale === 'ar' ? 'الدخل السنوي' : 'Annual Income')}
                  {renderInput('source_of_funds', locale === 'ar' ? 'مصادر الأموال' : 'Source of Funds')}
                </div>

                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '1rem' }}>
                    {locale === 'ar' ? 'معلومات الاتصال والعنوان' : 'Contact & Address Information'}
                  </h3>
                </div>
                {renderInput('email', t('email'), 'email')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('phone', t('phone'), 'text', { maxLength: 11 })}
                  {renderInput('phone2', t('phone2'), 'text', { maxLength: 11 })}
                </div>
                <div>
                  <textarea name="address" placeholder={t('address')} value={clientForm.address} onChange={onClientChange} style={{ ...inp, width: '100%', minHeight: '70px', resize: 'vertical', border: errors.address ? '1px solid #EF4444' : '1px solid var(--glass-border)' }} />
                  {errors.address && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.address}</div>}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem', marginTop: '0.5rem' }}>{docLabels.uploadSec}</div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderFileInput(docLabels.idFront, idImageFront, setIdImageFront)}
                  {renderFileInput(docLabels.idBack, idImageBack, setIdImageBack)}
                </div>
                <div>
                  {renderFileInput(docLabels.otherDocs, otherDocuments, setOtherDocuments)}
                </div>
              </>
            ) : (
              <>
                {/* 1. البيانات الأساسية للشركة */}
                <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '1rem' }}>
                  {locale === 'ar' ? 'البيانات الأساسية للشركة' : 'Basic Company Information'}
                </h3>
                {renderInput('company_name', t('companyName'))}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <select name="company_type" value={clientForm.company_type} onChange={onClientChange} style={{ ...inp, border: errors.company_type ? '1px solid #EF4444' : '1px solid var(--glass-border)' }}>
                      <option value="">{t('companyType')}</option>
                      <option value="GOVERNMENT">{t('government')}</option>
                      <option value="PRIVATE">{t('privateSec')}</option>
                      <option value="MIXED">{t('mixed')}</option>
                    </select>
                    {errors.company_type && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{errors.company_type}</div>}
                  </div>
                  {renderInput('industry', t('industry'))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('ceo_name', locale === 'ar' ? 'اسم المدير التنفيذي' : 'CEO Name')}
                  {renderInput('company_nationality', locale === 'ar' ? 'جنسية الشركة' : 'Company Nationality')}
                </div>

                {/* 2. بيانات التسجيل والترخيص */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '1rem' }}>
                    {locale === 'ar' ? 'بيانات التسجيل والترخيص' : 'Registration & Licensing'}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('registration_number', t('registrationNumber'))}
                  {renderInput('chamber_of_commerce', t('chamberOfCommerce'))}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      {locale === 'ar' ? 'تاريخ التأسيس' : 'Foundation Date'}
                    </label>
                    <input type="date" name="date_of_birth" value={clientForm.date_of_birth} onChange={onClientChange} style={inp} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      {locale === 'ar' ? 'تاريخ التسجيل' : 'Registration Date'}
                    </label>
                    <input type="date" name="registration_date" value={clientForm.registration_date} onChange={onClientChange} style={inp} />
                  </div>
                </div>

                {/* 3. بيانات التشغيل والمالية */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '1rem' }}>
                    {locale === 'ar' ? 'بيانات التشغيل والمالية' : 'Operational & Financial Information'}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('num_employees', locale === 'ar' ? 'عدد الموظفين' : 'Number of Employees', 'number')}
                  {renderInput('num_branches', locale === 'ar' ? 'عدد الفروع' : 'Number of Branches', 'number')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('authorized_capital', locale === 'ar' ? 'رأس المال المصرح به' : 'Authorized Capital')}
                  {renderInput('paid_capital', locale === 'ar' ? 'رأس المال المدفوع' : 'Paid-up Capital')}
                </div>
                {renderInput('company_annual_income', locale === 'ar' ? 'الدخل السنوي للشركة' : 'Company Annual Income')}

                {/* 4. بيانات الاتصال والعنوان */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '1rem' }}>
                    {locale === 'ar' ? 'بيانات الاتصال والعنوان' : 'Contact & Address Information'}
                  </h3>
                </div>
                {renderInput('email', t('officialEmail'), 'email')}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('phone', t('officialPhone'), 'text', { maxLength: 11 })}
                  {renderInput('phone2', t('phone2'), 'text', { maxLength: 11 })}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('governorate', t('governorate'))}
                  {renderInput('postal_code', locale === 'ar' ? 'الرمز البريدي' : 'Postal Code')}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderInput('po_box', locale === 'ar' ? 'رقم صندوق البريد' : 'PO Box Number')}
                  <div style={{ flex: 1 }}></div>
                </div>
                <div>
                  <textarea name="address" placeholder={t('detailedAddress')} value={clientForm.address} onChange={onClientChange} style={{ ...inp, width: '100%', minHeight: '70px', resize: 'vertical' }} />
                </div>

                {/* 5. الوثائق والقوائم المالية */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '1rem' }}>
                    {locale === 'ar' ? 'الوثائق والقوائم المالية' : 'Documents & Financial Statements'}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {renderFileInput(docLabels.otherDocs, otherDocuments, setOtherDocuments)}
                  {renderFileInput(docLabels.financials, annualFinancials, setAnnualFinancials)}
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem', fontSize: '1rem' }}>{t('saveClient')}</button>
              <button type="button" onClick={(e) => submitClient(e, 'LEAD')} style={{ flex: 1, padding: '0.85rem', fontSize: '1rem', background: 'transparent', border: '2px solid var(--secondary)', color: 'var(--secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{locale === 'ar' ? 'إضافة عميل محتمل' : 'Add Lead'}</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'policy' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '700px' }}>
          <h2 style={{ marginBottom: '0.3rem' }}>{t('policyIssueTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{t('policyApprovalNotice')}</p>
          <form onSubmit={submitPolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <style>{`
                .dropdown-item-hover:hover {
                  background-color: rgba(0, 0, 0, 0.05) !important;
                }
              `}</style>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={t('selectClient')}
                  value={clientSearch}
                  onFocus={() => setShowClientDropdown(true)}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                    if (!e.target.value) {
                      setPolicyForm(p => ({ ...p, client: '' }));
                    }
                  }}
                  style={{
                    ...inp,
                    paddingRight: locale === 'ar' ? '2.5rem' : '1rem',
                    paddingLeft: locale === 'ar' ? '1rem' : '2.5rem',
                    cursor: 'text',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowClientDropdown(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: locale === 'ar' ? 'auto' : '10px',
                    left: locale === 'ar' ? '10px' : 'auto',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.3rem',
                  }}
                >
                  ▼
                </button>
              </div>

              {showClientDropdown && (
                <>
                  <div
                    onClick={() => {
                      setShowClientDropdown(false);
                      const currentSelected = clients.find(c => c.id.toString() === policyForm.client.toString());
                      if (currentSelected) {
                        setClientSearch(getClientName(currentSelected));
                      } else {
                        setClientSearch('');
                      }
                    }}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--card-bg, #ffffff)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    marginTop: '0.3rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  }}>
                    {clients.filter(c => {
                      const name = getClientName(c).toLowerCase();
                      const phone = (c.phone || '').toLowerCase();
                      const query = clientSearch.toLowerCase();
                      return name.includes(query) || phone.includes(query);
                    }).length > 0 ? (
                      clients.filter(c => {
                        const name = getClientName(c).toLowerCase();
                        const phone = (c.phone || '').toLowerCase();
                        const query = clientSearch.toLowerCase();
                        return name.includes(query) || phone.includes(query);
                      }).map(c => {
                        const isSelected = policyForm.client.toString() === c.id.toString();
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setPolicyForm(p => ({ ...p, client: c.id.toString() }));
                              setClientSearch(getClientName(c));
                              setShowClientDropdown(false);
                            }}
                            style={{
                              padding: '0.7rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              color: isSelected ? 'white' : 'var(--text-main)',
                              backgroundColor: isSelected ? 'var(--secondary)' : 'transparent',
                              borderBottom: '1px solid var(--glass-border)',
                              transition: 'all 0.15s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                            className="dropdown-item-hover"
                          >
                            <span>{getClientName(c)}</span>
                            <span style={{ fontSize: '0.75rem', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                              {c.client_type === 'CORPORATE' ? (locale === 'ar' ? 'شركة' : 'Corporate') : (locale === 'ar' ? 'فرد' : 'Individual')}
                              {c.phone && ` • ${c.phone}`}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '0.7rem 1rem', fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {locale === 'ar' ? 'لا يوجد نتائج مطابقة' : 'No matching results'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
              {policyForm.client && clients.find(c => c.id.toString() === policyForm.client.toString()) && (
                <div style={{background:'rgba(0,0,0,0.02)', padding:'1rem', borderRadius:'8px', marginTop:'0.2rem', fontSize:'0.85rem'}}>
                  <div style={{fontWeight:'bold', marginBottom:'0.5rem', color:'var(--secondary)'}}>{locale === 'ar' ? 'بيانات المؤمن له' : 'Insured Information'}</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem'}}>
                    <div><span style={{color:'var(--text-muted)'}}>{locale === 'ar' ? 'الاسم:' : 'Name:'}</span> {getClientName(clients.find(c => c.id.toString() === policyForm.client.toString()))}</div>
                    <div><span style={{color:'var(--text-muted)'}}>{locale === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {clients.find(c => c.id.toString() === policyForm.client.toString())?.phone || '—'}</div>
                    <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--text-muted)'}}>{locale === 'ar' ? 'العنوان:' : 'Address:'}</span> {clients.find(c => c.id.toString() === policyForm.client.toString())?.address || '—'}</div>
                  </div>
                </div>
              )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{flex:1}}>
                <input name="policy_number" placeholder={locale === 'ar' ? 'رقم الوثيقة (تلقائي)' : 'Policy Number (Auto)'} value={policyForm.policy_number} readOnly style={{...inp, background: 'rgba(0,0,0,0.02)', color: 'var(--text-muted)'}} />
              </div>
              <div style={{flex:1}}>
                <select name="policy_type" value={policyForm.policy_type} onChange={onPolicyChange} style={inp}>{Object.entries(typeL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </div>
            </div>

            {policyForm.policy_type === 'AUTO' && (
              <div style={{background:'rgba(0,0,0,0.02)', padding:'1rem', borderRadius:'8px', marginTop:'0.5rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'1rem'}}>
                  <div style={{fontWeight:'bold', color:'var(--secondary)'}}>🔹 {locale === 'ar' ? 'بيانات المركبات' : 'Vehicles Data'}</div>
                  <button type="button" onClick={addVehicle} style={{background:'var(--primary)', color:'white', border:'none', padding:'0.4rem 0.8rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold'}}>
                    ➕ {locale === 'ar' ? 'إضافة مركبة أخرى' : 'Add Vehicle'}
                  </button>
                </div>
                
                {(policyForm.vehicles || []).map((v: any, index: number) => (
                  <div key={index} style={{ border: '1px dashed var(--glass-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', position: 'relative', background: 'var(--card-bg)' }}>
                    {policyForm.vehicles.length > 1 && (
                      <button type="button" onClick={() => removeVehicle(index)} style={{ position: 'absolute', top: '10px', right: locale === 'ar' ? 'auto' : '10px', left: locale === 'ar' ? '10px' : 'auto', background: '#EF4444', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                        🗑️
                      </button>
                    )}
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>{locale === 'ar' ? 'مركبة' : 'Vehicle'} #{index + 1}</div>
                    <div style={{display:'flex', gap:'1rem', marginBottom:'0.5rem', flexWrap: 'wrap'}}>
                      <div style={{flex: '1 1 200px'}}>
                        <input name="plate_number" placeholder={locale === 'ar' ? 'رقم اللوحة' : 'Plate Number'} value={v.plate_number} onChange={e => onVehicleChange(index, 'plate_number', e.target.value)} style={{...inp}} />
                      </div>
                      <div style={{flex: '1 1 200px'}}>
                        <input name="chassis_no" placeholder={locale === 'ar' ? 'رقم الشاصي (Chassis No)' : 'Chassis No'} value={v.chassis_no} onChange={e => onVehicleChange(index, 'chassis_no', e.target.value)} style={{...inp}} />
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'1rem', marginBottom:'0.5rem', flexWrap: 'wrap'}}>
                      <div style={{flex: '1 1 200px'}}>
                        <input name="engine_no" placeholder={locale === 'ar' ? 'رقم المحرك' : 'Engine Number'} value={v.engine_no} onChange={e => onVehicleChange(index, 'engine_no', e.target.value)} style={{...inp}} />
                      </div>
                      <div style={{flex: '1 1 200px'}}>
                        <input name="type" placeholder={locale === 'ar' ? 'نوع السيارة' : 'Car Type'} value={v.type} onChange={e => onVehicleChange(index, 'type', e.target.value)} style={{...inp}} />
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'1rem', flexWrap: 'wrap'}}>
                      <div style={{flex: '1 1 150px'}}>
                        <input name="model" placeholder={locale === 'ar' ? 'الموديل' : 'Model'} value={v.model} onChange={e => onVehicleChange(index, 'model', e.target.value)} style={{...inp}} />
                      </div>
                      <div style={{flex: '1 1 100px'}}>
                        <input type="number" name="year" placeholder={locale === 'ar' ? 'سنة الصنع' : 'Year'} value={v.year} onChange={e => onVehicleChange(index, 'year', e.target.value)} style={{...inp}} />
                      </div>
                      <div style={{flex: '1 1 150px'}}>
                        <input name="color" placeholder={locale === 'ar' ? 'لون السيارة' : 'Color'} value={v.color} onChange={e => onVehicleChange(index, 'color', e.target.value)} style={{...inp}} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {policyForm.policy_type === 'HEALTH' && (
              <div style={{background:'rgba(0,0,0,0.02)', padding:'1rem', borderRadius:'8px', marginTop:'0.5rem'}}>
                {/* Medical Coverage Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'التغطية الطبية' : 'Medical Coverage'}</div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'0.8rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="annual_limit" placeholder={locale === 'ar' ? 'سقف التغطية السنوي' : 'Annual Coverage Limit'} value={policyForm.health_coverage_details?.annual_limit || ''} onChange={onHealthCoverageChange} style={{...inp}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="surgeries" placeholder={locale === 'ar' ? 'تغطية العمليات' : 'Surgeries Coverage'} value={policyForm.health_coverage_details?.surgeries || ''} onChange={onHealthCoverageChange} style={{...inp}} />
                  </div>
                </div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'0.8rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="medicines" placeholder={locale === 'ar' ? 'تغطية الأدوية' : 'Medicines Coverage'} value={policyForm.health_coverage_details?.medicines || ''} onChange={onHealthCoverageChange} style={{...inp}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="emergency" placeholder={locale === 'ar' ? 'تغطية الطوارئ' : 'Emergency Coverage'} value={policyForm.health_coverage_details?.emergency || ''} onChange={onHealthCoverageChange} style={{...inp}} />
                  </div>
                </div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="dental" placeholder={locale === 'ar' ? 'تغطية الأسنان (إن وجدت)' : 'Dental Coverage (If any)'} value={policyForm.health_coverage_details?.dental || ''} onChange={onHealthCoverageChange} style={{...inp}} />
                  </div>
                </div>

                {/* Medical Network Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'الشبكة الطبية' : 'Medical Network'}</div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <textarea name="hospitals" placeholder={locale === 'ar' ? 'المستشفيات المعتمدة' : 'Approved Hospitals'} value={policyForm.health_coverage_details?.hospitals || ''} onChange={onHealthCoverageChange} style={{...inp, minHeight: '60px'}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <textarea name="clinics" placeholder={locale === 'ar' ? 'العيادات' : 'Clinics'} value={policyForm.health_coverage_details?.clinics || ''} onChange={onHealthCoverageChange} style={{...inp, minHeight: '60px'}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <textarea name="pharmacies" placeholder={locale === 'ar' ? 'الصيدليات' : 'Pharmacies'} value={policyForm.health_coverage_details?.pharmacies || ''} onChange={onHealthCoverageChange} style={{...inp, minHeight: '60px'}} />
                  </div>
                </div>

                {/* Family Members Section */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'1rem', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>
                  <div style={{fontWeight:'bold', color:'var(--secondary)'}}>🔹 {locale === 'ar' ? 'أفراد العائلة' : 'Family Members'}</div>
                  <button type="button" onClick={addFamilyMember} style={{background:'var(--primary)', color:'white', border:'none', padding:'0.4rem 0.8rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold'}}>
                    ➕ {locale === 'ar' ? 'إضافة فرد' : 'Add Member'}
                  </button>
                </div>
                
                {(policyForm.family_members || []).map((member: any, index: number) => (
                  <div key={index} style={{ border: '1px dashed var(--glass-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', position: 'relative', background: 'var(--card-bg)' }}>
                    <button type="button" onClick={() => removeFamilyMember(index)} style={{ position: 'absolute', top: '10px', right: locale === 'ar' ? 'auto' : '10px', left: locale === 'ar' ? '10px' : 'auto', background: '#EF4444', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                      🗑️
                    </button>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>{locale === 'ar' ? 'فرد' : 'Member'} #{index + 1}</div>
                    <div style={{display:'flex', gap:'1rem', flexWrap: 'wrap'}}>
                      <div style={{flex: '1 1 150px'}}>
                        <select value={member.relation} onChange={e => onFamilyMemberChange(index, 'relation', e.target.value)} style={{...inp}}>
                          <option value="">{locale === 'ar' ? 'صلة القرابة...' : 'Relation...'}</option>
                          <option value="SPOUSE">{locale === 'ar' ? 'الزوج / الزوجة' : 'Spouse'}</option>
                          <option value="CHILD">{locale === 'ar' ? 'طفل / طفلة' : 'Child'}</option>
                          <option value="PARENT">{locale === 'ar' ? 'أب / أم' : 'Parent'}</option>
                          <option value="OTHER">{locale === 'ar' ? 'أخرى' : 'Other'}</option>
                        </select>
                      </div>
                      <div style={{flex: '2 1 200px'}}>
                        <input placeholder={locale === 'ar' ? 'الاسم' : 'Name'} value={member.name} onChange={e => onFamilyMemberChange(index, 'name', e.target.value)} style={{...inp}} />
                      </div>
                      <div style={{flex: '1 1 100px'}}>
                        <input type="number" placeholder={locale === 'ar' ? 'العمر' : 'Age'} value={member.age} onChange={e => onFamilyMemberChange(index, 'age', e.target.value)} style={{...inp}} />
                      </div>
                    </div>
                  </div>
                ))}
                {(policyForm.family_members?.length === 0) && (
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem'}}>
                    {locale === 'ar' ? 'لا يوجد أفراد عائلة مضافين حالياً.' : 'No family members added.'}
                  </div>
                )}
              </div>
            )}

            {policyForm.policy_type === 'PROPERTY' && (
              <div style={{background:'rgba(0,0,0,0.02)', padding:'1rem', borderRadius:'8px', marginTop:'0.5rem'}}>
                {/* Property Data Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'بيانات العقار' : 'Property Data'}</div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'0.8rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="location" placeholder={locale === 'ar' ? 'الموقع' : 'Location'} value={policyForm.property_details?.location || ''} onChange={onPropertyChange} style={{...inp}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <select name="property_type" value={policyForm.property_details?.property_type || ''} onChange={onPropertyChange} style={{...inp}}>
                      <option value="">{locale === 'ar' ? 'نوع العقار...' : 'Property Type...'}</option>
                      <option value="HOUSE">{locale === 'ar' ? 'منزل' : 'House'}</option>
                      <option value="SHOP">{locale === 'ar' ? 'محل تجاري' : 'Shop'}</option>
                      <option value="FACTORY">{locale === 'ar' ? 'مصنع' : 'Factory'}</option>
                      <option value="OTHER">{locale === 'ar' ? 'أخرى' : 'Other'}</option>
                    </select>
                  </div>
                  <div style={{flex: '1 1 150px'}}>
                    <input name="area" placeholder={locale === 'ar' ? 'مساحة العقار' : 'Property Area'} value={policyForm.property_details?.area || ''} onChange={onPropertyChange} style={{...inp}} />
                  </div>
                </div>

                {/* Property Contents Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'محتويات العقار' : 'Property Contents'}</div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <textarea name="furniture" placeholder={locale === 'ar' ? 'الأثاث' : 'Furniture'} value={policyForm.property_details?.furniture || ''} onChange={onPropertyChange} style={{...inp, minHeight: '60px'}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <textarea name="appliances" placeholder={locale === 'ar' ? 'الأجهزة' : 'Appliances'} value={policyForm.property_details?.appliances || ''} onChange={onPropertyChange} style={{...inp, minHeight: '60px'}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <textarea name="equipment" placeholder={locale === 'ar' ? 'المعدات' : 'Equipment'} value={policyForm.property_details?.equipment || ''} onChange={onPropertyChange} style={{...inp, minHeight: '60px'}} />
                  </div>
                </div>

                {/* Covered Risks Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'الأخطار المغطاة' : 'Covered Risks'}</div>
                <div style={{display:'flex', gap:'2rem', marginBottom:'1.5rem', flexWrap: 'wrap', padding: '0.5rem 0'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem'}}>
                    <input type="checkbox" name="fire_cover" checked={!!policyForm.property_details?.fire_cover} onChange={onPropertyChange} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                    {locale === 'ar' ? 'الحريق' : 'Fire'}
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem'}}>
                    <input type="checkbox" name="theft_cover" checked={!!policyForm.property_details?.theft_cover} onChange={onPropertyChange} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                    {locale === 'ar' ? 'السرقة' : 'Theft'}
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem'}}>
                    <input type="checkbox" name="natural_disasters_cover" checked={!!policyForm.property_details?.natural_disasters_cover} onChange={onPropertyChange} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                    {locale === 'ar' ? 'الكوارث الطبيعية' : 'Natural Disasters'}
                  </label>
                </div>

                {/* Insurance Value Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'قيمة التأمين' : 'Insurance Value'}</div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'0.5rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <input type="number" step="0.01" name="building_value" placeholder={locale === 'ar' ? 'قيمة البناء' : 'Building Value'} value={policyForm.property_details?.building_value || ''} onChange={onPropertyChange} style={{...inp}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <input type="number" step="0.01" name="contents_value" placeholder={locale === 'ar' ? 'قيمة المحتويات' : 'Contents Value'} value={policyForm.property_details?.contents_value || ''} onChange={onPropertyChange} style={{...inp}} />
                  </div>
                </div>
              </div>
            )}

            {policyForm.policy_type === 'ENGINEERING' && (
              <div style={{background:'rgba(0,0,0,0.02)', padding:'1rem', borderRadius:'8px', marginTop:'0.5rem'}}>
                {/* Project Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'المشروع' : 'Project Data'}</div>
                <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap: 'wrap'}}>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="project_name" placeholder={locale === 'ar' ? 'اسم المشروع' : 'Project Name'} value={policyForm.engineering_details?.project_name || ''} onChange={onEngineeringChange} style={{...inp}} />
                  </div>
                  <div style={{flex: '1 1 200px'}}>
                    <input name="project_location" placeholder={locale === 'ar' ? 'موقع المشروع' : 'Project Location'} value={policyForm.engineering_details?.project_location || ''} onChange={onEngineeringChange} style={{...inp}} />
                  </div>
                  <div style={{flex: '1 1 150px'}}>
                    <input name="project_duration" placeholder={locale === 'ar' ? 'مدة المشروع' : 'Project Duration'} value={policyForm.engineering_details?.project_duration || ''} onChange={onEngineeringChange} style={{...inp}} />
                  </div>
                </div>

                {/* Covered Risks Section */}
                <div style={{fontWeight:'bold', marginBottom:'0.8rem', color:'var(--secondary)', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>🔹 {locale === 'ar' ? 'التغطية (الأخطار)' : 'Coverage (Risks)'}</div>
                <div style={{display:'flex', gap:'2rem', marginBottom:'1.5rem', flexWrap: 'wrap', padding: '0.5rem 0'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem'}}>
                    <input type="checkbox" name="installation_risks_cover" checked={!!policyForm.engineering_details?.installation_risks_cover} onChange={onEngineeringChange} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                    {locale === 'ar' ? 'أخطار التركيب' : 'Installation Risks'}
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem'}}>
                    <input type="checkbox" name="operation_risks_cover" checked={!!policyForm.engineering_details?.operation_risks_cover} onChange={onEngineeringChange} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                    {locale === 'ar' ? 'أخطار التشغيل' : 'Operation Risks'}
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem'}}>
                    <input type="checkbox" name="breakdown_risks_cover" checked={!!policyForm.engineering_details?.breakdown_risks_cover} onChange={onEngineeringChange} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                    {locale === 'ar' ? 'الأعطال' : 'Breakdowns'}
                  </label>
                </div>

                {/* Equipment Section */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'1rem', borderBottom:'1px dashed var(--glass-border)', paddingBottom:'0.5rem'}}>
                  <div style={{fontWeight:'bold', color:'var(--secondary)'}}>🔹 {locale === 'ar' ? 'المعدات' : 'Equipment'}</div>
                  <button type="button" onClick={addEngineeringEquipment} style={{background:'var(--primary)', color:'white', border:'none', padding:'0.4rem 0.8rem', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'bold'}}>
                    ➕ {locale === 'ar' ? 'إضافة معدة' : 'Add Equipment'}
                  </button>
                </div>
                
                {(policyForm.engineering_equipment || []).map((eq: any, index: number) => (
                  <div key={index} style={{ border: '1px dashed var(--glass-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', position: 'relative', background: 'var(--card-bg)' }}>
                    <button type="button" onClick={() => removeEngineeringEquipment(index)} style={{ position: 'absolute', top: '10px', right: locale === 'ar' ? 'auto' : '10px', left: locale === 'ar' ? '10px' : 'auto', background: '#EF4444', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                      🗑️
                    </button>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>{locale === 'ar' ? 'معدة' : 'Equipment'} #{index + 1}</div>
                    <div style={{display:'flex', gap:'1rem', flexWrap: 'wrap'}}>
                      <div style={{flex: '2 1 250px'}}>
                        <input placeholder={locale === 'ar' ? 'نوع المعدات' : 'Equipment Type'} value={eq.type} onChange={e => onEngineeringEquipmentChange(index, 'type', e.target.value)} style={{...inp}} />
                      </div>
                      <div style={{flex: '1 1 150px'}}>
                        <input type="number" step="0.01" placeholder={locale === 'ar' ? 'قيمتها' : 'Value'} value={eq.value} onChange={e => onEngineeringEquipmentChange(index, 'value', e.target.value)} style={{...inp}} />
                      </div>
                    </div>
                  </div>
                ))}
                {(policyForm.engineering_equipment?.length === 0) && (
                  <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem'}}>
                    {locale === 'ar' ? 'لا يوجد معدات مضافة حالياً.' : 'No equipment added.'}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}><div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{t('startDate')}</label><input type="date" name="start_date" value={policyForm.start_date} onChange={onPolicyChange} required style={inp} /></div><div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{t('endDate')}</label><input type="date" name="end_date" value={policyForm.end_date} onChange={onPolicyChange} required style={inp} /></div></div>

            <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>{locale === 'ar' ? 'التفاصيل المالية' : 'Financial Details'}</div>
            <div style={{display:'flex',gap:'1rem'}}>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'العملة' : 'Currency'}</label>
                <select name="currency" value={policyForm.currency} onChange={onPolicyChange} style={inp}>
                  <option value="IQD">{locale === 'ar' ? 'دينار' : 'IQD'}</option><option value="USD">{locale === 'ar' ? 'دولار' : 'USD'}</option>
                </select>
              </div>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'قسط الاشتراك الصافي *' : 'Net Premium *'}</label>
                <input type="number" step="0.01" name="net_premium" placeholder="0" value={policyForm.net_premium} onChange={onPolicyChange} required style={inp}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'1rem'}}>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'نسبة رسم الطابع (%)' : 'Stamp Duty (%)'}</label>
                <input type="number" step="0.01" name="stamp_duty_percentage" placeholder="0" value={policyForm.stamp_duty_percentage} onChange={onPolicyChange} style={inp}/>
              </div>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'مبلغ رسم الطابع' : 'Stamp Duty Amount'}</label>
                <input type="number" step="0.01" name="stamp_duty_amount" placeholder="0" value={policyForm.stamp_duty_amount} readOnly style={{...inp, background:'rgba(0,0,0,0.02)', color:'var(--text-muted)'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'1rem'}}>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'نسبة رسم الديوان (%)' : 'Diwan Fee (%)'}</label>
                <input type="number" step="0.01" name="diwan_fee_percentage" placeholder="0" value={policyForm.diwan_fee_percentage} onChange={onPolicyChange} style={inp}/>
              </div>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'مبلغ رسم الديوان' : 'Diwan Fee Amount'}</label>
                <input type="number" step="0.01" name="diwan_fee_amount" placeholder="0" value={policyForm.diwan_fee_amount} readOnly style={{...inp, background:'rgba(0,0,0,0.02)', color:'var(--text-muted)'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'1rem'}}>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'رسوم إدارية' : 'Admin Fees'}</label>
                <input type="number" step="0.01" name="admin_fees" placeholder="0" value={policyForm.admin_fees} onChange={onPolicyChange} style={inp}/>
              </div>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'المبلغ الكامل (مبلغ القسط)' : 'Total Amount'}</label>
                <input type="number" step="0.01" name="total_amount" placeholder="0" value={policyForm.total_amount} readOnly style={{...inp, background:'rgba(16,185,129,0.1)', color:'#10B981', fontWeight:'bold'}}/>
              </div>
            </div>

            <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>{locale === 'ar' ? 'المندوب والعمولة' : 'Agent & Commission'}</div>
            <div style={{display:'flex',gap:'1rem'}}>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{t('brokerSelect')}</label>
                <select name="broker" value={policyForm.broker || ''} onChange={onPolicyChange} style={inp}>
                  <option value="">{locale === 'ar' ? 'بدون مندوب' : 'No Agent'}</option>
                  {brokers.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{t('commissionPercentage')}</label>
                <input type="number" step="0.01" name="commission_percentage" placeholder="0" value={policyForm.commission_percentage || '0'} onChange={onPolicyChange} style={inp}/>
              </div>
              <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'مبلغ العمولة' : 'Commission Amount'}</label>
                <input type="number" step="0.01" name="commission_amount" placeholder="0" value={policyForm.commission_amount || '0'} onChange={onPolicyChange} style={inp} readOnly={parseFloat(policyForm.commission_percentage) > 0}/>
              </div>
            </div>

            <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>{locale === 'ar' ? 'التغطية والأقساط' : 'Coverage & Installments'}</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="number" step="0.01" name="coverage_amount" placeholder={t('coverageAmount')} value={policyForm.coverage_amount} onChange={onPolicyChange} style={inp} />
              <input type="number" step="0.01" name="deductible" placeholder={t('deductible')} value={policyForm.deductible} onChange={onPolicyChange} style={inp} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select name="payment_frequency" value={policyForm.payment_frequency} onChange={onPolicyChange} style={inp}>{Object.entries(freqL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <select name="payment_method" value={policyForm.payment_method} onChange={onPolicyChange} style={inp}>{Object.entries(payL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            
            <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>{locale === 'ar' ? 'المستفيد (اختياري)' : 'Beneficiary (Optional)'}</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input name="beneficiary_name" placeholder={t('beneficiaryName')} value={policyForm.beneficiary_name} onChange={onPolicyChange} style={inp} />
              <input name="beneficiary_relation" placeholder={t('beneficiaryRelation')} value={policyForm.beneficiary_relation} onChange={onPolicyChange} style={inp} />
            </div>

            <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>{locale === 'ar' ? 'تفاصيل إضافية' : 'Additional Details'}</div>
            <textarea name="insured_item_details" placeholder={t('insuredItemDetails')} value={policyForm.insured_item_details} onChange={onPolicyChange} style={{ ...inp, minHeight: '70px', resize: 'vertical' }} />
            
            <div style={{display:'flex',flexDirection:'column',gap:'0.2rem',marginTop:'0.5rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <label style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</label>
                <select onChange={e => { insertTemplate(e.target.value, 'terms_and_conditions'); e.target.value=''; }} style={{...inp, width:'auto', padding:'0.2rem', fontSize:'0.8rem'}}>
                  <option value="">{locale === 'ar' ? 'إدراج قالب...' : 'Insert template...'}</option>
                  {templates.filter(t => t.template_type === 'TERMS').map(t => <option key={t.id} value={t.content}>{t.title}</option>)}
                </select>
              </div>
              <textarea name="terms_and_conditions" placeholder={locale === 'ar' ? 'الشروط والأحكام...' : 'Terms and conditions...'} value={policyForm.terms_and_conditions} onChange={onPolicyChange} style={{ ...inp, minHeight: '70px', resize: 'vertical' }} />
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'0.2rem',marginTop:'0.5rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <label style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{locale === 'ar' ? 'الاستثناءات' : 'Exclusions'}</label>
                <select onChange={e => { insertTemplate(e.target.value, 'exclusions'); e.target.value=''; }} style={{...inp, width:'auto', padding:'0.2rem', fontSize:'0.8rem'}}>
                  <option value="">{locale === 'ar' ? 'إدراج قالب...' : 'Insert template...'}</option>
                  {templates.filter(t => t.template_type === 'EXCLUSIONS').map(t => <option key={t.id} value={t.content}>{t.title}</option>)}
                </select>
              </div>
              <textarea name="exclusions" placeholder={locale === 'ar' ? 'الاستثناءات...' : 'Exclusions...'} value={policyForm.exclusions} onChange={onPolicyChange} style={{ ...inp, minHeight: '70px', resize: 'vertical' }} />
            </div>

            <textarea name="notes" placeholder={t('notes')} value={policyForm.notes} onChange={onPolicyChange} style={{ ...inp, minHeight: '50px', resize: 'vertical', marginTop: '0.5rem' }} />
            <button type="submit" className="btn-primary" style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}>{t('submitApproval')}</button>
          </form>
        </div>
      )}

      {tab === 'claim' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '700px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>{t('addNewClaim')}</h2>
          <form onSubmit={submitClaim} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={locale === 'ar' ? 'ابحث برقم الوثيقة...' : 'Search by policy number...'}
                value={policySearch}
                onFocus={() => setShowPolicyDropdown(true)}
                onChange={e => {
                  setPolicySearch(e.target.value);
                  setShowPolicyDropdown(true);
                }}
                style={inp}
              />
              {showPolicyDropdown && policySearch && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, marginTop: '0.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {policies
                    .filter((p: any) => p.policy_number.toLowerCase().includes(policySearch.toLowerCase()))
                    .map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setClaimForm({ ...claimForm, policy: p.id.toString() });
                          setPolicySearch(p.policy_number);
                          setShowPolicyDropdown(false);
                        }}
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                      >
                        {p.policy_number}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="number" step="0.01" name="claim_amount" placeholder={t('claimAmount')} value={claimForm.claim_amount} onChange={onClaimChange} required style={inp} />
            </div>
            
            <textarea name="description" placeholder={t('claimDescription')} value={claimForm.description} onChange={onClaimChange} required style={{ ...inp, minHeight: '100px', resize: 'vertical' }} />

            <button type="submit" className="btn-primary" style={{ padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }} disabled={!claimForm.policy}>
              {t('addClaim')}
            </button>
          </form>
        </div>
      )}

      {successMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px', width: '90%', border: '1px solid var(--glass-border)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
              ✓
            </div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>{successMessage}</h3>
            <button onClick={() => setSuccessMessage('')} className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}>حسناً</button>
          </div>
        </div>
      )}
    </div>
  );
}
