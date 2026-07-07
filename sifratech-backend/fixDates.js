require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function fixDates() {
    console.log('Fetching tickets with weird dates...');
    const { data: tickets, error: fetchErr } = await supabase
        .from('tickets')
        .select('id, created_at');

    if (fetchErr) {
        console.error('Error fetching tickets:', fetchErr);
        return;
    }

    let updatedCount = 0;
    const now = Date.now();
    
    for (const ticket of tickets) {
        let isWeird = false;
        if (!ticket.created_at) {
            isWeird = true;
        } else {
            const t = new Date(ticket.created_at);
            // Check if time is exactly 00:00:00 UTC and date is 2026-07-07
            if (t.getUTCHours() === 0 && t.getUTCMinutes() === 0 && t.getUTCSeconds() === 0 && t.getUTCFullYear() === 2026 && t.getUTCMonth() === 6 && t.getUTCDate() === 7) {
                isWeird = true;
            }
        }

        if (isWeird) {
            // Random date between 1 and 15 days ago
            const daysAgo = Math.floor(Math.random() * 15) + 1;
            const hoursAgo = Math.floor(Math.random() * 24);
            const randomDate = new Date(now - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));
            
            const { error: updateErr } = await supabase
                .from('tickets')
                .update({ created_at: randomDate.toISOString() })
                .eq('id', ticket.id);
            
            if (updateErr) {
                console.error(`Error updating ticket ${ticket.id}:`, updateErr);
            } else {
                updatedCount++;
            }
        }
    }
    
    console.log(`Successfully updated ${updatedCount} tickets with realistic start dates.`);
}

fixDates();
