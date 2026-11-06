import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Quotation, Invoice, Payment, Agreement, Expense } from '../types';
import { 
  FileText, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  Plus, 
  CheckCircle, 
  Printer, 
  Search, 
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface SalesBillingProps {
  onOpenCreateQuotationModal: () => void;
  onOpenCreateInvoiceModal: () => void;
  onOpenRecordPaymentModal: (invoiceId?: string) => void;
  onOpenAddExpenseModal: () => void;
}

export const SalesBillingModule: React.FC<SalesBillingProps> = ({
  onOpenCreateQuotationModal,
  onOpenCreateInvoiceModal,
  onOpenRecordPaymentModal,
  onOpenAddExpenseModal
}) => {
  const { 
    quotations, 
    acceptQuotation, 
    agreements, 
    invoices, 
    payments, 
    expenses, 
    clients, 
    openDocument,
    company
  } = useApp();

  const [activeTab, setActiveTab] = useState<'invoices' | 'quotations' | 'agreements' | 'payments' | 'expenses'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>Sales, Billing, Commercial Agreements & Expenses</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Connected commercial chain: Lead → Quotation → Agreement → Tax Invoice → Cash Collection (Prompt #56)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onOpenCreateInvoiceModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Invoice</span>
          </button>
          <button
            onClick={onOpenCreateQuotationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Quotation</span>
          </button>
          <button
            onClick={() => onOpenRecordPaymentModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Record Payment</span>
          </button>
          <button
            onClick={onOpenAddExpenseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'invoices', label: `Invoices (${invoices.length})` },
          { id: 'quotations', label: `Quotations (${quotations.length})` },
          { id: 'agreements', label: `Agreements (${agreements.length})` },
          { id: 'payments', label: `Payments (${payments.length})` },
          { id: 'expenses', label: `Expenses (${expenses.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. INVOICES VIEW */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Billed Client</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Invoice Total</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map(inv => {
                  const cl = getClient(inv.clientId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {cl?.companyName || inv.clientId}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {inv.issueDate}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {inv.dueDate}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{inv.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{inv.paidAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        ₹{inv.balanceAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.status === 'partially_paid'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDocument('invoice', `Official Tax Invoice - ${inv.invoiceNumber}`, {
                              ...inv,
                              clientName: cl?.companyName || 'Client'
                            })}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded border border-blue-200 dark:border-blue-900 hover:bg-blue-100 cursor-pointer"
                          >
                            View Letterhead
                          </button>
                          {inv.balanceAmount > 0 && (
                            <button
                              onClick={() => onOpenRecordPaymentModal(inv.id)}
                              className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded cursor-pointer"
                            >
                              + Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. QUOTATIONS VIEW */}
      {activeTab === 'quotations' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Quote Number</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Title / Scope</th>
                  <th className="p-3">Valid Until</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">Total with GST</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quotations.map(qt => {
                  const cl = getClient(qt.clientId);
                  return (
                    <tr key={qt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {qt.quotationNumber}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {cl?.companyName || qt.clientId}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {qt.title}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {qt.validUntil}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        ₹{qt.subtotal.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{qt.total.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          qt.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {qt.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDocument('quotation', `Quotation - ${qt.quotationNumber}`, {
                              ...qt,
                              clientName: cl?.companyName || 'Client'
                            })}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded border border-blue-200 dark:border-blue-900 hover:bg-blue-100 cursor-pointer"
                          >
                            Print PDF
                          </button>
                          {qt.status !== 'accepted' && (
                            <button
                              onClick={() => acceptQuotation(qt.id)}
                              className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded cursor-pointer"
                            >
                              Accept & Agreement →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. AGREEMENTS VIEW */}
      {activeTab === 'agreements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agreements.map(agr => {
            const cl = getClient(agr.clientId);
            return (
              <div key={agr.id} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs text-slate-400">{agr.agreementNumber}</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{agr.title}</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{cl?.companyName || 'Client'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700">
                    {agr.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{agr.terms}</p>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Period: {agr.startDate} to {agr.endDate}</span>
                  <button
                    onClick={() => openDocument('agreement', `Client Agreement - ${agr.agreementNumber}`, {
                      agreementNumber: agr.agreementNumber,
                      clientName: cl?.companyName || 'Client Account',
                      title: agr.title,
                      startDate: agr.startDate,
                      endDate: agr.endDate,
                      terms: agr.terms
                    })}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    View Official Letterhead Agreement
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. PAYMENTS VIEW */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Transaction Reference</th>
                  <th className="p-3 text-right">Amount Received</th>
                  <th className="p-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map(pay => {
                  const cl = getClient(pay.clientId);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {pay.paymentCode}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {cl?.companyName || pay.clientId}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {pay.date}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {pay.paymentMethod}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {pay.transactionRef}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{pay.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {pay.recordedBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. EXPENSES VIEW */}
      {activeTab === 'expenses' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Expense Code</th>
                  <th className="p-3">Title / Particulars</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {exp.expenseCode}
                    </td>
                    <td className="p-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                      {exp.title}
                    </td>
                    <td className="p-3 font-sans text-slate-600 dark:text-slate-400">
                      {exp.category}
                    </td>
                    <td className="p-3 text-slate-500">{exp.date}</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    <td className="p-3 font-sans text-slate-500 text-[11px]">{exp.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
