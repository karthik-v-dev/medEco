import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Calendar, 
  Clock, 
  Receipt, 
  Award, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Pill, 
  DollarSign, 
  UserCheck 
} from 'lucide-react';
import { Customer, Invoice, MedicineReminder } from '../types';
import { 
  getAllCustomersWithMetrics, 
  CustomerWithMetrics, 
  getCustomerInvoices, 
  getCustomerReminders 
} from '../services/firebase';

interface CustomerDirectoryProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  onViewInvoice
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const customers = getAllCustomersWithMetrics();

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter(c => 
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.mobileNumber.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;
  const customerInvoices = selectedCustomer ? getCustomerInvoices(selectedCustomer.mobileNumber) : [];
  const customerReminders = selectedCustomer ? getCustomerReminders(selectedCustomer.mobileNumber) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Owner Administration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Customer Directory & Patient Profiles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Owner view to inspect customer order histories, loyalty rewards, and active dosage schedules.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl text-right">
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Accounts</span>
          <span className="text-xl font-black text-emerald-950">{customers.length} Patients</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient by mobile number or full name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customers List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Customers */}
        <div className="lg:col-span-5 space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No customers found</p>
            </div>
          ) : (
            filteredCustomers.map(cust => {
              const isSelected = selectedCustomerId === cust.id;
              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                        {cust.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{cust.name}</h4>
                        <span className="flex items-center gap-1 font-mono text-xs text-slate-600">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          +91 {cust.mobileNumber}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">
                        ₹{cust.totalSpent.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      {cust.loyaltyPoints || 0} pts
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      {cust.activeRemindersCount} active reminders
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Customer Full Details */}
        <div className="lg:col-span-7">
          {!selectedCustomer ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center h-full flex flex-col items-center justify-center">
              <UserCheck className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">Select a customer from the left</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Click on any patient card to review their previous medicine purchases, prescription invoices, and active daily dose reminders.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Customer Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center">
                    {selectedCustomer.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                    <p className="font-mono text-xs text-emerald-700 font-bold">
                      +91 {selectedCustomer.mobileNumber}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Total Lifetime Spend:</span>
                  <span className="text-xl font-black text-slate-900">₹{selectedCustomer.totalSpent.toFixed(2)}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Previous Order History ({customerInvoices.length})</span>
                  </h4>
                </div>

                {customerInvoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No past bills recorded for this customer yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {customerInvoices.map(inv => (
                      <div 
                        key={inv.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(inv.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {inv.items.map((item, i) => (
                              <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded border text-slate-700">
                                {item.medicineName} x{item.quantity} [{item.rackInfo}]
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="font-black text-sm text-slate-900">
                            ₹{inv.grandTotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                          >
                            Inspect Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Reminders */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Patient Medicine Reminders ({customerReminders.length})</span>
                </h4>

                {customerReminders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No scheduled reminders for this patient.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customerReminders.map(rem => (
                      <div key={rem.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
                        <strong className="text-slate-900 block">{rem.medicineName}</strong>
                        <span className="text-slate-600 block">{rem.dosage} • {rem.mealRelation}</span>
                        <span className="text-emerald-700 font-bold block">{rem.timings.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
