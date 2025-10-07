const fetch = require('node-fetch'); // <-- ADD THIS LINE

// This script will list all the Gemini models available to your API key.

// Load environment variables from your .env file
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  console.log("Fetching available models from Google AI...");

  if (!apiKey) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is not defined in your .env file.");
    return;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error("❌ API Error:", data.error.message);
        return;
    }

    console.log("\n✅ Models available to your API key:");
    data.models.forEach(model => {
      // We only care about models that can be used for chatting/generating text
      if (model.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${model.displayName} (ID: ${model.name})`);
      }
    });

  } catch (error) {
    console.error("❌ Failed to fetch models. Check your network or API key.", error);
  }
}

listModels();