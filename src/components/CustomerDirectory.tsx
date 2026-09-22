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
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  AlertCircle,
  Database,
  MapPin,
  Edit3
} from 'lucide-react';
import { Customer, Invoice, MedicineReminder, PharmacyBranch } from '../types';
import { 
  getAllCustomersWithMetrics, 
  CustomerWithMetrics, 
  getCustomerInvoices, 
  getCustomerReminders,
  getPharmacyBranches,
  updateCustomerPinRealtime,
  updateCustomerBranchRealtime
} from '../services/firebase';

interface CustomerDirectoryProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  onViewInvoice
}) => {
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Visibility states for PINs on customer cards
  const [revealedPins, setRevealedPins] = useState<{ [id: string]: boolean }>({});
  
  // PIN change state in detail view
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeLoading, setPinChangeLoading] = useState(false);
  const [pinChangeMessage, setPinChangeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Branch change state
  const [branchChangeLoading, setBranchChangeLoading] = useState(false);

  const branches: PharmacyBranch[] = getPharmacyBranches();
  const customers: CustomerWithMetrics[] = getAllCustomersWithMetrics();

  // Filter customers by search and branch selection
  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter(c => {
      const matchesSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.mobileNumber.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      const matchesBranch = selectedBranchId === 'ALL' || c.primaryBranchId === selectedBranchId;
      return matchesSearch && matchesBranch;
    });
  }, [customers, search, selectedBranchId]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;
  const customerInvoices = selectedCustomer ? getCustomerInvoices(selectedCustomer.mobileNumber) : [];
  const customerReminders = selectedCustomer ? getCustomerReminders(selectedCustomer.mobileNumber) : [];

  const togglePinVisibility = (custId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRevealedPins(prev => ({ ...prev, [custId]: !prev[custId] }));
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const clean = newPinInput.replace(/\D/g, '');
    if (clean.length < 4) {
      setPinChangeMessage({ text: 'PIN must be at least 4 digits.', isError: true });
      return;
    }

    setPinChangeLoading(true);
    setPinChangeMessage(null);
    try {
      const res = await updateCustomerPinRealtime(selectedCustomer.mobileNumber, clean);
      if (res.success) {
        setPinChangeMessage({ 
          text: `Success! PIN for +91 ${selectedCustomer.mobileNumber} updated to ${clean} in Firebase RTDB. The customer can now log in immediately.`, 
          isError: false 
        });
        setNewPinInput('');
        setIsChangingPin(false);
      } else {
        setPinChangeMessage({ text: res.message || 'Failed to update PIN', isError: true });
      }
    } catch (err: any) {
      setPinChangeMessage({ text: err?.message || 'Error updating PIN in Firebase', isError: true });
    } finally {
      setPinChangeLoading(false);
    }
  };

  const handleBranchChange = async (newBranchId: string) => {
    if (!selectedCustomer) return;
    setBranchChangeLoading(true);
    try {
      await updateCustomerBranchRealtime(selectedCustomer.mobileNumber, newBranchId);
    } finally {
      setBranchChangeLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Store Owner Administration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Customer Directory & Branch Security Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            View branch-level or all-branch customer profiles, registered mobile numbers, security PINs, and assist patients with PIN resets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Total Patients</span>
            <span className="text-xl font-black text-emerald-950 dark:text-emerald-100">{customers.length} Accounts</span>
          </div>
        </div>
      </div>

      {/* Branch Selector Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Branch Filter Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Filter by Store Branch Location:</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBranchId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedBranchId === 'ALL'
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>All Branches (Consolidated)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                selectedBranchId === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {customers.length}
              </span>
            </button>

            {branches.map(branch => {
              const count = customers.filter(c => c.primaryBranchId === branch.id).length;
              const isSelected = selectedBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <MapPin className="w-3 h-3 opacity-70" />
                  <span>{branch.name.replace('medEco Pharmacy - ', '')}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient mobile number, name, or address..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customers List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Customers */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Showing {filteredCustomers.length} Patient{filteredCustomers.length === 1 ? '' : 's'}
            </span>
            {selectedBranchId !== 'ALL' && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Branch Filtered
              </span>
            )}
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No customers found</p>
              <p className="text-[11px] text-slate-500 mt-1">Try searching a different mobile number or selecting "All Branches".</p>
            </div>
          ) : (
            filteredCustomers.map(cust => {
              const isSelected = selectedCustomerId === cust.id;
              const isPinVisible = !!revealedPins[cust.id];
              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomerId(isSelected ? null : cust.id);
                    setPinChangeMessage(null);
                    setIsChangingPin(false);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {cust.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{cust.name}</h4>
                        <div className="flex items-center gap-1 font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>+91 {cust.mobileNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        ₹{cust.totalSpent.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  </div>

                  {/* Branch & PIN Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Branch Badge */}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium truncate max-w-[180px]">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{cust.primaryBranchName?.replace('medEco Pharmacy - ', '') || 'Hanamkonda'}</span>
                    </div>

                    {/* PIN View Box with Eye Toggle */}
                    <div 
                      onClick={(e) => togglePinVisibility(cust.id, e)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-mono font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                      title="Click to show / hide PIN"
                    >
                      <KeyRound className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>PIN: {cust.pin ? (isPinVisible ? cust.pin : '••••') : 'Not Set'}</span>
                      {isPinVisible ? (
                        <EyeOff className="w-3 h-3 text-amber-700 dark:text-amber-400 ml-0.5" />
                      ) : (
                        <Eye className="w-3 h-3 text-amber-700 dark:text-amber-400 ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Customer Full Details & Support Actions */}
        <div className="lg:col-span-7">
          {!selectedCustomer ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center h-full flex flex-col items-center justify-center">
              <UserCheck className="w-14 h-14 text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Select a Patient Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Click on any customer from the list to view their registered phone number, security PIN, change/reset their PIN, or inspect previous branch purchases.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Customer Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shrink-0">
                    {selectedCustomer.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedCustomer.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        +91 {selectedCustomer.mobileNumber}
                      </p>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Joined {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Total Lifetime Spend:</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">₹{selectedCustomer.totalSpent.toFixed(2)}</span>
                </div>
              </div>

              {/* 🌟 USER WORKFLOW: STORE HELPLINE & FORGOT PIN SUPPORT CARD */}
              <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/70 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800/80 pb-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-amber-950 dark:text-amber-100">
                        Store Helpline & Customer PIN Support
                      </h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Assist patient when they forget their PIN or call the nearest pharmacy store
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 shrink-0 self-start sm:self-auto">
                    <Database className="w-2.5 h-2.5" /> Live Firebase RTDB
                  </span>
                </div>

                {/* Helper info banner */}
                <div className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed bg-white/70 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/60">
                  📞 <strong>Customer called the near store?</strong> Verify their registered number <strong className="font-mono text-emerald-800 dark:text-emerald-300">+91 {selectedCustomer.mobileNumber}</strong>. You can read out their existing PIN below or assign a fresh 4-digit PIN in real time.
                </div>

                {/* Current PIN Display & Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current PIN Card */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Current Security PIN
                    </span>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="font-mono text-xl font-black text-slate-900 dark:text-white tracking-widest">
                          {selectedCustomer.pin ? (revealedPins[selectedCustomer.id] ? selectedCustomer.pin : '••••') : 'No PIN Set'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!selectedCustomer.pin}
                          onClick={() => togglePinVisibility(selectedCustomer.id)}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40"
                          title={revealedPins[selectedCustomer.id] ? 'Mask PIN' : 'Reveal PIN'}
                        >
                          {revealedPins[selectedCustomer.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          disabled={!selectedCustomer.pin}
                          onClick={() => selectedCustomer.pin && handleCopyPin(selectedCustomer.pin)}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40"
                          title="Copy PIN to clipboard"
                        >
                          {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Store staff can read this PIN to the customer over phone after verification.
                    </p>
                  </div>

                  {/* Store Phone & Branch Info */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Primary Store Branch & Helpline
                    </span>

                    <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs">
                        {selectedCustomer.primaryBranchName?.replace('medEco Pharmacy - ', '') || 'Hanamkonda Chowrasta'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedCustomer.primaryBranchPhone || '+91 870 244 5566'}</span>
                    </div>

                    <div className="pt-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                        Reassign Customer Branch:
                      </label>
                      <select
                        value={selectedCustomer.primaryBranchId || 'pharm-hanamkonda'}
                        disabled={branchChangeLoading}
                        onChange={(e) => handleBranchChange(e.target.value)}
                        className="w-full text-xs font-semibold py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.name.replace('medEco Pharmacy - ', '')} ({b.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reset / Change Customer PIN Form */}
                <div className="pt-2">
                  {!isChangingPin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPin(true);
                        setPinChangeMessage(null);
                        setNewPinInput('');
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Change / Reset Customer PIN</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSaveNewPin} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          Set New 4-Digit Security PIN for +91 {selectedCustomer.mobileNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPin(false);
                            setNewPinInput('');
                          }}
                          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          maxLength={4}
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter new 4-digit PIN (e.g. 5678)"
                          autoFocus
                          autoComplete="off"
                          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />

                        <button
                          type="submit"
                          disabled={pinChangeLoading || newPinInput.length < 4}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {pinChangeLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Update in Firebase RTDB</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        This update directly modifies <code>/users/{selectedCustomer.mobileNumber}/pin</code> in Firebase Realtime Database.
                      </p>
                    </form>
                  )}

                  {pinChangeMessage && (
                    <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      pinChangeMessage.isError
                        ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    }`}>
                      {pinChangeMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                      <span>{pinChangeMessage.text}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
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
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(inv.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {inv.branchId && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                • {inv.branchId.replace('pharm-', '')}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {inv.items.map((item, i) => (
                              <span key={i} className="text-[10px] bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                                {item.medicineName} x{item.quantity} [{item.rackInfo}]
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
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
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Patient Medicine Reminders ({customerReminders.length})</span>
                </h4>

                {customerReminders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No scheduled reminders for this patient.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customerReminders.map(rem => (
                      <div key={rem.id} className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-1">
                        <strong className="text-slate-900 dark:text-white block">{rem.medicineName}</strong>
                        <span className="text-slate-600 dark:text-slate-300 block">{rem.dosage} • {rem.mealRelation}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold block">{rem.timings.join(', ')}</span>
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
