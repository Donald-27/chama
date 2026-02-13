import fs from 'fs';
import path from 'path';

const ENT = path.resolve('./entities/products-data.json');
const IMG_DIR = path.resolve('./public/images/products');

function findLocalForId(id) {
    const n = id.replace(/^p0*/, '').padStart(3, '0');
    const candidates = [];
    // exact pNNN.*
    ['jpg', 'png', 'webp', 'jpeg'].forEach(ext => candidates.push(`p${n}.${ext}`));
    // pp_user_pinN
    candidates.push(`pp_user_pin${n}.jpg`, `pp_user_pin${n}.png`);
    // pp_pin_pNNN_*
    const all = fs.readdirSync(IMG_DIR);
    for (const f of all) {
        if (f.match(new RegExp(`^pp_pin_${id}_`))) candidates.push(f);
    }
    // ppNNN or ppNNN.*
    for (const ext of ['jpg', 'png', 'webp', 'jpeg']) candidates.push(`pp${n}.${ext}`);
    // ppp/p PPP/ppp* uniq
    for (const f of all) {
        if (f.includes(id) && (f.startsWith('ppp') || f.startsWith('pppp') || f.startsWith('ppp'))) candidates.push(f);
    }
    // placeholder exists? leave placeholder for now
    for (const c of candidates) {
        if (!c) continue;
        const p = path.resolve(IMG_DIR, c);
        if (fs.existsSync(p) && fs.statSync(p).isFile()) return c;
    }
    return null;
}

function main() {
    const products = JSON.parse(fs.readFileSync(ENT, 'utf8'));
    const changed = [];
    for (const p of products) {
        if (!p || !p.id) continue;
        const local = findLocalForId(p.id);
        if (local) {
            const newUrl = `/images/products/${local}`;
            if (p.image_url !== newUrl) {
                changed.push({ id: p.id, from: p.image_url, to: newUrl });
                p.image_url = newUrl + `?v=${Date.now()}`;
            }
        }
    }
    fs.writeFileSync(ENT, JSON.stringify(products, null, 2), 'utf8');
    console.log('Updated', changed.length, 'products. Sample:', changed.slice(0, 10));
}

main();
