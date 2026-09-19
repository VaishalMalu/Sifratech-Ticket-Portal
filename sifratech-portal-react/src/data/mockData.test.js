import test from 'node:test';
import assert from 'node:assert';
import { calculateTicketAging, age, isOnHoldStatus, bc } from './mockData.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

test('Frontend Status Detection and Badge Class', () => {
  assert.strictEqual(isOnHoldStatus('On Hold'), true);
  assert.strictEqual(isOnHoldStatus('ON HOLD'), true);
  assert.strictEqual(isOnHoldStatus('In Progress'), false);
  assert.strictEqual(bc('On Hold', 's'), 'b-onhold');
  assert.strictEqual(bc('ON HOLD', 's'), 'b-onhold');
  assert.strictEqual(bc('In Progress', 's'), 'b-inprogress');
});

test('Scenario 1: Active -> ON HOLD (Display Aging = 0 and stop aging)', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const t1 = new Date(t0.getTime() + 5 * MS_PER_DAY);

  const ticket = {
    id: 't-1',
    createdAt: t0.toISOString(),
    status: 'On Hold',
    auditLog: [
      { ts: t0.toISOString(), newStatus: 'In Progress' },
      { ts: t1.toISOString(), newStatus: 'On Hold' }
    ]
  };

  const agingHours = age(ticket, t1);
  const agingDays = Math.max(0, Math.round(agingHours / 24));
  assert.strictEqual(agingHours, 0, 'Aging hours must be 0 while ON HOLD');
  assert.strictEqual(agingDays, 0, 'Aging days must be 0 while ON HOLD');
  assert.strictEqual(ticket.createdAt, t0.toISOString(), 'Historical createdAt must not be overwritten');
});

test('Scenario 2: Resume after ON HOLD (5d active -> 3d ON HOLD -> 2d active = Aging 7 days)', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const t1 = new Date(t0.getTime() + 5 * MS_PER_DAY); // 5 days active -> ON HOLD
  const t2 = new Date(t1.getTime() + 3 * MS_PER_DAY); // 3 days ON HOLD -> Resumed
  const t3 = new Date(t2.getTime() + 2 * MS_PER_DAY); // 2 days active after resume

  const ticket = {
    id: 't-2',
    createdAt: t0.toISOString(),
    status: 'In Progress',
    auditLog: [
      { ts: t0.toISOString(), newStatus: 'In Progress' },
      { ts: t1.toISOString(), newStatus: 'On Hold' },
      { ts: t2.toISOString(), newStatus: 'In Progress' }
    ]
  };

  // At resume moment (t2): resumes from 5 days (120 hours)
  const hoursAtResume = age(ticket, t2);
  assert.strictEqual(Math.max(0, Math.round(hoursAtResume / 24)), 5);
  assert.strictEqual(hoursAtResume, 120);

  // 2 days active after resume (t3): 5 + 2 = 7 days (168 hours)
  const hoursAtT3 = age(ticket, t3);
  assert.strictEqual(Math.max(0, Math.round(hoursAtT3 / 24)), 7);
  assert.strictEqual(hoursAtT3, 168);
});

test('Scenario 3: Multiple ON HOLD periods (5d active -> 3d hold -> 2d active -> 4d hold -> 1d active = 8d aging)', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const t1 = new Date(t0.getTime() + 5 * MS_PER_DAY);
  const t2 = new Date(t1.getTime() + 3 * MS_PER_DAY);
  const t3 = new Date(t2.getTime() + 2 * MS_PER_DAY);
  const t4 = new Date(t3.getTime() + 4 * MS_PER_DAY);
  const t5 = new Date(t4.getTime() + 1 * MS_PER_DAY);

  const ticketHold2 = {
    id: 't-multi',
    createdAt: t0.toISOString(),
    status: 'On Hold',
    auditLog: [
      { ts: t0.toISOString(), newStatus: 'In Progress' },
      { ts: t1.toISOString(), newStatus: 'On Hold' },
      { ts: t2.toISOString(), newStatus: 'In Progress' },
      { ts: t3.toISOString(), newStatus: 'On Hold' }
    ]
  };

  // During 2nd ON HOLD: aging is 0
  assert.strictEqual(age(ticketHold2, new Date(t3.getTime() + 2 * MS_PER_DAY)), 0);

  const ticketActiveFinal = {
    id: 't-multi',
    createdAt: t0.toISOString(),
    status: 'In Progress',
    auditLog: [
      { ts: t0.toISOString(), newStatus: 'In Progress' },
      { ts: t1.toISOString(), newStatus: 'On Hold' },
      { ts: t2.toISOString(), newStatus: 'In Progress' },
      { ts: t3.toISOString(), newStatus: 'On Hold' },
      { ts: t4.toISOString(), newStatus: 'In Progress' }
    ]
  };

  const finalHours = age(ticketActiveFinal, t5);
  // Total active: 5d + 2d + 1d = 8 days (192 hours)
  assert.strictEqual(Math.max(0, Math.round(finalHours / 24)), 8);
  assert.strictEqual(finalHours, 192);
});

test('Scenario 4: Refresh while ON HOLD (Aging remains 0)', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const t1 = new Date(t0.getTime() + 2 * MS_PER_DAY);

  const ticket = {
    id: 't-hold',
    createdAt: t0.toISOString(),
    status: 'On Hold',
    auditLog: [
      { ts: t0.toISOString(), newStatus: 'Open' },
      { ts: t1.toISOString(), newStatus: 'On Hold' }
    ]
  };

  assert.strictEqual(age(ticket, new Date(t1.getTime() + 2 * MS_PER_HOUR)), 0);
  assert.strictEqual(age(ticket, new Date(t1.getTime() + 48 * MS_PER_HOUR)), 0);
  assert.strictEqual(age(ticket, new Date(t1.getTime() + 10 * MS_PER_DAY)), 0);
});

test('Scenario 5: Refresh after resume (Aging increments only by active elapsed time)', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const t1 = new Date(t0.getTime() + 3 * MS_PER_DAY); // 3 days active
  const t2 = new Date(t1.getTime() + 5 * MS_PER_DAY); // 5 days ON HOLD

  const ticket = {
    id: 't-resume',
    createdAt: t0.toISOString(),
    status: 'In Progress',
    auditLog: [
      { ts: t0.toISOString(), newStatus: 'In Progress' },
      { ts: t1.toISOString(), newStatus: 'On Hold' },
      { ts: t2.toISOString(), newStatus: 'In Progress' }
    ]
  };

  // 1 hr after resume: 3d + 1hr = 73 hrs
  assert.strictEqual(age(ticket, new Date(t2.getTime() + 1 * MS_PER_HOUR)), 73);
  // 24 hrs after resume: 3d + 1d = 4d = 96 hrs
  assert.strictEqual(age(ticket, new Date(t2.getTime() + 24 * MS_PER_HOUR)), 96);
});

test('Scenario 6: Backward Compatibility (Standard ticket without ON HOLD)', () => {
  const t0 = new Date('2026-01-01T00:00:00Z');
  const ticket = {
    id: 't-standard',
    createdAt: t0.toISOString(),
    status: 'Open'
  };

  const hours = age(ticket, new Date(t0.getTime() + 24 * MS_PER_HOUR));
  assert.strictEqual(hours, 24);
  assert.strictEqual(Math.max(0, Math.round(hours / 24)), 1);
});
