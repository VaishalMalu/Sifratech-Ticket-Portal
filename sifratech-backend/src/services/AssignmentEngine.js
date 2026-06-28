const { supabase } = require('../config/supabaseClient');

// Assign a ticket to the appropriate team and engineer
const assignTicket = async (ticketId, oracleModuleName) => {
    try {
        // 1. Find the module and its default team
        let { data: moduleData } = await supabase
            .from('oracle_modules')
            .select('id, default_team_id')
            .ilike('name', oracleModuleName)
            .single();

        if (!moduleData) {
            console.warn(`Module ${oracleModuleName} not found. Attempting fallback to Triage team.`);
            // Fallback to Triage
            const { data: fallbackTeam } = await supabase
                .from('teams')
                .select('id')
                .or('name.ilike.Triage,name.ilike.%Support%')
                .limit(1)
                .maybeSingle();
                
            if (!fallbackTeam) {
                console.warn(`No fallback Triage team found. Leaving unassigned.`);
                return null;
            }
            moduleData = { default_team_id: fallbackTeam.id };
        }

        const teamId = moduleData.default_team_id;

        // 2. Find engineers in this team
        const { data: engineers } = await supabase
            .from('users')
            .select('id')
            .eq('team_id', teamId)
            .eq('is_active', true);

        if (!engineers || engineers.length === 0) {
            console.warn(`No active engineers found for team ${teamId}.`);
            return { team_id: teamId, assigned_to: null };
        }

        // 3. Load balancing: find the engineer with the least open tickets
        let selectedEngineer = engineers[0].id;
        let minTickets = Infinity;

        for (const engineer of engineers) {
            const { count } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', engineer.id)
                .not('status', 'in', '("Resolved", "Closed", "Cancelled")');
            
            if (count < minTickets) {
                minTickets = count;
                selectedEngineer = engineer.id;
            }
        }

        // 4. Update the ticket
        await supabase
            .from('tickets')
            .update({ 
                assigned_team_id: teamId, 
                assigned_to: selectedEngineer,
                status: 'Pending Approval'
            })
            .eq('id', ticketId);

        console.log(`Ticket ${ticketId} assigned to team ${teamId} and engineer ${selectedEngineer}`);
        
        return { team_id: teamId, assigned_to: selectedEngineer };

    } catch (error) {
        console.error('Error auto-assigning ticket:', error);
        return null;
    }
};

module.exports = { assignTicket };
