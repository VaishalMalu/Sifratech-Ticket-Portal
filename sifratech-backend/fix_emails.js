require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixEmails() {
    console.log("Fetching tickets with null email_address...");
    const { data: tickets, error: ticketErr } = await supabase
        .from('tickets')
        .select('id, customer_name, created_by')
        .is('email_address', null);
        
    if (ticketErr) {
        console.error("Error fetching tickets:", ticketErr);
        return;
    }
    
    console.log(`Found ${tickets.length} tickets with no email. Fetching users to map...`);
    
    const { data: users, error: userErr } = await supabase
        .from('users')
        .select('id, full_name, email');
        
    if (userErr) {
        console.error("Error fetching users:", userErr);
        return;
    }
    
    let updatedCount = 0;
    
    for (const t of tickets) {
        let matchingUser = null;
        
        // Try matching by customer_name (full_name in users)
        if (t.customer_name) {
            matchingUser = users.find(u => u.full_name === t.customer_name);
        }
        
        // If not found, try matching by created_by (UUID in users)
        if (!matchingUser && t.created_by) {
            matchingUser = users.find(u => u.id === t.created_by);
        }
        
        if (matchingUser && matchingUser.email) {
            const { error: updErr } = await supabase
                .from('tickets')
                .update({ email_address: matchingUser.email })
                .eq('id', t.id);
                
            if (updErr) {
                console.error(`Error updating ticket ${t.id}:`, updErr);
            } else {
                updatedCount++;
                console.log(`Updated ticket ${t.id} with email ${matchingUser.email}`);
            }
        }
    }
    
    console.log(`Successfully updated ${updatedCount} tickets with emails.`);
}

fixEmails();
