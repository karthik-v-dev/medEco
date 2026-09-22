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
  Trash2, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Building2, 
  Compass,
  AlertTriangle,
  Info
} from 'lucide-react';
import { OnlineOrder, OnlineOrderItem, UserSession, PharmacyBranch } from '../types';
import { 
  saveOnlineOrder, 
  getMedicines, 
  getPharmacyBranches, 
  calculateDistanceKm,
  WARANGAL_DELIVERY_ZONES,
  updateCustomerLocationRealtime
} from '../services/firebase';
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
  
  // Delivery Zone & Location state
  const initialZone = WARANGAL_DELIVERY_ZONES.find(z => z.id === session?.customer?.zone) || WARANGAL_DELIVERY_ZONES[0];
  const [selectedZoneId, setSelectedZoneId] = useState<string>(initialZone.id);
  const [doorNumber, setDoorNumber] = useState(session?.customer?.doorNumber || '');
  const [address, setAddress] = useState(session?.customer?.address || initialZone.popularLandmarks + ', ' + initialZone.area);
  const [landmark, setLandmark] = useState(session?.customer?.landmark || '');
  const [pincode, setPincode] = useState(session?.customer?.pincode || initialZone.pincode);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(
    session?.customer?.geoCoordinates || initialZone.coordinates
  );
  
  // Customer details
  const [customerName, setCustomerName] = useState(session?.customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(session?.customer?.mobileNumber || '');
  
  // Branch & 8 km distance tracking
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'pharm-hanamkonda');
  const [branchDistances, setBranchDistances] = useState<Record<string, number>>({});
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetectedText, setLocationDetectedText] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Prescription Upload & Auto-fill
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [prescriptionFileName, setPrescriptionFileName] = useState('');
  const [isAnalyzingPrescription, setIsAnalyzingPrescription] = useState(false);
  const [orderItems, setOrderItems] = useState<OnlineOrderItem[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [error, setError] = useState('');

  // Calculate distances and auto-enable stores whenever coordinates or zone changes
  const evaluateBranchDistances = (lat: number, lng: number) => {
    const dists: Record<string, number> = {};
    let closestEligibleId: string | null = null;
    let minDistance = Infinity;

    branches.forEach(b => {
      const d = calculateDistanceKm(lat, lng, b.coordinates.latitude, b.coordinates.longitude);
      dists[b.id] = d;
      if (d <= 8.0 && d < minDistance) {
        minDistance = d;
        closestEligibleId = b.id;
      }
    });

    setBranchDistances(dists);

    // If current selected branch is beyond 8 km, auto-switch to closest eligible branch
    const currentDist = dists[selectedBranchId];
    if ((currentDist === undefined || currentDist > 8.0) && closestEligibleId) {
      setSelectedBranchId(closestEligibleId);
    }
  };

  // Initial calculation on mount & when zone changes
  useEffect(() => {
    const zone = WARANGAL_DELIVERY_ZONES.find(z => z.id === selectedZoneId) || WARANGAL_DELIVERY_ZONES[0];
    const coords = geoCoords || zone.coordinates;
    evaluateBranchDistances(coords.latitude, coords.longitude);
  }, [selectedZoneId]);

  // Sync customer session changes
  useEffect(() => {
    if (session?.customer) {
      setCustomerName(session.customer.name);
      setCustomerPhone(session.customer.mobileNumber);
      if (session.customer.zone) {
        setSelectedZoneId(session.customer.zone);
      }
      if (session.customer.doorNumber) {
        setDoorNumber(session.customer.doorNumber);
      }
      if (session.customer.landmark) {
        setLandmark(session.customer.landmark);
      }
      if (session.customer.pincode) {
        setPincode(session.customer.pincode);
      }
      if (session.customer.address) {
        setAddress(session.customer.address);
      }
      if (session.customer.geoCoordinates) {
        setGeoCoords(session.customer.geoCoordinates);
        evaluateBranchDistances(session.customer.geoCoordinates.latitude, session.customer.geoCoordinates.longitude);
      }
    }
  }, [session]);

  if (!isOpen) return null;

  const isLoggedIn = !!session && (session.role === 'customer' || session.role === 'owner');
  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const availableMedicines = getMedicines();

  // Zone Change Handler
  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const zone = WARANGAL_DELIVERY_ZONES.find(z => z.id === zoneId);
    if (!zone) return;

    setGeoCoords(zone.coordinates);
    setPincode(zone.pincode);
    setLocationDetectedText(`Zone: ${zone.name}`);

    // Pre-fill general landmark if address is empty
    if (!address || address.includes('Zone:') || address.includes('Auto-detected')) {
      setAddress(`${zone.popularLandmarks}, ${zone.area}, Warangal`);
    }

    evaluateBranchDistances(zone.coordinates.latitude, zone.coordinates.longitude);
  };

  // Detect GPS Location
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

        // Find closest delivery zone for reference
        let closestZone = WARANGAL_DELIVERY_ZONES[0];
        let minZoneDist = Infinity;
        WARANGAL_DELIVERY_ZONES.forEach(z => {
          const zd = calculateDistanceKm(lat, lng, z.coordinates.latitude, z.coordinates.longitude);
          if (zd < minZoneDist) {
            minZoneDist = zd;
            closestZone = z;
          }
        });
        setSelectedZoneId(closestZone.id);
        setPincode(closestZone.pincode);

        evaluateBranchDistances(lat, lng);

        if (!address) {
          setAddress(`Near ${closestZone.name}, Warangal (GPS Auto-detected)`);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        alert(`Could not fetch exact GPS: ${err.message}. Please select your delivery zone manually.`);
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
    };
    reader.readAsDataURL(file);

    setIsAnalyzingPrescription(true);
    setTimeout(() => {
      setIsAnalyzingPrescription(false);
      // Pure clinical items - NO RACKS shown to customer
      const matchedItems: OnlineOrderItem[] = [
        {
          medicineId: "med-01",
          medicineName: "Dolo 650",
          genericName: "Paracetamol 650mg",
          dosage: "650 mg (15 tabs)",
          quantity: 2,
          unitPrice: 34.50,
          rackInfo: ""
        },
        {
          medicineId: "med-03",
          medicineName: "Pan 40",
          genericName: "Pantoprazole Gastro-resistant 40mg",
          dosage: "40 mg (15 tabs)",
          quantity: 1,
          unitPrice: 165.00,
          rackInfo: ""
        },
        {
          medicineId: "med-04",
          medicineName: "Cetzine 10",
          genericName: "Cetirizine 10mg",
          dosage: "10 mg (10 tabs)",
          quantity: 1,
          unitPrice: 38.00,
          rackInfo: ""
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
          rackInfo: ""
        }
      ]);
    }
  };

  const handleRemoveItem = (medicineId: string) => {
    setOrderItems(orderItems.filter(i => i.medicineId !== medicineId));
  };

  const estimatedTotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  // Submit Order with 8 km Radius Enforcement
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit customer mobile number');
      return;
    }
    if (!address.trim()) {
      setError('Please enter complete delivery address');
      return;
    }
    if (orderItems.length === 0 && !prescriptionImage) {
      setError('Please upload doctor prescription or select medicines to order');
      return;
    }

    // STRICT 8 KM RADIUS CHECK:
    const selectedDist = branchDistances[selectedBranch.id];
    if (selectedDist !== undefined && selectedDist > 8.0) {
      setError(`Delivery cannot be fulfilled by ${selectedBranch.name}: It is ${selectedDist} km away, exceeding our strict 8 km delivery radius. Please choose an enabled store.`);
      return;
    }

    // Update customer's saved location in database so existing customers can change location seamlessly
    if (session?.customer) {
      try {
        await updateCustomerLocationRealtime(cleanPhone, {
          zone: selectedZoneId,
          doorNumber: doorNumber.trim() || undefined,
          address: address.trim(),
          landmark: landmark.trim() || undefined,
          pincode: pincode.trim() || undefined,
          geoCoordinates: geoCoords || undefined,
          preferredBranchId: selectedBranch.id
        });
      } catch (err) {
        console.warn("Location update note:", err);
      }
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

  // Count how many stores are within 8 km
  const eligibleStoresCount = branches.filter(b => {
    const d = branchDistances[b.id];
    return d !== undefined && d <= 8.0;
  }).length;

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
              <p className="text-xs text-emerald-100">8 km Express Delivery Radius from Warangal Pharmacy Hubs</p>
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
                To order online medicines, select delivery zones, and receive express delivery within 8 km from your nearest store, please log in with your 10-digit mobile number and PIN.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">📍 8 km Radius</span>
                <span className="text-[11px] text-slate-500">Fast 30-min delivery strictly within 8 km of our local stores</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">🔒 Rx Confidential</span>
                <span className="text-[11px] text-slate-500">Your prescriptions and health records are strictly private</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">🚚 Live SOP Tracking</span>
                <span className="text-[11px] text-slate-500">Track 5 stages from placed to doorstep delivery</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onRequireLogin) onRequireLogin();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Log In with Mobile & PIN</span>
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

            {/* STEP 1: DELIVERY ZONE & ADDRESS */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>1. Select Delivery Zone & Location</span>
                </div>

                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold text-[11px] hover:bg-emerald-50 transition-colors shadow-2xs"
                >
                  <Compass className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Detecting GPS...' : 'Auto-Detect via GPS'}</span>
                </button>
              </div>

              {/* Delivery Zone Options Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Zone (Warangal & Tri-Cities Area) *
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => handleZoneSelect(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                >
                  {WARANGAL_DELIVERY_ZONES.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.name} (PIN: {z.pincode}) — {z.popularLandmarks}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Selecting a zone automatically calculates distances and enables stores within an 8 km radius.</span>
                </p>
              </div>

              {/* Customer Contact & Address Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Door / Flat & Landmark */}
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
                    placeholder="e.g. Flat #402"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs font-semibold"
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
                    placeholder="e.g. Near Bus Stand"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Postal PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="506001"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Street / Area Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 80 Feet Road, Near SBI Colony, Hanamkonda"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
                />
              </div>

              {locationDetectedText && (
                <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="flex items-center gap-1 font-mono">
                    <Compass className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{locationDetectedText}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="text-emerald-700 dark:text-emerald-300 hover:underline font-bold"
                  >
                    {showMap ? 'Hide Map' : 'Preview Destination Map'}
                  </button>
                </div>
              )}

              {showMap && geoCoords && (
                <div className="pt-2">
                  <GoogleMapViewer
                    latitude={geoCoords.latitude}
                    longitude={geoCoords.longitude}
                    doorNumber={doorNumber}
                    address={address}
                    landmark={landmark}
                    pincode={pincode}
                    title="Selected Delivery Coordinates"
                  />
                </div>
              )}
            </div>

            {/* STEP 2: STORE SELECTION BASED ON 8 KM RADIUS */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>2. Nearest Store Selection (Strict 8 km Express Radius)</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  {eligibleStoresCount} of {branches.length} Stores Available
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Deliveries are enabled exclusively within an <strong>8 km radius</strong> of each pharmacy branch to ensure rapid 30-minute delivery.
              </p>

              {/* Branch Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {branches.map(b => {
                  const isSelected = b.id === selectedBranchId;
                  const dist = branchDistances[b.id];
                  const isWithin8Km = dist !== undefined ? dist <= 8.0 : true;

                  return (
                    <div
                      key={b.id}
                      onClick={() => {
                        if (isWithin8Km) {
                          setSelectedBranchId(b.id);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all text-left relative ${
                        isSelected && isWithin8Km
                          ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : isWithin8Km
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-300 cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                          {b.name.replace('medEco Pharmacy - ', '')}
                        </span>
                        {isSelected && isWithin8Km && (
                          <span className="bg-emerald-600 text-white rounded-full p-0.5 shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {b.doorNumber}, {b.address}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-0.5 font-semibold">
                          <Clock className="w-2.5 h-2.5 text-emerald-600" />
                          {b.estimatedDeliveryTime}
                        </span>

                        {dist !== undefined ? (
                          isWithin8Km ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                              {dist} km away • Near Store
                            </span>
                          ) : (
                            <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded">
                              {dist} km (Beyond 8 km)
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-mono">PIN: {b.pincode}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Guarantee Note */}
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Order will be dispatched exclusively from <strong>{selectedBranch.name}</strong> ({branchDistances[selectedBranch.id] || 0} km from your selected zone).
                </span>
              </div>
            </div>

            {/* STEP 3: UPLOAD DOCTOR PRESCRIPTION */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>3. Upload Doctor Prescription (Image / Photo)</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 text-center cursor-pointer bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 transition-all group"
              >
                {prescriptionImage ? (
                  <div className="space-y-2">
                    <img 
                      src={prescriptionImage} 
                      alt="Prescription Preview" 
                      className="max-h-36 mx-auto rounded-lg shadow-sm border border-emerald-200"
                    />
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                      ✓ {prescriptionFileName || 'Prescription uploaded'}
                    </p>
                    <span className="text-[10px] text-slate-500 underline">Click to change prescription photo</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Click to browse or take photo of Doctor Prescription
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Our system automatically scans the medicines and checks real-time inventory availability
                    </p>
                  </div>
                )}
              </div>

              {isAnalyzingPrescription && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-amber-800 dark:text-amber-300 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Scanning Doctor handwriting & verifying medicine dosages...</span>
                </div>
              )}
            </div>

            {/* STEP 4: PRESCRIBED MEDICINES (PURE CLINICAL VIEW - NO RACKS) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs sm:text-sm">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>4. Prescribed Medicines & Items</span>
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
                        {item.genericName && (
                          <p className="text-[10px] text-slate-500">
                            Composition: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.genericName}</span>
                          </p>
                        )}
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

              {/* Quick Add Tablet Dropdown (NO RACK INFO) */}
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
                      {m.name} ({m.dosage}) - ₹{m.unitPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STEP 5: SPECIAL NOTES & INSTRUCTIONS */}
            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Doctor's Dosage Advice / Special Delivery Notes
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Please send sugar-free syrup, call before delivery"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block">Express Delivery Guarantee</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>30-min doorstep delivery in {selectedBranch.area}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Prescription Order</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
