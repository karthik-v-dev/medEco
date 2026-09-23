import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  User, 
  ShieldCheck, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound, 
  ShieldAlert, 
  Lock, 
  Loader2,
  Database
} from 'lucide-react';
import { Customer, UserSession } from '../types';
import { 
  getCustomerByMobile, 
  loginCustomerRealtime, 
  registerCustomerRealtime, 
  loginOwnerRealtime
} from '../services/firebase';
import { useModalScrollLock } from '../services/modalLock';
import { toast } from '../services/toast';

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
  const [address, setAddress] = useState('Warangal, Telangana');
  const [regPin, setRegPin] = useState('');
  const [customerStep, setCustomerStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  // Owner Form State
  const [ownerKey, setOwnerKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lock background scroll while AuthModal is open
  useModalScrollLock(isOpen);

  const resetForm = () => {
    setMobile('');
    setName('');
    setAddress('Warangal, Telangana');
    setRegPin('');
    setCustomerStep('phone');
    setOtp(['', '', '', '']);
    setExistingCustomer(null);
    setOwnerKey('');
    setError('');
    setIsLoading(false);
  };

  // Reset all input fields whenever the modal opens or role changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialRole);
      resetForm();
    }
  }, [isOpen, initialRole]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTabChange = (tab: 'customer' | 'owner') => {
    setActiveTab(tab);
    resetForm();
  };

  if (!isOpen) return null;

  // Customer Handlers - Realtime Firebase RTDB
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = mobile.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const found = getCustomerByMobile(clean);
      if (found) {
        setExistingCustomer(found);
        setCustomerStep('otp');
        setOtp(['', '', '', '']);
      } else {
        setExistingCustomer(null);
        setCustomerStep('register');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    const clean = mobile.replace(/\D/g, '');
    if (regPin.trim().length < 4) {
      setError('Please set a 4-digit security PIN for your account');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerCustomerRealtime(name.trim(), clean, regPin.trim(), address);
      if (result.success && result.session) {
        resetForm();
        toast.success(`Account registered for +91 ${clean}! Welcome to medEco.`, 'Registration Success');
        onLoginSuccess(result.session);
        onClose();
      } else {
        setError(result.message || 'Registration failed in Firebase database.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with Firebase RTDB');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = mobile.replace(/\D/g, '');
    const pinStr = otp.join('');
    if (pinStr.length < 4) {
      setError('Please enter your 4-digit security PIN');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginCustomerRealtime(clean, pinStr);
      if (result.success && result.session) {
        resetForm();
        toast.success(`Welcome back, ${result.session.customer?.name || 'Patient'}!`, 'Patient Login');
        onLoginSuccess(result.session);
        onClose();
      } else {
        setError(result.message || 'Incorrect PIN or password. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error verifying with Firebase Realtime Database');
    } finally {
      setIsLoading(false);
    }
  };

  // Owner Handlers - Realtime Firebase RTDB
  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ownerKey.trim()) {
      setError('Please enter the owner access security PIN');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginOwnerRealtime(ownerKey.trim());
      if (result.success && result.session) {
        resetForm();
        toast.success('Welcome Owner! Executive Console & POS unlocked.', 'Owner Authentication');
        onLoginSuccess(result.session);
        onClose();
      } else {
        setError(result.message || 'Invalid owner security credentials. Access denied.');
      }
    } catch (err: any) {
      setError(err?.message || 'Firebase authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Role Tab Selector Header */}
        <div className="bg-slate-900 text-white p-4 pb-0 flex flex-col">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">medEco Access Portal</h3>
                <span className="text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Firebase RTDB Live
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => handleTabChange('customer')}
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
              onClick={() => handleTabChange('owner')}
              className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'owner'
                  ? 'border-emerald-400 text-emerald-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Owner Login</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CUSTOMER LOGIN */}
          {activeTab === 'customer' && (
            <div>
              <div className="mb-4 p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-900 dark:text-emerald-200 leading-tight">
                🔒 <strong>Patient Portal:</strong> Enter your mobile number to view past prescriptions, track active deliveries, and manage dose reminders.
              </div>

              {/* Step 1: Phone */}
              {customerStep === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Enter Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit mobile number"
                        autoFocus
                        autoComplete="off"
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Continue with Phone</span>}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}

              {/* Step 2: Register New Patient */}
              {customerStep === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5" autoComplete="off">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                    New Patient Registration for <strong className="font-mono text-slate-900 dark:text-white">+91 {mobile}</strong>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      autoFocus
                      autoComplete="off"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Create 4-Digit Security PIN *</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Set 4-digit PIN"
                      autoComplete="new-password"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Delivery Address in Warangal</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Chowrasta, Hanamkonda, Warangal"
                      autoComplete="off"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCustomerStep('phone')}
                      className="w-1/3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Enter Account PIN */}
              {customerStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 text-center" autoComplete="off">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Enter Account PIN</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Account: <strong>{existingCustomer?.name}</strong> (+91 {mobile})
                    </p>
                  </div>

                  <div className="flex justify-center gap-2 my-3">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        type="password"
                        maxLength={1}
                        value={otp[index]}
                        autoComplete="off"
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const nextOtp = [...otp];
                          nextOtp[index] = val;
                          setOtp(nextOtp);
                          if (val && index < 3) {
                            const nextInput = document.getElementById(`pin-${index + 1}`);
                            nextInput?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[index] && index > 0) {
                            const prevInput = document.getElementById(`pin-${index - 1}`);
                            prevInput?.focus();
                          }
                        }}
                        id={`pin-${index}`}
                        autoFocus={index === 0}
                        className="w-11 h-11 text-center text-lg font-bold font-mono border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCustomerStep('phone')}
                      className="w-1/3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Login to Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: OWNER LOGIN */}
          {activeTab === 'owner' && (
            <form onSubmit={handleOwnerLogin} className="space-y-4" autoComplete="off">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 leading-tight">
                👑 <strong>Pharmacy Owner Authentication:</strong> Restricted administrative access to multi-store reports, POS billing terminal, and branch inventory management.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Owner Security PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={ownerKey}
                    onChange={(e) => setOwnerKey(e.target.value)}
                    placeholder="Enter Owner Security PIN"
                    autoFocus
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Authenticate via Firebase</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
