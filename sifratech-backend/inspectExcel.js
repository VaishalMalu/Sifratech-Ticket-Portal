const xlsx = require('xlsx');

const wb = xlsx.readFile('e:\\AI TIcket ERP\\knowledge base\\Sample Ticket Data ASM.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

console.log("Sample Ticket Data ASM.xlsx columns:");
if (rows.length > 0) {
    console.log(Object.keys(rows[0]));
    console.log("First row:", rows[0]);
}

const wb2 = xlsx.readFile('e:\\AI TIcket ERP\\knowledge base\\Tickets_Export.xlsx');
const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
const rows2 = xlsx.utils.sheet_to_json(sheet2);

console.log("\nTickets_Export.xlsx columns:");
if (rows2.length > 0) {
    console.log(Object.keys(rows2[0]));
    console.log("First row:", rows2[0]);
}
