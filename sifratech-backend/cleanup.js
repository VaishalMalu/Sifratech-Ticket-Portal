require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function cleanupOldTickets() {
    console.log('Cleaning up accidental tickets from the database...');
    
    // We will delete tickets that were inserted before the privacy check
    // Most of them couldn't find an oracle_module and defaulted to null
    const { data, error } = await supabase
        .from('tickets')
        .delete()
        .is('oracle_module_id', null)
        .eq('ticket_type', 'Email Inquiry');

    if (error) {
        console.error('Error during cleanup:', error);
    } else {
        console.log('Successfully cleaned up old non-template emails from the dashboard.');
    }
}

cleanupOldTickets();
