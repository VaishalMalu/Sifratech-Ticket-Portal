require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

async function addWebformTechnicalModule() {
    console.log("Checking if Webform-Technical module exists...");
    const { data: existing, error: fetchErr } = await supabase
        .from('oracle_modules')
        .select('*')
        .ilike('name', 'Webform-Technical');

    if (fetchErr) {
        console.error("Error fetching modules:", fetchErr);
        process.exit(1);
    }

    if (existing && existing.length > 0) {
        console.log("Webform-Technical module already exists:", existing[0]);
    } else {
        console.log("Inserting Webform-Technical module into database...");
        const { data: inserted, error: insertErr } = await supabase
            .from('oracle_modules')
            .insert([{ name: 'Webform-Technical' }])
            .select();

        if (insertErr) {
            console.error("Failed to insert module:", insertErr);
            process.exit(1);
        } else {
            console.log("Successfully created Webform-Technical module:", inserted);
        }
    }
}

addWebformTechnicalModule();
