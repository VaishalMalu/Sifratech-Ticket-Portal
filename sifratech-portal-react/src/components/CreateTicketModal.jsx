import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uid } from '../data/mockData';

export default function CreateTicketModal() {
  const { closeModal, openModal } = useModal();
  const { addTicket, slaConfig, team, usersList, incidentTypes, oracleModules, getActiveClient } = useData();
  const { currentUser } = useAuth();

  // Use all users for the dropdown as requested
  const allSystemUsers = usersList || [];

  const [summary, setSummary] = useState('');
  const [desc, setDesc] = useState('');
  const defaultType = incidentTypes && incidentTypes.length > 0 ? incidentTypes[0].name : '';
  const defaultModule = oracleModules && oracleModules.length > 0 ? oracleModules[0].name : '';
  const defaultPriority = slaConfig && slaConfig.length > 0 ? slaConfig[0].priority : 'Medium';
  const activeClientName = getActiveClient()?.name || 'Unknown';

  const [type, setType] = useState(defaultType);
  const [module, setModule] = useState(defaultModule);
  const [priority, setPriority] = useState(defaultPriority);
  const [env, setEnv] = useState('Production');
  const [project, setProject] = useState(`${activeClientName} Support`);
  const [mob, setMob] = useState('');
  const [ext, setExt] = useState('');
  const [cc, setCc] = useState('');
  const [assignee, setAssignee] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [closeDate, setCloseDate] = useState('');
  const [requestedBy, setRequestedBy] = useState('');

  const [aiPanel, setAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleAiTriage = () => {
    if (summary.length < 10) return;
    setAiPanel(true);
    setAiLoading(true);
    // Simulate AI
    setTimeout(() => {
      const demos = { financials: 'Financials', hrms: 'HRMS', scm: 'SCM', payroll: 'Payroll', invoice: 'Financials', journal: 'Financials', employee: 'HRMS', po: 'SCM', inventory: 'Inventory', sourcing: 'Sourcing' };
      let mod = 'Financials';
      for (const [k, v] of Object.entries(demos)) {
        if (summary.toLowerCase().includes(k)) { mod = v; break; }
      }
      const suggestedUser = allSystemUsers.length > 0 ? allSystemUsers[0].full_name : (team[0]?.name || 'Unassigned');
      setAiResult({ priority: 'High', module: mod, type: 'Bug', assignee: suggestedUser, reasoning: 'Demo triage based on keyword match.' });
      setAiLoading(false);
    }, 800);
  };

  const applyTriage = () => {
    if (aiResult) {
      setPriority(aiResult.priority);
      setModule(aiResult.module);
      setType(aiResult.type);
      setAssignee(aiResult.assignee);
    }
    setAiPanel(false);
  };

  const submitTicket = () => {
    if (!summary) return alert('Incident summary is required.');
    if (!desc) return alert('Long description is required.');

    const now = new Date();
    const slaHours = slaConfig?.find(s => s.priority === priority)?.resolution_hours || 24;
    const expected = new Date(now.getTime() + slaHours * 36e5);

    const t = {
      id: uid(),
      title: summary,
      description: desc,
      summary: desc, // Fallback if some logic still relies on summary
      type,
      module,
      priority,
      status: 'New',
      environment: env,
      project,
      detectedDate: now.toISOString(),
      createdAt: now.toISOString(),
      expectedDate: expected.toISOString(),
      raisedBy: currentUser.label,
      requestedBy: requestedBy,
      client: currentUser.client || activeClientName,
      assignedTo: assignee,
      assignedTeam: team?.length > 0 ? team[0].name : 'Unassigned',
      mobileNo: mob,
      extNo: ext,
      ccMail: cc,
      longDescription: desc,
      resolution: '',
      startDate: startDate || null,
      closeDate: closeDate || null,
      auditLog: [{ ts: now.toISOString(), by: 'System', msg: `Ticket created by ${currentUser.label}. Status: New.` }],
      comments: [],
      emailSent: true
    };

    addTicket(t);
    closeModal();
    setTimeout(() => {
      openModal('EMAIL_SIM', { ticket: t });
    }, 150);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="modal" style={{ maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-hdr">
          <div><h2>Create new ticket</h2><div className="sub">Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required</div></div>
          <button className="close-x" onClick={closeModal}>×</button>
        </div>
        <div className="fg">
          <div className="fl"><label>Project <span className="req">*</span></label><input value={project} onChange={e => setProject(e.target.value)} /></div>
          <div className="fl"><label>Detected date</label><input value={new Date().toLocaleDateString('en-GB')} readOnly /></div>
          
          <div className="fl"><label>Start date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div className="fl"><label>Close date</label><input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} /></div>

          <div className="fl full"><label>Incident Title <span className="req">*</span></label>
            <input placeholder="Short title for the incident" value={summary} onChange={e => { setSummary(e.target.value); setTimeout(handleAiTriage, 500); }} />
          </div>

          <div className="fl full"><label>Incident summary</label>
            <input placeholder="Describe the error/issue in one line" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          <div className="fl"><label>Incident type <span className="req">*</span></label>
            <select value={type} onChange={e => setType(e.target.value)}>
              {incidentTypes && incidentTypes.length > 0 ? (
                incidentTypes.map(t => <option key={t.id || t.name} value={t.name}>{t.name}</option>)
              ) : (
                <option>Bug</option>
              )}
            </select>
          </div>
          <div className="fl"><label>Module <span className="req">*</span></label>
            <select value={module} onChange={e => setModule(e.target.value)}>
              {oracleModules && oracleModules.length > 0 ? (
                oracleModules.map(m => <option key={m.id || m.name} value={m.name}>{m.name}</option>)
              ) : (
                <option>Unknown</option>
              )}
            </select>
          </div>
          <div className="fl"><label>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              {slaConfig && slaConfig.length > 0 ? (
                slaConfig.map(s => <option key={s.id || s.priority} value={s.priority}>{s.priority}</option>)
              ) : (
                <option>Medium</option>
              )}
            </select>
          </div>
          <div className="fl"><label>Environment</label>
            <select value={env} onChange={e => setEnv(e.target.value)}>
              <option>Development</option><option>Patching</option><option>Testing</option><option>Production</option>
            </select>
          </div>
          <div className="fl"><label>Raised by</label><input value={currentUser.label} readOnly /></div>
          <div className="fl"><label>Requested by</label><input placeholder="Name of business user" value={requestedBy} onChange={e => setRequestedBy(e.target.value)} /></div>
          <div className="fl"><label>Mobile no.</label><input placeholder="+971 xx xxx xxxx" value={mob} onChange={e => setMob(e.target.value)} /></div>
          <div className="fl"><label>Ext no.</label><input placeholder="Ext." value={ext} onChange={e => setExt(e.target.value)} /></div>
          <div className="fl full"><label>CC mail</label><input placeholder="comma-separated emails" value={cc} onChange={e => setCc(e.target.value)} /></div>
          {currentUser.canAssign && (
            <div className="fl"><label>Assign to</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)}>
                <option value="">— unassigned —</option>
                {allSystemUsers.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
              </select>
            </div>
          )}
          <div className="fl full"><label>Long description <span className="req">*</span></label>
            <textarea placeholder="Please describe the issue in detail." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
        </div>

        {aiPanel && (
          <div className="ai-panel">
            <div className="ai-panel-hdr"><span className="ai-badge">AI</span><span style={{ fontSize: '12px', color: '#2A4A6A', fontWeight: 500 }}>Smart triage suggestions</span></div>
            {aiLoading ? (
              <div className="ai-loading"><div className="ai-dot"></div><div className="ai-dot"></div><div className="ai-dot"></div><span style={{ marginLeft: '4px' }}>Analysing ticket...</span></div>
            ) : aiResult && (
              <>
                <div className="ai-result">
                  Priority: <strong style={{ color: 'var(--accent-bright)' }}>{aiResult.priority}</strong> &nbsp;|&nbsp; Module: <strong style={{ color: 'var(--accent-bright)' }}>{aiResult.module}</strong> &nbsp;|&nbsp; Type: <strong style={{ color: 'var(--accent-bright)' }}>{aiResult.type}</strong><br />
                  Suggested assignee: <strong style={{ color: 'var(--accent-bright)' }}>{aiResult.assignee}</strong><br />
                  <span style={{ color: '#6B7A8D', fontSize: '11px' }}>{aiResult.reasoning}</span>
                </div>
                <div className="ai-chips">
                  <span className="ai-chip" onClick={applyTriage}>Apply suggestions</span>
                  <span className="ai-chip" onClick={() => setAiPanel(false)}>Dismiss</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="form-actions">
          <button className="btn-s" onClick={closeModal}>Cancel</button>
          <button className="btn-p" onClick={submitTicket}>Create ticket</button>
        </div>
      </div>
    </div>
  );
}
