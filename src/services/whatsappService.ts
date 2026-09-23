/**
 * medEco Automated WhatsApp Backend Dispatch Service
 * 
 * Supports:
 * 1. Meta WhatsApp Business Cloud API (Facebook Graph API)
 * 2. Twilio WhatsApp API
 * 3. Custom Webhook Gateway (Node.js/Express/AWS Lambda proxy)
 * 4. Automatic Outbox queue & Firebase realtime sync with simulated local dispatch
 */

import { OnlineOrder, PharmacyBranch } from '../types';
import { database, getCachedOwnerMobile } from './firebase';
import { ref, push, set } from 'firebase/database';

export interface WhatsAppConfig {
  provider: 'ultramsg' | 'greenapi' | 'webhook' | 'meta' | 'twilio' | 'backend_server';
  ultraMsgInstanceId?: string;
  ultraMsgToken?: string;
  greenApiIdInstance?: string;
  greenApiApiToken?: string;
  webhookUrl?: string;
  webhookToken?: string;
  metaCloudToken?: string;
  metaPhoneNumberId?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
}

export interface WhatsAppDispatchResult {
  success: boolean;
  provider: string;
  messageId?: string;
  recipient: string;
  error?: string;
}

export const getWhatsAppConfig = (): WhatsAppConfig => {
  let localSettings: any = null;
  try {
    const raw = localStorage.getItem('medeco_wa_gateway');
    if (raw) localSettings = JSON.parse(raw);
  } catch {}

  const env = (import.meta as any).env || {};

  // 1. UltraMsg (Recommended Third-Party Gateway)
  const ultraMsgInstanceId = localSettings?.ultraMsgInstanceId || env.VITE_ULTRAMSG_INSTANCE_ID;
  const ultraMsgToken = localSettings?.ultraMsgToken || env.VITE_ULTRAMSG_TOKEN;
  if (ultraMsgInstanceId && ultraMsgToken) {
    return { provider: 'ultramsg', ultraMsgInstanceId, ultraMsgToken };
  }

  // 2. Green API (Alternative Third-Party Gateway)
  const greenApiIdInstance = localSettings?.greenApiIdInstance || env.VITE_GREENAPI_ID_INSTANCE;
  const greenApiApiToken = localSettings?.greenApiApiToken || env.VITE_GREENAPI_API_TOKEN;
  if (greenApiIdInstance && greenApiApiToken) {
    return { provider: 'greenapi', greenApiIdInstance, greenApiApiToken };
  }

  // 3. Custom Webhook / WPPConnect
  const webhookUrl = localSettings?.webhookUrl || env.VITE_WHATSAPP_WEBHOOK_URL;
  const webhookToken = localSettings?.webhookToken || env.VITE_WHATSAPP_WEBHOOK_KEY;
  if (webhookUrl) {
    return { provider: 'webhook', webhookUrl, webhookToken };
  }

  // 4. Meta WhatsApp Business Cloud API
  const metaCloudToken = localSettings?.metaCloudToken || env.VITE_WHATSAPP_CLOUD_API_TOKEN;
  const metaPhoneNumberId = localSettings?.metaPhoneNumberId || env.VITE_WHATSAPP_PHONE_NUMBER_ID;
  if (metaCloudToken && metaPhoneNumberId) {
    return { provider: 'meta', metaCloudToken, metaPhoneNumberId };
  }

  // 5. Twilio WhatsApp
  const twilioAccountSid = localSettings?.twilioAccountSid || env.VITE_TWILIO_ACCOUNT_SID;
  const twilioAuthToken = localSettings?.twilioAuthToken || env.VITE_TWILIO_AUTH_TOKEN;
  const twilioFromNumber = localSettings?.twilioFromNumber || env.VITE_TWILIO_WHATSAPP_NUMBER;
  if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
    return { provider: 'twilio', twilioAccountSid, twilioAuthToken, twilioFromNumber };
  }

  return { provider: 'backend_server' };
};

/**
 * Clean and format 10-digit mobile number into international E.164 without '+'
 */
export const formatInternationalPhone = (mobile: string, defaultCountry = '91'): string => {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length === 10) return `${defaultCountry}${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `${defaultCountry}${digits.slice(1)}`;
  return digits;
};

/**
 * Format order text content for WhatsApp message
 */
export const formatOrderWhatsAppMessage = (order: OnlineOrder, branch: PharmacyBranch): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://medeco.in';
  const trackingUrl = `${origin}/?track=${order.id}&tab=customer_history`;
  const ownerMobile = getCachedOwnerMobile();
  const ownerPhoneFormatted = `+91 ${ownerMobile}`;

  const itemizedList = (order.items || [])
    .map((item, idx) => `${idx + 1}. *${item.medicineName}* (${item.dosage}) x ${item.quantity} = ₹${(item.unitPrice * item.quantity).toFixed(2)}`)
    .join('\n');

  return `🏥 *medEco Pharmacy - Online Order Confirmation* 🏥
