const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'account_manager@sifratc.com', 
    password: 'password123'
  });
  if (error) { console.log('Auth Error:', error.message); return; }
  
  const token = data.session.access_token;
  
  const res = await fetch('http://localhost:3000/api/emails/assign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      toEmail: 'ppmteam@sifratc.com',
      ticketNumber: 'TKT-123',
      title: 'Test Ticket',
      priority: 'High',
      customerDetails: 'Test Customer',
      module: 'Test Module',
      status: 'Assigned',
      assignedBy: 'Account Manager',
      assignmentDate: new Date().toISOString(),
      slaDueDate: new Date().toISOString(),
      portalUrl: 'http://localhost:5173/tickets?id=123'
    })
  });
  
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
test();
