const nf = new Intl.NumberFormat('tr-TR');

export const num = (n: number) => nf.format(n);

/** "75192-1" → "75192"; varyantlarda numara korunur ("6000-2"). */
export const baseNum = (setNum: string) => setNum.replace(/-1$/, '');

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 11) return 'Günaydın';
  if (h >= 11 && h < 17) return 'İyi günler';
  if (h >= 17 && h < 22) return 'İyi akşamlar';
  return 'İyi geceler';
}

/** Arama için harfleri sadeleştirir: büyük/küçük, Türkçe harfler ve aksanlar. */
export function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const dateTR = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

export const plural = (n: number, word: string) => `${num(n)} ${word}`;