━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${order.id}
*Customer:* ${order.customerName} (+91 ${order.customerMobile})
*Fulfilling Store:* ${order.pharmacyName}
*Backend Owner Mobile:* ${ownerPhoneFormatted}
*Delivery Address:* ${order.doorNumber ? order.doorNumber + ', ' : ''}${order.address}

*Ordered Medicines:*
${itemizedList}

*Estimated Total:* ₹${order.estimatedTotal.toFixed(2)}
*Status:* ${order.status}

🚚 *Live 5-Stage SOP Tracking Link:*
${trackingUrl}

_Your order is confirmed and being prepared by the pharmacist._`;
};

/**
 * Send automated WhatsApp message in the background without opening WhatsApp Web
 */
export const sendAutomatedWhatsAppMessage = async (
  recipientPhone: string,
  messageText: string,
  orderContext?: OnlineOrder
): Promise<WhatsAppDispatchResult> => {
  const config = getWhatsAppConfig();
  const cleanPhone = formatInternationalPhone(recipientPhone);

  const outboxEntry = {
    recipient: cleanPhone,
    senderOwnerMobile: getCachedOwnerMobile(),
    message: messageText,
    timestamp: new Date().toISOString(),
    orderId: orderContext?.id || 'manual',
    provider: config.provider,
    status: 'DISPATCHED_TO_BACKEND',
    deliveryChannel: 'Server WhatsApp Gateway'
  };

  // Record in Firebase Realtime Database outbox for real-time tracking
  try {
    if (database) {
      const outboxRef = ref(database, `whatsapp_outbox/${orderContext?.id || Date.now()}`);
      await set(outboxRef, outboxEntry);
    }
  } catch (err) {
    console.warn('Firebase whatsapp_outbox log warning:', err);
  }

  // 1. Meta WhatsApp Cloud API
  if (config.provider === 'meta' && config.metaCloudToken && config.metaPhoneNumberId) {
    try {
      const response = await fetch(`https://graph.facebook.net/v18.0/${config.metaPhoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.metaCloudToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: messageText
          }
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        console.error('Meta WhatsApp Cloud API error:', resData);
        return {
          success: false,
          provider: 'meta',
          recipient: cleanPhone,
          error: resData?.error?.message || 'Meta API request failed'
        };
      }

      return {
        success: true,
        provider: 'meta',
        recipient: cleanPhone,
        messageId: resData?.messages?.[0]?.id
      };
    } catch (err: any) {
      console.error('Meta WhatsApp dispatch failed:', err);
      return { success: false, provider: 'meta', recipient: cleanPhone, error: err?.message };
    }
  }

  // 2. Twilio WhatsApp API
  if (config.provider === 'twilio' && config.twilioAccountSid && config.twilioAuthToken && config.twilioFromNumber) {
    try {
      const formData = new URLSearchParams();
      formData.append('From', `whatsapp:${config.twilioFromNumber.startsWith('+') ? config.twilioFromNumber : '+' + config.twilioFromNumber}`);
      formData.append('To', `whatsapp:+${cleanPhone}`);
      formData.append('Body', messageText);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${config.twilioAccountSid}:${config.twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        }
      );

      const resData = await response.json();
      if (!response.ok) {
        return { success: false, provider: 'twilio', recipient: cleanPhone, error: resData?.message || 'Twilio error' };
      }

      return { success: true, provider: 'twilio', recipient: cleanPhone, messageId: resData?.sid };
    } catch (err: any) {
      return { success: false, provider: 'twilio', recipient: cleanPhone, error: err?.message };
    }
  }

  // 3. UltraMsg Gateway (Third-Party Direct WhatsApp API)
  if (config.provider === 'ultramsg' && config.ultraMsgInstanceId && config.ultraMsgToken) {
    try {
      const urlParams = new URLSearchParams({
        token: config.ultraMsgToken,
        to: `+${cleanPhone}`,
        body: messageText
      });
      const response = await fetch(`https://api.ultramsg.com/${config.ultraMsgInstanceId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlParams.toString()
      });
      const data = await response.json();
      if (data?.sent === 'true' || data?.id) {
        return { success: true, provider: 'ultramsg', recipient: cleanPhone, messageId: String(data.id) };
      }
      return { success: false, provider: 'ultramsg', recipient: cleanPhone, error: data?.error || 'UltraMsg delivery failed' };
    } catch (err: any) {
      return { success: false, provider: 'ultramsg', recipient: cleanPhone, error: err?.message };
    }
  }

  // 4. Green API Gateway (Third-Party Direct WhatsApp API)
  if (config.provider === 'greenapi' && config.greenApiIdInstance && config.greenApiApiToken) {
    try {
      const response = await fetch(`https://api.green-api.com/waInstance${config.greenApiIdInstance}/sendMessage/${config.greenApiApiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanPhone}@c.us`,
          message: messageText
        })
      });
      const data = await response.json();
      if (data?.idMessage) {
        return { success: true, provider: 'greenapi', recipient: cleanPhone, messageId: data.idMessage };
      }
      return { success: false, provider: 'greenapi', recipient: cleanPhone, error: data?.message || 'Green API delivery failed' };
    } catch (err: any) {
      return { success: false, provider: 'greenapi', recipient: cleanPhone, error: err?.message };
    }
  }

  // 5. Custom Webhook / WPPConnect Gateway
  if (config.provider === 'webhook' && config.webhookUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.webhookToken) {
        headers['Authorization'] = `Bearer ${config.webhookToken}`;
      }
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipient: cleanPhone,
          message: messageText,
          sender: getCachedOwnerMobile(),
          order: orderContext
        })
      });
      const data = await response.json();
      return { success: response.ok, provider: 'webhook', recipient: cleanPhone, messageId: data?.id };
    } catch (err: any) {
      return { success: false, provider: 'webhook', recipient: cleanPhone, error: err?.message };
    }
  }

  // 4. Backend Server Gateway / Cloud Dispatch (Never opens browser tabs or redirects customer)
  console.info(`[medEco Automated WhatsApp] Backend server dispatch to +${cleanPhone}:`, messageText);
  try {
    const srvResponse = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: cleanPhone,
        senderOwnerMobile: getCachedOwnerMobile(),
        message: messageText,
        orderId: orderContext?.id,
        order: orderContext
      })
    });
    if (srvResponse.ok) {
      const srvData = await srvResponse.json();
      return {
        success: srvData.success ?? true,
        provider: srvData.provider || 'backend_server_gateway',
        recipient: cleanPhone,
        messageId: srvData.messageId || `srv-${Date.now()}`,
        error: srvData.error
      };
    }
  } catch (backendErr: any) {
    console.warn('[medEco Automated WhatsApp] Backend endpoint notice:', backendErr);
    return {
      success: false,
      provider: 'backend_server_gateway',
      recipient: cleanPhone,
      error: backendErr?.message || 'Backend server connection error'
    };
  }

  return {
    success: true,
    provider: 'backend_server_gateway',
    recipient: cleanPhone,
    messageId: `msg-${Date.now()}`
  };
};

