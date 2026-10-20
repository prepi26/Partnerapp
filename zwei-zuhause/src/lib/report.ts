import { Expense, Family, ISODate, JournalEntry, Message, ParentKey, ScheduleChange } from '@/data/types';

import { addDays, formatDate, formatTimestamp, MONTHS, parseISO, toISO } from './dates';
import { balanceAB, categoryOf, formatMoney, shareOf } from './money';
import { acceptedChanges, dayInfo, MODELS } from './schedule';

export interface ReportInput {
  family: Family;
  me: ParentKey;
  from: ISODate;
  to: ISODate;
  sections: { schedule: boolean; expenses: boolean; messages: boolean; journal: boolean };
  changes: ScheduleChange[];
  expenses: Expense[];
  messages: Message[];
  journal: JournalEntry[];
}

function esc(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

const STATUS: Record<string, string> = {
  proposed: 'offen',
  accepted: 'angenommen',
  declined: 'abgelehnt',
  open: 'unbestätigt',
  confirmed: 'bestätigt',
  disputed: 'abgelehnt',
};

/** Übernachtungen je Elternteil und Monat im Zeitraum. */
function nightsPerMonth(input: ReportInput) {
  const accepted = acceptedChanges(input.changes);
  const rows = new Map<string, { a: number; b: number; none: number }>();
  const end = parseISO(input.to);
  for (let d = parseISO(input.from); d <= end; d = addDays(d, 1)) {
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const row = rows.get(key) ?? { a: 0, b: 0, none: 0 };
    const parent = dayInfo(input.family, accepted, new Map(), d).parent;
    if (parent) row[parent]++;
    else row.none++;
    rows.set(key, row);
  }
  return rows;
}

export function buildReportHtml(input: ReportInput): string {
  const { family } = input;
  const name = (k: ParentKey) => esc(k === 'a' ? family.name_a : family.name_b);
  const inRange = (day: string) => day >= input.from && day <= input.to;
  const tsInRange = (ts: string) => inRange(toISO(new Date(ts)));
  const parts: string[] = [];

  parts.push(`
    <h1>Zwei Zuhause – Bericht</h1>
    <p class="sub">
      Zeitraum: ${formatDate(input.from)} bis ${formatDate(input.to)}<br>
      Eltern: ${name('a')} und ${name('b')}${family.children.trim() ? ` · Kind(er): ${esc(family.children)}` : ''}<br>
      Erstellt von ${name(input.me)} am ${formatTimestamp(new Date().toISOString())}
    </p>`);

  if (input.sections.schedule) {
    const model = MODELS.find((m) => m.key === family.schedule_model);
    const nights = nightsPerMonth(input);
    const changes = input.changes.filter((c) => inRange(c.day));
    parts.push(`<h2>Umgang</h2>
      <p>Vereinbartes Modell: <b>${esc(model?.title ?? '–')}</b>${
        family.schedule_model !== 'none' ? ` seit ${formatDate(family.schedule_start)}` : ''
      }</p>
      <table><tr><th>Monat</th><th>Tage bei ${name('a')}</th><th>Tage bei ${name('b')}</th><th>ohne Eintrag</th></tr>
      ${[...nights.entries()]
        .map(([month, n]) => `<tr><td>${month}</td><td>${n.a}</td><td>${n.b}</td><td>${n.none}</td></tr>`)
        .join('')}
      </table>
      <p class="note">Gezählt nach Plan und angenommenen Änderungen (Übernachtung).</p>
      <h3>Änderungswünsche</h3>
      ${
        changes.length
          ? `<table><tr><th>Tag</th><th>Kind bei</th><th>Begründung</th><th>Status</th><th>Gestellt / beantwortet</th></tr>
        ${changes
          .map(
            (c) =>
              `<tr><td>${formatDate(c.day)}</td><td>${name(c.parent)}</td><td>${esc(c.note || '–')}</td><td>${STATUS[c.status]}</td><td>${formatTimestamp(c.created_at)}${c.answered_at ? `<br>${formatTimestamp(c.answered_at)}` : ''}</td></tr>`,
          )
          .join('')}</table>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.sections.expenses) {
    const list = input.expenses.filter((e) => inRange(e.day)).sort((x, y) => x.day.localeCompare(y.day));
    const balance = balanceAB(list);
    parts.push(`<h2>Kosten</h2>
      ${
        list.length
          ? `<table><tr><th>Datum</th><th>Posten</th><th>Bezahlt von</th><th>Betrag</th><th>Anteil ${name('a')}</th><th>Anteil ${name('b')}</th><th>Status</th></tr>
        ${list
          .map((e) =>
            e.kind === 'payment'
              ? `<tr><td>${formatDate(e.day)}</td><td>Ausgleichszahlung${e.title ? `: ${esc(e.title)}` : ''}</td><td>${name(e.paid_by)}</td><td>${formatMoney(e.amount_cents)}</td><td colspan="2">an ${name(e.paid_by === 'a' ? 'b' : 'a')}</td><td>${STATUS[e.status]}</td></tr>`
              : `<tr><td>${formatDate(e.day)}</td><td>${esc(e.title)} <span class="note">(${categoryOf(e.category).label})</span></td><td>${name(e.paid_by)}</td><td>${formatMoney(e.amount_cents)}</td><td>${formatMoney(shareOf(e, 'a'))}</td><td>${formatMoney(shareOf(e, 'b'))}</td><td>${STATUS[e.status]}${e.receipt_path ? ' · Beleg' : ''}</td></tr>`,
          )
          .join('')}</table>
        <p><b>Saldo im Zeitraum:</b> ${
          balance === 0
            ? 'ausgeglichen'
            : balance > 0
              ? `${name('b')} schuldet ${name('a')} ${formatMoney(balance)}`
              : `${name('a')} schuldet ${name('b')} ${formatMoney(-balance)}`
        } <span class="note">(abgelehnte Posten nicht mitgerechnet)</span></p>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.sections.messages) {
    const list = input.messages.filter((m) => tsInRange(m.created_at));
    parts.push(`<h2>Nachrichten</h2>
      ${
        list.length
          ? `<table><tr><th>Zeit</th><th>Von</th><th>Nachricht</th><th>Gelesen</th><th>Prüfsumme</th></tr>
        ${list
          .map(
            (m) =>
              `<tr><td class="nowrap">${formatTimestamp(m.created_at)}</td><td>${name(m.sender_key)}</td><td>${esc(m.text)}</td><td class="nowrap">${m.read_at ? formatTimestamp(m.read_at) : '–'}</td><td class="hash">${m.hash.slice(0, 16)}</td></tr>`,
          )
          .join('')}</table>
        <p class="note">Nachrichten in Zwei Zuhause können weder bearbeitet noch gelöscht werden. Jede Prüfsumme (SHA-256)
        baut auf der vorherigen auf; eine nachträgliche Änderung in der Datenbank würde die Kette brechen.</p>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.sections.journal) {
    const list = input.journal.filter((j) => inRange(j.day)).sort((x, y) => x.day.localeCompare(y.day));
    parts.push(`<h2>Eigene Notizen von ${name(input.me)}</h2>
      <p class="note">Persönliches Tagebuch – nur von ${name(input.me)} geschrieben, vom anderen Elternteil nicht einsehbar.</p>
      ${
        list.length
          ? list
              .map(
                (j) =>
                  `<div class="entry"><b>${formatDate(j.day)}</b> <span class="note">(notiert ${formatTimestamp(j.created_at)})</span><br>${esc(j.text)}</div>`,
              )
              .join('')
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1F2D2B; font-size: 11pt; margin: 32px; }
    h1 { font-size: 20pt; margin: 0 0 4px; color: #2F8F83; }
    h2 { font-size: 14pt; margin: 24px 0 8px; border-bottom: 2px solid #2F8F83; padding-bottom: 4px; }
    h3 { font-size: 12pt; margin: 16px 0 6px; }
    .sub { color: #6B7C79; margin: 0 0 8px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    th, td { border: 1px solid #DDE7E4; padding: 5px 6px; text-align: left; vertical-align: top; font-size: 9.5pt; }
    th { background: #E3F3F0; }
    tr { page-break-inside: avoid; }
    .note { color: #6B7C79; font-size: 9pt; }
    .nowrap { white-space: nowrap; }
    .hash { font-family: Menlo, monospace; font-size: 8pt; }
    .entry { margin: 8px 0; padding: 8px; border-left: 3px solid #2F8F83; background: #F6F8F7; page-break-inside: avoid; }
  </style></head><body>${parts.join('\n')}</body></html>`;
}
