import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STAGES, moveOpp, addNote, addTask, toggleTask, addOpportunity, openValue, wonThisMonth, dueTasks, lossReasons, isoDay } from './logic.js';
import { seed, COMPANY } from './data.js';
import { T, tr } from './i18n.js';

const KEY = 'solar-crm-demo-v1';
const REASON_CODES = ['price', 'competitor', 'budget', 'timing', 'community', 'other'];

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.opps) && Array.isArray(s.contacts) && Array.isArray(s.tasks)) return s;
    }
  } catch (e) { /* storage blocked or corrupt: fall back to sample data */ }
  return seed();
}

function initialLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'es') return q;
    const s = localStorage.getItem(KEY + '-lang');
    if (s === 'en' || s === 'es') return s;
  } catch (e) { /* ignore */ }
  return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export default function App() {
  const [state, setState] = useState(load);
  const [lang, setLang] = useState(initialLang);
  const [tab, setTab] = useState('board');
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [pendingLoss, setPendingLoss] = useState(null);
  const t = T[lang];

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }, [state]);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(KEY + '-lang', lang); } catch (e) { /* ignore */ }
  }, [lang]);

  const money = useMemo(() => {
    const f = new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    return n => f.format(n);
  }, [lang]);
  const fmtDate = useMemo(() => {
    const f = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short' });
    return iso => f.format(new Date(iso.length === 10 ? iso + 'T12:00:00' : iso));
  }, [lang]);
  const reasonText = r => (t.reasons[r] ? t.reasons[r] : r);

  const requestMove = (id, stage) => {
    const opp = state.opps.find(o => o.id === id);
    if (!opp || opp.stage === stage) return;
    if (stage === 'lost') setPendingLoss(id);
    else setState(s => moveOpp(s, id, stage));
  };

  const due = dueTasks(state);
  const contactOf = id => state.contacts.find(c => c.id === id) || { name: '?', company: '', phone: '', town: '' };
  const selectedOpp = state.opps.find(o => o.id === selected);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="sun" aria-hidden="true" />
          <div>
            <h1>{COMPANY}</h1>
            <p className="sub">{t.title}</p>
          </div>
        </div>
        <div className="top-actions">
          <div className="seg" role="group" aria-label={t.language}>
            {['en', 'es'].map(l => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </header>

      <p className="demo-note">{t.demo}</p>

      <section className="figures" aria-label="Summary">
        <div className="fig attention"><span>{t.openValue}</span><strong>{money(openValue(state))}</strong></div>
        <div className="fig"><span>{t.wonMonth}</span><strong>{money(wonThisMonth(state))}</strong></div>
        <button type="button" className={'fig due' + (due.length ? ' attention' : '')} onClick={() => setTab('tasks')}>
          <span>{t.dueNow}</span><strong>{due.length}</strong>
        </button>
      </section>

      <nav className="tabs" aria-label="Sections">
        {['board', 'contacts', 'tasks'].map(k => (
          <button key={k} type="button" aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{t.tabs[k]}</button>
        ))}
        <span className="grow" />
        <button type="button" className="primary" onClick={() => setAdding(true)}>{t.add}</button>
      </nav>

      <main>
        {tab === 'board' && (
          <Board state={state} t={t} lang={lang} money={money} contactOf={contactOf}
            onOpen={setSelected} onMove={requestMove} />
        )}
        {tab === 'contacts' && <Contacts state={state} t={t} lang={lang} money={money} onOpen={id => { setSelected(id); }} />}
        {tab === 'tasks' && (
          <Tasks state={state} t={t} lang={lang} due={due} fmtDate={fmtDate} contactOf={contactOf}
            onToggle={id => setState(s => toggleTask(s, id))} onOpen={setSelected} reasonText={reasonText} />
        )}
      </main>

      <footer className="foot">
        <button type="button" className="link" onClick={() => { if (window.confirm(t.resetConfirm)) { setState(seed()); setSelected(null); } }}>{t.reset}</button>
      </footer>

      {selectedOpp && (
        <Detail opp={selectedOpp} state={state} t={t} lang={lang} money={money} fmtDate={fmtDate}
          contact={contactOf(selectedOpp.contactId)} reasonText={reasonText}
          onClose={() => setSelected(null)} onMove={requestMove}
          onNote={text => setState(s => addNote(s, selectedOpp.id, text))}
          onTask={(text, d) => setState(s => addTask(s, selectedOpp.id, text, d))}
          onToggle={id => setState(s => toggleTask(s, id))} />
      )}
      {adding && (
        <AddDialog t={t} onCancel={() => setAdding(false)}
          onSave={f => { setState(s => addOpportunity(s, f)); setAdding(false); setTab('board'); }} />
      )}
      {pendingLoss && (
        <LossDialog t={t} onCancel={() => setPendingLoss(null)}
          onSave={reason => { setState(s => moveOpp(s, pendingLoss, 'lost', reason)); setPendingLoss(null); }} />
      )}
    </div>
  );
}

