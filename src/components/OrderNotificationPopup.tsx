import React, { useState } from 'react';
import { 
  Bell, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  X, 
  FileText, 
  ExternalLink, 
  Layers, 
  Check, 
  AlertTriangle,
  Receipt,
  Eye,
  Camera,
  Navigation,
  Building2,
  PackageCheck,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { OnlineOrder, OrderStatus } from '../types';
import { advanceOrderStatus } from '../services/firebase';
import { GoogleMapViewer } from './GoogleMapViewer';

interface OrderNotificationPopupProps {
  order: OnlineOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onAcceptAndBill?: (order: OnlineOrder) => void;
}

export const OrderNotificationPopup: React.FC<OrderNotificationPopupProps> = ({
  order,
  isOpen,
  onClose,
  onAcceptAndBill
}) => {
  const [isZoomingRx, setIsZoomingRx] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleUpdateStatus = async (status: OrderStatus, label: string) => {
    await advanceOrderStatus(order.id, status);
    setNotificationStatus(`Status updated: ${label}`);
    setTimeout(() => {
      setNotificationStatus(null);
      if (status === 'DELIVERED' || status === 'CANCELLED') {
        onClose();
      }
    }, 1500);
  };

  const mapsUrl = order.geoCoordinates 
    ? `https://www.google.com/maps/search/?api=1&query=${order.geoCoordinates.latitude},${order.geoCoordinates.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Animated Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60"></span>
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Store Order Alert
                </span>
                <span className="font-mono text-xs text-emerald-200">
                  {order.orderNumber}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Online Medicine Order Received!
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assigned Branch Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Assigned Branch: <span className="underline">{order.pharmacyName || 'Hanamkonda Chowrasta'}</span></span>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
            Current Status: {order.status}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200">
          {notificationStatus && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notificationStatus}</span>
            </div>
          )}

          {/* Customer and Delivery Location */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {order.customerName}
                </span>
              </div>

              <a 
                href={`tel:${order.customerMobile}`}
                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>+91 {order.customerMobile}</span>
              </a>
            </div>

            {/* Delivery address details with door number & pincode */}
            <div className="space-y-1 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {order.doorNumber && (
                      <span className="font-extrabold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                        Door: {order.doorNumber}
                      </span>
                    )}
                    {order.pincode && (
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                        PIN: {order.pincode}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium text-xs mt-1">
                    {order.address}
                  </p>
                  {order.landmark && (
                    <p className="text-[11px] text-slate-500">
                      Landmark: <span className="font-semibold text-slate-600 dark:text-slate-400">{order.landmark}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Embedded Google Maps Pinpoint */}
              <div className="pt-2">
                <GoogleMapViewer
                  latitude={order.geoCoordinates?.latitude || 12.9352}
                  longitude={order.geoCoordinates?.longitude || 77.6245}
                  doorNumber={order.doorNumber}
                  address={order.address}
                  landmark={order.landmark}
                  pincode={order.pincode}
                  title="Customer Delivery Pinpoint"
                />
              </div>
            </div>
          </div>

          {/* Prescription Image & OCR Preview */}
          {order.prescriptionImageUrl && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Uploaded Doctor Prescription
                </span>
                <button
                  onClick={() => setIsZoomingRx(true)}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold text-[11px]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Click to Zoom</span>
                </button>
              </div>

              <div 
                onClick={() => setIsZoomingRx(true)}
                className="cursor-zoom-in relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 group bg-black/5"
              >
                <img
                  src={order.prescriptionImageUrl}
                  alt="Doctor Prescription"
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1">
                  <Eye className="w-5 h-5" />
                  <span>Inspect Full Prescription</span>
                </div>
              </div>
            </div>
          )}

          {/* Prescribed Items & Rack Retrieval Coordinates */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Medicine Storage Locations (Rack Coordinates)</span>
            </h4>

            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{item.medicineName}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 rounded font-mono">
                        {item.dosage}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-600" />
                      <span>{item.rackInfo}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs text-slate-900 dark:text-white">
                      Qty: {item.quantity}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
              <span>Estimated Order Total:</span>
              <span className="text-emerald-700 dark:text-emerald-400 text-sm font-black">
                ₹{order.estimatedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-300 text-[11px]">
              <strong>Patient Note:</strong> "{order.notes}"
            </div>
          )}
        </div>

        {/* Standard Online Pharmacy SOP Action Buttons */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => handleUpdateStatus('CANCELLED', 'Cancelled')}
            className="px-3 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl font-bold text-xs"
          >
            Reject / Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Step 1: Verify */}
            {order.status === 'PENDING' && (
              <button
                onClick={() => handleUpdateStatus('VERIFIED', 'Verified by Pharmacist')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Rx</span>
              </button>
            )}

            {/* Step 2: Pack from Rack */}
            {(order.status === 'PENDING' || order.status === 'VERIFIED') && (
              <button
                onClick={() => handleUpdateStatus('PACKED', 'Packed from Racks')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Pack from Rack</span>
              </button>
            )}

            {/* Step 3: Load to POS & Bill */}
            {onAcceptAndBill && (
              <button
                onClick={() => {
                  handleUpdateStatus('PACKED', 'Loaded to POS');
                  onAcceptAndBill(order);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bill in POS</span>
              </button>
            )}

            {/* Step 4: Dispatch Delivery */}
            {order.status === 'PACKED' && (
              <button
                onClick={() => handleUpdateStatus('OUT_FOR_DELIVERY', 'Dispatched for Delivery')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Dispatch Runner</span>
              </button>
            )}

            {/* Step 5: Delivered */}
            {order.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => handleUpdateStatus('DELIVERED', 'Delivered to Patient')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Delivered</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Full Zoom Overlay */}
      {isZoomingRx && order.prescriptionImageUrl && (
        <div 
          onClick={() => setIsZoomingRx(false)}
          className="fixed inset-0 z-60 bg-black/90 p-4 flex items-center justify-center cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={order.prescriptionImageUrl}
              alt="Prescription Large"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setIsZoomingRx(false)}
              className="absolute top-3 right-3 text-white bg-black/60 p-2 rounded-full hover:bg-black"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
