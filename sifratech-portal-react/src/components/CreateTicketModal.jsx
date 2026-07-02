import React, { useState } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uid } from '../data/mockData';

export default function CreateTicketModal() {
  const { closeModal, openModal } = useModal();
  const { addTicket, sla, team, usersList, incidentTypes } = useData();
  const { currentUser } = useAuth();

  // Use all users for the dropdown as requested
  const allSystemUsers = usersList || [];

  const [summary, setSummary] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('Bug');
  const [module, setModule] = useState('Financials');
  const [priority, setPriority] = useState('Medium');
  const [env, setEnv] = useState('Development');
  const [project, setProject] = useState('Oracle EBS R12');
  const [mob, setMob] = useState('');
  const [ext, setExt] = useState('');
  const [cc, setCc] = useState('');
  const [assignee, setAssignee] = useState('');

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
    const expected = new Date(now.getTime() + (sla[priority] || 24) * 36e5);

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
      client: currentUser.client || 'Al Seer Marine',
      assignedTo: assignee,
      assignedTeam: 'Sifratech Support',
      mobileNo: mob,
      extNo: ext,
      ccMail: cc,
      longDescription: desc,
      resolution: '',
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
      <div className="modal">
        <div className="modal-hdr">
          <div><h2>Create new ticket</h2><div className="sub">Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required</div></div>
          <button className="close-x" onClick={closeModal}>×</button>
        </div>
        <div className="fg">
          <div className="fl"><label>Project <span className="req">*</span></label><input value={project} onChange={e => setProject(e.target.value)} /></div>
          <div className="fl"><label>Detected date</label><input value={new Date().toLocaleDateString('en-GB')} readOnly /></div>
          
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
              <option>Financials</option><option>HRMS</option><option>SCM</option><option>PPM</option><option>Sourcing</option><option>Inventory</option><option>Payroll</option><option>Other</option>
            </select>
          </div>
          <div className="fl"><label>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)}>
              <option>High</option><option>Medium</option><option>Low</option><option>Top</option><option>Project</option>
            </select>
          </div>
          <div className="fl"><label>Environment</label>
            <select value={env} onChange={e => setEnv(e.target.value)}>
              <option>Development</option><option>Patching</option><option>Testing</option><option>Production</option>
            </select>
          </div>
          <div className="fl"><label>Detected by</label><input value={currentUser.label} readOnly /></div>
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
