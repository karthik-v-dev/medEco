import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  FileText, 
  Clock, 
  Award, 
  MapPin, 
  Receipt, 
  PackageCheck,
  Truck,
  Building2,
  Camera,
  Edit3,
  Check,
  X,
  Compass,
  CheckCircle2,
  Store,
  Navigation
} from 'lucide-react';
import { Customer, Invoice, MedicineReminder, OnlineOrder, PharmacyBranch } from '../types';
import { ReminderManager } from './ReminderManager';
import { 
  getCustomerInvoices, 
  getCustomerReminders, 
  getCustomerOnlineOrders, 
  getPharmacyBranches,
  WARANGAL_DELIVERY_ZONES,
  calculateDistanceKm,
  updateCustomerLocationRealtime
} from '../services/firebase';
import { GoogleMapViewer } from './GoogleMapViewer';

interface CustomerPortalProps {
  customer: Customer | null;
  onOpenAuth: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onGoToShop: () => void;
  onOpenOnlineOrder?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customer,
  onOpenAuth,
  onViewInvoice,
  onGoToShop,
  onOpenOnlineOrder
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'history' | 'reminders'>('bookings');
  const [expandedMapOrderId, setExpandedMapOrderId] = useState<string | null>(null);

  // Existing customer delivery location change state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(customer?.zone || 'zone-hanamkonda');
  const [doorNo, setDoorNo] = useState<string>(customer?.doorNumber || '');
  const [streetAddress, setStreetAddress] = useState<string>(customer?.address || '');
  const [landmark, setLandmark] = useState<string>(customer?.landmark || '');
  const [pincode, setPincode] = useState<string>(customer?.pincode || '506001');
  const [isSavingLoc, setIsSavingLoc] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  if (!customer) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            One Customer, One Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Log in with your mobile phone number and security PIN to view your full medicine purchase history, track live online bookings, and manage daily dose reminders.
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Phone className="w-4 h-4" />
          <span>Login with Mobile Number & PIN</span>
        </button>
      </div>
    );
  }

  const customerInvoices = getCustomerInvoices(customer.mobileNumber);
  const customerReminders = getCustomerReminders(customer.mobileNumber);
  const customerOrders = getCustomerOnlineOrders(customer.mobileNumber);
  const branches = getPharmacyBranches();

  // Helper for SOP Stepper index (Tata 1mg / Apollo Pharmacy standard)
  const getSopStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'VERIFIED':
      case 'ACCEPTED': return 2;
      case 'PACKED':
      case 'PREPARING':
      case 'READY': return 3;
      case 'OUT_FOR_DELIVERY': return 4;
      case 'DELIVERED': return 5;
      default: return 1;
    }
  };

  // Active Zone & Coordinates for customer location
  const currentZone = WARANGAL_DELIVERY_ZONES.find(z => z.id === (customer.zone || selectedZoneId)) || WARANGAL_DELIVERY_ZONES[0];
  const userLat = customer.geoCoordinates?.latitude || currentZone.coordinates.latitude;
  const userLng = customer.geoCoordinates?.longitude || currentZone.coordinates.longitude;

  // Stores evaluated based on 8 km delivery radius from customer location
  const evaluatedStores = branches.map(b => {
    const dist = calculateDistanceKm(userLat, userLng, b.coordinates.latitude, b.coordinates.longitude);
    return {
      ...b,
      dist,
      isNear: dist <= 8.0
    };
  }).sort((a, b) => a.dist - b.dist);

  const nearStoresCount = evaluatedStores.filter(s => s.isNear).length;

  // Handle Zone selection in edit form
  const handleSelectZone = (newZoneId: string) => {
    setSelectedZoneId(newZoneId);
    const z = WARANGAL_DELIVERY_ZONES.find(item => item.id === newZoneId);
    if (z) {
      setPincode(z.pincode);
      if (!streetAddress || streetAddress.includes('Warangal')) {
        setStreetAddress(`${z.popularLandmarks}, ${z.area}, Warangal`);
      }
    }
  };

  // Save updated customer location to Firebase RTDB in real time
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLoc(true);

    const zone = WARANGAL_DELIVERY_ZONES.find(z => z.id === selectedZoneId) || WARANGAL_DELIVERY_ZONES[0];
    const fullAddress = streetAddress.trim() || `${doorNo ? doorNo + ', ' : ''}${zone.popularLandmarks}, ${zone.area}, Warangal`;

    await updateCustomerLocationRealtime(customer.mobileNumber, {
      zone: selectedZoneId,
      doorNumber: doorNo.trim() || undefined,
      address: fullAddress,
      landmark: landmark.trim() || undefined,
      pincode: pincode.trim() || zone.pincode,
      geoCoordinates: zone.coordinates
    });

    setIsSavingLoc(false);
    setIsEditingLocation(false);
    setSaveSuccessMsg('Your delivery location has been updated in Firebase! Near stores within 8 km refreshed.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Customer Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
            {customer.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{customer.name}</h2>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Verified Patient Account
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                +91 {customer.mobileNumber}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                {customer.loyaltyPoints || 45} Wellness Points
              </span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              activeTab === 'bookings'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Track Bookings ({customerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices ({customerInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
              activeTab === 'reminders'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Dose Reminders ({customerReminders.length})</span>
          </button>
        </div>
      </div>

      {/* DEDICATED LOCATION & 8 KM RADIUS NEARBY STORES CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Saved Delivery Location & Near Stores
                </h3>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  8 km Express Radius
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Your preferred location determines which medEco pharmacy hubs can fulfill your prescription orders.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingLocation(!isEditingLocation)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingLocation ? 'Cancel Edit' : 'Change Location / Zone'}</span>
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* INLINE LOCATION EDIT FORM */}
        {isEditingLocation ? (
          <form onSubmit={handleSaveLocation} className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Update Your Delivery Destination</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Warangal Delivery Zone *
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => handleSelectZone(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {WARANGAL_DELIVERY_ZONES.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name} (PIN: {z.pincode}) — {z.popularLandmarks}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Door / Flat No.
                </label>
                <input
                  type="text"
                  value={doorNo}
                  onChange={(e) => setDoorNo(e.target.value)}
                  placeholder="e.g. Flat #201, 2nd Flr"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nearby Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opp Petrol Pump"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Postal Pincode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="506001"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Street / Area Address *
              </label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. Kakatiya University 100ft Road, Nayeemnagar"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsEditingLocation(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingLoc}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingLoc ? 'Saving to Database...' : 'Save & Update Location'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY SAVED LOCATION DISPLAY */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left: Address details */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="text-[10px] uppercase font-extrabold text-slate-400">Current Destination:</div>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {currentZone.name}
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                {customer.doorNumber ? <span className="font-bold">{customer.doorNumber}, </span> : ''}
                {customer.address || `${currentZone.popularLandmarks}, ${currentZone.area}`}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                PIN: {customer.pincode || currentZone.pincode} {customer.landmark ? `• Landmark: ${customer.landmark}` : ''}
              </div>
            </div>

            {/* Right: Enabled Stores within 8 km */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase font-extrabold text-slate-400">
                <span>Nearby Stores (within 8 km):</span>
                <span className="text-emerald-600 font-bold">{nearStoresCount} Stores Available</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {evaluatedStores.map(store => (
                  <div 
                    key={store.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[11px] ${
                      store.isNear 
                        ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800' 
                        : 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Store className={`w-3.5 h-3.5 shrink-0 ${store.isNear ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {store.name.replace('medEco Pharmacy - ', '')}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      {store.isNear ? (
                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded text-[10px]">
                          {store.dist} km • Near Store
                        </span>
                      ) : (
                        <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold px-1.5 py-0.2 rounded text-[10px]">
                          {store.dist} km • &gt; 8 km
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: LIVE ONLINE MEDICINE BOOKINGS (SOP STEPPER) */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Live Medicine Bookings & Delivery Tracking
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orders dispatched from your selected nearest pharmacy branch with real-time status.
              </p>
            </div>

            {onOpenOnlineOrder && (
              <button
                onClick={onOpenOnlineOrder}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Order New Prescription</span>
              </button>
            )}
          </div>

          {customerOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200">No active online bookings</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need medicines delivered to your doorstep? Upload your doctor prescription or select medicines from our catalog for express 8 km delivery.
              </p>
              {onOpenOnlineOrder && (
                <button
                  onClick={onOpenOnlineOrder}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                >
                  Place Online Order
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map(order => {
                const branch = branches.find(b => b.id === order.pharmacyId);
                const step = getSopStepIndex(order.status);
                const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Store badge & Call button */}
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Fulfilling Store: <strong>{order.pharmacyName || branch?.name || 'Hanamkonda Chowrasta'}</strong></span>
                        </div>

                        {branch && (
                          <a
                            href={`tel:${branch.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 px-2 py-1 rounded-xl hover:bg-emerald-50"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Store</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Standard Online Pharmacy SOP Progress Stepper (Apollo / 1mg format) */}
                    {!isCancelled ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                        <div className="text-[11px] font-bold text-slate-500 mb-3 flex items-center justify-between">
                          <span>Delivery Status Timeline:</span>
                          <span className="font-extrabold text-emerald-600 uppercase text-[10px]">
                            {order.status}
                          </span>
                        </div>

                        {/* Visual 5-Step Bar */}
                        <div className="grid grid-cols-5 gap-1 text-center relative">
                          {/* Step 1 */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                              ✓
                            </div>
                            <span className="text-[10px] font-bold mt-1 text-slate-800 dark:text-slate-200">1. Placed</span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {step >= 2 ? '✓' : '2'}
                            </div>
                            <span className="text-[10px] font-bold mt-1 text-slate-800 dark:text-slate-200">2. Verified</span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {step >= 3 ? '✓' : '3'}
                            </div>
                            <span className="text-[10px] font-bold mt-1 text-slate-800 dark:text-slate-200">3. Packed</span>
                          </div>

                          {/* Step 4 */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              step >= 4 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {step >= 4 ? '🚚' : '4'}
                            </div>
                            <span className="text-[10px] font-bold mt-1 text-slate-800 dark:text-slate-200">4. Out for Delivery</span>
                          </div>

                          {/* Step 5 */}
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              step >= 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {step >= 5 ? '✓' : '5'}
                            </div>
                            <span className="text-[10px] font-bold mt-1 text-slate-800 dark:text-slate-200">5. Delivered</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-bold">
                        Order was cancelled or rejected by pharmacy staff.
                      </div>
                    )}

                    {/* Delivery Address & Door Number Details */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 block">
                            Delivery Destination:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                            {order.doorNumber && (
                              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                                Door: {order.doorNumber}
                              </span>
                            )}
                            <span>{order.address}</span>
                          </div>
                          {order.pincode && (
                            <span className="font-mono text-slate-500 block">
                              PIN: {order.pincode} {order.landmark ? `• Landmark: ${order.landmark}` : ''}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => setExpandedMapOrderId(expandedMapOrderId === order.id ? null : order.id)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 font-bold rounded-xl flex items-center gap-1 text-[11px] shrink-0 hover:bg-emerald-50"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{expandedMapOrderId === order.id ? 'Hide Map' : 'View Direct Location Map'}</span>
                        </button>
                      </div>

                      {/* Expandable Embedded Google Map */}
                      {expandedMapOrderId === order.id && (
                        <div className="pt-2">
                          <GoogleMapViewer
                            latitude={order.geoCoordinates?.latitude || 17.9689}
                            longitude={order.geoCoordinates?.longitude || 79.5941}
                            doorNumber={order.doorNumber}
                            address={order.address}
                            landmark={order.landmark}
                            pincode={order.pincode}
                            title="Your Delivery Destination Pinpoint"
                          />
                        </div>
                      )}
                    </div>

                    {/* Prescribed Items & Total (Clinical View, No Internal Racks) */}
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Prescribed Medicines:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{item.medicineName}</span>
                              <span className="text-[10px] text-slate-400 block">{item.dosage}</span>
                              {item.genericName && (
                                <span className="text-[9px] text-slate-500 block italic">{item.genericName}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-800 dark:text-slate-200">Qty: {item.quantity}</span>
                              <span className="text-[10px] text-slate-400 block">₹{(item.quantity * item.unitPrice).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
                        <span>Order Total:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                          ₹{order.estimatedTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PURCHASE HISTORY & TAX INVOICES */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Official Tax Invoices & Past Receipts
            </h3>
            <span className="text-xs text-slate-500">
              {customerInvoices.length} receipts archived
            </span>
          </div>

          {customerInvoices.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No purchase records found</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Medicines billed to your phone number (+91 {customer.mobileNumber}) will show up here automatically.
              </p>
              <button
                onClick={onOpenOnlineOrder ? onOpenOnlineOrder : onGoToShop}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md inline-flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Order Prescriptions Online</span>
              </button>
            </div>
          ) : (
            customerInvoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
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
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Dr: <span className="font-semibold">{inv.doctorName}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        ₹{inv.grandTotal.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-bold">
                        {inv.paymentMode} - {inv.status}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {inv.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{item.medicineName}</span>
                        <span className="text-[10px] text-slate-500 block">{item.genericName}</span>
                        <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Rx Prescribed • Verified Dose
                        </span>
                      </div>
                      <div className="text-right pl-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">x{item.quantity}</span>
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

      {/* TAB 3: MEDICINE DOSE REMINDERS */}
      {activeTab === 'reminders' && (
        <ReminderManager
          customerMobile={customer.mobileNumber}
          reminders={customerReminders}
        />
      )}
    </div>
  );
};
