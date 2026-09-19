export const SLA = { High: 4, Top: 2, Medium: 24, Low: 72, Project: 120 };

export const TEAM = [];

export const INITIAL_CLIENTS = [
  { id: 'c1', name: 'Al Seer Marine', logoUrl: 'https://alseermarine.com/wp-content/uploads/2024/03/logo-light-1.png', contact: 'support@alseermarine.com', users: ['Al Seer Marine User 1', 'Al Seer Marine User 2'], active: true },
  { id: 'c2', name: 'Dutco Group', logoUrl: '', contact: 'it@dutco.com', users: ['Dutco User 1', 'Dutco User 2'], active: false },
];

export const ROLES = {};

export const DEMO_CREDS = [];

const now = () => new Date();
const hAgo = (h) => { let d = new Date(); d.setHours(d.getHours() - h); return d; };
let nextId = 1001;
export const uid = () => 'TKT-' + nextId++;

export function seedTickets() {
  const tickets = [];
  const types = ['Access Issue', 'Bug', 'Data Entry Issue', 'Enhancements', 'New Requirements', 'Operational Issue', 'Webform Issue', 'Standard Functionality', 'Training'];
  const mods = ['Financials', 'HRMS', 'SCM', 'PPM', 'Sourcing', 'Inventory', 'Payroll', 'Other'];
  const pris = ['High', 'Medium', 'Low', 'Top', 'Project'];
  const stats = ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'];
  const envs = ['Development', 'Patching', 'Testing', 'Production'];
  const summs = ['AP invoice posting error in current period', 'GL journal import failure — batch 002', 'Employee hierarchy not loading in HRMS', 'PO approval workflow stuck at L2', 'Inventory subinventory setup missing', 'Budget vs actual report discrepancy', 'User access required for new joiner', 'Payroll element link missing for grade', 'Sourcing auction not visible to buyer', 'Fixed asset depreciation incorrect for FY', 'Bank reconciliation auto-match issue', 'HRMS grade setup not reflecting in payslip'];
  
  for (let i = 0; i < 12; i++) {
    const stat = stats[Math.floor(Math.random() * stats.length)];
    const pri = pris[Math.floor(Math.random() * pris.length)];
    const h = Math.floor(Math.random() * 200) + 1;
    const assignee = TEAM[Math.floor(Math.random() * TEAM.length)].name;
    const t = { 
      id: uid(), summary: summs[i], type: types[i % types.length], module: mods[i % mods.length], 
      priority: pri, status: stat, environment: envs[i % envs.length], assignedTo: assignee, 
      assignedTeam: 'Sifratech Support', raisedBy: i % 2 ? 'Al Seer Marine User 1' : 'Al Seer Marine User 2', 
      client: 'Al Seer Marine', createdAt: hAgo(h).toISOString(), detectedDate: hAgo(h + 2).toISOString(), 
      expectedDate: new Date(now().getTime() + (SLA[pri] || 24) * 36e5).toISOString(), mobileNo: '', extNo: '', 
      ccMail: '', longDescription: 'Detailed issue description as reported by the client.', project: 'ASM Support', 
      resolution: stat === 'Resolved' || stat === 'Closed' ? 'Issue identified and resolved.' : '', 
      auditLog: [{ ts: hAgo(h).toISOString(), by: 'System', msg: 'Ticket created. Status set to Open.' }], 
      comments: [], emailSent: true 
    };
    if (stat === 'In Progress') t.auditLog.push({ ts: hAgo(h - 1).toISOString(), by: assignee, msg: 'Status → In Progress.' });
    if (stat === 'Resolved' || stat === 'Closed') {
      const resolvedTs = hAgo(h - 2).toISOString();
      t.auditLog.push({ ts: resolvedTs, by: assignee, msg: 'Status → Resolved.' });
      t.resolvedAt = resolvedTs;
      if (stat === 'Closed') {
        t.closedAt = resolvedTs;
      }
    }
    tickets.push(t);
  }
  return tickets;
}

export function isOnHoldStatus(status) {
  return typeof status === 'string' && status.trim().toUpperCase() === 'ON HOLD';
}

export function isPausedStatus(status) {
  if (!status) return false;
  const s = status.trim();
  return isOnHoldStatus(s) || ['Awaiting Customer', 'Resolved', 'Closed'].includes(s);
}

