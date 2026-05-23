"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useCurrency } from '../components/CurrencyContext';

interface Claim {
  id: number;
  policy: number;
  claim_number: string;
  description: string;
  claim_amount: string;
  status: string;
  rejection_reason?: string;
  filed_date: string;
}

interface Policy {
  id: number;
  client: number;
  policy_number: string;
  status: string;
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
}

const theme = createTheme({
  typography: { fontFamily: 'inherit' },
  palette: { primary: { main: '#0F766E' } }
});

export default function Claims() {
  const { locale } = useLanguage();
  const { formatAmount } = useCurrency();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ policy: '', claim_number: '', description: '', claim_amount: '' });
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [policySearchQuery, setPolicySearchQuery] = useState('');
  const [isPolicyDropdownOpen, setIsPolicyDropdownOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ policy: '', claim_number: '', description: '', claim_amount: '', status: '', rejection_reason: '' });
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('http://127.0.0.1:8000/api/crm/claims/').then(res => res.ok ? res.json() : []),
      fetch('http://127.0.0.1:8000/api/crm/policies/').then(res => res.ok ? res.json() : []),
      fetch('http://127.0.0.1:8000/api/crm/clients/').then(res => res.ok ? res.json() : [])
    ]).then(([claimsData, policiesData, clientsData]) => {
      setClaims(claimsData);
      setPolicies(policiesData);
      setClients(clientsData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchData();
  }, []);

  const getCustomerName = (policyId: number) => {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) return 'Unknown';
    const client = clients.find(c => c.id === policy.client);
    if (!client) return 'Unknown';
    return `${client.first_name} ${client.last_name}`;
  };

  const getPolicyNumber = (policyId: number) => {
    const policy = policies.find(p => p.id === policyId);
    return policy ? policy.policy_number : 'Unknown';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this claim?')) return;
    const res = await fetch(`http://127.0.0.1:8000/api/crm/claims/${id}/`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://127.0.0.1:8000/api/crm/claims/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimForm)
    });
    if (res.ok) {
      setIsAddClaimOpen(false);
      setClaimForm({ policy: '', claim_number: '', description: '', claim_amount: '' });
      setPolicySearchQuery('');
      fetchData();
      alert(locale === 'ar' ? 'تم إضافة المطالبة بنجاح' : 'Claim added successfully');
    } else {
      alert(locale === 'ar' ? 'حدث خطأ أثناء حفظ المطالبة' : 'Error saving claim');
    }
  };

  const openView = (claimId: number) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    setSelectedClaim(claim);
    setIsViewOpen(true);
  };

  const openEdit = (claimId: number) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
    setSelectedClaim(claim);
    setEditForm({
      policy: claim.policy.toString(),
      claim_number: claim.claim_number,
      description: claim.description,
      claim_amount: claim.claim_amount,
      status: claim.status,
      rejection_reason: claim.rejection_reason || ''
    });
    setIsEditOpen(true);
  };

  const handleEditClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    const res = await fetch(`http://127.0.0.1:8000/api/crm/claims/${selectedClaim.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    if (res.ok) {
      setIsEditOpen(false);
      setSelectedClaim(null);
      fetchData();
      alert(locale === 'ar' ? 'تم تعديل المطالبة بنجاح' : 'Claim updated successfully');
    } else {
      alert(locale === 'ar' ? 'حدث خطأ أثناء تعديل المطالبة' : 'Error updating claim');
    }
  };

  const rows = claims.map(claim => ({
    rawId: claim.id,
    id: claim.claim_number || `#CLM-${claim.id.toString().padStart(4, '0')}`,
    claimDate: new Date(claim.filed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    customer: getCustomerName(claim.policy),
    insurance: getPolicyNumber(claim.policy),
    amount: formatAmount(claim.claim_amount),
    status: claim.status
  })).filter(row => 
    Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const columns: GridColDef[] = [
    { field: 'id', headerName: locale === 'ar' ? 'رقم المطالبة' : 'Claim Number', flex: 1, minWidth: 120, renderCell: (params) => <span style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 'bold' }}>{params.value}</span> },
    { field: 'claimDate', headerName: locale === 'ar' ? 'تاريخ المطالبة' : 'Claim Date', flex: 1, minWidth: 140, renderCell: (params) => <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{params.value}</span> },
    { field: 'customer', headerName: locale === 'ar' ? 'اسم العميل' : 'Client Name', flex: 1.5, minWidth: 150, renderCell: (params) => <span style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{params.value}</span> },
    { field: 'insurance', headerName: locale === 'ar' ? 'رقم الوثيقة' : 'Policy Number', flex: 1, minWidth: 130, renderCell: (params) => <span style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{params.value}</span> },
    { field: 'amount', headerName: locale === 'ar' ? 'مبلغ المطالبة' : 'Claim Amount', flex: 1, minWidth: 130, renderCell: (params) => <span style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 'bold' }}>{params.value}</span> },
    { 
      field: 'status', 
      headerName: locale === 'ar' ? 'الحالة' : 'Status', 
      flex: 1, 
      minWidth: 130,
      renderCell: (params) => {
        let bg = '#1E293B';
        let label = params.value;
        if (label === 'PENDING' || label === 'Submitted') { bg = '#F59E0B'; label = locale === 'ar' ? 'قيد المراجعة' : 'Pending Review'; }
        if (label === 'UNDER_REVIEW') { bg = '#0EA5E9'; label = locale === 'ar' ? 'تحت الإجراء' : 'In Progress'; }
        if (label === 'APPROVED') { bg = '#10B981'; label = locale === 'ar' ? 'مقبولة' : 'Approved'; }
        if (label === 'REJECTED') { bg = '#EF4444'; label = locale === 'ar' ? 'مرفوضة' : 'Rejected'; }
        if (label === 'CLOSED') { bg = '#EF4444'; label = locale === 'ar' ? 'مغلقة' : 'Closed'; }
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span style={{ backgroundColor: bg, color: 'white', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', display: 'inline-block', lineHeight: 1.5 }}>
              {label}
            </span>
          </div>
        );
      }
    },
    {
      field: 'action',
      headerName: locale === 'ar' ? 'إجراءات' : 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', height: '100%' }}>
          <VisibilityOutlinedIcon onClick={() => openView(params.row.rawId)} style={{ color: '#EAB308', cursor: 'pointer', fontSize: '1.4rem' }} />
          <EditOutlinedIcon onClick={() => openEdit(params.row.rawId)} style={{ color: '#10B981', cursor: 'pointer', fontSize: '1.4rem' }} />
          {user?.role !== 'DATA_ENTRY' && (
            <DeleteOutlineOutlinedIcon onClick={() => handleDelete(params.row.rawId)} style={{ color: '#EF4444', cursor: 'pointer', fontSize: '1.4rem' }} />
          )}
        </div>
      )
    }
  ];
 
  const btnStyle = {
    backgroundColor: '#0F766E',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer'
  };
 
  return (
    <ThemeProvider theme={theme}>
      <div style={{ direction: 'rtl', padding: '2rem', minHeight: '100vh', fontFamily: 'inherit' }}>
        
        {/* Breadcrumb Header */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
          <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>{locale === 'ar' ? 'إدارة المطالبات' : 'Claims Management'}</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dashboard / Claims</span>
        </div>
 
        {/* Main Claim List Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>{locale === 'ar' ? 'قائمة المطالبات' : 'Claims List'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder={locale === 'ar' ? 'ابحث هنا...' : 'Search here...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', width: '250px', background: 'rgba(0,0,0,0.02)' }} 
              />
            </div>
          </div>
 
          <div style={{ width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              autoHeight
              rowHeight={60}
              columnHeaderHeight={60}
              disableRowSelectionOnClick
              disableColumnMenu
              hideFooterSelectedRowCount
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              sx={{
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                backgroundColor: 'transparent',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid var(--glass-border)',
                  borderRight: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                },
                '& .MuiDataGrid-columnHeaders': {
                  borderBottom: '2px solid var(--glass-border) !important',
                  backgroundColor: 'var(--surface) !important',
                  color: 'var(--text-main) !important',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                },
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: 'var(--surface) !important',
                  color: 'var(--text-main) !important',
                  borderRight: '1px solid var(--glass-border)',
                },
                '& .MuiDataGrid-topContainer': {
                  backgroundColor: 'var(--surface) !important',
                },
                '& .MuiDataGrid-filler': {
                  backgroundColor: 'var(--surface) !important',
                },
                '& .MuiDataGrid-scrollbarFiller': {
                  backgroundColor: 'var(--surface) !important',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.04)'
                },
                '& .MuiTablePagination-root': {
                  color: 'var(--text-main)',
                  direction: 'ltr',
                  fontSize: '0.9rem'
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid var(--glass-border)',
                  backgroundColor: 'transparent'
                }
              }}
            />
          </div>
        </div>

        {/* Create Claim Modal */}
        {isAddClaimOpen && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,backdropFilter:'blur(5px)'}}>
            <div className="glass-panel" style={{width:'100%',maxWidth:'450px',padding:'2rem',borderRadius:'12px',direction:'rtl'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',borderBottom:'1px solid var(--glass-border)',paddingBottom:'1rem'}}>
                <h2 style={{margin:0,fontSize:'1.25rem',color:'var(--text-main)'}}>{locale === 'ar' ? 'إضافة مطالبة جديدة' : 'Add New Claim'}</h2>
                <button onClick={() => setIsAddClaimOpen(false)} style={{background:'transparent',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'var(--text-muted)'}}>✕</button>
              </div>
              <form onSubmit={handleAddClaim} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div style={{ position: 'relative' }}>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'الوثيقة المرتبطة *' : 'Related Policy *'}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder={locale === 'ar' ? 'ابحث برقم الوثيقة أو اسم العميل...' : 'Search by policy number or client name...'} 
                      value={policySearchQuery}
                      onFocus={() => setIsPolicyDropdownOpen(true)}
                      onChange={e => {
                        setPolicySearchQuery(e.target.value);
                        setIsPolicyDropdownOpen(true);
                        if (e.target.value === '') {
                          setClaimForm({ ...claimForm, policy: '' });
                        }
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        paddingLeft: '2rem',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.05)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }} 
                    />
                    <span 
                      onClick={() => setIsPolicyDropdownOpen(!isPolicyDropdownOpen)}
                      style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        userSelect: 'none'
                      }}
                    >
                      ▼
                    </span>
                  </div>

                  {isPolicyDropdownOpen && (
                    <>
                      <div 
                        onClick={() => setIsPolicyDropdownOpen(false)} 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1005, background: 'transparent' }} 
                      />
                      <div 
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          zIndex: 1010,
                          marginTop: '0.25rem'
                        }}
                      >
                        {policies.filter(p => {
                          const cName = getCustomerName(p.id).toLowerCase();
                          const pNum = p.policy_number.toLowerCase();
                          const query = policySearchQuery.toLowerCase();
                          return pNum.includes(query) || cName.includes(query);
                        }).length === 0 ? (
                          <div style={{ padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>
                            لا توجد وثائق مطابقة 🔍
                          </div>
                        ) : (
                          policies.filter(p => {
                            const cName = getCustomerName(p.id).toLowerCase();
                            const pNum = p.policy_number.toLowerCase();
                            const query = policySearchQuery.toLowerCase();
                            return pNum.includes(query) || cName.includes(query);
                          }).map(p => {
                            const desc = `${p.policy_number} - ${getCustomerName(p.id)}`;
                            const isSelected = claimForm.policy === p.id.toString();
                            return (
                              <div 
                                key={p.id}
                                onClick={() => {
                                  setClaimForm({ ...claimForm, policy: p.id.toString() });
                                  setPolicySearchQuery(desc);
                                  setIsPolicyDropdownOpen(false);
                                }}
                                style={{
                                  padding: '0.75rem 1rem',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  backgroundColor: isSelected ? 'rgba(15, 118, 110, 0.1)' : 'transparent',
                                  color: isSelected ? '#0F766E' : 'var(--text-main)',
                                  borderBottom: '1px solid var(--glass-border)'
                                }}
                                onMouseOver={e => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)';
                                }}
                                onMouseOut={e => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {desc}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'رقم المطالبة *' : 'Claim Number *'}</label>
                  <input type="text" value={claimForm.claim_number} onChange={e => setClaimForm({...claimForm, claim_number: e.target.value})} required style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'مبلغ المطالبة *' : 'Claim Amount *'}</label>
                  <input type="number" step="0.01" value={claimForm.claim_amount} onChange={e => setClaimForm({...claimForm, claim_amount: e.target.value})} required style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'وصف المطالبة *' : 'Claim Description *'}</label>
                  <textarea value={claimForm.description} onChange={e => setClaimForm({...claimForm, description: e.target.value})} required rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none',resize:'vertical'}} />
                </div>
                <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}>
                  <button type="submit" style={{flex:1,backgroundColor:'#0F766E',color:'white',border:'none',padding:'0.75rem',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>{locale === 'ar' ? 'حفظ المطالبة' : 'Save Claim'}</button>
                  <button type="button" onClick={() => setIsAddClaimOpen(false)} style={{flex:1,backgroundColor:'transparent',color:'var(--text-main)',border:'1px solid var(--glass-border)',padding:'0.75rem',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Claim Details Modal */}
        {isViewOpen && selectedClaim && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,backdropFilter:'blur(5px)'}}>
            <div className="glass-panel" style={{width:'100%',maxWidth:'500px',padding:'2rem',borderRadius:'12px',direction:'rtl'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',borderBottom:'1px solid var(--glass-border)',paddingBottom:'1rem'}}>
                <h2 style={{margin:0,fontSize:'1.25rem',color:'var(--text-main)'}}>تفاصيل المطالبة #{selectedClaim.claim_number}</h2>
                <button onClick={() => { setIsViewOpen(false); setSelectedClaim(null); }} style={{background:'transparent',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'var(--text-muted)'}}>✕</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
                <div style={{background:'rgba(0,0,0,0.03)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>اسم العميل</div>
                  <div style={{fontWeight:'bold'}}>{getCustomerName(selectedClaim.policy)}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.03)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>رقم الوثيقة</div>
                  <div style={{fontWeight:'bold'}}>{getPolicyNumber(selectedClaim.policy)}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.03)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>مبلغ المطالبة</div>
                  <div style={{fontWeight:'bold',color:'var(--text-main)'}}>{formatAmount(selectedClaim.claim_amount)}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.03)',padding:'0.75rem 1rem',borderRadius:'8px'}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'حالة المطالبة' : 'Claim Status'}</div>
                  <div style={{fontWeight:'bold'}}>{
                    selectedClaim.status === 'PENDING' || selectedClaim.status === 'Submitted' ? locale === 'ar' ? 'قيد المراجعة' : 'Pending Review' :
                    selectedClaim.status === 'UNDER_REVIEW' ? locale === 'ar' ? 'تحت الإجراء' : 'In Progress' :
                    selectedClaim.status === 'APPROVED' ? locale === 'ar' ? 'مقبولة' : 'Approved' :
                    selectedClaim.status === 'REJECTED' ? locale === 'ar' ? 'مرفوضة' : 'Rejected' :
                    selectedClaim.status === 'CLOSED' ? locale === 'ar' ? 'مغلقة' : 'Closed' : selectedClaim.status
                  }</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.03)',padding:'0.75rem 1rem',borderRadius:'8px',gridColumn:'1/-1'}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'تاريخ تقديم المطالبة' : 'Claim Submission Date'}</div>
                  <div style={{fontWeight:'bold'}}>{new Date(selectedClaim.filed_date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.03)',padding:'0.75rem 1rem',borderRadius:'8px',gridColumn:'1/-1'}}>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.2rem'}}>{locale === 'ar' ? 'وصف المطالبة' : 'Claim Description'}</div>
                  <div style={{lineHeight:'1.6',whiteSpace:'pre-wrap'}}>{selectedClaim.description || '—'}</div>
                </div>
                {selectedClaim.status === 'REJECTED' && selectedClaim.rejection_reason && (
                  <div style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.15)',padding:'0.75rem 1rem',borderRadius:'8px',gridColumn:'1/-1',marginTop:'0.5rem'}}>
                    <div style={{fontSize:'0.8rem',color:'#EF4444',marginBottom:'0.2rem',fontWeight:'bold'}}>{locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}</div>
                    <div style={{lineHeight:'1.6',whiteSpace:'pre-wrap',color:'var(--text-main)'}}>{selectedClaim.rejection_reason}</div>
                  </div>
                )}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button onClick={() => { setIsViewOpen(false); setSelectedClaim(null); }} className="btn-primary" style={{padding:'0.5rem 1.5rem'}}>{locale === 'ar' ? 'إغلاق' : 'Close'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Claim Modal */}
        {isEditOpen && selectedClaim && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,backdropFilter:'blur(5px)'}}>
            <div className="glass-panel" style={{width:'100%',maxWidth:'480px',padding:'2rem',borderRadius:'12px',direction:'rtl'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',borderBottom:'1px solid var(--glass-border)',paddingBottom:'1rem'}}>
                <h2 style={{margin:0,fontSize:'1.25rem',color:'var(--text-main)'}}>تعديل المطالبة #{selectedClaim.claim_number}</h2>
                <button onClick={() => { setIsEditOpen(false); setSelectedClaim(null); }} style={{background:'transparent',border:'none',fontSize:'1.5rem',cursor:'pointer',color:'var(--text-muted)'}}>✕</button>
              </div>
              <form onSubmit={handleEditClaim} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'الوثيقة المرتبطة *' : 'Related Policy *'}</label>
                  <select value={editForm.policy} onChange={e => setEditForm({...editForm, policy: e.target.value})} required style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none'}}>
                    <option value="" style={{background:'var(--surface)'}}>{locale === 'ar' ? 'اختر الوثيقة...' : 'Select Policy...'}</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id} style={{background:'var(--surface)'}}>{p.policy_number} - {getCustomerName(p.id)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'رقم المطالبة *' : 'Claim Number *'}</label>
                  <input type="text" value={editForm.claim_number} onChange={e => setEditForm({...editForm, claim_number: e.target.value})} required style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'مبلغ المطالبة *' : 'Claim Amount *'}</label>
                  <input type="number" step="0.01" value={editForm.claim_amount} onChange={e => setEditForm({...editForm, claim_amount: e.target.value})} required style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none'}} />
                </div>
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'حالة المطالبة *' : 'Claim Status *'}</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} required style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none'}}>
                    <option value="PENDING" style={{background:'var(--surface)'}}>قيد المراجعة</option>
                    <option value="UNDER_REVIEW" style={{background:'var(--surface)'}}>تحت الإجراء</option>
                    <option value="APPROVED" style={{background:'var(--surface)'}}>مقبولة</option>
                    <option value="REJECTED" style={{background:'var(--surface)'}}>مرفوضة</option>
                    <option value="CLOSED" style={{background:'var(--surface)'}}>مغلقة</option>
                  </select>
                </div>
                {editForm.status === 'REJECTED' && (
                  <div>
                    <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'سبب الرفض *' : 'Rejection Reason *'}</label>
                    <textarea 
                      value={editForm.rejection_reason} 
                      onChange={e => setEditForm({...editForm, rejection_reason: e.target.value})} 
                      required 
                      rows={3} 
                      placeholder={locale === 'ar' ? 'اكتب سبب رفض المطالبة هنا...' : 'Write rejection reason here...'}
                      style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none',resize:'vertical',fontFamily:'inherit'}} 
                    />
                  </div>
                )}
                <div>
                  <label style={{fontSize:'0.85rem',color:'var(--text-muted)',display:'block',marginBottom:'0.3rem'}}>{locale === 'ar' ? 'وصف المطالبة *' : 'Claim Description *'}</label>
                  <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} required rows={3} style={{width:'100%',padding:'0.75rem',borderRadius:'8px',border:'1px solid var(--glass-border)',background:'rgba(0,0,0,0.05)',color:'var(--text-main)',outline:'none',resize:'vertical'}} />
                </div>
                <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}>
                  <button type="submit" style={{flex:1,backgroundColor:'#0F766E',color:'white',border:'none',padding:'0.75rem',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>{locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</button>
                  <button type="button" onClick={() => { setIsEditOpen(false); setSelectedClaim(null); }} style={{flex:1,backgroundColor:'transparent',color:'var(--text-main)',border:'1px solid var(--glass-border)',padding:'0.75rem',borderRadius:'8px',fontWeight:'bold',cursor:'pointer'}}>{locale === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

