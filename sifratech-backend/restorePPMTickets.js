require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function restorePPMTickets() {
    console.log('Fetching all PPM tickets...');
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, ticket_number, status, oracle_modules!inner(name)')
        .ilike('oracle_modules.name', '%PPM%');

    if (error) {
        console.error('Error fetching tickets:', error);
        return;
    }

    // fetch the ppmteam user
    const { data: users } = await supabase.from('users').select('id, full_name');
    const userMap = {};
    users.forEach(u => userMap[u.full_name.toLowerCase()] = u.id);

    let updatedCount = 0;

    for (const ticket of tickets) {
        // Find the latest status history entry that is not 'Any' (which means comment)
        const { data: history, error: histErr } = await supabase
            .from('ticket_status_history')
            .select('*')
            .eq('ticket_id', ticket.id)
            .neq('new_status', 'Any')
            .order('created_at', { ascending: false })
            .limit(1);

        if (!histErr && history && history.length > 0) {
            const latestStatus = history[0].new_status;
            let byUser = null;
            
            // Extract user from comment if possible: "[ppmteam] Status updated to Resolved"
            const match = history[0].comments.match(/\[(.*?)\]/);
            if (match && match[1]) {
                const userName = match[1].toLowerCase();
                if (userMap[userName]) {
                    byUser = userMap[userName];
                }
            }

            console.log(`Ticket ${ticket.ticket_number}: Restoring to status '${latestStatus}' and assignee '${byUser}'`);

            const updatePayload = { status: latestStatus };
            if (byUser) {
                updatePayload.assigned_to = byUser;
            }

            // Also set resolved_at / closed_at if applicable
            if (latestStatus === 'Resolved') {
                updatePayload.resolved_at = history[0].created_at;
                updatePayload.resolved_by = byUser; // resolved_by is actually string or uuid in DB? It's string usually in this app
            } else if (latestStatus === 'Closed') {
                updatePayload.closed_at = history[0].created_at;
                updatePayload.closed_by = byUser;
            }

            const { error: updateErr } = await supabase
                .from('tickets')
                .update(updatePayload)
                .eq('id', ticket.id);
                
            if (!updateErr) {
                updatedCount++;
            } else {
                console.error(`Error updating ticket ${ticket.id}:`, updateErr);
            }
        }
    }
    
    console.log(`Successfully restored ${updatedCount} PPM tickets to their last known status.`);
}

restorePPMTickets();
