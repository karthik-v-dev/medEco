import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  Phone, 
  Receipt, 
  Search, 
  Check, 
  Percent, 
  IndianRupee, 
  CreditCard, 
  MapPin, 
  Clock, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Medicine, CartItem, Customer, Invoice, InvoiceItem } from '../types';
import { getCustomerByMobile, saveInvoice, saveReminder } from '../services/firebase';

interface BillingPOSProps {
  medicines: Medicine[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  activeCustomer: Customer | null;
  onInvoiceCreated: (invoice: Invoice) => void;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({
  medicines,
  cart,
  setCart,
  activeCustomer,
  onInvoiceCreated
}) => {
  const [customerPhone, setCustomerPhone] = useState(activeCustomer?.mobileNumber || '');
  const [customerName, setCustomerName] = useState(activeCustomer?.name || '');
  const [doctorName, setDoctorName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(5); // default 5% discount
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('UPI');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [autoAddReminders, setAutoAddReminders] = useState(true);

  // Sync customer phone if activeCustomer changes
  React.useEffect(() => {
    if (activeCustomer) {
      setCustomerPhone(activeCustomer.mobileNumber);
      setCustomerName(activeCustomer.name);
    }
  }, [activeCustomer]);

  // Quick lookup when phone number is typed
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setCustomerPhone(clean);
    if (clean.length === 10) {
      const existing = getCustomerByMobile(clean);
      if (existing) {
        setCustomerName(existing.name);
      }
    }
  };

  // Medicine quick search in POS
  const searchResults = useMemo(() => {
    if (!medicineSearch.trim()) return [];
    const q = medicineSearch.toLowerCase().trim();
    return medicines
      .filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.genericName.toLowerCase().includes(q) ||
        m.rackLocation.rackId.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [medicines, medicineSearch]);

  const addToCart = (med: Medicine) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.medicine.id === med.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + 1,
          total: (next[idx].quantity + 1) * next[idx].unitPrice
        };
        return next;
      } else {
        return [
          ...prev,
          {
            medicine: med,
            quantity: 1,
            unitPrice: med.unitPrice,
            total: med.unitPrice,
            selectedDosageInstructions: med.category === 'Tablets' ? '1 tablet twice daily after food' : 'As directed'
          }
        ];
      }
    });
    setMedicineSearch('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.medicine.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.medicine.id !== id));
  };

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (subtotal <= 0) return 0;
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return Math.min(subtotal, discountValue);
  }, [subtotal, discountType, discountValue]);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Calculate weighted GST on discounted value
  const gstBreakdown = useMemo(() => {
    if (subtotal === 0) {
      return { taxableAmount: 0, cgst: 0, sgst: 0, totalGst: 0, grandTotal: 0 };
    }
    // Standard retail calculation: prices are inclusive of GST, so calculate backwards
    // For transparent invoice:
    // Base Taxable = discountedSubtotal / (1 + avgGSTRate)
    const effectiveGstRate = 0.12; // 12% standard medicine GST
    const taxable = discountedSubtotal / (1 + effectiveGstRate);
    const totalGst = discountedSubtotal - taxable;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const grandTotal = Math.round(discountedSubtotal * 100) / 100;

    return {
      taxableAmount: Math.round(taxable * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      grandTotal
    };
  }, [subtotal, discountedSubtotal]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const invoiceNumber = `MED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceItems: InvoiceItem[] = cart.map(item => ({
      medicineId: item.medicine.id,
      medicineName: item.medicine.name,
      genericName: item.medicine.genericName,
      batchNumber: item.medicine.batchNumber,
      expiryDate: item.medicine.expiryDate,
      rackInfo: `${item.medicine.rackLocation.rackId} > S${item.medicine.rackLocation.shelfNumber} ${item.medicine.rackLocation.boxNumber ? `> ${item.medicine.rackLocation.boxNumber}` : ''}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstRate: item.medicine.gstRate,
      gstAmount: Math.round(((item.total * item.medicine.gstRate) / (100 + item.medicine.gstRate)) * 100) / 100,
      total: item.total,
      dosageInstruction: item.selectedDosageInstructions
    }));

    const cleanPhone = customerPhone.replace(/\D/g, '') || '9876543210';
    const finalInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: new Date().toISOString(),
      customerMobile: cleanPhone,
      customerName: customerName.trim() || `Customer ${cleanPhone.slice(-4)}`,
      items: invoiceItems,
      subtotal,
      discountType,
      discountValue,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxableAmount: gstBreakdown.taxableAmount,
      cgstAmount: gstBreakdown.cgst,
      sgstAmount: gstBreakdown.sgst,
      totalGst: gstBreakdown.totalGst,
      grandTotal: gstBreakdown.grandTotal,
      paymentMode,
      status: 'PAID',
      doctorName: doctorName.trim() || undefined
    };

    // Save invoice to database & local persistence
    await saveInvoice(finalInvoice);

    // If autoAddReminders is checked and customer phone exists, generate daily reminders
    if (autoAddReminders && cleanPhone) {
      for (const item of cart) {
        if (item.medicine.category === 'Tablets' || item.medicine.category === 'Capsules') {
          await saveReminder({
            id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            customerMobile: cleanPhone,
            medicineName: item.medicine.name,
            dosage: item.medicine.dosage || '1 Tablet',
            timings: ['Morning', 'Night'],
            customTime: '08:30 AM & 08:30 PM',
            mealRelation: 'After Food',
            startDate: new Date().toISOString().split('T')[0],
            isActive: true,
            notes: `Prescribed on ${new Date().toLocaleDateString()}. Complete course.`
          });
        }
      }
    }

    // Clear cart and notify parent to display receipt modal
    setCart([]);
    onInvoiceCreated(finalInvoice);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <ShoppingCart className="w-4 h-4" />
            <span>Point of Sale Terminal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Medicine POS Billing with GST & Discounts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate itemized tax invoices with storage rack picking notes and patient dose reminders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Search & Cart items */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Search & Add Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Add Medicines to Bill:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
              <input
                type="text"
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                placeholder="Type tablet name to quickly add (e.g. Dolo, Pan 40, Cetzine)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-4 right-4 top-20 bg-white rounded-xl shadow-xl border border-slate-200 z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150">
                {searchResults.map(med => (
                  <div
                    key={med.id}
                    onClick={() => addToCart(med)}
                    className="p-3 hover:bg-emerald-50/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900">{med.name}</h4>
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                          {med.rackLocation.rackId} &gt; S{med.rackLocation.shelfNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{med.genericName} • Stock: {med.stock}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">₹{med.unitPrice.toFixed(2)}</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">+ Add</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                Order Items ({cart.length})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] font-bold text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Search medicines above or use the "Where is Tablet?" tab to add items.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {cart.map(item => (
                  <div key={item.medicine.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">{item.medicine.name}</h4>
                        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {item.medicine.rackLocation.rackId} (S{item.medicine.rackLocation.shelfNumber})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.medicine.dosage} • Batch: <span className="font-mono">{item.medicine.batchNumber}</span>
                      </p>
                    </div>

                    {/* Quantity controls & item total */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.medicine.id, -1)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.medicine.id, 1)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-black text-slate-900">
                          ₹{item.total.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          ₹{item.unitPrice.toFixed(2)} ea
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(item.medicine.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Customer Details, Discount & Billing Summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer Card ("One customer one account") */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Customer Account
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                One Phone, One Record
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mobile Number (Primary Key)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-xs">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Customer Full Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Prescribing Doctor (Optional)</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. K. S. Rao"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Discounts & Tax Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Discount & Payment
            </h3>

            {/* Discount Selector */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Apply Discount</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      discountType === 'percentage' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      discountType === 'fixed' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    ₹ Flat Off
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                {[0, 5, 10, 15].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setDiscountType('percentage'); setDiscountValue(p); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      discountType === 'percentage' && discountValue === p
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p === 0 ? 'None' : `${p}%`}
                  </button>
                ))}
                <div className="w-20">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? 100 : subtotal}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Payment Mode</span>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'Cash', 'Card'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMode === mode
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Schedule Reminders Option */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAddReminders}
                onChange={(e) => setAutoAddReminders(e.target.checked)}
                className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Auto-create Medicine Reminders
                </span>
                <span className="text-[11px] text-emerald-800 leading-tight block">
                  Automatically schedules morning & night dose alerts for customer's mobile number.
                </span>
              </div>
            </label>

            {/* Price Calculations Breakdown */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross MRP)</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'})</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Taxable Value</span>
                <span>₹{gstBreakdown.taxableAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST (6%)</span>
                <span>₹{gstBreakdown.cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST (6%)</span>
                <span>₹{gstBreakdown.sgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-900 font-extrabold text-base pt-2 border-t border-slate-200">
                <span>Grand Total (Net)</span>
                <span className="text-emerald-700">₹{gstBreakdown.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout / Generate Receipt Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.99]'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Generate GST Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
