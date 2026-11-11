// AGENCYOS_BRAND_DOCS: official Priority Ads Agency quotation / invoice / letter format
// (same layout as the company's Word templates). Used for preview, print and Save as PDF.
import { inr, rupeesInWords } from './money';
import { fmtDate } from './dates';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const br = (s: unknown) => esc(s).replace(/\r?\n/g, '<br>');
const num = (n: unknown) => Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const d8 = (s?: string) => (s ? fmtDate(s) : '');
const origin = () => (typeof location !== 'undefined' ? location.origin : '');

export const BRAND = {
  phone: '+91 7760665912',
  email: 'ningappa@priorityadsagency.com',
  web: 'www.priorityadsagency.com',
  addr1: 'SV Arcade No.116, Gurunath Layout, Opp Bus Stop',
  addr2: 'Huralichikkanahalli, Hesragatta Main Road,',
  addr3: 'Bangalore - 560090, Karnataka, India',
  services: ['Digital Marketing', 'Website Development', 'Video Editing', 'Meta Ads', 'Social Media Marketing', 'SEO Services', 'Google Ads', 'Branding & Design', 'Business Growth'],
};

export interface BrandClient { companyName?: string; contactPerson?: string; email?: string; phone?: string; address?: string; billingAddress?: string; gstNumber?: string }
export interface BrandItem { description?: string; quantity?: number; unit?: string; unitPrice?: number; total?: number }

const CSS = `
.pb,.pb *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pb{font-family:Arial,Helvetica,sans-serif;color:#0B1A3A;background:#fff;margin:0 auto;display:flex;flex-direction:column}
.pb.land{width:297mm;min-height:200mm;padding:7mm 10mm 6mm}
.pb.port{width:210mm;min-height:286mm;padding:9mm 12mm 7mm}
.pb-head{display:flex;align-items:flex-start;gap:14px}
.pb-logo{height:31mm;width:auto;display:block}
.port .pb-logo{height:25mm}
.pb-vline{width:2px;align-self:stretch;background:#F4B400;margin:4mm 2px 0}
.pb-contact{font-size:11.5px;line-height:1.75;color:#0B1A3A;padding-top:1mm;flex:1}
.port .pb-contact{font-size:9.5px;line-height:1.6;white-space:nowrap}
.pb-contact .ic{display:inline-block;width:16px;color:#C62828;font-weight:700}
.pb-contact .ind{padding-left:16px}
.pb-title{text-align:right;min-width:78mm}
.pb-title h1{margin:2mm 0 2mm;font-size:34px;letter-spacing:.5px;color:#1B3F8B;font-weight:800;text-align:center}
.port .pb-title{min-width:46mm}.port .pb-title h1{font-size:26px}
.pb-meta{border-collapse:collapse;width:100%;font-size:12px}
.pb-meta td{border:1px solid #9AA6B8;padding:2px 8px;text-align:center;white-space:nowrap}
.pb-meta td.k{border:2px solid #F4B400;text-align:left;font-weight:700;width:46%}
.pb-gold{height:3px;background:#F4B400;margin:3mm 0 3mm}
.pb table.grid{width:100%;border-collapse:collapse;font-size:12.5px}
.pb .nh{background:#0B1A3A;color:#fff;font-weight:700;text-transform:uppercase;padding:3px 8px;text-align:left;font-size:12.5px}
.pb .party td{border:1px solid #9AA6B8;vertical-align:top;padding:4px 8px;line-height:1.55;width:50%}
.pb .party td.nh{border-color:#0B1A3A}
.pb .lbl{color:#334155}
.pb .items{margin-top:4mm}
.pb .items th{background:#0B1A3A;color:#fff;font-weight:700;padding:5px 8px;text-transform:uppercase;font-size:12.5px;border-left:1px solid #33415A}
.pb .items th.hash{border:2px solid #F4B400;width:9mm}
.pb .items td{border:1px solid #C3CBD8;padding:5px 8px;font-size:12.5px;height:7mm}
.pb .items tbody tr:nth-child(even) td{background:#F3F5FA}
.pb .items td.c{text-align:center}.pb .items td.n{text-align:center;font-weight:700}
.pb .items .desc{width:auto}.pb .items .qty{width:26mm}.pb .items .rate{width:42mm}.pb .items .amt{width:56mm}
.pb .tot td{border:1px solid #C3CBD8;padding:4px 8px;font-size:12.5px}
.pb .tot .k{font-weight:700;text-transform:uppercase}
.pb .tot .v{text-align:center;font-weight:700;font-size:14px}
.pb .tot .gk{background:#0B1A3A;color:#fff;text-align:center;font-weight:700}
.pb .tot .gv{background:#F4B400;color:#0B1A3A;text-align:center;font-weight:800;font-size:18px}
.pb .tot tr.sh td{background:#F3F5FA}
.pb .descr{margin-top:3mm;font-size:12.5px}.pb .descr b{display:block;font-size:13.5px;margin-bottom:2px}
.pb .foot3{margin-top:2mm}
.pb .foot3 td{border:1px solid #C3CBD8;vertical-align:middle;padding:4px 8px;font-size:11px;line-height:1.45}
.pb .foot3 td.thanks{text-align:center;color:#1B3F8B;font-weight:800;font-size:22px;line-height:1.25;text-transform:uppercase}
.pb .svc{text-align:center;font-weight:700;font-size:11px}
.pb .band{background:#0B1A3A;color:#F4B400;text-align:center;font-weight:800;font-size:17px;padding:2px 0;margin-top:2mm;letter-spacing:.3px}
.pb .sum td{border:1px solid #C3CBD8;padding:3px 8px;font-size:12px;vertical-align:middle}
.pb .sum .gt{background:#E8ECF6;font-weight:800;font-size:15px}
.pb .sum .ap{font-weight:700}
.pb .sum .pay{background:#F4B400;font-weight:800;font-size:16px;text-align:center}
.pb .sum .ty{color:#1B3F8B;font-weight:800;font-size:14px}
.pb .rs{font-weight:700;margin-right:14px}
.pb .spacer{flex:1}
.pb .pfoot{border-top:2px solid #1B3F8B;margin-top:4mm;padding-top:2mm;text-align:center;font-size:10px;color:#0B1A3A}
.pb .pfoot b{font-size:10.5px}
.pb .body{font-size:12.5px;line-height:1.65;color:#0F172A}
.pb .body h2{color:#1B3F8B;text-align:center;text-transform:uppercase;font-size:17px;margin:2mm 0 4mm}
.pb .body>div>div:first-child{display:none!important}
`;

