const { GoogleGenAI } = require('@google/genai');
const { supabase } = require('../config/supabaseClient');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Analyze the ticket email using Gemini AI
const analyzeTicketData = async (emailSubject, emailBody, extractedData) => {
    let validIncidentTypes = "Bug, Data Extract, Data Fix, Enhancement, New Requirement, New Setup Request, Reports, Responsibility Assignment, Training Request";
    try {
        const { data: typesData } = await supabase.from('incident_types').select('name');
        if (typesData && typesData.length > 0) {
            validIncidentTypes = typesData.map(t => t.name).join(', ');
        }
    } catch (err) {
        console.error('Failed to fetch incident types for AI prompt:', err);
    }

    const prompt = `
    You are an enterprise helpdesk AI assistant for Sifratech.
    Analyze the following email and any pre-extracted template data. 
    Determine if the email represents a legitimate IT support request/issue.
    CRITICAL INSTRUCTION: You MUST strictly audit the email content. Return "is_valid_ticket": false if the email is an advertisement, a marketing newsletter, a system alert, a bounce message, an 'out of office' reply, 'action required' system alerts, 'automatic reply', Microsoft Teams or SharePoint notifications, a personal email, general office chatter, or anything that is NOT a genuine, human-written request for helpdesk support.

    Extract the information from the email and map it STRICTLY to the existing SifraTech ticket template fields. 
    If a field is not available in the email, use null. Do not hallucinate values.
    
    Provide your classification as a JSON object with these keys:
    "is_valid_ticket" (boolean),
    "incident_name" (string, inferred from subject or body),
    "incident_description" (string, the complete meaningful problem description),
    "oracle_module" (string),
    "incident_type" (string),
    "priority" (string),
    "severity" (string),
    "environment" (string),
    "customer_name" (string),
    "email_address" (string),
    "phone_number" (string),
    "company" (string),
    "business_impact" (string),
    "expected_resolution" (string),
    "additional_notes" (string),
    "confidence_scores" (object mapping each of the above string field keys to a float 0.0-1.0 indicating extraction confidence),
    "extraction_sources" (object mapping each string field key to a string e.g., 'Subject', 'Body', 'Pre-extracted Data').

    Email Subject: ${emailSubject}
    Email Body: ${emailBody}
    Pre-extracted Data: ${JSON.stringify(extractedData)}
    
    Valid Oracle Modules: Financials, HRMS, SCM, Payroll, Inventory, Projects, Procurement.
    Valid Priorities: Low, Medium, High, Critical.
    Valid Environments: Development, Patching, Testing, Production.
    Valid Incident Types: ${validIncidentTypes}.
    
    If the project or company is unknown, default to "ASM- Oracle Fusion support".
    If the environment is unknown, default to "Production".
    
    Respond ONLY with valid JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error('Error analyzing ticket with AI (Gemini):', error.message || error);
        
        // Fallback to Groq API
        if (process.env.GROQ_API_KEY) {
            console.log('Attempting fallback to Groq Cloud API...');
            try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile', // recommended model on groq for JSON formatting
                        messages: [
                            { role: 'user', content: prompt }
                        ],
                        response_format: { type: 'json_object' }
                    })
                });
                
                if (groqResponse.ok) {
                    const groqData = await groqResponse.json();
                    return JSON.parse(groqData.choices[0].message.content);
                } else {
                    console.error('Groq API error:', await groqResponse.text());
                }
            } catch (groqError) {
                console.error('Error with Groq API fallback:', groqError.message || groqError);
            }
        }

        // Final Fallback (Deterministic mapping when AI fails)
        return {
            is_valid_ticket: true, // Default to true in fallback so we never drop emails when APIs are down
            is_fallback: true,
            incident_name: extractedData?.title || null,
            incident_description: extractedData?.description || null,
            environment: extractedData?.environment || null,
            incident_type: extractedData?.type || null,
            oracle_module: extractedData?.oracle_module || null,
            priority: extractedData?.priority || null,
            severity: null,
            business_impact: extractedData?.business_impact || null,
            customer_name: extractedData?.customer_name || null,
            email_address: extractedData?.email_address || null,
            phone_number: extractedData?.phone_number || null,
            company: extractedData?.company || null,
            expected_resolution: extractedData?.expected_resolution || null,
            additional_notes: extractedData?.additional_notes || null,
            confidence_scores: {},
            extraction_sources: {}
        };
    }
};

const generateResolutionReply = async (title, description, draftNotes) => {
    const prompt = `You are a professional IT helpdesk assistant. 
A support engineer has resolved a ticket and provided some rough notes.
Please rewrite these notes into a polite, professional, and clear resolution summary to be sent to the customer.
Do NOT include greetings like "Dear Customer" or sign-offs like "Regards". Just provide the core resolution explanation.
Keep it concise and focus on what was fixed.

Ticket Title: ${title}
Ticket Issue: ${description || 'N/A'}
Engineer's Draft Notes: ${draftNotes || 'The issue has been resolved successfully.'}

Provide ONLY the polished text, nothing else.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error generating AI reply with Gemini:', error.message || error);
        
        // Fallback to Groq API
        if (process.env.GROQ_API_KEY) {
            console.log('Attempting fallback to Groq Cloud API for reply generation...');
            try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    })
                });
                
                if (groqResponse.ok) {
                    const groqData = await groqResponse.json();
                    return groqData.choices[0].message.content;
                } else {
                    console.error('Groq API error:', await groqResponse.text());
                }
            } catch (groqError) {
                console.error('Error with Groq API fallback:', groqError.message || groqError);
            }
        }
        
        return draftNotes || 'The issue has been resolved successfully.';
    }
};

