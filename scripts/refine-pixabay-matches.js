import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ENTITIES_PATH = path.resolve(__dirname, '../entities/products-data.json');
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || process.env.PIXABAY_KEY;

if (!PIXABAY_KEY) {
    console.error('PIXABAY_API_KEY not set. Export PIXABAY_API_KEY and re-run.');
    process.exit(1);
}

const STRICT = process.env.STRICT === '1' || process.env.STRICT === 'true';

const categoryHints = {
    shampoo: ['shampoo bottle', 'shampoo product', 'shampoo'],
    conditioner: ['conditioner bottle', 'conditioner product', 'conditioner'],
    styling: ['hair styling product', 'hair product', 'styling product', 'styling'],
    treatment: ['hair treatment product', 'serum bottle', 'hair oil', 'treatment'],
    supplements: ['supplement bottle', 'capsules', 'pills', 'supplements'],
    skincare: ['skincare product', 'cosmetic jar', 'skincare'],
    default: ['product packaging', 'product bottle', 'product']
};

async function searchPixabay(query, per_page = 5) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${per_page}&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.hits || [];
}

function tagsMatch(hit, keywords) {
    if (!hit || !hit.tags) return false;
    const tags = hit.tags.toLowerCase();
    return keywords.some(k => tags.includes(k));
}

async function refineOne(p) {
    const cat = (p.category || 'default').toLowerCase();
    const hints = categoryHints[cat] || categoryHints.default;
    const baseParts = [p.name, p.brand].filter(Boolean).join(' ');

    const tries = [];
    // primary: name+brand+hints
    for (const h of hints) tries.push(`${baseParts} ${h}`.trim());
    // fallbacks
    for (const h of hints) tries.push(`${p.name || ''} ${h}`.trim());
    for (const h of hints) tries.push(`${p.brand || ''} ${h}`.trim());
    tries.push(`${p.category} product`.trim());

    for (const q of tries) {
        if (!q) continue;
        const hits = await searchPixabay(q, 5);
        if (!hits || !hits.length) continue;
        // prefer hits with matching tags
        let chosen = hits.find(h => tagsMatch(h, hints.map(s => s.split(' ')[0])));
        if (!chosen && !STRICT) chosen = hits[0];
        if (chosen && chosen.largeImageURL) {
            if (STRICT) {
                // double-check tags contain at least one hint root
                if (tagsMatch(chosen, hints.map(s => s.split(' ')[0]))) return chosen.largeImageURL;
                else continue;
            }
            return chosen.largeImageURL;
        }
    }
    return null;
}

async function main() {
    const raw = fs.readFileSync(ENTITIES_PATH, 'utf8');
    const products = JSON.parse(raw);
    let changed = 0;

    // Process all products (STRICT mode will ensure only category-matching hits are accepted)
    const targetCats = new Set(['shampoo', 'conditioner', 'styling', 'treatment', 'supplements', 'skincare']);

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (!p.category) continue;
        if (!p) continue;

        try {
            const newUrl = await refineOne(p);
            if (newUrl) {
                if (!p.image_url || p.image_url !== newUrl) {
                    p.image_url = newUrl;
                    changed++;
                    console.log(`Refined ${p.id} -> ${newUrl}`);
                }
            } else {
                console.log(`No better match for ${p.id} (${p.name})`);
            }
        } catch (err) {
            console.error(`Error refining ${p.id}:`, err.message || err);
        }
        await new Promise(r => setTimeout(r, 300));
    }

    if (changed) {
        fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
        console.log(`Wrote ${changed} refined image_url mappings to products-data.json`);
    } else {
        console.log('No changes made by refinement.');
    }
}

main().catch(e => { console.error(e); process.exit(1); });
