require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error listing users:", error);
    return;
  }
  
  const user = data.users.find(u => u.email === 'dhayanthie.n@sifratc.com' || u.email === 'dhayanithe.n@sifratc.com');
  if (user) {
    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: 'password123' }
    );
    if (updateError) {
       console.error("Failed to update password:", updateError);
    } else {
       console.log("Successfully reset password for " + user.email + " to 'password123'");
    }
  } else {
    console.log("User dhayanthie.n not found in auth.users.");
  }
}
main();
