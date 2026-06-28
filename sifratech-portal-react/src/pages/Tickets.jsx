import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { bc, age } from '../data/mockData';

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

  return (
    <div className="page active" style={{ padding: '20px' }}>
      <div className="page-header">
        <div className="page-title">Tickets</div>
        <button className="btn-p" onClick={() => openModal('CREATE_TICKET')}><i className="ti ti-plus" aria-hidden="true"></i> New Ticket</button>
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
                <td style={{ fontWeight: 600, color: '#1A5FA8', fontFamily: 'var(--mono)' }}>{t.number || t.id}</td>
                <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.summary}</td>
                <td style={{ color: '#4A5A6A' }}>{t.type}</td>
                <td style={{ color: '#4A5A6A' }}>{t.module}</td>
                <td><span className={`badge ${bc(t.priority, 'p')}`}>{t.priority}</span></td>
                <td><span className={`badge ${bc(t.status, 's')}`}>{t.status}</span></td>
                <td style={{ color: '#4A5A6A' }}>{t.assignedTo || '—'}</td>
                <td className={age(t.createdAt) > 24 ? 'ageing-warn' : ''}>{Math.max(0, Math.round(age(t.createdAt) / 24))}</td>
                <td style={{ color: '#4A5A6A' }}>{t.raisedBy}</td>
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
