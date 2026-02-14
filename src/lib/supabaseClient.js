// Supabase client wrapper
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment (.env)
import { createClient } from '@supabase/supabase-js';

// Safely access import.meta in environments where it may not be available.
let meta;
try {
    // import.meta is available in ESM; wrap in try/catch to avoid parse-time issues in some tooling
    // and allow IDEs/typecheckers to still understand the JSDoc cast.
    // @ts-ignore
    meta = /** @type {any} */ (import.meta);
} catch (e) {
    meta = undefined;
}

const SUPABASE_URL = meta?.env?.VITE_SUPABASE_URL ?? (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);
const SUPABASE_ANON_KEY = meta?.env?.VITE_SUPABASE_ANON_KEY ?? (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export default supabase;

// Helpful debug info to surface in the browser console during development
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
if (typeof window !== 'undefined') {
    try {
        const urlHost = SUPABASE_URL ? SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/.*/, '') : 'NOT SET';
        // only indicate presence, don't log sensitive keys
        // eslint-disable-next-line no-console
        console.info('[supabase] hasSupabase=', hasSupabase, 'VITE_SUPABASE_URL host=', urlHost);
        // In dev, also log whether VITE env entries exist (without printing keys)
        if (import.meta.env && import.meta.env.MODE === 'development') {
            // eslint-disable-next-line no-console
            console.info('[supabase] import.meta.env.VITE_SUPABASE_URL set=', Boolean(import.meta.env.VITE_SUPABASE_URL));
            // Log presence (length) of anon key without revealing it
            // eslint-disable-next-line no-console
            console.info('[supabase] VITE_SUPABASE_ANON_KEY present=', Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY), 'length=', import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.length : 0);
        }
    } catch (e) {
        // ignore
    }
}
