import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ENTITIES_PATH = path.resolve(__dirname, '../entities/products-data.json');
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || process.env.PIXABAY_KEY;

if (!PIXABAY_KEY) {
    console.error('PIXABAY_API_KEY not set in environment. Set PIXABAY_API_KEY and re-run.');
    process.exit(1);
}

async function searchPixabay(query) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.hits && data.hits.length ? data.hits[0] : null;
}

async function main() {
    const raw = fs.readFileSync(ENTITIES_PATH, 'utf8');
    const products = JSON.parse(raw);
    let changed = 0;

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        if (p.image_url && typeof p.image_url === 'string' && p.image_url.startsWith('http')) continue;

        const queryParts = [p.name, p.brand, p.category].filter(Boolean).join(' ');
        if (!queryParts) continue;

        try {
            const hit = await searchPixabay(queryParts);
            if (hit && hit.largeImageURL) {
                p.image_url = hit.largeImageURL;
                changed++;
                console.log(`Mapped ${p.id || i} -> ${p.image_url}`);
            } else {
                console.log(`No pixabay hit for ${p.id || i} (${queryParts})`);
            }
        } catch (err) {
            console.error(`Error searching pixabay for ${queryParts}:`, err.message || err);
        }
        // small delay to be gentle
        await new Promise(r => setTimeout(r, 300));
    }

    if (changed) {
        fs.writeFileSync(ENTITIES_PATH, JSON.stringify(products, null, 2), 'utf8');
        console.log(`Wrote ${changed} image_url mappings to products-data.json`);
    } else {
        console.log('No changes made.');
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
