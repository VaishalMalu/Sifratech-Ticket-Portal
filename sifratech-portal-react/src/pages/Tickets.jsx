import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { bc, age } from '../data/mockData';
import * as XLSX from 'xlsx';

export default function Tickets() {
  const { tickets } = useData();
  const { openModal } = useModal();
  const [search, setSearch] = useState('');
  const [filterStat, setFilterStat] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filteredTickets = tickets.filter(t => {
    if (search && 
        !t.summary.toLowerCase().includes(search.toLowerCase()) && 
        !(t.number || t.id).toLowerCase().includes(search.toLowerCase()) && 
        !(t.email && t.email.toLowerCase().includes(search.toLowerCase()))
       ) return false;
    if (filterDate && t.createdAt && !t.createdAt.startsWith(filterDate)) return false;
    if (filterStat && t.status !== filterStat) return false;
    if (filterType && t.type !== filterType) return false;
    if (filterModule && t.module !== filterModule) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignee && t.assignedTo !== filterAssignee) return false;
    return true;
  });

  const uniqueTypes = [...new Set(tickets.map(t => t.type).filter(Boolean))];
  const uniqueModules = [...new Set(tickets.map(t => t.module).filter(Boolean))];
  const uniqueAssignees = [...new Set(tickets.map(t => t.assignedTo).filter(Boolean))];

  const downloadExcel = () => {
    const dataToExport = filteredTickets.map(t => ({
      'Ticket #': t.number || t.id,
      'Summary': t.summary,
      'Type': t.type,
      'Module': t.module,
      'Priority': t.priority,
      'Status': t.status,
      'Assigned To': t.assignedTo || '—',
      'Age (Days)': Math.max(0, Math.round(age(t.createdAt) / 24)),
      'Raised By': t.raisedBy,
      'Email': t.email || '—',
      'Start Date': t.createdAt ? new Date(t.createdAt).toLocaleString('en-GB') : '',
      'Close Date': (t.resolvedAt || t.closedAt) ? new Date(t.resolvedAt || t.closedAt).toLocaleString('en-GB') : '—'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    
    const wscols = [
      { wch: 18 }, { wch: 50 }, { wch: 15 }, { wch: 20 }, 
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, 
      { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, "Tickets_Export.xlsx");
  };

  return (
    <div className="page active" style={{ padding: '20px' }}>
      <div className="page-header">
        <div className="page-title">Tickets</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-s" onClick={downloadExcel}><i className="ti ti-download" aria-hidden="true"></i> Export Excel</button>
          <button className="btn-p" onClick={() => openModal('CREATE_TICKET')}><i className="ti ti-plus" aria-hidden="true"></i> New Ticket</button>
        </div>
      </div>
      <div className="toolbar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by ID, summary, or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: '220px' }} />
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        <select value={filterStat} onChange={e => setFilterStat(e.target.value)}>
          <option value="">All statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Awaiting Customer</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={filterModule} onChange={e => setFilterModule(e.target.value)}>
          <option value="">All Modules</option>
          {uniqueModules.map(mod => <option key={mod} value={mod}>{mod}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option>Top</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
          <option>Project</option>
        </select>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="">All Assignees</option>
          {uniqueAssignees.map(user => <option key={user} value={user}>{user === 'Unassigned' ? 'Unassigned' : user}</option>)}
        </select>
      </div>
      <div className="tbl-wrap">
        <table className="dt">
          <thead><tr><th>Ticket #</th><th>Summary</th><th>Type</th><th>Module</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Age (Days)</th><th>Start Date</th><th>Close Date</th><th>Raised by</th><th>Email</th></tr></thead>
          <tbody>
            {filteredTickets.length > 0 ? filteredTickets.map(t => (
              <tr key={t.id} onClick={() => openModal('TICKET_DETAIL', { ticketId: t.id })} style={{ cursor: 'pointer' }}>
                <td data-label="Ticket #" style={{ fontWeight: 600, color: '#1A5FA8', fontFamily: 'var(--mono)' }}>{t.number || t.id}</td>
                <td data-label="Summary" className="td-summary">{t.summary}</td>
                <td data-label="Type" style={{ color: '#4A5A6A' }}>{t.type}</td>
                <td data-label="Module" style={{ color: '#4A5A6A' }}>{t.module}</td>
                <td data-label="Priority"><span className={`badge ${bc(t.priority, 'p')}`}>{t.priority}</span></td>
                <td data-label="Status"><span className={`badge ${bc(t.status, 's')}`}>{t.status}</span></td>
                <td data-label="Assigned to" style={{ color: '#4A5A6A' }}>{t.assignedTo || '—'}</td>
                <td data-label="Age (Days)" className={age(t.createdAt) > 24 ? 'ageing-warn' : ''}>{Math.max(0, Math.round(age(t.createdAt) / 24))}</td>
                <td data-label="Start Date" style={{ color: '#4A5A6A' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                <td data-label="Close Date" style={{ color: '#4A5A6A' }}>{(t.resolvedAt || t.closedAt) ? new Date(t.resolvedAt || t.closedAt).toLocaleDateString('en-GB') : '—'}</td>
                <td data-label="Raised by" style={{ color: '#4A5A6A' }}>{t.raisedBy}</td>
                <td data-label="Email" style={{ color: '#4A5A6A' }}>{t.email || '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: '#9AA5B4', padding: '20px' }}>No tickets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
