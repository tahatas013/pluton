import { createContext, useContext } from 'react';
import { baseNum, fold } from '../lib/format';
import { themeColor, type BrickColor } from './colors';

export interface LegoSet {
  num: string; // Rebrickable numarası, ör. "75192-1"
  base: string; // Kutudaki numara, ör. "75192"
  name: string;
  year: number;
  theme: number;
  root: number;
  parts: number;
  figs: number;
  img: string | null;
  tr: TrInfo | null; // resmi Türkiye mağazası (lego.tr) bilgisi
  avail: Avail;
}

export interface TrInfo {
  status: 's' | 't' | 'o'; // stokta, tükendi, ön sipariş
  price: number | null; // TL
  url: string;
  name: string; // Türkçe ad
  age: string | null;
  since: string | null; // lego.tr'de satışa çıkış tarihi
}

/**
 * tr: Türkiye'de satışta · tr-out: Türkiye'de tükendi · tr-pre: ön sipariş
 * abroad: yeni ama lego.tr'de yok (yalnızca yurt dışında) · retired: eski, büyük ihtimalle satıştan kalkmış
 * soon: duyurulmuş ama henüz çıkmamış · none: promosyon/hediye gibi satılmayan ürünler
 */
export type Avail = 'tr' | 'tr-out' | 'tr-pre' | 'abroad' | 'soon' | 'retired' | 'none';

export interface Theme {
  id: number;
  name: string;
  parent: number | null;
  root: number;
}

export interface RootTheme {
  id: number;
  name: string;
  count: number;
  recent: number; // son 3 yıldaki set sayısı
  cover: LegoSet | null;
  color: BrickColor;
}

export interface Catalog {
  sets: LegoSet[]; // yeniden eskiye, aynı yılda büyükten küçüğe
  byNum: Map<string, LegoSet>;
  themes: Map<number, Theme>;
  roots: RootTheme[]; // son yıllarda en çok set çıkandan aza
  featured: RootTheme[]; // ana sayfada gösterilecek "gerçek" temalar (promosyonlar hariç)
  rootById: Map<number, RootTheme>;
  latestYear: number;
  generated: string;
  trGenerated: string | null;
  hasTr: boolean; // Türkiye verisi var mı
  source: string;
}

type RawCatalog = {
  v: number;
  source: string;
  generated: string;
  trGenerated?: string | null;
  themes: [number, string, number | null][];
  sets: [string, string, number, number, number, number, number | string, RawTr?][];
};
type RawTr = 0 | ['s' | 't' | 'o', number | null, string, string, string | null, string | null];

const IMG_BASE = 'https://cdn.rebrickable.com/media/';

// Aranabilir ama ana sayfada öne çıkarılmayan temalar (promosyon, mağaza hediyesi vb.)
const NOT_FEATURED = /^(promotional|lego brand store|other|seasonal|miscellaneous|legoland parks|lego exclusive|gear|books|key chains|magnets|service packs|bulk bricks|supplemental)$/i;

