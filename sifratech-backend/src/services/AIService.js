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
            model: 'gemini-1.5-flash',
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
                        model: 'openai/gpt-oss-120b',
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

    if (process.env.GROQ_API_KEY) {
        try {
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                })
            });
            
            if (groqResponse.ok) {
                const groqData = await groqResponse.json();
                return (groqData.choices[0].message.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
        } catch (groqError) {
            console.error('Error with Groq API for reply:', groqError.message || groqError);
        }
    }
        
        return draftNotes || 'The issue has been resolved successfully.';
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

    // Groq API primary
    if (process.env.GROQ_API_KEY) {
        try {
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages: [
                        { role: 'user', content: textPrompt }
                    ]
                })
            });
            
            if (groqResponse.ok) {
                const groqData = await groqResponse.json();
                return (groqData.choices[0].message.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            }
        } catch (groqError) {
            console.error('Error with Groq API:', groqError.message || groqError);
        }
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: finalParts,
        });
        return response.text;
    } catch (error) {
        console.error('Gemini fallback error:', error.message || error);
    }
    
    return "Could not generate summary.";
};

const generateWSRSummary = async (metrics) => {
    const prompt = `You are a senior IT Account Manager preparing an executive Periodic Status Report (PSR) summary for executive management and stakeholders.
Based on the following periodic operational metrics, write a concise, professional, bulleted executive summary highlighting support health, ticket resolution velocity, backlog risks, and module/priority distribution.

Periodic Operational Metrics:
${JSON.stringify(metrics, null, 2)}

Provide a structured, executive-level summary with sections:
1. Periodic Operations Overview
2. Key Highlights & Achievements
3. Risks & Areas of Focus

Keep it objective, concise, and professional without generic greetings.`;

    // 1. Try Groq Cloud API with openai/gpt-oss-120b or qwen/qwen3.6-27b
    if (process.env.GROQ_API_KEY) {
        try {
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                })
            });

            if (groqResponse.ok) {
                const groqData = await groqResponse.json();
                let output = groqData.choices?.[0]?.message?.content || '';
                // Clean any thinking tags if present
                output = output.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                if (output) return output;
            }
        } catch (groqError) {
            console.error('Groq AI error in WSR summary:', groqError.message || groqError);
        }
    }

    // 2. Fallback to Gemini
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Gemini AI fallback error:', error.message || error);
    }

    return "Weekly support operations proceeded according to standard SLA metrics. Ticket intake and resolution rates remained stable across assigned modules.";
};

