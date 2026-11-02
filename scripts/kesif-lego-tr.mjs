// lego.tr'nin yapısını anlamak için tek seferlik keşif: robots.txt, site haritası,
// altyapı ipuçları ve örnek bir ürün sayfası. Çıktı yalnızca CI kaydına yazılır.
const BASE = 'https://lego.tr';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

async function get(path) {
  const url = path.startsWith('http') ? path : BASE + path;
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'tr-TR,tr;q=0.9' }, redirect: 'follow' });
    const text = await r.text();
    console.log(`\n=== ${url} → ${r.status} (${text.length} bayt) son adres: ${r.url}`);
    for (const h of ['server', 'x-powered-by', 'content-type', 'cf-ray', 'x-shopid', 'x-cache']) {
      const v = r.headers.get(h);
      if (v) console.log(`  ${h}: ${v}`);
    }
    return { status: r.status, text, url: r.url };
  } catch (e) {
    console.log(`\n=== ${url} → HATA ${e.message}`);
    return { status: 0, text: '', url };
  }
}

const robots = await get('/robots.txt');
console.log(robots.text.slice(0, 2500));

const home = await get('/');
const sigs = ['Shopify', 'cdn.shopify', 'ikas', 'ticimax', 'tsoft', 'T-Soft', 'ideasoft', '__NEXT_DATA__', '__NUXT__', 'application/ld+json', 'woocommerce', 'magento', 'vtex', 'salesforce', 'demandware', 'sfcc', 'akinon', 'Akinon'];
console.log('  imzalar:', sigs.filter((s) => home.text.includes(s)).join(', ') || '-');
console.log('  <head> başı:', home.text.slice(0, 1500).replace(/\s+/g, ' '));
const links = [...new Set([...home.text.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))];
console.log('  bağlantı sayısı:', links.length);
console.log('  örnek bağlantılar:', links.filter((l) => !/\.(css|js|png|svg|ico|woff)/.test(l)).slice(0, 60).join('  '));

const maps = [...robots.text.matchAll(/sitemap:\s*(\S+)/gi)].map((m) => m[1]);
if (!maps.length) maps.push(BASE + '/sitemap.xml');
let productUrl = null;
for (const m of maps.slice(0, 3)) {
  const sm = await get(m);
  const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
  console.log(`  <loc> sayısı: ${locs.length}`);
  console.log('  ilk adresler:', locs.slice(0, 15).join('  '));
  for (const sub of locs.filter((l) => /\.xml/.test(l)).slice(0, 6)) {
    const s2 = await get(sub);
    const l2 = [...s2.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
    console.log(`  alt harita <loc>: ${l2.length}; örnek: ${l2.slice(0, 8).join('  ')}`);
    console.log('  lastmod örneği:', (s2.text.match(/<lastmod>[^<]+<\/lastmod>/) || ['-'])[0]);
    productUrl ??= l2.find((u) => /\d{4,6}/.test(u));
  }
  productUrl ??= locs.find((u) => /\d{4,6}/.test(u) && !/\.xml/.test(u));
}

if (home.text.includes('Shopify')) {
  const pj = await get('/products.json?limit=3');
  console.log(pj.text.slice(0, 3000));
}

productUrl ??= links.find((l) => /\d{5}/.test(l));
if (productUrl) {
  const p = await get(productUrl);
  const ld = [...p.text.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1].trim());
  console.log(`  JSON-LD blok sayısı: ${ld.length}`);
  ld.forEach((b, i) => console.log(`  JSON-LD ${i}:`, b.slice(0, 1500)));
  for (const kw of ['price', 'fiyat', 'stok', 'stock', 'availability', 'sku', 'tükendi', 'Sepete']) {
    const i = p.text.indexOf(kw);
    if (i >= 0) console.log(`  "${kw}" çevresi:`, p.text.slice(Math.max(0, i - 200), i + 250).replace(/\s+/g, ' '));
  }
}
