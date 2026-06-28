// ═══════════════════════════════════════════
// © 2025 Sifratech Technology Pvt Ltd
// Proprietary — All rights reserved
// ═══════════════════════════════════════════

// ── AUTH ──
// © 2025 Sifratech Technology Pvt Ltd — Proprietary
const _d={
  'YWNjb3VudF9tYW5hZ2Vy':'U2lmcmFAQU0yMDI1',
  'Y2xpZW50XzE=':'U2lmcmFAQ0wyMDI1',
  'c3VwcG9ydF8x':'U2lmcmFAU1AyMDI1'
};
function _dc(s){try{return atob(s);}catch(e){return '';}}
function doAuth(){
  const u=(document.getElementById('authUser').value||'').trim().toLowerCase().replace(/\s+/g,'_');
  const p=(document.getElementById('authPass').value||'');
  if(!u||!p){document.getElementById('authErr').textContent='Please enter username and password.';return;}
  const eu=btoa(u);
  if(_d[eu]&&_dc(_d[eu])===p){
    document.getElementById('authGate').style.display='none';
    document.getElementById('appShell').style.display='block';
    renderAll();initClock();
    if(u.includes('support')) switchRole('support1');
    else if(u.includes('client')) switchRole('client1');
    else switchRole('am');
  } else {
    document.getElementById('authErr').textContent='Invalid username or password.';
  }
}
function signOut(){
  document.getElementById('authGate').style.display='flex';
  document.getElementById('appShell').style.display='none';
  document.getElementById('authUser').value='';
  document.getElementById('authPass').value='';
  document.getElementById('authErr').textContent='';
}

// ── CREDENTIALS TABLE (shown in settings for admin) ──
const DEMO_CREDS=[
  {user:'account_manager',pass:'Sci10!',role:'Account Manager'},
  {user:'client_1',pass:'Scl20!',role:'Client User 1'},
  {user:'support_1',pass:'Ssp30!',role:'Support Engineer'},
];

// ── DATA ──
const SLA={High:4,Top:2,Medium:24,Low:72,Project:120};
const TEAM=[
  {name:'Ravi K.',email:'ravi.k@sifratech.com',module:'Financials,SCM'},
  {name:'Priya M.',email:'priya.m@sifratech.com',module:'HRMS,Payroll'},
  {name:'Arun S.',email:'arun.s@sifratech.com',module:'PPM'},
  {name:'Meena R.',email:'meena.r@sifratech.com',module:'Financials'},
  {name:'Karthik V.',email:'karthik.v@sifratech.com',module:'SCM,Inventory'},
  {name:'Sonia T.',email:'sonia.t@sifratech.com',module:'Sourcing'},
  {name:'Deepak N.',email:'deepak.n@sifratech.com',module:'HRMS'},
  {name:'Lakshmi P.',email:'lakshmi.p@sifratech.com',module:'Financials'},
  {name:'Vijay C.',email:'vijay.c@sifratech.com',module:'SCM'},
  {name:'Nisha B.',email:'nisha.b@sifratech.com',module:'PPM,Reports'},
  {name:'Ramesh G.',email:'ramesh.g@sifratech.com',module:'Inventory'},
  {name:'Ananya J.',email:'ananya.j@sifratech.com',module:'Other'},
];
let clients=[
  {id:'c1',name:'Al Seer Marine',logoUrl:'https://alseermarine.com/wp-content/uploads/2024/03/logo-light-1.png',contact:'support@alseermarine.com',users:['Al Seer Marine User 1','Al Seer Marine User 2'],active:true},
  {id:'c2',name:'Dutco Group',logoUrl:'',contact:'it@dutco.com',users:['Dutco User 1','Dutco User 2'],active:false},
];
const ROLES={
  am:{label:'Account Manager',initials:'AM',canCreate:true,canAssign:true,canClose:true,seeAll:true,isAdmin:true},
  client1:{label:'Al Seer Marine User 1',initials:'A1',canCreate:true,canAssign:false,canClose:false,client:'Al Seer Marine'},
  client2:{label:'Al Seer Marine User 2',initials:'A2',canCreate:true,canAssign:false,canClose:false,client:'Al Seer Marine'},
  support1:{label:'Ravi K.',initials:'RK',canCreate:false,canAssign:false,canClose:true,isSupport:true},
  support2:{label:'Priya M.',initials:'PM',canCreate:false,canAssign:false,canClose:true,isSupport:true},
};
let currentRole='am';
let tickets=[];
let nextId=1001;

function uid(){return 'TKT-'+nextId++;}
const now=()=>new Date();
function hAgo(h){let d=new Date();d.setHours(d.getHours()-h);return d;}
function fmt(d){return d?new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';}
function age(t){return Math.round((now()-new Date(t.createdAt))/36e5);}

function seed(){
  const types=['Bug','Data Fix','Enhancement','New Requirement','New Setup Request','Reports','Responsibility Assignment','Training Request','Data Extract'];
  const mods=['Financials','HRMS','SCM','PPM','Sourcing','Inventory','Payroll','Other'];
  const pris=['High','Medium','Low','Top','Project'];
  const stats=['Open','In Progress','Resolved','Closed','Reopened'];
  const envs=['Development','Patching','Testing','Production'];
  const summs=['AP invoice posting error in current period','GL journal import failure — batch 002','Employee hierarchy not loading in HRMS','PO approval workflow stuck at L2','Inventory subinventory setup missing','Budget vs actual report discrepancy','User access required for new joiner','Payroll element link missing for grade','Sourcing auction not visible to buyer','Fixed asset depreciation incorrect for FY','Bank reconciliation auto-match issue','HRMS grade setup not reflecting in payslip'];
  for(let i=0;i<12;i++){
    const stat=stats[Math.floor(Math.random()*stats.length)];
    const pri=pris[Math.floor(Math.random()*pris.length)];
    const h=Math.floor(Math.random()*200)+1;
    const assignee=TEAM[Math.floor(Math.random()*TEAM.length)].name;
    const t={id:uid(),summary:summs[i],type:types[i%types.length],module:mods[i%mods.length],priority:pri,status:stat,environment:envs[i%envs.length],assignedTo:assignee,assignedTeam:'Sifratech Support',raisedBy:i%2?'Al Seer Marine User 1':'Al Seer Marine User 2',client:'Al Seer Marine',createdAt:hAgo(h),detectedDate:hAgo(h+2),expectedDate:new Date(now().getTime()+(SLA[pri]||24)*36e5),mobileNo:'',extNo:'',ccMail:'',longDescription:'Detailed issue description as reported by the client.',project:'Oracle EBS R12',resolution:stat==='Resolved'||stat==='Closed'?'Issue identified and resolved.':'',auditLog:[{ts:hAgo(h),by:'System',msg:'Ticket created. Status set to Open.'}],comments:[],emailSent:true};
    if(stat==='In Progress') t.auditLog.push({ts:hAgo(h-1),by:assignee,msg:'Status → In Progress.'});
    if(stat==='Resolved'||stat==='Closed') t.auditLog.push({ts:hAgo(h-2),by:assignee,msg:'Status → Resolved.'});
    tickets.push(t);
  }
}
seed();

function initClock(){
  setInterval(()=>{
    const el=document.getElementById('dashTime');
    if(el) el.textContent=new Date().toLocaleString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  },1000);
}

function switchRole(r){
  currentRole=r;
  const role=ROLES[r];
  document.getElementById('avatarEl').textContent=role.initials;
  const isAdmin=role.isAdmin;
  document.getElementById('teamNavBtn').style.display=isAdmin?'':'none';
  document.getElementById('settingsNavBtn').style.display=isAdmin?'':'none';
  if(document.getElementById('roleSel')) document.getElementById('roleSel').value=r;
  renderAll();
}

function showPage(p){
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.getAttribute('onclick').includes("'"+p+"'")));
  if(p==='settings') sPanel('users');
  renderAll();
}

