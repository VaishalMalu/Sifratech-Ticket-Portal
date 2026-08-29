require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addAshfaqUser() {
  const email = 'ashfaq.k@alt-s.in';
  const fullName = 'ashfaq.k';
  const password = 'Welcome@' + new Date().getFullYear();

  console.log(`Checking if user ${email} exists...`);

  // Fetch roles
  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  const engineerRoleId = roles?.find(r => r.name === 'Engineer')?.id || null;

  // Fetch auth users
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  let existingAuthUser = authUsers?.users?.find(u => u.email.toLowerCase() === email.toLowerCase());

  let userId;
  if (!existingAuthUser) {
    console.log(`Creating user in Auth: ${email}`);
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });
    if (authError) {
      console.error(`Error creating auth user: ${authError.message}`);
      return;
    }
    userId = authUser.user.id;
    console.log(`Auth user created with ID: ${userId}`);
  } else {
    userId = existingAuthUser.id;
    console.log(`User already exists in Auth with ID: ${userId}`);
  }

  // Upsert into managed_credentials if exists table
  try {
    await supabase.from('managed_credentials').upsert({
      user_id: userId,
      password: password
    });
  } catch (err) {
    console.log('managed_credentials upsert note:', err.message);
  }

  // Insert/Upsert into users table
  const { data: dbUser, error: dbError } = await supabase.from('users').upsert([{
    id: userId,
    email: email,
    full_name: fullName,
    role_id: engineerRoleId,
    is_active: true
  }]).select();

  if (dbError) {
    console.error('Error inserting user into public.users:', dbError);
  } else {
    console.log('Successfully added user to public.users:', dbUser);
  }
}

addAshfaqUser().catch(console.error);
