const { supabase } = require('../config/supabaseClient');
const { generateWSRSummary, generateBCSContent } = require('../services/AIService');

const getBusinessCases = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports_business_cases')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ cases: data });
    } catch (err) {
        console.error('Error fetching business cases:', err);
        res.status(500).json({ error: 'Failed to fetch business cases' });
    }
};

const getBusinessCaseById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('reports_business_cases')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Error fetching business case:', err);
        res.status(500).json({ error: 'Failed to fetch business case' });
    }
};

const saveBusinessCase = async (req, res) => {
    try {
        const payload = { ...req.body };
        const isUpdate = !!payload.id;
        
        payload.updated_by = req.user.id;
        if (!isUpdate) {
            payload.created_by = req.user.id;
        }

        let result;
        if (isUpdate) {
            result = await supabase
                .from('reports_business_cases')
                .update(payload)
                .eq('id', payload.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from('reports_business_cases')
                .insert([payload])
                .select()
                .single();
        }

        if (result.error) throw result.error;
        res.status(isUpdate ? 200 : 201).json(result.data);
    } catch (err) {
        console.error('Error saving business case:', err);
        res.status(500).json({ error: 'Failed to save business case' });
    }
};

const getWsrDrafts = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reports_wsr_drafts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ drafts: data });
    } catch (err) {
        console.error('Error fetching WSR drafts:', err);
        res.status(500).json({ error: 'Failed to fetch WSR drafts' });
    }
};

const saveWsrDraft = async (req, res) => {
    try {
        const payload = { ...req.body };
        const isUpdate = !!payload.id;
        
        payload.updated_by = req.user.id;
        if (!isUpdate) {
            payload.created_by = req.user.id;
        }

        let result;
        if (isUpdate) {
            result = await supabase
                .from('reports_wsr_drafts')
                .update(payload)
                .eq('id', payload.id)
                .select()
                .single();
        } else {
            result = await supabase
                .from('reports_wsr_drafts')
                .insert([payload])
                .select()
                .single();
        }

        if (result.error) throw result.error;
        res.status(isUpdate ? 200 : 201).json(result.data);
    } catch (err) {
        console.error('Error saving WSR draft:', err);
        res.status(500).json({ error: 'Failed to save WSR draft' });
    }
};

