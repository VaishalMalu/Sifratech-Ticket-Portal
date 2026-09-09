import React from 'react';
import { IconDownload, IconPrinter, IconArrowLeft, IconSparkles } from '@tabler/icons-react';
import * as XLSX from 'xlsx';

export default function WSRPreview({ reportData, onBack }) {
  const {
    account_name,
    project_name,
    startDate,
    endDate,
    metrics = {},
    key_activities,
    pending_items,
    risks_blockers,
    next_actions,
    management_comments,
    ai_summary,
    author
  } = reportData;

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['SIFRATECH PERIODIC STATUS REPORT (PSR)'],
      ['Account:', account_name, 'Project:', project_name],
      ['Period:', `${startDate} to ${endDate}`, 'Prepared By:', author || 'Account Manager'],
      ['Generated On:', new Date().toLocaleDateString()],
      [],
      ['KPI SUMMARY METRICS'],
      ['Metric', 'Count / Value'],
      ['New Tickets Logged', metrics.newTickets || 0],
      ['Tickets Resolved', metrics.resolvedTickets || 0],
      ['Tickets Closed', metrics.closedTickets || 0],
      ['Currently Open Backlog', metrics.currentlyOpen || 0],
      [],
      ['OPEN TICKETS BY PRIORITY'],
      ['Priority', 'Count'],
      ...Object.entries(metrics.priorities || {}).map(([p, count]) => [p, count]),
      [],
      ['OPEN TICKETS BY MODULE'],
      ['Module', 'Count'],
      ...Object.entries(metrics.modules || {}).map(([m, count]) => [m, count]),
      [],
      ['OPEN TICKETS BY ASSIGNED TEAM'],
      ['Team', 'Count'],
      ...Object.entries(metrics.teamsMap || {}).map(([t, count]) => [t, count]),
      [],
      ['EXECUTIVE NARRATIVES'],
      ['Key Activities Completed:', key_activities || 'N/A'],
      ['Critical Risks & Blockers:', risks_blockers || 'N/A'],
      ['Pending Items:', pending_items || 'N/A'],
      ['Next Actions / Commitments:', next_actions || 'N/A'],
      ['Management Comments:', management_comments || 'N/A'],
      ['AI Executive Summary:', ai_summary || 'N/A']
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'WSR Summary');

    const fileName = `WSR_${(account_name || 'Report').replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="wsr-preview-container" style={{ padding: '20px 0' }}>
      {/* Top Action Bar - Hidden in Print */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button className="btn-s" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconArrowLeft size={16} /> Back to Editor
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-s" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconDownload size={16} /> Export to Excel
          </button>
          <button className="btn-p" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconPrinter size={16} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="printable-doc" style={{
        background: '#FFFFFF',
        borderRadius: '8px',
        padding: '28px 32px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '0.5px solid rgba(0,0,0,0.1)',
        color: '#1A2A3A',
        fontFamily: 'var(--font)'
      }}>
        {/* Header Branding */}
        <div className="report-section-block" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1A5FA8', paddingBottom: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px', color: '#1A5FA8' }}>SIFRA<span style={{ color: '#35C8E8' }}>TECH</span></span>
              <span style={{ fontSize: '10px', background: '#EBF4FB', color: '#1A5FA8', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>PERIODIC STATUS REPORT</span>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7A8D' }}>Account Management & Operational Reporting</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: '#4A5A6A', lineHeight: '1.5' }}>
            <div><strong>Reporting Period:</strong> {startDate} &mdash; {endDate}</div>
            <div><strong>Generated On:</strong> {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Project Meta Information */}
        <div className="report-section-block" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px', marginBottom: '18px', border: '1px solid #E2E8F0' }}>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>Account / Client</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{account_name || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>Project Track</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{project_name || 'All Projects'}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748B', fontWeight: '700', letterSpacing: '0.5px' }}>Report Author</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginTop: '2px' }}>{author || 'Account Manager'}</div>
          </div>
        </div>

        {/* AI Executive Summary Callout */}
        {ai_summary && (
          <div className="report-section-block" style={{ background: '#F0F7FF', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '14px 16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IconSparkles size={16} color="#0284C7" />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0369A1' }}>Executive Management Summary</span>
            </div>
            <div style={{ fontSize: '12px', color: '#1E293B', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
              {ai_summary}
            </div>
          </div>
        )}

        {/* Section 1: Operational KPI Metrics */}
        <div className="report-section-block" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#1A5FA8', marginBottom: '10px', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px' }}>
            1. Weekly Support Velocity & Backlog
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>New Logged</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#0284C7', marginTop: '2px' }}>{metrics.newTickets || 0}</div>
              <div style={{ fontSize: '9px', color: '#94A3B8' }}>In period</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Resolved</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#16A34A', marginTop: '2px' }}>{metrics.resolvedTickets || 0}</div>
              <div style={{ fontSize: '9px', color: '#94A3B8' }}>Fixes verified</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Closed</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#475569', marginTop: '2px' }}>{metrics.closedTickets || 0}</div>
              <div style={{ fontSize: '9px', color: '#94A3B8' }}>Completed lifecycle</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: '600' }}>Current Backlog</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: (metrics.currentlyOpen || 0) > 15 ? '#DC2626' : '#D97706', marginTop: '2px' }}>{metrics.currentlyOpen || 0}</div>
              <div style={{ fontSize: '9px', color: '#94A3B8' }}>Active Open</div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdowns */}
        <div className="report-section-block" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {/* Priority Breakdown */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>Active By Priority</div>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(metrics.priorities || {}).map(([p, count]) => (
                  <tr key={p} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '4px 0', color: '#334155', fontWeight: '500' }}>{p}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '700', color: (p === 'High' || p === 'Critical' || p === 'Top') && count > 0 ? '#DC2626' : '#0F172A' }}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Module Breakdown */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>Active By Module</div>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(metrics.modules || {}).length === 0 ? (
                  <tr><td style={{ color: '#94A3B8', padding: '4px 0' }}>No active modules</td></tr>
                ) : (
                  Object.entries(metrics.modules || {}).map(([m, count]) => (
                    <tr key={m} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '4px 0', color: '#334155', fontWeight: '500' }}>{m}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>{count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Team Breakdown */}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>Active By Team</div>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(metrics.teamsMap || {}).length === 0 ? (
                  <tr><td style={{ color: '#94A3B8', padding: '4px 0' }}>No active teams</td></tr>
                ) : (
                  Object.entries(metrics.teamsMap || {}).map(([t, count]) => (
                    <tr key={t} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '4px 0', color: '#334155', fontWeight: '500' }}>{t}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: '700', color: '#0F172A' }}>{count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2 & 3 */}
        <div className="report-section-block" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#1A5FA8', marginBottom: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px' }}>
              2. Key Activities & Milestones Completed
            </h4>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.55', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', minHeight: '75px', whiteSpace: 'pre-wrap', border: '1px solid #E2E8F0' }}>
              {key_activities || 'Zero ticket resolutions recorded in this period.'}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#DC2626', marginBottom: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px' }}>
              3. Critical Risks, Blockers & Escalations
            </h4>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.55', background: '#FEF2F2', padding: '10px 12px', borderRadius: '6px', minHeight: '75px', whiteSpace: 'pre-wrap', border: '1px solid #FECACA' }}>
              {risks_blockers || 'No active operational blockers or critical risks.'}
            </div>
          </div>
        </div>

        {/* Section 4 & 5 */}
        <div className="report-section-block" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#1A5FA8', marginBottom: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px' }}>
              4. Pending Items & Follow-ups
            </h4>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.55', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', minHeight: '75px', whiteSpace: 'pre-wrap', border: '1px solid #E2E8F0' }}>
              {pending_items || 'No pending customer/internal actions.'}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#16A34A', marginBottom: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px' }}>
              5. Next Week Action Items & Commitments
            </h4>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.55', background: '#F0FDF4', padding: '10px 12px', borderRadius: '6px', minHeight: '75px', whiteSpace: 'pre-wrap', border: '1px solid #DCFCE7' }}>
              {next_actions || 'Continue regular support execution and SLA monitoring.'}
            </div>
          </div>
        </div>

        {management_comments && (
          <div className="report-section-block" style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#475569', marginBottom: '6px', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px' }}>
              6. Account Manager & Leadership Comments
            </h4>
            <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.55', background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', whiteSpace: 'pre-wrap', border: '1px solid #E2E8F0' }}>
              {management_comments}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="report-section-block" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8' }}>
          <div>Sifratech Ticket Management & Operational Portal</div>
          <div>Confidential &mdash; For Internal & Designated Client Stakeholders Only</div>
        </div>
      </div>
    </div>
  );
}
