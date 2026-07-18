const { getGraphClient } = require('./src/config/graphClient');
require('dotenv').config();

getGraphClient().api('users/' + process.env.MS_GRAPH_MAILBOX + '/mailFolders(\'Inbox\')/messages')
    .select('id,subject,hasAttachments')
    .top(10)
    .get()
    .then(res => {
        const msg = res.value.find(m => m.subject && (m.subject.includes('INV-2026-7842') || m.subject.includes('Workflow Stuck')));
        if (msg) {
            getGraphClient().api('users/' + process.env.MS_GRAPH_MAILBOX + '/messages/' + msg.id + '/attachments').get().then(atts => {
                console.log(JSON.stringify(atts.value.map(a => ({name: a.name, type: a['@odata.type'], size: a.size})), null, 2));
            });
        } else {
            console.log('Email not found');
        }
    });
