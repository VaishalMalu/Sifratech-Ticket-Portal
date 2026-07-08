require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function setDatesToToday() {
    console.log('Fetching all tickets...');
    const { data: tickets, error: fetchErr } = await supabase
        .from('tickets')
        .select('id, created_at, ticket_number')
        .order('id');

    if (fetchErr) {
        console.error('Error fetching tickets:', fetchErr);
        return;
    }

    let updatedCount = 0;
    const now = Date.now();
    
    // We will space them out over the last 12 hours so they don't all have the exact same second
    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        // randomize between 0 and 12 hours ago
        const hoursAgo = Math.random() * 12;
        const newDate = new Date(now - (hoursAgo * 60 * 60 * 1000));
        
        const { error: updateErr } = await supabase
            .from('tickets')
            .update({ created_at: newDate.toISOString() })
            .eq('id', ticket.id);
        
        if (updateErr) {
            console.error(`Error updating ticket ${ticket.id}:`, updateErr);
        } else {
            updatedCount++;
        }
    }
    
    console.log(`Successfully updated ${updatedCount} tickets with today's date.`);
}

setDatesToToday();