const generateWSRMetrics = async (req, res) => {
    try {
        const { company, startDate, endDate } = req.body;
        
        if (!company || !startDate || !endDate) {
            return res.status(400).json({ error: 'company, startDate, and endDate are required' });
        }

        // Fetch tickets and users in parallel to avoid missing schema joins
        const [ticketsRes, usersRes] = await Promise.all([
            supabase
                .from('tickets')
                .select('id, ticket_number, title, status, priority, created_at, resolved_at, closed_at, company, oracle_module_id, oracle_modules(name), assigned_to')
                .ilike('company', company),
            supabase
                .from('users')
                .select('id, full_name, teams(name)')
        ]);

        if (ticketsRes.error) throw ticketsRes.error;

        const tickets = ticketsRes.data || [];
        const usersList = usersRes.data || [];
        const userTeamMap = {};
        usersList.forEach(u => {
            if (u.id && u.teams?.name) {
                userTeamMap[u.id] = u.teams.name;
            }
        });

        const start = new Date(startDate);
        const end = new Date(endDate);
        // Set end to end of day
        end.setHours(23, 59, 59, 999);
        
        // Calculate metrics and collect real-time ticket items
        let newTickets = 0;
        let resolvedTickets = 0;
        let closedTickets = 0;
        let currentlyOpen = 0;
        let priorities = { 'Critical': 0, 'Top': 0, 'High': 0, 'Medium': 0, 'Low': 0, 'Project': 0 };
        let modules = {};
        let teamsMap = {};

        const resolvedTicketsList = [];
        const criticalRisksList = [];
        const pendingItemsList = [];
        const openBacklogList = [];

        tickets.forEach(t => {
            const createdDate = new Date(t.created_at);
            const isCreatedInPeriod = createdDate >= start && createdDate <= end;
            
            if (isCreatedInPeriod) newTickets++;
            
            let isResolvedInPeriod = false;
            if (t.status === 'Resolved' || t.status === 'Closed') {
                if (t.resolved_at) {
                    const resDate = new Date(t.resolved_at);
                    if (resDate >= start && resDate <= end) {
                        resolvedTickets++;
                        isResolvedInPeriod = true;
                        resolvedTicketsList.push(t);
                    }
                }
            }
            if (t.status === 'Closed') {
                if (t.closed_at) {
                    const closeDate = new Date(t.closed_at);
                    if (closeDate >= start && closeDate <= end) {
                        closedTickets++;
                        if (!isResolvedInPeriod) resolvedTicketsList.push(t);
                    }
                }
            }

            if (t.status !== 'Closed' && t.status !== 'Resolved') {
                currentlyOpen++;
                const p = t.priority || 'Medium';
                if (priorities[p] !== undefined) priorities[p]++;
                else priorities[p] = 1;

                if (t.oracle_modules?.name) {
                    modules[t.oracle_modules.name] = (modules[t.oracle_modules.name] || 0) + 1;
                }
                const teamName = t.assigned_to ? userTeamMap[t.assigned_to] : 'Unassigned';
                if (teamName) {
                    teamsMap[teamName] = (teamsMap[teamName] || 0) + 1;
                }

                // Check for risks
                if (t.priority === 'Critical' || t.priority === 'High' || t.priority === 'Top') {
                    criticalRisksList.push(t);
                }

                // Check for pending
                if (t.status === 'In Progress' || t.status === 'Awaiting Customer' || t.status === 'Pending Approval') {
                    pendingItemsList.push(t);
                }

                openBacklogList.push(t);
            }
        });

        // Real-time generated activity text
        let autoKeyActivities = '';
        if (resolvedTicketsList.length > 0) {
            autoKeyActivities = `Completed & resolved ${resolvedTicketsList.length} support requests this period:\n` +
                resolvedTicketsList.slice(0, 5).map(t => `• [${t.ticket_number || 'TICKET'}] ${t.title || 'Untitled'} (${t.oracle_modules?.name || 'General'}) - Solution verified.`).join('\n');
            if (resolvedTicketsList.length > 5) {
                autoKeyActivities += `\n• ...and ${resolvedTicketsList.length - 5} more items resolved.`;
            }
        } else {
            autoKeyActivities = `Zero ticket resolutions recorded in this specific time window. Team actively working on ${currentlyOpen} in-progress backlog tickets.`;
        }

        let autoRisksBlockers = '';
        if (criticalRisksList.length > 0) {
            autoRisksBlockers = `Active High/Critical items requiring management monitoring (${criticalRisksList.length}):\n` +
                criticalRisksList.map(t => `• [${t.ticket_number || 'TICKET'}] (${t.priority}) ${t.title || 'Issue'} - Assigned to ${t.assigned_to ? (userTeamMap[t.assigned_to] || 'Engineer') : 'Triage Queue'}`).join('\n');
        } else {
            autoRisksBlockers = `No active Critical/High priority operational blockers. SLA compliance within standard parameters.`;
        }

        let autoPendingItems = '';
        if (pendingItemsList.length > 0) {
            autoPendingItems = `Current active work in progress & pending items (${pendingItemsList.length}):\n` +
                pendingItemsList.slice(0, 5).map(t => `• [${t.ticket_number || 'TICKET'}] Status: ${t.status} - ${t.title || 'Support item'}`).join('\n');
            if (pendingItemsList.length > 5) {
                autoPendingItems += `\n• ...and ${pendingItemsList.length - 5} more items in progress.`;
            }
        } else {
            autoPendingItems = `No pending client validations or blocked items.`;
        }

        let autoNextActions = '';
        if (currentlyOpen > 0) {
            const highCount = (priorities['Critical'] || 0) + (priorities['High'] || 0) + (priorities['Top'] || 0);
            autoNextActions = `1. Prioritize resolution for ${highCount > 0 ? highCount + ' Critical/High priority tickets' : 'active backlog tickets'}.\n` +
                `2. Complete functional validation across ${Object.keys(modules).length > 0 ? Object.keys(modules).join(', ') : 'assigned modules'}.\n` +
                `3. Conduct weekly operational sync with client stakeholders.`;
        } else {
            autoNextActions = `Continue proactive system monitoring and standard ticket intake.`;
        }

        const metricsData = {
            newTickets,
            resolvedTickets,
            closedTickets,
            currentlyOpen,
            priorities,
            modules,
            teamsMap,
            autoKeyActivities,
            autoRisksBlockers,
            autoPendingItems,
            autoNextActions
        };

        res.json({ metrics: metricsData });
    } catch (err) {
        console.error('Error generating WSR metrics:', err);
        res.status(500).json({ error: err.message || 'Failed to generate WSR metrics' });
    }
};

