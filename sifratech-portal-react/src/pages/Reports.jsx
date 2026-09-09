import React, { useState, useEffect } from 'react';
import { reportsApi } from '../services/reportsApi';
import WSRGenerator from '../components/WSRGenerator';
import BusinessCaseStudy from '../components/BusinessCaseStudy';
import { 
  IconFileText, 
  IconFileAnalytics, 
  IconPlus, 
  IconEye, 
  IconEdit, 
  IconClock, 
  IconBuilding,
  IconChecklist,
  IconSparkles
} from '@tabler/icons-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('wsr'); // 'wsr' | 'cases' | 'history'

  // WSR State
  const [activeWsrDraft, setActiveWsrDraft] = useState(null);
  const [wsrDrafts, setWsrDrafts] = useState([]);
  const [loadingWsr, setLoadingWsr] = useState(false);

  // Business Cases State
  const [businessCases, setBusinessCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);

  const fetchWsrDrafts = async () => {
    setLoadingWsr(true);
    try {
      const res = await reportsApi.getWsrDrafts();
      setWsrDrafts(res.drafts || []);
    } catch (err) {
      console.error('Error fetching WSR drafts:', err);
    } finally {
      setLoadingWsr(false);
    }
  };

  const fetchBusinessCases = async () => {
    setLoadingCases(true);
    try {
      const res = await reportsApi.getBusinessCases();
      setBusinessCases(res.cases || []);
    } catch (err) {
      console.error('Error fetching business cases:', err);
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchWsrDrafts();
    fetchBusinessCases();
  }, []);

  return (
    <div className="reports-page" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div className="page-header no-print" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconFileAnalytics size={24} color="#1A5FA8" /> Account Reports & Business Documentation
          </h1>
          <p className="page-sub">Operational Periodic Status Reports (PSR) and Strategic Business Case Studies for Account Managers</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <button
          onClick={() => { setActiveTab('wsr'); setIsEditingCase(false); }}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: activeTab === 'wsr' ? '600' : '400',
            color: activeTab === 'wsr' ? '#1A5FA8' : '#6B7A8D',
            borderBottom: activeTab === 'wsr' ? '2px solid #1A5FA8' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IconFileAnalytics size={16} /> Periodic Status Report (PSR)
        </button>

        <button
          onClick={() => { setActiveTab('cases'); setIsEditingCase(false); }}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: activeTab === 'cases' ? '600' : '400',
            color: activeTab === 'cases' ? '#1A5FA8' : '#6B7A8D',
            borderBottom: activeTab === 'cases' ? '2px solid #1A5FA8' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IconFileText size={16} /> Business Case Studies ({businessCases.length})
        </button>

        <button
          onClick={() => { setActiveTab('history'); setIsEditingCase(false); }}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: activeTab === 'history' ? '600' : '400',
            color: activeTab === 'history' ? '#1A5FA8' : '#6B7A8D',
            borderBottom: activeTab === 'history' ? '2px solid #1A5FA8' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <IconClock size={16} /> Saved Reports History ({wsrDrafts.length})
        </button>
      </div>

      {/* Tab 1: WSR Generator */}
      {activeTab === 'wsr' && (
        <div>
          <WSRGenerator
            key={activeWsrDraft?.id || 'new_wsr'}
            initialDraft={activeWsrDraft}
            onSaved={() => {
              fetchWsrDrafts();
            }}
          />
        </div>
      )}

      {/* Tab 2: Business Case Studies */}
      {activeTab === 'cases' && (
        <div>
          {isEditingCase ? (
            <BusinessCaseStudy
              initialData={activeCase}
              onBack={() => {
                setIsEditingCase(false);
                setActiveCase(null);
                fetchBusinessCases();
              }}
              onSaved={() => {
                fetchBusinessCases();
              }}
            />
          ) : (
            <div>
              {/* Top toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A2A3A' }}>
                  Enterprise Case Studies & Transformations
                </div>
                <button
                  className="btn-p"
                  onClick={() => {
                    setActiveCase(null);
                    setIsEditingCase(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconPlus size={16} /> Create New Case Study
                </button>
              </div>

              {/* Case Studies Cards Grid */}
              {loadingCases ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7A8D' }}>Loading Case Studies...</div>
              ) : businessCases.length === 0 ? (
                <div style={{ background: '#FFFFFF', padding: '48px 24px', borderRadius: 'var(--r2)', textAlign: 'center', border: '0.5px solid rgba(0,0,0,0.08)' }}>
                  <IconFileText size={48} color="#94A3B8" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A2A3A' }}>No Business Case Studies Yet</div>
                  <div style={{ fontSize: '13px', color: '#64748B', maxWidth: '440px', margin: '6px auto 20px' }}>
                    Document customer problems, Sifratech solutions, operational impacts, and optimization roadmaps.
                  </div>
                  <button
                    className="btn-p"
                    onClick={() => {
                      setActiveCase(null);
                      setIsEditingCase(true);
                    }}
                  >
                    <IconPlus size={16} /> Create First Case Study
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                  {businessCases.map((cs) => (
                    <div 
                      key={cs.id} 
                      className="chart-card" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                      onClick={() => {
                        setActiveCase(cs);
                        setIsEditingCase(true);
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <span className={`badge ${cs.status === 'Finalized' ? 'b-resolved' : 'b-inprogress'}`}>
                            {cs.status || 'Draft'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                            {new Date(cs.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                          {cs.account_name}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A5FA8', marginBottom: '10px' }}>
                          {cs.project_name}
                        </div>

                        {cs.business_objective ? (
                          <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {cs.business_objective}
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                            No business objective summary recorded.
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          Customer: <strong>{cs.customer_name || 'N/A'}</strong>
                        </span>
                        <button 
                          className="btn-s" 
                          style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCase(cs);
                            setIsEditingCase(true);
                          }}
                        >
                          <IconEdit size={13} /> Edit / View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved WSR Reports History */}
      {activeTab === 'history' && (
        <div>
          <div className="tbl-wrap">
            <div className="tbl-head">
              <span className="tbl-title">Saved WSR Reports & Drafts History</span>
              <button 
                className="btn-s" 
                onClick={() => { setActiveWsrDraft(null); setActiveTab('wsr'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <IconPlus size={14} /> New WSR Report
              </button>
            </div>

            {loadingWsr ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6B7A8D' }}>Loading WSR history...</div>
            ) : wsrDrafts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7A8D' }}>No saved WSR reports yet. Generate and save reports from the WSR tab.</div>
            ) : (
              <table className="dt">
                <thead>
                  <tr>
                    <th>Account / Company</th>
                    <th>Project</th>
                    <th>Reporting Week End</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wsrDrafts.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: '600', color: '#0F172A' }}>{d.account_name}</td>
                      <td>{d.project_name}</td>
                      <td>{d.reporting_week}</td>
                      <td>
                        <span className={`badge ${d.status === 'Finalized' ? 'b-resolved' : 'b-inprogress'}`}>
                          {d.status || 'Draft'}
                        </span>
                      </td>
                      <td>{new Date(d.updated_at || d.created_at).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-s"
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            setActiveWsrDraft(d);
                            setActiveTab('wsr');
                          }}
                        >
                          <IconEdit size={13} /> Load Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
