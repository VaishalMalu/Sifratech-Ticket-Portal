const { fetchUnreadEmails, markEmailAsRead, sendEmailReply, fetchEmailAttachments } = require('../services/GraphApiService');
const { parseEmailBody, isReply, isValidTicketTemplate, isAutoResponse } = require('../services/EmailParserService');
const { analyzeTicketData } = require('../services/AIService');
const { assignTicket } = require('../services/AssignmentEngine');
const { calculateDueDate } = require('../services/SlaEngine');
const { supabase } = require('../config/supabaseClient');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const processUnreadEmails = async () => {
    try {
        // Fetch new unread emails
        const newEmails = await fetchUnreadEmails();

        if (newEmails && newEmails.length > 0) {
            console.log(`Found ${newEmails.length} unread emails. Processing...`);
        }

        for (const email of newEmails) {
            // Process the email
            console.log(`Processing email: ${email.subject}`);

            // Skip replies for now or handle them by adding comments
            if (isReply(email.subject)) {
                // Implementation for appending comment to existing ticket goes here
                await markEmailAsRead(email.id);
                continue;
            }

            const cleanHtml = (html) => {
                if (!html) return '';
                return html.replace(/<br\s*\/?>/gi, '\n')
                           .replace(/<\/div>/gi, '\n')
                           .replace(/<\/p>/gi, '\n')
                           .replace(/<[^>]+>/g, '') // Strip remaining tags
                           .replace(/&nbsp;/g, ' ')
                           .replace(/\r\n/g, '\n');
            };

            let bodyContent = email.bodyPreview || '';
            if (email.body && email.body.content) {
                if (email.body.contentType === 'html') {
                    bodyContent = cleanHtml(email.body.content);
                } else {
                    bodyContent = email.body.content;
                }
            }
            
            // Filter out auto-responses, bounce messages, and empty emails
            if (!email.subject || !bodyContent || bodyContent.trim() === '' || isAutoResponse(email.subject, email.from?.emailAddress?.address)) {
                console.log(`Ignoring auto-response, bounce message, or empty email: ${email.subject}`);
                await markEmailAsRead(email.id);
                continue;
            }
            
            // 1. Parse Email Template (Best effort extraction)
            const extractedData = parseEmailBody(bodyContent);
            const isTemplate = isValidTicketTemplate(bodyContent);

            // 2. AI Analysis (Now handles categorization and validation)
            const aiData = await analyzeTicketData(email.subject, email.body.content, extractedData);
            
            // Allow if it matches our template perfectly, OR if the AI says it's a valid ticket
            if (!isTemplate && aiData.is_valid_ticket === false) {
                console.log(`Ignoring email "${email.subject}": AI determined it is not a valid support ticket.`);
                await markEmailAsRead(email.id);
                continue;
            }

            // Idempotency: Prevent processing the same email twice
            const { data: existingTicket } = await supabase
                .from('tickets')
                .select('id')
                .eq('email_message_id', email.id)
                .maybeSingle();

            if (existingTicket) {
                console.log(`Ticket already exists for email ${email.id}. Skipping...`);
                await markEmailAsRead(email.id);
                continue;
            }

            // Prevent Duplicates by Title/Email within 24 hours
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: duplicateTicket } = await supabase
                .from('tickets')
                .select('id')
                .eq('title', extractedData.title || email.subject)
                .eq('email_address', email.from.emailAddress.address)
                .gte('created_at', yesterday)
                .limit(1);

            if (duplicateTicket && duplicateTicket.length > 0) {
                console.log(`Duplicate ticket detected for subject "${email.subject}". Skipping...`);
                await markEmailAsRead(email.id);
                continue;
            }
            
            // Merge Data
            const ticketData = {
                title: extractedData.title || email.subject,
                description: extractedData.description || email.bodyPreview,
                oracle_module_name: aiData.oracle_module,
                ticket_type: aiData.incident_type || extractedData.type || 'Email Inquiry',
                request_type: 'Inbound Mail',
                priority: aiData.priority,
                severity: aiData.severity,
                business_impact: aiData.business_impact || extractedData.business_impact,
                // Add new fields for autonomous processing
                // Add new fields for autonomous processing
                customer_name: email.from.emailAddress.name,
                email_address: email.from.emailAddress.address,
                company: extractedData.company,
                phone_number: extractedData.phone_number,
                source: 'Outlook',
                email_message_id: email.id,
                conversation_id: email.conversationId,
                ticket_number: `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
            };

            // Calculate Due Date
            ticketData.due_date = await calculateDueDate(ticketData.priority);

            // 3. Insert into Supabase
            // We need to resolve oracle_module_name to an ID
            const { data: moduleData } = await supabase
                .from('oracle_modules')
                .select('id')
                .ilike('name', ticketData.oracle_module_name)
                .maybeSingle();

            if (moduleData) {
                ticketData.oracle_module_id = moduleData.id;
            }
            delete ticketData.oracle_module_name; // remove non-column field

            const { data: newTicket, error } = await supabase
                .from('tickets')
                .insert([ticketData])
                .select()
                .maybeSingle();

            if (error) {
                console.error('Error creating ticket in DB:', error);
                continue;
            }

            // Handle Attachments
            if (email.hasAttachments) {
                const attachments = await fetchEmailAttachments(email.id);
                let attachmentLinks = [];
                for (const att of attachments) {
                    if (att['@odata.type'] === '#microsoft.graph.fileAttachment') {
                        try {
                            const buffer = Buffer.from(att.contentBytes, 'base64');
                            const path = `${newTicket.id}/${Date.now()}_${att.name}`;
                            
                            const { data, error: uploadError } = await supabase.storage
                                .from('ticket-attachments')
                                .upload(path, buffer, { contentType: att.contentType });
                                
                            if (data) {
                                const { data: { publicUrl } } = supabase.storage
                                    .from('ticket-attachments')
                                    .getPublicUrl(data.path);
                                attachmentLinks.push(`[Attachment: ${att.name}](${publicUrl})`);
                            } else {
                                console.error('Error uploading attachment:', uploadError);
                            }
                        } catch (err) {
                            console.error('Error processing attachment buffer:', err);
                        }
                    }
                }

                if (attachmentLinks.length > 0) {
                    const newDesc = newTicket.description + '\n\n**Attachments:**\n' + attachmentLinks.join('\n');
                    await supabase.from('tickets').update({ description: newDesc }).eq('id', newTicket.id);
                }
            }

            // 4. Assign Team/Engineer
            const assignment = await assignTicket(newTicket.id, aiData.oracle_module);

            // 5. Send Email Notification
            const replyBody = `
                <h2>Ticket Created Successfully</h2>
                <p><strong>Ticket Number:</strong> ${newTicket.ticket_number}</p>
                <p><strong>Title:</strong> ${newTicket.title}</p>
                <p>We have received your ticket and assigned it to our support team.</p>
                <p>You can track the status here: <a href="https://your-portal.com/tickets/${newTicket.id}">Portal Link</a></p>
            `;
            await sendEmailReply(email.conversationId, email.id, email.from.emailAddress.address, `Re: ${email.subject}`, replyBody);

            // 6. Mark as Read
            await markEmailAsRead(email.id);

            // 7. Rate Limit Handling: Sleep for 2 seconds to avoid Gemini API limits
            await sleep(2000);
        }

    } catch (error) {
        console.error('Error processing emails:', error);
    }
};

const handleOutlookWebhook = async (req, res) => {
    // Microsoft Graph requires us to return the validationToken if present
    if (req.query && req.query.validationToken) {
        return res.status(200).send(req.query.validationToken);
    }

    // Security: Validate the ClientState from Microsoft Graph
    if (req.body && req.body.value && req.body.value.length > 0) {
        const clientState = req.body.value[0].clientState;
        if (clientState !== 'sifratech-secret-state') {
            console.error('Invalid Client State received in webhook.');
            return res.status(403).send('Forbidden');
        }
    } else {
        return res.status(400).send('Bad Request');
    }

    // Acknowledge the webhook receipt
    res.status(202).send('Accepted');

    // Process emails asynchronously
    processUnreadEmails();
};

module.exports = { handleOutlookWebhook, processUnreadEmails };
