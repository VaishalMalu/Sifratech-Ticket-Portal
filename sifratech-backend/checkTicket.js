require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function checkTicket() {
    const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (error) console.error(error);
    else console.log(JSON.stringify(data[0], null, 2));
}

checkTicket();
