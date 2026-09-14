import React from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Pill, 
  Download, 
  MapPin, 
  Calendar, 
  Phone, 
  Sparkles,
  Clock
} from 'lucide-react';
import { Invoice } from '../types';
import { getPharmacyProfile } from '../services/firebase';

interface ReceiptModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onViewReminders?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onViewReminders
}) => {
  if (!isOpen || !invoice) return null;

  const profile = getPharmacyProfile();

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*medEco Pharmacy & Healthcare - Tax Invoice*\n` +
      `Invoice #: ${invoice.invoiceNumber}\n` +
      `Date: ${new Date(invoice.date).toLocaleDateString()}\n` +
      `Customer: ${invoice.customerName} (+91 ${invoice.customerMobile})\n\n` +
      `*Items:*\n` +
      invoice.items.map(i => `• ${i.medicineName} (Qty: ${i.quantity}) - ₹${i.total.toFixed(2)} [${i.rackInfo}]`).join('\n') +
      `\n\nSubtotal: ₹${invoice.subtotal.toFixed(2)}\n` +
      (invoice.discountAmount > 0 ? `Discount: -₹${invoice.discountAmount.toFixed(2)}\n` : '') +
      `GST (CGST+SGST): ₹${invoice.totalGst.toFixed(2)}\n` +
      `*Grand Total: ₹${invoice.grandTotal.toFixed(2)}*\n\n` +
      `Thank you for trusting medEco Healthcare! Stay healthy.`;

    const cleanPhone = invoice.customerMobile.replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        {/* Top Control Bar (Hidden during print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h3 className="text-sm font-bold tracking-wide">Official GST Tax Invoice</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RECEIPT PAPER CONTAINER (Styled for on-screen & physical print) */}
        <div className="p-6 sm:p-8 receipt-container bg-white text-slate-900 text-xs">
          {/* Pharmacy Header */}
          <div className="border-b-2 border-dashed border-slate-300 pb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                {profile.name}
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {profile.tagline}
            </p>
            <p className="text-[10px] text-slate-500 max-w-md mx-auto">
              {profile.address}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-600 pt-1 font-mono">
              <span><strong>GSTIN:</strong> {profile.gstin}</span>
              <span><strong>DL No:</strong> {profile.drugLicenseNo}</span>
              <span><strong>Ph:</strong> {profile.phone}</span>
            </div>
          </div>

          {/* Invoice & Customer Meta */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-[11px]">
            <div className="space-y-0.5">
              <p>
                <span className="text-slate-500">Invoice No:</span>{' '}
                <strong className="font-mono text-slate-900 text-xs">{invoice.invoiceNumber}</strong>
              </p>
              <p>
                <span className="text-slate-500">Date & Time:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {new Date(invoice.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </p>
              {invoice.doctorName && (
                <p>
                  <span className="text-slate-500">Prescribed By:</span>{' '}
                  <span className="font-semibold text-slate-800">{invoice.doctorName}</span>
                </p>
              )}
            </div>

            <div className="space-y-0.5 text-right">
              <p>
                <span className="text-slate-500">Customer:</span>{' '}
                <strong className="text-slate-900">{invoice.customerName}</strong>
              </p>
              <p>
                <span className="text-slate-500">Mobile:</span>{' '}
                <span className="font-mono font-bold text-slate-800">+91 {invoice.customerMobile}</span>
              </p>
              <p>
                <span className="text-slate-500">Payment:</span>{' '}
                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {invoice.paymentMode} - {invoice.status}
                </span>
              </p>
            </div>
          </div>

          {/* Table of Medicines */}
          <div className="mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="py-2">Item / Formula</th>
                  <th className="py-2">Rack Location</th>
                  <th className="py-2">Batch / Exp</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">MRP</th>
                  <th className="py-2 text-right">GST</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-2">
                      <strong className="text-slate-900 block">{item.medicineName}</strong>
                      <span className="text-[10px] text-slate-500 block leading-tight">{item.genericName}</span>
                      {item.dosageInstruction && (
                        <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                          ↳ {item.dosageInstruction}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-2 font-mono text-[10px] text-slate-600">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.rackInfo}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 font-mono text-[10px] text-slate-600">
                      {item.batchNumber}<br />
                      <span className="text-[9px] text-slate-400">{item.expiryDate.slice(0, 7)}</span>
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right text-slate-700">
                      ₹{item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right text-slate-500 text-[10px]">
                      {item.gstRate}%
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      ₹{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="mt-4 pt-3 border-t-2 border-slate-300 grid grid-cols-2 gap-4">
            <div className="space-y-1 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700 uppercase">GST Tax Summary:</p>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Taxable Value:</span>
                <span className="font-mono font-semibold text-slate-800">₹{invoice.taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>CGST (Central Tax):</span>
                <span className="font-mono font-semibold text-slate-800">₹{invoice.cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>SGST (State Tax):</span>
                <span className="font-mono font-semibold text-slate-800">₹{invoice.sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700">
                <span>Total GST Collected:</span>
                <span className="font-mono">₹{invoice.totalGst.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Gross MRP Subtotal:</span>
                <span className="font-semibold">₹{invoice.subtotal.toFixed(2)}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount Applied ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Flat'}):</span>
                  <span>- ₹{invoice.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-slate-900">
                <span className="font-extrabold text-sm uppercase">Net Amount Payable:</span>
                <span className="text-xl font-black text-emerald-800">
                  ₹{invoice.grandTotal.toFixed(2)}
                </span>
              </div>

              {invoice.discountAmount > 0 && (
                <p className="text-[10px] font-bold text-emerald-600 text-right">
                  🎉 Total Savings: ₹{invoice.discountAmount.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400 space-y-1">
            <p className="font-medium text-slate-600">
              * Medicines once sold will be taken back within 7 days with valid original receipt and unopened packaging.
            </p>
            <p>Thank you for choosing medEco Pharmacy! For dose reminders, login with your mobile number.</p>
          </div>
        </div>

        {/* Bottom Modal Actions (No Print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          {onViewReminders ? (
            <button
              onClick={() => {
                onClose();
                onViewReminders();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors w-full sm:w-auto justify-center"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>View Customer Medicine Reminders</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
