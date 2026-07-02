require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function checkTickets() {
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
    if (error) {
        console.error('Error fetching tickets:', error);
    } else {
        console.log('Recent Tickets:');
        data.forEach(t => console.log(`- [${t.created_at}] ${t.title} (${t.email_address}) [Module: ${t.oracle_module_id}]`));
    }
}

checkTickets();