const head = (title: string, meta: [string, string][]) => `<div class="pb-head">
<img class="pb-logo" src="${origin()}/brand-logo.jpg" alt="Priority Ads Agency">
<div class="pb-vline"></div>
<div class="pb-contact">
<div><span class="ic">&#9742;</span>${esc(BRAND.phone)}</div>
<div><span class="ic">&#9993;</span>${esc(BRAND.email)}</div>
<div><span class="ic">&#9678;</span>${esc(BRAND.web)}</div>
<div><span class="ic">&#8982;</span>${esc(BRAND.addr1)}</div>
<div class="ind">${esc(BRAND.addr2)}</div>
<div class="ind">${esc(BRAND.addr3)}</div>
</div>
<div class="pb-title">${title ? `<h1>${esc(title)}</h1>` : '<div style="height:6mm"></div>'}
<table class="pb-meta">${meta.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td>${esc(v || '-')}</td></tr>`).join('')}</table></div>
</div><div class="pb-gold"></div>`;

const footLine = () => `<div class="pfoot"><b>${esc(BRAND.phone)} &nbsp;|&nbsp; ${esc(BRAND.email)} &nbsp;|&nbsp; ${esc(BRAND.web)}</b><br>${esc(BRAND.addr1)} ${esc(BRAND.addr2)} ${esc(BRAND.addr3)}</div>`;

function itemRows(items: BrandItem[] = [], minRows = 5) {
  const rows = items.map((it, i) => `<tr><td class="n">${i + 1}</td><td>${br(it.description)}</td><td class="c">${esc(it.quantity ?? '')}${it.unit ? ' ' + esc(it.unit) : ''}</td><td class="c">${num(it.unitPrice)}</td><td class="c">${num(it.total ?? Number(it.quantity || 0) * Number(it.unitPrice || 0))}</td></tr>`);
  for (let i = items.length; i < minRows; i++) rows.push('<tr><td class="n"></td><td></td><td></td><td></td><td></td></tr>');
  return rows.join('');
}

const addrOf = (c?: BrandClient) => c?.billingAddress || c?.address || '';

// ---------------- QUOTATION ----------------
export function quotationPage(q: {
  quotationNumber?: string; date?: string; validUntil?: string; title?: string; items?: BrandItem[];
  subtotal?: number; discount?: number; taxPercent?: number; taxAmount?: number; total?: number;
  terms?: string; notes?: string; paidAmount?: number; clientName?: string;
}, c?: BrandClient) {
  const total = Number(q.total || 0), paid = Number(q.paidAmount || 0);
  const terms = [`Quotation validity: ${q.validUntil ? 'valid until ' + d8(q.validUntil) : '30 days from the date of quotation'}`,
    ...String(q.terms || '').split(/\r?\n|\s(?=\d{1,2}[.)]\s)/).map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean)];
  if (terms.length === 1) terms.push('Payment terms: 50% advance on confirmation, balance on delivery', 'Delivery / completion: as per the agreed timeline');
  const extra = [
    Number(q.subtotal || 0) !== total ? `<tr class="sh"><td colspan="3"></td><td class="k" style="text-align:center">SUBTOTAL</td><td class="v">${inr(q.subtotal)}</td></tr>` : '',
    Number(q.discount || 0) > 0 ? `<tr class="sh"><td colspan="3"></td><td class="k" style="text-align:center">DISCOUNT</td><td class="v">- ${inr(q.discount)}</td></tr>` : '',
    Number(q.taxAmount || 0) > 0 ? `<tr class="sh"><td colspan="3"></td><td class="k" style="text-align:center">GST (${esc(q.taxPercent ?? 18)}%)</td><td class="v">${inr(q.taxAmount)}</td></tr>` : '',
  ].join('');
  return `<div class="pb land">${head('QUOTATION', [['Quotation No.', q.quotationNumber || ''], ['Date', d8(q.date)], ['Valid Until', d8(q.validUntil)]])}
