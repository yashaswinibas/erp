// AGENCYOS_DB: first-time database setup notice on the login screen
import React, { useEffect, useState } from 'react';
import { dbEnabled, dbSetupStatus, dbImportThisBrowser } from '../lib/dbSync';

export const DbSetup: React.FC = () => {
  const [st, setSt] = useState<'off' | 'checking' | 'empty' | 'ok' | 'down'>(dbEnabled() ? 'checking' : 'off');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (dbEnabled()) dbSetupStatus().then((s) => setSt(!s ? 'down' : s.empty ? 'empty' : 'ok')); }, []);
  if (st === 'off' || st === 'checking') return null;
  if (st === 'down') return <div className="notice" style={{ background: '#FEEDEC', borderColor: '#F8D5D1', color: '#B42318' }}><div><strong>Database server is not running.</strong>Open a second PowerShell in the project folder and run <code>npm.cmd run server</code>, then refresh.</div></div>;
  if (st === 'ok') return <div className="tiny-note" style={{ margin: '0 0 10px', color: '#087F59' }}>{'\u25CF'} Connected to the company database</div>;
  return (<div className="notice"><div><strong>New empty database</strong>Copy the people and records saved in this browser into PostgreSQL. Do this once, on the computer that has your real data.
    <div style={{ marginTop: 8 }}><button type="button" className="soft-button" disabled={busy} onClick={async () => { if (!confirm('Copy all data from this browser into the database now?')) return; setBusy(true); const m = await dbImportThisBrowser(); setBusy(false); setMsg(m); if (/^Copied/.test(m)) setSt('ok'); }}>{busy ? 'Copying\u2026' : 'Copy this browser\u2019s data to the database'}</button></div>
    {msg && <div style={{ marginTop: 6 }}>{msg}</div>}</div></div>);
};
