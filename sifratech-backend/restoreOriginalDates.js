require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function restoreOriginalDates() {
    console.log('Fetching tickets and their history...');
    
    // Fetch all tickets
    const { data: tickets, error: fetchErr } = await supabase
        .from('tickets')
        .select('id, created_at, ticket_number');

    if (fetchErr) {
        console.error('Error fetching tickets:', fetchErr);
        return;
    }

    let updatedCount = 0;

    for (const ticket of tickets) {
        // Find the earliest status history entry for this ticket
        const { data: history, error: histErr } = await supabase
            .from('ticket_status_history')
            .select('created_at')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true })
            .limit(1);

        if (!histErr && history && history.length > 0) {
            const originalDate = history[0].created_at;
            
            // Only update if it's different from the current created_at (ignoring milliseconds maybe, or just update directly)
            const { error: updateErr } = await supabase
                .from('tickets')
                .update({ created_at: originalDate })
                .eq('id', ticket.id);
                
            if (!updateErr) {
                updatedCount++;
            } else {
                console.error(`Error updating ticket ${ticket.id}:`, updateErr);
            }
        } else {
            console.log(`No history found for ticket ${ticket.ticket_number}`);
        }
    }
    
    console.log(`Successfully restored original created_at dates for ${updatedCount} tickets based on their status history.`);
}

restoreOriginalDates();
