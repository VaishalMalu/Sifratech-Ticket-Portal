const test = require('node:test');
const assert = require('node:assert');
const { calculateTicketAging, isOnHoldStatus, isPausedStatus } = require('../src/services/AgingService');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

test('Status Detection: isOnHoldStatus and isPausedStatus', () => {
    assert.strictEqual(isOnHoldStatus('On Hold'), true);
    assert.strictEqual(isOnHoldStatus('ON HOLD'), true);
    assert.strictEqual(isOnHoldStatus('on hold'), true);
    assert.strictEqual(isOnHoldStatus('In Progress'), false);
    assert.strictEqual(isOnHoldStatus('Open'), false);
    assert.strictEqual(isOnHoldStatus(null), false);

    assert.strictEqual(isPausedStatus('On Hold'), true);
    assert.strictEqual(isPausedStatus('Awaiting Customer'), true);
    assert.strictEqual(isPausedStatus('Resolved'), true);
    assert.strictEqual(isPausedStatus('Closed'), true);
    assert.strictEqual(isPausedStatus('In Progress'), false);
});

test('Scenario 1: Active -> ON HOLD (Display Aging = 0 and stop aging)', () => {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const t1 = new Date(t0.getTime() + 5 * MS_PER_DAY); // 5 days later

    const ticket = {
        id: 'ticket-1',
        created_at: t0.toISOString(),
        status: 'On Hold' // Moved to ON HOLD at t1
    };

    const history = [
        {
            created_at: t0.toISOString(),
            old_status: 'None',
            new_status: 'In Progress'
        },
        {
            created_at: t1.toISOString(),
            old_status: 'In Progress',
            new_status: 'On Hold'
        }
    ];

    // Check aging at transition time (t1)
    const resultAtT1 = calculateTicketAging(ticket, history, t1);
    assert.strictEqual(resultAtT1.agingHours, 0, 'Aging hours must be 0 while ON HOLD');
    assert.strictEqual(resultAtT1.agingDays, 0, 'Aging days must be 0 while ON HOLD');
    assert.strictEqual(resultAtT1.isOnHold, true);

    // Verify historical created_at was NOT modified or overwritten with 0
    assert.strictEqual(ticket.created_at, t0.toISOString());
});

test('Scenario 2: Resume after ON HOLD (5 days active -> 3 days ON HOLD -> 2 days active = Aging 7 days)', () => {
    const t0 = new Date('2026-01-01T00:00:00Z'); // Created (Active)
    const t1 = new Date(t0.getTime() + 5 * MS_PER_DAY); // 5 days active -> ON HOLD
    const t2 = new Date(t1.getTime() + 3 * MS_PER_DAY); // 3 days ON HOLD -> Resumed to In Progress
    const t3 = new Date(t2.getTime() + 2 * MS_PER_DAY); // 2 days active after resume

    const ticket = {
        id: 'ticket-2',
        created_at: t0.toISOString(),
        status: 'In Progress'
    };

    const history = [
        {
            created_at: t0.toISOString(),
            old_status: 'None',
            new_status: 'In Progress'
        },
        {
            created_at: t1.toISOString(),
            old_status: 'In Progress',
            new_status: 'On Hold'
        },
        {
            created_at: t2.toISOString(),
            old_status: 'On Hold',
            new_status: 'In Progress'
        }
    ];

    // At the exact moment of resume (t2): aging should equal previous active aging (5 days = 120 hours)
    const resultAtResume = calculateTicketAging(ticket, history, t2);
    assert.strictEqual(resultAtResume.agingDays, 5, 'Should resume exactly from previous 5 active days');
    assert.strictEqual(resultAtResume.agingHours, 120);
    assert.strictEqual(resultAtResume.isOnHold, false);
    assert.strictEqual(resultAtResume.onHoldDurationMs, 3 * MS_PER_DAY, 'ON HOLD duration should be 3 days');

    // 2 days active after resume (t3): total active aging should be 5 + 2 = 7 days (168 hours)
    const resultAtT3 = calculateTicketAging(ticket, history, t3);
    assert.strictEqual(resultAtT3.agingDays, 7, 'Aging must be 7 days (5 active + 2 active, excluding 3 days on hold)');
    assert.strictEqual(resultAtT3.agingHours, 168);
    assert.strictEqual(resultAtT3.onHoldDurationMs, 3 * MS_PER_DAY);
});