export function calculateTicketAging(t, referenceTime = new Date()) {
  if (!t) return { agingHours: 0, agingDays: 0, isOnHold: false };

  // Backwards compatibility for cases where only createdAt string is passed
  if (typeof t === 'string') {
    const d = new Date(t);
    if (isNaN(d.getTime())) return { agingHours: 0, agingDays: 0, isOnHold: false };
    const ref = new Date(referenceTime).getTime();
    const hours = Math.max(0, Math.round((ref - d.getTime()) / 36e5));
    return { agingHours: hours, agingDays: Math.max(0, Math.round(hours / 24)), isOnHold: false };
  }

  // If currently ON HOLD, aging is strictly 0 and stops aging
  if (isOnHoldStatus(t.status)) {
    return { agingHours: 0, agingDays: 0, isOnHold: true };
  }

  const createdAt = t.createdAt || t.created_at;
  if (!createdAt) return { agingHours: 0, agingDays: 0, isOnHold: false };

  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return { agingHours: 0, agingDays: 0, isOnHold: false };

  const refTime = new Date(referenceTime).getTime();
  const auditLogs = t.auditLog || t.ticket_status_history || [];

  if (auditLogs.length === 0) {
    if (isPausedStatus(t.status)) {
      return { agingHours: 0, agingDays: 0, isOnHold: false };
    }
    const hours = Math.max(0, Math.round((refTime - d.getTime()) / 36e5));
    return { agingHours: hours, agingDays: Math.max(0, Math.round(hours / 24)), isOnHold: false };
  }

  let totalActiveMs = 0;
  let lastActiveTimestamp = d.getTime();
  let isCurrentlyActive = true; // Tickets start as active (New/Open)

  // Sort logs chronologically
  const sortedLogs = [...auditLogs].sort((a, b) => new Date(a.created_at || a.ts).getTime() - new Date(b.created_at || b.ts).getTime());

  for (const log of sortedLogs) {
    let status = log.newStatus || log.new_status;
    if (!status && (log.msg || log.comments)) {
      const msg = log.msg || log.comments;
      if (msg.includes('Status updated to')) {
        status = msg.split('Status updated to')[1].trim();
      } else if (msg.includes('Status changed from')) {
        status = msg.split('to')[1].trim();
      } else if (msg.includes('Resolution:')) {
        status = 'Resolved';
      } else if (msg.includes('Ticket unassigned')) {
        status = 'Open';
      }
    }

    if (status && status !== 'Any') {
      const logPaused = isPausedStatus(status);
      const logTime = new Date(log.created_at || log.ts).getTime();
      if (isNaN(logTime)) continue;

      if (isCurrentlyActive && logPaused) {
        // Transitioning to Paused/ON HOLD: accumulate time since last active
        totalActiveMs += Math.max(0, logTime - lastActiveTimestamp);
        isCurrentlyActive = false;
      } else if (!isCurrentlyActive && !logPaused) {
        // Transitioning to Active (Resume): start clock from this log
        lastActiveTimestamp = logTime;
        isCurrentlyActive = true;
      }
    }
  }

  if (isCurrentlyActive) {
    totalActiveMs += Math.max(0, refTime - lastActiveTimestamp);
  }

  if (totalActiveMs < 0) totalActiveMs = 0;
  const agingHours = Math.round(totalActiveMs / 36e5);
  const agingDays = Math.max(0, Math.round(agingHours / 24));

  return { agingHours, agingDays, isOnHold: false };
}

export function age(t, referenceTime = new Date()) {
  return calculateTicketAging(t, referenceTime).agingHours;
}

export function fmt(dStr) {
  return dStr ? new Date(dStr).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
}

export function bc(v, t) {
  if (t === 's') { 
    return { 
      New: 'b-open', 
      Open: 'b-open', 
      'In Progress': 'b-inprogress', 
      'Awaiting Customer': 'b-medium', 
      Resolved: 'b-resolved', 
      Closed: 'b-closed', 
      Reopened: 'b-reopened',
      'On Hold': 'b-onhold',
      'ON HOLD': 'b-onhold'
    }[v] || (isOnHoldStatus(v) ? 'b-onhold' : 'b-open'); 
  }
  if (t === 'p') { return { High: 'b-high', Medium: 'b-medium', Low: 'b-low', Top: 'b-top', Project: 'b-project' }[v] || 'b-medium'; }
  return '';
}
