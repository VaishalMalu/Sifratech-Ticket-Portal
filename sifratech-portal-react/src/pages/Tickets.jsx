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

  const filteredTickets = tickets.filter(t => {
    if (search && !t.summary.toLowerCase().includes(search.toLowerCase()) && !(t.number || t.id).toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStat && t.status !== filterStat) return false;
    return true;
  });

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
      'Created At': t.createdAt ? new Date(t.createdAt).toLocaleString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    
    const wscols = [
      { wch: 18 }, { wch: 50 }, { wch: 15 }, { wch: 20 }, 
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, 
      { wch: 25 }, { wch: 25 }
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
      <div className="toolbar">
        <input type="text" placeholder="Search by ID or summary..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filterStat} onChange={e => setFilterStat(e.target.value)}>
          <option value="">All statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
      </div>
      <div className="tbl-wrap">
        <table className="dt">
          <thead><tr><th>Ticket #</th><th>Summary</th><th>Type</th><th>Module</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Age (Days)</th><th>Raised by</th></tr></thead>
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
                <td data-label="Raised by" style={{ color: '#4A5A6A' }}>{t.raisedBy}</td>
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
