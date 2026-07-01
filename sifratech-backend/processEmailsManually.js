require('dotenv').config();
const { fetchUnreadEmails, markEmailAsRead, sendEmailReply } = require('./src/services/GraphApiService');
const { parseEmailBody, isReply, isValidTicketTemplate } = require('./src/services/EmailParserService');
const { analyzeTicketData } = require('./src/services/AIService');
const { assignTicket } = require('./src/services/AssignmentEngine');
const { calculateDueDate } = require('./src/services/SlaEngine');
const { supabase } = require('./src/config/supabaseClient');

async function processManually() {
    console.log('Fetching new unread emails...');
    const newEmails = await fetchUnreadEmails();
    
    if (newEmails.length === 0) {
        console.log('No unread emails found.');
        return;
    }

    console.log(`Found ${newEmails.length} unread emails. Processing...`);

    for (const email of newEmails) {
        console.log(`\n--- Processing email: ${email.subject} ---`);

        if (isReply(email.subject)) {
            console.log('Skipping reply email for now.');
            // await markEmailAsRead(email.id);
            continue;
        }

        const bodyContent = email.bodyPreview || (email.body && email.body.content) || '';
        
        // 1. Parse Email Template
        console.log('Parsing email template...');
        const extractedData = parseEmailBody(bodyContent);
        const isTemplate = isValidTicketTemplate(bodyContent);
        console.log('Extracted Data:', extractedData);

        // 2. AI Analysis
        console.log('Running AI analysis...');
        try {
            const aiData = await analyzeTicketData(email.subject, email.body.content, extractedData);
            console.log('AI Analysis Result:', aiData);

            if (!isTemplate && aiData.is_valid_ticket === false) {
                console.log(`Ignoring email "${email.subject}": AI determined it is not a valid support ticket.`);
                await markEmailAsRead(email.id);
                continue;
            }

            // Merge Data
            const ticketData = {
                title: extractedData.title || email.subject,
                description: extractedData.description || email.bodyPreview,
                oracle_module_name: aiData.oracle_module,
                ticket_type: extractedData.type || 'Email Inquiry',
                request_type: 'Inbound Mail',
                priority: aiData.priority || extractedData.priority || 'Medium',
                severity: aiData.severity,
                business_impact: aiData.business_impact || extractedData.business_impact,
                customer_name: extractedData.customer_name || (email.from && email.from.emailAddress.name),
                email_address: extractedData.email_address || (email.from && email.from.emailAddress.address),
                company: extractedData.company,
                phone_number: extractedData.phone_number,
                source: 'Outlook',
                email_message_id: email.id,
                conversation_id: email.conversationId,
                ticket_number: `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
            };

            // Calculate Due Date
            ticketData.due_date = await calculateDueDate(ticketData.priority);

            console.log('Final Ticket Data to Insert:', ticketData);

            // 3. Insert into Supabase
            console.log('Inserting into Supabase...');
            const { data: moduleData } = await supabase
                .from('oracle_modules')
                .select('id')
                .ilike('name', ticketData.oracle_module_name)
                .maybeSingle();

            if (moduleData) {
                ticketData.oracle_module_id = moduleData.id;
            }
            delete ticketData.oracle_module_name;

            const { data: newTicket, error } = await supabase
                .from('tickets')
                .insert([ticketData])
                .select()
                .single();

            if (error) {
                console.error('Error creating ticket in DB:', error);
                continue;
            }
            
            console.log(`Successfully created ticket: ${newTicket.ticket_number} with ID: ${newTicket.id}`);

            // 4. Assign Team/Engineer
            console.log('Assigning ticket...');
            await assignTicket(newTicket.id, aiData.oracle_module);

            // 5. Send Email Notification
            console.log('Sending confirmation email...');
            const replyBody = `
                <h2>Ticket Created Successfully</h2>
                <p><strong>Ticket Number:</strong> ${newTicket.ticket_number}</p>
                <p><strong>Title:</strong> ${newTicket.title}</p>
                <p>We have received your ticket and assigned it to our support team.</p>
                <p>You can track the status here: <a href="https://your-portal.com/tickets/${newTicket.id}">Portal Link</a></p>
            `;
            await sendEmailReply(email.conversationId, email.id, email.from.emailAddress.address, `Re: ${email.subject}`, replyBody);

            // 6. Mark as Read
            console.log('Marking email as read...');
            await markEmailAsRead(email.id);
            
            console.log('Done processing this email!');

        } catch (err) {
            console.error('Error processing email with AI/DB:', err);
        }
    }
}

processManually();
