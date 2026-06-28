const { getGraphClient } = require('../config/graphClient');
const { supabase } = require('../config/supabaseClient');

// Subscribe to new emails in the support mailbox
const subscribeToSupportMailbox = async () => {
    try {
        const client = getGraphClient();
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
const sendEmail = async (toEmail, subject, bodyContent) => {
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
        await client.api(`users/${process.env.MS_GRAPH_MAILBOX}/sendMail`).post(message);
        console.log(`Sent email to ${toEmail}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    subscribeToSupportMailbox,
    fetchUnreadEmails,
    markEmailAsRead,
    sendEmailReply,
    sendEmail
};
