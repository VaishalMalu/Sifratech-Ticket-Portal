require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function updateTickets() {
    const ticketNumbers = ['TKT-2026-620131', 'TKT-2026-573275'];
    
    // Find or create 'SCM Team' in teams table
    let teamId = null;
    const { data: teams, error: teamErr } = await supabase.from('teams').select('*').ilike('name', 'SCM Team');
    if (teams && teams.length > 0) {
        teamId = teams[0].id;
    } else {
        const { data: newTeam } = await supabase.from('teams').insert([{ name: 'SCM Team' }]).select();
        if (newTeam && newTeam.length > 0) {
            teamId = newTeam[0].id;
        }
    }
    
    // Update the tickets
    const { data, error } = await supabase
        .from('tickets')
        .update({ 
            company: 'ASM Project',
            customer_name: 'Venkat',
            assigned_team_id: teamId
        })
        .in('ticket_number', ticketNumbers)
        .select();
        
    if (error) {
        console.error('Error updating tickets:', error);
    } else {
        console.log('Successfully updated tickets:');
        data.forEach(t => console.log(`- ${t.ticket_number} (Company: ${t.company}, Raised by: ${t.customer_name})`));
    }
}

updateTickets();
