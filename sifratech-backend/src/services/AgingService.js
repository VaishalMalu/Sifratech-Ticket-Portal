/**
 * AgingService.js
 * 
 * Central Source of Truth for Ticket Aging & On-Hold Calculations.
 * 
 * Aging Logic:
 * 1. When ACTIVE -> ON HOLD: Aging displays 0 and stops aging.
 * 2. While ON HOLD: Aging remains 0; no timer/polling increments it.
 * 3. When ON HOLD -> ACTIVE/IN PROGRESS: Resumes from previous active aging.
 * 4. Excludes complete ON HOLD duration from aging.
 * 5. Supports multiple ON HOLD periods.
 * 6. Historical dates/timestamps are strictly preserved (never overwritten).
 */

function isOnHoldStatus(status) {
    return typeof status === 'string' && status.trim().toUpperCase() === 'ON HOLD';
}

function isPausedStatus(status) {
    if (!status) return false;
    const s = status.trim();
    return isOnHoldStatus(s) || ['Awaiting Customer', 'Resolved', 'Closed'].includes(s);
}

/**
 * Calculates ticket aging in hours, days, and milliseconds.
 * 
 * @param {Object} ticket - Ticket object containing created_at, status, etc.
 * @param {Array} history - Array of ticket_status_history records
 * @param {Date|string|number} [referenceTime] - Optional reference time (defaults to current time)
 * @returns {Object} { agingHours, agingDays, isOnHold, activeDurationMs, onHoldDurationMs, status }
 */
