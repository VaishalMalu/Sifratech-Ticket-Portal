require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkQuery() {
    const { data, error } = await supabase.from('tickets').select(`
        id,
        assignee:users!assigned_to ( full_name )
    `).limit(1);
    
    if (error) console.error(error);
    console.log(JSON.stringify(data, null, 2));
}

checkQuery();
