import React from 'react';
import { 
  BookOpen, 
  X, 
  Printer, 
  Download, 
  Search, 
  Layers, 
  Store, 
  Users, 
  Clock, 
  Lock, 
  Pill, 
  FileText, 
  Sun, 
  ShieldCheck,
  CheckCircle2,
  Phone,
  Sparkles
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrintManual = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Top Action Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">medEco - Complete User Manual</h3>
              <p className="text-[11px] text-slate-400">Official Operational Guide & System Manual</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintManual}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Manual Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto text-slate-800 dark:text-slate-200 receipt-container space-y-8 text-sm">
          {/* Cover / Header Section */}
          <div className="border-b-2 border-emerald-600 pb-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Pill className="w-3.5 h-3.5" />
              <span>Official Healthcare System Documentation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              med<span className="text-emerald-600">Eco</span> User Manual
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Smart Medicine Storage Rack Locator, POS Billing with GST & Discounts, Patient Purchase History, and Medicine Dose Reminders.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-500 pt-2">
              <span>Version: <strong>1.2.0</strong></span>
              <span>•</span>
              <span>Platform: <strong>React + Vite + TypeScript</strong></span>
              <span>•</span>
              <span>Database: <strong>Firebase Realtime Database</strong></span>
            </div>
          </div>

          {/* Quick Table of Contents */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
              <a href="#sec-1" className="text-emerald-700 dark:text-emerald-400 hover:underline">1. Instant Medicine & Rack Locator</a>
              <a href="#sec-2" className="text-emerald-700 dark:text-emerald-400 hover:underline">2. Visual Pharmacy Rack Layout Map</a>
              <a href="#sec-3" className="text-emerald-700 dark:text-emerald-400 hover:underline">3. Point of Sale (POS) Billing & GST Receipts</a>
              <a href="#sec-4" className="text-emerald-700 dark:text-emerald-400 hover:underline">4. Customer Mobile Account & Data Privacy</a>
              <a href="#sec-5" className="text-emerald-700 dark:text-emerald-400 hover:underline">5. Medicine Dose Reminders & Adherence Tracker</a>
              <a href="#sec-6" className="text-emerald-700 dark:text-emerald-400 hover:underline">6. Pharmacy Owner Portal & Customer Audit</a>
              <a href="#sec-7" className="text-emerald-700 dark:text-emerald-400 hover:underline">7. Appearance & Theme (Light / Dark / System)</a>
            </div>
          </div>

          {/* SECTION 1 */}
          <section id="sec-1" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Search className="w-5 h-5 text-emerald-600" />
              <span>1. Instant Medicine & Rack Storage Locator</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              When a customer asks for a tablet or medicine, pharmacy staff or customers can immediately type the brand name, salt formula, or rack ID into the search bar.
            </p>
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-xs text-emerald-950 dark:text-emerald-200">Displayed Location Information:</h3>
              <ul className="list-disc list-inside text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                <li><strong>Rack Identifier:</strong> e.g., <code>Rack A</code>, <code>Rack B</code>, <code>Cold Storage</code></li>
                <li><strong>Shelf Number:</strong> e.g., <code>Shelf 1</code>, <code>Shelf 2</code> (vertical height indicator)</li>
                <li><strong>Box / Bin ID:</strong> e.g., <code>Box-01</code>, <code>Box-04</code> (exact container inside the shelf)</li>
                <li><strong>Storage Guidelines:</strong> e.g., <em>"Store below 25°C"</em> or <em>"2°C - 8°C Refrigerated"</em></li>
                <li><strong>Pricing & Stock:</strong> Unit MRP (₹), GST %, and real-time inventory availability</li>
              </ul>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="sec-2" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>2. Visual Pharmacy Rack Layout Map</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              The Rack Map provides an interactive physical representation of the pharmacy storage bays:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <strong className="text-slate-900 dark:text-white block font-bold">Rack A (Fast Moving & Antibiotics)</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Paracetamol, Augmentin, Pan 40, Azithral</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <strong className="text-slate-900 dark:text-white block font-bold">Rack B (Chronic Care & Cardiology)</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Diabetes (Glycomet-GP), Blood Pressure (Telma 40), Allergies</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <strong className="text-slate-900 dark:text-white block font-bold">Rack C & D (Liquids, Ointments & Drops)</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Cough Syrups, Volini Pain Relief, Refresh Tears Eye Drops</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
                <strong className="text-blue-950 dark:text-blue-200 block font-bold">Cold Storage (Medical Refrigerator)</strong>
                <p className="text-blue-800 dark:text-blue-300 mt-0.5">Temperature monitored 2°C - 8°C (Lantus Insulin, Vaccines)</p>
              </div>
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="sec-3" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>3. POS Billing with GST & Discount Calculation</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              The Point of Sale (POS) terminal enables quick billing with automated tax compliance:
            </p>
            <ol className="list-decimal list-inside text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
              <li><strong>Add Items:</strong> Search and click "Add to Bill" or add items directly from the search bar.</li>
              <li><strong>Enter Customer Mobile:</strong> Type the 10-digit phone number. Existing accounts will automatically load the patient's name and wellness points.</li>
              <li><strong>Apply Discount:</strong> Choose between Percentage (e.g. 5%, 10%, 15%) or Flat Cash discount (₹).</li>
              <li><strong>GST Tax Engine:</strong> Computes Taxable Value, CGST (e.g. 6%), and SGST (e.g. 6%) breakdowns with net payable rounding.</li>
              <li><strong>Tax Invoice Generation:</strong> Completing checkout generates a printable tax receipt formatted for thermal receipt printers and A4 PDF export, plus a 1-click WhatsApp share link.</li>
            </ol>
          </section>

          {/* SECTION 4 */}
          <section id="sec-4" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>4. Customer Mobile Login & Strict Data Privacy</span>
            </h2>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
              <strong className="font-extrabold text-sm block">🔒 Privacy Guarantee: "One Customer, One Account"</strong>
              <p>
                Customers authenticate securely using their 10-digit mobile number. Once logged in, customers <strong>ONLY see their own personal data</strong>:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Their own previous medicine purchase history & past receipts.</li>
                <li>Their own scheduled daily dose reminders.</li>
                <li>Store inventory cost prices, POS terminals, and other customers' records are strictly hidden.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="sec-5" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>5. Medicine Dose Reminders & Adherence Tracker</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Patients and staff can configure scheduled medication reminders:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <li><strong>Timings:</strong> Morning, Afternoon, Evening, Night with customized clock hours.</li>
              <li><strong>Meal Relation:</strong> Before Food, After Food, With Food, or Empty Stomach.</li>
              <li><strong>Daily Checklist:</strong> Mark doses as "Taken" or "Pending" to track adherence percentages.</li>
              <li><strong>WhatsApp Alert:</strong> 1-click share to family members or patient phones with dosage instructions.</li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section id="sec-6" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <span>6. Pharmacy Owner Portal & Customer Audit</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Pharmacy owners log in with credentials (Password: <code>admin123</code> or PIN: <code>9999</code>).
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Owner Privileges:</h4>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                <li><strong>Customer Directory:</strong> Inspect any customer's previous order history, total spending, and active medicine reminders.</li>
                <li><strong>Inventory Master Data:</strong> Add, edit, or delete medicines, update shelf coordinates and wholesale costs.</li>
                <li><strong>POS Billing:</strong> Issue official tax receipts with GST and custom discounts.</li>
                <li><strong>All Receipts:</strong> Audit complete sales logs and filter by payment mode.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 7 */}
          <section id="sec-7" className="space-y-3">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Sun className="w-5 h-5 text-emerald-600" />
              <span>7. Theme Customization (Light, Dark & System Default)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Users can customize the visual theme by clicking the Appearance button in the top navigation bar:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <span className="font-bold block">☀️ Light Mode</span>
                <span className="text-[10px] text-slate-500">Crisp daytime contrast</span>
              </div>
              <div className="p-3 bg-slate-900 text-white border border-slate-800 rounded-xl">
                <span className="font-bold block">🌙 Dark Mode</span>
                <span className="text-[10px] text-slate-400">Eye-friendly for night shifts</span>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <span className="font-bold block">💻 System Default</span>
                <span className="text-[10px] text-slate-500">Follows device OS preference</span>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-400">medEco Healthcare Solutions • Bangalore, India</p>
            <p>For technical support or inquiries, contact care@medeco-pharmacy.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
