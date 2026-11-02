// Rebrickable'ın herkese açık CSV dökümlerinden Plüton kataloğunu üretir ve
// lego.tr verisiyle (public/data/tr.json, varsa) birleştirir.
// GitHub Actions'ta her gün çalışır; çıktı: public/data/catalog.json
//
// Çıktı biçimi (yer kazanmak için diziler):
//   themes: [id, ad, üstTemaId | null]
//   sets:   [setNo, ad, yıl, temaId, parça, minifigür, görsel, türkiye]
//   görsel:  1 = standart Rebrickable yolu, 0 = yok, "sets/.." = Rebrickable media yolu, "https://.." = tam adres
//   türkiye: 0 = lego.tr'de yok, yoksa [durum, fiyatTL, yol, türkçeAd, yaş, satışaÇıkış]
//            durum: "s" stokta, "t" tükendi, "o" ön sipariş

import { gunzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://cdn.rebrickable.com/media/downloads/';
const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(DIR, '../public/data/catalog.json');
const TR_FILE = resolve(DIR, '../public/data/tr.json');

// Set olmayan ya da tüketiciye satılmayan ürünlerin ana temaları
const EXCLUDED_ROOTS = new Set(
  ['Bulk Bricks', 'Service Packs', 'Supplemental', 'Video Games', 'Clikits', 'Educational and Dacta'].map((s) =>
    s.toLowerCase(),
  ),
);
// Aksesuar/kitap gibi ürünler: yalnızca yeni olanlar (resmi sitede hâlâ satılıyor olabilir) ya da lego.tr'dekiler
const MERCH_ROOTS = new Set(['Gear', 'Books', 'Key Chains', 'Magnets'].map((s) => s.toLowerCase()));

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function download(name) {
  const url = `${BASE}${name}.csv.gz`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} indirilemedi: HTTP ${res.status}`);
  const text = gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8');
  const rows = parseCSV(text);
  console.log(`  ${name}: ${rows.length} satır`);
  return rows;
}

console.log('Rebrickable verileri indiriliyor…');
const [themesRaw, setsRaw, inventories, invFigs] = await Promise.all([
  download('themes'),
  download('sets'),
  download('inventories'),
  download('inventory_minifigs'),
]);

const trRaw = existsSync(TR_FILE) ? JSON.parse(readFileSync(TR_FILE, 'utf8')) : null;
// v1 dosyalarında set numarası yanlış eşleşebiliyordu; yalnızca v2 ve sonrası kullanılır
const tr = trRaw && trRaw.v >= 2 ? trRaw : { items: {}, generated: null };
const trItems = tr.items ?? {};
console.log(`lego.tr verisi: ${Object.keys(trItems).length} ürün (${tr.generated ?? 'yok'})`);
const trUsed = new Set();

const themeById = new Map();
for (const t of themesRaw) {
  themeById.set(Number(t.id), { id: Number(t.id), name: t.name, parent: t.parent_id ? Number(t.parent_id) : null });
}
const rootOf = (id) => {
  let t = themeById.get(id);
  let guard = 0;
  while (t && t.parent != null && guard++ < 10) t = themeById.get(t.parent);
  return t;
};

// Her setin ilk envanterindeki minifigür sayısı
const firstInventory = new Map();
for (const inv of inventories) {
  const v = Number(inv.version);
  const cur = firstInventory.get(inv.set_num);
  if (!cur || v < cur.version) firstInventory.set(inv.set_num, { id: inv.id, version: v });
}
const figsByInventory = new Map();
for (const f of invFigs) {
  figsByInventory.set(f.inventory_id, (figsByInventory.get(f.inventory_id) ?? 0) + Number(f.quantity || 0));
}

const maxYear = Math.max(...setsRaw.map((s) => Number(s.year) || 0).filter((y) => y <= new Date().getFullYear() + 1));
const recentCut = Math.min(new Date().getFullYear(), maxYear) - 1;

const allNums = new Set(setsRaw.map((s) => s.set_num));
const usedThemes = new Set();
const sets = [];
const trTuple = (t) => (t ? [t[0], t[1], t[2], t[3], t[6] ?? null, t[8] ?? null] : 0);
const markTheme = (themeId) => {
  for (let t = themeById.get(themeId), g = 0; t && g < 10; t = themeById.get(t.parent), g++) usedThemes.add(t.id);
};

for (const s of setsRaw) {
  const parts = Number(s.num_parts);
  const year = Number(s.year);
  const themeId = Number(s.theme_id);
  const root = rootOf(themeId);
  if (!root) continue;
  const rootName = root.name.toLowerCase();

  // 75192-2 gibi varyantları, 75192-1 varsa atla
  const m = /^(.*)-(\d+)$/.exec(s.set_num);
  if (m && Number(m[2]) > 1 && allNums.has(`${m[1]}-1`)) continue;
  const base = m && m[2] === '1' ? m[1] : s.set_num;
  const t = trItems[base];

  const regular = !EXCLUDED_ROOTS.has(rootName) && !MERCH_ROOTS.has(rootName) && parts > 0;
  const recentMerch = MERCH_ROOTS.has(rootName) && year >= recentCut;
  if (!regular && !recentMerch && !t) continue;
  if (t) trUsed.add(base);

  const inv = firstInventory.get(s.set_num);
  const figs = inv ? (figsByInventory.get(inv.id) ?? 0) : 0;

  let img = 0;
  if (s.img_url) {
    const standard = `https://cdn.rebrickable.com/media/sets/${s.set_num}.jpg`;
    if (s.img_url === standard) img = 1;
    else if (s.img_url.startsWith('https://cdn.rebrickable.com/media/'))
      img = s.img_url.slice('https://cdn.rebrickable.com/media/'.length);
  }
  if (!img && t?.[4]) img = t[4];

  sets.push([s.set_num, s.name, year, themeId, parts || t?.[5] || 0, figs, img, trTuple(t)]);
  markTheme(themeId);
}

