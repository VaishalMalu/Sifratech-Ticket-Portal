require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function restoreAllTickets() {
    console.log('Fetching all tickets...');
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, ticket_number, status, assigned_to');

    if (error) {
        console.error('Error fetching tickets:', error);
        return;
    }

    // fetch all users to map names from comments
    const { data: users } = await supabase.from('users').select('id, full_name');
    const userMap = {};
    users.forEach(u => {
        if (u.full_name) userMap[u.full_name.toLowerCase()] = u.id;
    });

    let updatedCount = 0;

    for (const ticket of tickets) {
        // Find the latest status history entry that is not 'Any' (which means comment)
        // Wait, sometimes a user might have just commented. We want the latest STATUS update.
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
            
            // Extract user from comment if possible: "[technicalteam] Status updated to Awaiting Customer"
            const match = history[0].comments.match(/\[(.*?)\]/);
            if (match && match[1]) {
                const userName = match[1].toLowerCase();
                if (userMap[userName]) {
                    byUser = userMap[userName];
                }
            }

            // Only update if current status is 'Open' and assignee is null, or if it doesn't match the latest known state
            if (ticket.status !== latestStatus || ticket.assigned_to !== byUser) {
                const updatePayload = { status: latestStatus };
                
                // Only assign if we successfully extracted the user who updated it last, or leave as is if we couldn't
                if (byUser) {
                    updatePayload.assigned_to = byUser;
                }

                // Set resolved_at / closed_at if applicable
                if (latestStatus === 'Resolved') {
                    updatePayload.resolved_at = history[0].created_at;
                    updatePayload.resolved_by = byUser; 
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
                    console.log(`Ticket ${ticket.ticket_number}: Restored to status '${latestStatus}' and assignee '${byUser}'`);
                } else {
                    console.error(`Error updating ticket ${ticket.ticket_number}:`, updateErr);
                }
            }
        }
    }
    
    console.log(`Successfully restored ${updatedCount} tickets across all modules to their last known correct status & assignee.`);
}

restoreAllTickets();
