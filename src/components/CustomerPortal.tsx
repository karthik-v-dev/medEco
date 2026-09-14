import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  Clock, 
  Sparkles, 
  Award, 
  MapPin, 
  Receipt, 
  ChevronRight, 
  Pill, 
  LogIn, 
  AlertCircle 
} from 'lucide-react';
import { Customer, Invoice, MedicineReminder } from '../types';
import { ReminderManager } from './ReminderManager';
import { getCustomerInvoices, getCustomerReminders } from '../services/firebase';

interface CustomerPortalProps {
  customer: Customer | null;
  onOpenAuth: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onGoToShop: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  onOpenAuth,
  onViewInvoice,
  onGoToShop
}) => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'history'>('reminders');

  if (!customer) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            One Customer, One Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Log in with your mobile phone number to view your full medicine purchase history, past receipts, and daily dose reminders.
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span>Login with Mobile Number</span>
        </button>

        <p className="text-[11px] text-slate-400">
          Try demo phone: <strong className="text-slate-700 font-mono">9876543210</strong> (Rahul Sharma)
        </p>
      </div>
    );
  }

  const customerInvoices = getCustomerInvoices(customer.mobileNumber);
  const customerReminders = getCustomerReminders(customer.mobileNumber);

  return (
    <div className="space-y-6 pb-12">
      {/* Customer Header Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md">
            {customer.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{customer.name}</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Active Patient
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                +91 {customer.mobileNumber}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                {customer.loyaltyPoints || 0} Wellness Points
              </span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reminders'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Medicine Reminders ({customerReminders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Purchase History ({customerInvoices.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MEDICINE REMINDERS */}
      {activeTab === 'reminders' && (
        <ReminderManager
          customerMobile={customer.mobileNumber}
          reminders={customerReminders}
        />
      )}

      {/* TAB 2: PURCHASE HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">
              Prescription & Invoice History
            </h3>
            <span className="text-xs text-slate-500">
              Total {customerInvoices.length} orders recorded
            </span>
          </div>

          {customerInvoices.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No purchase records found</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Medicines billed to your phone number will show up here automatically.
              </p>
              <button
                onClick={onGoToShop}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
              >
                Browse Medicines
              </button>
            </div>
          ) : (
            customerInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(inv.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {inv.doctorName && (
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Dr: <span className="font-semibold">{inv.doctorName}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">
                        ₹{inv.grandTotal.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-bold">
                        {inv.paymentMode} - {inv.status}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Items preview with Rack info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {inv.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                        <span className="text-[10px] text-slate-500 block">{item.genericName}</span>
                        <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-1 inline-block">
                          Stored at: {item.rackInfo}
                        </span>
                      </div>
                      <div className="text-right pl-2">
                        <span className="font-bold text-slate-800">x{item.quantity}</span>
                        <span className="text-[10px] text-slate-500 block">₹{item.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
