const xlsx = require('xlsx');

const wb = xlsx.readFile('e:\\AI TIcket ERP\\knowledge base\\ASM Support Mail IDs List_Sifratc.com.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

console.log("ASM Support Mail IDs List columns:");
if (rows.length > 0) {
    console.log(Object.keys(rows[0]));
    console.log("First row:", rows[0]);
    console.log(rows.slice(0, 5));
}
