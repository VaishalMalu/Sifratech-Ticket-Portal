import React, { useState, useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { bc, age, fmt } from '../data/mockData';
import { IconSparkles } from '@tabler/icons-react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const STATUS_COLORS = { 'Open': '#3ECDC2', 'In Progress': '#E09A2B', 'Awaiting Customer': '#E09A2B', 'Resolved': '#4CAF7D', 'Closed': '#3A4A5C', 'Reopened': '#E05252', 'Assigned': '#1A9FCC' };

const ADMIN_TRANSITIONS = {
  'Open': ['Assigned', 'Closed'],
  'Assigned': ['In Progress', 'Awaiting Customer', 'Closed', 'Open'],
  'In Progress': ['Resolved', 'Awaiting Customer', 'Closed'],
  'Awaiting Customer': ['In Progress', 'Resolved', 'Closed'],
  'Resolved': ['Closed', 'Reopened'],
  'Closed': ['Reopened'],
  'default': ['Open', 'Closed']
};

const SUPPORT_TRANSITIONS = {
  'Open': ['Assigned'],
  'Assigned': ['In Progress', 'Awaiting Customer'],
  'In Progress': ['Resolved', 'Awaiting Customer'],
  'Awaiting Customer': ['In Progress', 'Resolved'],
  'default': []
};

const CLIENT_TRANSITIONS = {
  'Resolved': ['Closed', 'Reopened'],
  'default': []
};

export default function TicketDetailModal() {
  const { modal, closeModal } = useModal();
  const { allTickets, sla, updateTicketStatus, team, addComment, saveResolution, reassignTicket, usersList } = useData();
  const { currentUser } = useAuth();
  const { ticketId } = modal.props;

  const t = allTickets.find(x => x.id === ticketId);
  const [resNotes, setResNotes] = useState('');
  const [commentTxt, setCommentTxt] = useState('');
  const [assignSel, setAssignSel] = useState('');
  const [updating, setUpdating] = useState('');
  
  const [aiSumLoading, setAiSumLoading] = useState(true);
  const [aiSumResult, setAiSumResult] = useState(null);
  
  const [aiRepPanel, setAiRepPanel] = useState(false);
  const [aiRepLoading, setAiRepLoading] = useState(false);
  const [aiRepResult, setAiRepResult] = useState('');

  const [aiSumBtnLoading, setAiSumBtnLoading] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');

  useEffect(() => {
    if (t) {
      setResNotes(t.resolution || '');
      setAssignSel(t.status === 'Pending Approval' || t.assignedTo === 'Unassigned' ? '' : (t.assignedTo || ''));
      
      // AI Summary Sim
      const timer = setTimeout(() => {
        setAiSumResult({
          summary: "Client is experiencing an issue, requiring attention.",
          sentiment: "Neutral", sentimentColor: "amber",
          urgency: t.priority, nextAction: "Review ticket logs and contact user."
        });
        setAiSumLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [t]);

  if (!t || !currentUser) return null;

  const role = currentUser;
  const canUp = role.canClose || role.isSupport || role.seeAll;
  
  let stats = [];
  if (role.role === 'Account Manager' || role.isAdmin || role.role === 'Delivery Manager' || role.role === 'Manager') {
    stats = ADMIN_TRANSITIONS[t.status] || ADMIN_TRANSITIONS['default'];
  } else if (role.isSupport) {
    stats = SUPPORT_TRANSITIONS[t.status] || SUPPORT_TRANSITIONS['default'];
  } else {
    stats = CLIENT_TRANSITIONS[t.status] || CLIENT_TRANSITIONS['default'];
  }

  // Prevent moving to working/closed states if nobody is assigned
  if (!t.assignedTo || t.assignedTo === 'Unassigned') {
    stats = stats.filter(s => s !== 'In Progress' && s !== 'Resolved' && s !== 'Closed' && s !== 'Awaiting Customer');
  }

  // Use all users for the dropdown as requested
  const allSystemUsers = usersList || [];
  const handleStatusUpdate = async (s) => {
    if (!commentTxt.trim()) {
      toast.error('Please add a comment before updating the status.');
      return;
    }
    setUpdating(`status-${s}`);
    await addComment(t.id, commentTxt);
    setCommentTxt('');
    await updateTicketStatus(t.id, s);
    setUpdating('');
  };
  const handleAssign = async () => { 
    if(assignSel) { 
      setUpdating('assign'); 
      try {
        await reassignTicket(t.id, assignSel); 
      } catch (e) {
        toast.error('handleAssign Error: ' + e.message);
      }
      setUpdating(''); 
    } 
  };
  const handleSaveRes = async () => { setUpdating('res'); await saveResolution(t.id, resNotes); setUpdating(''); };
  const handleAddComment = async () => { 
    if(commentTxt.trim()){ 
      setUpdating('comment'); 
      const assignedUserComments = t.comments.filter(c => c.by === t.assignedTo);
      const isFirstComment = assignedUserComments.length === 0;
      await addComment(t.id, commentTxt); 
      
      if (isFirstComment && (t.status === 'Open' || t.status === 'Assigned' || t.status === 'New') && role.label === t.assignedTo) {
        await updateTicketStatus(t.id, 'In Progress');
      }

      setCommentTxt(''); 
      setUpdating(''); 
    } 
  };
  
  const handleAiSummarize = async () => {
    if (aiSummaryText) {
       setShowAiSummary(true);
       return;
    }
    setAiSumBtnLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: t.longDescription })
      });
      const data = await response.json();
      setAiSummaryText(data.summary || "AI failed to generate a summary.");
      setShowAiSummary(true);
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while generating AI summary.");
    } finally {
      setAiSumBtnLoading(false);
    }
  };

  const handleAiReply = async () => {
    setAiRepPanel(true);
    setAiRepLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/ai/suggest-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t.summary,
          description: t.longDescription,
          notes: resNotes
        })
      });
      const data = await response.json();
      setAiRepResult(data.suggestion || "AI failed to generate a response.");
    } catch (err) {
      console.error(err);
      setAiRepResult("An error occurred while generating AI response.");
    } finally {
      setAiRepLoading(false);
    }
  };

  const aAge = age(t.createdAt);
  const breached = aAge > sla[t.priority];

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split(/(\[.*?\]\(.*?\))/g).map((part, idx) => {
      const m = part.match(/\[(.*?)\]\((.*?)\)/);
      if (m) {
        const url = m[2];
        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || m[1].match(/\.(jpeg|jpg|gif|png|webp)$/i);
        if (isImage) {
          return (
            <div key={idx} style={{ marginTop: '8px', marginBottom: '8px' }}>
              <a href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={m[1]} style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', border: '1px solid #E2E8F0' }} />
              </a>
            </div>
          );
        }
        return <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ color: '#1A5FA8', textDecoration: 'underline' }}>{m[1]}</a>;
      }
      return <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
    });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="modal" style={{ maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-hdr">
          <div><div style={{ fontSize: '11px', color: '#6B7A8D', fontFamily: 'var(--mono)', marginBottom: '4px' }}>{t.number || t.id}</div><h2>{t.summary}</h2></div>
          <button className="close-x" onClick={closeModal}>×</button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span className={`badge ${bc(t.status, 's')}`}><span style={{ opacity: 0.6, fontWeight: 'normal', marginRight: '4px' }}>Status:</span>{t.status}</span>
          <span className={`badge ${bc(t.priority, 'p')}`}><span style={{ opacity: 0.6, fontWeight: 'normal', marginRight: '4px' }}>Priority:</span>{t.priority}</span>
          <span className="badge" style={{ background: 'rgba(255,255,255,.07)', color: '#3A4A5C' }}><span style={{ opacity: 0.6, fontWeight: 'normal', marginRight: '4px' }}>Module:</span>{t.module}</span>
          <span className="badge" style={{ background: 'rgba(255,255,255,.07)', color: '#3A4A5C' }}><span style={{ opacity: 0.6, fontWeight: 'normal', marginRight: '4px' }}>Type:</span>{t.type}</span>
          {breached && <span className="badge b-high">SLA breached — {aAge}h</span>}
        </div>

        <div className="ai-panel">
          <div className="ai-panel-hdr"><span className="ai-badge">AI</span><span style={{ fontSize: '12px', color: '#2A4A6A', fontWeight: 500 }}>Ticket analysis & sentiment</span></div>
          {aiSumLoading ? (
            <div className="ai-loading"><div className="ai-dot"></div><div className="ai-dot"></div><div className="ai-dot"></div><span style={{ marginLeft: '4px' }}>Analysing...</span></div>
          ) : (
            <div className="ai-result">{aiSumResult.summary}<br/><br/>
              Sentiment: <strong style={{ color: `var(--${aiSumResult.sentimentColor})` }}>{aiSumResult.sentiment}</strong> &nbsp;·&nbsp; Urgency: <strong style={{ color: 'var(--accent-bright)' }}>{aiSumResult.urgency}</strong><br/>
              <span style={{ color: '#6B7A8D' }}>Next action: {aiSumResult.nextAction}</span>
            </div>
          )}
        </div>

        <div className="det-section" style={{ marginTop: '16px' }}><h3>Ticket details</h3>
          <div className="det-grid">
            <div className="det-row"><span className="lbl">Project</span><span>{t.project}</span></div>
            <div className="det-row"><span className="lbl">Environment</span><span>{t.environment}</span></div>
            <div className="det-row"><span className="lbl">Detected</span><span>{fmt(t.detectedDate)}</span></div>
            <div className="det-row"><span className="lbl">Expected resolution</span><span>{fmt(t.expectedDate)}</span></div>
            <div className="det-row"><span className="lbl">Raised by</span><span>{t.raisedBy}</span></div>
            <div className="det-row"><span className="lbl">Email</span><span>{t.email || '—'}</span></div>
            <div className="det-row"><span className="lbl">Assigned to</span><span>{t.assignedTo || 'Unassigned'}</span></div>
            <div className="det-row"><span className="lbl">Team</span><span>{t.assignedTeam}</span></div>
            {t.closedAt && <div className="det-row"><span className="lbl">Closed</span><span>{fmt(t.closedAt)}</span></div>}
            <div className="det-row"><span className="lbl">Ticket Age</span><span className={breached ? 'ageing-warn' : ''}>{Math.max(0, Math.round(aAge / 24))} days</span></div>
          </div>
        </div>

        <div className="det-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0 }}>Description</h3>
            {!showAiSummary && (
              <button className="btn-p" style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #1A5FA8' }} onClick={handleAiSummarize} disabled={aiSumBtnLoading}>
                <IconSparkles size={12} style={{ marginRight: 4 }}/> {aiSumBtnLoading ? 'Summarizing...' : 'AI Summarize'}
              </button>
            )}
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#3A4A5C', whiteSpace: 'pre-wrap', margin: 0 }}>
             {showAiSummary ? aiSummaryText : renderMarkdown(t.longDescription)}
          </p>
          {showAiSummary && (
             <div style={{ marginTop: '8px' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setShowAiSummary(false); }} style={{ fontSize: '11px', color: '#1A5FA8' }}>Show original description</a>
             </div>
          )}
        </div>
        {t.resolution && <div className="det-section"><h3>Resolution</h3><p style={{ fontSize: '13px', lineHeight: 1.7, color: '#3A4A5C', whiteSpace: 'pre-wrap', margin: 0 }}>{t.resolution}</p></div>}

        {canUp && (
          <div className="det-section"><h3>Update status</h3>
            {t.status === 'Pending Approval' && role.role === 'Account Manager' && (
               <div style={{ marginBottom: '16px', background: '#F5F8FB', padding: '12px', borderRadius: 'var(--r)', border: '0.5px solid rgba(0,0,0,0.15)' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1A2A3A', marginBottom: '8px' }}>
                    <strong>AI Assignment Suggestion:</strong> {t.assignedTo}
                  </p>
                  <button className="btn-p" onClick={async () => {
                     setUpdating('approve');
                     await updateTicketStatus(t.id, 'Assigned');
                     setUpdating('');
                  }} disabled={!!updating}>
                    {updating === 'approve' ? 'Approving...' : 'Approve AI Assignment'}
                  </button>
               </div>
            )}
            <div className="status-btns">
              {stats.filter(s => s !== t.status).map(s => {
                return (
                  <button key={s} className="btn-s" onClick={() => handleStatusUpdate(s)} disabled={!!updating} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_COLORS[s] || '#ccc' }}></span>
                    {updating === `status-${s}` ? 'Updating...' : s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(role.role === 'Account Manager' || role.isAdmin) && (
          <div className="det-section"><h3>Ticket Assignment</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={assignSel} onChange={e => setAssignSel(e.target.value)} style={{ background: '#FFFFFF', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 'var(--r)', padding: '7px 10px', fontSize: '12px', color: '#1A2A3A', fontFamily: 'var(--font)' }}>
                <option value="">— {(!t.assignedTo || t.assignedTo === 'Unassigned' || t.status === 'Pending Approval') ? 'assign to' : 'reassign to'} —</option>
                {allSystemUsers.map(m => <option key={m.id} value={m.full_name}>{m.full_name}</option>)}
              </select>
              <button className="btn-s" onClick={handleAssign} disabled={!!updating}>{updating === 'assign' ? ((!t.assignedTo || t.assignedTo === 'Unassigned' || t.status === 'Pending Approval') ? 'Assigning...' : 'Reassigning...') : ((!t.assignedTo || t.assignedTo === 'Unassigned' || t.status === 'Pending Approval') ? 'Assign Engineer' : 'Reassign Engineer')}</button>
            </div>
          </div>
        )}

        {canUp && t.status === 'Resolved' && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '10px', fontWeight: 600, color: '#6B7A8D', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Resolution notes</label>
                <textarea value={resNotes} onChange={e => setResNotes(e.target.value)} style={{ width: '100%', background: '#F5F8FB', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 'var(--r)', padding: '8px 11px', fontSize: '13px', color: '#1A2A3A', fontFamily: 'var(--font)', minHeight: '70px', outline: 'none' }}></textarea>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn-s" onClick={handleSaveRes} disabled={!!updating}>{updating === 'res' ? 'Saving...' : 'Save resolution'}</button>
                  <button className="btn-p" onClick={handleAiReply} disabled={aiRepLoading}><IconSparkles size={14} style={{ marginRight: 4 }}/> AI reply suggestion</button>
                </div>
              </div>
            )}

        {aiRepPanel && (
          <div className="ai-panel">
            <div className="ai-panel-hdr"><span className="ai-badge">AI</span><span style={{ fontSize: '12px', color: '#2A4A6A', fontWeight: 500 }}>Suggested resolution reply</span></div>
            {aiRepLoading ? (
              <div className="ai-loading"><div className="ai-dot"></div><div className="ai-dot"></div><div className="ai-dot"></div><span style={{ marginLeft: '4px' }}>Generating reply...</span></div>
            ) : (
              <>
                <div className="ai-result" style={{ whiteSpace: 'pre-wrap' }}>{aiRepResult}</div>
                <div className="ai-chips">
                  <span className="ai-chip" onClick={() => { setResNotes(aiRepResult); setAiRepPanel(false); }}>Use this reply</span>
                  <span className="ai-chip" onClick={handleAiReply}>Regenerate</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="det-section"><h3>Comments</h3>
          <div className="comment-box">
            {t.comments.length ? t.comments.map((c, i) => (
              <div key={i} className="comment-entry">
                <div className="comment-meta">{c.by} · {fmt(c.ts)}</div>
                <div style={{ color: '#1A2A3A', whiteSpace: 'pre-wrap' }}>
                  {renderMarkdown(c.msg)}
                </div>
              </div>
            )) : <div style={{ fontSize: '12px', color: '#6B7A8D', marginBottom: '10px' }}>No comments yet.</div>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
              <input value={commentTxt} onChange={e => setCommentTxt(e.target.value)} disabled={!!updating} style={{ flex: 1, background: '#FFFFFF', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 'var(--r)', padding: '7px 10px', fontSize: '12px', color: '#1A2A3A', fontFamily: 'var(--font)', outline: 'none' }} placeholder="Add a comment..." />
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: '#F5F8FB', borderRadius: '4px', border: '0.5px solid rgba(0,0,0,0.15)' }}>
                <input type="file" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUpdating('upload');
                  const { data, error } = await supabase.storage.from('ticket-attachments').upload(`${t.id}/${Date.now()}_${file.name}`, file);
                  if (data) {
                    const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(data.path);
                    setCommentTxt(prev => prev + (prev ? '\n\n' : '') + `[Attachment: ${file.name}](${publicUrl})`);
                    toast.success('File loaded and ready to post');
                  } else {
                    console.error('File Upload Error:', error);
                    toast.error('Failed to upload file: ' + (error?.message || 'Unknown Error'));
                  }
                  setUpdating('');
                }} accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.zip" disabled={!!updating} />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A5A6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </label>
              <button className="btn-s" onClick={handleAddComment} disabled={!!updating}>{updating === 'comment' ? 'Posting...' : updating === 'upload' ? 'Uploading...' : 'Post'}</button>
            </div>
          </div>
        </div>

        <div className="det-section"><h3>Audit log</h3>
          {t.auditLog.map((a, i) => <div key={i} className="audit-entry">{fmt(a.ts)} — <strong>{a.by}</strong>: {a.msg}</div>)}
        </div>
      </div>
    </div>
  );
}
