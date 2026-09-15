require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const USERS_TO_CREATE = [
  {
    name: 'Jessica',
    email: 'jessica@alseermarine.com',
    role: 'Manager',
    team: 'Supply Chain Team',
    password: 'Welcome@2026'
  },
  {
    name: 'Simon Joseph',
    email: 'simon.joseph@alseermarine.com',
    role: 'Manager',
    team: 'Supply Chain Team',
    password: 'Welcome@2026'
  },
  {
    name: 'Veronica',
    email: 'veronica@alseermarine.com',
    role: 'Manager',
    team: 'Supply Chain Team',
    password: 'Welcome@2026'
  }
];

async function createASMUsers() {
  console.log("Fetching roles and teams...");
  const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
  const { data: teams, error: teamsError } = await supabase.from('teams').select('*');

  if (rolesError) console.error("Roles error:", rolesError);
  if (teamsError) console.error("Teams error:", teamsError);

  const managerRole = roles?.find(r => r.name === 'Manager')?.id;
  const scmTeam = teams?.find(t => t.name === 'Supply Chain Team')?.id;

  const results = [];

  for (const userConfig of USERS_TO_CREATE) {
    console.log(`\nProcessing user: ${userConfig.name} (${userConfig.email})...`);

    // 1. Get or create auth user
    const { data: authList, error: listError } = await supabase.auth.admin.listUsers();
    let authUser = authList?.users?.find(u => u.email.toLowerCase() === userConfig.email.toLowerCase());

    let userId;
    if (!authUser) {
      console.log(`Creating user in Auth: ${userConfig.email}`);
      const { data: createdAuth, error: authError } = await supabase.auth.admin.createUser({
        email: userConfig.email,
        password: userConfig.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`Error creating auth user ${userConfig.email}:`, authError.message);
        continue;
      }
      userId = createdAuth.user.id;
      console.log(`Created Auth user with ID: ${userId}`);
    } else {
      userId = authUser.id;
      console.log(`User already exists in Auth with ID: ${userId}. Updating password...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: userConfig.password
      });
      if (updateError) console.error(`Error updating password for ${userConfig.email}:`, updateError.message);
    }

    // 2. Upsert public.users
    const roleId = managerRole;
    const teamId = scmTeam;

    const { data: dbUser, error: dbError } = await supabase.from('users').upsert({
      id: userId,
      email: userConfig.email,
      full_name: userConfig.name,
      role_id: roleId,
      team_id: teamId,
      is_active: true
    }).select().single();

    if (dbError) {
      console.error(`Error upserting public.users for ${userConfig.email}:`, dbError.message);
    } else {
      console.log(`Successfully updated public.users for ${userConfig.email}`);
    }

    // 3. Save managed_credentials
    const { data: existingCred } = await supabase.from('managed_credentials').select('id').eq('user_id', userId).maybeSingle();
    
    if (existingCred) {
      const { error: credError } = await supabase.from('managed_credentials').update({
        email: userConfig.email,
        plain_password: userConfig.password,
        updated_at: new Date().toISOString()
      }).eq('id', existingCred.id);

      if (credError) {
        console.error(`Error updating managed_credentials for ${userConfig.email}:`, credError.message);
      } else {
        console.log(`Successfully updated managed credentials for ${userConfig.email}`);
      }
    } else {
      const { error: credError } = await supabase.from('managed_credentials').insert({
        user_id: userId,
        email: userConfig.email,
        plain_password: userConfig.password
      });

      if (credError) {
        console.error(`Error inserting managed_credentials for ${userConfig.email}:`, credError.message);
      } else {
        console.log(`Successfully inserted managed credentials for ${userConfig.email}`);
      }
    }

    results.push({
      name: userConfig.name,
      email: userConfig.email,
      role: 'Manager (Super User)',
      team: 'Supply Chain / Procurement',
      password: userConfig.password,
      userId: userId
    });
  }

  console.log("\n=== CREATED USERS SUMMARY ===");
  console.table(results);
}

createASMUsers().catch(console.error);
