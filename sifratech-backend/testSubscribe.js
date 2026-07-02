require('dotenv').config();
const { subscribeToSupportMailbox } = require('./src/services/GraphApiService');

async function testSubscribe() {
    console.log("Testing subscribe...");
    await subscribeToSupportMailbox();
}

testSubscribe();
