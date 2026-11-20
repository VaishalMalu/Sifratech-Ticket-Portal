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
  const open = tickets.filter(t => ['Open', 'New', 'Assigned'].includes(t.status)).length;
  const inProgress = tickets.filter(t => t.status === 'In Progress').length;
  const onHold = tickets.filter(t => t.status === 'On Hold' || t.status === 'ON HOLD').length;
  const awaitingCustomer = tickets.filter(t => t.status === 'Awaiting Customer').length;
  const resolved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;

  const slaMap = {};
  if (slaConfig && slaConfig.length > 0) {
      slaConfig.forEach(s => slaMap[s.priority] = s.resolution_hours);
  } else {
      slaMap['Critical'] = 4; slaMap['Top'] = 4; slaMap['High'] = 8; slaMap['Medium'] = 24; slaMap['Low'] = 72; slaMap['Project'] = 168;
  }
  if (!slaMap['Critical']) slaMap['Critical'] = slaMap['Top'] || 4;
  if (!slaMap['Top']) slaMap['Top'] = slaMap['Critical'] || 4;
  if (!slaMap['High']) slaMap['High'] = 8;
  if (!slaMap['Medium']) slaMap['Medium'] = 24;
  if (!slaMap['Low']) slaMap['Low'] = 72;

  const activeStatuses = ['New', 'Open', 'Assigned', 'In Progress', 'Reopened'];
  const breach = tickets.filter(t => activeStatuses.includes(t.status) && age(t) > (slaMap[t.priority] || 24)).length;
  const aged = tickets.filter(t => activeStatuses.includes(t.status) && age(t) > 72).length;

  // Dynamic status aggregation so all tickets are counted and sum matches total
  const STATUS_CONFIG = {
    'New': { color: '#00B4D8', order: 1 },
    'Open': { color: '#1A9FCC', order: 2 },
    'Assigned': { color: '#537FE7', order: 3 },
    'In Progress': { color: '#E09A2B', order: 4 },
    'Awaiting Customer': { color: '#F59E0B', order: 5 },
    'On Hold': { color: '#8B7FD4', order: 6 },
    'Resolved': { color: '#4CAF7D', order: 7 },
    'Closed': { color: '#3A7A9F', order: 8 },
    'Reopened': { color: '#E05252', order: 9 },
    'Pending Approval': { color: '#9C27B0', order: 10 }
  };
  const FALLBACK_STATUS_COLORS = ['#1A9FCC', '#E09A2B', '#4CAF7D', '#8B7FD4', '#3A7A9F', '#E05252', '#00B4D8', '#537FE7', '#F59E0B'];

  const statusCounts = {};
  tickets.forEach(t => {
    let s = (t.status || 'Unknown').trim();
    if (s.toUpperCase() === 'ON HOLD') s = 'On Hold';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  const statusData = Object.keys(statusCounts)
    .sort((a, b) => {
      const orderA = STATUS_CONFIG[a]?.order ?? 99;
      const orderB = STATUS_CONFIG[b]?.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    })
    .map((name, idx) => ({
      name,
      value: statusCounts[name],
      color: STATUS_CONFIG[name]?.color || FALLBACK_STATUS_COLORS[idx % FALLBACK_STATUS_COLORS.length]
    }))
    .filter(d => d.value > 0);

  // Dynamic priority breakdown including Critical
  const PRIORITY_CONFIG = {
    'Critical': { color: '#8B7FD4', order: 1 },
    'Top': { color: '#8B7FD4', order: 2 },
    'High': { color: '#E05252', order: 3 },
    'Medium': { color: '#E09A2B', order: 4 },
    'Low': { color: '#4CAF7D', order: 5 },
    'Project': { color: '#5BA8A4', order: 6 }
  };
  const FALLBACK_PRI_COLORS = ['#8B7FD4', '#E05252', '#E09A2B', '#4CAF7D', '#5BA8A4'];

  const priorityCounts = {};
  tickets.forEach(t => {
    const p = (t.priority || 'Medium').trim();
    priorityCounts[p] = (priorityCounts[p] || 0) + 1;
  });

  const priData = Object.keys(priorityCounts)
    .sort((a, b) => {
      const orderA = PRIORITY_CONFIG[a]?.order ?? 99;
      const orderB = PRIORITY_CONFIG[b]?.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    })
    .map((name, idx) => ({
      name,
      value: priorityCounts[name],
      color: PRIORITY_CONFIG[name]?.color || FALLBACK_PRI_COLORS[idx % FALLBACK_PRI_COLORS.length]
    }))
    .filter(d => d.value > 0);

  const modules = [...new Set(tickets.map(t => t.module).filter(Boolean))].sort();
  const moduleData = modules.map(m => ({ name: m.substring(0, 3), full: m, value: tickets.filter(t => t.module === m).length }));

  const allTypes = [...new Set([...(incidentTypes && incidentTypes.length > 0 ? incidentTypes.map(t => t.name) : []), ...tickets.map(t => t.type).filter(Boolean)])];
  const typeColors = ['#1A9FCC', '#35C8E8', '#E09A2B', '#E05252', '#8B7FD4', '#4CAF7D', '#5BA8A4', '#1A9FCC', '#E09A2B', '#8B7FD4', '#E05252'];
  const typeData = allTypes.map((t, i) => ({ name: t.substring(0, 15) + (t.length > 15 ? '..' : ''), full: t, value: tickets.filter(x => x.type === t).length, color: typeColors[i % typeColors.length] })).filter(d => d.value > 0);

  const priorities = (slaConfig && slaConfig.length > 0) ? slaConfig : [
    { priority: 'Critical', resolution_hours: 4 },
    { priority: 'High', resolution_hours: 8 },
    { priority: 'Medium', resolution_hours: 24 },
    { priority: 'Low', resolution_hours: 72 }
  ];
  const priColors = { 'Critical': '#8B7FD4', 'Top': '#8B7FD4', 'High': '#E05252', 'Medium': '#E09A2B', 'Low': '#4CAF7D', 'Project': '#5BA8A4' };
  
  const slaData = priorities.map(s => {
      const p = s.priority;
      const hours = s.resolution_hours;
      const subset = tickets.filter(t => t.priority === p);
      const compliant = subset.filter(t => age(t) <= hours).length;
      return {
          name: p,
          color: priColors[p] || '#1A9FCC',
          compliance: Math.round((compliant / (subset.length || 1)) * 100) || 0
      };
  });

  const ageingTickets = tickets.filter(t => activeStatuses.includes(t.status) && age(t) > 72).sort((a, b) => age(b) - age(a));

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
        <div className="kpi-card" style={{ borderLeft: '3px solid #F59E0B' }}><div className="kpi-lbl">Awaiting Client</div><div className="kpi-val" style={{ color: '#D97706' }}>{awaitingCustomer}</div><div className="kpi-delta" style={{ color: '#D97706' }}>Pending info</div></div>
        <div className="kpi-card" style={{ borderLeft: '3px solid #8B7FD4' }}><div className="kpi-lbl">On Hold</div><div className="kpi-val" style={{ color: '#8B7FD4' }}>{onHold}</div><div className="kpi-delta" style={{ color: '#8B7FD4' }}>{onHold > 0 ? 'Paused — aging stopped' : 'None paused'}</div></div>
        <div className="kpi-card ok"><div className="kpi-lbl">Resolved / closed</div><div className="kpi-val">{resolved}</div><div className="kpi-delta up">Completed</div></div>
        <div className={`kpi-card ${breach > 0 ? 'alert' : 'ok'}`}><div className="kpi-lbl">SLA breached</div><div className="kpi-val">{breach}</div><div className={`kpi-delta ${breach > 0 ? 'dn' : 'up'}`}>{breach > 0 ? 'Needs attention' : 'All within SLA'}</div></div>
        <div className={`kpi-card ${aged > 0 ? 'alert' : 'ok'}`}><div className="kpi-lbl">Ageing &gt;3 Days</div><div className="kpi-val">{aged}</div><div className={`kpi-delta ${aged > 0 ? 'dn' : 'up'}`}>{aged > 0 ? 'Review needed' : 'Clear'}</div></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Tickets by status</span><span className="chart-badge">Donut</span></div>
          <div className="donut-wrap">
            <ResponsiveContainer width={115} height={115}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={36} outerRadius={48} dataKey="value" stroke="none">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend" style={{ flex: 1, minWidth: 0 }}>
              <div className="legend-total" style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A2A3A' }}>{total}</div>
                <div style={{ fontSize: '9px', color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: '12px', rowGap: '5px' }}>
                {statusData.map(d => (
                  <div key={d.name} className="legend-item" style={{ fontSize: '10.5px' }}>
                    <div className="legend-dot" style={{ background: d.color }}></div>
                    <span title={d.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                    <span className="legend-val" style={{ marginLeft: 'auto', paddingLeft: '4px' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Priority breakdown</span><span className="chart-badge">Donut</span></div>
          <div className="donut-wrap">
            <ResponsiveContainer width={115} height={115}>
              <PieChart>
                <Pie data={priData} cx="50%" cy="50%" innerRadius={36} outerRadius={48} dataKey="value" stroke="none">
                  {priData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-legend" style={{ flex: 1, minWidth: 0 }}>
              <div className="legend-total" style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A2A3A' }}>{total}</div>
                <div style={{ fontSize: '9px', color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: priData.length > 5 ? 'repeat(2, minmax(0, 1fr))' : '1fr', columnGap: '12px', rowGap: '5px' }}>
                {priData.map(d => (
                  <div key={d.name} className="legend-item" style={{ fontSize: '10.5px' }}>
                    <div className="legend-dot" style={{ background: d.color }}></div>
                    <span title={d.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                    <span className="legend-val" style={{ marginLeft: 'auto', paddingLeft: '4px' }}>{d.value}</span>
                  </div>
                ))}
              </div>
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
                  <td style={{ fontWeight: 500 }}>{Math.max(0, Math.round(age(t) / 24))}</td>
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
