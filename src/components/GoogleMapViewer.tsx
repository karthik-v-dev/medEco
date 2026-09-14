import React from 'react';
import { 
  MapPin, 
  ExternalLink, 
  Navigation, 
  Home, 
  Compass, 
  CheckCircle2 
} from 'lucide-react';

interface GoogleMapViewerProps {
  latitude: number;
  longitude: number;
  doorNumber?: string;
  address?: string;
  landmark?: string;
  pincode?: string;
  height?: string;
  showNavigationLink?: boolean;
}

export const GoogleMapViewer: React.FC<GoogleMapViewerProps> = ({
  latitude,
  longitude,
  doorNumber,
  address,
  landmark,
  pincode,
  height = '240px',
  showNavigationLink = true
}) => {
  // Free, high-reliability Google Maps embed with pinpoint query marker
  const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=16&output=embed`;
  const directMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-xs space-y-3 p-3">
      {/* Map Header with coordinates and navigation button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
            Pointed Location on Google Maps
          </span>
          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-bold">
            {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
          </span>
        </div>

        {showNavigationLink && (
          <div className="flex items-center gap-2">
            <a
              href={directMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <span>View Map</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={navigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors"
            >
              <Navigation className="w-3 h-3" />
              <span>Navigate (Directions)</span>
            </a>
          </div>
        )}
      </div>

      {/* Embedded Google Maps Viewport with Live Pin */}
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-900" style={{ height }}>
        <iframe
          title="Google Map Pinpoint Location"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={embedUrl}
          className="w-full h-full filter saturate-110"
          loading="lazy"
        />

        {/* Floating Pin Card Indicator */}
        <div className="absolute top-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md flex items-center gap-1.5 text-[10px] font-bold text-slate-800 dark:text-slate-200 pointer-events-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          <span>Customer Delivery Pin</span>
        </div>
      </div>

      {/* Pointed Location Details: Door Number, Street, Landmark, Pincode */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        {doorNumber && (
          <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              🚪 Door / Flat No.
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate block">
              {doorNumber}
            </span>
          </div>
        )}

        {pincode && (
          <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              📮 Postal Pincode
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block">
              {pincode}
            </span>
          </div>
        )}

        {landmark && (
          <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              🏷️ Landmark
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {landmark}
            </span>
          </div>
        )}
      </div>

      {address && (
        <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-[11px] text-slate-700 dark:text-slate-300">
          <strong className="text-emerald-950 dark:text-emerald-200 block mb-0.5">Exact Address for Delivery:</strong>
          <span>{doorNumber ? `${doorNumber}, ` : ''}{address}{pincode ? ` - ${pincode}` : ''}</span>
        </div>
      )}
    </div>
  );
};