const summarizeTicketDescription = async (description) => {
    let textPrompt = `You are a helpful IT assistant.
Please summarize the following ticket description and any provided attached files into a concise summary that captures the core issue.
Do not include any pleasantries or greetings. Just the summary.

Description:
${description}

Summary:`;

    // Parse description to find markdown image/pdf links: e.g. [Attachment: name.pdf](https://url)
    const attachmentLinks = [];
    const regex = /\[.*?\]\((.*?)\)/g;
    let match;
    while ((match = regex.exec(description)) !== null) {
        attachmentLinks.push(match[1]);
    }

    const fetchedAttachments = await Promise.all(attachmentLinks.slice(0, 3).map(async (url) => {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const buffer = await res.arrayBuffer();
                const mimeType = res.headers.get('content-type') || 'application/octet-stream';
                
                // Gemini supports PDF, images, video, audio, text.
                if (mimeType.includes('pdf') || mimeType.includes('image') || mimeType.includes('text')) {
                    const base64Data = Buffer.from(buffer).toString('base64');
                    return {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    };
                }
            }
        } catch (err) {
            console.warn('Could not fetch attachment for AI summary:', err);
        }
        return null;
    }));

    const finalParts = [{ text: textPrompt }];
    const validAttachments = fetchedAttachments.filter(Boolean);
    
    for (const att of validAttachments) {
        if (att.type === 'text') {
            textPrompt += att.content;
            finalParts[0].text = textPrompt;
        } else if (att.inlineData) {
            finalParts.push(att);
        }
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalParts,
        });
        return response.text;
    } catch (error) {
        console.error('Error generating AI summary with Gemini:', error.message || error);
        
        // Fallback to Groq API
        if (process.env.GROQ_API_KEY) {
            try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'user', content: textPrompt }
                        ]
                    })
                });
                
                if (groqResponse.ok) {
                    const groqData = await groqResponse.json();
                    return groqData.choices[0].message.content;
                }
            } catch (groqError) {
                console.error('Error with Groq API fallback:', groqError.message || groqError);
            }
        }
        
        return "Could not generate summary.";
    }
};

module.exports = {
    analyzeTicketData,
    generateResolutionReply,
    summarizeTicketDescription
};