test('Scenario 3: Multiple ON HOLD periods (e.g. 5d active -> 3d hold -> 2d active -> 4d hold -> 1d active = 8d aging)', () => {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const t1 = new Date(t0.getTime() + 5 * MS_PER_DAY); // +5d active
    const t2 = new Date(t1.getTime() + 3 * MS_PER_DAY); // +3d hold
    const t3 = new Date(t2.getTime() + 2 * MS_PER_DAY); // +2d active
    const t4 = new Date(t3.getTime() + 4 * MS_PER_DAY); // +4d hold
    const t5 = new Date(t4.getTime() + 1 * MS_PER_DAY); // +1d active

    const ticketOnHold2 = {
        id: 'ticket-multi',
        created_at: t0.toISOString(),
        status: 'On Hold'
    };

    const historyPeriod1And2 = [
        { created_at: t0.toISOString(), new_status: 'In Progress' },
        { created_at: t1.toISOString(), new_status: 'On Hold' },
        { created_at: t2.toISOString(), new_status: 'In Progress' },
        { created_at: t3.toISOString(), new_status: 'On Hold' }
    ];

    // During second ON HOLD period: aging must remain 0
    const checkDuringHold2 = calculateTicketAging(ticketOnHold2, historyPeriod1And2, new Date(t3.getTime() + 2 * MS_PER_DAY));
    assert.strictEqual(checkDuringHold2.agingDays, 0, 'Aging must be 0 while in second ON HOLD');
    assert.strictEqual(checkDuringHold2.isOnHold, true);

    // After second resume (+1d active at t5)
    const ticketActiveFinal = {
        id: 'ticket-multi',
        created_at: t0.toISOString(),
        status: 'In Progress'
    };

    const historyComplete = [
        ...historyPeriod1And2,
        { created_at: t4.toISOString(), new_status: 'In Progress' }
    ];

    const resultFinal = calculateTicketAging(ticketActiveFinal, historyComplete, t5);
    // Expected active: 5d + 2d + 1d = 8 days (192 hours)
    // Excluded on hold: 3d + 4d = 7 days
    assert.strictEqual(resultFinal.agingDays, 8, 'Aging must sum all active intervals and exclude all ON HOLD intervals');
    assert.strictEqual(resultFinal.agingHours, 192);
    assert.strictEqual(resultFinal.onHoldDurationMs, 7 * MS_PER_DAY, 'Total ON HOLD duration should be 7 days');
});

test('Scenario 4: Refresh while ON HOLD (Aging remains 0, no timer/polling drift)', () => {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const t1 = new Date(t0.getTime() + 2 * MS_PER_DAY);

    const ticket = {
        id: 'ticket-hold-refresh',
        created_at: t0.toISOString(),
        status: 'On Hold'
    };

    const history = [
        { created_at: t0.toISOString(), new_status: 'Open' },
        { created_at: t1.toISOString(), new_status: 'On Hold' }
    ];

    // Multiple refreshes across hours and days
    const refresh1 = calculateTicketAging(ticket, history, new Date(t1.getTime() + 1 * MS_PER_HOUR));
    const refresh2 = calculateTicketAging(ticket, history, new Date(t1.getTime() + 24 * MS_PER_HOUR));
    const refresh3 = calculateTicketAging(ticket, history, new Date(t1.getTime() + 10 * MS_PER_DAY));

    assert.strictEqual(refresh1.agingDays, 0);
    assert.strictEqual(refresh1.agingHours, 0);
    assert.strictEqual(refresh2.agingDays, 0);
    assert.strictEqual(refresh2.agingHours, 0);
    assert.strictEqual(refresh3.agingDays, 0);
    assert.strictEqual(refresh3.agingHours, 0);
});

test('Scenario 5: Refresh after resume (Aging increments only by elapsed active time)', () => {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const t1 = new Date(t0.getTime() + 3 * MS_PER_DAY); // 3 days active
    const t2 = new Date(t1.getTime() + 5 * MS_PER_DAY); // 5 days ON HOLD
    // Resumed at t2

    const ticket = {
        id: 'ticket-resume-refresh',
        created_at: t0.toISOString(),
        status: 'In Progress'
    };

    const history = [
        { created_at: t0.toISOString(), new_status: 'In Progress' },
        { created_at: t1.toISOString(), new_status: 'On Hold' },
        { created_at: t2.toISOString(), new_status: 'In Progress' }
    ];

    // Refresh 1 hour after resume: 3 days + 1 hour
    const ref1 = calculateTicketAging(ticket, history, new Date(t2.getTime() + 1 * MS_PER_HOUR));
    assert.strictEqual(ref1.agingHours, 73); // 3*24 + 1 = 73 hours
    assert.strictEqual(ref1.agingDays, 3);

    // Refresh 24 hours after resume: 3 days + 1 day = 4 days
    const ref2 = calculateTicketAging(ticket, history, new Date(t2.getTime() + 24 * MS_PER_HOUR));
    assert.strictEqual(ref2.agingHours, 96); // 4*24 = 96 hours
    assert.strictEqual(ref2.agingDays, 4);

    // Refresh 48 hours after resume: 3 days + 2 days = 5 days
    const ref3 = calculateTicketAging(ticket, history, new Date(t2.getTime() + 48 * MS_PER_HOUR));
    assert.strictEqual(ref3.agingHours, 120); // 5*24 = 120 hours
    assert.strictEqual(ref3.agingDays, 5);
});

test('Scenario 6: Preserves historical ticket created_at without overwrite', () => {
    const originalCreatedAt = '2025-11-15T08:30:00.000Z';
    const ticket = {
        id: 'historical-ticket',
        created_at: originalCreatedAt,
        status: 'ON HOLD'
    };

    const result = calculateTicketAging(ticket, []);
    assert.strictEqual(result.agingDays, 0);
    assert.strictEqual(ticket.created_at, originalCreatedAt, 'Original created_at must never be overwritten');
});

test('Scenario 7: Backward Compatibility (Existing tickets without ON HOLD behave as before)', () => {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const tNow = new Date(t0.getTime() + 48 * MS_PER_HOUR); // 2 days later

    const standardTicket = {
        id: 'standard-ticket',
        created_at: t0.toISOString(),
        status: 'Open'
    };

    const result = calculateTicketAging(standardTicket, [], tNow);
    assert.strictEqual(result.agingHours, 48);
    assert.strictEqual(result.agingDays, 2);
    assert.strictEqual(result.isOnHold, false);
});
