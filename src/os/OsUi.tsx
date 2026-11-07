// AGENCYOS_V3_OS: shared building blocks (cards, KPIs, pills, tables, modal, toast)
import React, { useEffect, useState } from 'react';
import { Icon } from './icons';

export const statusClass = (s: string) =>
  /paid|approved|active|completed|verified|won|sent|ready|resolved|present|connected|on time|hired|issued|healthy|on track|signed|joined|done|published|allowed|delivered/i.test(s) ? 'green'
    : /overdue|rejected|blocked|lost|failed|urgent|suspended|critical|denied|missing|rework|escalat/i.test(s) ? 'red'
      : /pending|review|unpaid|follow|progress|partial|draft|due|scheduled|interview|high|screening|attention|awaiting|planned|medium|open/i.test(s) ? 'yellow' : 'blue';

export const Pill: React.FC<{ v: React.ReactNode; tone?: string }> = ({ v, tone }) => <span className={`pill ${tone || statusClass(String(v))}`}>{v}</span>;

export const inrS = (v: number) => {
  const a = Math.abs(v || 0), s = v < 0 ? '-' : '';
  if (a >= 1e7) return s + '\u20B9' + (a / 1e7).toFixed(2).replace(/\.?0+$/, '') + 'Cr';
  if (a >= 1e5) return s + '\u20B9' + (a / 1e5).toFixed(2).replace(/\.?0+$/, '') + 'L';
  return s + '\u20B9' + Math.round(a).toLocaleString('en-IN');
};
export const inrF = (v: number) => '\u20B9' + Math.round(v || 0).toLocaleString('en-IN');
export const today = () => new Date().toISOString().slice(0, 10);
export const fmtD = (iso?: string) => { if (!iso) return '\u2014'; const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso); return isNaN(+d) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); };
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const initials = (name: string) => (name || '?').split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
export const daysBetween = (a: string, b: string) => Math.round((+new Date(b + 'T00:00:00') - +new Date(a + 'T00:00:00')) / 86400000);

export const Kpi: React.FC<{ name: string; value: React.ReactNode; desc: string; icon: string; trend?: string }> = ({ name, value, desc, icon, trend }) => (
  <div className="card kpi"><div className="kpi-top"><span>{name}</span><span className="icon-tile"><Icon name={icon} size={18} /></span></div>
    <div className="kpi-value">{value}</div><div className="kpi-footer">{trend && <span className={trend.startsWith('-') ? 'trend-down' : 'trend-up'}>{trend}</span>}<span>{desc}</span></div></div>
);

export const Rows: React.FC<{ items: [string, string, string][]; empty?: string; onClick?: (i: number) => void }> = ({ items, empty, onClick }) => (
  <>{items.length ? items.map((r, i) => <div key={i} className={`list-row ${onClick ? 'hover-link' : ''}`} onClick={onClick ? () => onClick(i) : undefined}><div><b>{r[0]}</b><small>{r[1]}</small></div><div className="right"><Pill v={r[2]} /></div></div>) : <div className="os-empty">{empty || 'Nothing here right now.'}</div>}</>
);

export const Bars: React.FC<{ values: number[]; labels: string[]; legend: string; note?: string }> = ({ values, labels, legend, note }) => {
  const max = Math.max(1, ...values);
  return (<><div className="chart-space"><div className="metric-bars">{values.map((v, i) => <div key={i} className="bar-unit" title={String(v)}><div className="bar" style={{ height: `${Math.max(3, (v / max) * 92)}%` }} /><label>{labels[i]}</label></div>)}</div></div>
    <div className="legend"><span><i /> {legend}</span>{note && <span>{note}</span>}</div></>);
};

export const Panel: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({ title, right, children, style, className }) => (
  <div className={`card panel ${className || ''}`} style={style}><div className="panel-title"><h3>{title}</h3>{right}</div>{children}</div>
);

export const Activity: React.FC<{ items: { who: string; title: string; text: string; time: string }[] }> = ({ items }) => (
  <div className="activity">{items.length ? items.map((r, i) => <div key={i} className="activity-item"><div className="mini-avatar">{r.who}</div><div><b>{r.title}</b><span>{r.text}</span></div><time>{r.time}</time></div>) : <div className="os-empty">No activity yet.</div>}</div>
);

export const Notice: React.FC<{ icon?: string; title?: string; children: React.ReactNode; neutral?: boolean; style?: React.CSSProperties }> = ({ icon = 'shield', title, children, neutral = true, style }) => (
  <div className={`notice ${neutral ? 'neutral' : ''}`} style={style}><Icon name={icon} size={18} /><div>{title && <strong>{title}</strong>}{children}</div></div>
);

