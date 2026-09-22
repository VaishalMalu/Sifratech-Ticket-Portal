require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function setupWebformTechnicalTeam() {
    console.log("Checking teams table...");
    const { data: teams } = await supabase.from('teams').select('*');
    console.log("Existing teams:", teams);

    let webformTeam = teams?.find(t => t.name?.toLowerCase().includes('webform'));

    if (!webformTeam) {
        console.log("Creating 'Webform Technical Team' in teams table...");
        const { data: newTeam, error: teamErr } = await supabase.from('teams').insert([{
            name: 'Webform Technical Team',
            description: 'Handles Webform, OIC, and Technical Report tickets'
        }]).select();

        if (teamErr) {
            console.error("Failed to create team:", teamErr);
            return;
        }
        webformTeam = newTeam[0];
        console.log("Created team:", webformTeam);
    }

    // Assign Webform-Technical module to this default_team_id
    console.log("Updating oracle_modules default_team_id for Webform-Technical...");
    const { error: modUpdateErr } = await supabase
        .from('oracle_modules')
        .update({ default_team_id: webformTeam.id })
        .ilike('name', 'Webform-Technical');

    if (modUpdateErr) {
        console.error("Error updating module:", modUpdateErr);
    } else {
        console.log("Successfully linked Webform-Technical module to team:", webformTeam.name);
    }

    // Link webformtechnicalteam@sifratc.com user to this team
    console.log("Linking webformtechnicalteam@sifratc.com user to team...");
    const { error: userUpdateErr } = await supabase
        .from('users')
        .update({ team_id: webformTeam.id })
        .eq('email', 'webformtechnicalteam@sifratc.com');

    if (userUpdateErr) {
        console.error("Error updating user team_id:", userUpdateErr);
    } else {
        console.log("Successfully assigned user webformtechnicalteam@sifratc.com to team:", webformTeam.name);
    }
}

setupWebformTechnicalTeam();
