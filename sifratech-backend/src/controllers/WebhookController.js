const { fetchUnreadEmails, markEmailAsRead, sendEmailReply, fetchEmailAttachments } = require('../services/GraphApiService');
const { parseEmailBody, isReply, isValidTicketTemplate, isAutoResponse } = require('../services/EmailParserService');
const { analyzeTicketData } = require('../services/AIService');
const { assignTicket } = require('../services/AssignmentEngine');
const { calculateDueDate } = require('../services/SlaEngine');
const { supabase } = require('../config/supabaseClient');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isProcessing = false;

const processUnreadEmails = async () => {
    if (isProcessing) {
        console.log("Already processing emails. Skipping concurrent execution to prevent duplicates.");
        return;
    }
    isProcessing = true;
    try {
        // Fetch new unread emails
        const newEmails = await fetchUnreadEmails();

        if (newEmails && newEmails.length > 0) {
            console.log(`Found ${newEmails.length} unread emails. Processing...`);
        }

        for (const email of newEmails) {
            // Process the email
            console.log(`Processing email: ${email.subject}`);

            const cleanHtml = (html) => {
                if (!html) return '';
                // First convert lists and tables to basic text formatting
                let text = html.replace(/<li>/gi, '\n• ')
                               .replace(/<\/li>/gi, '')
                               .replace(/<tr>/gi, '\n')
                               .replace(/<\/td>/gi, ' | ')
                               .replace(/<\/th>/gi, ' | ');
                
                return text.replace(/<br\s*\/?>/gi, '\n')
                           .replace(/<\/div>/gi, '\n')
                           .replace(/<\/p>/gi, '\n\n')
                           .replace(/<[^>]+>/g, '') // Strip remaining tags
                           .replace(/&nbsp;/g, ' ')
                           .replace(/\r\n/g, '\n')
                           .replace(/\n{3,}/g, '\n\n'); // Clean up excessive newlines
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

            // Handle Replies
            if (isReply(email.subject)) {
                console.log(`Processing Reply: ${email.subject}`);
                
                // 1. Find matching ticket
                let matchedTicket = null;
                const ticketMatch = email.subject.match(/TKT-\d{4}-\d{6}/i);
                
                if (ticketMatch) {
                    const { data } = await supabase.from('tickets').select('id, status').eq('ticket_number', ticketMatch[0].toUpperCase()).limit(1);
                    if (data && data.length > 0) matchedTicket = data[0];
                }
                
                if (!matchedTicket && email.conversationId) {
                    const { data } = await supabase.from('tickets').select('id, status').eq('conversation_id', email.conversationId).limit(1);
                    if (data && data.length > 0) matchedTicket = data[0];
                }
                
                if (matchedTicket) {
                    // Extract just the new reply part (primitive approach: split by standard reply dividers)
                    let newComment = bodyContent.split(/On .* wrote:|From: .*|_{10,}|-{10,}/i)[0].trim();
                    if (!newComment) newComment = bodyContent.trim();
                    
                    // Handle Attachments
                    let attachmentLinks = [];
                    if (email.hasAttachments) {
                        const attachments = await fetchEmailAttachments(email.id);
                        for (const att of attachments) {
                            if (att['@odata.type'] === '#microsoft.graph.fileAttachment') {
                                try {
                                    const buffer = Buffer.from(att.contentBytes, 'base64');
                                    const safeName = att.name.replace(/[^\w\.\-\s]/g, '_');
                                    const path = `${matchedTicket.id}/${Date.now()}_${safeName}`;
                                    
                                    const arrayBuffer = new Uint8Array(buffer).buffer;
                                    
                                    const { data, error: uploadError } = await supabase.storage.from('ticket-attachments').upload(path, arrayBuffer, { contentType: att.contentType });
                                    if (data) {
                                        const { data: { publicUrl } } = supabase.storage.from('ticket-attachments').getPublicUrl(data.path);
                                        attachmentLinks.push(`[Attachment: ${safeName}](${publicUrl})`);
                                    } else {
                                        console.error('Error uploading reply attachment:', uploadError);
                                    }
                                } catch (err) {
                                    console.error('Error processing reply attachment:', err);
                                }
                            }
                        }
                    }
                    
                    if (attachmentLinks.length > 0) {
                        newComment += '\n\n**Attachments:**\n' + attachmentLinks.join('\n');
                    }
                    
                    // Insert Comment
                    await supabase.from('ticket_comments').insert([{
                        ticket_id: matchedTicket.id,
                        comment_text: newComment,
                        source: `Email from ${email.from.emailAddress.name}`
                    }]);
                    
                    // Auto-Reopen if Awaiting Customer or Resolved
                    if (matchedTicket.status === 'Awaiting Customer' || matchedTicket.status === 'Resolved') {
                        await supabase.from('tickets').update({ status: 'Open' }).eq('id', matchedTicket.id);
                        await supabase.from('ticket_status_history').insert([{
                            ticket_id: matchedTicket.id,
                            old_status: matchedTicket.status,
                            new_status: 'Open',
                            comments: '[System] Ticket automatically reopened due to customer reply.'
                        }]);
                    }
                } else {
                    console.warn(`Could not find matching ticket for reply: ${email.subject}`);
                }
                
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
                .limit(1);

            if (existingTicket && existingTicket.length > 0) {
                console.log(`Ticket already exists for email ${email.id}. Skipping...`);
                await markEmailAsRead(email.id);
                continue;
            }

            // Prevent Duplicates by Title/Email within 24 hours
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const ticketTitle = aiData.incident_name || extractedData.title || email.subject;
            const { data: duplicateTicket } = await supabase
                .from('tickets')
                .select('id')
                .eq('title', ticketTitle)
                .eq('email_address', aiData.email_address || email.from.emailAddress.address)
                .gte('created_at', yesterday)
                .limit(1);

            if (duplicateTicket && duplicateTicket.length > 0) {
                console.log(`Duplicate ticket detected for subject "${email.subject}". Skipping...`);
                await markEmailAsRead(email.id);
                continue;
            }
            
            const finalDescriptionData = {
                original_email_body: (email.body && email.body.content) ? email.body.content : '',
                normalized_email_body: aiData.incident_description || extractedData.description || bodyContent,
                ai_metadata: {
                    confidence_scores: aiData.confidence_scores || {},
                    extraction_sources: aiData.extraction_sources || {}
                }
            };
            
            const safeString = (str, maxLen) => {
                if (!str) return null;
                const singleLine = str.split('\n')[0].trim();
                return singleLine.substring(0, maxLen);
            };

            const ticketData = {
                title: safeString(ticketTitle, 255) || 'Support Request',
                description: JSON.stringify(finalDescriptionData),
                oracle_module_name: aiData.oracle_module,
                ticket_type: safeString(aiData.incident_type || extractedData.type || 'Email Inquiry', 50),
                request_type: 'Inbound Mail',
                priority: safeString(aiData.priority || extractedData.priority || 'Medium', 50),
                severity: safeString(aiData.severity || 'Moderate', 50),
                business_impact: aiData.business_impact || extractedData.business_impact,
                // Add new fields for autonomous processing
                customer_name: safeString(aiData.customer_name || email.from.emailAddress.name, 255),
                email_address: safeString(aiData.email_address || email.from.emailAddress.address, 255),
                company: safeString(aiData.company || extractedData.company || 'ASM- Oracle Fusion support', 255),
                phone_number: safeString(aiData.phone_number || extractedData.phone_number, 50),
                source: aiData.is_fallback ? 'Outlook (Fallback)' : 'Outlook',
                email_message_id: safeString(email.id, 255),
                conversation_id: safeString(email.conversationId, 255),
                ticket_number: `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
                expected_resolution: aiData.expected_resolution || extractedData.expected_resolution
            };

            // Calculate Due Date
            ticketData.due_date = await calculateDueDate(ticketData.priority);

            // 3. Insert into Supabase
            // We need to resolve oracle_module_name to an ID
            const { data: moduleData } = await supabase
                .from('oracle_modules')
                .select('id')
                .ilike('name', ticketData.oracle_module_name)
                .limit(1);

            if (moduleData && moduleData.length > 0) {
                ticketData.oracle_module_id = moduleData[0].id;
            }
            delete ticketData.oracle_module_name; // remove non-column field

            const { data: newTicket, error } = await supabase
                .from('tickets')
                .insert([ticketData])
                .select()
                .limit(1);

            if (error || !newTicket || newTicket.length === 0) {
                console.error('Error creating ticket in DB:', error);
                continue;
            }

            const createdTicket = newTicket[0];

            // Auto-create customer account if they don't exist
            try {
                // Try creating auth user
                const defaultPassword = 'Welcome@2026';
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email: ticketData.email_address,
                    password: defaultPassword,
                    email_confirm: true,
                    user_metadata: { full_name: ticketData.customer_name }
                });
                
                if (!createError && newUser && newUser.user) {
                    // Add to customer_accounts table
                    await supabase.from('customer_accounts').insert([{
                        email: ticketData.email_address,
                        plain_password: defaultPassword
                    }]);
                    
                    // Add to public.users table
                    await supabase.from('users').insert([{
                        id: newUser.user.id,
                        full_name: ticketData.customer_name,
                        email: ticketData.email_address,
                        is_active: true
                    }]);
                    console.log(`Auto-created customer account for ${ticketData.email_address}`);
                }
            } catch(e) {
                console.error('Error auto-creating customer account:', e);
            }

            // Handle Attachments
            if (email.hasAttachments) {
                const attachments = await fetchEmailAttachments(email.id);
                let attachmentLinks = [];
                for (const att of attachments) {
                    if (att['@odata.type'] === '#microsoft.graph.fileAttachment') {
                        try {
                            const buffer = Buffer.from(att.contentBytes, 'base64');
                            const safeName = att.name.replace(/[^\w\.\-\s]/g, '_');
                            const path = `${createdTicket.id}/${Date.now()}_${safeName}`;
                            
                            const arrayBuffer = new Uint8Array(buffer).buffer;
                            
                            const { data, error: uploadError } = await supabase.storage
                                .from('ticket-attachments')
                                .upload(path, arrayBuffer, { contentType: att.contentType });
                                
                            if (data) {
                                const { data: { publicUrl } } = supabase.storage
                                    .from('ticket-attachments')
                                    .getPublicUrl(data.path);
                                attachmentLinks.push(`[Attachment: ${safeName}](${publicUrl})`);
                            } else {
                                console.error('Error uploading attachment:', uploadError);
                            }
                        } catch (err) {
                            console.error('Error processing attachment buffer:', err);
                        }
                    }
                }

                if (attachmentLinks.length > 0) {
                    const appendText = '\n\n**Attachments:**\n' + attachmentLinks.join('\n');
                    try {
                        let descObj = JSON.parse(createdTicket.description);
                        if (descObj.normalized_email_body !== undefined) descObj.normalized_email_body += appendText;
                        if (descObj.original_email_body !== undefined) {
                            const htmlAppend = '<br><br><strong>Attachments:</strong><br>' + attachmentLinks.map(l => {
                                const m = l.match(/\[Attachment:\s*(.*?)\]\((.*?)\)/);
                                return m ? `<a href="${m[2]}" target="_blank" style="color: #1A5FA8; text-decoration: underline;">${m[1]}</a>` : l;
                            }).join('<br>');
                            descObj.original_email_body += htmlAppend;
                        }
                        await supabase.from('tickets').update({ description: JSON.stringify(descObj) }).eq('id', createdTicket.id);
                    } catch (e) {
                        const newDesc = createdTicket.description + appendText;
                        await supabase.from('tickets').update({ description: newDesc }).eq('id', createdTicket.id);
                    }
                }
            }

            // 4. Auto-Assign (via AI/Rules)
            // await assignTicket(createdTicket.id, aiData.oracle_module || ticketData.oracle_module_name);
            
            // Generate Resolution Suggestion (Background)
            if (aiData.suggested_resolution) {
                await supabase.from('ticket_comments').insert([{
                    ticket_id: createdTicket.id,
                    comment_text: `[System] AI Suggested Resolution: ${aiData.suggested_resolution}`,
                    source: 'AI Engine'
                }]);
            }

            // 5. Send Email Notification
            const replyBody = `
                <h2>Ticket Created Successfully</h2>
                <p><strong>Ticket Number:</strong> ${createdTicket.ticket_number}</p>
                <p><strong>Title:</strong> ${createdTicket.title}</p>
                <p>We have received your ticket. It is currently in our queue and will be reviewed and assigned to an engineer shortly.</p>
            `;
            await sendEmailReply(email.conversationId, email.id, email.from.emailAddress.address, `Re: ${email.subject}`, replyBody);

            // 6. Mark as Read
            await markEmailAsRead(email.id);

            // 7. Rate Limit Handling: Sleep for 2 seconds to avoid Gemini API limits
            await sleep(2000);
        }

    } catch (error) {
        console.error('Error processing emails:', error);
    } finally {
        isProcessing = false;
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
