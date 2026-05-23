"use client";
import { useEffect, useState, useRef } from 'react';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { useCurrency } from '../components/CurrencyContext';
import { useLanguage } from '../components/LanguageContext';
interface Policy {
  id: number; client: number; policy_number: string; policy_type: string;
  premium_amount: string; coverage_amount: string; deductible: string;
  start_date: string; end_date: string; status: string;
  payment_frequency: string; payment_method: string;
  beneficiary_name: string; beneficiary_relation: string; beneficiary_phone: string;
  insured_item_details: string; notes: string; created_at: string;
  created_by_name?: string; updated_by_name?: string;
  issue_date?: string; currency: string; net_premium: string;
  stamp_duty_percentage: string; stamp_duty_amount: string;
  diwan_fee_percentage: string; diwan_fee_amount: string;
  admin_fees: string; total_amount: string; terms_and_conditions: string; exclusions: string;
  broker?: number; broker_name?: string; commission_amount?: string; commission_percentage?: string;
  vehicles?: any[]; health_coverage_details?: any; family_members?: any[];
  property_details?: any; engineering_details?: any; engineering_equipment?: any[];
}
interface Client { id: number; first_name: string; second_name: string; third_name: string; last_name: string; national_id: string; phone: string; email: string; address: string; }

const API = 'https://ynoah.pythonanywhere.com/api/crm';
const inp: React.CSSProperties = { padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid var(--glass-border)', background:'rgba(0,0,0,0.05)', color:'var(--text-main)', outline:'none', width:'100%', fontFamily:'inherit', fontSize:'0.95rem' };

export default function Policies() {
  const { t, locale } = useLanguage();
  
  const typeLabels: Record<string,string> = { AUTO: t('typeAuto'), HEALTH: t('typeHealth'), LIFE: t('typeLife'), PROPERTY: t('typeProperty'), TRAVEL: t('typeTravel'), MARINE: t('typeMarine'), FIRE: t('typeFire'), LIABILITY: t('typeLiability'), ENGINEERING: t('typeEngineering') };
  const statusLabels: Record<string,string> = { ACTIVE: t('statusActive'), EXPIRED: t('statusExpired'), CANCELLED: t('statusCancelled'), PENDING: t('statusPending'), SUSPENDED: t('statusSuspended') };
  const freqLabels: Record<string,string> = { MONTHLY: t('freqMonthly'), QUARTERLY: t('freqQuarterly'), SEMI_ANNUAL: t('freqSemiAnnual'), ANNUAL: t('freqAnnual'), ONE_TIME: t('freqOneTime') };
  const payLabels: Record<string,string> = { CASH: t('payCash'), BANK_TRANSFER: t('payBank'), CREDIT_CARD: t('payCredit'), CHECK: t('payCheck') };
  
  const getTrueStatus = (p: Policy) => {
    if (p.status === 'EXPIRED') return 'EXPIRED';
    if (p.status === 'ACTIVE' && p.end_date) {
      const end = new Date(p.end_date);
      const now = new Date();
      end.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      if (end < now) return 'EXPIRED';
    }
    return p.status;
  };
  
  const statusColor = (s:string) => s==='ACTIVE'?'#10B981':s==='PENDING'?'#F59E0B':s==='EXPIRED'?'#64748B':'#EF4444';
  const { formatAmount } = useCurrency();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>({ company_phones_left: '', branches_phones_right: '' });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Policy|null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewForm, setRenewForm] = useState({ start_date: '', end_date: '', premium_amount: '' });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const printRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const blank = { client:'', policy_number:'', policy_type:'AUTO', premium_amount:'0', coverage_amount:'', deductible:'0', start_date:'', end_date:'', status:'ACTIVE', payment_frequency:'ANNUAL', payment_method:'CASH', beneficiary_name:'', beneficiary_relation:'', beneficiary_phone:'', insured_item_details:'', notes:'', currency:'IQD', net_premium:'0', stamp_duty_percentage:'0', stamp_duty_amount:'0', diwan_fee_percentage:'0', diwan_fee_amount:'0', admin_fees:'0', total_amount:'0', terms_and_conditions:'', exclusions:'', broker:'', commission_percentage:'0', commission_amount:'0' };
  const [form, setForm] = useState<any>(blank);
  const [isEditMode, setIsEditMode] = useState(false);

  const [userRole, setUserRole] = useState('');
  const fetchData = () => { setLoading(true); Promise.all([fetch(`${API}/policies/`).then(r=>r.json()), fetch(`${API}/clients/`).then(r=>r.json()), fetch(`${API}/templates/`).then(r=>r.json()), fetch(`${API}/settings/`).then(r=>r.json()), fetch(`${API}/brokers/`).then(r=>r.json())]).then(([p,c,t,s,b])=>{setPolicies(p);setClients(c);setTemplates(t);setSystemSettings(s);setBrokers(b);setLoading(false);}).catch(()=>setLoading(false)); };
  useEffect(()=>{
    const u = localStorage.getItem('user');
    if (u) setUserRole(JSON.parse(u).role);
    fetchData();
  },[]);

  const clientName = (id:number) => { const c=clients.find(x=>x.id===id); return c?`${c.first_name} ${c.second_name} ${c.third_name ? c.third_name + ' ' : ''}${c.last_name}`:'—'; };
  const clientObj = (id:number) => clients.find(x=>x.id===id);
  const onChange = (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'broker') {
      const selectedBroker = brokers.find(b => b.id.toString() === value);
      setForm((p: any) => {
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
      setForm((p: any) => ({ ...p, [name]: value }));
    }
  };
  const insertTemplate = (text: string, field: 'terms_and_conditions' | 'exclusions') => {
    if (!text) return;
    setForm((prev: any) => ({ ...prev, [field]: prev[field] ? prev[field] + '\n\n' + text : text }));
  };

  useEffect(() => {
    if (form.broker && form.broker !== '') {
      const broker = brokers.find(b => b.id.toString() === form.broker.toString());
      if (broker && (!form.commission_amount || form.commission_amount === '0')) {
        setForm((prev: any) => ({ ...prev, commission_amount: broker.default_commission_amount }));
      }
    }
  }, [form.broker]);

  useEffect(() => {
    if (form.net_premium !== undefined) {
      const net = parseFloat(form.net_premium) || 0;
      const sd_pct = parseFloat(form.stamp_duty_percentage) || 0;
      const df_pct = parseFloat(form.diwan_fee_percentage) || 0;
      const admin = parseFloat(form.admin_fees) || 0;
      const comm_pct = parseFloat(form.commission_percentage) || 0;

      const sd_amt = (net * (sd_pct / 100)).toFixed(2);
      const df_amt = (net * (df_pct / 100)).toFixed(2);
      const total = (net + parseFloat(sd_amt) + parseFloat(df_amt) + admin).toFixed(2);

      let comm_amt = parseFloat(form.commission_amount) || 0;
      if (comm_pct > 0) {
        comm_amt = net * (comm_pct / 100);
      }
      const comm_amt_str = comm_amt.toFixed(2);

      if (
        form.stamp_duty_amount !== sd_amt ||
        form.diwan_fee_amount !== df_amt ||
        form.total_amount !== total ||
        form.commission_amount !== comm_amt_str
      ) {
        setForm((prev: any) => ({
          ...prev,
          stamp_duty_amount: sd_amt,
          diwan_fee_amount: df_amt,
          total_amount: total,
          premium_amount: total,
          commission_amount: comm_amt_str
        }));
      }
    }
  }, [form.net_premium, form.stamp_duty_percentage, form.diwan_fee_percentage, form.admin_fees, form.commission_percentage]);

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    const dataToSend: any = { ...form };
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (!isEditMode) dataToSend.created_by = u.id;
      // If editing or creating, it needs approval
      dataToSend.status = 'PENDING';
    }
    
    const url = isEditMode && selected ? `${API}/policies/${selected.id}/` : `${API}/policies/`;
    const method = isEditMode ? 'PATCH' : 'POST';
    
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(dataToSend) });
    if(res.ok){ 
      setIsModalOpen(false); 
      setForm(blank); 
      fetchData(); 
      if (isEditMode) {
        setSelected({...dataToSend, id: selected?.id, status: 'PENDING'});
        alert(t('msgEditSuccess'));
      } else {
        alert(t('msgAddSuccess'));
      }
    } else {
      alert(t('saveError'));
    }
  };

  const handleApprove = async () => {
    if(!selected) return;
    if(!confirm(t('msgConfirmApprove'))) return;
    const res = await fetch(`${API}/policies/${selected.id}/approve/`, { method: 'POST' });
    if(res.ok) {
      alert(t('msgApproveSuccess'));
      fetchData();
      setSelected({...selected, status: 'ACTIVE'});
    } else alert(t('msgApproveError'));
  };

  const handleRenewPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const res = await fetch(`${API}/policies/${selected.id}/renew/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renewForm)
    });
    if (res.ok) {
      setIsRenewModalOpen(false);
      fetchData();
      alert(t('msgRenewSuccess'));
      setSelected({...selected, status: 'PENDING'});
    } else {
      alert(t('msgRenewError'));
    }
  };

  const handlePrint = () => {
    if(!printRef.current) return;
    const w = window.open('','','width=900,height=700');
    if(!w) return;
    w.document.write(`<html dir="rtl"><head><title>وثيقة تأمين - ${selected?.policy_number}</title><style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',Tahoma,sans-serif}
      body{padding:30px;color:#1e293b}
      table, tr, td {page-break-inside:auto !important;break-inside:auto !important}
      .header{text-align:center;border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:25px}
      .header h1{color:#1e40af;font-size:28px;margin-bottom:5px}
      .header p{color:#64748b;font-size:14px}
      .badge{display:inline-block;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:bold;color:white;background:#10b981}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
      .field{background:#f8fafc;padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0;page-break-inside:avoid !important;break-inside:avoid !important}
      .field label{font-size:11px;color:#64748b;display:block;margin-bottom:3px}
      .field span{font-weight:600;font-size:14px}
      .section{font-size:16px;font-weight:700;color:#1e40af;margin:20px 0 10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0;page-break-after:avoid;break-after:avoid}
      .full{grid-column:1/-1;page-break-inside:avoid !important;break-inside:avoid !important}
      .print-paragraph{page-break-inside:avoid !important;break-inside:avoid !important;margin-bottom:8px;white-space:pre-wrap;display:block}
      .footer{position:absolute;bottom:100px;left:0;right:0;display:flex;justify-content:space-between;padding-top:20px;border-top:2px dashed #cbd5e1;page-break-inside:avoid;}
      .footer div{text-align:center}
      .footer .line{width:180px;border-bottom:1px solid #334155;margin:40px auto 5px}
      .fixed-page-footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 15px 30px; border-top: 1px solid #e2e8f0; }
      .footer-space { height: 100px; }
      .print-wrapper { position: relative; min-height: 26cm; padding-bottom: 220px; }
      @media print{ 
        body{padding:15px; padding-bottom:0;}
        .fixed-page-footer { padding: 10px 15px; }
      }
    </style></head><body>${printRef.current.innerHTML}<script>window.print();window.close();</script></body></html>`);
    w.document.close();
  };

  const filtered = policies.filter(p => {
    const cName = clientName(p.client);
    const matchSearch = `${p.policy_number} ${cName}`.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType==='ALL' || p.policy_type===filterType;
    const matchStatus = filterStatus==='ALL' || p.status===filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentPolicies = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPremiums = policies.filter(p=>p.status==='ACTIVE').reduce((s,p)=>s+parseFloat(p.premium_amount||'0'),0);

  if(loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'80vh'}}><p style={{fontSize:'1.5rem'}}>جاري التحميل...</p></div>;

  return (
    <div style={{direction:'rtl',padding:'2rem'}}>
      {/* Breadcrumb Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{locale === 'ar' ? 'إدارة وثائق التأمين' : 'Policies Management'}</h1>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dashboard / Policies</span>
      </div>

      {/* Stats */}
      {!selected && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.5rem',marginBottom:'2rem'}}>
          {[
            {l: locale === 'ar' ? 'إجمالي الوثائق' : 'Total Policies',v:policies.length,c:'#3B82F6',icon:DescriptionOutlinedIcon},
            {l: locale === 'ar' ? 'وثائق فعالة' : 'Active Policies',v:policies.filter(p=>getTrueStatus(p)==='ACTIVE').length,c:'#10B981',icon:CheckCircleOutlineOutlinedIcon},
            {l: locale === 'ar' ? 'قيد الموافقة' : 'Pending Approval',v:policies.filter(p=>getTrueStatus(p)==='PENDING').length,c:'#F59E0B',icon:PendingActionsOutlinedIcon},
            {l: locale === 'ar' ? 'إجمالي الأقساط' : 'Total Premiums',v:formatAmount(totalPremiums),c:'#8B5CF6',icon:AccountBalanceWalletOutlinedIcon},
          ].map((s,i)=>{
            const Icon = s.icon;
            return (
              <div key={i} className="glass-panel" style={{padding:'1.5rem',display:'flex',alignItems:'center',gap:'1rem'}}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${s.c}15`, color: s.c }}>
                  <Icon style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <div style={{fontSize:'1.8rem',fontWeight:'bold',color:'var(--text-main)'}}>{s.v}</div>
                  <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{s.l}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'2rem',alignItems:'stretch'}}>
        {/* List */}
        {!selected ? (
        <div className="glass-panel" style={{padding:'1.5rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.75rem'}}>
            <h2 style={{margin:0}}>{locale === 'ar' ? 'قائمة الوثائق' : 'Policies List'}</h2>
            <button className="btn-primary" onClick={()=>{ setIsEditMode(false); setForm(blank); setIsModalOpen(true); }}>{locale === 'ar' ? 'إصدار وثيقة' : 'Issue Policy'}</button>
          </div>
          <input type="text" placeholder={locale === 'ar' ? 'بحث برقم الوثيقة أو اسم العميل...' : 'Search by policy number or client name...'} value={search} onChange={e=>{setSearch(e.target.value); setCurrentPage(1);}} style={{...inp,marginBottom:'0.75rem'}} />
          <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
            <select value={filterType} onChange={e=>{setFilterType(e.target.value); setCurrentPage(1);}} style={{...inp,width:'auto'}}>
              <option value="ALL">{locale === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
              {Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value); setCurrentPage(1);}} style={{...inp,width:'auto'}}>
              <option value="ALL">{locale === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
              {Object.entries(statusLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem',maxHeight:'55vh',overflowY:'auto'}}>
            {currentPolicies.length===0?<p style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>{locale === 'ar' ? 'لا توجد نتائج' : 'No results'}</p>:
            currentPolicies.map(p=>{
              return(
                <div key={p.id} onClick={()=>setSelected(p)} style={{padding:'0.75rem 1rem',borderRadius:'8px',cursor:'pointer',border:'2px solid var(--glass-border)',background:'rgba(0,0,0,0.02)',transition:'all 0.2s',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <span style={{fontWeight:'bold',display:'block',marginBottom:'0.2rem'}}>{p.policy_number}</span>
                    <div style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{clientName(p.client)} • {typeLabels[p.policy_type]}</div>
                  </div>
                  <span style={{padding:'0.2rem 0.6rem',borderRadius:'999px',fontSize:'0.75rem',color:'white',background:statusColor(getTrueStatus(p))}}>{statusLabels[getTrueStatus(p)]}</span>
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
                {locale === 'ar' ? 'السابق' : 'Previous'}
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 'bold' }}>
                {locale === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: currentPage === totalPages ? 'rgba(0,0,0,0.02)' : 'var(--secondary)', color: currentPage === totalPages ? 'var(--text-muted)' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {locale === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          )}
        </div>
        ) : (
        /* Detail */
          <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
            <div className="glass-panel" style={{padding:'1.5rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem'}}>
                <div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <h2 style={{margin:0}}>وثيقة رقم {selected.policy_number}</h2>
                    <span style={{padding:'0.4rem 1rem',borderRadius:'999px',fontSize:'0.85rem',color:'white',background:statusColor(getTrueStatus(selected))}}>{statusLabels[getTrueStatus(selected)]}</span>
                  </div>
                  <p style={{margin:0,color:'var(--text-muted)',fontSize:'0.9rem', marginTop: '0.2rem'}}>{typeLabels[selected.policy_type]} • {clientName(selected.client)}</p>
                </div>
                <div style={{display:'flex',gap:'0.5rem', alignItems: 'center'}}>
                  {(getTrueStatus(selected) === 'ACTIVE' || getTrueStatus(selected) === 'EXPIRED') && (
                    <button onClick={() => { setRenewForm({ start_date: '', end_date: '', premium_amount: selected.premium_amount || '' }); setIsRenewModalOpen(true); }} style={{...inp,width:'auto',padding:'0.5rem 1rem',cursor:'pointer',background:'rgba(139,92,246,0.15)',color:'#8B5CF6',border:'1px solid #8B5CF6',borderRadius:'8px',fontSize:'0.9rem'}}>{locale === 'ar' ? 'تجديد' : 'Renew'}</button>
                  )}
                  {userRole === 'ADMIN' && getTrueStatus(selected) === 'PENDING' && (
                    <button onClick={handleApprove} style={{...inp,width:'auto',padding:'0.5rem 1rem',cursor:'pointer',background:'rgba(16,185,129,0.15)',color:'#10B981',border:'1px solid #10B981',borderRadius:'8px',fontSize:'0.9rem'}}>{locale === 'ar' ? 'موافقة (تفعيل)' : 'Approve (Activate)'}</button>
                  )}
                  {(getTrueStatus(selected) === 'ACTIVE' || getTrueStatus(selected) === 'PENDING') && (
                    <button onClick={() => { setIsEditMode(true); setForm(selected); setIsModalOpen(true); }} style={{...inp,width:'auto',padding:'0.5rem 1rem',cursor:'pointer',background:'rgba(245,158,11,0.15)',color:'#F59E0B',border:'1px solid #F59E0B',borderRadius:'8px',fontSize:'0.9rem'}}>{locale === 'ar' ? 'تعديل' : 'Edit'}</button>
                  )}
                  {!(userRole === 'DATA_ENTRY' && getTrueStatus(selected) === 'PENDING') ? (
                    <button onClick={handlePrint} style={{...inp,width:'auto',padding:'0.5rem 1rem',cursor:'pointer',background:'rgba(59,130,246,0.15)',color:'#3B82F6',border:'1px solid #3B82F6',borderRadius:'8px',fontSize:'0.9rem'}}>{locale === 'ar' ? 'طباعة' : 'Print'}</button>
                  ) : (
                    <button disabled style={{...inp,width:'auto',padding:'0.5rem 1rem',cursor:'not-allowed',background:'rgba(100,116,139,0.15)',color:'#64748B',border:'1px solid #64748B',borderRadius:'8px',fontSize:'0.9rem'}}>{locale === 'ar' ? 'بانتظار الموافقة للطباعة' : 'Awaiting Approval to Print'}</button>
                  )}
                  <button onClick={() => setSelected(null)} style={{...inp,width:'auto',padding:'0.5rem 1rem',cursor:'pointer',background:'transparent',color:'var(--text-main)',border:'1px solid var(--text-muted)',borderRadius:'8px',fontSize:'0.9rem'}}>{locale === 'ar' ? 'إغلاق' : 'Close'}</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem'}}>
                {[
                  {l:locale==='ar'?'المبلغ الكامل':'Total Amount',v:`${formatAmount(selected.total_amount||selected.premium_amount||'0')} ${selected.currency==='USD'?(locale==='ar'?'دولار':'USD'):(locale==='ar'?'دينار':'IQD')}`},
                  {l:locale==='ar'?'قسط الاشتراك':'Net Premium',v:formatAmount(selected.net_premium||'0')},
                  {l:locale==='ar'?'رسم الطابع':'Stamp Duty',v:`${formatAmount(selected.stamp_duty_amount||'0')} (${selected.stamp_duty_percentage||0}%)`},
                  {l:locale==='ar'?'رسم الديوان':'Diwan Fee',v:`${formatAmount(selected.diwan_fee_amount||'0')} (${selected.diwan_fee_percentage||0}%)`},
                  {l:locale==='ar'?'رسوم إدارية':'Admin Fees',v:formatAmount(selected.admin_fees||'0')},
                  {l:locale==='ar'?'مبلغ التغطية':'Coverage',v:formatAmount(selected.coverage_amount||'0')},
                  {l:locale==='ar'?'مبلغ التحمل':'Deductible',v:formatAmount(selected.deductible||'0')},
                  {l:locale==='ar'?'تاريخ الإصدار':'Issue Date',v:selected.issue_date||'—'},
                  {l:locale==='ar'?'بداية التغطية':'Start Date',v:selected.start_date},
                  {l:locale==='ar'?'نهاية التغطية':'End Date',v:selected.end_date},
                  {l:locale==='ar'?'دورية الدفع':'Payment Freq',v:freqLabels[selected.payment_frequency]||'—'},
                  {l:locale==='ar'?'طريقة الدفع':'Payment Method',v:payLabels[selected.payment_method]||'—'},
                  {l:locale==='ar'?'المستفيد':'Beneficiary',v:selected.beneficiary_name||'—'},
                  {l:locale==='ar'?'صلة القرابة':'Relation',v:selected.beneficiary_relation||'—'},
                  {l:locale==='ar'?'إصدار بواسطة':'Issued By',v:selected.created_by_name||'—'},
                  ...(selected.broker_name ? [
                    {l:locale==='ar'?'المندوب / الوسيط':'Agent / Broker',v:selected.broker_name},
                    {l:locale==='ar'?'نسبة العمولة':'Commission Percentage',v:`${selected.commission_percentage || 0}%`},
                    {l:locale==='ar'?'قيمة العمولة':'Commission Amount',v:formatAmount(selected.commission_amount||'0')},
                  ] : []),
                ].map((f,i)=>(
                  <div key={i} style={{background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                    <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{f.l}</div>
                    <div style={{fontWeight:'600'}}>{f.v}</div>
                  </div>
                ))}
              </div>
              {selected.insured_item_details && <div style={{marginTop:'1rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{locale==='ar'?'تفاصيل المؤمن عليه':'Insured Details'}</div><div>{selected.insured_item_details}</div></div>}
              {selected.terms_and_conditions && <div style={{marginTop:'0.5rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{locale==='ar'?'الشروط والأحكام':'Terms & Conditions'}</div><div style={{whiteSpace:'pre-wrap'}}>{selected.terms_and_conditions}</div></div>}
              {selected.exclusions && <div style={{marginTop:'0.5rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{locale==='ar'?'الاستثناءات':'Exclusions'}</div><div style={{whiteSpace:'pre-wrap'}}>{selected.exclusions}</div></div>}
              {selected.notes && <div style={{marginTop:'0.5rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{locale==='ar'?'ملاحظات':'Notes'}</div><div>{selected.notes}</div></div>}
              
              {/* Dynamic Policy Details in View Modal */}
              {selected.policy_type === 'AUTO' && selected.vehicles && selected.vehicles.length > 0 && (
                <div style={{marginTop:'1rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',marginBottom:'0.5rem'}}>🔹 {locale==='ar'?'المركبات':'Vehicles'}</div>
                  <div style={{display:'grid', gap:'0.5rem'}}>
                    {selected.vehicles.map((v: any, i: number) => (
                      <div key={i} style={{background:'white', padding:'0.5rem', borderRadius:'6px', border:'1px solid var(--glass-border)', fontSize:'0.85rem'}}>
                        <strong>{locale==='ar'?'مركبة':'Vehicle'} #{i+1}:</strong> {v.make||''} {v.model||''} ({v.year||''}) - {locale==='ar'?'اللوحة:':'Plate:'} {v.plate_number||'—'} / {locale==='ar'?'الشاصي:':'Chassis:'} {v.chassis_no||'—'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.policy_type === 'HEALTH' && selected.health_coverage_details && (
                <div style={{marginTop:'1rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',marginBottom:'0.5rem'}}>🔹 {locale==='ar'?'التغطية الطبية والشبكة':'Medical Coverage & Network'}</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.85rem', marginBottom:'1rem'}}>
                    <div><strong>{locale==='ar'?'سقف التغطية:':'Annual Limit:'}</strong> {selected.health_coverage_details.annual_limit||'—'}</div>
                    <div><strong>{locale==='ar'?'العمليات:':'Surgeries:'}</strong> {selected.health_coverage_details.surgeries||'—'}</div>
                    <div><strong>{locale==='ar'?'الأدوية:':'Medicines:'}</strong> {selected.health_coverage_details.medicines||'—'}</div>
                    <div><strong>{locale==='ar'?'الطوارئ:':'Emergency:'}</strong> {selected.health_coverage_details.emergency||'—'}</div>
                  </div>
                  <div style={{fontSize:'0.85rem', marginBottom:'1rem'}}>
                    <div style={{fontWeight:'bold', marginBottom:'0.2rem'}}>{locale==='ar'?'الشبكة الطبية:':'Medical Network:'}</div>
                    <div>{locale==='ar'?'المستشفيات:':'Hospitals:'} {selected.health_coverage_details.hospitals||'—'}</div>
                    <div>{locale==='ar'?'العيادات:':'Clinics:'} {selected.health_coverage_details.clinics||'—'}</div>
                    <div>{locale==='ar'?'الصيدليات:':'Pharmacies:'} {selected.health_coverage_details.pharmacies||'—'}</div>
                  </div>
                  {selected.family_members && selected.family_members.length > 0 && (
                    <>
                      <div style={{fontSize:'0.85rem',fontWeight:'bold',marginBottom:'0.5rem'}}>{locale==='ar'?'أفراد العائلة المشمولين:':'Included Family Members:'}</div>
                      <div style={{display:'grid', gap:'0.5rem'}}>
                        {selected.family_members.map((f: any, i: number) => (
                          <div key={i} style={{background:'white', padding:'0.5rem', borderRadius:'6px', border:'1px solid var(--glass-border)', fontSize:'0.85rem'}}>
                            {f.relation} - {f.name} ({f.age} {locale==='ar'?'سنة':'years'})
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {selected.policy_type === 'PROPERTY' && selected.property_details && (
                <div style={{marginTop:'1rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',marginBottom:'0.5rem'}}>🔹 {locale==='ar'?'بيانات العقار والممتلكات':'Property & Contents Data'}</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.85rem', marginBottom:'1rem'}}>
                    <div><strong>{locale==='ar'?'الموقع:':'Location:'}</strong> {selected.property_details.location||'—'}</div>
                    <div><strong>{locale==='ar'?'النوع:':'Type:'}</strong> {selected.property_details.property_type||'—'}</div>
                    <div><strong>{locale==='ar'?'قيمة البناء:':'Building Value:'}</strong> {selected.property_details.building_value||'—'}</div>
                    <div><strong>{locale==='ar'?'قيمة المحتويات:':'Contents Value:'}</strong> {selected.property_details.contents_value||'—'}</div>
                  </div>
                  <div style={{fontSize:'0.85rem', marginBottom:'1rem'}}>
                    <div><strong>{locale==='ar'?'المحتويات:':'Contents:'}</strong> الأثاث: {selected.property_details.furniture||'—'} | الأجهزة: {selected.property_details.appliances||'—'} | المعدات: {selected.property_details.equipment||'—'}</div>
                  </div>
                  <div style={{fontSize:'0.85rem'}}>
                    <strong>{locale==='ar'?'الأخطار المغطاة:':'Covered Risks:'}</strong> {[selected.property_details.fire_cover?'الحريق':'', selected.property_details.theft_cover?'السرقة':'', selected.property_details.natural_disasters_cover?'الكوارث الطبيعية':''].filter(Boolean).join(' / ') || '—'}
                  </div>
                </div>
              )}

              {selected.policy_type === 'ENGINEERING' && selected.engineering_details && (
                <div style={{marginTop:'1rem',background:'rgba(0,0,0,0.04)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',marginBottom:'0.5rem'}}>🔹 {locale==='ar'?'التفاصيل الهندسية':'Engineering Details'}</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', fontSize:'0.85rem', marginBottom:'1rem'}}>
                    <div><strong>{locale==='ar'?'اسم المشروع:':'Project Name:'}</strong> {selected.engineering_details.project_name||'—'}</div>
                    <div><strong>{locale==='ar'?'مدة المشروع:':'Project Duration:'}</strong> {selected.engineering_details.project_duration||'—'}</div>
                    <div style={{gridColumn:'1/-1'}}><strong>{locale==='ar'?'موقع المشروع:':'Project Location:'}</strong> {selected.engineering_details.project_location||'—'}</div>
                  </div>
                  <div style={{fontSize:'0.85rem', marginBottom:'1rem'}}>
                    <strong>{locale==='ar'?'الأخطار المغطاة:':'Covered Risks:'}</strong> {[selected.engineering_details.installation_risks_cover?'أخطار التركيب':'', selected.engineering_details.operation_risks_cover?'أخطار التشغيل':'', selected.engineering_details.breakdown_risks_cover?'الأعطال':''].filter(Boolean).join(' / ') || '—'}
                  </div>
                  {selected.engineering_equipment && selected.engineering_equipment.length > 0 && (
                    <>
                      <div style={{fontSize:'0.85rem',fontWeight:'bold',marginBottom:'0.5rem'}}>{locale==='ar'?'المعدات المشمولة:':'Included Equipment:'}</div>
                      <div style={{display:'grid', gap:'0.5rem'}}>
                        {selected.engineering_equipment.map((eq: any, i: number) => (
                          <div key={i} style={{background:'white', padding:'0.5rem', borderRadius:'6px', border:'1px solid var(--glass-border)', fontSize:'0.85rem'}}>
                            <strong>{locale==='ar'?'معدة':'Equipment'} #{i+1}:</strong> {eq.type} - {locale==='ar'?'القيمة:':'Value:'} {eq.value}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Print Template (hidden) */}
            <div style={{display:'none'}}>
              <div ref={printRef}>
                <div className="print-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr>
                      <td>
                        <div className="header">
                          <h1>شركة التأمين الشاملة</h1>
                          <p>وثيقة تأمين رسمية</p>
                        </div>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div style={{textAlign:'center',marginBottom:'20px'}}>
                          <span className="badge">{statusLabels[selected.status]}</span>
                          <h2 style={{margin:'10px 0',fontSize:'22px'}}>وثيقة رقم: {selected.policy_number}</h2>
                          <p style={{color:'#64748b'}}>نوع التأمين: {typeLabels[selected.policy_type]}</p>
                        </div>
                        <div className="section">بيانات المؤمن له</div>
                        <div className="grid">
                          <div className="field"><label>اسم المؤمن له</label><span>{clientName(selected.client)}</span></div>
                          <div className="field"><label>رقم الهوية</label><span>{clientObj(selected.client)?.national_id||'—'}</span></div>
                          <div className="field"><label>رقم الهاتف</label><span>{clientObj(selected.client)?.phone||'—'}</span></div>
                          <div className="field full"><label>العنوان</label><span>{clientObj(selected.client)?.address||'—'}</span></div>
                        </div>
                        <div className="section">التفاصيل المالية والتغطية</div>
                        <div className="grid">
                          <div className="field"><label>تاريخ الإصدار</label><span>{selected.issue_date||'—'}</span></div>
                          <div className="field"><label>العملة</label><span>{selected.currency==='USD'?'دولار':'دينار'}</span></div>
                          <div className="field"><label>المبلغ الكامل</label><span style={{color:'#10b981',fontWeight:'bold'}}>{formatAmount(selected.total_amount||selected.premium_amount||'0')}</span></div>
                          <div className="field"><label>قسط الاشتراك الصافي</label><span>{formatAmount(selected.net_premium||'0')}</span></div>
                          <div className="field"><label>رسم الطابع ({selected.stamp_duty_percentage||0}%)</label><span>{formatAmount(selected.stamp_duty_amount||'0')}</span></div>
                          <div className="field"><label>رسم الديوان ({selected.diwan_fee_percentage||0}%)</label><span>{formatAmount(selected.diwan_fee_amount||'0')}</span></div>
                          <div className="field"><label>رسوم إدارية</label><span>{formatAmount(selected.admin_fees||'0')}</span></div>
                          <div className="field"><label>مبلغ التغطية</label><span>{formatAmount(selected.coverage_amount||'0')}</span></div>
                          <div className="field"><label>مبلغ التحمل</label><span>{formatAmount(selected.deductible||'0')}</span></div>
                          <div className="field"><label>تاريخ البدء</label><span>{selected.start_date}</span></div>
                          <div className="field"><label>تاريخ الانتهاء</label><span>{selected.end_date}</span></div>
                          <div className="field"><label>دورية الدفع</label><span>{freqLabels[selected.payment_frequency]||'—'}</span></div>
                          <div className="field"><label>طريقة الدفع</label><span>{payLabels[selected.payment_method]||'—'}</span></div>
                          <div className="field"><label>الحالة</label><span>{statusLabels[selected.status]}</span></div>
                        </div>
                        {selected.beneficiary_name && (<><div className="section">بيانات المستفيد</div><div className="grid"><div className="field"><label>اسم المستفيد</label><span>{selected.beneficiary_name}</span></div><div className="field"><label>صلة القرابة</label><span>{selected.beneficiary_relation||'—'}</span></div><div className="field"><label>هاتف المستفيد</label><span>{selected.beneficiary_phone||'—'}</span></div></div></>)}
                        {selected.insured_item_details && (
                          <>
                            <div className="section">تفاصيل المؤمن عليه</div>
                            {selected.insured_item_details.split('\n').map((para: string, idx: number) => {
                              if (!para.trim()) return null;
                              return (
                                <div key={idx} className="print-paragraph field full" style={{marginBottom:'8px'}}>
                                  <span>{para}</span>
                                </div>
                              );
                            })}
                          </>
                        )}
                        {selected.terms_and_conditions && (
                          <>
                            <div className="section">الشروط والأحكام</div>
                            {selected.terms_and_conditions.split('\n').map((para: string, idx: number) => {
                              if (!para.trim()) return null;
                              return (
                                <div key={idx} className="print-paragraph field full" style={{marginBottom:'8px'}}>
                                  <span>{para}</span>
                                </div>
                              );
                            })}
                          </>
                        )}
                        {selected.exclusions && (
                          <>
                            <div className="section">الاستثناءات</div>
                            {selected.exclusions.split('\n').map((para: string, idx: number) => {
                              if (!para.trim()) return null;
                              return (
                                <div key={idx} className="print-paragraph field full" style={{marginBottom:'8px'}}>
                                  <span>{para}</span>
                                </div>
                              );
                            })}
                          </>
                        )}
                        {selected.notes && (
                          <>
                            <div className="section">ملاحظات</div>
                            {selected.notes.split('\n').map((para: string, idx: number) => {
                              if (!para.trim()) return null;
                              return (
                                <div key={idx} className="print-paragraph field full" style={{marginBottom:'8px'}}>
                                  <span>{para}</span>
                                </div>
                              );
                            })}
                          </>
                        )}

                        {/* Dynamic Policy Details in Print Template */}
                        {selected.policy_type === 'AUTO' && selected.vehicles && selected.vehicles.length > 0 && (
                          <>
                            <div className="section">بيانات المركبات</div>
                            <div className="grid">
                              {selected.vehicles.map((v: any, i: number) => (
                                <div key={i} className="field full" style={{marginBottom:'5px'}}>
                                  <strong>مركبة #{i+1}:</strong> {v.make||''} {v.model||''} ({v.year||''}) | اللوحة: {v.plate_number||'—'} | الشاصي: {v.chassis_no||'—'}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {selected.policy_type === 'HEALTH' && selected.health_coverage_details && (
                          <>
                            <div className="section">التغطية الطبية والشبكة</div>
                            <div className="grid">
                              <div className="field"><label>سقف التغطية</label><span>{selected.health_coverage_details.annual_limit||'—'}</span></div>
                              <div className="field"><label>العمليات</label><span>{selected.health_coverage_details.surgeries||'—'}</span></div>
                              <div className="field"><label>الأدوية</label><span>{selected.health_coverage_details.medicines||'—'}</span></div>
                              <div className="field"><label>الطوارئ</label><span>{selected.health_coverage_details.emergency||'—'}</span></div>
                              <div className="field full"><label>الشبكة الطبية</label><span>مستشفيات: {selected.health_coverage_details.hospitals||'—'} | عيادات: {selected.health_coverage_details.clinics||'—'} | صيدليات: {selected.health_coverage_details.pharmacies||'—'}</span></div>
                            </div>
                            {selected.family_members && selected.family_members.length > 0 && (
                              <div style={{marginTop:'15px'}}>
                                <div style={{fontWeight:'bold', fontSize:'14px', marginBottom:'5px', color:'#1e40af'}}>أفراد العائلة المشمولين</div>
                                {selected.family_members.map((f: any, i: number) => (
                                  <div key={i} className="field full" style={{marginBottom:'5px'}}>
                                    {f.relation} - {f.name} ({f.age} سنة)
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {selected.policy_type === 'PROPERTY' && selected.property_details && (
                          <>
                            <div className="section">بيانات العقار والممتلكات</div>
                            <div className="grid">
                              <div className="field"><label>الموقع</label><span>{selected.property_details.location||'—'}</span></div>
                              <div className="field"><label>النوع</label><span>{selected.property_details.property_type||'—'}</span></div>
                              <div className="field"><label>قيمة البناء</label><span>{selected.property_details.building_value||'—'}</span></div>
                              <div className="field"><label>قيمة المحتويات</label><span>{selected.property_details.contents_value||'—'}</span></div>
                              <div className="field full"><label>المحتويات</label><span>الأثاث: {selected.property_details.furniture||'—'} | الأجهزة: {selected.property_details.appliances||'—'} | المعدات: {selected.property_details.equipment||'—'}</span></div>
                              <div className="field full"><label>الأخطار المغطاة</label><span>{[selected.property_details.fire_cover?'الحريق':'', selected.property_details.theft_cover?'السرقة':'', selected.property_details.natural_disasters_cover?'الكوارث الطبيعية':''].filter(Boolean).join(' / ') || '—'}</span></div>
                            </div>
                          </>
                        )}

                        {selected.policy_type === 'ENGINEERING' && selected.engineering_details && (
                          <>
                            <div className="section">التفاصيل الهندسية</div>
                            <div className="grid">
                              <div className="field"><label>اسم المشروع</label><span>{selected.engineering_details.project_name||'—'}</span></div>
                              <div className="field"><label>مدة المشروع</label><span>{selected.engineering_details.project_duration||'—'}</span></div>
                              <div className="field full"><label>موقع المشروع</label><span>{selected.engineering_details.project_location||'—'}</span></div>
                              <div className="field full"><label>الأخطار المغطاة</label><span>{[selected.engineering_details.installation_risks_cover?'أخطار التركيب':'', selected.engineering_details.operation_risks_cover?'أخطار التشغيل':'', selected.engineering_details.breakdown_risks_cover?'الأعطال':''].filter(Boolean).join(' / ') || '—'}</span></div>
                            </div>
                            {selected.engineering_equipment && selected.engineering_equipment.length > 0 && (
                              <div style={{marginTop:'15px'}}>
                                <div style={{fontWeight:'bold', fontSize:'14px', marginBottom:'5px', color:'#1e40af'}}>المعدات المشمولة</div>
                                {selected.engineering_equipment.map((eq: any, i: number) => (
                                  <div key={i} className="field full" style={{marginBottom:'5px'}}>
                                    معدة #{i+1}: {eq.type} - القيمة: {eq.value}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <div className="footer-space">&nbsp;</div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
                
                <div className="footer">
                  <div><div className="line"></div><span>توقيع العميل</span></div>
                  <div><div className="line"></div><span>توقيع المسؤول</span></div>
                  <div><div className="line"></div><span>ختم الشركة</span></div>
                </div>

                <div className="fixed-page-footer">
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',fontWeight:'bold',color:'#334155'}}>
                    <div>
                      {(systemSettings.company_phones_left || '').split('\n').map((line: string, i: number) => <div key={i}>{line}</div>)}
                    </div>
                    <div style={{textAlign: 'left'}}>
                      {(systemSettings.branches_phones_right || '').split('\n').map((line: string, i: number) => <div key={i}>{line}</div>)}
                    </div>
                  </div>
                  <p style={{textAlign:'center',marginTop:'10px',fontSize:'11px',color:'#94a3b8'}}>تم الإصدار بتاريخ: {new Date().toLocaleDateString('ar-EG')} — هذه الوثيقة صادرة إلكترونياً من نظام شركة التأمين الشاملة</p>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,backdropFilter:'blur(5px)'}}>
          <div className="glass-panel" style={{width:'100%',maxWidth:'650px',padding:'2rem',maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h2 style={{margin:0}}>{isEditMode ? 'تعديل الوثيقة' : 'إصدار وثيقة جديدة'}</h2>
              <button onClick={()=>setIsModalOpen(false)} style={{background:'transparent',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'var(--text-muted)'}}>✕</button>
            </div>
            {isEditMode && <p style={{color:'#EF4444',fontSize:'0.85rem',marginBottom:'1rem'}}>ملاحظة: تعديل الوثيقة سيعيدها إلى حالة "قيد الموافقة" ويجب على الإدارة الموافقة عليها مجدداً.</p>}
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem'}}>البيانات الأساسية</div>
              <select name="client" value={form.client} onChange={onChange} required style={inp}><option value="">اختر العميل (المؤمن له)...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select>
              {form.client && clientObj(parseInt(form.client)) && (
                <div style={{background:'rgba(0,0,0,0.02)', padding:'1rem', borderRadius:'8px', marginTop:'0.2rem', fontSize:'0.85rem'}}>
                  <div style={{fontWeight:'bold', marginBottom:'0.5rem', color:'var(--secondary)'}}>بيانات المؤمن له</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem'}}>
                    <div><span style={{color:'var(--text-muted)'}}>الاسم:</span> {clientName(parseInt(form.client))}</div>
                    <div><span style={{color:'var(--text-muted)'}}>الهاتف:</span> {clientObj(parseInt(form.client))?.phone || '—'}</div>
                    <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--text-muted)'}}>العنوان:</span> {clientObj(parseInt(form.client))?.address || '—'}</div>
                  </div>
                </div>
              )}
              <div style={{display:'flex',gap:'1rem', marginTop:'0.5rem'}}>
                <div style={{flex:1}}>
                  <input name="policy_number" placeholder={isEditMode ? "رقم الوثيقة" : "رقم الوثيقة (تلقائي)"} value={form.policy_number} onChange={onChange} readOnly={!isEditMode} style={{...inp, background: isEditMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)', color: isEditMode ? 'var(--text-main)' : 'var(--text-muted)'}}/>
                </div>
                <div style={{flex:1}}>
                  <select name="policy_type" value={form.policy_type} onChange={onChange} style={inp}>{Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
                </div>
              </div>
              <div style={{display:'flex',gap:'1rem'}}>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>تاريخ البدء</label><input type="date" name="start_date" value={form.start_date} onChange={onChange} required style={inp}/></div>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>تاريخ الانتهاء</label><input type="date" name="end_date" value={form.end_date} onChange={onChange} required style={inp}/></div>
              </div>

              <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>{locale==='ar'?'المندوب / الوسيط (اختياري)':'Broker / Agent (Optional)'}</div>
              <div style={{display:'flex',gap:'1rem'}}>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{t('brokerSelect')}</label>
                  <select name="broker" value={form.broker} onChange={onChange} style={inp}>
                    <option value="">{locale==='ar'?'بدون وسيط...':'No Broker...'}</option>
                    {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{t('commissionPercentage')}</label>
                  <input type="number" step="0.01" name="commission_percentage" placeholder="0" value={form.commission_percentage || '0'} onChange={onChange} style={inp}/>
                </div>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'مبلغ العمولة':'Commission Amount'}</label>
                  <input type="number" step="0.01" name="commission_amount" placeholder="0" value={form.commission_amount || '0'} onChange={onChange} style={inp} readOnly={parseFloat(form.commission_percentage) > 0}/>
                </div>
              </div>

              <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>{locale==='ar'?'الرسوم والضرائب':'Fees & Taxes'}</div>
              <div style={{display:'flex',gap:'1rem'}}>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'العملة':'Currency'}</label>
                  <select name="currency" value={form.currency} onChange={onChange} style={inp}>
                    <option value="IQD">{locale==='ar'?'دينار':'IQD'}</option><option value="USD">{locale==='ar'?'دولار':'USD'}</option>
                  </select>
                </div>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'قسط الاشتراك الصافي *':'Net Premium *'}</label>
                  <input type="number" step="0.01" name="net_premium" placeholder="0" value={form.net_premium} onChange={onChange} required style={inp}/>
                </div>
              </div>
              <div style={{display:'flex',gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'نسبة رسم الطابع (%)':'Stamp Duty (%)'}</label>
                  <input type="number" step="0.01" name="stamp_duty_percentage" placeholder="0" value={form.stamp_duty_percentage} onChange={onChange} style={inp}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'مبلغ رسم الطابع':'Stamp Duty Amount'}</label>
                  <input type="number" step="0.01" name="stamp_duty_amount" placeholder="0" value={form.stamp_duty_amount} readOnly style={{...inp, background:'rgba(0,0,0,0.02)', color:'var(--text-muted)'}}/>
                </div>
              </div>
              <div style={{display:'flex',gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'نسبة رسم الديوان (%)':'Diwan Fee (%)'}</label>
                  <input type="number" step="0.01" name="diwan_fee_percentage" placeholder="0" value={form.diwan_fee_percentage} onChange={onChange} style={inp}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'مبلغ رسم الديوان':'Diwan Fee Amount'}</label>
                  <input type="number" step="0.01" name="diwan_fee_amount" placeholder="0" value={form.diwan_fee_amount} readOnly style={{...inp, background:'rgba(0,0,0,0.02)', color:'var(--text-muted)'}}/>
                </div>
              </div>
              <div style={{display:'flex',gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'رسوم إدارية':'Admin Fees'}</label>
                  <input type="number" step="0.01" name="admin_fees" placeholder="0" value={form.admin_fees} onChange={onChange} style={inp}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>{locale==='ar'?'المبلغ الكامل (مبلغ القسط)':'Total Amount'}</label>
                  <input type="number" step="0.01" name="total_amount" placeholder="0" value={form.total_amount} readOnly style={{...inp, background:'rgba(16,185,129,0.1)', color:'#10B981', fontWeight:'bold'}}/>
                </div>
              </div>

              <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>التغطية والأقساط</div>
              <div style={{display:'flex',gap:'1rem'}}>
                <input type="number" step="0.01" name="coverage_amount" placeholder="مبلغ التغطية" value={form.coverage_amount} onChange={onChange} style={inp}/>
                <input type="number" step="0.01" name="deductible" placeholder="مبلغ التحمل" value={form.deductible} onChange={onChange} style={inp}/>
              </div>
              <div style={{display:'flex',gap:'1rem'}}>
                <select name="payment_frequency" value={form.payment_frequency} onChange={onChange} style={inp}>{Object.entries(freqLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
                <select name="payment_method" value={form.payment_method} onChange={onChange} style={inp}>{Object.entries(payLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
              </div>

              <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>المستفيد (اختياري)</div>
              <div style={{display:'flex',gap:'1rem'}}>
                <input name="beneficiary_name" placeholder="اسم المستفيد" value={form.beneficiary_name} onChange={onChange} style={inp}/>
                <input name="beneficiary_relation" placeholder="صلة القرابة" value={form.beneficiary_relation} onChange={onChange} style={inp}/>
                <input name="beneficiary_phone" pattern="\d{11}" maxLength={11} minLength={11} title="يجب أن يتكون من 11 رقم" placeholder="هاتف المستفيد" value={form.beneficiary_phone} onChange={onChange} style={inp}/>
              </div>

              <div style={{fontSize:'0.9rem',fontWeight:'bold',color:'var(--secondary)',borderBottom:'1px solid var(--glass-border)',paddingBottom:'0.3rem',marginTop:'0.5rem'}}>تفاصيل إضافية</div>
              <textarea name="insured_item_details" placeholder="تفاصيل الشيء المؤمن عليه..." value={form.insured_item_details} onChange={onChange} style={{...inp,minHeight:'70px',resize:'vertical'}}/>
              
              <div style={{display:'flex',flexDirection:'column',gap:'0.2rem',marginTop:'0.5rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{t('termsAndExclusions')}</label>
                  <select onChange={e => { insertTemplate(e.target.value, 'terms_and_conditions'); e.target.value=''; }} style={{...inp, width:'auto', padding:'0.2rem', fontSize:'0.8rem'}}>
                    <option value="">{locale==='ar'?'إدراج قالب...':'Insert Template...'}</option>
                    {templates.filter(t => t.template_type === 'TERMS').map(t => <option key={t.id} value={t.content}>{t.title}</option>)}
                  </select>
                </div>
                <textarea name="terms_and_conditions" placeholder="الشروط والأحكام..." value={form.terms_and_conditions} onChange={onChange} style={{...inp,minHeight:'70px',resize:'vertical'}}/>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'0.2rem',marginTop:'0.5rem'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                  <label style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>الاستثناءات</label>
                  <select onChange={e => { insertTemplate(e.target.value, 'exclusions'); e.target.value=''; }} style={{...inp, width:'auto', padding:'0.2rem', fontSize:'0.8rem'}}>
                    <option value="">إدراج قالب...</option>
                    {templates.filter(t => t.template_type === 'EXCLUSIONS').map(t => <option key={t.id} value={t.content}>{t.title}</option>)}
                  </select>
                </div>
                <textarea name="exclusions" placeholder="الاستثناءات..." value={form.exclusions} onChange={onChange} style={{...inp,minHeight:'70px',resize:'vertical'}}/>
              </div>

              <textarea name="notes" placeholder="ملاحظات..." value={form.notes} onChange={onChange} style={{...inp,minHeight:'60px',resize:'vertical',marginTop:'0.5rem'}}/>

              <div style={{display:'flex',gap:'1rem',marginTop:'0.5rem'}}>
                <button type="submit" className="btn-primary" style={{flex:1}}>{isEditMode ? t('saveChanges') : (locale==='ar'?'إصدار الوثيقة':'Issue Policy')}</button>
                <button type="button" onClick={()=>setIsModalOpen(false)} style={{flex:1,...inp,cursor:'pointer',background:'transparent',border:'1px solid var(--text-muted)',color:'var(--text-main)'}}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {isRenewModalOpen && selected && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,backdropFilter:'blur(5px)'}}>
          <div className="glass-panel" style={{width:'100%',maxWidth:'450px',padding:'2rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h2 style={{margin:0}}>تجديد وثيقة التأمين</h2>
              <button onClick={()=>setIsRenewModalOpen(false)} style={{background:'transparent',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'var(--text-muted)'}}>✕</button>
            </div>
            <p style={{fontSize:'0.9rem',color:'var(--text-muted)',marginBottom:'1rem'}}>وثيقة رقم {selected.policy_number} للعميل {clientName(selected.client)}</p>
            <form onSubmit={handleRenewPolicy} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={{display:'flex',gap:'1rem'}}>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>تاريخ بدء التجديد</label><input type="date" value={renewForm.start_date} onChange={e=>setRenewForm({...renewForm,start_date:e.target.value})} required style={inp}/></div>
                <div style={{flex:1}}><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>تاريخ انتهاء التجديد</label><input type="date" value={renewForm.end_date} onChange={e=>setRenewForm({...renewForm,end_date:e.target.value})} required style={inp}/></div>
              </div>
              <div><label style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'block',marginBottom:'0.2rem'}}>قسط التجديد</label><input type="number" step="0.01" placeholder="القسط" value={renewForm.premium_amount} onChange={e=>setRenewForm({...renewForm,premium_amount:e.target.value})} required style={inp}/></div>
              <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}>
                <button type="submit" className="btn-primary" style={{flex:1}}>تأكيد التجديد</button>
                <button type="button" onClick={()=>setIsRenewModalOpen(false)} style={{flex:1,...inp,cursor:'pointer',background:'transparent',border:'1px solid var(--text-muted)',color:'var(--text-main)'}}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
