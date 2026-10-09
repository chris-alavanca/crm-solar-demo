# Sales CRM demo for a solar installer

A light sales CRM for a small solar installation company in Tenerife. This is a portfolio demo: the company, people and figures are fictional.

## What it does

- Pipeline board with six stages: new enquiry, site visit, quote sent, negotiation, won, lost. Drag a card to another column, or use "Move to" on the card (works on phones).
- Moving a deal to lost asks for a reason. The reasons feed a "why deals are lost" summary.
- Contacts with search, and the opportunities linked to each one.
- Tasks with due dates, overdue highlighting and a summary figure on the home screen.
- Activity log per opportunity: quick notes after a call, plus an automatic entry for every stage change.
- English and Spanish (EN/ES toggle), amounts in EUR.

## What is simulated

- Reminders are shown on screen only. Nothing is sent by email or WhatsApp.
- There is no login and no server. Data lives in your browser (localStorage) and never leaves it.

## Reset or replace the sample data

- Reset: use "Reset sample data" at the bottom of the page.
- Replace: edit `src/data.js`. Dates there are relative to today, so the demo never looks stale.

## Run it locally

Needs Node.js 20 or later.

```
npm install
npm run dev      # http://localhost:5173
npm test         # logic tests
npm run build    # static output in dist/
```

## Structure

- `src/logic.js`: pure functions (stage moves, tasks, totals). Covered by `src/logic.test.js`.
- `src/App.jsx`: interface. `src/i18n.js`: EN/ES text. `src/data.js`: sample data.
