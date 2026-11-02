import type { Catalog, LegoSet } from './catalog';
import type { BrickColor } from './colors';

export type SortKey = 'new' | 'big' | 'cheap';

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  color: BrickColor;
  sort: SortKey;
  short?: string; // dar yerlerde (bütçe seçici) kısa ad
  match: (s: LegoSet, cat: Catalog) => boolean;
}

const rootName = (s: LegoSet, cat: Catalog) => cat.themes.get(s.root)?.name ?? '';
const themeName = (s: LegoSet, cat: Catalog) => cat.themes.get(s.theme)?.name ?? '';

/** Keşfet için "güncel" set: alınabilir, yakında çıkacak ya da yeni. Eski ve satıştan kalkmışlar hariç. */
export function isCurrent(s: LegoSet, cat: Catalog) {
  if (s.parts <= 0) return false;
  switch (s.avail) {
    case 'tr':
    case 'tr-pre':
    case 'abroad':
    case 'soon':
      return true;
    case 'tr-out':
      return s.year >= cat.latestYear - 1;
    case 'none':
      return !cat.hasTr && s.year >= cat.latestYear - 1 && !/promotional|brand store|seasonal|other/i.test(rootName(s, cat));
    default:
      return false;
  }
}

const inStock = (s: LegoSet) => s.avail === 'tr' && s.parts > 0;
const price = (s: LegoSet) => s.tr?.price ?? null;

const DISPLAY = /icons|ideas|architecture|^art$|lego art|botanical|creator expert|modular/i;
const FLOWER =
  /flower|bouquet|orchid|plant|bonsai|succulent|rose|tulip|lotus|blossom|sunflower|lavender|wildflower|cactus|poinsettia|daffodil|lily|peony|chrysanthemum/i;
const CAR =
  /ferrari|porsche|lamborghini|mclaren|bugatti|aston martin|corvette|mustang|bmw|mercedes|audi|koenigsegg|toyota|nissan|chevrolet|ford|dodge|jeep|land rover|volkswagen|mini cooper|formula|f1 |race car|supercar|hypercar/i;

/** "Ne yapmak istersin?" ızgarasındaki koleksiyonlar */
export const MOODS: Collection[] = [
  {
    id: 'aksam',
    title: 'Bir akşamlık',
    subtitle: '150–600 parça',
    color: 'orange',
    sort: 'new',
    match: (s, c) => isCurrent(s, c) && s.parts >= 150 && s.parts <= 600,
  },
  {
    id: 'hafta',
    title: 'Hafta sonu projesi',
    subtitle: '800–2.500 parça',
    color: 'blue',
    sort: 'new',
    match: (s, c) => isCurrent(s, c) && s.parts >= 800 && s.parts <= 2500,
  },
  {
    id: 'raf',
    title: 'Rafı süsleyecekler',
    subtitle: 'Sergilik yetişkin setleri',
    color: 'purple',
    sort: 'new',
    match: (s, c) => isCurrent(s, c) && s.parts >= 400 && (DISPLAY.test(rootName(s, c)) || DISPLAY.test(themeName(s, c))),
  },
  {
    id: 'dev',
    title: 'Dev yapılar',
    subtitle: '3.000+ parça',
    color: 'green',
    sort: 'big',
    match: (s, c) => isCurrent(s, c) && s.parts >= 3000,
  },
  {
    id: 'figur',
    title: 'Minifigür şöleni',
    subtitle: '8+ minifigür çıkıyor',
    color: 'red',
    sort: 'new',
    match: (s, c) => isCurrent(s, c) && s.figs >= 8,
  },
  {
    id: 'hediye',
    title: 'Hediyelik',
    subtitle: "Stokta, 2.500 TL'ye kadar",
    color: 'pink',
    sort: 'new',
    match: (s) => inStock(s) && (price(s) ?? 1e9) <= 2500 && s.parts >= 50,
  },
  {
    id: 'cicek',
    title: 'Çiçekler ve bitkiler',
    subtitle: 'Hiç solmayan buketler',
    color: 'lime',
    sort: 'new',
    match: (s, c) => isCurrent(s, c) && (/botanical/i.test(themeName(s, c)) || FLOWER.test(s.name)),
  },
  {
    id: 'araba',
    title: 'Arabalar',
    subtitle: 'Süper arabalar ve yarışçılar',
    color: 'yellow',
    sort: 'new',
    match: (s, c) =>
      isCurrent(s, c) &&
      (/speed champions/i.test(rootName(s, c)) || ((/technic|icons/i.test(rootName(s, c))) && CAR.test(s.name)) || CAR.test(s.name)),
  },
];

