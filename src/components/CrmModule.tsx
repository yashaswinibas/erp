import { scopeForStaff } from '../lib/scope'; // AGENCYOS_V2_PART19
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ClientEditModal } from './QuickEditModals'; // AGENCYOS_V2_UI
import { Lead, Client } from '../types';
import {
  Building2,
  Users,
  TrendingUp,
  Search,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  Phone,
  MessageSquare,
  ExternalLink,
  MapPin,
  Briefcase,
  Smartphone,
  Send,
  Calendar,
  Filter
} from 'lucide-react';

interface CrmProps {
  initialSubTab?: 'leads' | 'clients';
  onOpenAddLeadModal: () => void;
  onOpenAddClientModal: () => void;
}

export const CrmModule: React.FC<CrmProps> = ({
  initialSubTab = 'leads',
  onOpenAddLeadModal,
  onOpenAddClientModal
}) => {
  const {
    leads,
    clients,
    convertLeadToClient,
    updateLeadStatus,
    employees,
    projects,
    tasks,
    invoices,
    fieldVisits,
    openDocument
  } = scopeForStaff(useApp());

  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'clients'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const { clients: allClients } = scopeForStaff(useApp());
  // keep the open profile in sync after edits
  useEffect(() => { if (selectedClient) { const c = allClients.find(x => x.id === selectedClient.id); if (c && c !== selectedClient) setSelectedClient(c); } }, [allClients]);
  const [clientProfileTab, setClientProfileTab] = useState<string>('overview');

  useEffect(() => {
    setActiveSubTab(initialSubTab);
    setSelectedClient(null);
  }, [initialSubTab]);

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);

  // Clean phone number for WhatsApp link
  const getWhatsAppNumber = (phoneStr?: string) => {
    if (!phoneStr) return '';
    return phoneStr.replace(/[^0-9]/g, '');
  };

  // Filter leads
  const filteredLeads = leads.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.company.toLowerCase().includes(q) ||
      l.contactPerson.toLowerCase().includes(q) ||
      l.leadCode.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.phone2 && l.phone2.includes(q))
    );
  });

  // Filter clients
  const filteredClients = clients.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.clientCode.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.phone2 && c.phone2.includes(q))
    );
  });

  return (
    <div className="space-y-6">

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>CRM — {activeSubTab === 'clients' ? 'Clients Directory & Client 360' : 'Leads Pipeline & Acquisition'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Two Mobile Contacts (Primary + WhatsApp) · Pipeline conversion · Account management
          </p>
        </div>

        {/* Sub-tab navigation & Add Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setActiveSubTab('leads'); setSelectedClient(null); }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'leads' && !selectedClient
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Leads Pipeline ({leads.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('clients'); }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'clients' || selectedClient
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Clients Directory ({clients.length})
            </button>
          </div>

          {activeSubTab === 'leads' ? (
            <button
              onClick={onOpenAddLeadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Lead</span>
            </button>
          ) : (
            <button
              onClick={onOpenAddClientModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Client</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CLIENT 360 PROFILE VIEW IF SELECTED */}
      {/* ======================================================== */}
      {selectedClient ? (
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">

            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1 inline-flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Clients Directory
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedClient.companyName}
                  </h3>
                  <span className="font-mono text-xs text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                    {selectedClient.clientCode}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                    {selectedClient.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Contact Person: <strong className="text-slate-800 dark:text-slate-200">{selectedClient.contactPerson}</strong> ({selectedClient.email})
                </p>

                {/* GET ONE / TWO MOBILE - CLIENT 360 HEADER */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">

                  {/* Mobile 1 */}
                  <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] text-slate-500 font-semibold uppercase">Mobile 1 (Primary):</span>
                    <a href={`tel:${selectedClient.phone}`} className="font-mono font-bold text-slate-900 dark:text-white hover:text-blue-600">
                      {selectedClient.phone}
                    </a>
                    <a href={`tel:${selectedClient.phone}`} title="Call Mobile 1" className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100">
                      <Phone className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Mobile 2 / WhatsApp */}
                  {selectedClient.phone2 && (
                    <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">Mobile 2 (WhatsApp/Alt):</span>
                      <a href={`tel:${selectedClient.phone2}`} className="font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-600">
                        {selectedClient.phone2}
                      </a>
                      <a
                        href={`https://wa.me/${getWhatsAppNumber(selectedClient.phone2)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat on WhatsApp"
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1 text-[10px] px-1.5 font-bold"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Chat</span>
                      </a>
                    </div>
                  )}

                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditClient(selectedClient)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                >
                  Edit Client
                </button>
                <button
                  onClick={() => openDocument('client_report', `Client Portfolio Report - ${selectedClient.companyName}`, {
                    client: selectedClient,
                    projects: projects.filter(p => p.clientId === selectedClient.id),
                    invoices: invoices.filter(i => i.clientId === selectedClient.id)
                  })}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Official Report</span>
                </button>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-4 overflow-x-auto pt-3 text-xs font-semibold border-b border-slate-200 dark:border-slate-800">
              {['overview', 'projects', 'invoices', 'field_visits', 'notes'].map(t => (
                <button
                  key={t}
                  onClick={() => setClientProfileTab(t)}
                  className={`pb-2.5 transition-colors uppercase tracking-wider cursor-pointer ${
                    clientProfileTab === t
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="pt-4 text-xs">
              {clientProfileTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <p><span className="text-slate-500">Registered Office:</span> {selectedClient.address}</p>
                    <p><span className="text-slate-500">GST Identification:</span> <span className="font-mono font-bold">{selectedClient.gstNumber}</span></p>
                    <p><span className="text-slate-500">Website:</span> <a href={`https://${selectedClient.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{selectedClient.website}</a></p>
                  </div>
                  <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <p><span className="text-slate-500">Contracted Services:</span> {selectedClient.services?.join(', ') || 'Advertising & Marketing'}</p>
                    <p><span className="text-slate-500">Account Manager:</span> <strong className="text-slate-900 dark:text-white">{getEmployee(selectedClient.accountManagerId)?.name || 'Direct MD'}</strong></p>
                    <p><span className="text-slate-500">Client Since:</span> <span className="font-mono">{selectedClient.createdAt}</span></p>
                  </div>
                </div>
              )}

              {clientProfileTab === 'projects' && (
                <div className="space-y-2">
                  {projects.filter(p => p.clientId === selectedClient.id).map(p => {
                    const prjTasks = tasks.filter(t => t.projectId === p.id);
                    return (
                      <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between border border-slate-200/60 dark:border-slate-800">
                        <div>
                          <span className="font-mono text-xs text-slate-500">{p.projectCode}</span>
                          <h5 className="font-bold text-slate-900 dark:text-white">{p.name}</h5>
                          <p className="text-slate-500 text-[11px] mt-0.5">{prjTasks.length} Deliverables · ₹{p.budget.toLocaleString()}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {p.status.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                  {projects.filter(p => p.clientId === selectedClient.id).length === 0 && (
                    <p className="text-slate-500 italic p-3">No active projects assigned yet.</p>
                  )}
                </div>
              )}

              {clientProfileTab === 'invoices' && (
                <div className="space-y-2">
                  {invoices.filter(i => i.clientId === selectedClient.id).map(inv => (
                    <div key={inv.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200/60 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            18% GST Compliant
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Due: {inv.dueDate} · Issued: {inv.issueDate}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">₹{inv.totalAmount.toLocaleString()}</div>
                          <span className={`text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {inv.status} (Bal: ₹{inv.balanceAmount.toLocaleString()})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => openDocument('invoice', `Official Tax Invoice - ${inv.invoiceNumber}`, {
                            invoice: inv,
                            client: selectedClient
                          })}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-lg border border-blue-200 dark:border-blue-900 hover:bg-blue-100 cursor-pointer whitespace-nowrap"
                        >
                          View Stamped Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                  {invoices.filter(i => i.clientId === selectedClient.id).length === 0 && (
                    <p className="text-slate-500 italic p-3 text-center">No invoices issued for this client yet.</p>
                  )}
                </div>
              )}

              {clientProfileTab === 'field_visits' && (
                <div className="space-y-2">
                  {fieldVisits.filter(v => v.clientId === selectedClient.id).map(v => (
                    <div key={v.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1 border border-slate-200/60 dark:border-slate-800">
                      <div className="flex justify-between font-semibold">
                        <span>{v.visitType} ({v.date})</span>
                        <span className="text-emerald-600 uppercase font-bold text-[11px]">{v.status}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">"{v.actualOutcome || v.expectedOutcome}"</p>
                    </div>
                  ))}
                </div>
              )}

              {clientProfileTab === 'notes' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-700 dark:text-slate-300">
                  <p>{selectedClient.notes || 'No special notes recorded.'}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : activeSubTab === 'leads' ? (

        /* ======================================================== */
        /* LEADS PIPELINE VIEW */
        /* ======================================================== */
        <div className="space-y-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads by company, contact person, code, or phone number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Lead Code / Company</th>
                    <th className="p-3">Contact Person & Mobiles</th>
                    <th className="p-3">Required Service</th>
                    <th className="p-3 text-right">Est. Deal Value</th>
                    <th className="p-3 text-center">Stage Status</th>
                    <th className="p-3">Assigned Rep</th>
                    <th className="p-3 text-right">Conversion Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLeads.map(lead => {
                    const rep = getEmployee(lead.assignedEmployeeId);
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">

                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {lead.leadCode}
                          </span>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {lead.company}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Source: {lead.source}
                          </div>
                        </td>

                        {/* Contact Person & One / Two Mobile */}
                        <td className="p-3 space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {lead.contactPerson}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {lead.email}
                          </div>

                          {/* Mobile 1 */}
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-[10px] uppercase font-bold text-slate-400">M1:</span>
                            <a href={`tel:${lead.phone}`} className="text-slate-700 dark:text-slate-300 hover:text-blue-600">
                              {lead.phone}
                            </a>
                            <a href={`tel:${lead.phone}`} title="Call Mobile 1" className="text-blue-600 hover:text-blue-700">
                              <Phone className="w-2.5 h-2.5" />
                            </a>
                          </div>

                          {/* Mobile 2 / WhatsApp */}
                          {lead.phone2 && (
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">M2:</span>
                              <a href={`tel:${lead.phone2}`} className="text-slate-700 dark:text-slate-300 hover:text-emerald-600">
                                {lead.phone2}
                              </a>
                              <a
                                href={`https://wa.me/${getWhatsAppNumber(lead.phone2)}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp Mobile 2"
                                className="text-emerald-600 hover:text-emerald-700 font-bold"
                              >
                                <Send className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {lead.serviceRequired}
                          </span>
                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {lead.notes}
                          </div>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{lead.estimatedValue.toLocaleString()}
                        </td>

                        <td className="p-3 text-center">
                          <select
                            value={lead.status}
                            onChange={e => updateLeadStatus(lead.id, e.target.value as any)}
                            className="px-2 py-1 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Proposal Sent</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="won">Won (Deal Closed)</option>
                            <option value="lost">Lost</option>
                          </select>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {rep?.name || 'Unassigned'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {rep?.phone}
                          </div>
                        </td>

                        <td className="p-3 text-right">
                          {lead.status === 'won' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Converted</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => convertLeadToClient(lead.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs inline-flex items-center gap-1"
                            >
                              <span>Convert to Client</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (

        /* ======================================================== */
        /* CLIENTS LIST DIRECTORY VIEW */
        /* ======================================================== */
        <div className="space-y-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients by company name, contact, code, or phone number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => {
              const clientPrjs = projects.filter(p => p.clientId === client.id);
              return (
                <div
                  key={client.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {client.companyName}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{client.clientCode}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      {client.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Contact: <strong className="text-slate-800 dark:text-slate-200">{client.contactPerson}</strong> ({client.email})
                  </p>

                  {/* GET ONE / TWO MOBILE - CLIENT DIRECTORY CARD */}
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">

                    {/* Mobile 1 */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Mobile 1 (Primary):</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <a href={`tel:${client.phone}`} className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600">
                          {client.phone}
                        </a>
                        <a href={`tel:${client.phone}`} title="Call Mobile 1" className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                          <Phone className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Mobile 2 */}
                    {client.phone2 && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Mobile 2 (WhatsApp):</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <a href={`tel:${client.phone2}`} className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600">
                            {client.phone2}
                          </a>
                          <a
                            href={`https://wa.me/${getWhatsAppNumber(client.phone2)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            <Send className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{clientPrjs.length} Projects</span>
                      <span className="mx-1">·</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {invoices.filter(i => i.clientId === client.id).length} Invoice(s)
                      </span>
                      {invoices.filter(i => i.clientId === client.id).length > 0 && (
                        <span className="font-mono text-slate-500 text-[10px] block">
                          ₹{invoices.filter(i => i.clientId === client.id).reduce((s, i) => s + i.totalAmount, 0).toLocaleString()} billed
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditClient(client)}
                      className="text-slate-600 dark:text-slate-300 font-semibold hover:underline cursor-pointer mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>View Client 360</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editClient && <ClientEditModal client={editClient} onClose={() => setEditClient(null)} />}
    </div>
  );
};
