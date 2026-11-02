// Resmi Türkiye mağazası lego.tr'den her ürünün fiyatını ve stok durumunu okur.
// Çıktı: public/data/tr.json  (build-catalog.mjs bunu set kataloğuyla birleştirir)
//
// Nezaket kuralları: robots.txt ürün sayfalarına izin veriyor ve kendini dürüstçe
// tanıtan bir User-Agent istiyor. Aynı anda en fazla 2 istek, aralarda bekleme.
// lego.tr'ye ulaşılamazsa yayındaki bir önceki tr.json kullanılır; yayın asla
// bu adım yüzünden durmaz.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://lego.tr';
const UA = 'PlutonBot/1.0 (+https://github.com/tahatas013/pluton; kisisel LEGO koleksiyon uygulamasi)';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/tr.json');
const LIVE = process.env.PLUTON_LIVE_URL; // ör. https://tahatas013.github.io/pluton/
const WORKERS = 2;
const GAP_MS = 350;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: { 'user-agent': UA, 'accept-language': 'tr-TR,tr;q=0.9' },
        signal: AbortSignal.timeout(25000),
      });
      if (r.status === 429 || r.status >= 500) {
        await sleep(3000 * (i + 1));
        continue;
      }
      return { status: r.status, text: await r.text() };
    } catch {
      await sleep(2000 * (i + 1));
    }
  }
  return { status: 0, text: '' };
}

const clean = (s) => String(s ?? '').replace(/[®™]/g, '').replace(/\s+/g, ' ').trim();

