import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Backend server middleware plugin for medEco WhatsApp Gateway (proxies to dedicated port 3001 daemon)
const medecoBackendWhatsAppPlugin = (): Plugin => ({
  name: 'medeco-backend-whatsapp-gateway',
  configureServer(server) {
    // Status endpoint
    server.middlewares.use('/api/whatsapp/status', async (req, res) => {
      try {
        const gwRes = await fetch('http://localhost:3001/status');
        const data = await gwRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'DISCONNECTED' }));
      }
    });

    // Disconnect endpoint
    server.middlewares.use('/api/whatsapp/disconnect', async (req, res) => {
      try {
        const gwRes = await fetch('http://localhost:3001/disconnect', { method: 'POST' });
        const data = await gwRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });

    // Send WhatsApp endpoint
    server.middlewares.use('/api/send-whatsapp', async (req, res) => {
      if (req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const gwRes = await fetch('http://localhost:3001/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body
            });
            const data = await gwRes.json();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        })
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), medecoBackendWhatsAppPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/database'],
          icons: ['lucide-react']
        }
      }
    }
  }
})
