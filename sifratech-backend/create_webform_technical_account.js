require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function createWebformTechnicalAccount() {
    const email = 'webformtechnicalteam@sifratc.com';
    const password = 'Welcome@2026';
    const name = 'Webform Technical Team';

    console.log(`Checking user account for ${email}...`);

    // 1. Fetch roles
    const { data: roles } = await supabase.from('roles').select('*');
    const engineerRole = roles?.find(r => r.name === 'Engineer' || r.name === 'Support') || roles?.[0];

    // 2. Fetch or Create Auth User
    const { data: authList } = await supabase.auth.admin.listUsers();
    let authUser = authList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!authUser) {
        console.log("Creating user in Auth...");
        const { data: createdAuth, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: name }
        });
        if (authError) {
            console.error("Auth creation failed:", authError);
            process.exit(1);
        }
        authUser = createdAuth.user;
        console.log("Auth user created ID:", authUser.id);
    } else {
        console.log("User already exists in Auth. Updating password...");
        await supabase.auth.admin.updateUserById(authUser.id, { password: password });
    }

    // 3. Upsert in public.users table
    const { data: existingDbUser } = await supabase.from('users').select('*').eq('id', authUser.id).single();

    if (!existingDbUser) {
        const { error: userInsertErr } = await supabase.from('users').insert([{
            id: authUser.id,
            email: email,
            full_name: name,
            role_id: engineerRole?.id,
            is_active: true
        }]);
        if (userInsertErr) {
            console.error("User insert failed:", userInsertErr);
        } else {
            console.log("Successfully created record in users table.");
        }
    } else {
        console.log("Record already exists in users table.");
    }

    // 4. Upsert in managed_credentials table
    const { data: existingCred } = await supabase.from('managed_credentials').select('*').eq('email', email).single();
    if (!existingCred) {
        await supabase.from('managed_credentials').insert([{
            user_id: authUser.id,
            email: email,
            plain_password: password
        }]);
    } else {
        await supabase.from('managed_credentials').update({ plain_password: password }).eq('email', email);
    }

    console.log("\n=========================================");
    console.log("WEBFORM-TECHNICAL CREATION COMPLETE");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("=========================================\n");
}

createWebformTechnicalAccount();
