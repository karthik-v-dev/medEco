import http from 'http';
import { 
  initWhatsAppGateway, 
  sendWhatsAppMessage, 
  getGatewayStatus, 
  disconnectWhatsAppGateway 
} from './whatsappGateway.js';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getGatewayStatus()));
    return;
  }

  if (req.url === '/disconnect' && req.method === 'POST') {
    const result = await disconnectWhatsAppGateway();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.url === '/send' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const recipient = payload.recipient || '';
        const message = payload.message || '';
        const result = await sendWhatsAppMessage(recipient, message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, async () => {
  console.log(`[medEco WhatsApp Gateway Server] Running on http://localhost:${PORT}`);
  try {
    await initWhatsAppGateway();
  } catch (e) {
    console.error('[medEco WhatsApp Gateway Server] Startup error:', e);
  }
});
