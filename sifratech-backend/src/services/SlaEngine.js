const { supabase } = require('../config/supabaseClient');

// Calculate due date based on SLA configuration
const calculateDueDate = async (priority, createdAt) => {
    try {
        const { data: slaConfig } = await supabase
            .from('sla_configuration')
            .select('resolution_hours')
            .ilike('priority', priority)
            .single();

        const hours = slaConfig ? slaConfig.resolution_hours : 24; // Default 24 hours
        
        const createdDate = createdAt ? new Date(createdAt) : new Date();
        const dueDate = new Date(createdDate.getTime() + hours * 60 * 60 * 1000);
        
        return dueDate;
    } catch (error) {
        console.error('Error calculating SLA due date:', error);
        // Default to +24 hours on error
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
};

module.exports = { calculateDueDate };
