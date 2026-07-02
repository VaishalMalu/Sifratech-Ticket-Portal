require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fixModules() {
    console.log("Fetching PPM module id...");
    const { data: modules, error: modErr } = await supabase
        .from('oracle_modules')
        .select('id, name')
        .ilike('name', 'PPM');
        
    if (modErr) {
        console.error("Error fetching modules:", modErr);
        return;
    }
    
    let ppmId = null;
    if (modules && modules.length > 0) {
        ppmId = modules[0].id;
        console.log(`Found PPM module ID: ${ppmId}`);
    } else {
        console.log("PPM module not found, creating it...");
        const { data: newMod, error: insertErr } = await supabase
            .from('oracle_modules')
            .insert([{ name: 'PPM' }])
            .select();
            
        if (insertErr) {
            console.error("Failed to create PPM module:", insertErr);
            return;
        }
        ppmId = newMod[0].id;
        console.log(`Created PPM module ID: ${ppmId}`);
    }

    console.log("Updating tickets with null oracle_module_id to PPM...");
    const { data: updatedTickets, error: updErr } = await supabase
        .from('tickets')
        .update({ oracle_module_id: ppmId })
        .is('oracle_module_id', null)
        .select('id, ticket_number');
        
    if (updErr) {
        console.error("Error updating tickets:", updErr);
    } else {
        console.log(`Successfully updated ${updatedTickets ? updatedTickets.length : 0} tickets to PPM.`);
    }
}

fixModules();