function renderAll(){renderDash();renderTickets();renderTeam();}

function vis(){
  const r=ROLES[currentRole];
  if(r.seeAll) return tickets;
  if(r.client) return tickets.filter(t=>t.client===r.client);
  return tickets;
}

function bc(v,t){
  if(t==='s'){return {Open:'b-open','In Progress':'b-inprogress',Resolved:'b-resolved',Closed:'b-closed',Reopened:'b-reopened'}[v]||'b-open';}
  if(t==='p'){return {High:'b-high',Medium:'b-medium',Low:'b-low',Top:'b-top',Project:'b-project'}[v]||'b-medium';}
  return '';
}

// ── DASHBOARD ──
function renderDash(){
  const vt=vis();
  const total=vt.length,open=vt.filter(t=>t.status==='Open').length,
    inp=vt.filter(t=>t.status==='In Progress').length,
    res=vt.filter(t=>['Resolved','Closed'].includes(t.status)).length,
    breach=vt.filter(t=>['Open','In Progress','Reopened'].includes(t.status)&&age(t)>SLA[t.priority]).length,
    aged=vt.filter(t=>['Open','In Progress','Reopened'].includes(t.status)&&age(t)>72).length;

  document.getElementById('kpiStrip').innerHTML=`
    <div class="kpi-card brand"><div class="kpi-lbl">Total</div><div class="kpi-val">${total}</div><div class="kpi-delta up">All tickets</div></div>
    <div class="kpi-card brand"><div class="kpi-lbl">Open</div><div class="kpi-val">${open}</div><div class="kpi-delta">Awaiting action</div></div>
    <div class="kpi-card warn"><div class="kpi-lbl">In progress</div><div class="kpi-val">${inp}</div><div class="kpi-delta">Being worked</div></div>
    <div class="kpi-card ok"><div class="kpi-lbl">Resolved / closed</div><div class="kpi-val">${res}</div><div class="kpi-delta up">Completed</div></div>
    <div class="kpi-card ${breach>0?'alert':'ok'}"><div class="kpi-lbl">SLA breached</div><div class="kpi-val">${breach}</div><div class="kpi-delta ${breach>0?'dn':'up'}">${breach>0?'Needs attention':'All within SLA'}</div></div>
    <div class="kpi-card ${aged>0?'alert':'ok'}"><div class="kpi-lbl">Ageing &gt;72h</div><div class="kpi-val">${aged}</div><div class="kpi-delta ${aged>0?'dn':'up'}">${aged>0?'Review needed':'Clear'}</div></div>`;

  // Donut — Status
  const statusData=[
    {l:'Open',v:vt.filter(t=>t.status==='Open').length,c:'#1A9FCC'},
    {l:'In Progress',v:vt.filter(t=>t.status==='In Progress').length,c:'#E09A2B'},
    {l:'Resolved',v:vt.filter(t=>t.status==='Resolved').length,c:'#4CAF7D'},
    {l:'Closed',v:vt.filter(t=>t.status==='Closed').length,c:'#3A7A9F'},
    {l:'Reopened',v:vt.filter(t=>t.status==='Reopened').length,c:'#E05252'},
  ].filter(d=>d.v>0);
  document.getElementById('donutStatus').innerHTML=makeDonut(statusData,total);

  // Donut — Priority
  const priData=[
    {l:'Top',v:vt.filter(t=>t.priority==='Top').length,c:'#8B7FD4'},
    {l:'High',v:vt.filter(t=>t.priority==='High').length,c:'#E05252'},
    {l:'Medium',v:vt.filter(t=>t.priority==='Medium').length,c:'#E09A2B'},
    {l:'Low',v:vt.filter(t=>t.priority==='Low').length,c:'#4CAF7D'},
    {l:'Project',v:vt.filter(t=>t.priority==='Project').length,c:'#5BA8A4'},
  ].filter(d=>d.v>0);
  document.getElementById('donutPriority').innerHTML=makeDonut(priData,total);

  // Vertical bar — Modules
  const mods=['Financials','HRMS','SCM','PPM','Sourcing','Inventory','Payroll','Other'];
  const mVals=mods.map(m=>vt.filter(t=>t.module===m).length);
  const mMax=Math.max(...mVals,1);
  const bW=38,gap=6,h=140,pad=20;
  const totalW=mods.length*(bW+gap);
  let bars='';
  mods.forEach((m,i)=>{
    const v=mVals[i];
    const bH=Math.round(v/mMax*(h-pad));
    const x=i*(bW+gap);
    const yTop=h-bH;
    bars+=`<g class="bar-vert">
      <rect x="${x}" y="${yTop}" width="${bW}" height="${bH}" rx="4" fill="#1A9FCC" opacity="${0.4+v/mMax*0.6}"/>
      <text x="${x+bW/2}" y="${h+14}" text-anchor="middle" class="axis-label">${m.substring(0,3)}</text>
      ${v>0?`<text x="${x+bW/2}" y="${yTop-4}" text-anchor="middle" class="bar-value">${v}</text>`:''}
    </g>`;
  });
  for(let i=1;i<=4;i++){
    const y=h-Math.round(i/4*(h-pad));
    bars+=`<line x1="0" y1="${y}" x2="${totalW}" y2="${y}" class="grid-line"/>`;
  }
  const svgM=document.getElementById('barModule');
  svgM.setAttribute('viewBox',`0 0 ${totalW} ${h+24}`);
  svgM.innerHTML=bars;

  // Horizontal bar — Types
  const types=['Bug','Data Fix','Enhancement','New Requirement','Reports','New Setup Request','Training Request','Data Extract','Responsibility Assign.'];
  const tMax=Math.max(...types.map(tp=>vt.filter(t=>t.type===tp||t.type===tp.replace('Assign.','Assignment')).length),1);
  const tColors=['#1A9FCC','#35C8E8','#E09A2B','#E05252','#8B7FD4','#4CAF7D','#5BA8A4','#1A9FCC','#E09A2B'];
  document.getElementById('hbarType').innerHTML=types.map((tp,i)=>{
    const v=vt.filter(t=>t.type===tp||t.type===tp.replace('Assign.','Assignment')).length;
    const pct=Math.round(v/tMax*100);
    return `<div class="hbar-row">
      <div class="hbar-lbl">${tp}</div>
      <div class="hbar-track">
        <div class="hbar-fill" style="width:${pct}%;background:${tColors[i%tColors.length]};"><span>${v}</span></div>
      </div>
    </div>`;
  }).join('');

  // SLA vertical bar chart
  const slaP=['Top','High','Medium','Low','Project'];
  const slaColors={'Top':'#8B7FD4','High':'#E05252','Medium':'#E09A2B','Low':'#4CAF7D','Project':'#3A7A9F'};
  let slaBars='',slaW=40,slaGap=10;
  const slaTotalW=slaP.length*(slaW+slaGap);
  slaP.forEach((p,i)=>{
    const pts=vt.filter(t=>t.priority===p);
    const pct=pts.length?Math.round(pts.filter(t=>!(['Open','In Progress','Reopened'].includes(t.status)&&age(t)>SLA[p])).length/pts.length*100):100;
    const bH=Math.round(pct/100*(h-pad));
    const x=i*(slaW+slaGap);
    const yTop=h-bH;
    slaBars+=`<g>
      <rect x="${x}" y="${h-h+pad}" width="${slaW}" height="${h-pad}" rx="4" fill="rgba(255,255,255,.03)"/>
      <rect x="${x}" y="${yTop}" width="${slaW}" height="${bH}" rx="4" fill="${slaColors[p]}" opacity=".85"/>
      <text x="${x+slaW/2}" y="${h+14}" text-anchor="middle" class="axis-label">${p}</text>
      <text x="${x+slaW/2}" y="${yTop-4}" text-anchor="middle" class="bar-value">${pct}%</text>
    </g>`;
  });
  for(let i=1;i<=4;i++){
    const y=h-Math.round(i/4*(h-pad));
    slaBars+=`<line x1="0" y1="${y}" x2="${slaTotalW}" y2="${y}" class="grid-line"/>`;
    slaBars+=`<text x="-4" y="${y+3}" text-anchor="end" class="axis-label">${i*25}%</text>`;
  }
  const svgS=document.getElementById('barSLA');
  svgS.setAttribute('viewBox',`-20 0 ${slaTotalW+20} ${h+24}`);
  svgS.innerHTML=slaBars;

  // Ageing table
  const agedT=vt.filter(t=>['Open','In Progress','Reopened'].includes(t.status)&&age(t)>72);
  document.getElementById('ageingCount').textContent=agedT.length+' tickets';
  document.getElementById('ageingTable').innerHTML=agedT.length?agedT.map(t=>`
    <tr onclick="openDetail('${t.id}')">
      <td style="font-weight:600;color:#1A5FA8;font-family:var(--mono);">${t.id}</td>
      <td>${t.summary}</td>
      <td><span class="badge ${bc(t.priority,'p')}">${t.priority}</span></td>
      <td>${t.assignedTo}</td>
      <td class="ageing-warn">${age(t)}</td>
      <td><span class="badge ${bc(t.status,'s')}">${t.status}</span></td>
    </tr>`).join(''):`<tr><td colspan="6" style="text-align:center;color:#9AA5B4;padding:20px;">No ageing tickets — excellent!</td></tr>`;
}