/** Bütçe aralıkları (yalnızca lego.tr'de stokta olanlar) */
export const BUDGETS: Collection[] = [
  { id: 'b1', title: "1.000 TL'ye kadar", short: '1 bine kadar', subtitle: 'Küçük sürprizler', min: 0, max: 1000 },
  { id: 'b2', title: '1.000–3.000 TL', short: '1–3 bin', subtitle: 'Orta boy keyifler', min: 1000, max: 3000 },
  { id: 'b3', title: '3.000–7.500 TL', short: '3–7,5 bin', subtitle: 'Büyük projeler', min: 3000, max: 7500 },
  { id: 'b4', title: '7.500 TL üstü', short: '7,5 bin+', subtitle: 'Hayallerin seti', min: 7500, max: 1e9 },
].map(({ min, max, ...b }) => ({
  ...b,
  color: 'yellow' as BrickColor,
  sort: 'big' as SortKey,
  match: (s: LegoSet) => inStock(s) && (price(s) ?? -1) >= min && (price(s) ?? 1e9) < max,
}));

const STATIC: Collection[] = [
  ...MOODS,
  ...BUDGETS,
  {
    id: 'yeni-tr',
    title: "Türkiye'ye yeni geldi",
    subtitle: "lego.tr'ye son eklenenler",
    color: 'green',
    sort: 'new',
    match: (s) => (s.avail === 'tr' || s.avail === 'tr-pre') && s.parts > 0,
  },
  {
    id: 'tr',
    title: "Türkiye'de satışta",
    subtitle: "lego.tr'de stokta",
    color: 'green',
    sort: 'new',
    match: (s) => s.avail === 'tr' || s.avail === 'tr-pre',
  },
  {
    id: 'yurtdisi',
    title: "Türkiye'de henüz yok",
    subtitle: "Yurt dışında satışta, lego.tr'de yok",
    color: 'navy',
    sort: 'new',
    match: (s) => s.avail === 'abroad' && s.parts > 0,
  },
  {
    id: 'yakinda',
    title: 'Yakında',
    subtitle: 'Duyuruldu, çıkmasına az kaldı',
    color: 'purple',
    sort: 'big',
    match: (s) => (s.avail === 'soon' || s.avail === 'tr-pre') && s.parts > 0,
  },
];

export function getCollection(id: string, cat: Catalog): Collection | null {
  const st = STATIC.find((c) => c.id === id);
  if (st) return st;
  // "tema:123" → o temanın güncel setleri
  const m = /^tema:(-?\d+)$/.exec(id);
  if (m) {
    const root = cat.rootById.get(Number(m[1]));
    if (!root) return null;
    return {
      id,
      title: root.name,
      subtitle: 'Yeni ve satıştaki setler',
      color: root.color,
      sort: 'new',
      match: (s, c) => s.root === root.id && isCurrent(s, c),
    };
  }
  return null;
}

export const sortKeyNew = (s: LegoSet) => s.tr?.since ?? `${s.year}-06-30`;

export function sortSets(list: LegoSet[], key: SortKey) {
  const out = [...list];
  if (key === 'big') out.sort((a, b) => b.parts - a.parts);
  else if (key === 'cheap') out.sort((a, b) => (price(a) ?? 1e9) - (price(b) ?? 1e9) || b.parts - a.parts);
  else out.sort((a, b) => sortKeyNew(b).localeCompare(sortKeyNew(a)) || b.parts - a.parts);
  return out;
}

/** Bir listenin vitrin görseli: görseli olan, tercihen Türkiye'de satılan en büyük set. */
export function coverOf(list: LegoSet[]): LegoSet | null {
  let best: LegoSet | null = null;
  for (const s of list) {
    if (!s.img) continue;
    const score = s.parts + (s.avail === 'tr' ? 100000 : 0);
    const bestScore = best ? best.parts + (best.avail === 'tr' ? 100000 : 0) : -1;
    if (score > bestScore) best = s;
  }
  return best;
}
