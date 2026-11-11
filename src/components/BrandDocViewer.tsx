// AGENCYOS_BRAND_DOCS: quotation / invoice preview in the official Priority Ads Agency format.
import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, ArrowLeft } from 'lucide-react';
import { BrandFrame } from './BrandFrame';
import { invoicePage, quotationPage, openBrandDoc } from '../lib/brandDocs';
import { fmtDate } from '../lib/dates';

export const BrandDocViewer: React.FC = () => {
  const { docPreview, closeDocument, clients, payments } = useApp();
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDocument(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [closeDocument]);
  const { docType, data, title } = docPreview;
  const client = (clients || []).find((c) => c.id === data?.clientId);
  let page = '';
  if (docType === 'invoice') {
    const pays = (payments || []).filter((p) => p.invoiceId === data?.id);
    const ref = pays.map((p) => `${p.paymentMethod}${p.transactionRef ? ' - ' + p.transactionRef : ''} (${fmtDate(p.date)})`).join(', ');
    page = invoicePage(data || {}, client, ref);
  } else page = quotationPage(data || {}, client);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) closeDocument(); }}>
      <div className="relative w-full max-w-6xl bg-white text-slate-900 rounded-xl shadow-2xl my-6 border border-slate-300">
        <div className="sticky top-0 z-20 rounded-t-xl flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <button onClick={closeDocument} className="flex items-center gap-1.5 px-3 py-1.5 mr-1 text-xs font-bold rounded bg-white/10 hover:bg-white/20 cursor-pointer"><ArrowLeft className="w-4 h-4" /><span>Back</span></button>
            <span className="font-semibold text-sm">{title}</span>
            <span className="text-xs text-slate-400 hidden md:inline">{'\u00B7'} Priority Ads Agency official format</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openBrandDoc(title, page, true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 cursor-pointer"><Printer className="w-3.5 h-3.5" /><span>Print / Save PDF</span></button>
            <button onClick={closeDocument} className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-bold cursor-pointer"><X className="w-4 h-4" /><span>Close</span></button>
          </div>
        </div>
        <div className="p-3 bg-slate-100 rounded-b-xl"><div className="bg-white shadow"><BrandFrame page={page} landscape /></div></div>
      </div>
    </div>
  );
};