import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  Receipt, 
  User, 
  Phone, 
  ArrowUpRight, 
  CreditCard,
  IndianRupee,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoiceHistoryProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({
  invoices,
  onViewInvoice
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<string>('All');

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase().trim();
    return invoices.filter(inv => {
      const matchQuery = 
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerMobile.includes(q) ||
        inv.customerName.toLowerCase().includes(q);

      const matchMode = filterMode === 'All' || inv.paymentMode === filterMode;
      return matchQuery && matchMode;
    });
  }, [invoices, search, filterMode]);

  // Aggregate stats
  const totalRevenue = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [invoices]);

  const totalGstCollected = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + inv.totalGst, 0);
  }, [invoices]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Sales & Compliance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            GST Invoices & Sales Receipts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit history of generated tax receipts, customer mobile linkages, and GST breakdowns.
          </p>
        </div>

        {/* Aggregate metric cards */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Total Sales</span>
            <span className="text-lg font-black text-emerald-950 dark:text-emerald-200">₹{totalRevenue.toFixed(2)}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">GST Collected</span>
            <span className="text-lg font-black text-slate-800 dark:text-slate-200">₹{totalGstCollected.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Search and filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, customer name, mobile..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Payment:</span>
          {['All', 'UPI', 'Cash', 'Card'].map(m => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === m
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No invoices match your search</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Try adjusting your query or create a new invoice in the POS terminal.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-600 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {inv.invoiceNumber}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(inv.date).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-2 py-0.5 rounded-md">
                    {inv.paymentMode} • {inv.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inv.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>+91 {inv.customerMobile}</span>
                  </div>
                  <div className="text-slate-400 dark:text-slate-500">
                    ({inv.items.length} items)
                  </div>
                </div>

                {/* Items quick badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {inv.items.map((item, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium"
                    >
                      {item.medicineName} x{item.quantity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Amount and reprint */}
              <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-lg font-black text-slate-900 dark:text-white block">
                    ₹{inv.grandTotal.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    GST: ₹{inv.totalGst.toFixed(2)} {inv.discountAmount > 0 ? `• Saved: ₹${inv.discountAmount.toFixed(2)}` : ''}
                  </span>
                </div>

                <button
                  onClick={() => onViewInvoice(inv)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Receipt</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