function calculateTicketAging(ticket, history = [], referenceTime = new Date()) {
    if (!ticket) {
        return { agingHours: 0, agingDays: 0, isOnHold: false, activeDurationMs: 0, onHoldDurationMs: 0, status: 'Open' };
    }

    const currentStatus = ticket.status || 'Open';
    const currentIsOnHold = isOnHoldStatus(currentStatus);

    // Rule 1 & 2: While ON HOLD, aging is 0
    if (currentIsOnHold) {
        // Calculate historical on-hold duration for metrics/audit if needed, but display aging is 0
        let totalOnHoldMs = 0;
        const auditLogs = history || ticket.auditLog || ticket.ticket_status_history || [];
        const sortedLogs = [...auditLogs].sort((a, b) => {
            const timeA = new Date(a.created_at || a.ts).getTime();
            const timeB = new Date(b.created_at || b.ts).getTime();
            return timeA - timeB;
        });

        let lastOnHoldStart = null;
        for (const log of sortedLogs) {
            const status = log.new_status || log.newStatus;
            const logTime = new Date(log.created_at || log.ts).getTime();
            if (isNaN(logTime)) continue;

            if (isOnHoldStatus(status)) {
                if (lastOnHoldStart === null) lastOnHoldStart = logTime;
            } else if (lastOnHoldStart !== null && !isOnHoldStatus(status)) {
                totalOnHoldMs += Math.max(0, logTime - lastOnHoldStart);
                lastOnHoldStart = null;
            }
        }
        const nowTime = new Date(referenceTime).getTime();
        if (lastOnHoldStart !== null) {
            totalOnHoldMs += Math.max(0, nowTime - lastOnHoldStart);
        }

        return {
            agingHours: 0,
            agingDays: 0,
            isOnHold: true,
            activeDurationMs: 0,
            onHoldDurationMs: totalOnHoldMs,
            status: currentStatus
        };
    }

    const createdAtStr = ticket.created_at || ticket.createdAt;
    if (!createdAtStr) {
        return { agingHours: 0, agingDays: 0, isOnHold: false, activeDurationMs: 0, onHoldDurationMs: 0, status: currentStatus };
    }

    const createdTime = new Date(createdAtStr).getTime();
    if (isNaN(createdTime)) {
        return { agingHours: 0, agingDays: 0, isOnHold: false, activeDurationMs: 0, onHoldDurationMs: 0, status: currentStatus };
    }

    const nowTime = new Date(referenceTime).getTime();
    const auditLogs = history || ticket.auditLog || ticket.ticket_status_history || [];

    // If no history logs exist, default to duration from creation unless currently paused
    if (!auditLogs || auditLogs.length === 0) {
        if (isPausedStatus(currentStatus)) {
            return { agingHours: 0, agingDays: 0, isOnHold: false, activeDurationMs: 0, onHoldDurationMs: 0, status: currentStatus };
        }
        const totalMs = Math.max(0, nowTime - createdTime);
        const hours = Math.round(totalMs / 36e5);
        return {
            agingHours: hours,
            agingDays: Math.max(0, Math.round(hours / 24)),
            isOnHold: false,
            activeDurationMs: totalMs,
            onHoldDurationMs: 0,
            status: currentStatus
        };
    }

    // Sort logs chronologically
    const sortedLogs = [...auditLogs].sort((a, b) => {
        const timeA = new Date(a.created_at || a.ts).getTime();
        const timeB = new Date(b.created_at || b.ts).getTime();
        return timeA - timeB;
    });

    let totalActiveMs = 0;
    let totalOnHoldMs = 0;
    let lastActiveTimestamp = createdTime;
    let lastOnHoldTimestamp = null;
    let isCurrentlyActive = true;

    for (const log of sortedLogs) {
        let status = log.new_status || log.newStatus;
        if (!status && log.comments) {
            if (log.comments.includes('Status updated to')) {
                status = log.comments.split('Status updated to')[1].trim();
            } else if (log.comments.includes('Status changed from')) {
                status = log.comments.split('to')[1].trim();
            }
        }

        if (status && status !== 'Any') {
            const logTime = new Date(log.created_at || log.ts).getTime();
            if (isNaN(logTime)) continue;

            const logIsOnHold = isOnHoldStatus(status);
            const logIsPaused = isPausedStatus(status);

            if (isCurrentlyActive && logIsPaused) {
                // Active -> Paused / On Hold: Accumulate time since last active
                totalActiveMs += Math.max(0, logTime - lastActiveTimestamp);
                isCurrentlyActive = false;
                if (logIsOnHold) {
                    lastOnHoldTimestamp = logTime;
                }
            } else if (!isCurrentlyActive && !logIsPaused) {
                // Paused / On Hold -> Active (Resume): Accumulate on-hold time and restart active clock
                if (lastOnHoldTimestamp !== null) {
                    totalOnHoldMs += Math.max(0, logTime - lastOnHoldTimestamp);
                    lastOnHoldTimestamp = null;
                }
                lastActiveTimestamp = logTime;
                isCurrentlyActive = true;
            } else if (!isCurrentlyActive && logIsPaused) {
                // Transition between paused states
                if (logIsOnHold && lastOnHoldTimestamp === null) {
                    lastOnHoldTimestamp = logTime;
                } else if (!logIsOnHold && lastOnHoldTimestamp !== null) {
                    totalOnHoldMs += Math.max(0, logTime - lastOnHoldTimestamp);
                    lastOnHoldTimestamp = null;
                }
            }
        }
    }

    if (isCurrentlyActive) {
        totalActiveMs += Math.max(0, nowTime - lastActiveTimestamp);
    } else if (lastOnHoldTimestamp !== null) {
        totalOnHoldMs += Math.max(0, nowTime - lastOnHoldTimestamp);
    }

    if (totalActiveMs < 0) totalActiveMs = 0;

    const agingHours = Math.round(totalActiveMs / 36e5);
    const agingDays = Math.max(0, Math.round(agingHours / 24));

    return {
        agingHours,
        agingDays,
        isOnHold: false,
        activeDurationMs: totalActiveMs,
        onHoldDurationMs: totalOnHoldMs,
        status: currentStatus
    };
}

module.exports = {
    isOnHoldStatus,
    isPausedStatus,
    calculateTicketAging
};
