require('dotenv').config();
const { fetchUnreadEmails } = require('./src/services/GraphApiService');

async function testGraph() {
    try {
        console.log(`Testing Graph API connection for mailbox: ${process.env.MS_GRAPH_MAILBOX}...`);
        const emails = await fetchUnreadEmails();
        console.log(`Successfully fetched ${emails.length} unread emails.`);
        if (emails.length > 0) {
            console.log('First email subject:', emails[0].subject);
        } else {
            console.log('No unread emails found, but connection was successful!');
        }
    } catch (error) {
        console.error('Failed to connect to Graph API or fetch emails:', error);
    }
}

testGraph();
