require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function migrateModules() {
    console.log('Starting module migration...');

    // 1. Get IDs for SCM, Procurement, Inventory
    const { data: modules, error: modErr } = await supabase
        .from('oracle_modules')
        .select('id, name')
        .in('name', ['SCM', 'Procurement', 'Inventory']);

    if (modErr) {
        console.error('Error fetching modules:', modErr);
        return;
    }

    const scmMod = modules.find(m => m.name === 'SCM');
    const procMod = modules.find(m => m.name === 'Procurement');
    const invMod = modules.find(m => m.name === 'Inventory');

    if (!scmMod) {
        console.error('SCM module not found in database!');
        return;
    }

    const oldIds = [];
    if (procMod) oldIds.push(procMod.id);
    if (invMod) oldIds.push(invMod.id);

    if (oldIds.length > 0) {
        // 2. Update tickets
        console.log(`Updating tickets from Procurement/Inventory to SCM (ID: ${scmMod.id})...`);
        const { data: updateData, error: updateErr } = await supabase
            .from('tickets')
            .update({ oracle_module_id: scmMod.id })
            .in('oracle_module_id', oldIds)
            .select('id');

        if (updateErr) {
            console.error('Error updating tickets:', updateErr);
            return;
        }
        console.log(`Updated ${updateData.length} tickets to SCM.`);

        // 3. Delete Procurement and Inventory modules
        console.log('Deleting Procurement and Inventory modules...');
        const { error: delErr } = await supabase
            .from('oracle_modules')
            .delete()
            .in('id', oldIds);

        if (delErr) {
            console.error('Error deleting modules:', delErr);
        } else {
            console.log('Deleted legacy modules successfully.');
        }
    } else {
        console.log('Procurement and Inventory modules not found, might be already deleted.');
    }
    
    console.log('Migration completed.');
}

migrateModules();
