const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabaseClient');
const { calculateTicketAging, isOnHoldStatus } = require('../services/AgingService');

// POST /api/tickets/calculate-aging
// Calculate aging for provided ticket and history payload (stateless calculation)
router.post('/calculate-aging', (req, res) => {
    try {
        const { ticket, history, referenceTime } = req.body;
        if (!ticket) {
            return res.status(400).json({ error: 'ticket object is required' });
        }
        const result = calculateTicketAging(ticket, history || [], referenceTime);
        res.json(result);
    } catch (err) {
        console.error('Error calculating ticket aging:', err);
        res.status(500).json({ error: 'Failed to calculate ticket aging', details: err.message });
    }
});

// GET /api/tickets/:id/aging
// Fetch ticket and status history from Supabase and return calculated aging
router.get('/:id/aging', async (req, res) => {
    try {
        const { id } = req.params;
        const [ticketRes, historyRes] = await Promise.all([
            supabase.from('tickets').select('*').eq('id', id).single(),
            supabase.from('ticket_status_history').select('*').eq('ticket_id', id).order('created_at', { ascending: true })
        ]);

        if (ticketRes.error) {
            return res.status(404).json({ error: 'Ticket not found', details: ticketRes.error.message });
        }

        const ticket = ticketRes.data;
        const history = historyRes.data || [];
        const aging = calculateTicketAging(ticket, history);

        res.json({
            ticketId: ticket.id,
            ticketNumber: ticket.ticket_number,
            status: ticket.status,
            ...aging
        });
    } catch (err) {
        console.error('Error fetching ticket aging:', err);
        res.status(500).json({ error: 'Failed to fetch ticket aging', details: err.message });
    }
});

// PATCH /api/tickets/:id/status
// Update ticket status, append to ticket_status_history, and return updated aging
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments, changedBy } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }

        // Fetch current ticket
        const { data: ticket, error: fetchError } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const oldStatus = ticket.status;
        const updateData = { status };

        if (status === 'Closed') {
            updateData.closed_at = new Date().toISOString();
            if (changedBy) updateData.closed_by = changedBy;
        } else if (status !== 'Resolved') {
            updateData.closed_at = null;
            updateData.closed_by = null;
            updateData.resolved_at = null;
            updateData.resolved_by = null;
        }

        // Update tickets table
        const { data: updatedTicket, error: updateError } = await supabase
            .from('tickets')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Record history
        const historyEntry = {
            ticket_id: id,
            old_status: oldStatus,
            new_status: status,
            comments: comments || `Status updated to ${status}`
        };
        if (changedBy) historyEntry.changed_by = changedBy;

        await supabase.from('ticket_status_history').insert([historyEntry]);

        // Fetch updated history to calculate new aging
        const { data: history } = await supabase
            .from('ticket_status_history')
            .select('*')
            .eq('ticket_id', id)
            .order('created_at', { ascending: true });

        const aging = calculateTicketAging(updatedTicket, history || []);

        res.json({
            ticket: updatedTicket,
            aging
        });
    } catch (err) {
        console.error('Error updating ticket status:', err);
        res.status(500).json({ error: 'Failed to update ticket status', details: err.message });
    }
});

module.exports = router;