function Board({ state, t, lang, money, contactOf, onOpen, onMove }) {
  const [over, setOver] = useState(null);
  const lossList = lossReasons(state);
  return (
    <>
      <p className="hint">{t.dragHint}</p>
      <div className="board">
        {STAGES.map(stage => {
          const items = state.opps.filter(o => o.stage === stage);
          const total = items.reduce((a, o) => a + o.value, 0);
          return (
            <section key={stage} className={'col stage-' + stage + (over === stage ? ' over' : '')} aria-label={t.stages[stage]}
              onDragOver={e => { e.preventDefault(); setOver(stage); }}
              onDragLeave={() => setOver(o => (o === stage ? null : o))}
              onDrop={e => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/plain'); if (id) onMove(id, stage); }}>
              <header>
                <h2>{t.stages[stage]}</h2>
                <span className="count">{items.length}</span>
                <span className="sum">{money(total)}</span>
              </header>
              {items.length === 0 && <p className="empty">{t.empty}</p>}
              {items.map(o => {
                const c = contactOf(o.contactId);
                return (
                  <article key={o.id} className="card" draggable onDragStart={e => { e.dataTransfer.setData('text/plain', o.id); e.dataTransfer.effectAllowed = 'move'; }}>
                    <button type="button" className="card-open" onClick={() => onOpen(o.id)}>
                      <strong>{tr(o.title, lang)}</strong>
                      <span className="who">{c.name}{c.company ? ' · ' + c.company : ''}</span>
                      <span className="val">{money(o.value)}</span>
                    </button>
                    <label className="move">
                      <span>{t.moveTo}</span>
                      <select value={o.stage} onChange={e => onMove(o.id, e.target.value)} aria-label={`${t.moveTo}: ${tr(o.title, lang)}`}>
                        {STAGES.map(s => <option key={s} value={s}>{t.stages[s]}</option>)}
                      </select>
                    </label>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      <section className="losses">
        <h2>{t.losses}</h2>
        {lossList.length === 0 ? <p className="empty">{t.noLosses}</p> : (
          <ul>{lossList.map(([r, n]) => <li key={r}><span>{t.reasons[r] || r}</span><strong>{n}</strong></li>)}</ul>
        )}
      </section>
    </>
  );
}

function Contacts({ state, t, lang, money, onOpen }) {
  const [q, setQ] = useState('');
  const list = state.contacts.filter(c => (c.name + ' ' + c.company + ' ' + c.town).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <input className="search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} />
      <ul className="people">
        {list.map(c => {
          const opps = state.opps.filter(o => o.contactId === c.id);
          return (
            <li key={c.id}>
              <div className="p-main">
                <strong>{c.name}</strong>
                <span>{[c.company, c.town].filter(Boolean).join(' · ')}</span>
                {c.phone && <span className="muted">{c.phone}</span>}
              </div>
              <div className="p-opps">
                {opps.map(o => (
                  <button key={o.id} type="button" className={'chip stage-' + o.stage} onClick={() => onOpen(o.id)}>
                    {tr(o.title, lang)} · {money(o.value)}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Tasks({ state, t, lang, due, fmtDate, contactOf, onToggle, onOpen }) {
  const today = isoDay();
  const open = state.tasks.filter(x => !x.done).sort((a, b) => a.due.localeCompare(b.due));
  const done = state.tasks.filter(x => x.done);
  const row = x => {
    const opp = state.opps.find(o => o.id === x.oppId);
    const late = !x.done && x.due < today;
    return (
      <li key={x.id} className={(late ? 'late ' : '') + (x.done ? 'done' : '')}>
        <label className="check">
          <input type="checkbox" checked={x.done} onChange={() => onToggle(x.id)} />
          <span>{tr(x.text, lang)}</span>
        </label>
        <span className="meta">
          {opp && <button type="button" className="link" onClick={() => onOpen(opp.id)}>{contactOf(opp.contactId).name}</button>}
          <span className="date">{late ? t.overdue + ' · ' : x.due === today && !x.done ? t.today + ' · ' : ''}{fmtDate(x.due)}</span>
        </span>
      </li>
    );
  };
  return (
    <>
      <aside className="reminder" role="status">
        <strong>{t.reminders}</strong>
        <span>{due.length ? t.remind(due.length) : t.noTasks}. {t.remindersText}</span>
      </aside>
      <ul className="tasklist">{open.map(row)}</ul>
      {done.length > 0 && <><h2 className="small">{t.done}</h2><ul className="tasklist">{done.map(row)}</ul></>}
    </>
  );
}

function Modal({ title, onClose, children, wide }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // always call the latest handler without re-running the effect
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = e => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    ref.current && ref.current.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev && prev.focus && prev.focus(); };
  }, []);
  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        {children}
      </div>
    </div>
  );
}

function Detail({ opp, state, t, lang, money, fmtDate, contact, reasonText, onClose, onMove, onNote, onTask, onToggle }) {
  const [note, setNote] = useState('');
  const [task, setTask] = useState('');
  const [date, setDate] = useState(isoDay());
  const tasks = state.tasks.filter(x => x.oppId === opp.id).sort((a, b) => a.due.localeCompare(b.due));
  return (
    <Modal title={tr(opp.title, lang)} onClose={onClose} wide>
      <div className="m-head">
        <div>
          <h2>{tr(opp.title, lang)}</h2>
          <p className="who">{contact.name}{contact.company ? ' · ' + contact.company : ''}{contact.town ? ' · ' + contact.town : ''}</p>
          {contact.phone && <p className="muted">{t.tel}: {contact.phone}</p>}
        </div>
        <button type="button" onClick={onClose}>{t.close}</button>
      </div>
      <div className="m-grid">
        <div>
          <p className="big">{money(opp.value)}</p>
          <label className="field">
            <span>{t.moveTo}</span>
            <select value={opp.stage} onChange={e => onMove(opp.id, e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{t.stages[s]}</option>)}
            </select>
          </label>
          {opp.stage === 'lost' && opp.lostReason && <p className="lostline"><strong>{t.lostReason}:</strong> {reasonText(opp.lostReason)}</p>}

          <h3>{t.tasks}</h3>
          {tasks.length === 0 ? <p className="empty">{t.noTasks}</p> : (
            <ul className="tasklist compact">
              {tasks.map(x => (
                <li key={x.id} className={x.done ? 'done' : ''}>
                  <label className="check"><input type="checkbox" checked={x.done} onChange={() => onToggle(x.id)} /><span>{tr(x.text, lang)}</span></label>
                  <span className="date">{fmtDate(x.due)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="inline-form">
            <label className="field"><span>{t.taskText}</span><input value={task} onChange={e => setTask(e.target.value)} maxLength={120} /></label>
            <label className="field"><span>{t.dueDate}</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <button type="button" disabled={!task.trim() || !date} onClick={() => { onTask(task, date); setTask(''); }}>{t.saveTask}</button>
          </div>
        </div>
        <div>
          <h3>{t.activity}</h3>
          <label className="field"><span>{t.addNote}</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={500} /></label>
          <button type="button" disabled={!note.trim()} onClick={() => { onNote(note); setNote(''); }}>{t.saveNote}</button>
          <ul className="log">
            {opp.log.map(l => (
              <li key={l.id}>
                <span className="date">{fmtDate(l.at)}</span>
                {l.type === 'stage' ? <span className="stagechg">{t.stageChange(t.stages[l.from], t.stages[l.to])}</span> : <span>{tr(l.text, lang)}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function AddDialog({ t, onCancel, onSave }) {
  const [f, setF] = useState({ name: '', company: '', phone: '', town: '', title: '', value: '' });
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }));
  const ok = f.name.trim() && f.title.trim() && Number(f.value) >= 0 && f.value !== '';
  return (
    <Modal title={t.add} onClose={onCancel}>
      <h2>{t.add}</h2>
      <div className="stack">
        <label className="field"><span>{t.name}</span><input value={f.name} onChange={set('name')} maxLength={80} /></label>
        <label className="field"><span>{t.company}</span><input value={f.company} onChange={set('company')} maxLength={80} /></label>
        <label className="field"><span>{t.phone}</span><input value={f.phone} onChange={set('phone')} maxLength={30} inputMode="tel" /></label>
        <label className="field"><span>{t.town}</span><input value={f.town} onChange={set('town')} maxLength={60} /></label>
        <label className="field"><span>{t.oppTitle}</span><input value={f.title} onChange={set('title')} maxLength={120} /></label>
        <label className="field"><span>{t.value}</span><input value={f.value} onChange={set('value')} inputMode="numeric" type="number" min="0" /></label>
      </div>
      <div className="actions">
        <button type="button" onClick={onCancel}>{t.cancel}</button>
        <button type="button" className="primary" disabled={!ok} onClick={() => onSave(f)}>{t.save}</button>
      </div>
    </Modal>
  );
}

function LossDialog({ t, onCancel, onSave }) {
  const [code, setCode] = useState('price');
  const [other, setOther] = useState('');
  const reason = code === 'other' ? other.trim() : code;
  return (
    <Modal title={t.lostWhy} onClose={onCancel}>
      <h2>{t.lostWhy}</h2>
      <p className="muted">{t.lostHelp}</p>
      <div className="stack">
        <label className="field">
          <span>{t.lostReason}</span>
          <select value={code} onChange={e => setCode(e.target.value)}>
            {REASON_CODES.map(c => <option key={c} value={c}>{t.reasons[c]}</option>)}
          </select>
        </label>
        {code === 'other' && <label className="field"><span>{t.otherReason}</span><input value={other} onChange={e => setOther(e.target.value)} maxLength={100} /></label>}
      </div>
      <div className="actions">
        <button type="button" onClick={onCancel}>{t.cancel}</button>
        <button type="button" className="primary" disabled={!reason} onClick={() => onSave(reason)}>{t.lostSave}</button>
      </div>
    </Modal>
  );
}
