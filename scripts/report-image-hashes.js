import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const productsJsonPath = path.resolve('./entities/products-data.json');
const outPath = path.resolve('./artifacts/image-hash-report.json');

function sha256(filePath) {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
}

if (!fs.existsSync(productsJsonPath)) {
    console.error('products-data.json not found at', productsJsonPath);
    process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
const report = [];
for (const p of products) {
    // support common fields: image_url, image, imageUrl, img, photo
    const rawImg = p.image_url || p.image || p.imageUrl || p.img || p.photo || '';
    const imgRel = String(rawImg || '').replace(/^\//, '');
    const imgPath = path.resolve('./public', imgRel);
    let hash = null;
    let exists = false;
    try {
        if (fs.existsSync(imgPath)) {
            exists = true;
            hash = sha256(imgPath);
        }
    } catch (e) {
        // ignore
    }
    report.push({ id: p.id || p.productId || p.sku || null, title: p.title || p.name || null, image: imgRel || null, path: exists ? imgPath : null, exists, sha256: hash });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log('Wrote report to', outPath);

// Print duplicate groups summary
const groups = {};
for (const r of report) {
    if (!r.sha256) continue;
    groups[r.sha256] = groups[r.sha256] || [];
    groups[r.sha256].push(r);
}

let dupCount = 0;
for (const [hash, items] of Object.entries(groups)) {
    if (items.length > 1) {
        dupCount += 1;
        console.log(`\nDUPLICATE HASH ${hash} -> ${items.length} files`);
        for (const it of items) {
            console.log(` - ${it.id} : ${it.image}`);
        }
    }
}
if (dupCount === 0) console.log('No duplicates found');
else console.log('\nTotal duplicate groups:', dupCount);
