import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

const AUTH_FOLDER = path.resolve(process.cwd(), '.baileys_auth');

let sock = null;
let currentQR = null;
let currentQRDataUrl = null;
let connectionStatus = 'DISCONNECTED';
let isConnecting = false;

export const getGatewayStatus = () => {
  if (connectionStatus === 'DISCONNECTED' && !isConnecting) {
    initWhatsAppGateway().catch(() => {});
  }
  return {
    status: connectionStatus,
    hasQR: Boolean(currentQR),
    qr: currentQR,
    qrDataUrl: currentQRDataUrl
  };
};

export const initWhatsAppGateway = async () => {
  if (isConnecting || connectionStatus === 'CONNECTED') {
    return;
  }
  isConnecting = true;

  try {
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['medEco Pharmacy POS', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQR = qr;
        connectionStatus = 'WAITING_FOR_SCAN';
        QRCode.toDataURL(qr).then(url => {
          currentQRDataUrl = url;
        }).catch(() => {});

        console.log('\n======================================================');
        console.log('[medEco WhatsApp Gateway] 📲 SCAN QR CODE TO LINK');
        console.log('Open WhatsApp on Owner phone (+91 9030481507)');
        console.log('Go to: Settings / Three Dots -> Linked Devices -> Link a Device');
        console.log('======================================================\n');
        qrcodeTerminal.generate(qr, { small: true });
        console.log('======================================================\n');
      }

      if (connection === 'open') {
        currentQR = null;
        currentQRDataUrl = null;
        connectionStatus = 'CONNECTED';
        isConnecting = false;
        console.log('\n======================================================');
        console.log('🎉 [medEco WhatsApp Gateway] OWNER WHATSAPP CONNECTED!');
        console.log('Ready to dispatch live messages from: +91 9030481507');
        console.log('Orders will now land directly on customer WhatsApp phones!');
        console.log('======================================================\n');
      }

      if (connection === 'close') {
        connectionStatus = 'DISCONNECTED';
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[medEco WhatsApp Gateway] Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => initWhatsAppGateway(), 4000);
        } else {
          console.log('[medEco WhatsApp Gateway] Logged out. Clearing credentials to allow re-scan...');
          try {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          } catch {}
          setTimeout(() => initWhatsAppGateway(), 2000);
        }
      }
    });

  } catch (err) {
    isConnecting = false;
    connectionStatus = 'ERROR';
    console.error('[medEco WhatsApp Gateway] Initialization error:', err?.message || err);
  }
};

export const sendWhatsAppMessage = async (recipientPhone, messageText) => {
  const digits = recipientPhone.replace(/\D/g, '');
  const cleanPhone = digits.length === 10 ? `91${digits}` : digits;

  if (connectionStatus !== 'CONNECTED' || !sock) {
    try {
      await initWhatsAppGateway();
      let attempts = 0;
      while (connectionStatus !== 'CONNECTED' && attempts < 8) {
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }
    } catch {}
  }

  if (connectionStatus !== 'CONNECTED' || !sock) {
    return {
      success: false,
      status: connectionStatus,
      recipient: cleanPhone,
      error: connectionStatus === 'WAITING_FOR_SCAN'
        ? 'WhatsApp Gateway waiting for QR scan. Please scan the QR code using Owner phone.'
        : 'WhatsApp Gateway not connected.'
    };
  }

  try {
    const jid = `${cleanPhone}@s.whatsapp.net`;
    const sent = await sock.sendMessage(jid, { text: messageText });
    
    console.log(`[medEco WhatsApp Gateway] 📲 Message delivered to +${cleanPhone} (Message ID: ${sent?.key?.id})`);
    return {
      success: true,
      provider: 'baileys_self_hosted',
      recipient: cleanPhone,
      messageId: sent?.key?.id
    };
  } catch (sendErr) {
    console.error(`[medEco WhatsApp Gateway] Failed to send message to +${cleanPhone}:`, sendErr?.message || sendErr);
    return {
      success: false,
      recipient: cleanPhone,
      error: sendErr?.message || 'Failed to deliver message'
    };
  }
};

export const disconnectWhatsAppGateway = async () => {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch {}
  try {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
  } catch {}
  connectionStatus = 'DISCONNECTED';
  currentQR = null;
  currentQRDataUrl = null;
  sock = null;
  setTimeout(() => initWhatsAppGateway(), 1000);
  return { success: true };
};