<table class="grid party"><tr><td class="nh">Quotation Prepared For</td><td class="nh">Customer Contact</td></tr>
<tr><td><span class="lbl">Customer / Company Name:</span> <b>${esc(c?.companyName || q.clientName || '')}</b><br><span class="lbl">Address:</span> ${br(addrOf(c))}</td>
<td><span class="lbl">Contact Person:</span> ${esc(c?.contactPerson || '')}<br><span class="lbl">Phone:</span> ${esc(c?.phone || '')}<br><span class="lbl">Email:</span> ${esc(c?.email || '')}</td></tr></table>
<table class="grid items"><thead><tr><th class="hash">#</th><th class="desc" style="text-align:center">Description</th><th class="qty">Qty.</th><th class="rate">Rate (&#8377;)</th><th class="amt">Amount (&#8377;)</th></tr></thead>
<tbody>${itemRows(q.items)}</tbody></table>
<table class="grid tot" style="table-layout:fixed"><colgroup><col style="width:9mm"><col><col style="width:26mm"><col style="width:42mm"><col style="width:56mm"></colgroup>
${extra}
<tr><td colspan="3"><span class="lbl">Notes / Special Inclusions:</span> ${br(q.notes || '')}</td><td class="gk">GRAND TOTAL</td><td class="gv">${inr(total)}</td></tr>
<tr class="sh"><td colspan="4" class="k">Amount Paid</td><td class="v">${inr(paid)}</td></tr>
<tr class="sh"><td colspan="4" class="k">Amount Payable</td><td class="v">${inr(Math.max(0, total - paid))}</td></tr></table>
<div class="descr"><b>DESCRIPTION</b>${q.title ? `<b style="font-size:12.5px;display:inline">${esc(q.title)}</b> &ndash; ` : ''}This quotation is for the services / products listed above, to be provided by Priority Ads Agency as per the mutually agreed scope and terms.</div>
<table class="grid foot3"><tr><td style="width:32%"><b>TERMS &amp; CONDITIONS</b><br>${terms.map((t, i) => `${i + 1}. ${esc(t)}`).join('<br>')}</td>
<td class="thanks" style="width:35%">Thank you!<br>For your business</td>
<td class="svc"><div style="margin-bottom:2px">OUR SERVICES</div>${BRAND.services.map(esc).join(' &bull; ')}</td></tr></table>
<div class="band">YOUR SUCCESS IS OUR PRIORITY</div></div>`;
}

// ---------------- INVOICE ----------------
export function invoicePage(v: {
  invoiceNumber?: string; issueDate?: string; dueDate?: string; items?: BrandItem[]; subtotal?: number; taxAmount?: number;
  totalAmount?: number; paidAmount?: number; balanceAmount?: number; notes?: string; clientName?: string;
}, c?: BrandClient, payRef = '') {
  const sub = Number(v.subtotal || 0), tax = Number(v.taxAmount || 0), total = Number(v.totalAmount || 0), paid = Number(v.paidAmount || 0);
  const diff = Math.round((total - sub - tax) * 100) / 100;
  const due = v.balanceAmount ?? Math.max(0, total - paid);
  const notes = String(v.notes || '').split(/\r?\n|\s(?=\d{1,2}[.)]\s)/).map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
  const pr = (k: string, val: number) => `${k}: <span class="rs">${inr(val)}</span>`;
  return `<div class="pb land">${head('INVOICE', [['Invoice No.', v.invoiceNumber || ''], ['Invoice Date', d8(v.issueDate)], ['Due Date', d8(v.dueDate)]])}