// lego.tr'de olup Rebrickable'da henüz olmayan ürünler (çok yeni setler, aksesuarlar)
const norm = (x) => x.toLowerCase().replace(/lego|[®™]/g, '').replace(/[^a-z0-9]+/g, '');
// lego.tr kategorisini Rebrickable temasıyla eşle (önce ana temalar, sonra alt temalar)
const rootByName = new Map();
for (const t of themeById.values()) if (t.parent != null && !rootByName.has(norm(t.name))) rootByName.set(norm(t.name), t.id);
for (const t of themeById.values()) if (t.parent == null) rootByName.set(norm(t.name), t.id);
for (const [alias, target] of [['iconic', 'icons'], ['dcsuperheroes', 'superheroesdc'], ['marvelsuperheroes', 'superheroesmarvel'], ['anahtarliklar', 'keychains']]) {
  if (!rootByName.has(alias) && rootByName.has(target)) rootByName.set(alias, rootByName.get(target));
}
const extraThemes = new Map();
let trOnly = 0;
for (const [sku, t] of Object.entries(trItems)) {
  if (trUsed.has(sku)) continue;
  const cat = t[7] || 'Diğer';
  let themeId = rootByName.get(norm(cat));
  if (themeId == null) {
    themeId = extraThemes.get(cat);
    if (themeId == null) {
      themeId = -1 - extraThemes.size;
      extraThemes.set(cat, themeId);
    }
  } else markTheme(themeId);
  const year = t[8] ? Number(t[8].slice(0, 4)) : new Date().getFullYear();
  const num = /^\d+$/.test(sku) ? `${sku}-1` : sku;
  sets.push([num, t[3], year, themeId, t[5] ?? 0, 0, t[4] ?? 0, trTuple(t)]);
  trOnly++;
}

if (sets.length < 5000) {
  throw new Error(`Beklenenden az set bulundu (${sets.length}). Rebrickable biçimi değişmiş olabilir.`);
}

sets.sort((a, b) => b[2] - a[2] || b[4] - a[4]);

const themes = [
  ...[...themeById.values()].filter((t) => usedThemes.has(t.id)).map((t) => [t.id, t.name, t.parent]),
  ...[...extraThemes].map(([name, id]) => [id, name, null]),
];

const catalog = {
  v: 2,
  source: 'rebrickable',
  generated: new Date().toISOString(),
  trGenerated: tr.generated ?? null,
  themes,
  sets,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(catalog));
console.log(`Katalog hazır: ${sets.length} set, ${themes.length} tema → ${OUT}`);
console.log(`  lego.tr ile eşleşen: ${trUsed.size}, yalnızca lego.tr'de olan: ${trOnly}`);

// Kısa özet (CI kayıtlarından kontrol etmek için)
const nowYear = new Date().getFullYear();
for (let y = nowYear + 1; y >= nowYear - 2; y--) {
  const ys = sets.filter((s) => s[2] === y);
  console.log(`  ${y}: ${ys.length} set, Türkiye'de ${ys.filter((s) => s[7]).length}`);
}
const imgKinds = { standart: 0, ozel: 0, yok: 0 };
for (const s of sets) imgKinds[s[6] === 1 ? 'standart' : s[6] === 0 ? 'yok' : 'ozel']++;
console.log('  görseller:', JSON.stringify(imgKinds));
if (extraThemes.size) console.log('  yeni temalar:', [...extraThemes.keys()].join(', '));
