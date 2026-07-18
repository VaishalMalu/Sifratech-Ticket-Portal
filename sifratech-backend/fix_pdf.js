const { getGraphClient } = require('./src/config/graphClient');
const { supabase } = require('./src/config/supabaseClient');
require('dotenv').config();

async function fixTicket() {
    const ticketNum = 'INV-2026-7842';
    const { data: tickets } = await supabase.from('tickets').select('*').ilike('description', `%${ticketNum}%`).limit(1);
    if (!tickets || tickets.length === 0) { console.log('Ticket not found'); return; }
    
    const ticket = tickets[0];
    
    const client = getGraphClient();
    const res = await client.api('users/' + process.env.MS_GRAPH_MAILBOX + '/mailFolders(\'Inbox\')/messages')
        .select('id,subject,hasAttachments')
        .top(10)
        .get();
        
    const msg = res.value.find(m => m.subject && (m.subject.includes(ticketNum) || m.subject.includes('Workflow Stuck')));
    if (!msg) { console.log('Email not found'); return; }
    
    const atts = await client.api('users/' + process.env.MS_GRAPH_MAILBOX + '/messages/' + msg.id + '/attachments').get();
    
    let attachmentLinks = [];
    for (const att of atts.value) {
        if (att['@odata.type'] === '#microsoft.graph.fileAttachment' && att.name.includes('.pdf')) {
            console.log('Found PDF:', att.name);
            const safeName = att.name.replace(/[^\w\.\-\s]/g, '_');
            const buffer = Buffer.from(att.contentBytes, 'base64');
            const path = `${ticket.id}/${Date.now()}_${safeName}`;
            
            // Try with ArrayBuffer to prevent fetch failed
            const arrayBuffer = new Uint8Array(buffer).buffer;
            
            const { data, error } = await supabase.storage.from('ticket-attachments').upload(path, arrayBuffer, { contentType: att.contentType });
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(data.path);
                attachmentLinks.push(`[Attachment: ${safeName}](${publicUrl})`);
                console.log('Uploaded successfully', publicUrl);
            } else {
                console.log('Upload error', error);
            }
        }
    }
    
    if (attachmentLinks.length > 0) {
        const newDesc = ticket.description + '\n' + attachmentLinks.join('\n');
        await supabase.from('tickets').update({ description: newDesc }).eq('id', ticket.id);
        console.log('Ticket updated');
    }
}
fixTicket();
