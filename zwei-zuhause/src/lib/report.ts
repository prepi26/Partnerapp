import {
  Agreement,
  Decision,
  Expense,
  Family,
  FamilyDocument,
  Handover,
  ISODate,
  JournalEntry,
  Message,
  ParentKey,
  ScheduleChange,
} from '@/data/types';

import { de } from '@/i18n/de';

import { agreementSections } from './agreement';
import { addDays, formatDate as formatDateIn, formatTimestamp, parseISO, toISO } from './dates';
import { decisionCategory as decisionCategoryIn } from './decisions';
import { documentCategory as documentCategoryIn } from './documentCategories';
import { handoverLabel as handoverLabelIn } from './handovers';
import { balanceAB, categoryOf as categoryOfIn, formatMoney, needOf as needOfIn, shareOf } from './money';
import { acceptedChanges, dayInfo, handoverWhere as handoverWhereIn, modelTitle } from './schedule';


// Berichte sind immer deutsch – sie gehen an deutsche Ämter und Beratungsstellen.
const formatDate = (d: ISODate | Date) => formatDateIn(d, de);
const handoverWhere = (f: Family) => handoverWhereIn(f, de);
const decisionCategory = (k: string) => decisionCategoryIn(k, de);
const documentCategory = (k: FamilyDocument['category']) => documentCategoryIn(k, de);
const handoverLabel = (h: Handover) => handoverLabelIn(h, de);
const categoryOf = (k: string) => categoryOfIn(k, de);
const needOf = (k: Expense['need']) => needOfIn(k, de);
const AGREEMENT_SECTIONS = agreementSections(de);
const AGREEMENT_NOTE = de.lib.agreementNote;

export type ReportSection =
  | 'schedule'
  | 'handovers'
  | 'decisions'
  | 'agreement'
  | 'expenses'
  | 'messages'
  | 'documents'
  | 'journal';

export interface ReportInput {
  family: Family;
  /** Wer den Bericht erstellt (Elternteil oder Fachkraft). */
  author: string;
  /** Elternteil, dessen Tagebuch ggf. enthalten ist. */
  journalOwner?: ParentKey;
  from: ISODate;
  to: ISODate;
  mode: 'kurz' | 'voll';
  sections: Partial<Record<ReportSection, boolean>>;
  changes: ScheduleChange[];
  expenses: Expense[];
  messages: Message[];
  decisions: Decision[];
  handovers: Handover[];
  agreements: Agreement[];
  documents?: FamilyDocument[];
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
  agreed: 'zugestimmt',
  rejected: 'nicht zugestimmt',
};

/** Übernachtungen je Elternteil und Monat im Zeitraum. */
function nightsPerMonth(input: ReportInput) {
  const accepted = acceptedChanges(input.changes);
  const rows = new Map<string, { a: number; b: number; none: number }>();
  const end = parseISO(input.to);
  for (let d = parseISO(input.from); d <= end; d = addDays(d, 1)) {
    const key = `${de.common.dates.months[d.getMonth()]} ${d.getFullYear()}`;
    const row = rows.get(key) ?? { a: 0, b: 0, none: 0 };
    const parent = dayInfo(input.family, accepted, new Map(), d).parent;
    if (parent) row[parent]++;
    else row.none++;
    rows.set(key, row);
  }
  return rows;
}

