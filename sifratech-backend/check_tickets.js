const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
lines.forEach(line => {
  if (line.startsWith('SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('tickets').select('ticket_number, title, created_at, company, oracle_module_id').order('created_at', { ascending: false }).limit(100);
  
  if (error) {
    console.error(error);
    return;
  }

  const mods = await supabase.from('oracle_modules').select('*');
  const modMap = {};
  mods.data.forEach(m => modMap[m.id] = m.name);

  data.forEach(t => {
    t.module_name = modMap[t.oracle_module_id];
    const createdDate = new Date(t.created_at);
    const now = new Date();
    const diffHours = (now - createdDate) / 36e5;
    t.age_days = Math.round(diffHours / 24);
  });

  const hcmTickets = data.filter(t => t.module_name && t.module_name.toUpperCase().includes('HCM'));
  console.log("HCM Tickets:");
  console.log(JSON.stringify(hcmTickets.slice(0, 10), null, 2));

  console.log("\nSome other tickets:");
  console.log(JSON.stringify(data.filter(t => !t.module_name || !t.module_name.toUpperCase().includes('HCM')).slice(0, 5), null, 2));
}

run();