<table class="grid party"><tr><td class="nh">Bill To</td><td class="nh">Customer / Tax Details</td></tr>
<tr><td><span class="lbl">Customer / Company:</span> <b>${esc(c?.companyName || v.clientName || '')}</b><br><span class="lbl">Billing Address:</span> ${br(addrOf(c))}</td>
<td><span class="lbl">Contact Person:</span> ${esc(c?.contactPerson || '')} &nbsp;&nbsp; <span class="lbl">Phone:</span> ${esc(c?.phone || '')}<br><span class="lbl">Email:</span> ${esc(c?.email || '')}<br><span class="lbl">GSTIN:</span> ${esc(c?.gstNumber || '-')}</td></tr></table>
<table class="grid items"><thead><tr><th style="width:9mm">#</th><th class="desc" style="text-align:center">Description of Goods / Services</th><th class="qty">Qty.</th><th class="rate">Rate (&#8377;)</th><th class="amt">Amount (&#8377;)</th></tr></thead>
<tbody>${itemRows(v.items)}</tbody></table>
<table class="grid sum" style="margin-top:5mm"><tr><td class="nh" style="width:64%">Notes / Terms &amp; Conditions</td><td class="nh">Payment Summary</td></tr>
<tr><td>${notes.length ? notes.map((n, i) => `${i + 1}. ${esc(n)}`).join('<br>') : '1. Payment is due by the due date mentioned above.<br>2. Please mention the invoice number while making the payment.'}</td><td>${pr('Subtotal', sub)} &nbsp; ${pr('Tax / GST', tax)}</td></tr>
<tr><td><span class="lbl">Amount in words:</span> <b>${esc(rupeesInWords(total))}</b></td><td>${pr('Discount', diff < 0 ? -diff : 0)} &nbsp; ${pr('Other', diff > 0 ? diff : 0)}</td></tr>
<tr><td><span class="lbl">Payment method / reference:</span> ${esc(payRef || '-')}</td><td class="gt">GRAND TOTAL: ${inr(total)}</td></tr>
<tr><td><b>For PRIORITY ADS AGENCY &nbsp;|&nbsp; Authorized Signatory:</b> <span style="display:inline-block;width:60mm;border-bottom:1px solid #64748B">&nbsp;</span></td><td class="ap">AMOUNT PAID: ${inr(paid)}</td></tr>
<tr><td class="ty">Thank you for your business!</td><td class="pay">AMOUNT PAYABLE: ${inr(due)}</td></tr></table>
<div class="spacer"></div>${footLine()}</div>`;
}

// ---------------- LETTERS / DOCUMENT CENTER ----------------
export function letterPage(innerHtml: string, ref: string, date: string) {
  return `<div class="pb port">${head('', [['Ref No.', ref], ['Date', d8(date)]])}
<div class="body">${innerHtml}</div><div class="spacer"></div>${footLine()}<div class="band">YOUR SUCCESS IS OUR PRIORITY</div></div>`;
}

export const brandDocHtml = (title: string, page: string, landscape: boolean) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:0}html,body{margin:0;padding:0;background:#fff}${CSS}</style></head><body>${page}</body></html>`;

export function openBrandDoc(title: string, page: string, landscape: boolean) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups for this site to print or save PDFs.'); return; }
  w.document.write(brandDocHtml(title, page, landscape).replace('</body>', `<script>window.onload=function(){var p=document.querySelector('.pb'),H=${landscape ? 790 : 1118};if(p&&p.offsetHeight>H&&p.offsetHeight<H*1.25){p.style.zoom=String(H/p.offsetHeight)}setTimeout(function(){window.print()},400)}<\/script></body>`));
  w.document.close();
}