const generateBCSContent = async (liveData) => {
    const { account_name, project_name, tickets, modules, teams, dateRange } = liveData;

    // Detailed real-time ticket logs & comment threads from DB
    const ticketDetailsList = tickets.slice(0, 30).map(t => {
        let entry = `[${t.ticket_number || 'TKT'}] Title: "${t.title || 'Support Issue'}" | Module: ${t.module} | Status: ${t.status} | Priority: ${t.priority}`;
        if (t.description) {
            entry += `\n   Initial Problem Description: ${t.description.substring(0, 200)}`;
        }
        if (t.comments && t.comments.length > 0) {
            entry += `\n   Actual DB Comments & Resolutions:\n` + t.comments.slice(0, 3).map(c => `     • ${c.substring(0, 250)}`).join('\n');
        }
        return entry;
    }).join('\n\n');

    const prompt = `You are a senior IT Account Manager at Sifratech writing a formal Business Case Study document for the client "${account_name}" on the project "${project_name}".

Based on this REAL-TIME operational ticket data and actual ticket comments/resolutions from the database, generate tangible, highly specific, data-driven content for each section. Directly quote and reference actual ticket numbers, issue titles, comments, project references (e.g., YS-543/2025.146.01), markup changes, module details, and resolutions.

Client: ${account_name}
Project Track: ${project_name}
Reporting Period: ${dateRange}
Total Tickets: ${tickets.length}
Oracle Modules Covered: ${modules.join(', ') || 'General'}
Support Teams: ${teams.join(', ') || 'Sifratech Support'}

Detailed Real-Time Ticket Data & Database Comments:
${ticketDetailsList}

Return a JSON object with EXACTLY these keys (no extra text, pure JSON):
{
  "current_situation": "2-3 sentences about the current IT landscape and systems in scope referencing actual ticket volume, modules and real support activity",
  "operational_challenges": "Specific operational and support challenges observed directly from actual ticket titles, descriptions, and comments in database",
  "existing_process": "Description of the existing support process and modules covered based on real ticket activity",
  "existing_workflow": "How tickets flow from submission to resolution referencing actual statuses, teams, and audit comments",
  "support_approach": "Sifratech support structure and tier SLA models for ${account_name}",
  "process_improvements": "Standardized incident types, escalation paths, and automated triage models",
  "ticketing_workflow": "Lifecycle states from ticket submission to verification and closure",
  "automation_used": "AI email ingestion, auto-assignment, instant notifications, and resolution reply suggestions used",
  "improvements_achieved": "Key tangible improvements and resolution outcomes achieved referencing specific ticket numbers, comments, and fixes applied",
  "operational_benefits": "Operational benefits delivered to ${account_name} based on ticket comments and resolution velocity",
  "visibility_improvements": "How the Sifratech portal provided real-time visibility into ticket status and comments for ${account_name}",
  "efficiency_improvements": "Efficiency improvements across response times, module coverage, and issue resolution",
  "major_observations": "Key observations from ticket data and comment threads — recurring issues, hotspot modules, team response",
  "lessons_learned": "Lessons learned and best practices identified from actual ticket resolution comments",
  "recommended_improvements": "Short-term recommended improvements based on ticket patterns and gaps identified in comments",
  "automation_opportunities": "Automation and process optimization opportunities identified from ticket workflows",
  "further_enhancements": "Long-term enhancement roadmap recommendations for ${account_name}"
}`;

    // 1. Try Groq
    if (process.env.GROQ_API_KEY) {
        try {
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.6,
                    max_tokens: 3000,
                    response_format: { type: 'json_object' }
                })
            });

            if (groqResponse.ok) {
                const data = await groqResponse.json();
                const text = data.choices?.[0]?.message?.content?.trim();
                if (text) return JSON.parse(text);
            } else {
                console.error('Groq BCS HTTP Error:', groqResponse.status, await groqResponse.text());
            }
        } catch (err) {
            console.error('Groq BCS generation error:', err.message);
        }
    }

    // 2. Fallback: Gemini
    if (process.env.GEMINI_API_KEY) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const text = response.text?.trim();
            if (text) return JSON.parse(text);
        } catch (err) {
            console.error('Gemini BCS fallback error:', err.message);
        }
    }

    // 3. Real-time DB Data Fallback incorporating actual ticket comments & descriptions
    const modulesStr = modules.length > 0 ? modules.join(', ') : 'Oracle Core Modules';
    const teamsStr = teams.length > 0 ? teams.join(', ') : 'Sifratech Support Team';
    const totalCount = tickets.length;
    const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

    // Collect tangible real ticket comment excerpts
    const realCommentExcerpts = tickets
        .filter(t => t.comments && t.comments.length > 0)
        .slice(0, 5)
        .map(t => `• [${t.ticket_number}] ${t.title}: "${t.comments[0].substring(0, 150)}${t.comments[0].length > 150 ? '...' : ''}"`)
        .join('\n');

    const realTicketSummary = tickets.slice(0, 4).map(t => `• [${t.ticket_number}] ${t.title} (${t.module}) - Status: ${t.status}`).join('\n');

    return {
        current_situation: `${account_name} operates an enterprise ${project_name} environment encompassing ${modulesStr}. Sifratech provides structured operational and technical support across ${totalCount} recorded incident tickets during ${dateRange}.`,
        operational_challenges: realTicketSummary ? `Key operational tickets logged in database:\n${realTicketSummary}` : `Management of ticket volume and SLA timelines across ${modulesStr}.`,
        existing_process: `Support requests for ${modulesStr} are logged and triaged into the Sifratech portal and assigned to ${teamsStr}.`,
        existing_workflow: `Tickets progress through standard lifecycle states: New → In Progress → Awaiting Customer / Pending Approval → Resolved → Closed. All engineer actions and resolution notes are recorded in real-time ticket comments.`,
        support_approach: `Sifratech's dedicated support structure providing specialized functional & technical coverage across ${modulesStr}.`,
        process_improvements: `Standardized incident tagging, automated triage workflows, and SLA timer monitoring.`,
        ticketing_workflow: `Lifecycle states (New → In Progress → Awaiting → Resolved → Closed) with real-time customer and engineer comments.`,
        automation_used: `AI email ingestion, automated team assignment, and instant client notification loops.`,
        improvements_achieved: realCommentExcerpts ? `Tangible resolutions and activity logged in database:\n${realCommentExcerpts}` : `• Successfully processed ${resolvedCount} resolved/closed tickets for ${account_name}.\n• Streamlined ticket routing to ${teamsStr}.\n• Established consistent SLA tracking for all incident types.`,
        operational_benefits: `Delivered reliable business continuity, minimized system downtime for ${project_name}, and provided dedicated expert escalation pathways for critical issues.`,
        visibility_improvements: `The Sifratech Service Portal provides real-time transparency into ticket status, comment history, assigned engineers, and resolution updates for ${account_name}.`,
        efficiency_improvements: `Enhanced resolution velocity and reduced triage overhead through structured module categorization and dedicated engineer assignments.`,
        major_observations: `Ticket telemetry indicates active support around ${modulesStr}. Detailed comments and clear reproduction steps in ticket threads significantly accelerate resolution times.`,
        lessons_learned: `Establishing clear issue classification and recording resolution details in ticket comments improves initial response times and prevents repeat issues.`,
        recommended_improvements: `• Conduct periodic refresher training for key system users.\n• Implement standardized template checklists for complex module support requests.\n• Maintain proactive patch and environment health checks.`,
        automation_opportunities: `Explore automated email ticket creation, AI-assisted ticket triage, and automated resolution verification notifications.`,
        further_enhancements: `Evaluate strategic cloud upgrades, additional module rollouts, and enhanced integration monitoring for ${account_name}.`
    };
};

module.exports = {
    analyzeTicketData,
    generateResolutionReply,
    summarizeTicketDescription,
    generateWSRSummary,
    generateBCSContent
};

