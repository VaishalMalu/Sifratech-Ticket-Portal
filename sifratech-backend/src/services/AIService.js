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
    Analyze the following email and extracted data. 
    Determine if the email represents a legitimate IT support request/issue.
    CRITICAL INSTRUCTION: You MUST strictly audit the email content. Return "is_valid_ticket": false if the email is an advertisement, a marketing newsletter, a system alert (e.g., 'free trial', 'subscription update'), a bounce message like 'undeliverable' or 'delivery status notification', an 'out of office' reply, 'action required' system alerts, 'automatic reply', Microsoft Teams or SharePoint notifications ('you have been added to a team'), a personal email, general office chatter, or anything that is NOT a genuine, human-written request for helpdesk support.

    Provide your classification as a JSON object with these keys: 
    "is_valid_ticket" (boolean), "project", "environment", "incident_type", "oracle_module", "priority", "severity", "business_impact", "sentiment", "suggested_resolution", "estimated_resolution_time_hours", "confidence_score".

    Email Subject: ${emailSubject}
    Email Body: ${emailBody}
    Pre-extracted Data: ${JSON.stringify(extractedData)}
    
    Valid Oracle Modules: Financials, HRMS, SCM, Payroll, Inventory, Projects, Procurement.
    Valid Priorities: Low, Medium, High, Critical.
    Valid Environments: Development, Patching, Testing, Production.
    Valid Incident Types: ${validIncidentTypes}.
    
    If the project is unknown, default to "R12".
    If the environment is unknown, default to "Production".
    
    Respond ONLY with valid JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
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

        // Final Fallback
        const hasExtractedData = extractedData && Object.values(extractedData).some(v => v !== null);
        return {
            is_valid_ticket: true, // Default to true in fallback so we never drop emails when APIs are down
            project: 'R12',
            environment: 'Production',
            incident_type: extractedData.type || 'Email Inquiry',
            oracle_module: extractedData.oracle_module || 'Unknown',
            priority: extractedData.priority || 'Medium',
            severity: 'Moderate',
            business_impact: 'Unknown',
            sentiment: 'Neutral',
            suggested_resolution: 'Investigate issue',
            estimated_resolution_time_hours: 24,
            confidence_score: 0.5
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
            model: 'gemini-2.5-pro',
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

module.exports = {
    analyzeTicketData,
    generateResolutionReply
};
