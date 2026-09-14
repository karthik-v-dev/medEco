import React, { useState } from 'react';
import { 
  Phone, 
  User, 
  ShieldCheck, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  HeartPulse, 
  KeyRound, 
  ShieldAlert, 
  Lock, 
  Store, 
  Check
} from 'lucide-react';
import { Customer, UserSession } from '../types';
import { 
  getCustomerByMobile, 
  saveCustomer, 
  loginOwner, 
  setActiveSession,
  setActiveCustomerPhone 
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  initialRole?: 'customer' | 'owner';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'customer'
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'owner'>(initialRole);

  // Customer Form State
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [customerStep, setCustomerStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [otp, setOtp] = useState(['1', '2', '3', '4']);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  // Owner Form State
  const [ownerKey, setOwnerKey] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Customer Handlers
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = mobile.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const found = getCustomerByMobile(clean);
    if (found) {
      setExistingCustomer(found);
      setCustomerStep('otp');
    } else {
      setExistingCustomer(null);
      setCustomerStep('register');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    const clean = mobile.replace(/\D/g, '');
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      mobileNumber: clean,
      name: name.trim(),
      loyaltyPoints: 50,
      createdAt: new Date().toISOString()
    };
    await saveCustomer(newCustomer);
    setExistingCustomer(newCustomer);
    setCustomerStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingCustomer) {
      const session: UserSession = {
        role: 'customer',
        customer: existingCustomer
      };
      setActiveSession(session);
      onLoginSuccess(session);
      onClose();
    }
  };

  const setQuickCustomer = (num: string) => {
    setMobile(num);
    const found = getCustomerByMobile(num);
    if (found) {
      setExistingCustomer(found);
      setCustomerStep('otp');
      setOtp(['1', '2', '3', '4']);
    }
  };

  // Owner Handlers
  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = loginOwner(ownerKey);
    if (success) {
      const session: UserSession = {
        role: 'owner',
        ownerName: 'Store Owner'
      };
      onLoginSuccess(session);
      onClose();
    } else {
      setError('Invalid Owner password or PIN. (Use "admin123" or "9999")');
    }
  };

  const handleQuickOwner = () => {
    setOwnerKey('admin123');
    loginOwner('admin123');
    const session: UserSession = {
      role: 'owner',
      ownerName: 'Store Owner'
    };
    onLoginSuccess(session);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Role Tab Selector Header */}
        <div className="bg-slate-900 text-white p-4 pb-0 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <h3 className="font-extrabold text-sm tracking-wide">medEco Access Portal</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => { setActiveTab('customer'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'customer'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Login</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('owner'); setError(''); }}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'owner'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Pharmacy Owner Login</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CUSTOMER LOGIN (Strict Privacy - Only see their own data) */}
          {activeTab === 'customer' && (
            <div>
              <div className="mb-4 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-tight">
                🔒 <strong>Customer Privacy:</strong> Customers only see their own medicine purchases, previous receipts, and personal dose reminders.
              </div>

              {/* Step 1: Phone */}
              {customerStep === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Enter Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        autoFocus
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Continue with Phone</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Demo presets */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Demo Accounts
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickCustomer('9876543210')}
                        className="p-2 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl text-left transition-all"
                      >
                        <p className="text-xs font-bold text-slate-800">Rahul Sharma</p>
                        <p className="text-[10px] text-slate-500 font-mono">9876543210</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickCustomer('9123456780')}
                        className="p-2 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl text-left transition-all"
                      >
                        <p className="text-xs font-bold text-slate-800">Priya Patel</p>
                        <p className="text-[10px] text-slate-500 font-mono">9123456780</p>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Step 2: Register */}
              {customerStep === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    Setting up new customer account for <strong className="font-mono text-slate-900">+91 {mobile}</strong>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerStep('phone')}
                      className="w-1/3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      Create & Continue
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: OTP */}
              {customerStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Verify Code</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Welcome back, <strong>{existingCustomer?.name}</strong> (+91 {existingCustomer?.mobileNumber})
                    </p>
                  </div>

                  <div className="flex justify-center gap-2 my-3">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={otp[index]}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextOtp = [...otp];
                          nextOtp[index] = val;
                          setOtp(nextOtp);
                        }}
                        className="w-11 h-11 text-center text-lg font-bold font-mono border-2 border-slate-200 rounded-xl focus:border-emerald-600 bg-slate-50"
                      />
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCustomerStep('phone')}
                      className="w-1/3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Access My Account</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: OWNER LOGIN (Full store control & customer inspection) */}
          {activeTab === 'owner' && (
            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-tight">
                👑 <strong>Pharmacy Owner Portal:</strong> Access inventory costs, store racks, POS billing with GST, and inspect any customer's previous order history.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Owner Password or Security PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={ownerKey}
                    onChange={(e) => setOwnerKey(e.target.value)}
                    placeholder="Enter owner password or PIN (e.g. admin123 / 9999)"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Sign in as Pharmacy Owner</span>
              </button>

              {/* 1-Click Demo Fill for testing */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleQuickOwner}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1-Click Owner Demo Login (admin123)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