function hours(ms: number) {
  const h = ms / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} Min.`;
  if (h < 48) return `${Math.round(h)} Std.`;
  return `${Math.round(h / 24)} Tage`;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((x, y) => x - y);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Antwortzeit: von der letzten Nachricht eines Elternteils bis zur nächsten des anderen. */
function responseTimes(messages: Message[]) {
  const times: Record<ParentKey, number[]> = { a: [], b: [] };
  for (let i = 0; i + 1 < messages.length; i++) {
    const m = messages[i];
    const next = messages[i + 1];
    if (next.sender_key !== m.sender_key) {
      times[next.sender_key].push(new Date(next.created_at).getTime() - new Date(m.created_at).getTime());
    }
  }
  return { a: median(times.a), b: median(times.b) };
}

export function buildReportHtml(input: ReportInput): string {
  const { family } = input;
  const name = (k: ParentKey) => esc(k === 'a' ? family.name_a : family.name_b);
  const keyOf = (uid: string | null): ParentKey | null =>
    uid && uid === family.parent_a ? 'a' : uid && uid === family.parent_b ? 'b' : null;
  const by = (uid: string | null) => {
    const k = keyOf(uid);
    return k ? name(k) : '–';
  };
  const inRange = (day: string) => day >= input.from && day <= input.to;
  const tsInRange = (ts: string) => inRange(toISO(new Date(ts)));
  const on = (s: ReportSection) => !!input.sections[s];

  const changes = input.changes.filter((c) => inRange(c.day));
  const expenses = input.expenses.filter((e) => inRange(e.day)).sort((x, y) => x.day.localeCompare(y.day));
  const messages = input.messages.filter((m) => tsInRange(m.created_at));
  const decisions = input.decisions.filter((d) => tsInRange(d.created_at));
  const handovers = input.handovers.filter((h) => inRange(h.day)).sort((x, y) => x.day.localeCompare(y.day));
  const agreement = input.agreements[0];
  const parts: string[] = [];

  parts.push(`
    <h1>Zwei Zuhause – ${input.mode === 'kurz' ? 'Kurzbericht für die Beratung' : 'Bericht'}</h1>
    <p class="sub">
      Zeitraum: ${formatDate(input.from)} bis ${formatDate(input.to)}<br>
      Eltern: ${name('a')} und ${name('b')}${family.children.trim() ? ` · Kind(er): ${esc(family.children)}` : ''}<br>
      Erstellt von ${esc(input.author)} am ${formatTimestamp(new Date().toISOString())}
    </p>`);

  const nights = nightsPerMonth(input);
  const totals = { a: 0, b: 0, none: 0 };
  for (const n of nights.values()) {
    totals.a += n.a;
    totals.b += n.b;
    totals.none += n.none;
  }
  const model = { title: modelTitle(family.schedule_model, de) };

  if (input.mode === 'kurz') {
    const ho = { on_time: 0, late: 0, missed: 0, confirmed: 0, disputed: 0 };
    for (const h of handovers) {
      ho[h.status]++;
      if (h.reply) ho[h.reply]++;
    }
    const swaps = (k: ParentKey) => changes.filter((c) => keyOf(c.created_by) === k);
    const count = (list: ScheduleChange[], s: string) => list.filter((c) => c.status === s).length;
    const resp = responseTimes(messages);
    const paid = (k: ParentKey) =>
      expenses.filter((e) => e.kind === 'expense' && e.paid_by === k && e.status !== 'disputed').reduce((sum, e) => sum + e.amount_cents, 0);
    const balance = balanceAB(expenses);
    const open = decisions.filter((d) => d.status === 'proposed');

    parts.push(`<h2>Überblick</h2>
      <table>
        <tr><th></th><th>${name('a')}</th><th>${name('b')}</th></tr>
        <tr><td>Tage beim Elternteil (nach Plan + Absprachen)</td><td>${totals.a}</td><td>${totals.b}</td></tr>
        <tr><td>Tauschwünsche gestellt (angenommen / abgelehnt)</td>
          <td>${swaps('a').length} (${count(swaps('a'), 'accepted')} / ${count(swaps('a'), 'declined')})</td>
          <td>${swaps('b').length} (${count(swaps('b'), 'accepted')} / ${count(swaps('b'), 'declined')})</td></tr>
        <tr><td>Nachrichten gesendet</td>
          <td>${messages.filter((m) => m.sender_key === 'a').length}</td>
          <td>${messages.filter((m) => m.sender_key === 'b').length}</td></tr>
        <tr><td>Typische Antwortzeit (Median)</td>
          <td>${resp.a !== null ? hours(resp.a) : '–'}</td><td>${resp.b !== null ? hours(resp.b) : '–'}</td></tr>
        <tr><td>Bezahlte Kinderkosten</td><td>${formatMoney(paid('a'))}</td><td>${formatMoney(paid('b'))}</td></tr>
      </table>
      <p>
        <b>Umgangsmodell:</b> ${esc(model?.title ?? '–')}${totals.none ? ` · ${totals.none} Tage ohne Eintrag` : ''}<br>
        <b>Übergaben erfasst:</b> ${handovers.length} – pünktlich ${ho.on_time}, verspätet ${ho.late}, ausgefallen ${ho.missed}
        ${handovers.length ? `(bestätigt ${ho.confirmed}, widersprochen ${ho.disputed})` : ''}<br>
        <b>Kostensaldo:</b> ${
          balance === 0
            ? 'ausgeglichen'
            : balance > 0
              ? `${name('b')} → ${name('a')} ${formatMoney(balance)}`
              : `${name('a')} → ${name('b')} ${formatMoney(-balance)}`
        } · ${expenses.filter((e) => e.status === 'open').length} unbestätigt, ${expenses.filter((e) => e.status === 'disputed').length} abgelehnt<br>
        <b>Elternvereinbarung:</b> ${
          agreement
            ? `Fassung ${agreement.version}, ${agreement.accepted_a_at && agreement.accepted_b_at ? 'von beiden angenommen' : 'noch nicht von beiden angenommen'}`
            : 'keine'
        }<br>
        <b>Entscheidungen im Zeitraum:</b> ${decisions.length} – ${decisions.filter((d) => d.status === 'agreed').length} zugestimmt,
        ${decisions.filter((d) => d.status === 'rejected').length} nicht zugestimmt, ${open.length} offen
      </p>
      ${
        open.length
          ? `<h3>Offene Entscheidungen</h3><ul>${open
              .map((d) => `<li>${esc(d.title)} <span class="note">(${decisionCategory(d.category).label}, gefragt von ${by(d.created_by)} am ${formatDate(toISO(new Date(d.created_at)))})</span></li>`)
              .join('')}</ul>`
          : ''
      }
      <p class="note">Automatisch aus den Einträgen beider Eltern zusammengestellt. Die Zahlen zeigen, was eingetragen wurde –
      nicht, warum. Der vollständige Bericht enthält alle Einzeleinträge.</p>`);
  }

  if (input.mode === 'voll' && on('schedule')) {
    parts.push(`<h2>Umgang</h2>
      <p>Vereinbartes Modell: <b>${esc(model?.title ?? '–')}</b>${
        family.schedule_model !== 'none' ? ` seit ${formatDate(family.schedule_start)}` : ''
      }${handoverWhere(family) ? `<br>Übergabe: ${esc(handoverWhere(family))}` : ''}</p>
      <table><tr><th>Monat</th><th>Tage bei ${name('a')}</th><th>Tage bei ${name('b')}</th><th>ohne Eintrag</th></tr>
      ${[...nights.entries()]
        .map(([month, n]) => `<tr><td>${month}</td><td>${n.a}</td><td>${n.b}</td><td>${n.none}</td></tr>`)
        .join('')}
      <tr><th>Summe</th><th>${totals.a}</th><th>${totals.b}</th><th>${totals.none}</th></tr>
      </table>
      <p class="note">Gezählt nach Plan und angenommenen Änderungen (Übernachtung).</p>
      <h3>Änderungswünsche</h3>
      ${
        changes.length
          ? `<table><tr><th>Tag</th><th>Kind bei</th><th>Gefragt von</th><th>Begründung</th><th>Status</th><th>Gestellt / beantwortet</th></tr>
        ${changes
          .map(
            (c) =>
              `<tr><td>${formatDate(c.day)}</td><td>${name(c.parent)}</td><td>${by(c.created_by)}</td><td>${esc(c.note || '–')}</td><td>${STATUS[c.status]}</td><td>${formatTimestamp(c.created_at)}${c.answered_at ? `<br>${formatTimestamp(c.answered_at)}` : ''}</td></tr>`,
          )
          .join('')}</table>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.mode === 'voll' && on('handovers')) {
    parts.push(`<h2>Übergaben</h2>
      ${
        handovers.length
          ? `<table><tr><th>Tag</th><th>Verlauf</th><th>Eingetragen von</th><th>Notiz</th><th>Rückmeldung</th></tr>
        ${handovers
          .map(
            (h) =>
              `<tr><td>${formatDate(h.day)}</td><td>${esc(handoverLabel(h))}</td><td>${by(h.created_by)}<br><span class="note">${formatTimestamp(h.created_at)}</span></td><td>${esc(h.note || '–')}</td><td>${
                h.reply ? `${h.reply === 'confirmed' ? 'bestätigt' : 'widersprochen'}${h.reply_note ? `: ${esc(h.reply_note)}` : ''}<br><span class="note">${formatTimestamp(h.replied_at ?? h.created_at)}</span>` : '–'
              }</td></tr>`,
          )
          .join('')}</table>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.mode === 'voll' && on('decisions')) {
    parts.push(`<h2>Entscheidungen</h2>
      ${
        decisions.length
          ? `<table><tr><th>Gefragt</th><th>Thema</th><th>Von</th><th>Status</th><th>Antwort</th></tr>
        ${decisions
          .map(
            (d) =>
              `<tr><td class="nowrap">${formatTimestamp(d.created_at)}</td><td><b>${esc(d.title)}</b> <span class="note">(${decisionCategory(d.category).label})</span>${d.details ? `<br>${esc(d.details)}` : ''}</td><td>${by(d.created_by)}</td><td>${STATUS[d.status]}</td><td>${d.answer_note ? esc(d.answer_note) : '–'}${d.answered_at ? `<br><span class="note">${formatTimestamp(d.answered_at)}</span>` : ''}</td></tr>`,
          )
          .join('')}</table>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.mode === 'voll' && on('agreement')) {
    parts.push(`<h2>Elternvereinbarung</h2>
      ${
        agreement
          ? `<p>Aktuelle Fassung ${agreement.version} vom ${formatTimestamp(agreement.created_at)} ·
             ${name('a')}: ${agreement.accepted_a_at ? `zugestimmt ${formatTimestamp(agreement.accepted_a_at)}` : 'nicht zugestimmt'} ·
             ${name('b')}: ${agreement.accepted_b_at ? `zugestimmt ${formatTimestamp(agreement.accepted_b_at)}` : 'nicht zugestimmt'}<br>
             <span class="hash">Prüfsumme ${agreement.hash}</span></p>
           ${AGREEMENT_SECTIONS.filter((s) => agreement.content[s.key])
             .map((s) => `<div class="entry"><b>${esc(s.title)}</b><br>${esc(agreement.content[s.key])}</div>`)
             .join('')}
           <p class="note">${esc(AGREEMENT_NOTE)}</p>`
          : '<p>Keine Vereinbarung erfasst.</p>'
      }`);
  }

  if (input.mode === 'voll' && on('expenses')) {
    const balance = balanceAB(expenses);
    parts.push(`<h2>Kosten</h2>
      ${
        expenses.length
          ? `<table><tr><th>Datum</th><th>Posten</th><th>Bezahlt von</th><th>Betrag</th><th>Anteil ${name('a')}</th><th>Anteil ${name('b')}</th><th>Status</th></tr>
        ${expenses
          .map((e) =>
            e.kind === 'payment'
              ? `<tr><td>${formatDate(e.day)}</td><td>Ausgleichszahlung${e.title ? `: ${esc(e.title)}` : ''}</td><td>${name(e.paid_by)}</td><td>${formatMoney(e.amount_cents)}</td><td colspan="2">an ${name(e.paid_by === 'a' ? 'b' : 'a')}</td><td>${STATUS[e.status]}</td></tr>`
              : `<tr><td>${formatDate(e.day)}<br><span class="note">eingetragen ${formatTimestamp(e.created_at)}</span></td><td>${esc(e.title)} <span class="note">(${categoryOf(e.category).label}${e.need && e.need !== 'regular' ? `, ${needOf(e.need).label}` : ''})</span></td><td>${name(e.paid_by)}</td><td>${formatMoney(e.amount_cents)}</td><td>${formatMoney(shareOf(e, 'a'))}</td><td>${formatMoney(shareOf(e, 'b'))}</td><td>${STATUS[e.status]}${e.receipt_path ? ' · Beleg' : ''}</td></tr>`,
          )
          .join('')}</table>
        <p><b>Saldo im Zeitraum:</b> ${
          balance === 0
            ? 'ausgeglichen'
            : balance > 0
              ? `${name('b')} schuldet ${name('a')} ${formatMoney(balance)}`
              : `${name('a')} schuldet ${name('b')} ${formatMoney(-balance)}`
        } <span class="note">(abgelehnte Posten nicht mitgerechnet; Einordnung als Mehr-/Sonderbedarf durch die Eltern, keine rechtliche Bewertung)</span></p>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.mode === 'voll' && on('messages')) {
    parts.push(`<h2>Nachrichten</h2>
      ${
        messages.length
          ? `<table><tr><th>Zeit</th><th>Von</th><th>Nachricht</th><th>Gelesen</th><th>Prüfsumme</th></tr>
        ${messages
          .map(
            (m) =>
              `<tr><td class="nowrap">${formatTimestamp(m.created_at)}</td><td>${name(m.sender_key)}</td><td>${esc(m.text)}</td><td class="nowrap">${m.read_at ? formatTimestamp(m.read_at) : '–'}</td><td class="hash">${m.hash.slice(0, 16)}</td></tr>`,
          )
          .join('')}</table>
        <p class="note">Vollständiger Verlauf im Zeitraum, keine Auswahl. Nachrichten in Zwei Zuhause können weder bearbeitet noch
        gelöscht werden; Zeitstempel stammen vom Server. Jede Prüfsumme (SHA-256) baut auf der vorherigen auf – eine
        nachträgliche Änderung in der Datenbank würde die Kette brechen. Das Protokoll belegt Zeitpunkt und Inhalt, nicht den
        Wahrheitsgehalt.</p>`
          : '<p>Keine im Zeitraum.</p>'
      }`);
  }

  if (input.mode === 'voll' && on('documents')) {
    const list = (input.documents ?? []).filter((d) => tsInRange(d.created_at));
    parts.push(`<h2>Dokumente</h2>
      ${
        list.length
          ? `<table><tr><th>Geteilt</th><th>Titel</th><th>Bereich</th><th>Datum des Dokuments</th><th>Von</th></tr>
        ${list
          .map(
            (d) =>
              `<tr><td class="nowrap">${formatTimestamp(d.created_at)}</td><td>${esc(d.title)}</td><td>${documentCategory(d.category).label}</td><td>${d.doc_date ? formatDate(d.doc_date) : '–'}</td><td>${by(d.created_by)}</td></tr>`,
          )
          .join('')}</table>
        <p class="note">Nur die Liste – die Dokumente selbst liegen in der App.</p>`
          : '<p>Keine im Zeitraum geteilt.</p>'
      }`);
  }

  if (input.mode === 'voll' && on('journal') && input.journalOwner) {
    const list = input.journal.filter((j) => inRange(j.day)).sort((x, y) => x.day.localeCompare(y.day));
    parts.push(`<h2>Eigene Notizen von ${name(input.journalOwner)}</h2>
      <p class="note">Persönliches Tagebuch – nur von ${name(input.journalOwner)} geschrieben, vom anderen Elternteil nicht einsehbar.</p>
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

  parts.push(`<p class="footer">Erstellt mit Zwei Zuhause. Allgemeine Dokumentation der Eltern, keine rechtliche Bewertung.</p>`);

  return `<!doctype html><html><head><meta charset="utf-8">
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1F2D2B; font-size: 11pt; margin: 32px; }
    h1 { font-size: 20pt; margin: 0 0 4px; color: #2F8F83; }
    h2 { font-size: 14pt; margin: 24px 0 8px; border-bottom: 2px solid #2F8F83; padding-bottom: 4px; }
    h3 { font-size: 12pt; margin: 16px 0 6px; }
    p, li { line-height: 1.5; }
    .sub { color: #6B7C79; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    th, td { border: 1px solid #DDE7E4; padding: 5px 6px; text-align: left; vertical-align: top; font-size: 9.5pt; }
    th { background: #E3F3F0; }
    tr { page-break-inside: avoid; }
    .note { color: #6B7C79; font-size: 9pt; }
    .nowrap { white-space: nowrap; }
    .hash { font-family: Menlo, monospace; font-size: 8pt; word-break: break-all; }
    .entry { margin: 8px 0; padding: 8px; border-left: 3px solid #2F8F83; background: #F6F8F7; page-break-inside: avoid; }
    .footer { margin-top: 32px; color: #6B7C79; font-size: 8pt; text-align: center; }
  </style></head><body>${parts.join('\n')}</body></html>`;
}