export interface Col<T> { h: string; v: (r: T) => React.ReactNode; s?: (r: T) => string; wrap?: boolean }
export function DataTable<T>({ rows, cols, filters, search = true, actions, empty, top }: {
  rows: T[]; cols: Col<T>[]; filters?: string[]; search?: boolean; actions?: (r: T) => React.ReactNode; empty?: string; top?: React.ReactNode;
}) {
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [page, setPage] = useState(0);
  const text = (r: T) => cols.map((c) => (c.s ? c.s(r) : String(c.v(r) ?? ''))).join(' ').toLowerCase();
  const list = rows.filter((r) => (!q || text(r).includes(q.toLowerCase())) && (f === 'All' || text(r).includes(f.toLowerCase())));
  const per = 25, pages = Math.max(1, Math.ceil(list.length / per)), pg = Math.min(page, pages - 1);
  return (
    <div className="card">
      <div className="toolbar"><div className="toolbar-left">
        {search && <input className="field search-field" placeholder="Search records..." value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />}
        {filters && <div className="filter-chips">{['All', ...filters].map((x) => <button key={x} className={f === x ? 'active' : ''} onClick={() => { setF(x); setPage(0); }}>{x}</button>)}</div>}
        {top}
      </div><span className="muted">{list.length} record{list.length === 1 ? '' : 's'}</span></div>
      <div className="table-scroll"><table className="data-table"><thead><tr>{cols.map((c) => <th key={c.h}>{c.h}</th>)}{actions && <th>Action</th>}</tr></thead>
        <tbody>{list.length ? list.slice(pg * per, pg * per + per).map((r, i) => <tr key={i}>{cols.map((c) => <td key={c.h} className={c.wrap ? 'wrap' : ''}>{c.v(r)}</td>)}{actions && <td>{actions(r)}</td>}</tr>)
          : <tr><td colSpan={cols.length + (actions ? 1 : 0)} className="os-empty">{empty || 'No matching records'}</td></tr>}</tbody></table></div>
      <div className="table-footer"><span>Page {pg + 1} of {pages}</span><div><button onClick={() => setPage(Math.max(0, pg - 1))}>Prev</button> <button onClick={() => setPage(Math.min(pages - 1, pg + 1))}>Next</button></div></div>
    </div>
  );
}

export const OsModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, footer, wide }) => (
  <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" style={wide ? { width: 'min(820px,100%)' } : undefined}><div className="modal-top"><b>{title}</b><button className="top-icon" style={{ width: 30, height: 30, fontSize: 18 }} onClick={onClose}>{'\u00D7'}</button></div>
      <div className="modal-body">{children}</div>{footer && <div className="modal-footer">{footer}</div>}</div>
  </div>
);

// ---- toast ----
let pushToast: (m: string) => void = () => undefined;
export const toast = (m: string) => pushToast(m);
export const ToastHost: React.FC = () => {
  const [msg, setMsg] = useState('');
  useEffect(() => { pushToast = (m) => { setMsg(m); window.setTimeout(() => setMsg(''), 2800); }; }, []);
  return msg ? <div className="toast">{msg}</div> : null;
};

// ---- small form helpers ----
export interface FieldDef { k: string; label: string; type?: 'text' | 'number' | 'date' | 'select' | 'textarea'; options?: string[]; wide?: boolean; required?: boolean }
export const FormGrid: React.FC<{ fields: FieldDef[]; value: Record<string, any>; onChange: (v: Record<string, any>) => void }> = ({ fields, value, onChange }) => (
  <div className="form-grid">{fields.map((f) => (
    <div key={f.k} className={`form-group ${f.wide || f.type === 'textarea' ? 'wide' : ''}`}><label>{f.label}{f.required ? ' *' : ''}</label>
      {f.type === 'select' ? <select value={value[f.k] ?? ''} onChange={(e) => onChange({ ...value, [f.k]: e.target.value })}><option value="">Select{'\u2026'}</option>{(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : f.type === 'textarea' ? <textarea value={value[f.k] ?? ''} onChange={(e) => onChange({ ...value, [f.k]: e.target.value })} />
          : <input type={f.type || 'text'} value={value[f.k] ?? ''} onChange={(e) => onChange({ ...value, [f.k]: f.type === 'number' ? e.target.value : e.target.value })} />}
    </div>))}</div>
);
