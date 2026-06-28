require('dotenv').config();
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    const wb = xlsx.readFile('e:\\\\AI TIcket ERP\\\\knowledge base\\\\ASM Support Mail IDs List_Sifratc.com.xlsx');
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    // Get roles and teams
    const { data: roles } = await supabase.from('roles').select('*');
    const engineerRole = roles.find(r => r.name === 'Engineer').id;
    const adminRole = roles.find(r => r.name === 'Admin').id;
    
    const { data: teams } = await supabase.from('teams').select('*');

    for (const row of rows) {
        let email = row['Sifratc.com Mail Ids'];
        if (!email || !email.includes('@')) continue;

        email = email.trim().toLowerCase();
        let name = row['Authentication '] || email.split('@')[0];
        
        // Determine Team
        let teamId = null;
        if (email.includes('scm')) teamId = teams.find(t => t.name === 'Supply Chain Team')?.id;
        else if (email.includes('hcm')) teamId = teams.find(t => t.name === 'HR Team')?.id;
        else if (email.includes('finance')) teamId = teams.find(t => t.name === 'Finance Support Team')?.id;
        else if (email.includes('ppm')) teamId = teams.find(t => t.name === 'Projects Team')?.id;
        
        let roleId = engineerRole;
        if (email.includes('dhayanthie') || email.includes('sivakumar')) {
             roleId = adminRole; // As per previous mock data
        }

        const password = 'Welcome@' + new Date().getFullYear();

        console.log(`Processing ${email}...`);

        // Check if exists
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
        if (existingUser) {
            console.log(`User ${email} already exists, skipping creation. Updating password to ${password}.`);
            await supabase.from('managed_credentials').upsert({ user_id: existingUser.id, password });
            await supabase.auth.admin.updateUserById(existingUser.id, { password });
            continue;
        }

        // Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });

        if (authError) {
            console.error(`Error creating auth user ${email}:`, authError.message);
            continue;
        }

        const userId = authData.user.id;

        // Insert into public.users
        await supabase.from('users').insert({
            id: userId,
            email: email,
            full_name: name,
            role_id: roleId,
            team_id: teamId,
            is_active: true
        });

        // Insert into managed_credentials
        await supabase.from('managed_credentials').insert({
            user_id: userId,
            password: password
        });

        console.log(`Created user ${email} with password ${password}`);
    }
}

run().catch(console.error);
