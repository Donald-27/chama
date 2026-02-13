import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ENTITIES_PATH = path.resolve(__dirname, '../entities/products-data.json');
const OUT_DIR = path.resolve(__dirname, '../public/images/products');
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || process.env.PIXABAY_KEY;

if (!PIXABAY_KEY) {
    console.error('PIXABAY_API_KEY not set. Export PIXABAY_API_KEY and re-run.');
    process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function tokenize(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
}

function scoreHit(hit, tokens, hints) {
    let score = 0;
    const tags = (hit.tags || '').toLowerCase();
    const title = (hit.user || '') + ' ' + (hit.pageURL || '');
    // token matches in tags
    for (const t of tokens) if (tags.includes(t)) score += 3;
    // hint words in tags
    for (const h of hints) if (tags.includes(h)) score += 4;
    // prefer images that mention 'product' or 'bottle' in tags
    if (tags.includes('product') || tags.includes('bottle') || tags.includes('packaging')) score += 5;
    // slight boost for larger images
    if (hit.imageWidth && hit.imageWidth >= 800) score += 2;
    return score;
}

async function searchPixabay(q, per_page = 10) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=${per_page}&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.hits || [];
}

async function download(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
}

async function chooseForProduct(p) {
    const tokens = tokenize([p.name, p.brand, p.category].filter(Boolean).join(' '));
    const hints = [];
    if ((p.category || '').toLowerCase().includes('shampoo')) hints.push('shampoo');
    if ((p.category || '').toLowerCase().includes('conditioner')) hints.push('conditioner');
    if ((p.category || '').toLowerCase().includes('styling')) hints.push('styling');
    if ((p.category || '').toLowerCase().includes('treatment')) hints.push('treatment');

    const queries = [];
    // very specific
    queries.push(`${p.name} ${p.brand} product`);
    queries.push(`${p.name} ${p.brand}`);
    queries.push(`${p.name} product packaging`);
    // category-based
    if (p.category) queries.push(`${p.brand} ${p.category} product`);
    queries.push(`${p.category} product packaging`);
    queries.push(`${p.name} bottle`);
    queries.push(`${p.brand} bottle`);

    const allHits = [];
    for (const q of queries) {
        const hits = await searchPixabay(q, 8);
        for (const h of hits) allHits.push(h);
        await new Promise(r => setTimeout(r, 200));
    }

    // dedupe by id
    const byId = new Map();
    for (const h of allHits) byId.set(h.id, h);
    const uniqueHits = Array.from(byId.values());

    // score
    const scored = uniqueHits.map(h => ({ h, score: scoreHit(h, tokens, hints) }));
    scored.sort((a, b) => b.score - a.score);

    if (!scored.length || scored[0].score < 6) {
        // fallback: return top Pixabay URL (if any)
        if (uniqueHits.length) return uniqueHits[0].largeImageURL || uniqueHits[0].webformatURL;
        return null;
    }

    return scored[0].h.largeImageURL || scored[0].h.webformatURL;
}

async function main() {
    const raw = fs.readFileSync(ENTITIES_PATH, 'utf8');
    const products = JSON.parse(raw);
    let changed = 0;
    const failures = [];

    for (const p of products) {
        try {
            const best = await chooseForProduct(p);
            if (!best) {
                failures.push(p.id || p.name);
                continue;
            }
            const ext = best.includes('.png') ? '.png' : '.jpg';
            const filename = `p${(p.id || '').replace(/[^a-z0-9]/gi, '')}${ext}`;
            const dest = path.resolve(OUT_DIR, filename);
            await download(best, dest);
            p.image_url = `/images/products/${filename}`;
            changed++;
            console.log(`Downloaded ${p.id} -> ${filename}`);
            await new Promise(r => setTimeout(r, 150));
        } catch (err) {
            console.error(`Failed ${p.id}:`, err.message || err);
            failures.push(p.id || p.name);
        }
    }

    fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Wrote ${changed} local image mappings. Failures: ${failures.length}`);
    if (failures.length) console.log('Failures sample:', failures.slice(0, 10));
}

main().catch(e => { console.error(e); process.exit(1); });
