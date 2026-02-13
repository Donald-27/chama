#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const KEY = process.env.PIXABAY_API_KEY || process.env.VITE_PIXABAY_API_KEY || '';
if (!KEY) {
    console.error('Missing PIXABAY_API_KEY environment variable.');
    process.exit(1);
}

const ROOT = process.cwd();
const ENTITIES = path.join(ROOT, 'entities', 'products-data.json');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function queryPixabay(query) {
    const url = `https://pixabay.com/api/?key=${KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=5&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const body = await res.json();
    if (body.hits && body.hits.length) return body.hits.map(h => h.largeImageURL || h.webformatURL || h.previewURL).filter(Boolean);
    return null;
}

async function download(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    let ext = '.jpg';
    if (ct.includes('png')) ext = '.png';
    else if (ct.includes('webp')) ext = '.webp';
    const data = await res.arrayBuffer();
    await fs.writeFile(dest + ext, Buffer.from(data));
    return ext;
}

(async function main() {
    await ensureDir(OUT_DIR);
    const raw = await fs.readFile(ENTITIES, 'utf8');
    const products = JSON.parse(raw);

    for (const p of products) {
        const localPath = p.image_url || '';
        const isLocal = localPath.startsWith('/images/products/');
        const imageFileExists = isLocal ? await checkFileExists(path.join(ROOT, 'public', localPath.replace('/images/', 'images/'))) : false;
        if (isLocal && imageFileExists) {
            console.log('Skipping', p.id, 'already has local image');
            continue;
        }

        const query = `${p.name} ${p.brand || ''}`.trim();
        console.log('Searching Pixabay for', p.id, query);
        const urls = await queryPixabay(query);
        if (!urls || !urls.length) {
            console.warn('No Pixabay results for', p.id, 'trying category');
            const catUrls = await queryPixabay(p.category || 'product');
            if (catUrls && catUrls.length) urls = catUrls;
        }

        if (urls && urls.length) {
            const chosen = urls[0];
            const basename = path.join(OUT_DIR, p.id);
            try {
                const ext = await download(chosen, basename);
                p.image_url = `/images/products/${p.id}${ext}`;
                console.log('Saved', p.id + ext);
            } catch (err) {
                console.warn('Failed download for', p.id, err.message);
            }
        } else {
            console.warn('No images found for', p.id);
        }
        await sleep(300);
    }

    await fs.writeFile(ENTITIES, JSON.stringify(products, null, 2));
    console.log('Updated products-data.json');

    async function checkFileExists(f) {
        try { await fs.access(f); return true; } catch { return false; }
    }
})();
