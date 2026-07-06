const { getGraphClient } = require('../config/graphClient');
const { supabase } = require('../config/supabaseClient');

// Subscribe to new emails in the support mailbox
const subscribeToSupportMailbox = async () => {
    try {
        const client = getGraphClient();
        
        // 1. Fetch existing subscriptions and delete ones matching our webhook URL to prevent duplicates
        try {
            const existingSubs = await client.api('/subscriptions').get();
            if (existingSubs && existingSubs.value) {
                for (const sub of existingSubs.value) {
                    if (sub.notificationUrl === process.env.WEBHOOK_URL) {
                        await client.api(`/subscriptions/${sub.id}`).delete();
                        console.log(`Deleted existing duplicate subscription: ${sub.id}`);
                    }
                }
            }
        } catch (err) {
            console.warn('Could not fetch/delete existing subscriptions. Continuing...', err.message);
        }

        // 2. Create the new subscription
        const subscription = {
            changeType: 'created',
            notificationUrl: process.env.WEBHOOK_URL, // e.g. https://your-domain.com/api/webhooks/outlook
            resource: `users/${process.env.MS_GRAPH_MAILBOX}/mailFolders('Inbox')/messages`,
            expirationDateTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours max for mail
            clientState: 'sifratech-secret-state'
        };

        const response = await client.api('/subscriptions').post(subscription);
        console.log('Successfully subscribed to support mailbox:', response.id);
        return response;
    } catch (error) {
        console.error('Error subscribing to mailbox:', error);
    }
};

// Fetch unread emails
const fetchUnreadEmails = async () => {
    try {
        const client = getGraphClient();
        const messages = await client.api(`users/${process.env.MS_GRAPH_MAILBOX}/mailFolders('Inbox')/messages`)
            .filter('isRead eq false')
            .select('id,conversationId,subject,bodyPreview,body,from,hasAttachments,receivedDateTime')
            .top(50)
            .get();
        return messages.value;
    } catch (error) {
        console.error('Error fetching unread emails:', error);
        return [];
    }
};

// Fetch email attachments
const fetchEmailAttachments = async (messageId) => {
    try {
        const client = getGraphClient();
        const attachments = await client.api(`users/${process.env.MS_GRAPH_MAILBOX}/messages/${messageId}/attachments`).get();
        return attachments.value;
    } catch (error) {
        console.error(`Error fetching attachments for email ${messageId}:`, error);
        return [];
    }
};

// Mark email as read
const markEmailAsRead = async (messageId) => {
    try {
        const client = getGraphClient();
        await client.api(`users/${process.env.MS_GRAPH_MAILBOX}/messages/${messageId}`)
            .patch({ isRead: true });
    } catch (error) {
        console.error(`Error marking email ${messageId} as read:`, error);
    }
};

// Send an email reply
const sendEmailReply = async (conversationId, messageId, toEmail, subject, bodyContent) => {
    try {
        const client = getGraphClient();
        const reply = {
            message: {
                toRecipients: [{ emailAddress: { address: toEmail } }],
                subject: subject,
                body: { contentType: 'HTML', content: bodyContent }
            }
        };
        await client.api(`users/${process.env.MS_GRAPH_MAILBOX}/messages/${messageId}/reply`).post(reply);
        console.log(`Sent reply to ${toEmail} for conversation ${conversationId}`);
    } catch (error) {
        console.error('Error sending email reply:', error);
    }
};

// Send a new email
const sendEmail = async (toEmail, subject, bodyContent, ccEmail = null) => {
    try {
        const client = getGraphClient();
        const message = {
            message: {
                toRecipients: [{ emailAddress: { address: toEmail } }],
                subject: subject,
                body: { contentType: 'HTML', content: bodyContent }
            },
            saveToSentItems: true
        };
        
        if (ccEmail) {
            message.message.ccRecipients = [{ emailAddress: { address: ccEmail } }];
        }
        
        await client.api(`users/${process.env.MS_GRAPH_MAILBOX}/sendMail`).post(message);
        console.log(`Sent email to ${toEmail}${ccEmail ? ` (CC: ${ccEmail})` : ''}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    subscribeToSupportMailbox,
    fetchUnreadEmails,
    fetchEmailAttachments,
    markEmailAsRead,
    sendEmailReply,
    sendEmail
};