function makeDonut(data,total){
  const r=52,cx=60,cy=60,stroke=14;
  const circumference=2*Math.PI*r;
  let offset=0;
  let arcs='';
  data.forEach(d=>{
    const pct=d.v/total;
    const dash=circumference*pct;
    const gap=circumference-dash;
    arcs+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.c}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"><title>${d.l}: ${d.v}</title></circle>`;
    offset+=dash;
  });
  const legend=data.map(d=>`<div class="legend-item"><div class="legend-dot" style="background:${d.c}"></div><span>${d.l}</span><span class="legend-val">${d.v}</span></div>`).join('');
  return `<svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0;">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="${stroke}"/>
    ${arcs}
    <text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="20" font-weight="600" fill="#1A2A3A" font-family="DM Sans">${total}</text>
    <text x="${cx}" y="${cy+12}" text-anchor="middle" font-size="9" fill="#6B7A8D" font-family="DM Sans" text-transform="uppercase">TOTAL</text>
  </svg>
  <div class="donut-legend">${legend}</div>`;
}

// ── TICKET LIST ──
function renderTickets(){
  const vt=vis();
  const q=(document.getElementById('srch')?.value||'').toLowerCase();
  const fs=document.getElementById('fStat')?.value||'';
  const fp=document.getElementById('fPri')?.value||'';
  const fm=document.getElementById('fMod')?.value||'';
  const f=vt.filter(t=>{
    if(q&&!t.summary.toLowerCase().includes(q)&&!t.id.toLowerCase().includes(q)) return false;
    if(fs&&t.status!==fs) return false;
    if(fp&&t.priority!==fp) return false;
    if(fm&&t.module!==fm) return false;
    return true;
  });
  const tb=document.getElementById('ticketTbody');
  if(!tb) return;
  tb.innerHTML=f.map(t=>`<tr onclick="openDetail('${t.id}')">
    <td style="font-weight:600;color:#1A5FA8;font-family:var(--mono);">${t.id}</td>
    <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.summary}</td>
    <td style="color:#4A5A6A;">${t.type}</td>
    <td style="color:#4A5A6A;">${t.module}</td>
    <td><span class="badge ${bc(t.priority,'p')}">${t.priority}</span></td>
    <td><span class="badge ${bc(t.status,'s')}">${t.status}</span></td>
    <td style="color:#4A5A6A;">${t.assignedTo||'—'}</td>
    <td class="${age(t)>SLA[t.priority]?'ageing-warn':''}">${age(t)}</td>
    <td style="color:#4A5A6A;">${t.raisedBy}</td>
  </tr>`).join('')||`<tr><td colspan="9" style="text-align:center;color:#9AA5B4;padding:20px;">No tickets found.</td></tr>`;
}

