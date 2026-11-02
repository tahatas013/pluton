// Rebrickable'ın herkese açık CSV dökümlerinden Plüton kataloğunu üretir.
// GitHub Actions'ta her yayında ve haftada bir çalışır; çıktı: public/data/catalog.json
//
// Çıktı biçimi (yer kazanmak için diziler):
//   themes: [id, ad, üstTemaId | null]
//   sets:   [setNo, ad, yıl, temaId, parçaSayısı, minifigürSayısı, görsel]
//   görsel: 1 = standart Rebrickable yolu, 0 = görsel yok, metin = media/ altındaki özel yol

import { gunzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://cdn.rebrickable.com/media/downloads/';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/catalog.json');

// Set olmayan ürünlerin bulunduğu ana temalar (kitap, anahtarlık, yedek parça paketleri...)
const EXCLUDED_ROOTS = new Set(
  [
    'Books',
    'Gear',
    'Key Chains',
    'Magnets',
    'Bulk Bricks',
    'Service Packs',
    'Supplemental',
    'Video Games',
    'Clikits',
    'Educational and Dacta',
  ].map((s) => s.toLowerCase()),
);

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

const themeById = new Map();
for (const t of themesRaw) {
  themeById.set(Number(t.id), {
    id: Number(t.id),
    name: t.name,
    parent: t.parent_id ? Number(t.parent_id) : null,
  });
}
const rootOf = (id) => {
  let t = themeById.get(id);
  let guard = 0;
  while (t && t.parent != null && guard++ < 10) t = themeById.get(t.parent);
  return t;
};

// Her setin ilk envanterindeki minifigür sayısı
const firstInventory = new Map(); // setNo -> { id, version }
for (const inv of inventories) {
  const v = Number(inv.version);
  const cur = firstInventory.get(inv.set_num);
  if (!cur || v < cur.version) firstInventory.set(inv.set_num, { id: inv.id, version: v });
}
const figsByInventory = new Map();
for (const f of invFigs) {
  figsByInventory.set(f.inventory_id, (figsByInventory.get(f.inventory_id) ?? 0) + Number(f.quantity || 0));
}

const allNums = new Set(setsRaw.map((s) => s.set_num));
const usedThemes = new Set();
const sets = [];

for (const s of setsRaw) {
  const parts = Number(s.num_parts);
  const themeId = Number(s.theme_id);
  const root = rootOf(themeId);
  if (!root || EXCLUDED_ROOTS.has(root.name.toLowerCase())) continue;
  if (!(parts > 0)) continue;

  // 75192-2 gibi varyantları, 75192-1 varsa atla
  const m = /^(.*)-(\d+)$/.exec(s.set_num);
  if (m && Number(m[2]) > 1 && allNums.has(`${m[1]}-1`)) continue;

  const inv = firstInventory.get(s.set_num);
  const figs = inv ? (figsByInventory.get(inv.id) ?? 0) : 0;

  let img = 0;
  if (s.img_url) {
    const standard = `https://cdn.rebrickable.com/media/sets/${s.set_num}.jpg`;
    if (s.img_url === standard) img = 1;
    else if (s.img_url.startsWith('https://cdn.rebrickable.com/media/'))
      img = s.img_url.slice('https://cdn.rebrickable.com/media/'.length);
  }

  sets.push([s.set_num, s.name, Number(s.year), themeId, parts, figs, img]);
  for (let t = themeById.get(themeId), g = 0; t && g < 10; t = themeById.get(t.parent), g++) usedThemes.add(t.id);
}

if (sets.length < 5000) {
  throw new Error(`Beklenenden az set bulundu (${sets.length}). Rebrickable biçimi değişmiş olabilir.`);
}

sets.sort((a, b) => b[2] - a[2] || b[4] - a[4]);

const themes = [...themeById.values()]
  .filter((t) => usedThemes.has(t.id))
  .map((t) => [t.id, t.name, t.parent]);

const catalog = { v: 1, source: 'rebrickable', generated: new Date().toISOString(), themes, sets };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(catalog));
console.log(`Katalog hazır: ${sets.length} set, ${themes.length} tema → ${OUT}`);
