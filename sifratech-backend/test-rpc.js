require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.rpc('exec_sql', { query: "SELECT 1" })
  .then(res => console.log('RPC result:', res))
  .catch(console.error)
  .finally(() => process.exit(0));
