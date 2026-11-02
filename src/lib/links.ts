import type { LegoSet } from '../data/catalog';

/** Fiyat verisi olmadığı için Türk mağazalarında set numarasıyla arama açar. */
export function shopLinks(s: LegoSet) {
  const q = encodeURIComponent(`lego ${s.base}`);
  return [
    { name: 'Akakçe', url: `https://www.akakce.com/arama/?q=${q}` },
    { name: 'Trendyol', url: `https://www.trendyol.com/sr?q=${q}` },
    { name: 'Hepsiburada', url: `https://www.hepsiburada.com/ara?q=${q}` },
    { name: 'Amazon', url: `https://www.amazon.com.tr/s?k=${q}` },
  ];
}

export const instructionsUrl = (s: LegoSet) => `https://www.lego.com/service/building-instructions/${s.base}`;
export const rebrickableUrl = (s: LegoSet) => `https://rebrickable.com/sets/${s.num}/`;
