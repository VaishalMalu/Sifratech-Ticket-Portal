require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Simulate the frontend logging in
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    console.log("Logging in...");
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: process.env.TEST_USER_EMAIL || 'account_manager@sifratc.com',
        password: process.env.TEST_USER_PASSWORD || 'Welcome@2026'
    });
    
    if (error) {
        console.error("Login failed:", error.message);
        return;
    }
    
    console.log("Login successful! Token:", data.session.access_token.substring(0, 20) + "...");
    
    // Now simulate backend authMiddleware validating this token
    const backendSupabaseUrl = process.env.SUPABASE_URL;
    const backendServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const backendSupabase = createClient(backendSupabaseUrl, backendServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log("Backend validating token...");
    const { data: { user }, error: verifyError } = await backendSupabase.auth.getUser(data.session.access_token);
    
    if (verifyError) {
        console.error("Verification failed:", verifyError);
    } else {
        console.log("Verification succeeded! User ID:", user.id);
    }
}
main();
