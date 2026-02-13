#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const ENTITIES = path.join(ROOT, 'entities', 'products-data.json');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const CATEGORY_PHOTO_ARRAY = {
  shampoo: [
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80',
    'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=1200&q=80',
    'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=1200&q=80'
  ],
  conditioner: [
    'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?w=1200&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80'
  ],
  styling: [
    'https://images.unsplash.com/photo-1495121605193-b116b5b09e36?w=1200&q=80',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80'
  ],
  treatment: [
    'https://images.unsplash.com/photo-1481029031798-8c3f9d8c6be1?w=1200&q=80',
    'https://images.unsplash.com/photo-1515165562835-c7f7b8f6f8d9?w=1200&q=80'
  ],
  sets: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80'
  ],
  tools: [
    'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51a?w=1200&q=80'
  ],
  supplements: [
    'https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&q=80'
  ],
  colour: [
    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=1200&q=80'
  ],
  default: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80']
};

function indexFromId(id, len) {
  const m = String(id || '').match(/\d+/);
  const n = m ? parseInt(m[0],10) : Math.floor(Math.random()*1000);
  return ((n-1) % len + len) % len;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${res.status}`);
  const ct = res.headers.get('content-type')||'';
  let ext = '.jpg';
  if (ct.includes('png')) ext = '.png';
  else if (ct.includes('webp')) ext = '.webp';
  const data = await res.arrayBuffer();
  await fs.writeFile(dest+ext, Buffer.from(data));
  return ext;
}

(async function main(){
  console.log('Downloading curated images...');
  await ensureDir(OUT_DIR);
  const raw = await fs.readFile(ENTITIES,'utf8');
  const products = JSON.parse(raw);

  for (const p of products) {
    const cat = (p.category||'').toLowerCase();
    const arr = CATEGORY_PHOTO_ARRAY[cat] || CATEGORY_PHOTO_ARRAY.default;
    const idx = indexFromId(p.id, arr.length);
    const url = arr[idx];
    const basename = path.join(OUT_DIR, p.id);
    try {
      console.log('Downloading', p.id, url);
      const ext = await download(url, basename);
      p.image_url = `/images/products/${p.id}${ext}`;
      console.log('Saved', p.id+ext);
    } catch (err) {
      console.warn('Error', p.id, err.message);
    }
    await sleep(300);
  }

  await fs.writeFile(ENTITIES, JSON.stringify(products, null, 2));
  console.log('Done. products-data.json updated.');
})();
