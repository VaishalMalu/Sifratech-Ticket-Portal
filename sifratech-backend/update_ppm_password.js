require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const emailToUpdate = 'ppmteam@sifratc.com';
  const newPassword = 'Glory@2026';

  const { data: usersData, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return;
  }
  
  const user = usersData.users.find(u => u.email === emailToUpdate);
  
  if (!user) {
    console.error(`User with email ${emailToUpdate} not found.`);
    return;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );
  
  if (updateError) {
    console.error(`Failed to update password for ${user.email}:`, updateError);
  } else {
    console.log(`Successfully reset password for ${user.email} to ${newPassword}`);
  }
}

main();
