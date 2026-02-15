import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

// If there's no Base44 app configured (or it's the literal string 'null'),
// export a lightweight no-op client so the app can run locally without backend calls.
const { appId, token, functionsVersion, appBaseUrl } = appParams;

let base44Client;
if (!appId || appId === 'null') {
    // Minimal stub implementing the parts of the SDK the app expects.
    // simple local storage helper for stubbed entities
    const makeStore = (name) => {
        const KEY = `chama_${name}`;
        const read = () => {
            try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
        };
        const write = (arr) => { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) { } };
        return {
            create: async (obj) => {
                const arr = read();
                const id = obj.id || `${name}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                const wholed = { ...obj, id };
                arr.push(wholed);
                write(arr);
                return wholed;
            },
            list: async () => {
                return read();
            },
            filter: async (criteria = {}) => {
                const arr = read();
                if (!criteria || Object.keys(criteria).length === 0) return arr;
                // simple filter: match keys strictly
                return arr.filter(item => {
                    return Object.keys(criteria).every(k => String(item[k]) === String(criteria[k]));
                });
            },
            findOne: async (criteria = {}) => {
                const res = await (async () => {
                    const arr = read();
                    return arr.find(item => Object.keys(criteria).every(k => String(item[k]) === String(criteria[k])));
                })();
                return res || null;
            },
            update: async (id, patch) => {
                const arr = read();
                const idx = arr.findIndex(a => String(a.id) === String(id));
                if (idx === -1) return null;
                arr[idx] = { ...arr[idx], ...patch };
                write(arr);
                return arr[idx];
            }
        };
    };

    const entities = {
        Chama: makeStore('chamas'),
        ChamaMember: makeStore('chama_members'),
        ChamaSettings: makeStore('chama_settings'),
        Transaction: makeStore('transactions'),
        ChatMessage: makeStore('chat_messages'),
        Fine: makeStore('fines'),
        Loan: makeStore('loans'),
        // Extra mock entities used by UI components
        DeleteRequest: makeStore('delete_requests'),
        JoinRequest: makeStore('join_requests')
    };

    base44Client = {
        auth: {
            me: async () => {
                try {
                    const raw = localStorage.getItem('chama_profile');
                    return raw ? JSON.parse(raw) : null;
                } catch (e) { return null; }
            },
            logout: () => { try { localStorage.removeItem('chama_token'); } catch (e) { } },
            redirectToLogin: () => { window.location.href = window.location.href; }
        },
        analytics: {
            track: () => { },
            trackBatch: () => { },
        },
        entities,
        integrations: {
            Core: {
                UploadFile: async ({ file }) => {
                    // return data URL as fallback
                    return new Promise((resolve, reject) => {
                        try {
                            const reader = new FileReader();
                            reader.onload = () => resolve({ file_url: reader.result });
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        } catch (e) { reject(e); }
                    });
                }
            }
        },
        users: {
            // dev stub — attempt to invite a user, no-op locally
            inviteUser: async (email, role = 'user') => {
                try {
                    // store a minimal profile locally for dev convenience
                    const existing = localStorage.getItem('chama_profile');
                    if (!existing) {
                        localStorage.setItem('chama_profile', JSON.stringify({ email, full_name: '', id: `user_${Date.now()}` }));
                    }
                    return { ok: true };
                } catch (e) {
                    return { ok: false, error: e };
                }
            }
            ,
            update: async (payload) => {
                try {
                    const raw = localStorage.getItem('chama_profile');
                    const profile = raw ? JSON.parse(raw) : {};
                    const updated = { ...profile, ...payload };
                    localStorage.setItem('chama_profile', JSON.stringify(updated));
                    // emit event
                    try { window.dispatchEvent(new CustomEvent('chama_profile_updated', { detail: updated })); } catch (e) { }
                    return { ok: true, user: updated };
                } catch (e) {
                    return { ok: false, error: e };
                }
            }
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
