// lego.tr keşfi (3): liste sayfaları ürün kartı içeriyor mu, ürün JSON-LD'sinde "offers" var mı.
const BASE = 'https://lego.tr';
const UA = 'PlutonBot/1.0 (+https://github.com/tahatas013/pluton; kisisel LEGO koleksiyon uygulamasi)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(path) {
  const url = path.startsWith('http') ? path : BASE + path;
  await sleep(700);
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'tr-TR,tr;q=0.9' } });
  const text = await r.text();
  console.log(`\n=== ${url} → ${r.status} (${text.length} bayt)`);
  return text;
}
const count = (t, s) => t.split(s).length - 1;

const p = await get('/product/76786-lego-wednesday-morticianin-evi');
const ld = (p.match(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/) || [])[1] || '';
const oi = ld.indexOf('"offers"');
console.log('  offers:', oi >= 0 ? ld.slice(oi, oi + 900) : 'yok');
for (const k of ['"sku"', '"mpn"', '"gtin', '"brand"', '"category"']) {
  const i = ld.indexOf(k);
  if (i >= 0) console.log(`  ${k}:`, ld.slice(i, i + 160));
}

for (const path of ['/themes/star-wars', '/yeni-urunler', '/themes/star-wars?pg=2', '/arama?q=lego']) {
  const t = await get(path);
  console.log(`  /product/ bağlantısı: ${count(t, '/product/')}, product-price: ${count(t, 'product-price')}, Tükendi: ${count(t, 'Tükendi')}, out-stock: ${count(t, 'out-stock')}, in-stock: ${count(t, 'in-stock')}`);
  const i = t.indexOf('product-price');
  if (i >= 0) console.log('  ilk fiyat çevresi:', t.slice(Math.max(0, i - 1500), i + 400).replace(/\s+/g, ' '));
  const pag = [...new Set([...t.matchAll(/(?:href|data-url|data-page)="([^"]*)"/g)].map((m) => m[1]).filter((u) => /pg=|page=|sayfa|PageNumber|pageNo/i.test(u)))];
  console.log('  sayfalama:', pag.slice(0, 12).join('  ') || '-');
  const total = t.match(/(\d[\d.]*)\s*(?:adet\s*)?(?:ürün|Ürün)\s*(?:bulundu|listeleniyor)?/);
  console.log('  toplam ipucu:', total ? total[0] : '-');
  const more = t.match(/[^<>]{0,200}(?:Daha Fazla|daha fazla|Load More|loadMore|infinite)[^<>]{0,200}/);
  console.log('  daha fazla:', more ? more[0].replace(/\s+/g, ' ') : '-');
}
