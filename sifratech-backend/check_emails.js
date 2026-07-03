require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkEmails() {
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, title, email_address');
        
    console.log("Tickets in DB:", tickets);
}
checkEmails();
