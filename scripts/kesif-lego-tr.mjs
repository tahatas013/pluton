// lego.tr keşfi (2): ürün sayfası, tema listesi, llms.txt. Çıktı yalnızca CI kaydına yazılır.
const BASE = 'https://lego.tr';
const UA = 'PlutonBot/1.0 (+https://github.com/tahatas013/pluton; kisisel LEGO koleksiyon uygulamasi)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
  const url = path.startsWith('http') ? path : BASE + path;
  await sleep(700);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'tr-TR,tr;q=0.9' } });
    const text = await r.text();
    console.log(`\n=== ${url} → ${r.status} (${text.length} bayt)`);
    return { status: r.status, text };
  } catch (e) {
    console.log(`\n=== ${url} → HATA ${e.message}`);
    return { status: 0, text: '' };
  }
}

function productData(html) {
  const m = html.match(/window\['PRODUCT_DATA'\]\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/) || html.match(/PRODUCT_DATA'\]\s*=\s*(\[[\s\S]*?\]);/);
  return m ? m[1] : null;
}

const llms = await get('/llms.txt');
console.log(llms.text.slice(0, 6000));

const sm = await get('/xml/sitemap/product.xml');
const firstUrl = sm.text.match(/<url>[\s\S]*?<\/url>/);
console.log('  ilk <url> kaydı:', firstUrl ? firstUrl[0].slice(0, 1500) : '-');
const locs = [...sm.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]).filter((u) => u.includes('/product/'));
const withNum = locs.filter((u) => /\/product\/\d{4,7}-/.test(u));
console.log(`  ürün adresi: ${locs.length}, numaralı: ${withNum.length}, numarasız örnekler: ${locs.filter((u) => !/\/product\/\d{4,7}-/.test(u)).slice(0, 12).join('  ')}`);

for (const path of ['/product/21028-lego-architecture-new-york-city', withNum[withNum.length - 1]]) {
  const p = await get(path);
  const pd = productData(p.text);
  console.log('  PRODUCT_DATA:', pd ? pd.slice(0, 2500) : '-');
  const ld = [...p.text.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1].trim());
  ld.forEach((b, i) => console.log(`  JSON-LD ${i}:`, b.slice(0, 2000)));
  for (const kw of ['Tükendi', 'tukendi', 'Stokta', 'Sepete Ekle', 'Gelince Haber', 'Yakında', 'og:image']) {
    const i = p.text.indexOf(kw);
    if (i >= 0) console.log(`  "${kw}" çevresi:`, p.text.slice(Math.max(0, i - 160), i + 160).replace(/\s+/g, ' '));
  }
}

const list = await get('/themes/star-wars');
const lpd = productData(list.text);
console.log('  liste PRODUCT_DATA uzunluk:', lpd ? lpd.length : 0);
console.log('  liste PRODUCT_DATA başı:', lpd ? lpd.slice(0, 2000) : '-');
const pages = [...new Set([...list.text.matchAll(/href="([^"]*(?:pg|page|sayfa)=\d+[^"]*)"/g)].map((m) => m[1]))];
console.log('  sayfalama bağlantıları:', pages.slice(0, 10).join('  '));
const cnt = list.text.match(/(\d+)\s*(?:ürün|Ürün)/);
console.log('  ürün sayısı ipucu:', cnt ? cnt[0] : '-');
