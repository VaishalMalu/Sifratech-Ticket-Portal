import React from 'react';
import { useData } from '../contexts/DataContext';
import { age } from '../data/mockData';

export default function Team() {
  const { tickets, usersList } = useData();

  // Use all users for the team board as requested
  const allSystemUsers = usersList || [];

  return (
    <div className="page active" style={{ padding: '20px' }}>
      <div className="page-header"><div className="page-title">Team workload</div></div>
      <div className="tbl-wrap">
        <table className="dt">
          <thead><tr><th>Member</th><th>Role</th><th>Open</th><th>In progress</th><th>Resolved</th><th>Total</th><th>Avg resolution (hrs)</th></tr></thead>
          <tbody>
            {allSystemUsers.map(m => {
              const mine = tickets.filter(t => t.assignedTo === m.full_name);
              const op = mine.filter(t => t.status === 'Open').length;
              const ip = mine.filter(t => t.status === 'In Progress').length;
              const rs = mine.filter(t => ['Resolved', 'Closed'].includes(t.status));
              const avg = rs.length ? Math.round(rs.reduce((a, t) => a + age(t.createdAt), 0) / rs.length) : 0;
              return (
                <tr key={m.id}>
                  <td data-label="Member">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="avatar" style={{ width: '26px', height: '26px', fontSize: '10px', backgroundColor: `hsl(${Math.abs(m.full_name.split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % 360}, 60%, 50%)`, color: '#fff', flexShrink: 0 }}>
                        {(m.full_name || 'U').split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{m.full_name}</div>
                        <div className="user-meta">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Role" style={{ color: '#6B7A8D' }}>{m.roles?.name || 'Support Engineer'}</td>
                  <td data-label="Open">{op}</td><td data-label="In progress">{ip}</td><td data-label="Resolved">{rs.length}</td>
                  <td data-label="Total" style={{ fontWeight: 600 }}>{mine.length}</td>
                  <td data-label="Avg resolution" style={{ fontFamily: 'var(--mono)' }}>{avg}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
