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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4CAF7D; padding: 20px; text-align: center;">
                    <h2 style="color: white; margin: 0; font-size: 22px;">Ticket Resolved</h2>
                </div>
                <div style="padding: 24px; background-color: #f8fafc; border-bottom: 1px solid #e1e8ed;">
                    <p style="margin-top: 0; font-size: 16px; color: #334155;">Hello,</p>
                    <p style="font-size: 15px; color: #334155; line-height: 1.6;">Our support team has marked your ticket (<strong>${ticketNumber}</strong>) as resolved.</p>
                </div>
                <div style="padding: 24px; background-color: white;">
                    <h3 style="margin-top: 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Resolution Notes</h3>
                    <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; font-size: 14px; color: #0f172a; white-space: pre-wrap; line-height: 1.6;">${resolutionNotes}</div>
                    
                    <div style="margin-top: 32px; text-align: center;">
                        <a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF7D; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">View Ticket in Portal</a>
                    </div>
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
