import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Printer, 
  Search, 
  Layers, 
  Store, 
  Users, 
  Clock, 
  Lock, 
  Pill, 
  FileText, 
  ShieldCheck,
  CheckCircle2,
  Phone,
  Truck,
  MapPin,
  HelpCircle,
  Building2,
  KeyRound,
  Compass
} from 'lucide-react';
import { useModalScrollLock } from '../services/modalLock';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'customer' | 'owner';
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ 
  isOpen, 
  onClose,
  role = 'customer'
}) => {
  const [activeTab, setActiveTab] = useState<'patient' | 'owner'>(role === 'owner' ? 'owner' : 'patient');

  // Lock background scroll when user manual modal is open
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  const handlePrintManual = () => {
    window.print();
  };

  const isCustomerView = activeTab === 'patient';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Action Bar - Fixed at Top, Never Scrolls */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print shrink-0 sticky top-0 z-20 border-b border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
              isCustomerView ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">
                  {isCustomerView ? 'medEco - Patient User Guide' : 'medEco - Owner Operations Manual'}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isCustomerView 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isCustomerView ? 'Patient Edition' : 'Pharmacy Admin Edition'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isCustomerView 
                  ? 'Official Guide for Ordering Medicines, Zone Selection & 8 km Express Delivery'
                  : 'Confidential Operational Standard Operating Procedures (SOP)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* If user has owner access, allow switching between patient and owner manual */}
            {role === 'owner' && (
              <div className="hidden sm:flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setActiveTab('patient')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'patient' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Patient View
                </button>
                <button
                  onClick={() => setActiveTab('owner')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeTab === 'owner' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Owner SOP
                </button>
              </div>
            )}

            <button
              onClick={handlePrintManual}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Manual Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto text-slate-800 dark:text-slate-200 receipt-container space-y-8 text-sm">
          
          {/* ========================================================
              PATIENT USER GUIDE (FOR LOGGED-IN CUSTOMERS)
              ======================================================== */}
          {isCustomerView ? (
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Cover / Header Section */}
              <div className="border-b-2 border-emerald-600 pb-6 text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Pill className="w-3.5 h-3.5" />
                  <span>Patient Healthcare & Delivery Guide</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  med<span className="text-emerald-600">Eco</span> Patient Manual
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                  Complete guide to ordering prescription medicines to your doorstep, selecting delivery zones within an 8 km radius of nearby stores, tracking live status, and managing daily dose reminders.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-500 pt-2">
                  <span>Version: <strong>2.0 (Patient Edition)</strong></span>
                  <span>•</span>
                  <span>Region: <strong>Warangal & Tri-Cities, Telangana</strong></span>
                  <span>•</span>
                  <span>Express Radius: <strong>8 km from Store</strong></span>
                </div>
              </div>

              {/* Table of Contents */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Guide Contents</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                  <a href="#cust-sec-1" className="text-emerald-700 dark:text-emerald-400 hover:underline">1. One Account: Mobile Number & PIN Security</a>
                  <a href="#cust-sec-2" className="text-emerald-700 dark:text-emerald-400 hover:underline">2. Delivery Zones & 8 km Store Radius Rule</a>
                  <a href="#cust-sec-3" className="text-emerald-700 dark:text-emerald-400 hover:underline">3. Ordering Medicines Online (Pure Clinical View)</a>
                  <a href="#cust-sec-4" className="text-emerald-700 dark:text-emerald-400 hover:underline">4. Updating Your Saved Address & Delivery Location</a>
                  <a href="#cust-sec-5" className="text-emerald-700 dark:text-emerald-400 hover:underline">5. Live 5-Step Order SOP Tracking & Store Helpline</a>
                  <a href="#cust-sec-6" className="text-emerald-700 dark:text-emerald-400 hover:underline">6. Daily Medicine Dose Reminders & Adherence</a>
                </div>
              </div>

              {/* SECTION 1: AUTH & PIN */}
              <section id="cust-sec-1" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>1. One Customer, One Account (Mobile Number & Security PIN)</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your medEco account is uniquely tied to your 10-digit mobile phone number and protected by a private 4-digit security PIN.
                </p>
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 text-xs text-emerald-950 dark:text-emerald-200">
                  <h4 className="font-extrabold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>How to Log In:</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Enter your <strong>10-digit Mobile Number</strong> (e.g., 9030481507).</li>
                    <li>Enter your <strong>4-digit Security PIN</strong> configured during registration.</li>
                    <li>All your previous tax receipts, orders, and dosage schedules are securely restored.</li>
                    <li><strong>Forgot Your PIN?</strong> Contact your nearest medEco store helpline. The pharmacist verifies your registered mobile number and can instantly reveal or reset your PIN.</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 2: 8 KM RADIUS & ZONE OPTIONS */}
              <section id="cust-sec-2" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>2. Delivery Zone Selection & 8 km Store Radius Rule</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  To ensure medicines arrive fresh, undamaged, and within 30 minutes, <strong>deliveries are permitted strictly within an 8 km radius</strong> of our medEco pharmacy branches.
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white">Supported Warangal Delivery Zones:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">Hanamkonda Central & Chowrasta</strong>
                      <span>Public Gardens, KU Cross, Bus Stand (PIN: 506001)</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">Nayeemnagar & KU 100ft Road</strong>
                      <span>Chaitanya Junction, Kakatiya Univ Gate (PIN: 506009)</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">Subedari & Collectorate</strong>
                      <span>District Court, University Road (PIN: 506001)</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">Kazipet & Railway Colony</strong>
                      <span>Railway Junction, Diesel Colony, Overbridge (PIN: 506003)</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">MGM Hospital Hub & Fort Road</strong>
                      <span>KMC, Station Road, Warangal City (PIN: 506002)</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <strong className="text-emerald-700 dark:text-emerald-400 block font-bold">Hunter Road & Waddepally</strong>
                      <span>Arts College Road, Waddepally Lake (PIN: 506001)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] space-y-1">
                    <strong className="font-bold block">⚡ Dynamic Store Enabling:</strong>
                    <p>
                      When you select your delivery zone or GPS location, the system automatically measures the exact distance to each store. 
                      Stores within <strong>8 km are highlighted in green and enabled</strong> for ordering. Stores located farther than 8 km are disabled with a clear "Beyond 8 km radius" label.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 3: ORDERING MEDICINES WITHOUT RACKS */}
              <section id="cust-sec-3" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  <span>3. Ordering Prescription Medicines Online (Patient View)</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  As a patient, your order screen shows only essential clinical and financial information. Internal pharmacy storage racks and shelf coordinates are kept strictly behind the counter.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1">
                    <strong className="text-emerald-900 dark:text-emerald-300 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>What You See on Your Order:</span>
                    </strong>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      <li>Medicine Brand Name (e.g., <em>Dolo 650</em>, <em>Pan 40</em>)</li>
                      <li>Generic Salt & Strength (e.g., <em>Paracetamol 650mg</em>)</li>
                      <li>Dosage & Strip Pack (e.g., <em>15 tablets/strip</em>)</li>
                      <li>Unit Price (MRP ₹), Quantity, and Total Amount</li>
                      <li>Pharmacist dosage guidance & meal instructions</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1">
                    <strong className="text-slate-900 dark:text-white font-extrabold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>What Is Kept Confidential:</span>
                    </strong>
                    <p className="text-slate-600 dark:text-slate-400">
                      Internal warehouse coordinates (such as <code>Rack A &gt; Shelf 1 &gt; Box-01</code>) and wholesale purchase costs are concealed to provide a clutter-free, patient-friendly prescription view.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 4: LOCATION CHANGE */}
              <section id="cust-sec-4" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>4. Changing Your Saved Delivery Location Anytime</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Existing customers can easily update their delivery zone, flat number, or landmark directly from their Patient Portal or during checkout.
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-2">
                  <p className="text-slate-700 dark:text-slate-300">
                    When you update your delivery zone:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    <li>Open <strong>My Orders & Live Tracking</strong> in your top navigation bar.</li>
                    <li>Look for the <strong>"Your Saved Delivery Location"</strong> card.</li>
                    <li>Click <strong>"Change Delivery Zone / Location"</strong>.</li>
                    <li>Select your new Warangal locality or input your street address.</li>
                    <li>Click <strong>"Save Delivery Location"</strong> — your profile in the live database is updated and the nearby stores within 8 km are instantly recalculated!</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 5: LIVE SOP STEPPER */}
              <section id="cust-sec-5" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span>5. Live 5-Step Order SOP Tracking & Store Helpline</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Every order placed follows the standard 5-step healthcare delivery timeline:
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-emerald-600 block">1. Placed</span>
                      <span className="text-[10px] text-slate-500">Received by store</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-emerald-600 block">2. Verified</span>
                      <span className="text-[10px] text-slate-500">Pharmacist Rx check</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-emerald-600 block">3. Packed</span>
                      <span className="text-[10px] text-slate-500">Tamper-proof bag</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-amber-600 block">4. Dispatched</span>
                      <span className="text-[10px] text-slate-500">Out for delivery</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="font-bold text-emerald-600 block">5. Delivered</span>
                      <span className="text-[10px] text-slate-500">Handed to patient</span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 pt-1 text-[11px]">
                    Need to modify an item or inform the driver? Click the <strong>"Call Store"</strong> button directly from your order card to speak to the fulfilling pharmacist.
                  </p>
                </div>
              </section>

              {/* SECTION 6: DOSE REMINDERS */}
              <section id="cust-sec-6" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span>6. Daily Medicine Dose Reminders & Adherence</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Never miss a tablet again! Schedule daily intake times for your prescriptions:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <li><strong>Meal Relation:</strong> Set "Before Food" or "After Food" for each tablet.</li>
                  <li><strong>Intake Slots:</strong> Configure Morning, Afternoon, Evening, or Bedtime doses.</li>
                  <li><strong>Adherence Score:</strong> Check off daily doses as taken to build healthy wellness habits.</li>
                </ul>
              </section>
            </div>
          ) : (
            /* ========================================================
               OWNER OPERATIONS MANUAL (FOR AUTHENTICATED OWNERS)
               ======================================================== */
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Cover / Header Section */}
              <div className="border-b-2 border-amber-600 pb-6 text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confidential Pharmacy Operations SOP</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  med<span className="text-amber-600">Eco</span> Owner Operations Manual
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                  Standard Operating Procedures for store franchise operations: Firebase RTDB authentication, physical storage racks, POS GST billing, pending stock consignments, and customer PIN reset helpline.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-500 pt-2">
                  <span>Version: <strong>2.0 (Owner Master SOP)</strong></span>
                  <span>•</span>
                  <span>Database: <strong>Firebase Realtime DB (users/owner)</strong></span>
                  <span>•</span>
                  <span>Network: <strong>Warangal Multi-Store Franchise</strong></span>
                </div>
              </div>

              {/* Table of Contents */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Operational SOP Chapters</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                  <a href="#own-sec-1" className="text-amber-700 dark:text-amber-400 hover:underline">1. Secure Owner Authentication via Firebase RTDB</a>
                  <a href="#own-sec-2" className="text-amber-700 dark:text-amber-400 hover:underline">2. Physical Rack & Shelf Storage Mapping</a>
                  <a href="#own-sec-3" className="text-amber-700 dark:text-amber-400 hover:underline">3. Multi-Store Stock Consignment Check-In</a>
                  <a href="#own-sec-4" className="text-amber-700 dark:text-amber-400 hover:underline">4. POS Billing, GST Compliance & Thermal Receipts</a>
                  <a href="#own-sec-5" className="text-amber-700 dark:text-amber-400 hover:underline">5. Customer Directory & Helpline PIN View / Reset</a>
                  <a href="#own-sec-6" className="text-amber-700 dark:text-amber-400 hover:underline">6. 8 km Delivery Radius Dispatch Management</a>
                </div>
              </div>

              {/* SECTION 1: RTDB AUTH */}
              <section id="own-sec-1" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span>1. Secure Owner Authentication via Firebase RTDB</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Owner authentication is verified directly against the live Firebase Realtime Database at path <code>users/owner</code>. Zero hardcoded bypasses exist in the application code.
                </p>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs space-y-2 text-amber-950 dark:text-amber-200">
                  <h4 className="font-extrabold">Security Highlights:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Owner PIN is stored securely in Firebase RTDB and checked dynamically.</li>
                    <li>Logout cleans all session tokens, input fields, and PIN inputs to prevent unauthorized walk-in access.</li>
                    <li>Store managers each have isolated branch keys for auditing regional sales.</li>
                  </ul>
                </div>
              </section>

              {/* SECTION 2: PHYSICAL RACKS */}
              <section id="own-sec-2" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <span>2. Physical Warehouse Rack & Shelf Storage Mapping</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Store staff use the 3-tier coordinate system to instantly retrieve medications from physical shelves:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block font-bold">Rack A (Fast-Moving & Analgesics)</strong>
                    <span className="text-slate-500">Paracetamol, Dolo 650, Pan 40, Azithral (Eye level)</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block font-bold">Rack B (Chronic Care & Cardiology)</strong>
                    <span className="text-slate-500">Telma 40, Glycomet-GP2, Montair-LC (Organized by Salt)</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block font-bold">Rack C & D (Syrups & Topicals)</strong>
                    <span className="text-slate-500">Ascoril D, Volini Gel, Refresh Tears Eye Drops</span>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                    <strong className="text-blue-950 dark:text-blue-200 block font-bold">Cold Storage (2°C - 8°C Refrigerator)</strong>
                    <span className="text-blue-800 dark:text-blue-300">Lantus Insulin Pens, Tetanus Toxoid Vaccines</span>
                  </div>
                </div>
              </section>

              {/* SECTION 3: STOCK CONSIGNMENTS */}
              <section id="own-sec-3" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Store className="w-5 h-5 text-amber-600" />
                  <span>3. Multi-Store Stock Consignment Check-In</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Incoming shipments from pharmaceutical distributors (e.g., Warangal Pharma Dist, Sun Pharma, Cipla) are received in the Franchise Dashboard:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <li>Compare invoice physical quantity against consignment line items.</li>
                  <li>Click <strong>"Check-in Consignment"</strong> to automatically increment branch stock units in Firebase RTDB.</li>
                  <li>Low stock alerts trigger automatically when inventory falls below 10 units.</li>
                </ul>
              </section>

              {/* SECTION 4: POS BILLING & GST */}
              <section id="own-sec-4" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>4. Point of Sale (POS) Billing, GST & Receipts</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  The integrated POS counter engine handles retail walk-in and online fulfillment billing:
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <p>• <strong>GST Breakdown:</strong> Automated 5%, 12%, and 18% CGST + SGST tax computation with rounded totals.</p>
                  <p>• <strong>Discounts:</strong> Real-time percentage (5%, 10%) or fixed cash discounts.</p>
                  <p>• <strong>Thermal Printing:</strong> 80mm ESC/POS thermal receipt formatting and standard A4 hospital invoice printing.</p>
                  <p>• <strong>WhatsApp Invoicing:</strong> 1-click delivery of PDF tax receipts directly to the patient's phone.</p>
                </div>
              </section>

              {/* SECTION 5: CUSTOMER PIN RESET HELPLINE */}
              <section id="own-sec-5" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span>5. Customer Directory & Helpline PIN View / Remote Reset</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  In case a patient forgets their 4-digit security PIN, they call their nearest medEco branch helpline number. Store owners can immediately assist them:
                </p>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs space-y-2 text-amber-950 dark:text-amber-200">
                  <h4 className="font-extrabold">Helpline Standard Protocol:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open <strong>Customer Directory</strong> in the top navigation.</li>
                    <li>Filter by customer's branch or search their registered 10-digit mobile number.</li>
                    <li>Click the patient to view their profile. Under the <strong>"Store Helpline / Forgot PIN Support"</strong> card:</li>
                    <li>Click the <strong>Eye Icon</strong> to view their current PIN and read it to them over the phone.</li>
                    <li>Or type a new 4-digit PIN and click <strong>"Update PIN in Database"</strong>. The update commits instantly to Firebase RTDB (<code>users/{'{mobile}'}/pin</code>).</li>
                  </ol>
                </div>
              </section>

              {/* SECTION 6: 8 KM DISPATCH */}
              <section id="own-sec-6" className="space-y-3">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <span>6. 8 km Delivery Radius Dispatch Management</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  All online prescription requests arriving at your branch have been validated to ensure the customer's delivery destination is within your branch's 8 km service boundary.
                </p>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <li>Verify prescription image and confirm stock availability on physical shelves.</li>
                  <li>Advance order status through the 5 SOP stages (VERIFIED &gt; PACKED &gt; OUT_FOR_DELIVERY &gt; DELIVERED).</li>
                  <li>Orders beyond 8 km are systematically prevented from dispatching to your branch.</li>
                </ul>
              </section>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="font-semibold text-slate-600 dark:text-slate-400">medEco Healthcare Systems • Warangal, Telangana, India</p>
              <p>Direct Store Helpline: +91 870 244 5566 • care@medeco-pharmacy.com</p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            >
              Close Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