function parse(raw: RawCatalog): Catalog {
  const themes = new Map<number, Theme>();
  for (const [id, name, parent] of raw.themes) themes.set(id, { id, name, parent, root: id });
  for (const t of themes.values()) {
    let cur = t;
    for (let g = 0; cur.parent != null && g < 10; g++) {
      const p = themes.get(cur.parent);
      if (!p) break;
      cur = p;
    }
    t.root = cur.id;
  }

  const sets: LegoSet[] = raw.sets.map(([num, name, year, theme, parts, figs, img, t]) => ({
    num,
    base: baseNum(num),
    name,
    year,
    theme,
    root: themes.get(theme)?.root ?? theme,
    parts,
    figs,
    img:
      img === 1
        ? `${IMG_BASE}sets/${num}.jpg`
        : typeof img === 'string' && img
          ? img.startsWith('http')
            ? img
            : IMG_BASE + img
          : null,
    tr: t ? { status: t[0], price: t[1], url: `https://lego.tr${t[2]}`, name: t[3], age: t[4], since: t[5] } : null,
    avail: 'none',
  }));
  const byNum = new Map(sets.map((s) => [s.num, s]));

  const nowYear = new Date().getFullYear();
  const perYear = new Map<number, number>();
  for (const s of sets) perYear.set(s.year, (perYear.get(s.year) ?? 0) + 1);
  let latestYear = nowYear;
  while (latestYear > 1950 && (perYear.get(latestYear) ?? 0) < 20) latestYear--;
  if (latestYear <= 1950) latestYear = Math.max(...perYear.keys());

  const hasTr = sets.some((s) => s.tr);
  for (const s of sets) {
    const rootName = themes.get(s.root)?.name ?? '';
    if (s.tr) s.avail = s.tr.status === 's' ? 'tr' : s.tr.status === 'o' ? 'tr-pre' : 'tr-out';
    else if (NOT_FEATURED.test(rootName)) s.avail = 'none';
    else if (s.year > nowYear) s.avail = 'soon';
    else if (!hasTr) s.avail = 'none'; // Türkiye verisi hiç yoksa yanlış etiket gösterme
    else s.avail = s.year >= latestYear - 1 ? 'abroad' : 'retired';
  }

  const rootById = new Map<number, RootTheme>();
  for (const s of sets) {
    let r = rootById.get(s.root);
    if (!r) {
      const name = themes.get(s.root)?.name ?? 'Diğer';
      r = { id: s.root, name, count: 0, recent: 0, cover: null, color: themeColor(name) };
      rootById.set(s.root, r);
    }
    r.count++;
    if (s.year >= latestYear - 2) {
      r.recent++;
      if (s.img && (!r.cover || s.parts > r.cover.parts)) r.cover = s;
    }
  }
  for (const r of rootById.values()) {
    if (!r.cover) r.cover = sets.find((s) => s.root === r.id && s.img) ?? null;
  }
  const roots = [...rootById.values()].sort((a, b) => b.recent - a.recent || b.count - a.count);
  // Negatif kimlikli temalar yalnızca lego.tr'de olan kategoriler (giyim, çanta…); öne çıkarılmaz
  const featured = roots.filter((r) => !NOT_FEATURED.test(r.name) && r.id > 0);

  return {
    sets,
    byNum,
    themes,
    roots,
    featured,
    rootById,
    latestYear,
    generated: raw.generated,
    trGenerated: raw.trGenerated ?? null,
    hasTr,
    source: raw.source,
  };
}

let pending: Promise<Catalog> | null = null;

export function loadCatalog() {
  pending ??= fetch(`${import.meta.env.BASE_URL}data/catalog.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Katalog yüklenemedi (HTTP ${r.status})`);
      return r.json() as Promise<RawCatalog>;
    })
    .then(parse)
    .catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}

export const CatalogContext = createContext<Catalog | null>(null);

export function useCatalog(): Catalog {
  const c = useContext(CatalogContext);
  if (!c) throw new Error('Katalog henüz yüklenmedi');
  return c;
}

export function themeLabel(cat: Catalog, s: LegoSet) {
  const t = cat.themes.get(s.theme);
  const r = cat.themes.get(s.root);
  if (!t) return r?.name ?? '';
  if (!r || r.id === t.id) return t.name;
  return `${r.name} · ${t.name}`;
}

// ── Arama ──
let index: string[] | null = null;
let indexFor: Catalog | null = null;

function ensureIndex(cat: Catalog) {
  if (index && indexFor === cat) return index;
  index = cat.sets.map((s) => {
    const t = cat.themes.get(s.theme)?.name ?? '';
    const r = cat.themes.get(s.root)?.name ?? '';
    return ` ${fold(`${s.base} ${s.name} ${t} ${r !== t ? r : ''} ${s.tr?.name ?? ''}`)} `;
  });
  indexFor = cat;
  return index;
}

export function searchSets(cat: Catalog, query: string, limit = 150): LegoSet[] {
  const q = fold(query);
  if (!q) return [];
  const idx = ensureIndex(cat);
  const tokens = q.split(' ');
  const compact = q.replace(/ /g, '');
  const hits: { s: LegoSet; score: number }[] = [];
  for (let i = 0; i < cat.sets.length; i++) {
    const hay = idx[i];
    if (!tokens.every((t) => hay.includes(t))) continue;
    const s = cat.sets[i];
    let score = 4;
    if (s.base === compact) score = 0;
    else if (s.base.startsWith(compact)) score = 1;
    else if (hay.startsWith(` ${s.base} ${q}`)) score = 2;
    else if (tokens.every((t) => hay.includes(` ${t}`))) score = 3;
    hits.push({ s, score });
  }
  hits.sort((a, b) => a.score - b.score || b.s.year - a.s.year || b.s.parts - a.s.parts);
  return hits.slice(0, limit).map((h) => h.s);
}
