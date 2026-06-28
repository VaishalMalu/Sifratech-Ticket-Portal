// Regular expressions to extract data from the predefined email template
const parseEmailBody = (bodyText) => {
    const data = {
        title: extractField(bodyText, 'Incident Name'),
        description: extractField(bodyText, 'Incident Description'),
        oracle_module: extractField(bodyText, 'Oracle Module'),
        priority: extractField(bodyText, 'Priority') || 'Medium',
        environment: extractField(bodyText, 'Environment'),
        customer_name: extractField(bodyText, 'Customer Name'),
        company: extractField(bodyText, 'Company'),
        email_address: extractField(bodyText, 'Email Address'),
        phone_number: extractField(bodyText, 'Phone Number'),
        business_impact: extractField(bodyText, 'Business Impact'),
        expected_resolution: extractField(bodyText, 'Expected Resolution'),
        additional_notes: extractField(bodyText, 'Additional Notes')
    };
    return data;
};

const extractField = (text, fieldName) => {
    // Looks for "FieldName: Value" and captures multi-line content until the next field label or end of string
    const regex = new RegExp(`${fieldName}\\s*:\\s*([\\s\\S]*?)(?=\\n[\\w\\s]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
};

// Check if email belongs to an existing conversation
const isReply = (subject) => {
    return subject.toLowerCase().startsWith('re:') || subject.toLowerCase().startsWith('fw:');
};

// Check if email is formatted as a valid ticket template to protect privacy
const isValidTicketTemplate = (bodyText) => {
    if (!bodyText) return false;
    // Require at least 'Incident Name:' and 'Incident Description:' to consider it a valid template
    const hasName = /Incident Name\s*:/i.test(bodyText);
    const hasDescription = /Incident Description\s*:/i.test(bodyText);
    return hasName && hasDescription;
};

module.exports = {
    parseEmailBody,
    isReply,
    isValidTicketTemplate
};
