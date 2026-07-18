const xlsx = require('xlsx');
const workbook = xlsx.readFile('e:\\AI TIcket ERP\\knowledge base\\ASM Issue Tracker Latest.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:", data[0]);
console.log("First 5 data rows:", data.slice(1, 6));
