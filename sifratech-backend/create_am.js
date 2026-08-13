require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const email = 'account_manager@sifratc.com';
  const password = 'password123';

  // 1. Create in auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  if (authError && !authError.message.includes('already been registered')) {
    console.error("Error creating auth user:", authError);
    return;
  }
  
  // Get user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  
  if (user) {
    // 2. Insert into public.users
    const { error: dbError } = await supabase.from('users').upsert({
      id: user.id,
      email: email,
      full_name: 'Account Manager',
      is_active: true
    }, { onConflict: 'id' });
    
    if (dbError) {
      console.error("Error inserting into public.users:", dbError);
    } else {
      console.log(`Successfully created ${email} with password: ${password}`);
    }
    
    // Update password just in case it already existed
    await supabase.auth.admin.updateUserById(user.id, { password });
  }
}
main();
