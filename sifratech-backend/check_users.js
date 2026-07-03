require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, email');
        
    console.log("Users in DB:", users);
}
checkUsers();
