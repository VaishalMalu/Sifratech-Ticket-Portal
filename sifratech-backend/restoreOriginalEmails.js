require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function restoreOriginalEmails() {
    console.log('Fetching tickets with dummy emails...');
    const { data: tickets, error: fetchErr } = await supabase
        .from('tickets')
        .select('id, customer_name, email_address')
        .in('email_address', ['account_manager@sifratc.com', 'test@sifratc.com']);

    if (fetchErr) {
        console.error('Error fetching tickets:', fetchErr);
        return;
    }

    let updatedCount = 0;

    for (const ticket of tickets) {
        // If the customer_name is genuinely account_manager, leave it. Otherwise, it's a dummy fallback.
        const name = (ticket.customer_name || '').toLowerCase();
        if (!name.includes('account_manager') && !name.includes('account manager') && !name.includes('test')) {
            const { error: updateErr } = await supabase
                .from('tickets')
                .update({ email_address: null })
                .eq('id', ticket.id);
                
            if (!updateErr) {
                updatedCount++;
            } else {
                console.error(`Error updating ticket ${ticket.id}:`, updateErr);
            }
        }
    }
    
    console.log(`Successfully restored ${updatedCount} tickets to have blank (original) emails instead of dummy placeholders.`);
}

restoreOriginalEmails();
