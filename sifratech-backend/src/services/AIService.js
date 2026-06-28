const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Analyze the ticket email using Gemini AI
const analyzeTicketData = async (emailSubject, emailBody, extractedData) => {
    const prompt = `
    You are an enterprise helpdesk AI assistant for Sifratech.
    Analyze the following email and extracted data. 
    Determine if the email represents a legitimate IT support request/issue.
    CRITICAL INSTRUCTION: You MUST return "is_valid_ticket": false if the email is an advertisement, a marketing newsletter, a system alert (e.g., 'free trial', 'subscription update'), a personal email, general office chatter, or anything that is NOT a genuine request for helpdesk support.

    Provide your classification as a JSON object with these keys: 
    "is_valid_ticket" (boolean), "project", "environment", "incident_type", "oracle_module", "priority", "severity", "business_impact", "sentiment", "suggested_resolution", "estimated_resolution_time_hours", "confidence_score".

    Email Subject: ${emailSubject}
    Email Body: ${emailBody}
    Pre-extracted Data: ${JSON.stringify(extractedData)}
    
    Valid Oracle Modules: Financials, HRMS, SCM, Payroll, Inventory, Projects, Procurement.
    Valid Priorities: Low, Medium, High, Critical.
    Valid Environments: Development, Patching, Testing, Production.
    Valid Incident Types: Bug, Data Extract, Data Fix, Enhancement, New Requirement, New Setup Request, Reports, Responsibility Assignment, Training Request.
    
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
            is_valid_ticket: hasExtractedData,
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

module.exports = {
    analyzeTicketData
};
