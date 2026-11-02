import type { Avail, LegoSet } from './catalog';
import type { BrickColor } from './colors';
import { num } from '../lib/format';

export const tl = (n: number) => `${num(n)} TL`;

export const AVAIL_INFO: Record<Avail, { label: string; color: BrickColor } | null> = {
  tr: { label: "Türkiye'de satışta", color: 'green' },
  'tr-out': { label: "Türkiye'de tükendi", color: 'orange' },
  'tr-pre': { label: 'Türkiye’de ön siparişte', color: 'azure' },
  abroad: { label: 'Yalnızca yurt dışında', color: 'navy' },
  soon: { label: 'Yakında çıkacak', color: 'purple' },
  retired: { label: 'Satıştan kalkmış', color: 'slate' },
  none: null,
};

/** Kartların köşesindeki kısa etiket; gösterilecek bir şey yoksa null. */
export function availBadge(s: LegoSet): { text: string; color: BrickColor; abroad?: boolean } | null {
  switch (s.avail) {
    case 'tr':
      return { text: s.tr?.price ? tl(s.tr.price) : 'Satışta', color: 'green' };
    case 'tr-out':
      return { text: 'Tükendi', color: 'orange' };
    case 'tr-pre':
      return { text: 'Ön sipariş', color: 'azure' };
    case 'abroad':
      return { text: 'Yurt dışı', color: 'navy', abroad: true };
    case 'soon':
      return { text: 'Yakında', color: 'purple' };
    default:
      return null;
  }
}

export const partsLabel = (s: LegoSet) => (s.parts > 0 ? `${num(s.parts)} parça` : 'Aksesuar');
