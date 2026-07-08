require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function checkPPMTickets() {
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            id, ticket_number, status, assigned_to, 
            oracle_modules!inner(name),
            users:assigned_to(full_name)
        `)
        .ilike('oracle_modules.name', '%PPM%');

    if (error) {
        console.error('Error fetching tickets:', error);
        return;
    }

    console.log(`Found ${tickets.length} PPM tickets:`);
    tickets.forEach(t => {
        console.log(`- ${t.ticket_number}: Status=${t.status}, AssignedTo=${t.users ? t.users.full_name : 'Unassigned'} (ID: ${t.assigned_to})`);
    });
}

checkPPMTickets();
