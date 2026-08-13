require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addAccountManager() {
  const email = 'account_manager@sifratc.com';
  console.log(`Processing user: ${email}`);
  
  // 1. Create in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: 'password123',
    email_confirm: true
  });

  if (authError && authError.message.includes('already exists')) {
     console.log(`User ${email} already exists in Auth. Skipping creation.`);
  } else if (authError) {
     console.error(`Error creating auth user ${email}:`, authError);
     return;
  }

  // Get the user ID (either newly created or query existing if it failed with already exists)
  let userId;
  if (authUser?.user) {
     userId = authUser.user.id;
  } else {
     const { data: existingUser } = await supabase.auth.admin.listUsers();
     const user = existingUser.users.find(u => u.email === email);
     if (user) userId = user.id;
     else {
        console.error("Could not find user ID");
        return;
     }
  }
  
  // 2. Insert into users table
  const { data: roles } = await supabase.from('roles').select('*');
  const roleId = roles.find(r => r.name === 'Manager')?.id || null; // Account Manager typically has Manager role

  const { error: dbError } = await supabase.from('users').upsert([{
    id: userId,
    email: email,
    full_name: 'Account Manager',
    role_id: roleId,
    is_active: true
  }]);

  if (dbError) {
     console.error(`Error inserting ${email} into users table:`, dbError);
  } else {
     console.log(`Successfully added Account Manager (${email}) to database!`);
  }
}

addAccountManager();