const aiSummarizeWSR = async (req, res) => {
    try {
        const { metrics } = req.body;
        if (!generateWSRSummary) {
            return res.status(500).json({ error: 'AI Service generateWSRSummary not defined' });
        }
        
        const summary = await generateWSRSummary(metrics);
        res.json({ summary });
    } catch (err) {
        console.error('Error generating AI WSR summary:', err);
        res.status(500).json({ error: 'Failed to generate AI summary' });
    }
};

const generateBCSAIContent = async (req, res) => {
    try {
        const { company, project_name } = req.body;
        if (!company) return res.status(400).json({ error: 'company is required' });

        // Fetch all tickets for this company with module/team info and description
        const [ticketsRes, usersRes] = await Promise.all([
            supabase
                .from('tickets')
                .select('id, ticket_number, title, description, status, priority, business_impact, created_at, resolved_at, closed_at, company, oracle_module_id, oracle_modules(name), assigned_to')
                .ilike('company', company)
                .order('created_at', { ascending: false })
                .limit(100),
            supabase
                .from('users')
                .select('id, full_name, teams(name)')
        ]);

        if (ticketsRes.error) throw ticketsRes.error;

        const tickets = ticketsRes.data || [];
        const usersList = usersRes.data || [];

        const userTeamMap = {};
        usersList.forEach(u => { if (u.id && u.teams?.name) userTeamMap[u.id] = u.teams.name; });

        // Fetch comments for these tickets to extract real work notes & solutions
        const ticketIds = tickets.map(t => t.id);
        const commentsByTicket = {};
        if (ticketIds.length > 0) {
            try {
                const { data: commentsData } = await supabase
                    .from('ticket_comments')
                    .select('ticket_id, comment_text, created_at')
                    .in('ticket_id', ticketIds)
                    .order('created_at', { ascending: false });

                (commentsData || []).forEach(c => {
                    if (!commentsByTicket[c.ticket_id]) commentsByTicket[c.ticket_id] = [];
                    commentsByTicket[c.ticket_id].push(c.comment_text);
                });
            } catch (cErr) {
                console.warn('Could not fetch ticket comments for BCS AI:', cErr.message);
            }
        }

        // Normalize ticket data for AI including comments and full descriptions
        const normalizedTickets = tickets.map(t => ({
            ticket_number: t.ticket_number,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            business_impact: t.business_impact,
            module: t.oracle_modules?.name || 'General',
            team: t.assigned_to ? (userTeamMap[t.assigned_to] || 'Engineer') : 'Unassigned',
            created_at: t.created_at,
            comments: commentsByTicket[t.id] || []
        }));

        const modules = [...new Set(normalizedTickets.map(t => t.module).filter(m => m && m !== 'General'))];
        const teams = [...new Set(normalizedTickets.map(t => t.team).filter(t => t && t !== 'Unassigned'))];
        const oldest = tickets.length > 0 ? new Date(tickets[tickets.length - 1].created_at).toLocaleDateString() : 'Inception';
        const newest = tickets.length > 0 ? new Date(tickets[0].created_at).toLocaleDateString() : 'Present';

        const liveData = {
            account_name: company,
            project_name: project_name || 'Oracle Support',
            tickets: normalizedTickets,
            modules,
            teams,
            dateRange: `${oldest} – ${newest}`
        };

        const content = await generateBCSContent(liveData);
        if (!content) return res.status(500).json({ error: 'AI generation returned no content' });

        res.json({ content });
    } catch (err) {
        console.error('Error generating BCS AI content:', err);
        res.status(500).json({ error: err.message || 'Failed to generate BCS content' });
    }
};

module.exports = {
    getBusinessCases,
    getBusinessCaseById,
    saveBusinessCase,
    getWsrDrafts,
    saveWsrDraft,
    generateWSRMetrics,
    aiSummarizeWSR,
    generateBCSAIContent
};