// ── TEAM ──
function renderTeam(){
  const vt=vis();
  const tk=document.getElementById('teamKpi');
  const tt=document.getElementById('teamTable');
  if(!tk||!tt) return;
  const un=vt.filter(t=>!t.assignedTo).length;
  tk.innerHTML=`
    <div class="kpi-card brand"><div class="kpi-lbl">Team size</div><div class="kpi-val">${TEAM.length}</div></div>
    <div class="kpi-card brand"><div class="kpi-lbl">Total tickets</div><div class="kpi-val">${vt.length}</div></div>
    <div class="kpi-card ${un>0?'warn':'ok'}"><div class="kpi-lbl">Unassigned</div><div class="kpi-val">${un}</div></div>`;
  tt.innerHTML=TEAM.map(m=>{
    const mine=vt.filter(t=>t.assignedTo===m.name);
    const op=mine.filter(t=>t.status==='Open').length;
    const ip=mine.filter(t=>t.status==='In Progress').length;
    const rs=mine.filter(t=>['Resolved','Closed'].includes(t.status));
    const avg=rs.length?Math.round(rs.reduce((a,t)=>a+age(t),0)/rs.length):0;
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px;"><div class="avatar" style="width:26px;height:26px;font-size:10px;">${m.name.split(' ').map(w=>w[0]).join('')}</div><div><div style="font-weight:500;color:#1A2A3A;">${m.name}</div><div style="font-size:10px;color:#6B7A8D;">${m.email}</div></div></div></td>
      <td style="color:#6B7A8D;">Support Engineer</td>
      <td>${op}</td><td>${ip}</td><td>${rs.length}</td>
      <td style="font-weight:600;">${mine.length}</td>
      <td style="font-family:var(--mono);">${avg}h</td>
    </tr>`;
  }).join('');
}

// ── SETTINGS PANELS ──
function sPanel(p){
  document.querySelectorAll('.s-nav-item').forEach(el=>el.classList.toggle('active',el.getAttribute('onclick').includes("'"+p+"'")));
  const el=document.getElementById('sPanel');
  const panels={
    users:renderUsersPanel,clients:renderClientsPanel,roles:renderRolesPanel,
    sla:renderSLAPanel,modules:renderModulesPanel,email:renderEmailPanel,
    branding:renderBrandingPanel,ai:renderAIPanel
  };
  el.innerHTML=(panels[p]||renderUsersPanel)();
}

function renderUsersPanel(){
  const all=[
    {name:'Account Manager',email:'am@sifratech.com',role:'admin',client:'—'},
    ...clients.flatMap(c=>c.users.map((u,i)=>({name:u,email:`user${i+1}@${c.name.toLowerCase().replace(/ /g,'')}.com`,role:'client',client:c.name}))),
    ...TEAM.map(m=>({name:m.name,email:m.email,role:'support',client:'—'})),
  ];
  return `<div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div class="s-sec-title" style="margin-bottom:0;border:none;padding:0;">Users (${all.length})</div>
    <button class="btn-p" onclick="alert('Add user — connect backend to persist.')"><i class="ti ti-plus"></i> Add user</button>
  </div>
  <div class="notice"><i class="ti ti-info-circle" style="flex-shrink:0;margin-top:2px;"></i>
    Demo credentials: <strong style="color:var(--accent-bright);margin-left:4px;">account_manager / Sifra@AM2025</strong>&nbsp;&nbsp;|&nbsp;&nbsp;<strong style="color:var(--accent-bright);">client_1 / Sifra@CL2025</strong>&nbsp;&nbsp;|&nbsp;&nbsp;<strong style="color:var(--accent-bright);">support_1 / Sifra@SP2025</strong>
  </div>
  ${all.map(u=>`<div class="user-row">
    <div class="avatar" style="background:${u.role==='admin'?'#8B7FD4':u.role==='client'?'#E09A2B':'var(--accent)'};width:34px;height:34px;font-size:11px;">${u.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
    <div class="user-info"><div class="user-name">${u.name}</div><div class="user-meta">${u.email} · ${u.client}</div></div>
    <span class="rtag rtag-${u.role}">${u.role==='admin'?'Account Manager':u.role==='client'?'Client user':'Support engineer'}</span>
    <button class="btn-s" style="margin-left:8px;"><i class="ti ti-edit"></i></button>
    <button class="btn-d"><i class="ti ti-trash"></i></button>
  </div>`).join('')}</div>`;
}

function renderClientsPanel(){
  return `<div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
    <div class="s-sec-title" style="margin-bottom:0;border:none;padding:0;">Clients</div>
    <button class="btn-p" onclick="openAddClient()"><i class="ti ti-plus"></i> Add client</button>
  </div>
  <div class="notice"><i class="ti ti-info-circle" style="flex-shrink:0;margin-top:2px;"></i> Set active client to switch the topbar logo and scope data to that client.</div>
  ${clients.map(c=>`<div class="user-row">
    <div style="width:80px;height:36px;background:#EEF2F7;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
      ${c.logoUrl?`<img src="${c.logoUrl}" style="max-width:76px;max-height:32px;object-fit:contain;filter:brightness(0) invert(1);opacity:.8;" onerror="this.style.display='none'">`:`<span style="font-size:10px;color:#9AA5B4;">${c.name[0]}</span>`}
    </div>
    <div class="user-info"><div class="user-name">${c.name}${c.active?'&nbsp;<span style="font-size:10px;color:var(--green);background:rgba(76,175,125,.12);padding:2px 7px;border-radius:6px;">Active</span>':''}</div>
    <div class="user-meta" style="color:#6B7A8D;">${c.contact} · ${c.users.length} user(s)</div></div>
    ${!c.active?`<button class="btn-s" onclick="setActiveClient('${c.id}')">Set active</button>`:''}
    <button class="btn-s"><i class="ti ti-edit"></i></button>
    <button class="btn-d"><i class="ti ti-trash"></i></button>
  </div>`).join('')}</div>`;
}

function setActiveClient(cid){
  clients.forEach(c=>{c.active=c.id===cid;});
  const ac=clients.find(c=>c.active);
  if(ac){const img=document.getElementById('tbClientImg'),fb=document.getElementById('tbClientTxt');
    if(ac.logoUrl){img.src=ac.logoUrl;img.style.display='';fb.style.display='none';}
    else{img.style.display='none';fb.textContent=ac.name;fb.style.display='';}
  }
  sPanel('clients');
}

function openAddClient(){
  document.getElementById('modalArea').innerHTML=`
  <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
  <div class="modal" onclick="event.stopPropagation()" style="max-width:460px;">
    <div class="modal-hdr"><div><h2>Add client</h2></div><button class="close-x" onclick="closeModal()">×</button></div>
    <div class="fg">
      <div class="fl full"><label>Client name <span class="req">*</span></label><input id="nc_n" placeholder="e.g. Emirates Steel"></div>
      <div class="fl full"><label>Logo URL</label><input id="nc_l" placeholder="https://client.com/logo.png"></div>
      <div class="fl full"><label>Contact email</label><input id="nc_e" placeholder="support@client.com"></div>
    </div>
    <div class="form-actions"><button class="btn-s" onclick="closeModal()">Cancel</button><button class="btn-p" onclick="addClient()">Add client</button></div>
  </div></div>`;
}

function addClient(){
  const n=document.getElementById('nc_n').value.trim();
  if(!n) return alert('Client name required.');
  clients.push({id:'c'+Date.now(),name:n,logoUrl:document.getElementById('nc_l').value.trim(),contact:document.getElementById('nc_e').value.trim(),users:[],active:false});
  closeModal();sPanel('clients');
}

function renderRolesPanel(){
  return `<div><div class="s-sec-title">Role definitions</div>
  <div class="notice"><i class="ti ti-info-circle" style="flex-shrink:0;margin-top:2px;"></i> Custom role builder planned for next release.</div>
  ${[{r:'Account Manager',d:'Full access — all tickets, all clients, settings, team, reports, AI features.',tag:'admin'},{r:'Client user',d:'Create tickets, view own client tickets, add comments, receive email notifications.',tag:'client'},{r:'Support engineer',d:'View all tickets, update status, resolution notes, comments. No admin access.',tag:'support'}].map(x=>`
  <div class="user-row" style="align-items:flex-start;">
    <span class="rtag rtag-${x.tag}" style="margin-top:2px;white-space:nowrap;">${x.r}</span>
    <div style="font-size:12px;color:#3A4A5C;line-height:1.7;">${x.d}</div>
  </div>`).join('')}</div>`;
}

function renderSLAPanel(){
  const pris=['Top','High','Medium','Low','Project'];
  return `<div><div class="s-sec-title">SLA targets</div>
  <div class="notice"><i class="ti ti-info-circle" style="flex-shrink:0;margin-top:2px;"></i> Applies to new tickets only.</div>
  ${pris.map(p=>`<div class="sla-row"><span class="badge ${bc(p,'p')}">${p}</span>
    <input class="input-sm" type="number" value="${SLA[p]}" min="1" style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:6px 10px;font-size:13px;color:#1A2A3A;font-family:var(--font);width:80px;" onchange="SLA['${p}']=parseInt(this.value)||SLA['${p}']">
    <span style="font-size:12px;color:#6B7A8D;">hours from creation</span>
  </div>`).join('')}
  <div style="margin-top:16px;"><button class="btn-p" onclick="alert('SLA targets saved.')">Save targets</button></div></div>`;
}

function renderModulesPanel(){
  const mods=['Financials','HRMS','SCM','PPM','Sourcing','Inventory','Payroll','Other'];
  const types=['Bug','Data Extract','Data Fix','Enhancement','New Requirement','New Setup Request','Reports','Responsibility Assignment','Training Request'];
  const row=(v)=>`<div class="user-row" style="padding:7px 0;"><span style="flex:1;font-size:13px;color:#1A2A3A;">${v}</span><button class="btn-s"><i class="ti ti-edit"></i></button><button class="btn-d"><i class="ti ti-trash"></i></button></div>`;
  return `<div><div class="s-sec-title">Oracle modules</div>${mods.map(row).join('')}<div style="margin-top:10px;display:flex;gap:8px;"><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:7px 10px;font-size:13px;color:#1A2A3A;font-family:var(--font);max-width:180px;" placeholder="Add module..."><button class="btn-p">Add</button></div>
  <div class="s-sec-title" style="margin-top:24px;">Incident types</div>${types.map(row).join('')}<div style="margin-top:10px;display:flex;gap:8px;"><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:7px 10px;font-size:13px;color:#1A2A3A;font-family:var(--font);max-width:180px;" placeholder="Add type..."><button class="btn-p">Add</button></div></div>`;
}

function renderEmailPanel(){
  return `<div><div class="s-sec-title">Email configuration</div>
  <div class="notice"><i class="ti ti-info-circle" style="flex-shrink:0;margin-top:2px;"></i> Connect SMTP (SendGrid / Mailgun / AWS SES). Inbound address auto-creates tickets.</div>
  <div class="fg" style="max-width:480px;">
    <div class="fl full"><label>From address</label><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" value="support@sifratech.com"></div>
    <div class="fl full"><label>Inbound ticket address</label><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" value="tickets@sifratech.com"></div>
    <div class="fl full"><label>SMTP host</label><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" placeholder="smtp.sendgrid.net"></div>
    <div class="fl"><label>Port</label><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" placeholder="587" type="number"></div>
    <div class="fl"><label>API key</label><input type="password" style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" placeholder="••••••••"></div>
  </div>
  <div class="s-sec-title" style="margin-top:22px;">Triggers</div>
  <div class="tgl-row"><div class="toggle on" onclick="this.classList.toggle('on')"></div> Notify raiser on ticket creation</div>
  <div class="tgl-row"><div class="toggle on" onclick="this.classList.toggle('on')"></div> Notify raiser on status change</div>
  <div class="tgl-row"><div class="toggle" onclick="this.classList.toggle('on')"></div> Notify raiser on new comment</div>
  <div style="margin-top:20px;"><button class="btn-p" onclick="alert('Email settings saved.')">Save settings</button></div></div>`;
}

function renderBrandingPanel(){
  return `<div><div class="s-sec-title">Portal branding</div>
  <div class="notice"><i class="ti ti-info-circle" style="flex-shrink:0;margin-top:2px;"></i> Sifratech teal brand is applied globally. Active client logo changes per the Clients panel.</div>
  <div class="fg" style="max-width:480px;">
    <div class="fl full"><label>Portal name</label><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" value="Sifratech Support Portal"></div>
    <div class="fl full"><label>Brand accent color (live preview)</label><input type="color" value="#1A9FCC" oninput="document.documentElement.style.setProperty('--accent',this.value);document.documentElement.style.setProperty('--t4',this.value);" style="height:40px;width:80px;border:0.5px solid var(--border2);border-radius:var(--r);background:#F5F8FB;cursor:pointer;"></div>
    <div class="fl full"><label>Support contact email</label><input style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" value="support@sifratech.com"></div>
  </div>
  <div style="margin-top:20px;"><button class="btn-p" onclick="alert('Branding saved.')">Save branding</button></div></div>`;
}

function renderAIPanel(){
  return `<div><div class="s-sec-title">AI configuration</div>
  <div class="notice"><i class="ti ti-sparkles" style="flex-shrink:0;margin-top:2px;color:#1A5FA8;"></i> Powered by Claude (Anthropic). AI features run via the Anthropic API. Add your API key below to activate.</div>
  <div class="fg" style="max-width:480px;">
    <div class="fl full"><label>Anthropic API key</label><input type="password" style="background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);" placeholder="sk-ant-••••••••" id="aiKeyInput"></div>
  </div>
  <div class="s-sec-title" style="margin-top:22px;">Active AI features</div>
  <div class="tgl-row"><div class="toggle on" onclick="this.classList.toggle('on')"></div> Auto-triage: suggest priority, module &amp; assignee on ticket creation</div>
  <div class="tgl-row"><div class="toggle on" onclick="this.classList.toggle('on')"></div> Reply suggestions: generate resolution replies for support team</div>
  <div class="tgl-row"><div class="toggle on" onclick="this.classList.toggle('on')"></div> Ticket summary &amp; sentiment analysis on ticket detail view</div>
  <div class="tgl-row"><div class="toggle" onclick="this.classList.toggle('on')"></div> AI-generated weekly digest report</div>
  <div style="margin-top:20px;"><button class="btn-p" onclick="saveAIKey()">Save AI settings</button></div></div>`;
}

function saveAIKey(){
  const k=document.getElementById('aiKeyInput')?.value.trim();
  if(k) window._aiKey=k;
  alert('AI settings saved.');
}

// ── CREATE TICKET ──
function openCreateModal(){
  const role=ROLES[currentRole];
  if(!role.canCreate) return alert('Your role does not permit ticket creation.');
  document.getElementById('modalArea').innerHTML=`
  <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-hdr">
      <div><h2>Create new ticket</h2><div class="sub">Fields marked <span style="color:var(--red)">*</span> are required</div></div>
      <button class="close-x" onclick="closeModal()">×</button>
    </div>
    <div class="fg">
      <div class="fl"><label>Project <span class="req">*</span></label><input id="fp" value="Oracle EBS R12"></div>
      <div class="fl"><label>Detected date</label><input value="${new Date().toLocaleDateString('en-GB')}" readonly></div>
      <div class="fl full"><label>Incident summary <span class="req">*</span></label><input id="fs" placeholder="Describe the error/issue in one line" oninput="aiTriage()"></div>
      <div class="fl"><label>Incident type <span class="req">*</span></label><select id="ft"><option>Bug</option><option>Data Extract</option><option>Data Fix</option><option>Enhancement</option><option>New Requirement</option><option>New Setup Request</option><option>Reports</option><option>Responsibility Assignment</option><option>Training Request</option></select></div>
      <div class="fl"><label>Module <span class="req">*</span></label><select id="fm"><option>Financials</option><option>HRMS</option><option>SCM</option><option>PPM</option><option>Sourcing</option><option>Inventory</option><option>Payroll</option><option>Other</option></select></div>
      <div class="fl"><label>Priority</label><select id="fpri"><option>High</option><option selected>Medium</option><option>Low</option><option>Top</option><option>Project</option></select></div>
      <div class="fl"><label>Environment</label><select id="fe"><option>Development</option><option>Patching</option><option>Testing</option><option>Production</option></select></div>
      <div class="fl"><label>Detected by</label><input value="${role.label}" readonly></div>
      <div class="fl"><label>Mobile no.</label><input id="fmob" placeholder="+971 xx xxx xxxx"></div>
      <div class="fl"><label>Ext no.</label><input id="fext" placeholder="Ext."></div>
      <div class="fl full"><label>CC mail</label><input id="fcc" placeholder="comma-separated emails"></div>
      ${role.canAssign?`<div class="fl"><label>Assign to</label><select id="fasgn"><option value="">— unassigned —</option>${TEAM.map(m=>`<option>${m.name}</option>`).join('')}</select></div>`:''}
      <div class="fl full"><label>Long description <span class="req">*</span></label><textarea id="fd" placeholder="Please describe the issue in detail."></textarea></div>
    </div>
    <!-- AI TRIAGE PANEL -->
    <div class="ai-panel" id="aiTriagePanel" style="display:none;">
      <div class="ai-panel-hdr"><span class="ai-badge">AI</span><span style="font-size:12px;color:#2A4A6A;font-weight:500;">Smart triage suggestions</span></div>
      <div id="aiTriageContent"></div>
    </div>
    <div class="form-actions">
      <button class="btn-s" onclick="closeModal()">Cancel</button>
      <button class="btn-p" onclick="submitTicket()">Create ticket</button>
    </div>
  </div></div>`;
}

let triageTimer=null;
function aiTriage(){
  clearTimeout(triageTimer);
  triageTimer=setTimeout(async()=>{
    const summary=document.getElementById('fs')?.value.trim();
    if(!summary||summary.length<10) return;
    const panel=document.getElementById('aiTriagePanel');
    const content=document.getElementById('aiTriageContent');
    if(!panel||!content) return;
    panel.style.display='block';
    content.innerHTML=`<div class="ai-loading"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div><span style="margin-left:4px;">Analysing ticket...</span></div>`;
    try{
      const res=await callClaude(`You are a support ticket triage AI for an Oracle EBS implementation support portal.
Analyse this ticket summary and return a JSON object with keys: priority ("Top"|"High"|"Medium"|"Low"|"Project"), module ("Financials"|"HRMS"|"SCM"|"PPM"|"Sourcing"|"Inventory"|"Payroll"|"Other"), type ("Bug"|"Data Extract"|"Data Fix"|"Enhancement"|"New Requirement"|"New Setup Request"|"Reports"|"Responsibility Assignment"|"Training Request"), suggestedAssignee (one name from: ${TEAM.map(t=>t.name).join(', ')}), reasoning (one sentence).
Return ONLY valid JSON, no markdown.
Ticket summary: "${summary}"`);
      const j=JSON.parse(res);
      content.innerHTML=`<div class="ai-result">Priority: <strong style="color:var(--accent-bright)">${j.priority}</strong> &nbsp;|&nbsp; Module: <strong style="color:var(--accent-bright)">${j.module}</strong> &nbsp;|&nbsp; Type: <strong style="color:var(--accent-bright)">${j.type}</strong><br>Suggested assignee: <strong style="color:var(--accent-bright)">${j.suggestedAssignee}</strong><br><span style="color:#6B7A8D;font-size:11px;">${j.reasoning}</span></div>
      <div class="ai-chips">
        <span class="ai-chip" onclick="applyTriage('${j.priority}','${j.module}','${j.type}','${j.suggestedAssignee}')">Apply suggestions</span>
        <span class="ai-chip" onclick="document.getElementById('aiTriagePanel').style.display='none'">Dismiss</span>
      </div>`;
    }catch(e){
      content.innerHTML=`<div class="ai-result" style="color:#6B7A8D;">AI triage unavailable — add API key in Settings → AI, or using demo mode.</div>`;
      // Demo fallback
      const demos={Financials:'Financials',HRMS:'HRMS',SCM:'SCM',payroll:'Payroll',invoice:'Financials',journal:'Financials',employee:'HRMS',PO:'SCM',inventory:'Inventory',payroll:'Payroll',sourcing:'Sourcing'};
      let mod='Financials';
      for(const [k,v] of Object.entries(demos)) if(summary.toLowerCase().includes(k)){mod=v;break;}
      content.innerHTML=`<div class="ai-result">Priority: <strong style="color:var(--accent-bright)">High</strong> &nbsp;|&nbsp; Module: <strong style="color:var(--accent-bright)">${mod}</strong><br><span style="color:#6B7A8D;font-size:11px;">Demo triage — connect AI key for full analysis.</span></div>
      <div class="ai-chips"><span class="ai-chip" onclick="applyTriage('High','${mod}','Bug','${TEAM[0].name}')">Apply demo suggestions</span></div>`;
    }
  },800);
}

function applyTriage(pri,mod,type,assignee){
  const ps=document.getElementById('fpri');const ms=document.getElementById('fm');const ts=document.getElementById('ft');const as=document.getElementById('fasgn');
  if(ps){for(let i=0;i<ps.options.length;i++) if(ps.options[i].value===pri){ps.selectedIndex=i;break;}}
  if(ms){for(let i=0;i<ms.options.length;i++) if(ms.options[i].value===mod){ms.selectedIndex=i;break;}}
  if(ts){for(let i=0;i<ts.options.length;i++) if(ts.options[i].value===type){ts.selectedIndex=i;break;}}
  if(as){for(let i=0;i<as.options.length;i++) if(as.options[i].value===assignee){as.selectedIndex=i;break;}}
  document.getElementById('aiTriagePanel').style.display='none';
}

// ── SUBMIT TICKET ──
function submitTicket(){
  const summary=document.getElementById('fs')?.value.trim();
  const desc=document.getElementById('fd')?.value.trim();
  if(!summary) return alert('Incident summary is required.');
  if(!desc) return alert('Long description is required.');
  const role=ROLES[currentRole];
  const pri=document.getElementById('fpri').value;
  const assignEl=document.getElementById('fasgn');
  const t={id:'TKT-'+nextId++,summary,type:document.getElementById('ft').value,module:document.getElementById('fm').value,priority:pri,status:'Open',environment:document.getElementById('fe').value,project:document.getElementById('fp').value,detectedDate:now(),createdAt:now(),expectedDate:new Date(now().getTime()+(SLA[pri]||24)*36e5),raisedBy:role.label,client:role.client||'Al Seer Marine',assignedTo:assignEl?assignEl.value:'',assignedTeam:'Sifratech Support',mobileNo:document.getElementById('fmob')?.value||'',extNo:document.getElementById('fext')?.value||'',ccMail:document.getElementById('fcc')?.value||'',longDescription:desc,resolution:'',auditLog:[{ts:now(),by:'System',msg:`Ticket created by ${role.label}. Status: Open.`}],comments:[],emailSent:true};
  tickets.unshift(t);
  closeModal();renderAll();
  setTimeout(()=>showEmailSim(t),150);
}

function showEmailSim(t){
  document.getElementById('modalArea').innerHTML=`
  <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
  <div class="modal" onclick="event.stopPropagation()" style="max-width:500px;">
    <div class="modal-hdr"><h2><i class="ti ti-mail"></i> Email notification sent</h2><button class="close-x" onclick="closeModal()">×</button></div>
    <div class="email-sim"><strong>From:</strong> support@sifratech.com<br>
    <strong>To:</strong> ${t.raisedBy.toLowerCase().replace(/ /g,'.')}@client.com${t.ccMail?`<br><strong>CC:</strong> ${t.ccMail}`:''}<br>
    <strong>Subject:</strong> [${t.id}] Ticket Created — ${t.summary}<br><br>
    Dear ${t.raisedBy},<br><br>Ticket <strong>${t.id}</strong> created. Priority: ${t.priority} | Module: ${t.module} | SLA: ${SLA[t.priority]}h.<br><br>You will be notified on each status change.<br><br>Regards,<br>Sifratech Support Team</div>
    <div class="form-actions"><button class="btn-p" onclick="closeModal()">OK</button></div>
  </div></div>`;
}

// ── TICKET DETAIL ──
async function openDetail(id){
  const t=tickets.find(x=>x.id===id);if(!t) return;
  const role=ROLES[currentRole];
  const canUp=role.canClose||role.isSupport||role.seeAll;
  const stats=['Open','In Progress','Resolved','Closed','Reopened'];
  document.getElementById('modalArea').innerHTML=`
  <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
  <div class="modal" onclick="event.stopPropagation()" style="max-width:720px;max-height:90vh;overflow-y:auto;">
    <div class="modal-hdr">
      <div><div style="font-size:11px;color:#6B7A8D;font-family:var(--mono);margin-bottom:4px;">${t.id}</div><h2>${t.summary}</h2></div>
      <button class="close-x" onclick="closeModal()">×</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <span class="badge ${bc(t.status,'s')}">${t.status}</span>
      <span class="badge ${bc(t.priority,'p')}">${t.priority}</span>
      <span class="badge" style="background:rgba(255,255,255,.07);color:#3A4A5C;">${t.module}</span>
      <span class="badge" style="background:rgba(255,255,255,.07);color:#3A4A5C;">${t.type}</span>
      ${age(t)>SLA[t.priority]?`<span class="badge b-high">SLA breached — ${age(t)}h</span>`:''}
    </div>

    <!-- AI Summary Panel -->
    <div class="ai-panel" id="aiSummaryPanel">
      <div class="ai-panel-hdr"><span class="ai-badge">AI</span><span style="font-size:12px;color:#2A4A6A;font-weight:500;">Ticket analysis &amp; sentiment</span></div>
      <div id="aiSummaryContent"><div class="ai-loading"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div><span style="margin-left:4px;">Analysing...</span></div></div>
    </div>

    <div class="det-section" style="margin-top:16px;"><h3>Ticket details</h3>
      <div class="det-grid">
        <div class="det-row"><span class="lbl">Project</span><span>${t.project}</span></div>
        <div class="det-row"><span class="lbl">Environment</span><span>${t.environment}</span></div>
        <div class="det-row"><span class="lbl">Detected</span><span>${fmt(t.detectedDate)}</span></div>
        <div class="det-row"><span class="lbl">Expected resolution</span><span>${fmt(t.expectedDate)}</span></div>
        <div class="det-row"><span class="lbl">Raised by</span><span>${t.raisedBy}</span></div>
        <div class="det-row"><span class="lbl">Client</span><span>${t.client}</span></div>
        <div class="det-row"><span class="lbl">Assigned to</span><span>${t.assignedTo||'Unassigned'}</span></div>
        <div class="det-row"><span class="lbl">Team</span><span>${t.assignedTeam}</span></div>
        <div class="det-row"><span class="lbl">Age</span><span class="${age(t)>SLA[t.priority]?'ageing-warn':''}">${age(t)}h</span></div>
      </div>
    </div>

    <div class="det-section"><h3>Description</h3><p style="font-size:13px;line-height:1.7;color:#3A4A5C;">${t.longDescription}</p></div>
    ${t.resolution?`<div class="det-section"><h3>Resolution</h3><p style="font-size:13px;line-height:1.7;color:#3A4A5C;">${t.resolution}</p></div>`:''}

    ${canUp?`
    <div class="det-section"><h3>Update status</h3>
      <div class="status-btns">${stats.filter(s=>s!==t.status).map(s=>`<button class="btn-s" onclick="updateStatus('${t.id}','${s}')">${s}</button>`).join('')}</div>
      ${role.canAssign||role.seeAll?`<div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
        <select id="raSel" style="background:#FFFFFF;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:7px 10px;font-size:12px;color:#1A2A3A;font-family:var(--font);">
          <option value="">— reassign to —</option>${TEAM.map(m=>`<option ${t.assignedTo===m.name?'selected':''}>${m.name}</option>`).join('')}
        </select>
        <button class="btn-s" onclick="reassign('${t.id}')">Assign</button>
      </div>`:''}
      ${t.status==='Resolved'?`<div style="margin-top:12px;">
        <label style="font-size:10px;font-weight:600;color:#6B7A8D;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Resolution notes</label>
        <textarea id="resTxt" style="width:100%;background:#F5F8FB;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:8px 11px;font-size:13px;color:#1A2A3A;font-family:var(--font);min-height:70px;outline:none;">${t.resolution}</textarea>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn-s" onclick="saveResolution('${t.id}')">Save resolution</button>
          <button class="btn-p" id="aiRepBtn" onclick="aiReply('${t.id}')"><i class="ti ti-sparkles"></i> AI reply suggestion</button>
        </div>
      </div>`:''}
    </div>

    <!-- AI Reply Panel -->
    <div class="ai-panel" id="aiReplyPanel" style="display:none;">
      <div class="ai-panel-hdr"><span class="ai-badge">AI</span><span style="font-size:12px;color:#2A4A6A;font-weight:500;">Suggested resolution reply</span></div>
      <div id="aiReplyContent"></div>
    </div>`:''}

    <div class="det-section"><h3>Comments</h3>
      <div class="comment-box">
        ${t.comments.length?t.comments.map(c=>`<div class="comment-entry"><div class="comment-meta">${c.by} · ${fmt(c.ts)}</div><div style="color:#1A2A3A;">${c.msg}</div></div>`).join(''):'<div style="font-size:12px;color:#6B7A8D;margin-bottom:10px;">No comments yet.</div>'}
        <div style="display:flex;gap:8px;margin-top:8px;">
          <input id="cmtIn" style="flex:1;background:#FFFFFF;border:0.5px solid rgba(0,0,0,0.15);border-radius:var(--r);padding:7px 10px;font-size:12px;color:#1A2A3A;font-family:var(--font);outline:none;" placeholder="Add a comment...">
          <button class="btn-s" onclick="addComment('${t.id}')">Post</button>
        </div>
      </div>
    </div>
    <div class="det-section"><h3>Audit log</h3>${t.auditLog.map(a=>`<div class="audit-entry">${fmt(a.ts)} — <strong>${a.by}</strong>: ${a.msg}</div>`).join('')}</div>
  </div></div>`;

  // Auto-trigger AI summary
  setTimeout(()=>aiSummary(t),300);
}

async function aiSummary(t){
  const el=document.getElementById('aiSummaryContent');
  if(!el) return;
  try{
    const res=await callClaude(`You are a support ticket analyst. Summarise this Oracle EBS support ticket and provide: 1) a one-sentence executive summary, 2) client sentiment (Frustrated/Neutral/Satisfied), 3) urgency assessment, 4) recommended next action.
Return JSON with keys: summary, sentiment, sentimentColor (red/amber/green), urgency, nextAction.
Ticket: ID ${t.id}, Summary: "${t.summary}", Status: ${t.status}, Priority: ${t.priority}, Age: ${age(t)} hours, Module: ${t.module}, Description: "${t.longDescription}".
Return ONLY valid JSON.`);
    const j=JSON.parse(res);
    const sc={red:'var(--red)',amber:'var(--amber)',green:'var(--green)'}[j.sentimentColor]||'var(--text2)';
    el.innerHTML=`<div class="ai-result">${j.summary}<br><br>
      Sentiment: <strong style="color:${sc}">${j.sentiment}</strong> &nbsp;·&nbsp; Urgency: <strong style="color:var(--accent-bright)">${j.urgency}</strong><br>
      <span style="color:#6B7A8D;">Next action: ${j.nextAction}</span></div>`;
  }catch(e){
    el.innerHTML=`<div class="ai-result">Ticket is ${age(t)}h old, status: <strong style="color:var(--accent-bright)">${t.status}</strong>, priority: <strong style="color:var(--accent-bright)">${t.priority}</strong>. ${age(t)>SLA[t.priority]?'<strong style="color:var(--red);">SLA breached — immediate action required.</strong>':'Within SLA target.'}</div>`;
  }
}

async function aiReply(id){
  const t=tickets.find(x=>x.id===id);if(!t) return;
  const panel=document.getElementById('aiReplyPanel');
  const content=document.getElementById('aiReplyContent');
  if(!panel||!content) return;
  panel.style.display='block';
  content.innerHTML=`<div class="ai-loading"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div><span style="margin-left:4px;">Generating reply...</span></div>`;
  try{
    const res=await callClaude(`You are a senior Oracle EBS support engineer at Sifratech Technology. Write a professional, empathetic resolution email to the client for this ticket. Keep it concise (3-4 sentences). Do not use placeholders — write a realistic resolution.
Ticket: "${t.summary}", Module: ${t.module}, Type: ${t.type}, Description: "${t.longDescription}".
Return only the email body text, no subject line.`);
    content.innerHTML=`<div class="ai-result">${res}</div>
    <div class="ai-chips">
      <span class="ai-chip" onclick="applyReply('${id}')">Use this reply</span>
      <span class="ai-chip" onclick="aiReply('${id}')">Regenerate</span>
    </div>`;
    window._lastAIReply=res;
  }catch(e){
    content.innerHTML=`<div class="ai-result" style="color:#6B7A8D;">Could not generate reply — add API key in Settings → AI, or type manually.</div>`;
  }
}

function applyReply(id){
  const txt=document.getElementById('resTxt');
  if(txt&&window._lastAIReply) txt.value=window._lastAIReply;
  document.getElementById('aiReplyPanel').style.display='none';
}

// ── STATUS / ASSIGNMENT ──
function updateStatus(id,ns){
  const t=tickets.find(x=>x.id===id);if(!t) return;
  const role=ROLES[currentRole];const old=t.status;t.status=ns;
  t.auditLog.push({ts:now(),by:role.label,msg:`Status: ${old} → ${ns}.`});
  if(ns==='In Progress') t.auditLog.push({ts:now(),by:'System',msg:`Email: ${t.raisedBy} notified (In Progress).`});
  if(ns==='Resolved') t.auditLog.push({ts:now(),by:'System',msg:`Email: ${t.raisedBy} notified (Resolved). Confirm or reopen within 48h.`});
  if(ns==='Closed') t.auditLog.push({ts:now(),by:'System',msg:`Email: ${t.raisedBy} notified (Closed).`});
  closeModal();renderAll();setTimeout(()=>openDetail(id),100);
}

function reassign(id){
  const t=tickets.find(x=>x.id===id);
  const sel=document.getElementById('raSel');
  if(!t||!sel||!sel.value) return;
  const role=ROLES[currentRole];const prev=t.assignedTo;t.assignedTo=sel.value;
  t.auditLog.push({ts:now(),by:role.label,msg:`Reassigned: ${prev||'unassigned'} → ${sel.value}.`});
  if(t.status==='Open'){t.status='In Progress';t.auditLog.push({ts:now(),by:'System',msg:'Status auto-updated to In Progress.'});}
  closeModal();renderAll();setTimeout(()=>openDetail(id),100);
}

function saveResolution(id){
  const t=tickets.find(x=>x.id===id);
  const txt=document.getElementById('resTxt');
  if(!t||!txt) return;
  t.resolution=txt.value;
  t.auditLog.push({ts:now(),by:ROLES[currentRole].label,msg:'Resolution notes updated.'});
  closeModal();renderAll();setTimeout(()=>openDetail(id),100);
}

function addComment(id){
  const t=tickets.find(x=>x.id===id);
  const inp=document.getElementById('cmtIn');
  if(!t||!inp||!inp.value.trim()) return;
  t.comments.push({ts:now(),by:ROLES[currentRole].label,msg:inp.value.trim()});
  t.auditLog.push({ts:now(),by:ROLES[currentRole].label,msg:'Comment added.'});
  closeModal();renderAll();setTimeout(()=>openDetail(id),100);
}

function closeModal(){document.getElementById('modalArea').innerHTML='';}

// ── CLAUDE API ──
async function callClaude(prompt){
  const key=window._aiKey||'';
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:600,messages:[{role:'user',content:prompt}]})
  });
  if(!res.ok) throw new Error('API error');
  const d=await res.json();
  return d.content[0].text;
}