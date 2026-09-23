import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  Smartphone, 
  RefreshCw, 
  Unlink, 
  Send,
  MessageCircle,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getWhatsAppGatewayStatus } from '../services/whatsappService';
import { getCachedOwnerMobile } from '../services/firebase';
import { toast } from '../services/toast';

interface WhatsAppGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppGatewayModal: React.FC<WhatsAppGatewayModalProps> = ({
  isOpen,
  onClose
}) => {
  const [status, setStatus] = useState<string>('CHECKING');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [testMobile, setTestMobile] = useState<string>('8331838661');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);

  const ownerPhone = getCachedOwnerMobile();

  const fetchStatus = async () => {
    try {
      const data = await getWhatsAppGatewayStatus();
      setStatus(data.status || 'DISCONNECTED');
      if (data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
      } else if (data.status === 'CONNECTED') {
        setQrDataUrl(null);
      }
    } catch {
      setStatus('DISCONNECTED');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to unlink the current WhatsApp account?')) return;
    setIsUnlinking(true);
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      toast.info('Owner WhatsApp unlinked. New QR will generate.');
      await fetchStatus();
    } catch {
      toast.error('Failed to unlink.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSendTestMessage = async () => {
    const clean = testMobile.replace(/\D/g, '');
    if (clean.length < 10) {
      toast.error('Please enter a valid 10-digit number');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: clean,
          message: `👋 *medEco Pharmacy Test*\n━━━━━━━━━━━━━━━━━━━━\nYour Store Owner WhatsApp gateway (+91 ${ownerPhone}) is active and connected!\nLive order updates will be sent automatically.`,
          orderId: 'test'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`🎉 Test message sent directly to +91 ${clean}!`);
      } else {
        toast.error(data.error || 'Failed to send test message');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error communicating with server');
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shadow-inner">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">WhatsApp Backend Gateway</h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Store Owner Number: +91 {ownerPhone}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                {status === 'CONNECTED' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </>
                )}
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {status === 'CONNECTED' ? 'Owner WhatsApp Connected' : 'Waiting for Device Link'}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {status === 'CONNECTED' 
                    ? 'Orders are automatically sent to customer phones via backend'
                    : 'Scan the QR code once to link the Store Owner WhatsApp'}
                </p>
              </div>
            </div>

            <button 
              onClick={fetchStatus}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Conditional Display: Connected vs QR Scan */}
          {status === 'CONNECTED' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                  Live Dispatch Active!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  All medEco online orders placed by customers will automatically be transmitted from 
                  <strong> +91 {ownerPhone}</strong> directly to the customer's WhatsApp inbox.
                </p>
              </div>

              {/* Quick Test Message Dispatcher */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Send a Test WhatsApp Message:
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                    <input 
                      type="tel"
                      value={testMobile}
                      onChange={e => setTestMobile(e.target.value)}
                      placeholder="8331838661"
                      className="w-full pl-10 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold"
                    />
                  </div>
                  <button
                    onClick={handleSendTestMessage}
                    disabled={isSendingTest}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingTest ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleDisconnect}
                  disabled={isUnlinking}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Unlink Owner WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                {/* QR Code Container */}
                <div className="w-48 h-48 bg-white p-2.5 rounded-2xl shadow-md border border-slate-200 shrink-0 flex items-center justify-center">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="WhatsApp QR Code" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-400 space-y-1">
                      <QrCode className="w-8 h-8 mx-auto animate-pulse" />
                      <p className="text-[10px] font-bold">Generating QR Code...</p>
                    </div>
                  )}
                </div>

                {/* Step Instructions */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>How to Link in 10 Seconds:</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    <li>Open WhatsApp on Owner's phone (<strong>+91 {ownerPhone}</strong>).</li>
                    <li>Tap the <strong>three dots</strong> (Android) or <strong>Settings</strong> (iPhone).</li>
                    <li>Select <strong>Linked Devices</strong>.</li>
                    <li>Tap <strong>Link a Device</strong> and point your camera at this QR code.</li>
                  </ol>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/50 p-2 rounded-xl mt-1">
                    💡 This is a one-time link. After scanning, all future messages send automatically without prompt!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
