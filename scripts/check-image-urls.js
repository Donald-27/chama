import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ENTITIES_PATH = path.resolve(__dirname, '../entities/products-data.json');

async function check(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return { ok: res.ok, status: res.status };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

async function main() {
    const raw = fs.readFileSync(ENTITIES_PATH, 'utf8');
    const products = JSON.parse(raw);
    const urls = products
        .map(p => ({ id: p.id, url: p.image_url }))
        .filter(p => p.url && p.url.startsWith('http'));

    let okCount = 0;
    let errCount = 0;
    const errors = [];

    for (const u of urls) {
        const res = await check(u.url);
        if (res.ok) {
            okCount++;
        } else {
            errCount++;
            errors.push({ id: u.id, url: u.url, error: res.error || res.status });
            console.log('ERR', u.id, u.url, res.error || res.status);
        }
    }

    console.log(`Checked ${urls.length} URLs — OK: ${okCount}, ERR: ${errCount}`);
    if (errors.length) {
        console.log('Sample errors:', errors.slice(0, 10));
    }
}

main().catch(e => { console.error(e); process.exit(1); });
