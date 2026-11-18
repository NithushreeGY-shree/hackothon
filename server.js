const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Helper to load or initialize database file
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = { registrations: [], messages: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { registrations: [], messages: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  // Enable CORS so your frontend can call this backend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Health check route
  if (url.pathname === '/api' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'CampusConnect Backend API is running' }));
    return;
  }

  // 2. Submit Contact Form Message
  if (url.pathname === '/api/contact' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { name, email, subject, message } = JSON.parse(body);
        if (!name || !email || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Name, email, and message are required' }));
          return;
        }

        const data = loadData();
        const newMessage = {
          id: Date.now().toString(),
          name,
          email,
          subject: subject || 'General Query',
          message,
          receivedAt: new Date().toISOString()
        };
        data.messages.push(newMessage);
        saveData(data);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Message saved successfully', data: newMessage }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 3. Register for an Event
  if (url.pathname === '/api/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { eventId, eventTitle, userEmail } = JSON.parse(body);
        const data = loadData();
        const newRegistration = {
          id: Date.now().toString(),
          eventId,
          eventTitle,
          userEmail: userEmail || 'guest',
          registeredAt: new Date().toISOString()
        };
        data.registrations.push(newRegistration);
        saveData(data);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Registered successfully', data: newRegistration }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 4. View Stored Data (Admin/Viewing)
  if (url.pathname === '/api/data' && req.method === 'GET') {
    const data = loadData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // 404 Route
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}/api`);
});
