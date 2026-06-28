require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const MOCK_USERS = [
  { name: 'Venkatraman R', email: 'SCMteam@sifratc.com', role: 'Engineer', team: 'Supply Chain Team' },
  { name: 'Bhuvanewari K.D', email: 'HCMteam@sifratc.com', role: 'Engineer', team: 'HR Team' },
  { name: 'Tejashree', email: 'PPMteam@sifratc.com', role: 'Engineer', team: 'Projects Team' },
  { name: 'Finance Consultant', email: 'financeteam@sifratc.com', role: 'Engineer', team: 'Finance Support Team' },
  { name: 'Renuga Devi', email: 'technicalteam@sifratc.com', role: 'Engineer', team: null },
  { name: 'Dhayanithe', email: 'dhayanthie.n@sifratc.com', role: 'Manager', team: null },
  { name: 'Sivakumar', email: 'sivakumar.s@sifratc.com', role: 'Manager', team: null },
  { name: 'Carol', email: 'carol@sifratc.com', role: 'Engineer', team: 'Supply Chain Team' },
  { name: 'nirosha', email: 'Nirosha.nm@sifratc.com', role: 'Engineer', team: null }
];

async function seedUsers() {
  console.log("Fetching roles and teams...");
  const { data: roles } = await supabase.from('roles').select('*');
  const { data: teams } = await supabase.from('teams').select('*');

  for (const mock of MOCK_USERS) {
    console.log(`Processing user: ${mock.email}`);
    
    // 1. Create in Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: mock.email,
      password: 'password123',
      email_confirm: true
    });

    if (authError && authError.message.includes('already exists')) {
       console.log(`User ${mock.email} already exists in Auth. Skipping creation.`);
       continue;
    } else if (authError) {
       console.error(`Error creating auth user ${mock.email}:`, authError);
       continue;
    }

    const userId = authUser.user.id;
    
    // 2. Insert into users table
    const roleId = roles.find(r => r.name === mock.role)?.id || null;
    const teamId = mock.team ? teams.find(t => t.name === mock.team)?.id : null;

    const { error: dbError } = await supabase.from('users').insert([{
      id: userId,
      email: mock.email,
      full_name: mock.name,
      role_id: roleId,
      team_id: teamId,
      is_active: true
    }]);

    if (dbError) {
       console.error(`Error inserting ${mock.email} into users table:`, dbError);
    } else {
       console.log(`Successfully seeded ${mock.name} (${mock.email})`);
    }
  }
  console.log("Seeding complete.");
}

seedUsers();
