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
export type BadgeIcon = 'tr' | 'globe' | null;

export function availBadge(s: LegoSet): { text: string; long: string; color: BrickColor; icon: BadgeIcon } | null {
  const p = s.tr?.price ? tl(s.tr.price) : null;
  switch (s.avail) {
    case 'tr':
      return { text: p ?? 'Satışta', long: `Türkiye'de satışta${p ? ` · ${p}` : ''}`, color: 'green', icon: 'tr' };
    case 'tr-out':
      return { text: 'Tükendi', long: "Türkiye'de tükendi", color: 'orange', icon: 'tr' };
    case 'tr-pre':
      return { text: 'Ön sipariş', long: `Türkiye'de ön siparişte${p ? ` · ${p}` : ''}`, color: 'azure', icon: 'tr' };
    case 'abroad':
      return { text: 'Yurt dışı', long: 'Yalnızca yurt dışında', color: 'navy', icon: 'globe' };
    case 'soon':
      return { text: 'Yakında', long: 'Yakında çıkacak', color: 'purple', icon: null };
    case 'retired':
      return { text: 'Satıştan kalktı', long: 'Satıştan kalkmış', color: 'slate', icon: null };
    default:
      return null;
  }
}

export const partsLabel = (s: LegoSet) => (s.parts > 0 ? `${num(s.parts)} parça` : 'Aksesuar');
