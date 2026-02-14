const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'entities', 'products-data.json');
const publicImages = path.join(__dirname, '..', 'public', 'images', 'products');

const backupPath = dataPath + '.remote-backup-' + Date.now();

let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
fs.copyFileSync(dataPath, backupPath);
console.log('Backup created at', backupPath);

let changed = 0;

for (let p of data) {
    if (!p.id) continue;
    const id = p.id.toLowerCase();
    const candidates = [`${id}.jpg`, `${id}.png`, `${id}.jpeg`];
    let found = null;
    for (const c of candidates) {
        const fp = path.join(publicImages, c);
        if (fs.existsSync(fp)) { found = `/images/products/${c}`; break; }
    }
    if (found) {
        if (p.image_url !== found) {
            p.image_url = found;
            changed++;
        }
    }
}

if (changed > 0) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", 'utf8');
    console.log('Updated', changed, 'products to use local images');
} else {
    console.log('No changes made');
}
