import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ENT = path.resolve('./entities/products-data.json');
const IMG_DIR = path.resolve('./public/images/products');
const OUT_DIR = path.resolve('./artifacts');
const PUBLIC_OUT = path.resolve('./public/image-review.html');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const products = JSON.parse(fs.readFileSync(ENT, 'utf8'));

function shaForFile(p) {
    try {
        const buf = fs.readFileSync(p);
        return crypto.createHash('sha256').update(buf).digest('hex');
    } catch (e) { return ''; }
}

function extractLocalFilename(url) {
    if (!url) return '';
    // local path like /images/products/NAME.ext?v=123
    const m = url.match(/\/images\/products\/([^?]+)/);
    if (m) return m[1];
    // maybe already bare filename
    const m2 = url.match(/([^/]+\.(?:jpg|jpeg|png|webp|svg))$/i);
    if (m2) return m2[1];
    return '';
}

const rows = [['productId', 'image_url', 'filename', 'sha256', 'source']];

for (const p of products) {
    const image_url = p.image_url || '';
    const filename = extractLocalFilename(image_url);
    const localPath = filename ? path.resolve(IMG_DIR, filename) : '';
    let sha = '';
    let source = '';
    if (filename && fs.existsSync(localPath)) {
        sha = shaForFile(localPath);
        // infer source from filename conventions
        if (filename.startsWith('pp_pin_') || filename.startsWith('pp_pin_p')) source = 'pinterest';
        else if (filename.startsWith('ppp') || filename.startsWith('pppp')) source = 'pixabay-remap';
        else if (filename.startsWith('pp_user_pin')) source = 'user-pinterest';
        else if (filename.startsWith('pp_placeholder') || filename.includes('placeholder')) source = 'placeholder';
        else source = 'local';
    } else {
        // external or missing
        if (image_url.includes('pixabay.com')) source = 'pixabay-external';
        else if (image_url.includes('pinimg.com') || image_url.includes('pinterest.com')) source = 'pinterest-external';
        else if (image_url.includes('/images/products/')) source = 'missing-local';
        else source = 'external';
    }
    rows.push([p.id || '', image_url.replace(/\n/g, ' '), filename, sha, source]);
}

const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
fs.writeFileSync(path.resolve(OUT_DIR, 'image-mapping.csv'), csv, 'utf8');
console.log('Wrote', path.resolve(OUT_DIR, 'image-mapping.csv'));

// create HTML review page (first 20 products)
const sample = products.slice(0, 20);
let html = `<!doctype html><html><head><meta charset="utf-8"><title>Image Review</title><style>body{font-family:Arial,sans-serif} .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px} .card{background:#fff;padding:8px;border:1px solid #eee} img{width:100%;height:160px;object-fit:cover;background:#f5f4f2}</style></head><body><h1>Product image review (first ${sample.length})</h1><div class="grid">`;
for (const p of sample) {
    const image_url = p.image_url || '';
    const filename = extractLocalFilename(image_url);
    const localPath = filename ? `/images/products/${filename}` : image_url;
    html += `<div class="card"><h4>${p.id} — ${p.name}</h4><a href="${localPath}" target="_blank"><img src="${localPath}" alt="${p.name}"/></a><p>${(image_url || '').replace(/"/g, '')}<br/><small>${filename || '(external)'}</small></p></div>`;
}
html += `</div></body></html>`;
fs.writeFileSync(PUBLIC_OUT, html, 'utf8');
fs.writeFileSync(path.resolve(OUT_DIR, 'image-review.html'), html, 'utf8');
console.log('Wrote review HTML to', PUBLIC_OUT, 'and', path.resolve(OUT_DIR, 'image-review.html'));

console.log('Done.');
