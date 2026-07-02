require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { handleOutlookWebhook, processUnreadEmails } = require('./controllers/WebhookController');
const { subscribeToSupportMailbox } = require('./services/GraphApiService');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
const usersRoute = require('./routes/users');
app.use('/api/users', usersRoute);

app.get('/api/public/lookup', async (req, res) => {
    try {
        const { supabase } = require('./config/supabaseClient');
        const [u, o] = await Promise.all([
            supabase.from('users').select('id, full_name, email, roles(name), teams(name)'),
            supabase.from('oracle_modules').select('*')
        ]);
        res.json({ users: u.data || [], oracle_modules: o.data || [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public lookup data' });
    }
});

app.post('/api/webhooks/outlook', handleOutlookWebhook);

app.post('/api/emails/assign', authMiddleware, async (req, res) => {
    try {
        const { sendEmail } = require('./services/GraphApiService');
        const { toEmail, ticketNumber, title, priority, customerDetails, module, status, assignedBy, assignmentDate, slaDueDate, portalUrl, ticketUrl } = req.body;
        
        if (!toEmail) return res.status(400).json({ error: 'toEmail is required' });

        const subject = `New Ticket Assignment: ${ticketNumber} - ${title}`;
        
        const dateStr = new Date(assignmentDate).toLocaleString();
        const slaStr = new Date(slaDueDate).toLocaleString();

        const bodyContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1A5FA8; padding: 20px; text-align: center;">
                    <h2 style="color: white; margin: 0; font-size: 22px;">Ticket Assignment Notification</h2>
                </div>
                <div style="padding: 24px; background-color: #f8fafc; border-bottom: 1px solid #e1e8ed;">
                    <p style="margin-top: 0; font-size: 16px; color: #334155;">Hello,</p>
                    <p style="font-size: 15px; color: #334155; line-height: 1.6;">You have been assigned to a new support ticket by <strong>${assignedBy}</strong>. Please review the details below and proceed with the necessary actions.</p>
                </div>
                <div style="padding: 24px; background-color: white;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; width: 40%; color: #64748b; font-size: 13px; text-transform: uppercase;">Ticket Number</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">${ticketNumber}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase;">Title</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">${title}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase;">Customer</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">${customerDetails}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase;">Module</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 500;">${module}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase;">Priority</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #b91c1c; font-weight: 600;">${priority}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase;">Current Status</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0284c7; font-weight: 600;">${status}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase;">Assignment Date</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${dateStr}</td></tr>
                        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; text-transform: uppercase;">SLA Due Date</td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #b91c1c; font-weight: 500;">${slaStr}</td></tr>
                    </table>
                    <div style="margin-top: 32px; text-align: center;">
                        <a href="${ticketUrl || portalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1A5FA8; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">View Ticket in Portal</a>
                    </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
                    <p style="margin: 0;">This is an automated notification from the Sifratech Support Portal.</p>
                </div>
            </div>
        `;

        await sendEmail(toEmail, subject, bodyContent);
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending assignment email:', error);
        res.status(500).json({ error: 'Failed to send assignment email' });
    }
});

app.post('/api/emails/in-progress', authMiddleware, async (req, res) => {
    try {
        const { sendEmail } = require('./services/GraphApiService');
        const { toEmail, ticketNumber, title, portalUrl } = req.body;
        
        if (!toEmail) return res.status(400).json({ error: 'toEmail is required' });

        const subject = `Ticket In Progress: ${ticketNumber} - ${title}`;
        const bodyContent = `
            <h2>Your ticket is now being worked on.</h2>
            <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
            <p><strong>Title:</strong> ${title}</p>
            <p>Our support team has started investigating this issue.</p>
            <p><a href="${portalUrl}" style="padding: 10px 15px; background-color: #1A5FA8; color: white; text-decoration: none; border-radius: 4px;">View in Portal</a></p>
        `;

        await sendEmail(toEmail, subject, bodyContent);
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending in-progress email:', error);
        res.status(500).json({ error: 'Failed to send in-progress email' });
    }
});

app.post('/api/emails/resolved', authMiddleware, async (req, res) => {
    try {
        const { sendEmail } = require('./services/GraphApiService');
        const { toEmail, ticketNumber, title, resolutionNotes, portalUrl } = req.body;
        
        if (!toEmail) return res.status(400).json({ error: 'toEmail is required' });

        const subject = `Ticket Resolved: ${ticketNumber} - ${title}`;
        const bodyContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; color: #1A2A3A; line-height: 1.6; border: 1px solid #e1e8ed; padding: 24px; border-radius: 8px;">
    <p style="margin-top: 0;">Dear Customer,</p>
    <p>We are pleased to inform you that the issue reported on your ticket has been resolved.<br>
    Please find the resolution summary below.</p>

    <div style="background-color: #EBF5FB; padding: 20px; border-radius: 6px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
                <td style="padding: 8px 0; width: 120px; font-weight: 600; vertical-align: top;">Ticket Number:</td>
                <td style="padding: 8px 0; vertical-align: top;">${ticketNumber}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Resolution:</td>
                <td style="padding: 8px 0; vertical-align: top; white-space: pre-wrap; color: #3A4A5C;">${resolutionNotes}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">Resolved On:</td>
                <td style="padding: 8px 0; vertical-align: top;">${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} &mdash; ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
        </table>
    </div>

    <p>We kindly ask that you verify the resolution on your end and take one of the following actions by logging into the portal:</p>
    <ul style="margin-bottom: 24px; color: #3A4A5C;">
        <li style="margin-bottom: 8px;"><strong>Close the ticket</strong> &mdash; if the issue has been fully resolved to your satisfaction.</li>
        <li><strong>Reopen the ticket</strong> &mdash; if the issue persists or the resolution is incomplete, so that our team can continue to assist you.</li>
    </ul>

    <p style="margin-bottom: 0;">Regards,<br>
    <strong>Sifratech Support Team</strong><br>
    support@sifratech.com</p>
    
    <div style="margin-top: 32px; text-align: center;">
        <a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1A5FA8; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">View Ticket in Portal</a>
    </div>
</div>
        `;

        await sendEmail(toEmail, subject, bodyContent);
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending resolved email:', error);
        res.status(500).json({ error: 'Failed to send resolved email' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Sifratech Backend is running.' });
});

app.post('/api/ai/suggest-reply', async (req, res) => {
    try {
        const { generateResolutionReply } = require('./services/AIService');
        const { title, description, notes } = req.body;
        const suggestion = await generateResolutionReply(title, description, notes);
        res.status(200).json({ suggestion });
    } catch (error) {
        console.error('Error suggesting reply:', error);
        res.status(500).json({ error: 'Failed to generate AI reply' });
    }
});

app.post('/api/comments', authMiddleware, async (req, res) => {
    try {
        const { supabase } = require('./config/supabaseClient');
        const { ticketId, commentText, source } = req.body;
        
        if (!ticketId || !commentText) return res.status(400).json({ error: 'ticketId and commentText are required' });

        const { error } = await supabase.from('ticket_comments').insert([{
            ticket_id: ticketId,
            comment_text: commentText,
            source: source || 'Portal'
        }]);

        if (error) throw error;
        
        // Also insert history
        await supabase.from('ticket_status_history').insert([{
            ticket_id: ticketId,
            old_status: 'Any',
            new_status: 'Any',
            comments: `[System] Comment added.`
        }]);

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ error: error.message || 'Failed to post comment' });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Attempt to subscribe to the Microsoft Graph Webhook on startup
    if (process.env.GRAPH_CLIENT_ID && process.env.WEBHOOK_URL) {
        await subscribeToSupportMailbox();
    } else {
        console.warn('Skipping Graph Webhook subscription: Missing WEBHOOK_URL in .env');
        console.log('Starting local polling mode... Checking for new emails every 30 seconds.');
        // Initial run
        processUnreadEmails();
        // Setup polling
        setInterval(processUnreadEmails, 30000);
    }
});
