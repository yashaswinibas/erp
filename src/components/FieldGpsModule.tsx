// AGENCYOS_HUBS_DONE
// Field visit GPS: employee consent, captured start/end location, geofence check,
// map links, photos/documents per visit, and visit history.
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useShared, nowStamp } from '../lib/sharedStore';
import { VisitGps, ClientGeo, GpsConsent, GpsPoint } from '../lib/crmTypes';
import { saveFile, openStoredFile } from '../lib/fileStore';
import { StoredFile } from '../lib/hrTypes';
import { distanceMeters } from '../lib/payrollCalc';
import { fmtDate } from '../lib/dates';
import { GPS_KEY, GEO_KEY, CONSENT_KEY, getPosition } from './AgencyWatchers';
import { inputCls, btnPrimary, btnGhost, btnGood, btnBad, card, th, td, Badge, Field, Tabs, Empty } from './ui2';

const mapLink = (p?: GpsPoint) => p ? `https://www.google.com/maps?q=${p.lat},${p.lng}` : '';

export const FieldGpsModule: React.FC = () => {
  const { fieldVisits, employees, clients, currentUser, currentRole, logAudit } = useApp();
  const isAdmin = ['super_admin', 'admin', 'hr', 'manager'].includes(currentRole);
  const [tab, setTab] = useState('visits');
  const [gps, setGps] = useShared<VisitGps[]>(GPS_KEY, []);
  const [geos, setGeos] = useShared<ClientGeo[]>(GEO_KEY, []);
  const [consents, setConsents] = useShared<GpsConsent[]>(CONSENT_KEY, []);
  const [empFilter, setEmpFilter] = useState(isAdmin ? 'all' : currentUser.id);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');

  const myConsent = consents.find((c) => c.employeeId === currentUser.id);
  const setConsent = (granted: boolean) => {
    setConsents((p) => [{ employeeId: currentUser.id, granted, at: nowStamp() }, ...p.filter((c) => c.employeeId !== currentUser.id)]);
    logAudit(granted ? 'GPS_CONSENT_GIVEN' : 'GPS_CONSENT_WITHDRAWN', currentUser.employeeId);
  };

  const visits = useMemo(() => fieldVisits
    .filter((v) => (isAdmin ? (empFilter === 'all' || v.employeeId === empFilter) : v.employeeId === currentUser.id))
    .filter((v) => (!from || v.date >= from) && (!to || v.date <= to)), [fieldVisits, isAdmin, empFilter, currentUser.id, from, to]);

  const upsert = (visitId: string, employeeId: string, fn: (g: VisitGps) => VisitGps) =>
    setGps((list) => {
      const cur = list.find((g) => g.visitId === visitId) || { visitId, employeeId, files: [] };
      return [fn({ ...cur }), ...list.filter((g) => g.visitId !== visitId)];
    });

  const captureNow = async (visitId: string, employeeId: string, which: 'start' | 'end', clientId?: string) => {
    setMsg('Getting location...');
    try {
      const pt = await getPosition();
      const geo = geos.find((g) => g.clientId === clientId);
      upsert(visitId, employeeId, (g) => {
        const n = { ...g, [which]: pt, error: undefined };
        if (geo && n.start) { n.distanceFromClientM = Math.round(distanceMeters(n.start.lat, n.start.lng, geo.lat, geo.lng)); n.withinGeofence = n.distanceFromClientM <= geo.radiusM; }
        return n;
      });
      setMsg(`Location saved (accuracy ${pt.accuracy} m).`);
    } catch (e) { setMsg((e as Error).message); }
  };

  const attach = async (visitId: string, employeeId: string, files: FileList | null) => {
    if (!files?.length) return;
    try {
      const saved: StoredFile[] = [];
      for (const f of Array.from(files)) saved.push(await saveFile(f));
      upsert(visitId, employeeId, (g) => ({ ...g, files: [...(g.files || []), ...saved] }));
      setMsg(`${saved.length} file(s) attached.`);
    } catch (e) { setMsg((e as Error).message); }
  };

  // client location form
  const [geoForm, setGeoForm] = useState({ clientId: '', lat: '', lng: '', radiusM: '300' });
  const saveGeo = () => {
    const lat = Number(geoForm.lat), lng = Number(geoForm.lng), r = Number(geoForm.radiusM) || 300;
    if (!geoForm.clientId || !isFinite(lat) || !isFinite(lng) || !geoForm.lat || !geoForm.lng) return setMsg('Choose a client and enter latitude and longitude.');
    setGeos((p) => [{ clientId: geoForm.clientId, lat, lng, radiusM: r }, ...p.filter((g) => g.clientId !== geoForm.clientId)]);
    setGeoForm({ clientId: '', lat: '', lng: '', radiusM: '300' });
    setMsg('Client location saved.');
  };
  const useMyLocationForGeo = async () => {
    try { const p = await getPosition(); setGeoForm((f) => ({ ...f, lat: String(p.lat), lng: String(p.lng) })); } catch (e) { setMsg((e as Error).message); }
  };

  const empName = (id: string) => employees.find((e) => e.id === id)?.name || id;
  const tabs: [string, string][] = [['visits', 'Visit GPS log'], ['consent', 'My GPS consent']];
  if (isAdmin) tabs.push(['geo', 'Client locations'], ['consents', 'Consent register']);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="legacy-title text-lg font-bold text-slate-900 dark:text-white">Field Visit GPS</h2>
        <p className="legacy-title text-xs text-slate-500">Location is taken only at visit start and end, and only for employees who have given consent.</p>
      </div>
      {!myConsent?.granted && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex flex-wrap items-center gap-3">
          <span>GPS is off for you. Allow it so your visit check-in/out location is saved automatically.</span>
          <button className={btnGood} onClick={() => setConsent(true)}>I agree - allow GPS</button>
        </div>
      )}
      {msg && <p className="text-xs font-semibold text-blue-600">{msg}</p>}
      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'visits' && (
        <div className={card}>
          <div className="flex flex-wrap gap-2 mb-3">
            {isAdmin && (
              <select className={`${inputCls} max-w-[200px]`} value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
                <option value="all">All employees</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            )}
            <input type="date" className={`${inputCls} max-w-[150px]`} value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className={`${inputCls} max-w-[150px]`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {visits.length === 0 ? <Empty text="No field visits found." /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Visit</th><th className={th}>Employee</th><th className={th}>Client / place</th><th className={th}>Start GPS</th><th className={th}>End GPS</th><th className={th}>Geofence</th><th className={th}>Files</th></tr></thead>
                <tbody>
                  {visits.map((v) => {
                    const g = gps.find((x) => x.visitId === v.id);
                    const mine = v.employeeId === currentUser.id;
                    return (
                      <tr key={v.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className={td}><b>{v.visitCode}</b><br />{fmtDate(v.date)} {v.startTime}{v.endTime ? ` - ${v.endTime}` : ''}<br /><Badge v={v.status} /></td>
                        <td className={td}>{empName(v.employeeId)}</td>
                        <td className={td}>{v.companyName}<br /><span className="text-slate-400">{v.address || v.meetingLocation}</span></td>
                        <td className={td}>
                          {g?.start ? <a className="text-blue-600 underline" href={mapLink(g.start)} target="_blank" rel="noreferrer">Map ({g.start.accuracy} m)</a> : <span className="text-slate-400">{g?.error || 'Not captured'}</span>}
                          {g?.start && <div className="text-[10px] text-slate-400">{g.start.at}</div>}
                          {mine && v.status === 'in_progress' && !g?.start && <div><button className={`${btnGhost} mt-1`} onClick={() => captureNow(v.id, v.employeeId, 'start', v.clientId)}>Capture now</button></div>}
                        </td>
                        <td className={td}>
                          {g?.end ? <a className="text-blue-600 underline" href={mapLink(g.end)} target="_blank" rel="noreferrer">Map ({g.end.accuracy} m)</a> : <span className="text-slate-400">Not captured</span>}
                          {g?.end && <div className="text-[10px] text-slate-400">{g.end.at}</div>}
                          {mine && v.status === 'completed' && !g?.end && <div><button className={`${btnGhost} mt-1`} onClick={() => captureNow(v.id, v.employeeId, 'end', v.clientId)}>Capture now</button></div>}
                        </td>
                        <td className={td}>{g?.distanceFromClientM === undefined ? <span className="text-slate-400">No client location</span> : <><Badge v={g.withinGeofence ? 'inside' : 'outside'} /><div className="text-[10px] text-slate-400">{g.distanceFromClientM} m away</div></>}</td>
                        <td className={td}>
                          {(g?.files || []).map((f) => <button key={f.fileId} className="block text-blue-600 underline text-[11px] cursor-pointer" onClick={() => openStoredFile(f)}>{f.fileName}</button>)}
                          {(mine || isAdmin) && <label className="text-[11px] text-blue-600 cursor-pointer font-semibold">+ Photo/doc<input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => { attach(v.id, v.employeeId, e.target.files); e.target.value = ''; }} /></label>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'consent' && (
        <div className={`${card} space-y-3 text-xs text-slate-700 dark:text-slate-300`}>
          <p>Status: <Badge v={myConsent?.granted ? 'granted' : 'not_granted'} /> {myConsent && <span className="text-slate-400">({myConsent.at})</span>}</p>
          <p>When allowed, the app records your location once when you start a field visit and once when you end it. It does not track you continuously. You can withdraw at any time.</p>
          <div className="flex gap-2">
            <button className={btnGood} onClick={() => setConsent(true)}>Allow GPS</button>
            <button className={btnBad} onClick={() => setConsent(false)}>Withdraw consent</button>
            <button className={btnGhost} onClick={async () => { try { const p = await getPosition(); setMsg(`Test OK: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)} (accuracy ${p.accuracy} m)`); } catch (e) { setMsg((e as Error).message); } }}>Check my location</button>
          </div>
        </div>
      )}

      {tab === 'geo' && isAdmin && (
        <div className={`${card} space-y-3`}>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <Field label="Client"><select className={inputCls} value={geoForm.clientId} onChange={(e) => setGeoForm({ ...geoForm, clientId: e.target.value })}><option value="">Select...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></Field>
            <Field label="Latitude"><input className={inputCls} value={geoForm.lat} onChange={(e) => setGeoForm({ ...geoForm, lat: e.target.value })} placeholder="12.9716" /></Field>
            <Field label="Longitude"><input className={inputCls} value={geoForm.lng} onChange={(e) => setGeoForm({ ...geoForm, lng: e.target.value })} placeholder="77.5946" /></Field>
            <Field label="Allowed radius (m)"><input className={inputCls} value={geoForm.radiusM} onChange={(e) => setGeoForm({ ...geoForm, radiusM: e.target.value })} /></Field>
            <div className="flex gap-2"><button className={btnGhost} onClick={useMyLocationForGeo}>Use my location</button><button className={btnPrimary} onClick={saveGeo}>Save</button></div>
          </div>
          <p className="text-[11px] text-slate-400">Tip: in Google Maps, right-click the client office and click the numbers to copy latitude, longitude.</p>
          <table className="w-full"><thead><tr><th className={th}>Client</th><th className={th}>Location</th><th className={th}>Radius</th><th className={th}></th></tr></thead>
            <tbody>{geos.map((g) => (
              <tr key={g.clientId} className="border-t border-slate-100 dark:border-slate-800">
                <td className={td}>{clients.find((c) => c.id === g.clientId)?.companyName || g.clientId}</td>
                <td className={td}><a className="text-blue-600 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${g.lat},${g.lng}`}>{g.lat.toFixed(5)}, {g.lng.toFixed(5)}</a></td>
                <td className={td}>{g.radiusM} m</td>
                <td className={td}><button className={btnBad} onClick={() => setGeos((p) => p.filter((x) => x.clientId !== g.clientId))}>Remove</button></td>
              </tr>))}</tbody></table>
        </div>
      )}

      {tab === 'consents' && isAdmin && (
        <div className={card}>
          <table className="w-full"><thead><tr><th className={th}>Employee</th><th className={th}>GPS consent</th><th className={th}>Updated</th></tr></thead>
            <tbody>{employees.map((e) => { const c = consents.find((x) => x.employeeId === e.id); return (
              <tr key={e.id} className="border-t border-slate-100 dark:border-slate-800"><td className={td}>{e.name}</td><td className={td}><Badge v={c?.granted ? 'granted' : 'not_granted'} /></td><td className={td}>{c?.at || '-'}</td></tr>); })}</tbody></table>
        </div>
      )}
    </div>
  );
};
