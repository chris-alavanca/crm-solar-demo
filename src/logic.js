// Pure functions: no React, no browser APIs. Covered by logic.test.js.
export const STAGES = ['new', 'visit', 'quote', 'negotiation', 'won', 'lost'];
export const OPEN_STAGES = ['new', 'visit', 'quote', 'negotiation'];

let counter = 0;
export const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const isoDay = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const daysFromNow = (n, base = new Date()) => {
  const x = new Date(base);
  x.setDate(x.getDate() + n);
  return isoDay(x);
};

// A move to "lost" must carry a reason; every move is written to the activity log.
export function moveOpp(state, id, stage, reason = '', now = new Date()) {
  if (!STAGES.includes(stage)) return state;
  const opp = state.opps.find(o => o.id === id);
  if (!opp || opp.stage === stage) return state;
  if (stage === 'lost' && !reason.trim()) return state;
  const entry = { id: uid('l'), at: now.toISOString(), type: 'stage', from: opp.stage, to: stage };
  const next = {
    ...opp,
    stage,
    lostReason: stage === 'lost' ? reason.trim() : '',
    wonAt: stage === 'won' ? now.toISOString() : '',
    log: [entry, ...opp.log],
  };
  return { ...state, opps: state.opps.map(o => (o.id === id ? next : o)) };
}

export function addNote(state, oppId, text, now = new Date()) {
  const t = text.trim();
  if (!t) return state;
  return {
    ...state,
    opps: state.opps.map(o =>
      o.id === oppId ? { ...o, log: [{ id: uid('l'), at: now.toISOString(), type: 'note', text: t }, ...o.log] } : o
    ),
  };
}

export function addTask(state, oppId, text, due) {
  const t = text.trim();
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(due || '')) return state;
  return { ...state, tasks: [...state.tasks, { id: uid('t'), oppId, text: t, due, done: false }] };
}

export const toggleTask = (state, id) => ({
  ...state,
  tasks: state.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)),
});

export function addOpportunity(state, { name, company = '', phone = '', town = '', title, value }, now = new Date()) {
  const n = (name || '').trim();
  const ti = (title || '').trim();
  const v = Number(value);
  if (!n || !ti || !Number.isFinite(v) || v < 0) return state;
  const contact = { id: uid('c'), name: n, company: company.trim(), phone: phone.trim(), email: '', town: town.trim() };
  const opp = { id: uid('o'), contactId: contact.id, title: ti, value: Math.round(v), stage: 'new', lostReason: '', wonAt: '', createdAt: now.toISOString(), log: [] };
  return { ...state, contacts: [...state.contacts, contact], opps: [opp, ...state.opps] };
}

export const openValue = s => s.opps.filter(o => OPEN_STAGES.includes(o.stage)).reduce((a, o) => a + o.value, 0);

export function wonThisMonth(s, now = new Date()) {
  return s.opps
    .filter(o => o.stage === 'won' && o.wonAt && new Date(o.wonAt).getFullYear() === now.getFullYear() && new Date(o.wonAt).getMonth() === now.getMonth())
    .reduce((a, o) => a + o.value, 0);
}

// Open tasks due today or earlier, soonest first. These drive the simulated reminders.
export function dueTasks(s, today = isoDay()) {
  return s.tasks.filter(t => !t.done && t.due <= today).sort((a, b) => a.due.localeCompare(b.due));
}

export function lossReasons(s) {
  const out = {};
  s.opps.filter(o => o.stage === 'lost' && o.lostReason).forEach(o => { out[o.lostReason] = (out[o.lostReason] || 0) + 1; });
  return Object.entries(out).sort((a, b) => b[1] - a[1]);
}
