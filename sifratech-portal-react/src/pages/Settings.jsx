import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { bc } from '../data/mockData';
import { IconEdit, IconTrash } from '@tabler/icons-react';

export default function Settings() {
  const [activePanel, setActivePanel] = useState('users');
  const { 
    clients, setActiveClient,
    usersList, rolesList, teamsList, customerAccounts, slaConfig, oracleModules, incidentTypes, systemSettings,
    addUser, updateUser, deleteUser, dbAdd, dbUpdate, dbDelete, updateSystemSetting
  } = useData();

  const [modalState, setModalState] = useState({ open: false, type: null, data: null });
  const closeModal = () => setModalState({ open: false, type: null, data: null });

  const getAvatarStyle = (name) => {
    const sum = (name || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colors = ['#8B7FD4', '#E09A2B', '#1A9FCC', '#5BA8A4'];
    return { background: colors[sum % colors.length] };
  };

  // Modals for CRUD
  const Modal = () => {
    if (!modalState.open) return null;
    const { type, data } = modalState;

    const [formData, setFormData] = useState(data || {});

    const handleChange = (e) => {
      if (e.target.type === 'file') {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 300;
              const MAX_HEIGHT = 150;
              let width = img.width;
              let height = img.height;
              
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/png');
              
              setFormData({ ...formData, [e.target.name]: dataUrl });
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        }
      } else {
        setFormData({ ...formData, [e.target.name]: e.target.value });
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (type === 'USER') {
          if (data?.id) await updateUser(data.id, formData);
          else await addUser(formData);
        } else if (type === 'CLIENT') {
          if (data?.id) await dbUpdate('customer_accounts', data.id, formData);
          else await dbAdd('customer_accounts', formData);
        } else if (type === 'MODULE') {
          if (data?.id) await dbUpdate('oracle_modules', data.id, formData);
          else await dbAdd('oracle_modules', formData);
        } else if (type === 'INCIDENT_TYPE') {
          if (data?.id) await dbUpdate('incident_types', data.id, formData);
          else await dbAdd('incident_types', formData);
        }
        closeModal();
      } catch (err) {
        alert("Error: " + err.message);
      }
    };

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{data?.id ? 'Edit' : 'Add'} {type}</h3>
          <form onSubmit={handleSubmit} className="fg">
            
            {type === 'USER' && (
              <>
                <div className="fl full"><label>Full Name</label><input required name="full_name" value={formData.full_name || ''} onChange={handleChange} /></div>
                <div className="fl full"><label>Email</label><input required type="email" name="email" value={formData.email || ''} onChange={handleChange} /></div>
                {!data?.id && <div className="fl full"><label>Password (Visible)</label><input required type="text" name="password" value={formData.password || ''} onChange={handleChange} /></div>}
                <div className="fl full">
                  <label>Role</label>
                  <select name="role_id" value={formData.role_id || ''} onChange={handleChange}>
                    <option value="">Select a role</option>
                    {rolesList?.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="fl full">
                  <label>Team</label>
                  <select name="team_id" value={formData.team_id || ''} onChange={handleChange}>
                    <option value="">Select a team (optional)</option>
                    {teamsList?.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {type === 'CLIENT' && (
              <>
                <div className="fl full"><label>Company Name</label><input required name="company_name" value={formData.company_name || ''} onChange={handleChange} /></div>
                <div className="fl full"><label>Contact Email</label><input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange} /></div>
                <div className="fl full">
                  <label>Client Logo</label>
                  <input type="file" accept="image/*" name="logo_url" onChange={handleChange} />
                  {formData.logo_url && <img src={formData.logo_url} alt="Preview" style={{ marginTop: '8px', maxHeight: '40px', maxWidth: '100px', objectFit: 'contain' }} />}
                </div>
              </>
            )}

            {(type === 'MODULE' || type === 'INCIDENT_TYPE') && (
              <div className="fl full"><label>Name</label><input required name="name" value={formData.name || ''} onChange={handleChange} /></div>
            )}

            <div className="full form-actions">
              <button type="button" className="btn-s" onClick={closeModal}>Cancel</button>
              <button type="submit" className="btn-p">Save</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleDelete = async (table, id, isUser = false) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (isUser) await deleteUser(id);
        else await dbDelete(table, id);
      } catch (err) {
        alert("Error deleting: " + err.message);
      }
    }
  };

  return (
    <div className="page active" style={{ padding: '20px' }}>
      <Modal />
      <div className="page-header"><div className="page-title">Settings</div></div>
      <div className="settings-shell">
        <div className="s-nav">
          <div className="s-nav-sec">Administration</div>
          <div className={`s-nav-item ${activePanel === 'users' ? 'active' : ''}`} onClick={() => setActivePanel('users')}><i className="ti ti-users"></i> Users</div>
          <div className={`s-nav-item ${activePanel === 'clients' ? 'active' : ''}`} onClick={() => setActivePanel('clients')}><i className="ti ti-building"></i> Clients</div>
          <div className={`s-nav-item ${activePanel === 'roles' ? 'active' : ''}`} onClick={() => setActivePanel('roles')}><i className="ti ti-shield"></i> Roles</div>
          <div className="s-nav-sec">Configuration</div>
          <div className={`s-nav-item ${activePanel === 'sla' ? 'active' : ''}`} onClick={() => setActivePanel('sla')}><i className="ti ti-clock"></i> SLA targets</div>
          <div className={`s-nav-item ${activePanel === 'modules' ? 'active' : ''}`} onClick={() => setActivePanel('modules')}><i className="ti ti-layout-grid"></i> Modules & types</div>
          <div className="s-nav-sec">Notifications</div>
          <div className={`s-nav-item ${activePanel === 'email' ? 'active' : ''}`} onClick={() => setActivePanel('email')}><i className="ti ti-mail"></i> Email settings</div>
          <div className="s-nav-sec">Branding</div>
          <div className={`s-nav-item ${activePanel === 'branding' ? 'active' : ''}`} onClick={() => setActivePanel('branding')}><i className="ti ti-palette"></i> Portal branding</div>
          <div className="s-nav-sec">AI</div>
          <div className={`s-nav-item ${activePanel === 'ai' ? 'active' : ''}`} onClick={() => setActivePanel('ai')}><i className="ti ti-sparkles"></i> AI configuration</div>
        </div>
        <div className="s-panel">

          {/* ══════ USERS ══════ */}
          {activePanel === 'users' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div className="s-sec-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>Users ({usersList.length})</div>
                <button className="btn-p" onClick={() => setModalState({ open: true, type: 'USER', data: null })}><i className="ti ti-plus"></i> Add user</button>
              </div>
              {usersList.map((u, i) => (
                <div key={u.id || i} className="user-row">
                  <div className="avatar" style={{ ...getAvatarStyle(u.full_name), width: '34px', height: '34px', fontSize: '11px' }}>
                    {(u.full_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{u.full_name}</div>
                    <div className="user-meta">
                        {u.email}
                        {u.plain_password && <span style={{ marginLeft: '8px', color: '#1A9FCC', fontWeight: 500 }}>Pass: {u.plain_password}</span>}
                    </div>
                  </div>
                  <span className="rtag" style={{ background: '#eee' }}>{u.roles?.name || 'No Role'}</span>
                  {u.teams?.name && <span className="rtag" style={{ background: '#e0f2fe', color: '#0369a1', marginLeft: '4px' }}>{u.teams.name}</span>}
                  <button className="btn-s" style={{ marginLeft: '8px' }} onClick={() => setModalState({ open: true, type: 'USER', data: u })}><i className="ti ti-edit"></i></button>
                  <button className="btn-d" onClick={() => handleDelete(null, u.id, true)}><i className="ti ti-trash"></i></button>
                </div>
              ))}
            </div>
          )}

          {/* ══════ CLIENTS ══════ */}
          {activePanel === 'clients' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div className="s-sec-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>Clients</div>
                <button className="btn-p" onClick={() => setModalState({ open: true, type: 'CLIENT', data: null })}><i className="ti ti-plus"></i> Add client</button>
              </div>
              <div className="notice"><i className="ti ti-info-circle" style={{ flexShrink: 0, marginTop: '2px' }}></i> Set active client to switch the topbar logo and scope data to that client.</div>
              {customerAccounts.map(c => (
                <div key={c.id} className="user-row">
                  <div style={{ width: '80px', height: '36px', background: '#EEF2F7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {c.logo_url ? (
                      <img src={c.logo_url} style={{ maxWidth: '76px', maxHeight: '32px', objectFit: 'contain' }} alt="" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <span style={{ fontSize: '10px', color: '#9AA5B4' }}>{c.company_name[0]}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {c.company_name}
                      {clients.find(x => x.id === c.id)?.active && <>&nbsp;<span style={{ fontSize: '10px', color: 'var(--green)', background: 'rgba(76,175,125,.12)', padding: '2px 7px', borderRadius: '6px' }}>Active</span></>}
                    </div>
                    <div className="user-meta" style={{ color: '#6B7A8D' }}>{c.contact_email || 'No contact'} · {usersList.filter(u => u.roles?.name === 'Client' && u.teams?.name === c.company_name).length || 0} user(s)</div>
                  </div>
                  {!clients.find(x => x.id === c.id)?.active && (
                    <button className="btn-s" onClick={() => setActiveClient(c.id)}>Set active</button>
                  )}
                  <button className="btn-s" onClick={() => setModalState({ open: true, type: 'CLIENT', data: c })}><i className="ti ti-edit"></i></button>
                  <button className="btn-d" onClick={() => handleDelete('customer_accounts', c.id)}><i className="ti ti-trash"></i></button>
                </div>
              ))}
            </div>
          )}

          {/* ══════ ROLES ══════ */}
          {activePanel === 'roles' && (
            <div>
              <div className="s-sec-title">Role definitions</div>
              {rolesList.map((r) => (
                <div key={r.id} className="user-row" style={{ alignItems: 'flex-start' }}>
                  <span className="rtag" style={{ marginTop: '2px', whiteSpace: 'nowrap', background: '#eee' }}>{r.name}</span>
                  <div style={{ fontSize: '12px', color: '#3A4A5C', lineHeight: 1.7, flex: 1, marginLeft: '12px' }}>{r.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* ══════ SLA TARGETS ══════ */}
          {activePanel === 'sla' && (
            <div>
              <div className="s-sec-title">SLA targets</div>
              {slaConfig.map((s) => (
                <div key={s.id} className="sla-row">
                  <span className={`badge ${bc(s.priority, 'p')}`}>{s.priority}</span>
                  <input className="input-sm" type="number" defaultValue={s.resolution_hours} onBlur={(e) => dbUpdate('sla_configuration', s.id, { resolution_hours: parseInt(e.target.value) })} style={{ background: '#F5F8FB', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 'var(--r)', padding: '6px 10px', fontSize: '13px', width: '80px' }} />
                  <span style={{ fontSize: '12px', color: '#6B7A8D' }}>hours from creation</span>
                </div>
              ))}
            </div>
          )}

          {/* ══════ MODULES ══════ */}
          {activePanel === 'modules' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="s-sec-title">Oracle modules</div>
                <button className="btn-p" onClick={() => setModalState({ open: true, type: 'MODULE', data: null })}><i className="ti ti-plus"></i> Add module</button>
              </div>
              {oracleModules.map(v => (
                <div key={v.id} className="user-row" style={{ padding: '7px 0' }}>
                  <span style={{ flex: 1, fontSize: '13px', color: '#1A2A3A' }}>{v.name}</span>
                  <button className="btn-s" onClick={() => setModalState({ open: true, type: 'MODULE', data: v })}><i className="ti ti-edit"></i></button>
                  <button className="btn-d" onClick={() => handleDelete('oracle_modules', v.id)}><i className="ti ti-trash"></i></button>
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px' }}>
                <div className="s-sec-title">Incident types</div>
                <button className="btn-p" onClick={() => setModalState({ open: true, type: 'INCIDENT_TYPE', data: null })}><i className="ti ti-plus"></i> Add type</button>
              </div>
              {incidentTypes.map(v => (
                <div key={v.id} className="user-row" style={{ padding: '7px 0' }}>
                  <span style={{ flex: 1, fontSize: '13px', color: '#1A2A3A' }}>{v.name}</span>
                  <button className="btn-s" onClick={() => setModalState({ open: true, type: 'INCIDENT_TYPE', data: v })}><i className="ti ti-edit"></i></button>
                  <button className="btn-d" onClick={() => handleDelete('incident_types', v.id)}><i className="ti ti-trash"></i></button>
                </div>
              ))}
            </div>
          )}

          {/* ══════ EMAIL ══════ */}
          {activePanel === 'email' && (
            <div>
              <div className="s-sec-title">Email configuration</div>
              <div className="notice">
                <i className="ti ti-info-circle" style={{ flexShrink: 0, marginTop: '2px' }}></i> Use your Microsoft Graph/Outlook email (e.g. asmsupport@sifratc.com) for inbound processing and sending.
              </div>
              <div className="fg" style={{ maxWidth: '480px' }}>
                <div className="fl full"><label>From address</label><input className="input-sm" value={systemSettings.email_config?.from_address || ''} onChange={(e) => updateSystemSetting('email_config', { ...systemSettings.email_config, from_address: e.target.value })} /></div>
                <div className="fl full"><label>Inbound address</label><input className="input-sm" value={systemSettings.email_config?.inbound_address || ''} onChange={(e) => updateSystemSetting('email_config', { ...systemSettings.email_config, inbound_address: e.target.value })} /></div>
                <div className="fl full"><label>SMTP host</label><input className="input-sm" value={systemSettings.email_config?.smtp_host || ''} onChange={(e) => updateSystemSetting('email_config', { ...systemSettings.email_config, smtp_host: e.target.value })} placeholder="smtp.office365.com" /></div>
                <div className="fl"><label>Port</label><input className="input-sm" type="number" value={systemSettings.email_config?.smtp_port || ''} onChange={(e) => updateSystemSetting('email_config', { ...systemSettings.email_config, smtp_port: e.target.value })} placeholder="587" /></div>
                <div className="fl"><label>API key / Password</label><input type="password" className="input-sm" value={systemSettings.email_config?.smtp_key || ''} onChange={(e) => updateSystemSetting('email_config', { ...systemSettings.email_config, smtp_key: e.target.value })} placeholder="••••••••" /></div>
              </div>
              
              <div className="s-sec-title" style={{ marginTop: '22px' }}>Triggers</div>
              <div className="tgl-row"><div className={`toggle ${systemSettings.email_config?.notify_on_create ? 'on' : ''}`} onClick={() => updateSystemSetting('email_config', { ...systemSettings.email_config, notify_on_create: !systemSettings.email_config?.notify_on_create })}></div> Notify raiser on ticket creation</div>
              <div className="tgl-row"><div className={`toggle ${systemSettings.email_config?.notify_on_status ? 'on' : ''}`} onClick={() => updateSystemSetting('email_config', { ...systemSettings.email_config, notify_on_status: !systemSettings.email_config?.notify_on_status })}></div> Notify raiser on status change</div>
              <div className="tgl-row"><div className={`toggle ${systemSettings.email_config?.notify_on_comment ? 'on' : ''}`} onClick={() => updateSystemSetting('email_config', { ...systemSettings.email_config, notify_on_comment: !systemSettings.email_config?.notify_on_comment })}></div> Notify raiser on new comment</div>
            </div>
          )}

          {/* ══════ BRANDING ══════ */}
          {activePanel === 'branding' && (
            <div>
              <div className="s-sec-title">Portal branding</div>
              <div className="fg" style={{ maxWidth: '480px' }}>
                <div className="fl full"><label>Portal name</label><input className="input-sm" value={systemSettings.branding_config?.portal_name || ''} onChange={(e) => updateSystemSetting('branding_config', { ...systemSettings.branding_config, portal_name: e.target.value })} /></div>
                <div className="fl full"><label>Support contact email</label><input className="input-sm" value={systemSettings.branding_config?.support_email || ''} onChange={(e) => updateSystemSetting('branding_config', { ...systemSettings.branding_config, support_email: e.target.value })} /></div>
              </div>
            </div>
          )}

          {/* ══════ AI ══════ */}
          {activePanel === 'ai' && (
            <div>
              <div className="s-sec-title">AI configuration</div>
              <div className="fg" style={{ maxWidth: '480px' }}>
                <div className="fl full"><label>Anthropic API key</label><input type="password" className="input-sm" value={systemSettings.ai_config?.anthropic_key || ''} onChange={(e) => updateSystemSetting('ai_config', { ...systemSettings.ai_config, anthropic_key: e.target.value })} /></div>
              </div>
              <div className="s-sec-title" style={{ marginTop: '22px' }}>Active AI features</div>
              <div className="tgl-row"><div className={`toggle ${systemSettings.ai_config?.auto_triage ? 'on' : ''}`} onClick={() => updateSystemSetting('ai_config', { ...systemSettings.ai_config, auto_triage: !systemSettings.ai_config?.auto_triage })}></div> Auto-triage</div>
              <div className="tgl-row"><div className={`toggle ${systemSettings.ai_config?.reply_suggestions ? 'on' : ''}`} onClick={() => updateSystemSetting('ai_config', { ...systemSettings.ai_config, reply_suggestions: !systemSettings.ai_config?.reply_suggestions })}></div> Reply suggestions</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
