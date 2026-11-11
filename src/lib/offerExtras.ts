// AGENCYOS_OFFER_V2: extra parts of the Offer Letter - Annexure A (terms), Annexure B (salary table)
// and the candidate's acceptance. Used by docHtml in DocumentCenter.
import type { DocTemplate } from './docTemplates';

const n = (v?: string) => { const x = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(x) ? x : 0; };
const rs = (x: number) => (x ? 'Rs. ' + Math.round(x).toLocaleString('en-IN') : '-');

export const SALARY_ROWS: [string, string][] = [
  ['Basic', 'sBasic'], ['HRA', 'sHra'], ['Special Allowance', 'sSpecial'], ['Conveyance', 'sConv'],
  ['Medical', 'sMedical'], ['LTA', 'sLta'], ['PF (Employer Contribution)', 'sPf'],
];

export function salaryTotals(v: Record<string, string>) {
  const monthly = SALARY_ROWS.reduce((s, [, k]) => s + n(v[k]), 0);
  const bonus = n(v.sBonus);
  return { monthly, annual: monthly * 12, bonus, ctc: monthly * 12 + bonus };
}

// CTC in the letter always matches the salary table (Annexure B)
export function offerValues(t: DocTemplate, v: Record<string, string>) {
  if (!t.salary) return v;
  const { ctc } = salaryTotals(v);
  return ctc ? { ...v, ctc: rs(ctc) + ' per annum' } : v;
}

export function offerExtrasHtml(t: DocTemplate, v: Record<string, string>, fill: (s: string) => string) {
  if (!t.annexA && !t.salary && !t.accept) return '';
  const h3 = (s: string) => `<div style="font-size:15px;font-weight:700;color:#1B3F8B;margin:0 0 8px">${s}</div>`;
  let out = '';
  if (t.annexA?.length) {
    out += `<div style="break-before:page;page-break-before:always;padding-top:4px">${h3('Annexure A - Terms and Conditions')}`;
    out += t.annexA.map((s, i) => `<div style="font-weight:700;margin:10px 0 3px">${i + 1}. ${fill(s.h)}</div><div style="line-height:1.6">${fill(s.p)}</div>`).join('');
    out += '</div>';
  }
  if (t.salary) {
    const { monthly, annual, bonus, ctc } = salaryTotals(v);
    const td = 'border:1px solid #9AA6B8;padding:6px 10px';
    const rows = SALARY_ROWS.map(([label, k]) => `<tr><td style="${td}">${label}</td><td style="${td};text-align:right">${rs(n(v[k]))}</td><td style="${td};text-align:right">${rs(n(v[k]) * 12)}</td></tr>`).join('');
    out += `<div style="break-before:page;page-break-before:always;padding-top:4px">${h3('Annexure B - Compensation Structure')}
<div style="margin-bottom:8px">Your monthly and annual salary structure is given below.</div>
<table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr style="background:#0B1A3A;color:#fff"><th style="${td};text-align:left">Components</th><th style="${td};text-align:right">Monthly (INR)</th><th style="${td};text-align:right">Annual (INR)</th></tr>
${rows}<tr><td style="${td}">Bonus (Annual)</td><td style="${td};text-align:right">-</td><td style="${td};text-align:right">${rs(bonus)}</td></tr>
<tr style="font-weight:700;background:#F3F5FA"><td style="${td}">Total</td><td style="${td};text-align:right">${rs(monthly)}</td><td style="${td};text-align:right">${rs(annual + bonus)}</td></tr>
<tr style="font-weight:800;background:#F4B400"><td style="${td}" colspan="2">CTC (Cost to Company)</td><td style="${td};text-align:right">${rs(ctc)}</td></tr></table>
<div style="margin-top:10px;font-size:11.5px;line-height:1.55">Note: You will receive salary, and all other benefits forming part of your remuneration package, subject to and after deduction of TDS, PF, ESI and professional tax in accordance with applicable law. The components may be restructured as per company policy without changing the total CTC.</div></div>`;
  }
  if (t.accept) {
    const line = (l: string) => `<div style="margin-top:14px">${l}: <span style="display:inline-block;width:70mm;border-bottom:1px solid #64748B">&nbsp;</span></div>`;
    out += `<div style="margin-top:26px;border-top:1px dashed #9AA6B8;padding-top:14px">${h3('Acceptance by the Candidate')}<div style="line-height:1.6">${fill(t.accept)}</div>${line('Name')}${line('Signature')}${line('Date')}</div>`;
  }
  return out;
}