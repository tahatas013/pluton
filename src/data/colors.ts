import type { CSSProperties } from 'react';

// Tuğla renkleri: zemin, alt kenar (tuğla kalınlığı) ve üstündeki yazı rengi.
export const BRICK = {
  red: { bg: '#E3000B', edge: '#A80008', on: '#FFFFFF' },
  yellow: { bg: '#FFD500', edge: '#D9AE00', on: '#2A2300' },
  blue: { bg: '#0055BF', edge: '#003C88', on: '#FFFFFF' },
  green: { bg: '#00852B', edge: '#005C1E', on: '#FFFFFF' },
  orange: { bg: '#F07C1E', edge: '#B95A0B', on: '#FFFFFF' },
  black: { bg: '#1B1B1F', edge: '#000000', on: '#FFFFFF' },
  purple: { bg: '#8E2B9E', edge: '#641C70', on: '#FFFFFF' },
  pink: { bg: '#E95EB0', edge: '#B33A84', on: '#FFFFFF' },
  maroon: { bg: '#7A1F2B', edge: '#54131C', on: '#FFFFFF' },
  azure: { bg: '#1E9BD7', edge: '#1371A0', on: '#FFFFFF' },
  lime: { bg: '#A5CA18', edge: '#7C9810', on: '#1F2A00' },
  navy: { bg: '#1F3A93', edge: '#142766', on: '#FFFFFF' },
  brown: { bg: '#8A5A2B', edge: '#5F3C1B', on: '#FFFFFF' },
  teal: { bg: '#00988F', edge: '#006B64', on: '#FFFFFF' },
  slate: { bg: '#5A6B7D', edge: '#3E4A57', on: '#FFFFFF' },
} as const;

export type BrickColor = keyof typeof BRICK;

export const brickVars = (c: BrickColor) =>
  ({ '--bg': BRICK[c].bg, '--edge': BRICK[c].edge, '--on': BRICK[c].on }) as CSSProperties;

// Tema adına göre renk; listede olmayanlar addan türetilen sabit bir renk alır.
const THEME_RULES: [RegExp, BrickColor][] = [
  [/star wars/, 'black'],
  [/technic/, 'orange'],
  [/^city$|lego city/, 'blue'],
  [/friends/, 'pink'],
  [/harry potter|wizarding/, 'maroon'],
  [/ninjago/, 'green'],
  [/icons|creator expert/, 'purple'],
  [/ideas/, 'yellow'],
  [/marvel|spider/, 'red'],
  [/\bdc\b|batman/, 'navy'],
  [/disney|frozen|princess/, 'azure'],
  [/minecraft/, 'green'],
  [/speed champions/, 'red'],
  [/creator/, 'lime'],
  [/duplo/, 'red'],
  [/architecture/, 'slate'],
  [/botanical/, 'green'],
  [/jurassic/, 'brown'],
  [/super mario/, 'red'],
  [/animal crossing/, 'lime'],
  [/sonic/, 'blue'],
  [/dreamzzz/, 'purple'],
  [/monkie kid/, 'yellow'],
  [/lord of the rings|hobbit/, 'brown'],
  [/collectible minifigures/, 'teal'],
  [/classic/, 'yellow'],
  [/avatar/, 'azure'],
  [/art$|^art\b/, 'black'],
  [/castle/, 'slate'],
  [/space/, 'navy'],
  [/pirates/, 'brown'],
];

const FALLBACK: BrickColor[] = ['red', 'blue', 'green', 'orange', 'purple', 'azure', 'teal', 'yellow', 'pink', 'lime'];

export function themeColor(name: string): BrickColor {
  const n = name.toLowerCase();
  for (const [re, c] of THEME_RULES) if (re.test(n)) return c;
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
}

// Uzun Rebrickable tema adlarını küçük karolarda okunur kılmak için kısaltır.
const SHORT: Record<string, string> = {
  'Super Heroes Marvel': 'Marvel',
  'Super Heroes DC': 'DC',
  'Collectible Minifigures': 'Minifigürler',
  'Creator 3-in-1': 'Creator',
  'The Lord of the Rings': 'Yüzüklerin Efendisi',
  'Botanical Collection': 'Botanik',
  'Harry Potter': 'Harry Potter',
  'Disney Princess': 'Prensesler',
  'Jurassic World': 'Jurassic',
  'Speed Champions': 'Speed Champions',
  Architecture: 'Mimari',
  'Educational and Dacta': 'Eğitim',
  'Legends of Chima': 'Chima',
};
export const shortThemeName = (name: string) => SHORT[name] ?? name;
