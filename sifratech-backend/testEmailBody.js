require('dotenv').config();
const { getGraphClient } = require('./src/config/graphClient');
const { parseEmailBody } = require('./src/services/EmailParserService');

async function testFetch() {
    try {
        const client = getGraphClient();
        const messages = await client.api(`users/${process.env.MS_GRAPH_MAILBOX}/mailFolders('Inbox')/messages`)
            .select('id,subject,bodyPreview,body,from')
            .top(20)
            .get();
            
        const email = messages.value.find(m => m.subject.includes('Vaishal Ticket Testing'));
            
        if (email) {
            console.log('--- RAW HTML BODY ---');
            console.log(email.body.content);
            console.log('\n--- CLEANED BODY ---');
            
            const cleanHtml = (html) => {
                if (!html) return '';
                return html.replace(/<br\s*\/?>/gi, '\n')
                           .replace(/<\/div>/gi, '\n')
                           .replace(/<\/p>/gi, '\n')
                           .replace(/<[^>]+>/g, '') 
                           .replace(/&nbsp;/g, ' ')
                           .replace(/\r\n/g, '\n');
            };
            
            const cleaned = cleanHtml(email.body.content);
            console.log(cleaned);
            
            console.log('\n--- PARSED DATA ---');
            console.log(parseEmailBody(cleaned));
        } else {
            console.log('Email not found.');
        }
    } catch(err) {
        console.error(err);
    }
}
testFetch();
