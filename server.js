const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'watchlist.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Get watchlist
app.get('/api/watchlist', (req, res) => {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      const watchlist = JSON.parse(data);
      res.json(watchlist);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading watchlist:', error);
    res.json([]);
  }
});

// Save watchlist
app.post('/api/watchlist', (req, res) => {
  try {
    const watchlist = req.body;
    fs.writeFileSync(dataFile, JSON.stringify(watchlist, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving watchlist:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve index.html for any unmatched route (SPA friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Anime watchlist tracker running on port ${PORT}`);
});
