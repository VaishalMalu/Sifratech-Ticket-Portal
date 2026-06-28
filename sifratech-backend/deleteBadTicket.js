require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function deleteTicket() {
    // Delete the bad ticket created due to truncation
    const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('title', 'Purchase Order Creation Failed');
    
    if (error) console.error(error);
    else console.log('Deleted bad ticket');
}

deleteTicket();
