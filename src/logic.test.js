import test from 'node:test';
import assert from 'node:assert/strict';
import { moveOpp, addNote, addTask, toggleTask, addOpportunity, openValue, wonThisMonth, dueTasks, lossReasons, isoDay, daysFromNow } from './logic.js';

const base = () => ({
  contacts: [{ id: 'c1', name: 'A' }],
  opps: [
    { id: 'o1', contactId: 'c1', title: 'X', value: 1000, stage: 'new', lostReason: '', wonAt: '', log: [] },
    { id: 'o2', contactId: 'c1', title: 'Y', value: 2000, stage: 'quote', lostReason: '', wonAt: '', log: [] },
  ],
  tasks: [],
});
const NOW = new Date('2026-10-09T10:00:00Z');

test('moving to lost requires a reason', () => {
  const s = base();
  assert.equal(moveOpp(s, 'o1', 'lost', '  '), s);
  const m = moveOpp(s, 'o1', 'lost', 'Too expensive', NOW);
  assert.equal(m.opps[0].stage, 'lost');
  assert.equal(m.opps[0].lostReason, 'Too expensive');
});

test('every move is logged, no-ops change nothing', () => {
  const s = base();
  assert.equal(moveOpp(s, 'o1', 'new'), s);
  assert.equal(moveOpp(s, 'nope', 'won'), s);
  assert.equal(moveOpp(s, 'o1', 'bogus'), s);
  const m = moveOpp(s, 'o1', 'visit', '', NOW);
  assert.deepEqual([m.opps[0].log[0].from, m.opps[0].log[0].to], ['new', 'visit']);
});

test('leaving lost clears the reason; won sets wonAt', () => {
  let s = moveOpp(base(), 'o1', 'lost', 'No budget', NOW);
  s = moveOpp(s, 'o1', 'won', '', NOW);
  assert.equal(s.opps[0].lostReason, '');
  assert.ok(s.opps[0].wonAt);
  s = moveOpp(s, 'o1', 'quote', '', NOW);
  assert.equal(s.opps[0].wonAt, '');
});

test('does not mutate the input state', () => {
  const s = base();
  const snap = JSON.stringify(s);
  moveOpp(s, 'o1', 'won', '', NOW); addNote(s, 'o1', 'hi', NOW); addTask(s, 'o1', 't', '2026-10-10');
  assert.equal(JSON.stringify(s), snap);
});

test('notes: trimmed, empty rejected', () => {
  const s = base();
  assert.equal(addNote(s, 'o1', '   '), s);
  assert.equal(addNote(s, 'o1', ' call back ', NOW).opps[0].log[0].text, 'call back');
});

test('tasks: need text and a valid date; toggle works', () => {
  const s = base();
  assert.equal(addTask(s, 'o1', '', '2026-10-10'), s);
  assert.equal(addTask(s, 'o1', 'x', '10/10/2026'), s);
  const a = addTask(s, 'o1', 'Call', '2026-10-10');
  assert.equal(a.tasks.length, 1);
  assert.equal(toggleTask(a, a.tasks[0].id).tasks[0].done, true);
});

test('addOpportunity validates and creates contact + opp', () => {
  const s = base();
  assert.equal(addOpportunity(s, { name: '', title: 't', value: 1 }), s);
  assert.equal(addOpportunity(s, { name: 'n', title: 't', value: -5 }), s);
  assert.equal(addOpportunity(s, { name: 'n', title: 't', value: 'abc' }), s);
  const a = addOpportunity(s, { name: ' Ana ', title: 'Roof', value: '4500.6' }, NOW);
  assert.equal(a.contacts.length, 2);
  assert.equal(a.opps[0].value, 4501);
  assert.equal(a.opps[0].stage, 'new');
});

test('open value excludes won and lost; won-this-month uses the month', () => {
  let s = base();
  assert.equal(openValue(s), 3000);
  s = moveOpp(s, 'o1', 'won', '', NOW);
  assert.equal(openValue(s), 2000);
  assert.equal(wonThisMonth(s, NOW), 1000);
  assert.equal(wonThisMonth(s, new Date('2026-11-02T10:00:00Z')), 0);
});

test('dueTasks: open, due today or earlier, soonest first', () => {
  const s = { ...base(), tasks: [
    { id: 'a', oppId: 'o1', text: 'a', due: '2026-10-09', done: false },
    { id: 'b', oppId: 'o1', text: 'b', due: '2026-10-07', done: false },
    { id: 'c', oppId: 'o1', text: 'c', due: '2026-10-08', done: true },
    { id: 'd', oppId: 'o1', text: 'd', due: '2026-10-10', done: false },
  ] };
  assert.deepEqual(dueTasks(s, '2026-10-09').map(t => t.id), ['b', 'a']);
});

test('lossReasons counts and sorts', () => {
  let s = base();
  s = moveOpp(s, 'o1', 'lost', 'Price', NOW);
  s = moveOpp(s, 'o2', 'lost', 'Price', NOW);
  assert.deepEqual(lossReasons(s), [['Price', 2]]);
});

test('date helpers', () => {
  assert.equal(daysFromNow(3, new Date(2026, 9, 9)), '2026-10-12');
  assert.equal(daysFromNow(-9, new Date(2026, 9, 9)), '2026-09-30');
  assert.equal(isoDay(new Date(2026, 0, 5)), '2026-01-05');
});
