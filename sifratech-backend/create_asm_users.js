require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Existing Veronica account
const OLD_EMAIL = 'veronica@alseermarine.com';

// New email required
const NEW_EMAIL = 'veronica@asmyachts.com';

// Existing/default password
const PASSWORD = 'Welcome@2026';

async function updateVeronica() {
  console.log('\n========================================');
  console.log('VERONICA ACCOUNT UPDATE');
  console.log('========================================');

  console.log(`Old Email: ${OLD_EMAIL}`);
  console.log(`New Email: ${NEW_EMAIL}`);

  // --------------------------------------------------
  // 1. Fetch existing Auth users
  // --------------------------------------------------
  console.log('\n[1/4] Searching for existing Auth user...');

  const { data: authList, error: listError } =
    await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Failed to fetch Auth users:', listError.message);
    process.exit(1);
  }

  const authUser = authList?.users?.find(
    user =>
      user.email &&
      (user.email.toLowerCase() === OLD_EMAIL.toLowerCase() ||
       user.email.toLowerCase() === NEW_EMAIL.toLowerCase())
  );

  if (!authUser) {
    console.error(`\nERROR: User not found with email ${OLD_EMAIL} or ${NEW_EMAIL}`);
    console.error(
      'No changes were made. Check the existing email in Supabase Auth.'
    );
    process.exit(1);
  }

  const userId = authUser.id;
  const isAlreadyMigrated = authUser.email.toLowerCase() === NEW_EMAIL.toLowerCase();

  console.log('Existing Auth user found.');
  console.log(`User ID: ${userId}`);
  console.log(`Current Email: ${authUser.email}`);
  if (isAlreadyMigrated) {
    console.log(`Note: User is already updated to new email (${NEW_EMAIL}). Ensuring database sync...`);
  }

  // --------------------------------------------------
  // 2. Update Supabase Auth
  // --------------------------------------------------
  console.log('\n[2/4] Updating Supabase Auth...');

  const { error: authError } =
    await supabase.auth.admin.updateUserById(userId, {
      email: NEW_EMAIL,
      email_confirm: true,
      password: PASSWORD
    });

  if (authError) {
    console.error(
      'Failed to update Supabase Auth:',
      authError.message
    );
    process.exit(1);
  }

  console.log('Supabase Auth updated successfully.');
  console.log(`New Auth Email: ${NEW_EMAIL}`);

  // --------------------------------------------------
  // 3. Update public.users
  // --------------------------------------------------
  console.log('\n[3/4] Updating public.users...');

  const { error: usersError } =
    await supabase
      .from('users')
      .update({
        email: NEW_EMAIL,
        full_name: 'Veronica',
        is_active: true
      })
      .eq('id', userId);

  if (usersError) {
    console.error(
      'Failed to update public.users:',
      usersError.message
    );
    process.exit(1);
  }

  console.log('public.users updated successfully.');

  // --------------------------------------------------
  // 4. Update managed_credentials
  // --------------------------------------------------
  console.log('\n[4/4] Updating managed_credentials...');

  const { data: existingCredential, error: credentialFindError } =
    await supabase
      .from('managed_credentials')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

  if (credentialFindError) {
    console.error(
      'Failed to find managed credentials:',
      credentialFindError.message
    );
    process.exit(1);
  }

  if (existingCredential) {
    const { error: credentialUpdateError } =
      await supabase
        .from('managed_credentials')
        .update({
          email: NEW_EMAIL,
          plain_password: PASSWORD,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCredential.id);

    if (credentialUpdateError) {
      console.error(
        'Failed to update managed_credentials:',
        credentialUpdateError.message
      );
      process.exit(1);
    }

    console.log('managed_credentials updated successfully.');
  } else {
    console.log(
      'No existing managed_credentials record found.'
    );

    console.log('Creating managed_credentials record...');

    const { error: credentialInsertError } =
      await supabase
        .from('managed_credentials')
        .insert({
          user_id: userId,
          email: NEW_EMAIL,
          plain_password: PASSWORD
        });

    if (credentialInsertError) {
      console.error(
        'Failed to create managed_credentials:',
        credentialInsertError.message
      );
      process.exit(1);
    }

    console.log(
      'managed_credentials created successfully.'
    );
  }

  // --------------------------------------------------
  // Final verification
  // --------------------------------------------------
  console.log('\n========================================');
  console.log('UPDATE COMPLETED SUCCESSFULLY');
  console.log('========================================');

  console.log(`User ID   : ${userId}`);
  console.log(`Old Email : ${OLD_EMAIL}`);
  console.log(`New Email : ${NEW_EMAIL}`);
  console.log(`Name      : Veronica`);
  console.log(`Role      : Manager`);
  console.log(`Team      : Supply Chain Team`);

  console.log('========================================');
  console.log('IMPORTANT: Existing UUID was preserved.');
  console.log('========================================\n');
}

updateVeronica().catch(error => {
  console.error('\nUnexpected error:', error);
  process.exit(1);
});