export function parseProduct(html, url) {
  let prod = null;
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const graph = Array.isArray(j['@graph']) ? j['@graph'] : [j];
      prod = graph.find((x) => x && x['@type'] === 'Product') ?? prod;
    } catch {
      /* bozuk blok */
    }
  }
  if (!prod) return null;

  const offer = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
  const priceNum = Number(offer?.price);
  const av = String(offer?.availability ?? '').split('/').pop();
  const status = /InStock|LimitedAvailability|OnlineOnly|InStoreOnly/.test(av)
    ? 's'
    : /PreOrder|BackOrder|PreSale/.test(av)
      ? 'o'
      : 't';

  const rawName = clean(prod.name);
  const path = new URL(url).pathname;
  const slug = path.split('/').pop();
  // JSON-LD'deki "sku" bazı ürünlerde mağazanın iç numarası; set numarası adres ve addan alınır
  const fromSlug = slug.match(/^(\d{3,7})-/)?.[1];
  const fromName = rawName.match(/^(\d{3,7})\s/)?.[1];
  const sku = fromSlug || fromName || `tr-${slug}`;

  const name = rawName.replace(/^\d{3,7}\s+/, '').replace(/^LEGO\s+/i, '').trim();
  const image = Array.isArray(prod.image) ? prod.image[0] : (prod.image?.url ?? prod.image ?? null);
  // Parça ve yaş yalnızca ana ürünün simge alanından okunur (sayfadaki diğer kartlardan değil)
  const at = html.indexOf('product-symbols');
  const zone = at >= 0 ? html.slice(at, at + 5000) : '';
  const pieces = zone.match(/ti-piece"?[^>]*>\s*<\/i>\s*(?:<[^>]+>\s*)*?([\d.]+)\s*</);
  const age = zone.match(/ti-birthday"?[^>]*>\s*<\/i>\s*(?:<[^>]+>\s*)*?(\d[^<]{0,8}?)\s*</);
  const category = clean(String(prod.category ?? '').split('>').pop()).replace(/^LEGO\s*/i, '');

  return {
    sku,
    status,
    price: Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : null,
    path,
    name,
    image: typeof image === 'string' ? image : null,
    pieces: pieces ? Number(pieces[1].replace(/\./g, '')) : null,
    age: age ? clean(age[1]) : null,
    category,
    since: typeof offer?.validFrom === 'string' ? offer.validFrom.slice(0, 10) : null,
  };
}

async function scrape() {
  const sm = await get(`${BASE}/xml/sitemap/product.xml`);
  const urls = [
    ...new Set(
      // Ürün site haritasındaki her adres bir ürün; yeni ürünlerin adresinde "/product/" yok
      [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter((u) => /^https:\/\/(www\.)?lego\.tr\/./.test(u)),
    ),
  ];
  console.log(`Site haritası: ${sm.status}, ${urls.length} ürün adresi`);
  if (urls.length < 200) throw new Error('Ürün site haritası beklenenden kısa');

  const items = {};
  let next = 0, failed = 0, unparsed = 0;
  const samples = [];
  const started = Date.now();

  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      const r = await get(url);
      if (r.status !== 200) failed++;
      else {
        const p = parseProduct(r.text, url);
        if (!p) unparsed++;
        else {
          const prev = items[p.sku];
          // Aynı numara iki kez varsa stoktakini, sonra ucuz olanı tut
          const better = !prev || (p.status === 's' && prev.status !== 's') || (p.status === prev.status && (p.price ?? 1e9) < (prev.price ?? 1e9));
          if (better) items[p.sku] = p;
          if ((samples.length < 3 && /^\d+$/.test(p.sku)) || ['76786', '60503'].includes(p.sku)) samples.push(p);
          if (p.sku === '76786') {
            // Yaş/parça alanının yapısını kayıtta görmek için (geçici)
            for (const k of ['product-symbols', 'ti-birthday', 'ti-piece', 'Parça', 'Yaş']) {
              const at = r.text.indexOf(k, r.text.indexOf('application/ld+json'));
              if (at >= 0) console.log(`  [yapı] ${k}:`, r.text.slice(at - 120, at + 380).replace(/\s+/g, ' '));
            }
          }
        }
      }
      if (next % 250 === 0) console.log(`  ${next}/${urls.length} (${Math.round((Date.now() - started) / 1000)} sn)`);
      await sleep(GAP_MS);
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, worker));

  const list = Object.values(items);
  console.log(`Okunan: ${list.length} ürün · hata: ${failed} · ayrıştırılamayan: ${unparsed}`);
  console.log(`  stokta: ${list.filter((x) => x.status === 's').length}, tükendi: ${list.filter((x) => x.status === 't').length}, ön sipariş: ${list.filter((x) => x.status === 'o').length}`);
  for (const s of samples) console.log('  örnek:', JSON.stringify(s));
  console.log(`  set numaralı: ${list.filter((x) => /^\d+$/.test(x.sku)).length}, parça bilgili: ${list.filter((x) => x.pieces).length}, yaş bilgili: ${list.filter((x) => x.age).length}`);
  if (failed > urls.length * 0.2 || list.length < 150) throw new Error('Çok fazla ürün okunamadı');

  return {
    v: 2,
    source: 'lego.tr',
    generated: new Date().toISOString(),
    items: Object.fromEntries(
      list.map((p) => [p.sku, [p.status, p.price, p.path, p.name, p.image, p.pieces, p.age, p.category, p.since]]),
    ),
  };
}

async function fallback(reason) {
  console.warn(`lego.tr okunamadı (${reason}). Yayındaki önceki veri kullanılacak.`);
  if (LIVE) {
    const r = await get(new URL('data/tr.json', LIVE).href, 2);
    if (r.status === 200) {
      try {
        const prev = JSON.parse(r.text);
        if (prev?.items && prev.v >= 2) {
          console.log(`  önceki veri: ${Object.keys(prev.items).length} ürün, ${prev.generated}`);
          return prev;
        }
      } catch {
        /* bozuk dosya */
      }
    }
  }
  console.warn('  önceki veri de yok; Türkiye bilgisi bu yayında boş kalacak.');
  return { v: 2, source: 'lego.tr', generated: null, items: {} };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let data;
  try {
    data = await scrape();
  } catch (e) {
    data = await fallback(e.message);
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data));
  console.log(`tr.json yazıldı → ${OUT}`);
}
