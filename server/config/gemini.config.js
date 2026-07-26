import { config } from './env.config.js';

export const GEMINI_API_KEY = config.gemini.apiKey;
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
