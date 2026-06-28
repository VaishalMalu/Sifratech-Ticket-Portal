require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your_service_role_key'; // Need service role to bypass RLS for server ops

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase };
