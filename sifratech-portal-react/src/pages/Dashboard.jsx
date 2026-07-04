import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useModal } from '../contexts/ModalContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { age, bc } from '../data/mockData';

export default function Dashboard() {
  const { tickets, getActiveClient, incidentTypes, oracleModules, slaConfig } = useData();
  const { openModal } = useModal();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'Open').length;
  const inProgress = tickets.filter(t => t.status === 'In Progress').length;
  const resolved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
  const slaMap = {};
  if (slaConfig && slaConfig.length > 0) {
      slaConfig.forEach(s => slaMap[s.priority] = s.resolution_hours);
  } else {
      slaMap['Top'] = 4; slaMap['High'] = 8; slaMap['Medium'] = 24; slaMap['Low'] = 72; slaMap['Project'] = 168;
  }

  const breach = tickets.filter(t => ['Open', 'In Progress', 'Reopened'].includes(t.status) && age(t.createdAt) > slaMap[t.priority]).length;
  const aged = tickets.filter(t => ['Open', 'In Progress', 'Reopened'].includes(t.status) && age(t.createdAt) > 72).length;

  const statusData = [
    { name: 'Open', value: open, color: '#1A9FCC' },
    { name: 'In Progress', value: inProgress, color: '#E09A2B' },
    { name: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length, color: '#4CAF7D' },
    { name: 'Closed', value: tickets.filter(t => t.status === 'Closed').length, color: '#3A7A9F' },
    { name: 'Reopened', value: tickets.filter(t => t.status === 'Reopened').length, color: '#E05252' },
  ].filter(d => d.value > 0);

  const priData = [
    { name: 'Top', value: tickets.filter(t => t.priority === 'Top').length, color: '#8B7FD4' },
    { name: 'High', value: tickets.filter(t => t.priority === 'High').length, color: '#E05252' },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'Medium').length, color: '#E09A2B' },
    { name: 'Low', value: tickets.filter(t => t.priority === 'Low').length, color: '#4CAF7D' },
    { name: 'Project', value: tickets.filter(t => t.priority === 'Project').length, color: '#5BA8A4' },
  ].filter(d => d.value > 0);

  const modules = (oracleModules && oracleModules.length > 0) ? oracleModules.map(m => m.name) : [...new Set(tickets.map(t => t.module).filter(Boolean))];
  const moduleData = modules.map(m => ({ name: m.substring(0, 3), full: m, value: tickets.filter(t => t.module === m).length }));

  const dbTypes = incidentTypes && incidentTypes.length > 0 ? incidentTypes.map(t => t.name) : ['Bug', 'Data Entry Issue', 'Enhancements'];
  const typeColors = ['#1A9FCC', '#35C8E8', '#E09A2B', '#E05252', '#8B7FD4', '#4CAF7D', '#5BA8A4', '#1A9FCC', '#E09A2B', '#8B7FD4', '#E05252'];
  const typeData = dbTypes.map((t, i) => ({ name: t.substring(0, 15) + (t.length > 15 ? '..' : ''), full: t, value: tickets.filter(x => x.type === t).length, color: typeColors[i % typeColors.length] })).filter(d => d.value > 0);

  const priorities = (slaConfig && slaConfig.length > 0) ? slaConfig : [
    { priority: 'Top', resolution_hours: 4 },
    { priority: 'High', resolution_hours: 8 },
    { priority: 'Medium', resolution_hours: 24 },
    { priority: 'Low', resolution_hours: 72 },
    { priority: 'Project', resolution_hours: 168 }
  ];
  const priColors = { 'Top': '#8B7FD4', 'High': '#E05252', 'Medium': '#E09A2B', 'Low': '#4CAF7D', 'Project': '#5BA8A4' };
  
  const slaData = priorities.map(s => {
      const p = s.priority;
      const hours = s.resolution_hours;
      const subset = tickets.filter(t => t.priority === p);
      const compliant = subset.filter(t => age(t.createdAt) <= hours).length;
      return {
          name: p,
          color: priColors[p] || '#1A9FCC',
          compliance: Math.round((compliant / (subset.length || 1)) * 100) || 0
      };
  });

  const ageingTickets = tickets.filter(t => ['Open', 'In Progress', 'Reopened'].includes(t.status) && age(t.createdAt) > 72).sort((a, b) => age(b.createdAt) - age(a.createdAt));

  const activeClient = getActiveClient();

  return (
    <div className="page active" style={{ padding: '20px' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">{activeClient?.name} — Live overview</div>
        </div>
        <div style={{ fontSize: '11px', color: '#6B7A8D', fontFamily: 'var(--mono)' }}>
          {time.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-card brand"><div className="kpi-lbl">Total</div><div className="kpi-val">{total}</div><div className="kpi-delta up">All tickets</div></div>
        <div className="kpi-card brand"><div className="kpi-lbl">Open</div><div className="kpi-val">{open}</div><div className="kpi-delta">Awaiting action</div></div>
        <div className="kpi-card warn"><div className="kpi-lbl">In progress</div><div className="kpi-val">{inProgress}</div><div className="kpi-delta">Being worked</div></div>
        <div className="kpi-card ok"><div className="kpi-lbl">Resolved / closed</div><div className="kpi-val">{resolved}</div><div className="kpi-delta up">Completed</div></div>
        <div className={`kpi-card ${breach > 0 ? 'alert' : 'ok'}`}><div className="kpi-lbl">SLA breached</div><div className="kpi-val">{breach}</div><div className={`kpi-delta ${breach > 0 ? 'dn' : 'up'}`}>{breach > 0 ? 'Needs attention' : 'All within SLA'}</div></div>
        <div className={`kpi-card ${aged > 0 ? 'alert' : 'ok'}`}><div className="kpi-lbl">Ageing &gt;3 Days</div><div className="kpi-val">{aged}</div><div className={`kpi-delta ${aged > 0 ? 'dn' : 'up'}`}>{aged > 0 ? 'Review needed' : 'Clear'}</div></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Tickets by status</span><span className="chart-badge">Donut</span></div>
          <div className="donut-wrap">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={52} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend">
              <div className="legend-total">
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#1A2A3A' }}>{total}</div>
                <div style={{ fontSize: '9px', color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
              </div>
              {statusData.map(d => (
                <div key={d.name} className="legend-item">
                  <div className="legend-dot" style={{ background: d.color }}></div>
                  <span>{d.name}</span><span className="legend-val">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Priority breakdown</span><span className="chart-badge">Donut</span></div>
          <div className="donut-wrap">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={priData} cx="50%" cy="50%" innerRadius={40} outerRadius={52} dataKey="value" stroke="none">
                  {priData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend">
              <div className="legend-total">
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#1A2A3A' }}>{total}</div>
                <div style={{ fontSize: '9px', color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
              </div>
              {priData.map(d => (
                <div key={d.name} className="legend-item">
                  <div className="legend-dot" style={{ background: d.color }}></div>
                  <span>{d.name}</span><span className="legend-val">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">By module</span><span className="chart-badge">Vertical bars</span></div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={moduleData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7A8D' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#6B7A8D' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#1A9FCC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Tickets by type</span><span className="chart-badge">Horizontal bars</span></div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart layout="vertical" data={typeData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#6B7A8D' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={10}>
                  {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">SLA Compliance</span><span className="chart-badge">% by priority</span></div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={slaData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7A8D' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#6B7A8D' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={(v) => `${v}%`} contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="compliance" radius={[4, 4, 0, 0]} barSize={30}>
                  {slaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '20px' }}>
        <div className="chart-head" style={{ borderBottom: '1px solid #E1E8EE', paddingBottom: '15px' }}>
          <span className="chart-title" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px' }}>Ageing tickets (&gt;3 Days open)</span>
          <span style={{ fontSize: '11px', color: '#6B7A8D' }}>{ageingTickets.length} tickets</span>
        </div>
        <div className="tbl-wrap" style={{ marginTop: '0' }}>
          <table className="dt">
            <thead><tr><th>Ticket #</th><th>Summary</th><th>Priority</th><th>Assigned to</th><th>Age (Days)</th><th>Status</th></tr></thead>
            <tbody>
              {ageingTickets.map(t => (
                <tr key={t.id} onClick={() => openModal('TICKET_DETAIL', { ticketId: t.id })} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: '#1A5FA8', fontFamily: 'var(--mono)' }}>{t.number || t.id}</td>
                  <td>{t.summary}</td>
                  <td><span className={`badge ${bc(t.priority, 'p')}`}>{t.priority}</span></td>
                  <td style={{ color: '#4A5A6A' }}>{t.assignedTo || '—'}</td>
                  <td style={{ fontWeight: 500 }}>{Math.max(0, Math.round(age(t.createdAt) / 24))}</td>
                  <td><span className={`badge ${bc(t.status, 's')}`}>{t.status}</span></td>
                </tr>
              ))}
              {ageingTickets.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#9AA5B4', padding: '20px' }}>No ageing tickets — excellent!</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
