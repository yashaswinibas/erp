// Printable documents: opens a clean A4 page and the print dialog,
// where the user can choose "Save as PDF".
import { CompanyConfig } from '../types';
import { inr, rupeesInWords } from './money';
import { fmtDate } from './dates';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

const CSS = `*{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:32px;font-size:12px}
.head{display:flex;gap:16px;align-items:center;border-bottom:2px solid #1e3a8a;padding-bottom:12px;margin-bottom:16px}
.head img{height:70px;width:70px;object-fit:cover;border-radius:50%} .head h1{margin:0;font-size:20px} .head p{margin:2px 0;color:#555;font-size:11px}
h2{text-align:center;font-size:16px;margin:8px 0 16px;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin:8px 0} th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
th{background:#f1f5f9} .r{text-align:right} .kv{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:12px}
.kv b{display:inline-block;min-width:120px} .total{font-size:15px;font-weight:bold;margin-top:8px} .muted{color:#666}
.body{white-space:pre-wrap;line-height:1.6;font-size:12.5px} .sign{margin-top:48px;display:flex;justify-content:space-between}
@media print{body{padding:0}} @page{size:A4;margin:16mm}`;

function openDoc(title: string, css: string, html: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups for this site to print or save PDFs.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script></body></html>`);
  w.document.close();
}

export function printHtml(title: string, c: CompanyConfig, body: string) {
  openDoc(title, CSS, `<div class="head">${c.logoUrl ? `<img src="${esc(c.logoUrl)}" onerror="this.style.display='none'">` : ''}<div><h1>${esc(c.name)}</h1><p>${esc(c.address)}</p><p>${esc(c.phone)} | ${esc(c.email)} | GSTIN ${esc(c.gstNumber)}</p></div></div>
${body}`);
}

const kv = (rows: [string, unknown][]) => `<div class="kv">${rows.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v ?? '-')}</div>`).join('')}</div>`;

const SLIP_CSS = `*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;margin:0;padding:28px;font-size:12px;background:#fff}
.slip{max-width:780px;margin:0 auto;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:#0f172a;color:#fff}
.brand{display:flex;gap:14px;align-items:center}.brand img{height:66px;width:66px;object-fit:cover;object-position:center;border-radius:50%;border:2px solid #f59e0b;transform:scale(1)}
.brand h1{margin:0;font-size:19px}.brand p{margin:2px 0 0;font-size:10.5px;color:#cbd5e1}
.ttl{text-align:right}.ttl .t{font-size:20px;font-weight:800;letter-spacing:2px}.ttl .p{font-size:12px;color:#cbd5e1;margin-top:2px}.ttl .n{font-size:10.5px;color:#94a3b8;margin-top:4px}
.sec{padding:16px 22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.grid div{display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #e2e8f0}.grid div:nth-child(odd){border-right:1px solid #e2e8f0}
.grid span{color:#64748b}.grid b{font-weight:600;text-align:right}
.att{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.att div{border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;background:#f8fafc}
.att span{display:block;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}.att b{font-size:16px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
table{width:100%;border-collapse:collapse;border:1.5px solid #0f172a}th{background:#1f2937;color:#fff;text-align:left;padding:9px 12px;font-size:12.5px}
th.r,td.r{text-align:right}td{padding:9px 12px;border-top:1px solid #0f172a;font-size:12.5px}tr.tot td{font-weight:700;background:#f1f5f9}
th+th,td+td{border-left:1.5px solid #0f172a}
.net{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding:14px 18px;border-radius:10px;background:#ecfdf5;border:1.5px solid #10b981}
.net .l{font-size:11px;color:#065f46;text-transform:uppercase;letter-spacing:1px;font-weight:700}.net .w{font-size:11px;color:#047857;margin-top:3px}.net .a{font-size:24px;font-weight:800;color:#065f46}
.foot{display:flex;justify-content:space-between;padding:12px 22px;border-top:1px solid #e2e8f0;font-size:10.5px;color:#64748b;background:#f8fafc}
@media print{body{padding:0}.slip{border-radius:0}} @page{size:A4;margin:12mm}`;

