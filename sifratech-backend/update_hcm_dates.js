const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseKey = '';
lines.forEach(line => {
  if (line.startsWith('SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

function excelDateToJSDate(serial) {
  if (!serial) return null;
  if (typeof serial !== 'number') {
    const parsed = new Date(serial);
    if (!isNaN(parsed)) return parsed.toISOString();
    return null;
  }
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  if (isNaN(date_info)) return null;
  return date_info.toISOString();
}

async function run() {
  const workbook = xlsx.readFile('e:\\AI TIcket ERP\\knowledge base\\ASM Issue Tracker Latest.xlsx');
  const sheetName = 'HCM';
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
      console.error("HCM sheet not found!");
      return;
  }
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const headers = data[0];
  const tktIdx = headers.indexOf('Ticket #');
  const raisedDateIdx = headers.indexOf('Date Issue Raised');
  const closureDateIdx = headers.indexOf('Issue Closure Date');
  const statusIdx = headers.indexOf('Status');

  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const ticketNo = row[tktIdx];
    if (ticketNo) {
        const raisedDateSerial = row[raisedDateIdx];
        const closureDateSerial = row[closureDateIdx];
        const status = row[statusIdx];
        
        const updates = {};
        if (raisedDateSerial) {
           updates.created_at = excelDateToJSDate(raisedDateSerial);
        }
        if (closureDateSerial) {
           updates.closed_at = excelDateToJSDate(closureDateSerial);
        }
        
        if (Object.keys(updates).length > 0) {
            console.log(`Updating ${ticketNo}:`, updates);
            const { error } = await supabase.from('tickets').update(updates).eq('ticket_number', ticketNo);
            if (error) {
                console.error(`Error updating ${ticketNo}:`, error);
            } else {
                updatedCount++;
            }
        }
    }
  }

  console.log(`Updated dates for ${updatedCount} HCM tickets.`);
}

run();
