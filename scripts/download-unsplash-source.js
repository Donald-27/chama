#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const ENTITIES = path.join(ROOT, 'entities', 'products-data.json');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function buildUnsplashSourceUrl(product) {
  const parts = [product.name || 'product'];
  if (product.brand) parts.push(product.brand);
  if (!product.brand && product.category) parts.push(product.category);
  const query = encodeURIComponent(parts.join(' '));
  return `https://source.unsplash.com/1200x1200/?${query}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  let ext = '.jpg';
  if (contentType.includes('png')) ext = '.png';
  else if (contentType.includes('webp')) ext = '.webp';
  const buffer = await res.arrayBuffer();
  await fs.writeFile(dest, Buffer.from(buffer));
  return ext;
}

(async function main(){
  console.log('Starting Unsplash Source download for products...');
  await ensureDir(OUT_DIR);
  const raw = await fs.readFile(ENTITIES, 'utf8');
  const products = JSON.parse(raw);

  for (const p of products) {
    try {
      const sourceUrl = buildUnsplashSourceUrl(p);
      console.log(`Fetching for ${p.id}: ${sourceUrl}`);
      // fetch and save
      const tempRes = await fetch(sourceUrl);
      if (!tempRes.ok) {
        console.warn(`Warning: fetch returned ${tempRes.status} for ${sourceUrl}`);
        continue;
      }
      const contentType = tempRes.headers.get('content-type') || '';
      let ext = '.jpg';
      if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('webp')) ext = '.webp';
      const buffer = await tempRes.arrayBuffer();
      const filename = `${p.id}${ext}`;
      const outPath = path.join(OUT_DIR, filename);
      await fs.writeFile(outPath, Buffer.from(buffer));
      p.image_url = `/images/products/${filename}`;
      console.log('Saved', outPath);

      // polite pause
      await sleep(400);
    } catch (err) {
      console.warn('Failed for', p.id, err.message);
    }
  }

  await fs.writeFile(ENTITIES, JSON.stringify(products, null, 2));
  console.log('Updated products-data.json with local image paths');
})();
