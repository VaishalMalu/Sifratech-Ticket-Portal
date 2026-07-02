require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixDates() {
    console.log("Fetching tickets with status Closed or Resolved without closed_at/resolved_at...");
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`id, status, created_at, resolved_at, closed_at`)
        .in('status', ['Closed', 'Resolved']);
        
    if (error) {
        console.error("Error fetching tickets:", error);
        return;
    }
    
    console.log(`Found ${tickets.length} closed/resolved tickets.`);
    let updatedCount = 0;
    
    for (const t of tickets) {
        if (!t.resolved_at && !t.closed_at) {
            // Find the history entry when it was closed/resolved
            const { data: history, error: histErr } = await supabase
                .from('ticket_status_history')
                .select('created_at, new_status')
                .eq('ticket_id', t.id)
                .in('new_status', ['Resolved', 'Closed'])
                .order('created_at', { ascending: false })
                .limit(1);
                
            let resolveDate = null;
            if (history && history.length > 0) {
                resolveDate = history[0].created_at;
            } else {
                resolveDate = new Date().toISOString(); // fallback
            }
            
            const updateData = {};
            if (t.status === 'Resolved') {
                updateData.resolved_at = resolveDate;
            } else if (t.status === 'Closed') {
                updateData.resolved_at = resolveDate;
                updateData.closed_at = resolveDate;
            }
            
            const { error: updErr } = await supabase
                .from('tickets')
                .update(updateData)
                .eq('id', t.id);
                
            if (updErr) {
                console.error(`Failed to update ${t.id}:`, updErr);
            } else {
                updatedCount++;
                console.log(`Updated ticket ${t.id} with dates: ${JSON.stringify(updateData)}`);
            }
        }
    }
    
    console.log(`Done. Updated ${updatedCount} tickets.`);
}

fixDates();
