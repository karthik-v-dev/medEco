import React, { useState } from 'react';
import { Phone, User, ShieldCheck, X, ArrowRight, CheckCircle2, HeartPulse } from 'lucide-react';
import { Customer } from '../types';
import { getCustomerByMobile, saveCustomer, setActiveCustomerPhone } from '../services/firebase';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: Customer) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);

  if (!isOpen) return null;

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
      setStep('otp');
    } else {
      setExistingCustomer(null);
      setStep('register');
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
      loyaltyPoints: 50, // Welcome bonus points!
      createdAt: new Date().toISOString()
    };
    await saveCustomer(newCustomer);
    setExistingCustomer(newCustomer);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join('');
    // For seamless UX, any 4 digit code or 1234 works
    if (entered.length < 4 && entered !== '') {
      setError('Please enter 4-digit verification code');
      return;
    }

    if (existingCustomer) {
      setActiveCustomerPhone(existingCustomer.mobileNumber);
      onLoginSuccess(existingCustomer);
      onClose();
    }
  };

  const setQuickDemoPhone = (num: string) => {
    setMobile(num);
    const found = getCustomerByMobile(num);
    if (found) {
      setExistingCustomer(found);
      setStep('otp');
      setOtp(['1', '2', '3', '4']);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">One Customer, One Account</h3>
              <p className="text-xs text-emerald-100">Mobile-verified medicine history & dose alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Phone number */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-semibold text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Your purchase history and daily medicine reminders will be linked to this number.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Logins */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Demo Accounts
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDemoPhone('9876543210')}
                    className="p-2 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl text-left transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Rahul Sharma</p>
                    <p className="text-[10px] text-slate-500 font-mono">9876543210</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDemoPhone('9123456780')}
                    className="p-2 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl text-left transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Priya Patel</p>
                    <p className="text-[10px] text-slate-500 font-mono">9123456780</p>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 2: New Customer Registration */}
          {step === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <span className="font-bold">Welcome!</span> We didn't find an account for <span className="font-mono font-bold">+91 {mobile}</span>. Let's create your unified health account.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <span>Create & Verify</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Verify Mobile Number
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Code sent to <span className="font-mono font-bold text-slate-700">+91 {mobile}</span>
                  {existingCustomer && <span className="block text-emerald-600 font-semibold mt-0.5">({existingCustomer.name})</span>}
                </p>
              </div>

              <div className="flex justify-center gap-2 my-4">
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
                      if (val && e.target.nextElementSibling) {
                        (e.target.nextElementSibling as HTMLInputElement).focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[index] && e.currentTarget.previousElementSibling) {
                        (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                      }
                    }}
                    className="w-12 h-12 text-center text-xl font-bold font-mono border-2 border-slate-200 rounded-xl focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50"
                  />
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setOtp(['1', '2', '3', '4'])}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
                >
                  Auto-fill demo code (1234)
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Change
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Access Account</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
