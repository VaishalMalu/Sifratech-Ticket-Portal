require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testUpdate() {
    const id = '02e2f18e-9894-4618-86c2-bc6258e9c11c';
    
    // update
    const { data: updData, error: updErr } = await supabase
        .from('tickets')
        .update({ email_address: 'test@sifratc.com' })
        .eq('id', id)
        .select();
        
    console.log("Update Error:", updErr);
    console.log("Update Result:", updData);
}
testUpdate();
