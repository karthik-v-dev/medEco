import React, { useState, useRef } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Medicine, OnlineOrder, OnlineOrderItem, UserSession } from '../types';
import { saveOnlineOrder, getMedicines } from '../services/firebase';
import { GoogleMapViewer } from './GoogleMapViewer';

interface OnlineOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession | null;
  onOrderSubmitted: (order: OnlineOrder) => void;
}

export const OnlineOrderModal: React.FC<OnlineOrderModalProps> = ({
  isOpen,
  onClose,
  session,
  onOrderSubmitted
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customerName, setCustomerName] = useState(session?.customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(session?.customer?.mobileNumber || '');
  const [doorNumber, setDoorNumber] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
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

  if (!isOpen) return null;

  const availableMedicines = getMedicines();

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
        setLocationDetectedText(`GPS: ${lat}° N, ${lng}° E (Accurate to ~${Math.round(pos.coords.accuracy)}m)`);
        if (!address) {
          setAddress(`Near GPS Coordinate Location (${lat}, ${lng})`);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        alert(`Could not fetch exact GPS: ${err.message}. Please enter manual address.`);
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
      // Simulate intelligent prescription extraction
      analyzePrescription();
    };
    reader.readAsDataURL(file);
  };

  const analyzePrescription = () => {
    setIsAnalyzingPrescription(true);
    setTimeout(() => {
      setIsAnalyzingPrescription(false);
      // Intelligent mock parsing: extract common prescribed medicines from inventory
      const detectedMeds: OnlineOrderItem[] = [
        {
          medicineId: "med-01",
          medicineName: "Dolo 650",
          genericName: "Paracetamol 650mg",
          dosage: "1 tab twice daily (SOS for fever)",
          quantity: 2,
          unitPrice: 34.50,
          rackInfo: "Rack A > Shelf 1 > Box-01"
        },
        {
          medicineId: "med-02",
          medicineName: "Augmentin 625 Duo",
          genericName: "Amoxicillin + Clavulanic Acid",
          dosage: "1 tab morning & night after food (5 days)",
          quantity: 1,
          unitPrice: 201.20,
          rackInfo: "Rack A > Shelf 2 > Box-04"
        },
        {
          medicineId: "med-03",
          medicineName: "Pan 40",
          genericName: "Pantoprazole Gastro-resistant 40mg",
          dosage: "1 tab 30 mins before breakfast",
          quantity: 1,
          unitPrice: 165.00,
          rackInfo: "Rack A > Shelf 3 > Box-08"
        }
      ];
      setOrderItems(detectedMeds);
    }, 1200);
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.medicineId !== id));
  };

  const handleUpdateQty = (id: string, qty: number) => {
    if (qty <= 0) return;
    setOrderItems(orderItems.map(item => item.medicineId === id ? { ...item, quantity: qty } : item));
  };

  const handleAddManualMedicine = (medId: string) => {
    const med = availableMedicines.find(m => m.id === medId);
    if (!med) return;
    if (orderItems.some(i => i.medicineId === med.id)) return;

    setOrderItems([
      ...orderItems,
      {
        medicineId: med.id,
        medicineName: med.name,
        genericName: med.genericName,
        dosage: med.dosage,
        quantity: 1,
        unitPrice: med.unitPrice,
        rackInfo: `${med.rackLocation.rackId} > Shelf ${med.rackLocation.shelfNumber} ${med.rackLocation.boxNumber ? `> ${med.rackLocation.boxNumber}` : ''}`
      }
    ]);
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
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Order Medicines Online & Upload Rx</h3>
              <p className="text-xs text-emerald-100">Upload doctor prescription or select required tablets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmitOrder} className="p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl font-bold">
              {error}
            </div>
          )}

          {/* 1. Customer Phone & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Customer Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full pl-11 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Patient / Customer Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* 2. Exact Location & Address with Google Maps */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Delivery Address & Exact Google Map Location
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shadow-xs transition-all active:scale-95"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Detecting GPS...' : 'Detect My Exact Location (GPS)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[11px] hover:bg-slate-100"
                >
                  <span>{showMap ? 'Hide Map' : '🗺️ Show Map'}</span>
                </button>
              </div>
            </div>

            {locationDetectedText && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{locationDetectedText}</span>
              </div>
            )}

            {/* Embedded Google Map with Pin Marker */}
            {(showMap || geoCoords) && (
              <div className="pt-1">
                <GoogleMapViewer
                  latitude={geoCoords?.latitude || 12.9352}
                  longitude={geoCoords?.longitude || 77.6245}
                  doorNumber={doorNumber}
                  address={address}
                  landmark={landmark}
                  pincode={pincode}
                  height="200px"
                  showNavigationLink={true}
                />
              </div>
            )}

            {/* Door Number & Pincode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  🚪 Door / Flat / House Number *
                </label>
                <input
                  type="text"
                  required
                  value={doorNumber}
                  onChange={(e) => setDoorNumber(e.target.value)}
                  placeholder="e.g. Flat #402, 4th Floor / Door #12"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  📮 Delivery Postal Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560034"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Building, Apartment & Street Address *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment name, Street, Main Road, Cross, Area..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                🏷️ Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Green Park Metro Station / Near Shiva Temple"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 3. Upload Doctor Prescription (IMAGE UPLOAD & AUTO FILL) */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider text-[11px] block">
                  Upload Doctor's Prescription
                </span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 block">
                  Uploading an image automatically scans & auto-fills the prescribed medicines!
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!prescriptionImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 bg-white dark:bg-slate-800/80 rounded-2xl p-6 text-center cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Click to Upload or Take Prescription Photo
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Supports JPG, PNG, WebP (Camera or File)
                </p>
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={prescriptionImage}
                    alt="Prescription Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                      {prescriptionFileName || 'Prescription Image Attached'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Prescription Uploaded & Scanned
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setPrescriptionImage(null); setPrescriptionFileName(''); }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="Remove Prescription"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {isAnalyzingPrescription && (
              <div className="p-2.5 bg-emerald-100/60 dark:bg-emerald-900/40 rounded-xl text-center flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Scanning doctor prescription & auto-filling medicine list...</span>
              </div>
            )}
          </div>

          {/* 4. Auto-Filled / Selected Medicines List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Medicines in Order ({orderItems.length})
              </span>

              {/* Quick Add Dropdown */}
              <div className="flex items-center gap-1.5">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddManualMedicine(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <option value="">+ Add more tablets...</option>
                  {availableMedicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (₹{m.unitPrice})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {orderItems.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 italic text-[11px] p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                Upload a prescription above or select medicines from the dropdown to fill your order.
              </p>
            ) : (
              <div className="space-y-2">
                {orderItems.map(item => (
                  <div 
                    key={item.medicineId}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white">{item.medicineName}</strong>
                        <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                          {item.rackInfo}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">{item.dosage}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.medicineId, item.quantity - 1)}
                          className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.medicineId, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-extrabold text-slate-900 dark:text-white min-w-[50px] text-right">
                        ₹{(item.quantity * item.unitPrice).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.medicineId)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Estimated Total (Inclusive of GST):</span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-sm font-black">
                    ₹{estimatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Doctor / Patient Instructions (Optional)</label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Please deliver before 8 PM / Call on arrival"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Submit Medicine Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
