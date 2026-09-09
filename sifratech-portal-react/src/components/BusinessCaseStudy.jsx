import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { reportsApi } from '../services/reportsApi';
import { IconDeviceFloppy, IconPrinter, IconArrowLeft, IconBook, IconFileText, IconSparkles, IconLoader2 } from '@tabler/icons-react';
import toast from 'react-hot-toast';

export default function BusinessCaseStudy({ initialData = null, onBack, onSaved }) {
  const { clients, tickets } = useData();
  const { currentUser } = useAuth();

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

  const [formData, setFormData] = useState({
    id: initialData?.id || null,
    account_name: initialData?.account_name || accountOptions[0] || '',
    project_name: initialData?.project_name || '',
    customer_name: initialData?.customer_name || '',

    // Section 1 – Current Situation & Challenges
    current_situation: initialData?.current_situation || '',
    operational_challenges: initialData?.operational_challenges || '',

    // Section 2 – Existing Landscape / Processes
    existing_process: initialData?.existing_process || '',
    existing_workflow: initialData?.existing_workflow || '',

    // Section 3 – Solution
    support_approach: initialData?.support_approach || '',
    process_improvements: initialData?.process_improvements || '',
    ticketing_workflow: initialData?.ticketing_workflow || '',
    automation_used: initialData?.automation_used || '',

    // Section 4 – Business Impact
    improvements_achieved: initialData?.improvements_achieved || '',
    operational_benefits: initialData?.operational_benefits || '',
    visibility_improvements: initialData?.visibility_improvements || '',
    efficiency_improvements: initialData?.efficiency_improvements || '',

    // Section 5 – Observations & Lessons Learned
    major_observations: initialData?.major_observations || '',
    lessons_learned: initialData?.lessons_learned || '',

    // Section 6 – Recommendations & Optimization Roadmap
    recommended_improvements: initialData?.recommended_improvements || '',
    automation_opportunities: initialData?.automation_opportunities || '',
    further_enhancements: initialData?.further_enhancements || '',
  });

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAIGenerate = async () => {
    if (!formData.account_name) { toast.error('Select an Account / Company first'); return; }
    setGenerating(true);
    const toastId = toast.loading('AI is analysing real-time ticket data & comments…');
    try {
      const res = await reportsApi.generateBCSContent(formData.account_name, formData.project_name);
      if (res?.content) {
        setFormData(prev => ({ ...prev, ...res.content }));
        toast.success('AI auto-filled all sections from live data & DB comments!', { id: toastId });
      } else {
        toast.error('AI returned no content. Try again.', { id: toastId });
      }
    } catch (err) {
      toast.error('AI generation failed: ' + err.message, { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (statusOverride = 'Draft') => {
    if (!formData.account_name) { toast.error('Account Name is required'); return; }
    if (!formData.project_name) { toast.error('Project Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...formData, status: statusOverride };
      const res = await reportsApi.saveBusinessCase(payload);
      setFormData(prev => ({ ...prev, id: res.id }));
      toast.success(`Case Study ${statusOverride === 'Draft' ? 'draft' : 'document'} saved!`);
      if (onSaved) onSaved(res);
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="case-study-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '16px 20px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', flexWrap: 'wrap', gap: '10px' }}>
        <button className="btn-s" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleAIGenerate}
            disabled={generating}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
              color: '#FFF', fontWeight: '600', fontSize: '12px',
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.8 : 1,
              boxShadow: '0 2px 8px rgba(124,58,237,0.35)'
            }}
          >
            {generating
              ? <><IconLoader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating&hellip;</>
              : <><IconSparkles size={15} /> AI Auto-fill from Live Data</>}
          </button>
          <button className="btn-s" onClick={() => setViewMode(!viewMode)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {viewMode ? <><IconFileText size={16} /> Edit Form</> : <><IconBook size={16} /> Preview Document</>}
          </button>
          <button className="btn-s" onClick={() => handleSave('Draft')} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconDeviceFloppy size={16} /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="btn-s" onClick={() => handleSave('Finalized')} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }}>
            <IconDeviceFloppy size={16} /> Finalize
          </button>
          <button className="btn-p" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconPrinter size={16} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Document View Mode */}
      {viewMode ? (
        <div className="printable-doc" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '40px 48px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '0.5px solid rgba(0,0,0,0.1)', color: '#1A2A3A' }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid #1A5FA8', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1A5FA8', letterSpacing: '0.5px' }}>SIFRA<span style={{ color: '#35C8E8' }}>TECH</span></div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginTop: '6px' }}>Business Case Study & Operational Analysis</div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>Enterprise IT Transformation & Support Excellence</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748B', lineHeight: '1.7' }}>
              <div><strong>Author:</strong> {currentUser?.label || 'Account Manager'}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Metadata banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#F8FAFC', padding: '16px 20px', borderRadius: '8px', marginBottom: '28px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: '600' }}>Account / Enterprise</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{formData.account_name || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: '600' }}>Project Track</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{formData.project_name || 'N/A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748B', fontWeight: '600' }}>Customer Sponsor</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{formData.customer_name || 'N/A'}</div>
            </div>
          </div>


          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section 1 */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#1A5FA8', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '14px' }}>
                1. Current Situation &amp; Challenges
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Current Situation</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.current_situation || 'N/A'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Operational &amp; Support Challenges</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.operational_challenges || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#1A5FA8', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '14px' }}>
                2. Existing Landscape / Processes – Modules Covered
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Existing Process &amp; Modules</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.existing_process || 'N/A'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Existing Workflow</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.existing_workflow || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 3 – Solution */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#1A5FA8', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '14px' }}>
                3. Solution
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Support Approach</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.support_approach || 'N/A'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Process Improvements</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.process_improvements || 'N/A'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Ticketing Workflow</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.ticketing_workflow || 'N/A'}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Automation Used</div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.automation_used || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#16A34A', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '14px' }}>
                4. Business Impact & Operational Results
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#166534' }}>Improvements Achieved</div>
                  <div style={{ fontSize: '12px', color: '#14532D', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.improvements_achieved || 'N/A'}</div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#166534' }}>Operational Benefits</div>
                  <div style={{ fontSize: '12px', color: '#14532D', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.operational_benefits || 'N/A'}</div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#166534' }}>Visibility Improvements</div>
                  <div style={{ fontSize: '12px', color: '#14532D', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.visibility_improvements || 'N/A'}</div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#166534' }}>Efficiency Improvements</div>
                  <div style={{ fontSize: '12px', color: '#14532D', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.efficiency_improvements || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 5 & 6 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#1A5FA8', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '14px' }}>
                  5. Observations & Lessons Learned
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Major Observations</div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.major_observations || 'N/A'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Lessons Learned</div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.lessons_learned || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#1A5FA8', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '14px' }}>
                  6. Recommendations & Optimization Roadmap
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Recommended Improvements</div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.recommended_improvements || 'N/A'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Automation Opportunities</div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.automation_opportunities || 'N/A'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Further Enhancements</div>
                    <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', whiteSpace: 'pre-wrap' }}>{formData.further_enhancements || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Form Editor Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* AI Banner */}
          <div style={{ background: 'linear-gradient(135deg, #EDE9FE, #F0F9FF)', border: '1px solid #C4B5FD', borderRadius: '10px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <IconSparkles size={20} color="#7C3AED" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#5B21B6' }}>AI Auto-fill Available</div>
              <div style={{ fontSize: '12px', color: '#6D28D9', marginTop: '2px' }}>
                Select an account and click <strong>&ldquo;AI Auto-fill from Live Data&rdquo;</strong> — all sections will be populated from real-time ticket analytics & DB comments.
              </div>
            </div>
          </div>

          {/* Header Card */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1A5FA8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              General Information
            </h3>
            <div className="fg">
              <div className="fl">
                <label>Account / Company Name <span className="req">*</span></label>
                <select value={formData.account_name} onChange={(e) => handleChange('account_name', e.target.value)}>
                  {accountOptions.map(acc => (
                    <option key={acc} value={acc}>{acc}</option>
                  ))}
                </select>
              </div>

              <div className="fl">
                <label>Project Name <span className="req">*</span></label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => handleChange('project_name', e.target.value)}
                  placeholder="e.g. Oracle Financials Support / Upgrade"
                />
              </div>

              <div className="fl">
                <label>Customer Name / Key Sponsor</label>
                <input type="text" value={formData.customer_name} onChange={(e) => handleChange('customer_name', e.target.value)} placeholder="e.g. VP of IT / Program Director" />
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1A5FA8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              1. Current Situation &amp; Challenges
            </h3>
            <div className="fg">
              <div className="fl full">
                <label>Current Situation</label>
                <textarea value={formData.current_situation} onChange={(e) => handleChange('current_situation', e.target.value)} placeholder="Overview of the IT operational environment and business context…" />
              </div>
              <div className="fl full">
                <label>Operational &amp; Support Challenges</label>
                <textarea value={formData.operational_challenges} onChange={(e) => handleChange('operational_challenges', e.target.value)} placeholder="Day-to-day workflow bottlenecks, SLA challenges, recurring support gaps…" />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1A5FA8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              2. Existing Landscape / Processes &ndash; Modules Covered
            </h3>
            <div className="fg">
              <div className="fl">
                <label>Existing Process &amp; Modules Covered</label>
                <textarea value={formData.existing_process} onChange={(e) => handleChange('existing_process', e.target.value)} placeholder="Which Oracle modules are in scope, how requests were handled previously…" />
              </div>
              <div className="fl">
                <label>Existing Workflow</label>
                <textarea value={formData.existing_workflow} onChange={(e) => handleChange('existing_workflow', e.target.value)} placeholder="Steps from ticket submission to engineer resolution…" />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1A5FA8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              3. Solution
            </h3>
            <div className="fg">
              <div className="fl">
                <label>Support Approach</label>
                <textarea value={formData.support_approach} onChange={(e) => handleChange('support_approach', e.target.value)} placeholder="Sifratech's dedicated support structure, tiers, SLA models…" />
              </div>
              <div className="fl">
                <label>Process Improvements</label>
                <textarea value={formData.process_improvements} onChange={(e) => handleChange('process_improvements', e.target.value)} placeholder="Standardized incident types, escalation paths, automated alerts…" />
              </div>
              <div className="fl">
                <label>Ticketing Workflow</label>
                <textarea value={formData.ticketing_workflow} onChange={(e) => handleChange('ticketing_workflow', e.target.value)} placeholder="Lifecycle states (New → In Progress → Awaiting → Resolved → Closed)…" />
              </div>
              <div className="fl">
                <label>Automation Used</label>
                <textarea value={formData.automation_used} onChange={(e) => handleChange('automation_used', e.target.value)} placeholder="AI email ingestion, auto-assignment, instant client notification…" />
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              4. Business Impact & Operational Results
            </h3>
            <div className="fg">
              <div className="fl">
                <label>Improvements Achieved</label>
                <textarea value={formData.improvements_achieved} onChange={(e) => handleChange('improvements_achieved', e.target.value)} placeholder="Resolution time reduction %, first-call resolution rate, real resolution notes..." />
              </div>
              <div className="fl">
                <label>Operational Benefits</label>
                <textarea value={formData.operational_benefits} onChange={(e) => handleChange('operational_benefits', e.target.value)} placeholder="Reduced downtime, uninterrupted payroll/financial close..." />
              </div>
              <div className="fl">
                <label>Visibility Improvements</label>
                <textarea value={formData.visibility_improvements} onChange={(e) => handleChange('visibility_improvements', e.target.value)} placeholder="Real-time portal dashboard, transparent SLA timers, instant email trails..." />
              </div>
              <div className="fl">
                <label>Efficiency Improvements</label>
                <textarea value={formData.efficiency_improvements} onChange={(e) => handleChange('efficiency_improvements', e.target.value)} placeholder="Automated ticket classification, reduced triage overhead..." />
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1A5FA8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              5. Key Observations & Lessons Learned
            </h3>
            <div className="fg">
              <div className="fl">
                <label>Major Observations</label>
                <textarea value={formData.major_observations} onChange={(e) => handleChange('major_observations', e.target.value)} placeholder="Recurring user errors, training needs, patch dependencies..." />
              </div>
              <div className="fl">
                <label>Lessons Learned</label>
                <textarea value={formData.lessons_learned} onChange={(e) => handleChange('lessons_learned', e.target.value)} placeholder="Best practices discovered for future releases/modules from ticket comments..." />
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: 'var(--r2)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1A5FA8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '16px' }}>
              6. Future Recommendations & Optimization Roadmap
            </h3>
            <div className="fg">
              <div className="fl">
                <label>Recommended Improvements</label>
                <textarea value={formData.recommended_improvements} onChange={(e) => handleChange('recommended_improvements', e.target.value)} placeholder="Short-term system enhancements and optimizations..." />
              </div>
              <div className="fl">
                <label>Automation Opportunities</label>
                <textarea value={formData.automation_opportunities} onChange={(e) => handleChange('automation_opportunities', e.target.value)} placeholder="Potential RPA, automated regression testing, self-service portals..." />
              </div>
              <div className="fl full">
                <label>Further Enhancements</label>
                <textarea value={formData.further_enhancements} onChange={(e) => handleChange('further_enhancements', e.target.value)} placeholder="Long-term strategy, new module rollouts, cloud upgrade paths..." />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 0' }}>
            <button 
              className="btn-s" 
              onClick={() => handleSave('Draft')} 
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IconDeviceFloppy size={16} /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              className="btn-s" 
              onClick={() => handleSave('Finalized')} 
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }}
            >
              <IconDeviceFloppy size={16} /> Finalize Document
            </button>
            <button 
              className="btn-p" 
              onClick={() => setViewMode(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <IconBook size={16} /> Preview Document
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
