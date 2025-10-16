import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const rawUrl = (process.env.SUPABASE_URL || '').trim();
const rawKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!rawUrl || !rawKey) {
  throw new Error("Supabase configuration missing: Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in backend/.env");
}

// Normalize URL (add https:// if user pasted bare domain)
const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

// Basic sanity checks to prevent common mistakes
const urlLooksValid = /https:\/\/.*\.supabase\.co\/?$/i.test(normalizedUrl);
const keyLooksJwt = rawKey.startsWith('eyJ'); // All Supabase keys are JWTs (base64 starting with eyJ)

if (!urlLooksValid) {
  throw new Error(`Invalid SUPABASE_URL: "${normalizedUrl}". Expected format like https://<project-id>.supabase.co`);
}

if (!keyLooksJwt) {
  throw new Error("Invalid SUPABASE_SERVICE_KEY provided. Make sure you used the Service role key from Settings > API (not the anon/public key).");
}

export const supabase = createClient(normalizedUrl, rawKey);