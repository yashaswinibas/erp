// AGENCYOS_LOGO
// AGENCYOS_V3_OS: sidebar, top bar and page header (AgencyOS prototype layout)
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './icons';
import { NAV_GROUPS, PAGES, pageById, ALIASES, roleLabel, osCanAccess } from './osConfig';
import { initials } from './OsUi';
import { useAlerts, useApprovalQueue } from './osData';

export const OsSidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { activeTab, setActiveTab, currentRole, currentUser, logout } = useApp();
  const [q, setQ] = useState('');
  const current = ALIASES[activeTab] || activeTab;
  const approvals = useApprovalQueue().filter((a) => a.canAct).length;
  const alerts = useAlerts().filter((a) => a.severity === 'Critical' || a.severity === 'High').length;
  const groups = useMemo(() => NAV_GROUPS.map((g) => ({ ...g, pages: PAGES.filter((p) => p.group === g.key && !p.hidden && osCanAccess(currentRole, p.id) && p.name.toLowerCase().includes(q.toLowerCase().trim())) })).filter((g) => g.pages.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRole, q, currentUser.workMode]);
  return (
    <>
      <div className={`backdrop ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><img src="/logo-wide.png" alt="Priority Ads Agency - Your success is our priority" style={{ width: '100%', maxWidth: 210, height: 'auto', display: 'block', margin: '0 auto' }} /><div className="tiny-note" style={{ textAlign: 'center', marginTop: 6 }}>AgencyOS {'\u00B7'} Internal Workspace</div>
          <div className="workspace-flag"><span className="dot" /> PRIORITY ADS AGENCY ONLY</div></div>
        <div className="nav-search"><Icon name="search" size={15} /><input placeholder="Search pages..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search pages" /></div>
        <div className="nav-scroll">
          {groups.map((g) => (
            <React.Fragment key={g.key}>
              <div className="nav-heading">{g.key}</div>
              {g.pages.map((p) => (
                <button key={p.id} className={`nav-item ${current === p.id ? 'active' : ''}`} onClick={() => { setActiveTab(p.id); onClose(); window.scrollTo({ top: 0 }); }}>
                  <Icon name={g.icon} size={16} /><span>{p.name}</span>
                  {p.id === 'approvals' && approvals > 0 && <span className="count">{approvals}</span>}
                  {p.id === 'alerts' && alerts > 0 && <span className="count red">{alerts}</span>}
                </button>
              ))}
            </React.Fragment>
          ))}
          {!groups.length && <div className="tiny-note" style={{ padding: 13 }}>No matching screens for this role.</div>}
        </div>
        <div className="sidebar-bottom">
          <div className="account-chip"><div className="avatar">{initials(currentUser.name)}</div><div style={{ minWidth: 0, flex: 1 }}><b>{currentUser.name}</b><small>{roleLabel(currentRole)}</small></div>
            <button className="top-icon" title="Sign out" onClick={logout} style={{ width: 32, height: 32 }}><Icon name="logout" size={15} /></button></div>
          <div className="tiny-note" style={{ marginTop: 12 }}>Priority Ads Agency OS {'\u00B7'} Signed in as {currentUser.employeeId}</div>
        </div>
      </aside>
    </>
  );
};

export const OsTopbar: React.FC<{ onMenu: () => void }> = ({ onMenu }) => {
  const { activeTab, setActiveTab, currentRole, logout } = useApp();
  const p = pageById(ALIASES[activeTab] || activeTab);
  const alerts = useAlerts().length;
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button className="top-icon mobile-toggle" aria-label="Open menu" onClick={onMenu}><Icon name="menu" size={19} /></button>
        <div className="breadcrumb">{p ? <>{p.group} &nbsp;/&nbsp; <b>{p.name}</b></> : <b>{activeTab.replace(/_/g, ' ')}</b>}</div>
      </div>
      <div className="top-actions">
        <span className="demo-tag hide-mobile">{roleLabel(currentRole).toUpperCase()}</span>
        <button className="top-icon" title={`Alerts (${alerts})`} onClick={() => setActiveTab('alerts')} style={{ position: 'relative' }}><Icon name="bell" size={17} />{alerts > 0 && <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: 9, background: '#B42318' }} />}</button>
        <button className="top-icon" title="Sign out" onClick={logout}><Icon name="logout" size={17} /></button>
      </div>
    </header>
  );
};

export const OsHeader: React.FC<{ actions?: React.ReactNode }> = ({ actions }) => {
  const { activeTab } = useApp();
  const p = pageById(ALIASES[activeTab] || activeTab);
  if (!p) return null;
  return (
    <div className="titlebar"><div><div className="eyebrow">PRIORITY ADS AGENCY / {p.group.toUpperCase()}</div><h1 className="h1">{p.name}</h1><p className="subline">{p.subtitle}</p></div>
      {actions && <div className="actions">{actions}</div>}</div>
  );
};
