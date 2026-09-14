import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  MapPin, 
  Phone, 
  User, 
  FileText, 
  X, 
  Sparkles, 
  Check, 
  Camera, 
  Navigation, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Building2,
  Store,
  Compass
} from 'lucide-react';
import { Medicine, OnlineOrder, OnlineOrderItem, UserSession, PharmacyBranch } from '../types';
import { saveOnlineOrder, getMedicines, getPharmacyBranches, calculateDistanceKm } from '../services/firebase';
import { GoogleMapViewer } from './GoogleMapViewer';

interface OnlineOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession | null;
  onOrderSubmitted: (order: OnlineOrder) => void;
  onRequireLogin?: () => void;
}

export const OnlineOrderModal: React.FC<OnlineOrderModalProps> = ({
  isOpen,
  onClose,
  session,
  onOrderSubmitted,
  onRequireLogin
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const branches = getPharmacyBranches();
  
  // State
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'pharm-koramangala');
  const [customerName, setCustomerName] = useState(session?.customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(session?.customer?.mobileNumber || '');
  const [doorNumber, setDoorNumber] = useState('');
  const [address, setAddress] = useState(session?.customer?.address || '');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('560034');
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectedText, setLocationDetectedText] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [branchDistances, setBranchDistances] = useState<Record<string, number>>({});

  // Prescription Upload & Auto-fill
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [prescriptionFileName, setPrescriptionFileName] = useState('');
  const [isAnalyzingPrescription, setIsAnalyzingPrescription] = useState(false);
  const [orderItems, setOrderItems] = useState<OnlineOrderItem[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState('');

  // Sync session changes
  useEffect(() => {
    if (session?.customer) {
      setCustomerName(session.customer.name);
      setCustomerPhone(session.customer.mobileNumber);
      if (session.customer.address && !address) {
        setAddress(session.customer.address);
      }
    }
  }, [session]);

  if (!isOpen) return null;

  const isLoggedIn = !!session && (session.role === 'customer' || session.role === 'owner');
  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const availableMedicines = getMedicines();

  // Detect GPS Location and auto-calculate closest branch
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingLocation(false);
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        setGeoCoords({ latitude: lat, longitude: lng });
        setLocationDetectedText(`GPS: ${lat}° N, ${lng}° E (Accuracy ~${Math.round(pos.coords.accuracy)}m)`);

        // Calculate distances to all branches & find closest
        const dists: Record<string, number> = {};
        let closestBranchId = branches[0]?.id;
        let minDistance = Infinity;

        branches.forEach(b => {
          const d = calculateDistanceKm(lat, lng, b.coordinates.latitude, b.coordinates.longitude);
          dists[b.id] = d;
          if (d < minDistance) {
            minDistance = d;
            closestBranchId = b.id;
          }
        });

        setBranchDistances(dists);
        if (closestBranchId) {
          setSelectedBranchId(closestBranchId);
        }

        if (!address) {
          setAddress(`Near ${lat}, ${lng} (Auto-detected via GPS)`);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        alert(`Could not fetch exact GPS: ${err.message}. Please select your preferred branch manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Prescription Image Upload & Auto-Fill Simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPrescriptionFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPrescriptionImage(result);
      analyzePrescription();
    };
    reader.readAsDataURL(file);
  };

  // Simulated AI Doctor Prescription OCR Engine
  const analyzePrescription = () => {
    setIsAnalyzingPrescription(true);
    setTimeout(() => {
      setIsAnalyzingPrescription(false);
      const matchedItems: OnlineOrderItem[] = [
        {
          medicineId: "med-01",
          medicineName: "Dolo 650",
          genericName: "Paracetamol 650mg",
          dosage: "650 mg (15 tabs)",
          quantity: 2,
          unitPrice: 34.50,
          rackInfo: "Rack A > Shelf 1 > Box-01"
        },
        {
          medicineId: "med-03",
          medicineName: "Pan 40",
          genericName: "Pantoprazole Gastro-resistant 40mg",
          dosage: "40 mg (15 tabs)",
          quantity: 1,
          unitPrice: 165.00,
          rackInfo: "Rack A > Shelf 3 > Box-08"
        },
        {
          medicineId: "med-04",
          medicineName: "Cetzine 10",
          genericName: "Cetirizine 10mg",
          dosage: "10 mg (10 tabs)",
          quantity: 1,
          unitPrice: 38.00,
          rackInfo: "Rack A > Shelf 2 > Box-06"
        }
      ];

      setOrderItems(matchedItems);
      if (!additionalNotes) {
        setAdditionalNotes("Doctor advised 1 tab Dolo SOS after food, Pan 40 before breakfast.");
      }
    }, 1200);
  };

  const handleManualAddMedicine = (medId: string) => {
    const med = availableMedicines.find(m => m.id === medId);
    if (!med) return;

    const existing = orderItems.find(i => i.medicineId === med.id);
    if (existing) {
      setOrderItems(orderItems.map(i => 
        i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setOrderItems([
        ...orderItems,
        {
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          dosage: med.dosage,
          quantity: 1,
          unitPrice: med.unitPrice,
          rackInfo: `${med.rackLocation.rackId} > Shelf ${med.rackLocation.shelfNumber} > ${med.rackLocation.boxNumber || 'Box'}`
        }
      ]);
    }
  };

  const handleRemoveItem = (medicineId: string) => {
    setOrderItems(orderItems.filter(i => i.medicineId !== medicineId));
  };

  const estimatedTotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit customer mobile number');
      return;
    }
    if (!address.trim()) {
      setError('Please enter delivery address');
      return;
    }
    if (orderItems.length === 0 && !prescriptionImage) {
      setError('Please upload doctor prescription or select medicines to order');
      return;
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: OnlineOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      pharmacyId: selectedBranch.id,
      pharmacyName: selectedBranch.name,
      customerName: customerName.trim() || `Customer ${cleanPhone.slice(-4)}`,
      customerMobile: cleanPhone,
      doorNumber: doorNumber.trim() || undefined,
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      pincode: pincode.trim() || undefined,
      geoCoordinates: geoCoords || undefined,
      prescriptionImageUrl: prescriptionImage || undefined,
      prescriptionFileName: prescriptionFileName || undefined,
      items: orderItems,
      estimatedTotal,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      notes: additionalNotes.trim() || undefined
    };

    await saveOnlineOrder(newOrder);
    onOrderSubmitted(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Order Medicines Online & Upload Rx</h3>
              <p className="text-xs text-emerald-100">Select your nearest pharmacy & upload doctor prescription</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Customer is NOT Logged In: Enforce Authentication Requirement */}
        {!isLoggedIn ? (
          <div className="p-8 text-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Customer Mobile Login Required
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                To order online medicines, upload doctor prescriptions, and receive live delivery tracking from your nearest pharmacy branch, please log in with your 10-digit mobile number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">📍 Nearest Branch</span>
                <span className="text-[11px] text-slate-500">Order dispatched to your local pharmacy for fast 30m delivery</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">🔒 Rx Privacy</span>
                <span className="text-[11px] text-slate-500">Your prescriptions and health history are strictly confidential</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">⏰ Dose Alerts</span>
                <span className="text-[11px] text-slate-500">Automated daily dose schedule linked to your mobile phone</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onRequireLogin) onRequireLogin();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Login with Mobile Number</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Modal Scrollable Form Body (When Logged In) */
          <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: SELECT NEAREST PHARMACY BRANCH */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Select Fulfilling Pharmacy Location</span>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold text-[11px] hover:bg-emerald-50 transition-colors shadow-2xs"
                >
                  <Compass className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Finding Nearest...' : 'Auto-Detect Nearest Store'}</span>
                </button>
              </div>

              {/* Branch Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {branches.map(b => {
                  const isSelected = b.id === selectedBranchId;
                  const dist = branchDistances[b.id];

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-left ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                          {b.name.replace('medEco Pharmacy - ', '')}
                        </span>
                        {isSelected && (
                          <span className="bg-emerald-600 text-white rounded-full p-0.5 shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {b.doorNumber}, {b.address}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {b.estimatedDeliveryTime}
                        </span>
                        {dist !== undefined ? (
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                            {dist} km away
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">PIN: {b.pincode}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Routing Guarantee Note */}
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Order will be dispatched exclusively to <strong>{selectedBranch.name}</strong> ({selectedBranch.doorNumber}, {selectedBranch.area}).
                </span>
              </div>
            </div>

            {/* STEP 2: CUSTOMER CONTACT & DELIVERY ADDRESS */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>2. Delivery Details (Door Number & Pincode)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Door / Flat Number and Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Door / Flat / House No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={doorNumber}
                    onChange={(e) => setDoorNumber(e.target.value)}
                    placeholder="e.g. Flat #402, 4th Flr"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opp Metro Station"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Postal Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 560034"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Complete Street Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address & Locality *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Sunshine Heights, 4th Cross Road, Koramangala"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Direct Location Map Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {locationDetectedText || 'Tip: Click Direct Location Map to verify pin'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{showMap ? 'Hide Map' : 'Direct Location Map ▾'}</span>
                </button>
              </div>

              {/* Embedded Google Map Viewer */}
              {showMap && (
                <div className="pt-2">
                  <GoogleMapViewer
                    latitude={geoCoords?.latitude || selectedBranch.coordinates.latitude}
                    longitude={geoCoords?.longitude || selectedBranch.coordinates.longitude}
                    doorNumber={doorNumber}
                    address={address || selectedBranch.address}
                    landmark={landmark}
                    pincode={pincode}
                    title="Delivery Pinpoint"
                  />
                </div>
              )}
            </div>

            {/* STEP 3: UPLOAD PRESCRIPTION & AUTO-FILL */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>3. Doctor Prescription (Upload Image)</span>
                </div>
                <span className="text-[10px] text-slate-400">JPG, PNG up to 10MB</span>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-4 text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {prescriptionImage ? (
                  <div className="flex items-center justify-center gap-3">
                    <img 
                      src={prescriptionImage} 
                      alt="Prescription Preview" 
                      className="w-14 h-14 object-cover rounded-xl border border-emerald-400 shadow-sm"
                    />
                    <div className="text-left">
                      <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Prescription Uploaded
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{prescriptionFileName}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Click to change image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Click to browse or take photo of Doctor Prescription
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Our system automatically scans the medicines and checks rack availability
                    </p>
                  </div>
                )}
              </div>

              {isAnalyzingPrescription && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-amber-800 dark:text-amber-300 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Scanning Doctor handwriting & matching shelf rack items...</span>
                </div>
              )}
            </div>

            {/* STEP 4: PRESCRIBED MEDICINES LIST (AUTO-FILLED) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>4. Medicines & Rack Coordinates</span>
                </div>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                  Est. Total: ₹{estimatedTotal.toFixed(2)}
                </span>
              </div>

              {/* Medicine items */}
              {orderItems.length > 0 ? (
                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{item.medicineName}</span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            {item.dosage}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Storage: <span className="font-bold text-slate-700 dark:text-slate-300">{item.rackInfo}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs">
                            ₹{(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Qty: {item.quantity}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.medicineId)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  Upload prescription above or add medicines manually from inventory below.
                </p>
              )}

              {/* Quick Add Tablet Dropdown */}
              <div className="flex items-center gap-2 pt-1">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleManualAddMedicine(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="">+ Add medicine manually from inventory...</option>
                  {availableMedicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.dosage}) - ₹{m.unitPrice.toFixed(2)} [{m.rackLocation.rackId}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Patient Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Doctor Instructions / Patient Special Note
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Please send delivery by 6 PM. Fragile packaging."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Place Order</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
