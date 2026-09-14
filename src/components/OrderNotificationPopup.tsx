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
  Navigation
} from 'lucide-react';
import { OnlineOrder } from '../types';
import { updateOrderStatus } from '../services/firebase';
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
  const [accepted, setAccepted] = useState(false);

  if (!isOpen || !order) return null;

  const handleAccept = async () => {
    await updateOrderStatus(order.id, 'ACCEPTED');
    setAccepted(true);
    setTimeout(() => {
      setAccepted(false);
      onClose();
    }, 1200);
  };

  const handleReject = async () => {
    if (confirm("Are you sure you want to reject this online order?")) {
      await updateOrderStatus(order.id, 'REJECTED');
      onClose();
    }
  };

  const mapsUrl = order.geoCoordinates 
    ? `https://www.google.com/maps/search/?api=1&query=${order.geoCoordinates.latitude},${order.geoCoordinates.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Animated Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60"></span>
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  New Order Alert
                </span>
                <span className="font-mono text-xs text-emerald-200">
                  {order.orderNumber}
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-white">Online Medicine Order Received!</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 dark:text-slate-200">
          {accepted && (
            <div className="p-4 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Order Accepted Successfully! Customer notified.</span>
            </div>
          )}

          {/* Customer Contact & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Customer Details
              </span>
              <strong className="text-sm text-slate-900 dark:text-white block">
                {order.customerName}
              </strong>
              <a
                href={`tel:+91${order.customerMobile}`}
                className="inline-flex items-center gap-1.5 font-mono text-emerald-700 dark:text-emerald-400 font-bold text-xs mt-1 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>+91 {order.customerMobile}</span>
              </a>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Order Placed At
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
              <span className="block mt-1 font-bold text-amber-700 dark:text-amber-400">
                Status: {order.status}
              </span>
            </div>
          </div>

          {/* Exact Location, Door Number, Pincode & Google Maps */}
          <div>
            <GoogleMapViewer
              latitude={order.geoCoordinates?.latitude || 12.9352}
              longitude={order.geoCoordinates?.longitude || 77.6245}
              doorNumber={order.doorNumber}
              address={order.address}
              landmark={order.landmark}
              pincode={order.pincode}
              height="200px"
              showNavigationLink={true}
            />
          </div>

          {/* Doctor Prescription Attached */}
          {order.prescriptionImageUrl && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  Uploaded Doctor's Prescription
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomingRx(true)}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect Full Image</span>
                </button>
              </div>

              <div 
                onClick={() => setIsZoomingRx(true)}
                className="cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-40 relative group"
              >
                <img
                  src={order.prescriptionImageUrl}
                  alt="Doctor Prescription"
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity">
                  Click to Zoom Prescription
                </div>
              </div>
            </div>
          )}

          {/* Prescribed / Required Medicines with Exact Storage Racks */}
          <div className="space-y-2">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
              Required Tablets & Medicines ({order.items.length} items) - Rack Picking Locations:
            </span>

            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-xs">{item.medicineName}</strong>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                        {item.rackInfo}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">{item.dosage}</span>
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
              <span>Estimated Order Value:</span>
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

        {/* Modal Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleReject}
            className="w-full sm:w-auto px-4 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl font-bold text-xs"
          >
            Reject Order
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Accept Order</span>
            </button>

            {onAcceptAndBill && (
              <button
                onClick={() => {
                  handleAccept();
                  onAcceptAndBill(order);
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Accept & Load to POS</span>
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
