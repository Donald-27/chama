import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// If no appId is configured (local/front-end-only), export a noop proxy to avoid the SDK initializing
let base44Instance;
if (appId) {
  base44Instance = createClient({
    appId,
    token,
    functionsVersion,
    serverUrl: '',
    requiresAuth: false,
    appBaseUrl
  });
} else {
  // Return a proxy where any function access yields an async noop that resolves to null.
  const noopAsync = async () => null;
  base44Instance = new Proxy({}, {
    get: () => noopAsync
  });
}

export const base44 = base44Instance;
