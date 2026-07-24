import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import https from 'https';
import http from 'http';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envFile = readFileSync(resolve(__dirname, '..', '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false }});

async function downloadImage(url, dest) {
  if (url.startsWith('data:image')) {
    const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(dest, base64Data, 'base64');
    return dest;
  }
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(dest))
           .on('error', reject)
           .once('close', () => resolve(dest));
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function scrapeGoogleImages(page, query) {
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const images = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('img')).slice(1, 20); // skip logo
    const urls = [];
    for (const el of elements) {
      if (el.src && (el.src.startsWith('http') || el.src.startsWith('data:image'))) {
        urls.push(el.src);
      }
    }
    return urls.slice(0, 4);
  });
  return images;
}

async function main() {
  const logFile = resolve(__dirname, '..', 'image-sourcing-log.jsonl');
  let processedNames = new Set();
  if (existsSync(logFile)) {
    const lines = readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    for (const l of lines) {
      try {
        const entry = JSON.parse(l);
        processedNames.add(entry.name);
      } catch (e) {}
    }
  }

  const { data: allProducts } = await supabase.from('products').select('*');
  const uniqueProducts = [];
  const seenNames = new Set();
  for (const p of allProducts) {
    if (!seenNames.has(p.name)) {
      seenNames.add(p.name);
      uniqueProducts.push(p);
    }
  }

  const batch = uniqueProducts.filter(p => !processedNames.has(p.name)).slice(0, 10);
  console.log(`Processing batch of ${batch.length} products...`);

  const candidatesDir = resolve(__dirname, '..', 'candidates');
  if (!existsSync(candidatesDir)) mkdirSync(candidatesDir);

  const batchResults = [];

  const executablePath = 'C:\\Users\\ansht\\.cache\\puppeteer\\chrome\\win64-150.0.7871.24\\chrome-win64\\chrome.exe';
  const browser = await puppeteer.launch({ 
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  for (let i = 0; i < batch.length; i++) {
    const p = batch[i];
    const query = `${p.brand || ''} ${p.name} packaging`.trim();
    console.log(`Searching for: ${query}`);
    
    try {
      const top4Urls = await scrapeGoogleImages(page, query);
      const downloaded = [];
      
      for (let j = 0; j < top4Urls.length; j++) {
        const dest = resolve(candidatesDir, `${p.id}_${j}.jpg`);
        try {
          await downloadImage(top4Urls[j], dest);
          downloaded.push({ url: top4Urls[j], file: dest });
        } catch (err) {
          console.error(`Failed to download image ${j}:`, err.message);
        }
      }
      
      batchResults.push({
        product: p,
        candidates: downloaded
      });
      
    } catch (err) {
      console.error(`Error searching ${query}:`, err.message);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }

  await browser.close();

  writeFileSync(resolve(candidatesDir, 'batch-results.json'), JSON.stringify(batchResults, null, 2));
  console.log('Batch downloaded to candidates/batch-results.json');
}

main();
