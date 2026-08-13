require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Simulate the frontend logging in
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://otqorqisxqxvxpdxtakv.supabase.co';
// This is the VITE_SUPABASE_ANON_KEY from the frontend (which is actually a service role key)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cW9ycWlzeHF4dnhwZHh0YWt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ0MjYxNCwiZXhwIjoyMDk4MDE4NjE0fQ.wplMLXLQr8Uz8bdJqm1OYweznS_v4JY1K26OtNa8Ago';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    console.log("Logging in...");
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: 'account_manager@sifratc.com',
        password: 'SifraAM@2026'
    });
    
    if (error) {
        console.error("Login failed:", error.message);
        return;
    }
    
    console.log("Login successful! Token:", data.session.access_token.substring(0, 20) + "...");
    
    // Now simulate backend authMiddleware validating this token
    const backendSupabaseUrl = process.env.SUPABASE_URL || 'https://otqorqisxqxvxpdxtakv.supabase.co';
    const backendServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cW9ycWlzeHF4dnhwZHh0YWt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ0MjYxNCwiZXhwIjoyMDk4MDE4NjE0fQ.wplMLXLQr8Uz8bdJqm1OYweznS_v4JY1K26OtNa8Ago';
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
