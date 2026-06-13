import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from the .env file in the root folder
dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// The Gemini API key from your .env file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /api/search
// This route takes a natural language query, asks Gemini to extract filters, 
// and then searches Supabase for matching products.
app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // ---------------------------------------------------------
    // STEP 1: Define the System Prompt for Gemini
    // ---------------------------------------------------------
    // We strictly tell Gemini to return a specific JSON format
    const systemPrompt = `
      You are an AI assistant for a grocery app. Convert the user's search query into a JSON object.
      The JSON must match this exact structure:
      {
        "category": "string or null",
        "max_price": "number or null",
        "days_left_max": "number or null",
        "keywords": ["array", "of", "strings"]
      }
      Rules:
      - If category, max_price, or days_left_max are not mentioned, set them to null.
      - If no keywords, return an empty array [].
      - Return ONLY valid JSON, without any markdown formatting like \`\`\`json.
    `;

    // ---------------------------------------------------------
    // STEP 2: Call Gemini API using standard fetch (No SDK)
    // ---------------------------------------------------------
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          parts: [{ text: query }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    
    // Extract the text response from Gemini
    let jsonText = geminiData.candidates[0].content.parts[0].text.trim();
    
    // Sometimes Gemini still adds ```json ... ``` despite instructions. 
    // We clean it up just in case.
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    // ---------------------------------------------------------
    // STEP 3: Parse the JSON and build the Supabase Query
    // ---------------------------------------------------------
    let filters;
    try {
      filters = JSON.parse(jsonText);
    } catch (err) {
      console.warn("Failed to parse Gemini output, falling back to empty filters.", jsonText);
      // Edge Case: Invalid JSON from Gemini. We default to nulls (fetch all products).
      filters = { category: null, max_price: null, days_left_max: null, keywords: [] };
    }

    // Start a base query: "Select all columns from products"
    let dbQuery = supabase.from('products').select('*');

    // Filter by Category (Skip if null)
    if (filters.category) {
      dbQuery = dbQuery.ilike('category', `%${filters.category}%`);
    }

    // Filter by Max Price (Skip if null)
    if (filters.max_price !== null) {
      // Assuming price in DB is stored in paise/cents (multiply by 100).
      // If your DB stores raw rupees (e.g., 50.00), remove the * 100.
      dbQuery = dbQuery.lte('sale_price', filters.max_price * 100);
    }

    // Filter by Expiry Date (Skip if null)
    if (filters.days_left_max !== null) {
      // Calculate target date based on today + days_left_max
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + filters.days_left_max);
      // We want products expiring BEFORE or ON that target date
      dbQuery = dbQuery.lte('expiry_date', targetDate.toISOString());
    }

    // Filter by Keywords (Skip if empty)
    if (filters.keywords && filters.keywords.length > 0) {
      // For simplicity, we just use the first keyword with an ilike (case-insensitive) match
      // This checks if the product name contains the keyword
      dbQuery = dbQuery.ilike('name', `%${filters.keywords[0]}%`);
    }

    // Execute the final built query
    const { data: products, error } = await dbQuery;

    if (error) {
      throw error;
    }

    // ---------------------------------------------------------
    // STEP 4: Return the filtered products to the React frontend
    // ---------------------------------------------------------
    res.json({
      filtersApplied: filters, // Send back filters for debugging/UI
      products: products
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: 'An error occurred during search' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
