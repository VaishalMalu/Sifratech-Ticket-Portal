require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const { data: usersData, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return;
  }
  
  console.log(`Found ${usersData.users.length} users. Updating passwords...`);
  
  for (const user of usersData.users) {
    const newPassword = user.email === 'account_manager@sifratc.com' ? 'SifraAM@2026' : 'Welcome@2026';
    
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
  console.log("All users updated successfully!");
}

main();