export function printPayslip(c: CompanyConfig, d: {
  period: string; slipNumber: string; employee: { name: string; code: string; designation?: string; department?: string; bankLast4?: string; joiningDate?: string; bankName?: string; pan?: string };
  workingDays: number; payableDays: number; unpaidDays: number;
  earnings: { name: string; amount: number }[]; deductions: { name: string; amount: number }[];
  gross: number; totalDeductions: number; net: number; employerPf: number; employerEsi: number;
  paidOn?: string; paymentMode?: string;
}) {
  const rows = (list: { name: string; amount: number }[], empty: string) =>
    (list.length ? list : [{ name: empty, amount: 0 }]).map((l) => `<tr><td>${esc(l.name)}</td><td class="r">${inr(l.amount)}</td></tr>`).join('');
  const info: [string, unknown][] = [
    ['Employee name', d.employee.name], ['Employee ID', d.employee.code],
    ['Designation', d.employee.designation || '-'], ['Department', d.employee.department || '-'],
    ['Date of joining', fmtDate(d.employee.joiningDate)], ['Bank account', d.employee.bankLast4 ? `${d.employee.bankName ? d.employee.bankName + ' ' : ''}XXXX${d.employee.bankLast4}` : '-'],
    ['Pay period', d.period], ['Payment', d.paidOn ? `${fmtDate(d.paidOn)}${d.paymentMode ? ' - ' + d.paymentMode : ''}` : 'Pending'],
  ];
  openDoc(`Payslip ${d.employee.code} ${d.period}`, SLIP_CSS, `<div class="slip">
<div class="top"><div class="brand">${c.logoUrl ? `<img src="${esc(c.logoUrl)}" onerror="this.style.display='none'">` : ''}<div><h1>${esc(c.name)}</h1><p>${esc(c.address)}</p><p>GSTIN ${esc(c.gstNumber)} | ${esc(c.phone)} | ${esc(c.email)}</p></div></div>
<div class="ttl"><div class="t">PAYSLIP</div><div class="p">${esc(d.period)}</div><div class="n">No. ${esc(d.slipNumber)}</div></div></div>
<div class="sec"><div class="grid">${info.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
<div class="att"><div><span>Working days</span><b>${d.workingDays}</b></div><div><span>Paid days</span><b>${d.payableDays}</b></div><div><span>Loss of pay days</span><b>${d.unpaidDays}</b></div><div><span>Gross earnings</span><b>${inr(d.gross)}</b></div></div></div>
<div class="sec" style="padding-top:0"><div class="cols">
<table><tr><th>Earnings</th><th class="r">Amount</th></tr>${rows(d.earnings, 'No earnings')}<tr class="tot"><td>Gross salary</td><td class="r">${inr(d.gross)}</td></tr></table>
<table><tr><th>Deductions</th><th class="r">Amount</th></tr>${rows(d.deductions, 'No deductions')}<tr class="tot"><td>Total deductions</td><td class="r">${inr(d.totalDeductions)}</td></tr></table>
</div>
<div class="net"><div><div class="l">Net payable</div><div class="w">${esc(rupeesInWords(d.net))}</div></div><div class="a">${inr(d.net)}</div></div>
${d.employerPf || d.employerEsi ? `<p style="font-size:10.5px;color:#64748b;margin:10px 2px 0">Employer contributions (not part of net pay): PF ${inr(d.employerPf)} | ESI ${inr(d.employerEsi)}</p>` : ''}
</div>
<div class="foot"><span>This is a computer-generated payslip and does not need a signature.</span><span>${esc(c.website || '')}</span></div>
</div>`);
}

export function printLetter(c: CompanyConfig, title: string, body: string) {
  printHtml(title, c, `<h2>${esc(title)}</h2><div class="body">${esc(body)}</div>
<div class="sign"><div>For ${esc(c.name)}<br><br><br>Authorised signatory</div><div>Accepted by<br><br><br>Signature &amp; date</div></div>`);
}
