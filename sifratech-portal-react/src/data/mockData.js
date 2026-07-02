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
  const types = ['Access Issue', 'Bug', 'Data Entry Issue', 'Enhancements', 'New Requirements', 'Operational Issue', 'Phase II', 'Standard Functionality', 'Training'];
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
    if (stat === 'Resolved' || stat === 'Closed') t.auditLog.push({ ts: hAgo(h - 2).toISOString(), by: assignee, msg: 'Status → Resolved.' });
    tickets.push(t);
  }
  return tickets;
}

export function age(createdAtStr) {
  return Math.round((now() - new Date(createdAtStr)) / 36e5);
}

export function fmt(dStr) {
  return dStr ? new Date(dStr).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
}

export function bc(v, t) {
  if (t === 's') { return { New: 'b-open', Open: 'b-open', 'In Progress': 'b-inprogress', 'Awaiting Customer': 'b-medium', Resolved: 'b-resolved', Closed: 'b-closed', Reopened: 'b-reopened' }[v] || 'b-open'; }
  if (t === 'p') { return { High: 'b-high', Medium: 'b-medium', Low: 'b-low', Top: 'b-top', Project: 'b-project' }[v] || 'b-medium'; }
  return '';
}
