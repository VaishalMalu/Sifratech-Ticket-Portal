require('dotenv').config();
const { supabase } = require('./src/config/supabaseClient');

const updates = {
  'TKT-2026-703740': 'Murugan',
  'TKT-2026-800891': 'Raheel'
};

async function updateRaisedBy() {
  console.log('Starting Raised By updates for remaining tickets...');
  for (const [ticketNumber, raisedBy] of Object.entries(updates)) {
    const { error } = await supabase
      .from('tickets')
      .update({ customer_name: raisedBy })
      .eq('ticket_number', ticketNumber);

    if (error) {
      console.error(`Error updating ticket ${ticketNumber}:`, error);
    } else {
      console.log(`Updated ${ticketNumber} raised_by to ${raisedBy}`);
    }
  }
  console.log('Update complete.');
}

updateRaisedBy();
