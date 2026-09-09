import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { reportsApi } from '../services/reportsApi';
import WSRPreview from './WSRPreview';
import { IconSparkles, IconDeviceFloppy, IconEye, IconRefresh, IconCalendar, IconBuilding, IconAlertTriangle } from '@tabler/icons-react';
import toast from 'react-hot-toast';

export default function WSRGenerator({ initialDraft = null, onSaved }) {
  const { clients, tickets } = useData();
  const { currentUser } = useAuth();

  // Compute available company/account names from clients and tickets
  const accountOptions = React.useMemo(() => {
    const list = new Set();
    clients?.forEach(c => {
      if (c.name) list.add(c.name);
    });
    tickets?.forEach(t => {
      if (t.company) list.add(t.company);
    });
    return Array.from(list);
  }, [clients, tickets]);

  // Default dates: past 7 days
  const today = new Date();
  const past7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const formatDate = (d) => d.toISOString().split('T')[0];

  const [draftId, setDraftId] = useState(initialDraft?.id || null);
  const [accountName, setAccountName] = useState(initialDraft?.account_name || accountOptions[0] || 'ASM- Oracle Fusion support');
  const [projectName, setProjectName] = useState(initialDraft?.project_name || 'Oracle Support');
  const [startDate, setStartDate] = useState(initialDraft?.startDate || formatDate(past7Days));
  const [endDate, setEndDate] = useState(initialDraft?.endDate || formatDate(today));

  const [metrics, setMetrics] = useState(initialDraft?.metrics || null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Form Fields
  const [keyActivities, setKeyActivities] = useState(initialDraft?.key_activities || '');
  const [pendingItems, setPendingItems] = useState(initialDraft?.pending_items || '');
  const [risksBlockers, setRisksBlockers] = useState(initialDraft?.risks_blockers || '');
  const [nextActions, setNextActions] = useState(initialDraft?.next_actions || '');
  const [managementComments, setManagementComments] = useState(initialDraft?.management_comments || '');
  const [aiSummary, setAiSummary] = useState(initialDraft?.ai_summary || '');
  
  const [generatingAi, setGeneratingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch metrics automatically or on demand
  const handleFetchMetrics = async (forceSyncNarratives = false) => {
    if (!accountName) {
      toast.error('Please select an Account');
      return;
    }
    setLoadingMetrics(true);
    try {
      const res = await reportsApi.generateMetrics(accountName, startDate, endDate);
      const m = res.metrics || {};
      setMetrics(m);

      if (forceSyncNarratives || !keyActivities || keyActivities.startsWith('Completed & resolved') || keyActivities.startsWith('Zero ticket')) {
        if (m.autoKeyActivities) setKeyActivities(m.autoKeyActivities);
      }
      if (forceSyncNarratives || !risksBlockers || risksBlockers.startsWith('Active High/Critical') || risksBlockers.startsWith('No active Critical')) {
        if (m.autoRisksBlockers) setRisksBlockers(m.autoRisksBlockers);
      }
      if (forceSyncNarratives || !pendingItems || pendingItems.startsWith('Current active work') || pendingItems.startsWith('No pending client')) {
        if (m.autoPendingItems) setPendingItems(m.autoPendingItems);
      }
      if (forceSyncNarratives || !nextActions || nextActions.startsWith('1. Prioritize') || nextActions.startsWith('Continue proactive')) {
        if (m.autoNextActions) setNextActions(m.autoNextActions);
      }

      toast.success('Operational metrics & real-time ticket insights updated!');
    } catch (err) {
      console.error('Error fetching metrics:', err);
      toast.error('Failed to calculate metrics: ' + err.message);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleAutoPopulate = () => {
    handleFetchMetrics(true);
  };

  useEffect(() => {
    if (!metrics && accountName) {
      handleFetchMetrics();
    }
  }, [accountName]);

  const handleGenerateAISummary = async () => {
    if (!metrics) {
      toast.error('Please generate metrics first.');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await reportsApi.generateAISummary({
        account: accountName,
        project: projectName,
        period: `${startDate} to ${endDate}`,
        ...metrics,
        keyActivities,
        risksBlockers
      });
      setAiSummary(res.summary || '');
      toast.success('AI Executive Summary generated!');
    } catch (err) {
      console.error('AI summary error:', err);
      toast.error('Failed to generate AI summary: ' + err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSave = async (status = 'Draft') => {
    if (!accountName) {
      toast.error('Account Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: draftId,
        account_name: accountName,
        project_name: projectName,
        reporting_week: endDate,
        key_activities: keyActivities,
        pending_items: pendingItems,
        risks_blockers: risksBlockers,
        next_actions: nextActions,
        management_comments: managementComments,
        ai_summary: aiSummary,
        status: status
      };
      const res = await reportsApi.saveWsrDraft(payload);
      setDraftId(res.id);
      toast.success(`WSR ${status === 'Draft' ? 'Draft' : 'Report'} saved successfully!`);
      if (onSaved) onSaved(res);
    } catch (err) {
      console.error('Save WSR error:', err);
      toast.error('Failed to save WSR: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (showPreview) {
    return (
      <WSRPreview
        reportData={{
          account_name: accountName,
          project_name: projectName,
          startDate,
          endDate,
          metrics: metrics || {},
          key_activities: keyActivities,
          pending_items: pendingItems,
          risks_blockers: risksBlockers,
          next_actions: nextActions,
          management_comments: managementComments,
          ai_summary: aiSummary,
          author: currentUser?.label || 'Account Manager'
        }}
        onBack={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="wsr-generator" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter & Generation Controls */}
      <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A2A3A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCalendar size={18} color="#1A5FA8" /> WSR Parameters & Period
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          <div className="fl">
            <label>Select Account / Company</label>
            <select value={accountName} onChange={(e) => setAccountName(e.target.value)} style={{ width: '100%' }}>
              {accountOptions.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>

          <div className="fl">
            <label>Project Track Name</label>
            <input 
              type="text" 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)} 
              placeholder="e.g. Fusion Support / Phase 2" 
            />
          </div>

          <div className="fl">
            <label>Week Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>

          <div className="fl">
            <label>Week End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>

          <div>
            <button 
              className="btn-p" 
              onClick={handleFetchMetrics} 
              disabled={loadingMetrics}
              style={{ width: '100%', height: '38px', justifyContent: 'center' }}
            >
              <IconRefresh size={16} className={loadingMetrics ? 'spin' : ''} />
              {loadingMetrics ? 'Calculating...' : 'Recalculate Metrics'}
            </button>
          </div>
        </div>
      </div>

      {/* Calculated Metrics Summary Grid */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div className="kpi-card brand">
            <div className="kpi-lbl">New Tickets Logged</div>
            <div className="kpi-val" style={{ color: '#1A5FA8' }}>{metrics.newTickets || 0}</div>
            <div className="kpi-delta">In reporting week</div>
          </div>

          <div className="kpi-card ok">
            <div className="kpi-lbl">Tickets Resolved</div>
            <div className="kpi-val" style={{ color: '#16A34A' }}>{metrics.resolvedTickets || 0}</div>
            <div className="kpi-delta">Solution provided</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-lbl">Tickets Closed</div>
            <div className="kpi-val" style={{ color: '#475569' }}>{metrics.closedTickets || 0}</div>
            <div className="kpi-delta">Verified by user</div>
          </div>

          <div className={`kpi-card ${(metrics.currentlyOpen || 0) > 15 ? 'alert' : 'warn'}`}>
            <div className="kpi-lbl">Current Open Backlog</div>
            <div className="kpi-val" style={{ color: (metrics.currentlyOpen || 0) > 15 ? '#DC2626' : '#D97706' }}>
              {metrics.currentlyOpen || 0}
            </div>
            <div className="kpi-delta">Active workload</div>
          </div>
        </div>
      )}

      {/* AI Summary Generator Panel */}
      <div className="ai-panel" style={{ marginTop: '0', background: '#F0F7FF', border: '1px solid #BAE6FD' }}>
        <div className="ai-panel-hdr" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="ai-badge">AI EXECUTIVE SUMMARY</span>
            <span style={{ fontSize: '11px', color: '#6B7A8D' }}>Instant high-level narrative generated from metric telemetry</span>
          </div>
          <button 
            className="btn-p" 
            onClick={handleGenerateAISummary}
            disabled={generatingAi}
            style={{ fontSize: '11px', padding: '5px 12px', background: '#0284C7' }}
          >
            <IconSparkles size={14} /> {generatingAi ? 'Analyzing & Writing...' : 'Generate AI Summary'}
          </button>
        </div>

        <div className="fl full" style={{ marginTop: '10px' }}>
          <textarea
            value={aiSummary}
            onChange={(e) => setAiSummary(e.target.value)}
            placeholder="AI Executive Summary will appear here. You can also edit and fine-tune it directly..."
            style={{ width: '100%', minHeight: '110px', background: '#FFFFFF', color: '#0F172A', lineHeight: '1.6' }}
          />
        </div>
      </div>

      {/* Narrative Section Cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 -6px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A2A3A', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Weekly Operational Narratives & Commitments
        </div>
        <button 
          className="btn-s" 
          onClick={handleAutoPopulate}
          style={{ fontSize: '11px', padding: '4px 10px', background: '#F8FAFC', color: '#1A5FA8', borderColor: '#BAE6FD', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <IconRefresh size={13} /> Sync Real-Time Ticket Insights
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title">Key Activities Completed This Week</span>
          </div>
          <div className="fl">
            <textarea
              value={keyActivities}
              onChange={(e) => setKeyActivities(e.target.value)}
              placeholder="List major bug fixes, deployments, CRs, configurations, patch applications or training delivered..."
              style={{ minHeight: '120px' }}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title" style={{ color: '#DC2626' }}>Critical Risks & Operational Blockers</span>
          </div>
          <div className="fl">
            <textarea
              value={risksBlockers}
              onChange={(e) => setRisksBlockers(e.target.value)}
              placeholder="Highlight any pending client dependencies, environment down time, data fixes, or SLA risk..."
              style={{ minHeight: '120px' }}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title">Pending Items & Follow-ups</span>
          </div>
          <div className="fl">
            <textarea
              value={pendingItems}
              onChange={(e) => setPendingItems(e.target.value)}
              placeholder="Items currently in UAT, awaiting customer feedback, Oracle SR escalation, etc..."
              style={{ minHeight: '100px' }}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title" style={{ color: '#16A34A' }}>Next Week Action Items & Goals</span>
          </div>
          <div className="fl">
            <textarea
              value={nextActions}
              onChange={(e) => setNextActions(e.target.value)}
              placeholder="Planned milestones, upcoming patches, focus areas for the next 7 days..."
              style={{ minHeight: '100px' }}
            />
          </div>
        </div>
      </div>

      {/* Management Notes */}
      <div className="chart-card">
        <div className="chart-head">
          <span className="chart-title">Account Manager Commentary</span>
        </div>
        <div className="fl">
          <textarea
            value={managementComments}
            onChange={(e) => setManagementComments(e.target.value)}
            placeholder="High-level feedback, account health commentary, resourcing notes, client satisfaction sentiment..."
            style={{ minHeight: '80px' }}
          />
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <button 
          className="btn-s" 
          onClick={() => handleSave('Draft')} 
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <IconDeviceFloppy size={16} /> {saving ? 'Saving...' : 'Save as Draft'}
        </button>
        <button 
          className="btn-s" 
          onClick={() => handleSave('Finalized')} 
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }}
        >
          <IconDeviceFloppy size={16} /> Save & Finalize
        </button>
        <button 
          className="btn-p" 
          onClick={() => setShowPreview(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <IconEye size={16} /> Preview & Export WSR
        </button>
      </div>
    </div>
  );
}
