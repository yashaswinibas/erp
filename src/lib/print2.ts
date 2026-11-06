// Printable receipts, agreements and scopes of work (uses printHtml from print.ts).
import { CompanyConfig } from '../types';
import { printHtml } from './print';
import { inr, rupeesInWords } from './money';
import { fmtDate } from './dates';
import { AgreementClause, SowContent } from './crmTypes';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const kv = (rows: [string, unknown][]) => `<div class="kv">${rows.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v ?? '-')}</div>`).join('')}</div>`;

export function printReceipt(c: CompanyConfig, d: {
  receiptNo: string; date: string; clientName: string; clientAddress?: string; amount: number; method: string; reference: string;
  lines: { label: string; amount: number }[]; recordedBy: string;
}) {
  const rows = d.lines.map((l) => `<tr><td>${esc(l.label)}</td><td class="r">${inr(l.amount)}</td></tr>`).join('');
  printHtml(`Receipt ${d.receiptNo}`, c, `<h2>Payment receipt</h2>
${kv([['Receipt no.', d.receiptNo], ['Date', fmtDate(d.date)], ['Received from', d.clientName], ['Address', d.clientAddress], ['Payment mode', d.method], ['Reference', d.reference || '-']])}
<table><tr><th>Applied to</th><th class="r">Amount</th></tr>${rows}<tr><th>Total received</th><th class="r">${inr(d.amount)}</th></tr></table>
<div class="muted">${esc(rupeesInWords(d.amount))}</div>
<div class="sign"><div>Received by: ${esc(d.recordedBy)}</div><div>For ${esc(c.name)}<br><br><br>Authorised signatory</div></div>`);
}

export function printAgreement(c: CompanyConfig, d: {
  number: string; title: string; clientName: string; clientAddress?: string; startDate: string; endDate: string; value: number;
  terms: string; clauses: AgreementClause[]; version: number;
  schedule: { label: string; dueDate: string; amount: number }[];
}) {
  const clauses = d.clauses.map((cl, i) => `<p><b>${i + 1}. ${esc(cl.title)}</b><br>${esc(cl.text).replace(/\n/g, '<br>')}</p>`).join('');
  const sched = d.schedule.length ? `<h3>Payment schedule</h3><table><tr><th>#</th><th>Instalment</th><th>Due date</th><th class="r">Amount</th></tr>${d.schedule.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.label)}</td><td>${fmtDate(s.dueDate)}</td><td class="r">${inr(s.amount)}</td></tr>`).join('')}</table>` : '';
  printHtml(`Agreement ${d.number}`, c, `<h2>Service agreement</h2>
${kv([['Agreement no.', d.number], ['Version', d.version], ['Client', d.clientName], ['Client address', d.clientAddress], ['Start date', fmtDate(d.startDate)], ['End date', fmtDate(d.endDate)], ['Contract value', inr(d.value)], ['Title', d.title]])}
<div class="body">${esc(d.terms)}</div>${clauses}${sched}
<div class="sign"><div>For ${esc(c.name)}<br><br><br>Authorised signatory</div><div>For ${esc(d.clientName)}<br><br><br>Signature &amp; date</div></div>`);
}

export function printSow(c: CompanyConfig, d: {
  number: string; title: string; clientName: string; projectName?: string; version: number; status: string;
  content: SowContent; team: string[]; approvedBy?: string; approvedOn?: string;
}) {
  const s = d.content;
  const ms = s.milestones.length ? `<table><tr><th>Milestone</th><th>Due date</th><th class="r">Amount</th><th>Status</th></tr>${s.milestones.map((m) => `<tr><td>${esc(m.title)}</td><td>${fmtDate(m.dueDate)}</td><td class="r">${m.amount ? inr(m.amount) : '-'}</td><td>${m.done ? 'Done' : 'Open'}</td></tr>`).join('')}</table>` : '<p class="muted">No milestones.</p>';
  printHtml(`SOW ${d.number}`, c, `<h2>Scope of work</h2>
${kv([['SOW no.', d.number], ['Version', d.version], ['Client', d.clientName], ['Project', d.projectName], ['Status', d.status], ['Team', d.team.join(', ')]])}
<h3>Objectives</h3><div class="body">${esc(s.objectives)}</div>
<h3>Deliverables</h3><ol>${s.deliverables.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
<h3>Milestones</h3>${ms}
<h3>Timeline</h3><div class="body">${esc(s.timeline)}</div>
<h3>Assumptions</h3><div class="body">${esc(s.assumptions)}</div>
<h3>Out of scope</h3><div class="body">${esc(s.exclusions)}</div>
${d.approvedBy ? `<p><b>Approved by client:</b> ${esc(d.approvedBy)} on ${fmtDate(d.approvedOn)}</p>` : ''}
<div class="sign"><div>For ${esc(c.name)}<br><br><br>Authorised signatory</div><div>Client approval<br><br><br>Signature &amp; date</div></div>`);
}
