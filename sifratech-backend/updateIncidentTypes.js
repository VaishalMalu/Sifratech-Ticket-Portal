require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function updateIncidentTypes() {
    console.log('Clearing old incident types...');
    // We can't use .neq('id', null) easily without a filter. Let's just select all ids and delete.
    const { data: allTypes } = await supabase.from('incident_types').select('id');
    if (allTypes && allTypes.length > 0) {
        const ids = allTypes.map(t => t.id);
        const { error: deleteError } = await supabase.from('incident_types').delete().in('id', ids);
        if (deleteError) {
            console.error('Error deleting:', deleteError);
            return;
        }
    }

    const newTypes = [
        { name: 'Access Issue' },
        { name: 'Bug' },
        { name: 'Data Entry Issue' },
        { name: 'Enhancements' },
        { name: 'New Requirements' },
        { name: 'Operational Issue' },
        { name: 'Webform Issue' },
        { name: 'Standard Functionality' },
        { name: 'Training' }
    ];

    console.log('Inserting new incident types...');
    const { error: insertError } = await supabase.from('incident_types').insert(newTypes);

    if (insertError) {
        console.error('Error inserting:', insertError);
    } else {
        console.log('Successfully updated incident types in DB.');
    }
}

updateIncidentTypes();
