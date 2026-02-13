#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const UNSPLASH_KEY = process.env.VITE_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_KEY = process.env.VITE_PEXELS_API_KEY || process.env.PEXELS_API_KEY;
const PIXABAY_KEY = process.env.VITE_PIXABAY_API_KEY || process.env.PIXABAY_API_KEY;

const ROOT = path.resolve(process.cwd());
const ENTITIES = path.join(ROOT, 'entities', 'products-data.json');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function queryUnsplash(query) {
  if (!UNSPLASH_KEY) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=squarish`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (body.results && body.results.length) return body.results.map(r => r.urls.raw + '&w=1200&q=80');
  return null;
}

async function queryPexels(query) {
  if (!PEXELS_KEY) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=square`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) return null;
  const body = await res.json();
  if (body.photos && body.photos.length) return body.photos.map(p => p.src.large);
  return null;
}

async function queryPixabay(query) {
  if (!PIXABAY_KEY) return null;
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.json();
  if (body.hits && body.hits.length) return body.hits.map(h => h.largeImageURL);
  return null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  await fs.writeFile(dest, Buffer.from(buffer));
}

(async function main(){
  await ensureDir(OUT_DIR);
  const raw = await fs.readFile(ENTITIES, 'utf8');
  const products = JSON.parse(raw);

  for (const p of products) {
    const query = `${p.name} ${p.brand || ''} product`;
    console.log('Searching for:', query);
    let urls = await queryUnsplash(query);
    if (!urls) {
      urls = await queryPexels(query);
    }
    if (!urls) {
      urls = await queryPixabay(query);
    }

    if (!urls || !urls.length) {
      // fallback: search by category
      const catQuery = `${p.category} product`;
      urls = await queryUnsplash(catQuery) || await queryPexels(catQuery) || await queryPixabay(catQuery) || [];
    }

    if (urls.length) {
      const chosen = urls[0];
      const ext = path.extname(new URL(chosen).pathname) || '.jpg';
      const filename = `${p.id}${ext}`;
      const outPath = path.join(OUT_DIR, filename);
      try {
        await downloadImage(chosen, outPath);
        // update product image to local path
        p.image_url = `/images/products/${filename}`;
        console.log('Saved', outPath);
      } catch (err) {
        console.warn('Download failed for', chosen, err.message);
      }
      // be nice to API rate limits
      await sleep(500);
    } else {
      console.warn('No images found for', p.id, p.name);
    }
  }

  // write back the products file
  await fs.writeFile(ENTITIES, JSON.stringify(products, null, 2));
  console.log('Updated products-data.json with local image paths');
})();
