// Runs in the background on every screen:
// - captures GPS when a field visit starts / ends (only with the employee's consent)
// - sends agreement renewal reminders (30 / 15 / 7 days) and overdue instalment alerts once a day
import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { readKey, writeKey, nowStamp } from '../lib/sharedStore';
import { VisitGps, ClientGeo, GpsConsent, GpsPoint, AgreementExtra, Installment, InstallmentPayment, DealSettings, DEFAULT_DEAL_SETTINGS } from '../lib/crmTypes';
import { distanceMeters } from '../lib/payrollCalc';
import { localDate, daysBetween } from '../lib/dates';
import { inr } from '../lib/money';

export const GPS_KEY = 'paa_x_visit_gps';
export const GEO_KEY = 'paa_x_client_geo';
export const CONSENT_KEY = 'paa_x_gps_consent';

export function getPosition(): Promise<GpsPoint> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('This device/browser has no GPS support'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy), at: nowStamp() }),
      (e) => reject(new Error(e.message || 'Location permission denied')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}

export const AgencyWatchers: React.FC = () => {
  const { fieldVisits, currentUser, agreements, clients, notify } = useApp();
  const busy = useRef<Set<string>>(new Set());

  // ---- GPS capture on visit start / end ----
  useEffect(() => {
    const consent = readKey<GpsConsent[]>(CONSENT_KEY, []).find((c) => c.employeeId === currentUser.id);
    if (!consent?.granted) return;
    const gps = readKey<VisitGps[]>(GPS_KEY, []);
    const mine = fieldVisits.filter((v) => v.employeeId === currentUser.id && (v.status === 'in_progress' || v.status === 'completed'));
    for (const v of mine) {
      const rec = gps.find((g) => g.visitId === v.id);
      const needStart = v.status === 'in_progress' && !rec?.start && !rec?.error;
      const needEnd = v.status === 'completed' && rec?.start && !rec.end;
      if (!needStart && !needEnd) continue;
      const tag = v.id + (needStart ? ':s' : ':e');
      if (busy.current.has(tag)) continue;
      busy.current.add(tag);
      getPosition().then((pt) => {
        const list = readKey<VisitGps[]>(GPS_KEY, []);
        const cur: VisitGps = list.find((g) => g.visitId === v.id) || { visitId: v.id, employeeId: v.employeeId, files: [] };
        if (needStart) cur.start = pt; else cur.end = pt;
        const geo = readKey<ClientGeo[]>(GEO_KEY, []).find((g) => g.clientId === v.clientId);
        if (geo && cur.start) {
          cur.distanceFromClientM = Math.round(distanceMeters(cur.start.lat, cur.start.lng, geo.lat, geo.lng));
          cur.withinGeofence = cur.distanceFromClientM <= geo.radiusM;
          if (needStart && !cur.withinGeofence) notify('Visit outside client location', `${v.visitCode} started ${cur.distanceFromClientM} m from ${v.companyName}.`, 'field_visit', 'field_gps');
        }
        delete cur.error;
        writeKey(GPS_KEY, [cur, ...list.filter((g) => g.visitId !== v.id)]);
      }).catch((err: Error) => {
        const list = readKey<VisitGps[]>(GPS_KEY, []);
        const cur: VisitGps = list.find((g) => g.visitId === v.id) || { visitId: v.id, employeeId: v.employeeId, files: [] };
        cur.error = err.message;
        writeKey(GPS_KEY, [cur, ...list.filter((g) => g.visitId !== v.id)]);
      }).finally(() => busy.current.delete(tag));
    }
  }, [fieldVisits, currentUser.id, notify]);

  // ---- daily reminders: agreement renewals + overdue instalments ----
  useEffect(() => {
    const today = localDate();
    if (readKey<string>('paa_x_reminders_ran', '') === today) return;
    writeKey('paa_x_reminders_ran', today);
    const settings = readKey<DealSettings>('paa_x_deal_settings', DEFAULT_DEAL_SETTINGS);
    const extras = readKey<AgreementExtra[]>('paa_x_agreement_extras', []);
    let changed = false;
    for (const a of agreements) {
      if (a.status !== 'active' || !a.endDate) continue;
      const left = daysBetween(today, a.endDate);
      let ex = extras.find((e) => e.agreementId === a.id);
      for (const d of [...settings.reminderDays].sort((x, y) => x - y)) {
        if (left <= d && left >= 0 && !(ex?.remindersSent || []).includes(d)) {
          const client = clients.find((c) => c.id === a.clientId)?.companyName || '';
          notify('Agreement renewal due', `${a.agreementNumber} (${client}) ends in ${left} day(s) on ${a.endDate}.`, 'system', 'deals_agreements');
          if (!ex) { ex = { agreementId: a.id, value: 0, clauses: [], versions: [], autoRenew: false, remindersSent: [] }; extras.push(ex); }
          ex.remindersSent = [...(ex.remindersSent || []), ...settings.reminderDays.filter((x) => x >= d)];
          changed = true;
          break;
        }
      }
    }
    if (changed) writeKey('paa_x_agreement_extras', extras);
    const inst = readKey<Installment[]>('paa_x_installments', []);
    const pays = readKey<InstallmentPayment[]>('paa_x_installment_payments', []);
    const overdue = inst.filter((i) => i.dueDate < today && pays.reduce((s, p) => s + p.allocations.filter((x) => x.installmentId === i.id).reduce((t, x) => t + x.amount, 0), 0) < i.amount - 0.5);
    if (overdue.length) notify('Overdue instalments', `${overdue.length} instalment(s) are overdue, total ${inr(overdue.reduce((s, i) => s + i.amount, 0))}.`, 'invoice', 'deals_installments');
  }, [agreements, clients, notify]);

  return null;
};
