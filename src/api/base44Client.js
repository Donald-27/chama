import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

// If there's no Base44 app configured (or it's the literal string 'null'),
// export a lightweight no-op client so the app can run locally without backend calls.
const { appId, token, functionsVersion, appBaseUrl } = appParams;

let base44Client;
if (!appId || appId === 'null') {
    // Minimal stub implementing the parts of the SDK the app expects.
    base44Client = {
        auth: {
            me: async () => null,
            logout: () => { },
            redirectToLogin: () => { }
        },
        analytics: {
            track: () => { },
            trackBatch: () => { },
        },
        // safe default for other potential usages
        __isStub: true,
    };
} else {
    base44Client = createClient({
        appId,
        token,
        functionsVersion,
        serverUrl: '',
        requiresAuth: false,
        appBaseUrl
    });
}

export const base44 = base44Client;

// Server-backed API wrappers. Configure the base URL for your deployed Edge Functions
// via Vite env var VITE_EDGE_BASE (e.g. https://<project>.functions.supabase.co)
// Safely read import.meta.env — avoid using `typeof import` which can break some parsers.
let _meta;
try {
    // Safely access import.meta in environments where it may not be available.
    _meta = /** @type {any} */ (import.meta);
} catch (e) {
    _meta = undefined;
}
const EDGE_BASE = _meta?.env?.VITE_EDGE_BASE ?? '';

async function postToEdge(path, body) {
    const url = EDGE_BASE ? `${EDGE_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : `/${path.replace(/^\//, '')}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const text = await res.text();
    try {
        return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
    } catch (e) {
        return { ok: res.ok, status: res.status, data: text };
    }
}

export const serverApi = {
    createTransaction: async (payload) => {
        // payload: { chama_id, member_id, amount, currency, method, idempotency_key, meta }
        return postToEdge('createTransaction', payload);
    },
    createDeleteRequest: async ({ chama_id, requester_email, reason }) => {
        return postToEdge('createDeleteRequest', { chama_id, requester_email, reason });
    },
    voteDeleteRequest: async ({ delete_request_id, voter_email, approve }) => {
        return postToEdge('voteDeleteRequest', { delete_request_id, voter_email, approve });
    },
    mpesaWebhook: async (payload) => {
        return postToEdge('mpesaWebhook', payload);
    }
    ,
    getDeleteRequests: async (chama_id) => {
        return postToEdge('getDeleteRequests', { chama_id });
    }
};