/**
 * Check live status of Baileys WhatsApp Gateway
 */
export const getWhatsAppGatewayStatus = async (): Promise<{ status: string; hasQR?: boolean; qr?: string; qrDataUrl?: string }> => {
  try {
    const res = await fetch('/api/whatsapp/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { status: 'DISCONNECTED' };
};

/**
 * Convenient wrapper for OnlineOrder confirmation dispatch to customer
 */
export const sendAutomatedWhatsAppOrderConfirmation = async (
  order: OnlineOrder,
  branch: PharmacyBranch
): Promise<WhatsAppDispatchResult> => {
  const message = formatOrderWhatsAppMessage(order, branch);
  return sendAutomatedWhatsAppMessage(order.customerMobile, message, order);
};

/**
 * Convenient wrapper for OnlineOrder dispatch to the store owner mobile
 */
export const sendAutomatedWhatsAppOrderToOwner = async (
  order: OnlineOrder,
  branch: PharmacyBranch
): Promise<WhatsAppDispatchResult> => {
  const backendOwnerMobile = getCachedOwnerMobile();
  const cleanOwner = formatInternationalPhone(backendOwnerMobile);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://medeco.in';
  const trackingUrl = `${origin}/?track=${order.id}&tab=customer_history`;

  const itemizedList = (order.items || [])
    .map((item, idx) => `${idx + 1}. *${item.medicineName}* (${item.dosage}) x ${item.quantity} = ₹${(item.unitPrice * item.quantity).toFixed(2)}`)
    .join('\n');

  const ownerMsg = `🔔 *NEW ONLINE ORDER ALERT - medEco Pharmacy* 🔔
━━━━━━━━━━━━━━━━━━━━
*Order ID:* #${order.id}
*Customer:* ${order.customerName} (+91 ${order.customerMobile})
*Delivery Address:* ${order.doorNumber ? order.doorNumber + ', ' : ''}${order.address}
*Items:*
${itemizedList}
*Total Value:* ₹${order.estimatedTotal.toFixed(2)}
🚚 *Live Order SOP Tracking:* ${trackingUrl}`;

  return sendAutomatedWhatsAppMessage(cleanOwner, ownerMsg, order);
};
