// Import required packages
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

// Initialize the app
const app = express();
app.use(cors());
app.use(express.json());

// Get secrets from the .env file
const mongoUri = process.env.MONGO_URI;
const geminiApiKey = process.env.GEMINI_API_KEY;
const port = process.env.PORT || 3000;

// Connect to MongoDB
const client = new MongoClient(mongoUri);
let db;

// REVISED connectDB FUNCTION FOR DEBUGGING
async function connectDB() {
  console.log("Attempting to connect to MongoDB...");
  console.log("Connection String being used:", mongoUri);

  if (!mongoUri) {
    console.error("CRITICAL ERROR: MONGO_URI is not defined. Check your .env file.");
    process.exit(1);
  }

  try {
    await client.connect();
    db = client.db('tourismApp');
    console.log('✅ Successfully connected to MongoDB!');
  } catch (err) {
    console.error('❌ FAILED TO CONNECT TO MONGODB. Full Error:', err);
    process.exit(1);
  }
}

// --- API ENDPOINTS ---
// NEW Endpoint to get only trendy destinations
app.get('/api/trendy-destinations', async (req, res) => {
  try {
    const destinationsCollection = db.collection('destinations');
    // Find only documents where isTrendy is true
    const trendyDestinations = await destinationsCollection.find({ isTrendy: true }).toArray();
    res.json(trendyDestinations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trendy destinations.' });
  }
});
app.get('/api/destinations', async (req, res) => {
  try {
    const destinationsCollection = db.collection('destinations');
    const destinations = await destinationsCollection.find({}).toArray();
    res.json(destinations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch destinations.' });
  }
});

app.post('/api/gemini', async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  // AFTER
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
  try {
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } })
      })
    });
    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.json();
      console.error('Error from Google API:', errorBody);
      throw new Error(JSON.stringify(errorBody.error));
    }
    const data = await geminiResponse.json();
    res.json(data);
  } catch (error) {
    console.error("Gemini proxy error:", error.message);
    res.status(500).json({ message: 'Error calling Gemini API.' });
  }
});

// Start the server after connecting to the database
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});