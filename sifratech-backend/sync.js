require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function main() {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  for (const au of authUsers.users) {
    await supabase.from('users').upsert({
      id: au.id,
      email: au.email,
      full_name: au.email.split('@')[0],
      is_active: true
    }, { onConflict: 'id' });
  }
  console.log("Synced all auth users to public.users!");
}
main();
