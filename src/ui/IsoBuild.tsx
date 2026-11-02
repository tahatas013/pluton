import { memo, useMemo } from 'react';
import { BRICK, type BrickColor } from '../data/colors';

// Görseli olmayan setler ve boş ekranlar için izometrik tuğla çizimi.
// Aynı tohum her zaman aynı yapıyı üretir.

interface B {
  x: number;
  y: number;
  z: number;
  L: number;
  D: number;
  c: string;
}

const U = [0.866, 0.5];
const V = [-0.866, 0.5];

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))),
  );
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export function hashSeed(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const PALETTE: BrickColor[] = ['red', 'yellow', 'blue', 'green', 'orange', 'azure', 'lime', 'pink', 'purple'];

function makeBuild(seed: number, colors?: BrickColor[]): B[] {
  const r = rng(seed);
  const pick = () => BRICK[(colors ?? PALETTE)[Math.floor(r() * (colors ?? PALETTE).length)]].bg;
  const W = 3 + Math.floor(r() * 2);
  const Dd = 2 + Math.floor(r() * 2);
  const out: B[] = [{ x: 0, y: 0, z: 0, L: W, D: Dd, c: '#A0A5A9' }];
  let fx = 0, fy = 0, fw = W, fd = Dd;
  const layers = 2 + Math.floor(r() * 2);
  for (let z = 1; z <= layers; z++) {
    const L = Math.max(1, Math.min(fw, 1 + Math.floor(r() * fw)));
    const D = Math.max(1, Math.min(fd, 1 + Math.floor(r() * fd)));
    const x = fx + Math.floor(r() * (fw - L + 1));
    const y = fy + Math.floor(r() * (fd - D + 1));
    out.push({ x, y, z, L, D, c: pick() });
    if (z === 1 && fw - L >= 1 && r() > 0.4) {
      const L2 = fw - L;
      out.push({ x: x === fx ? fx + L : fx, y, z, L: L2, D, c: pick() });
    }
    fx = x; fy = y; fw = L; fd = D;
  }
  return out;
}

function render(bricks: B[]) {
  const s = 20, H = 1.2;
  const pts: number[][] = [];
  const P = (a: number, b: number, c: number) => {
    const p = [a * U[0] * s + b * V[0] * s, a * U[1] * s + b * V[1] * s - c * s];
    pts.push(p);
    return p;
  };
  const poly = (ps: number[][], fill: string) =>
    `<polygon points="${ps.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="rgba(0,0,0,.16)" stroke-width=".6" stroke-linejoin="round"/>`;
  let out = '';
  [...bricks]
    .sort((p, q) => p.z - q.z || p.x + p.y - (q.x + q.y))
    .forEach(({ x, y, z, L, D, c }) => {
      const z0 = z * H, z1 = z0 + H;
      out += poly([P(x, y + D, z0), P(x + L, y + D, z0), P(x + L, y + D, z1), P(x, y + D, z1)], shade(c, -0.18));
      out += poly([P(x + L, y, z0), P(x + L, y + D, z0), P(x + L, y + D, z1), P(x + L, y, z1)], shade(c, -0.34));
      out += poly([P(x, y, z1), P(x + L, y, z1), P(x + L, y + D, z1), P(x, y + D, z1)], c);
      const rx = 0.3 * 1.2247 * s, ry = 0.3 * 0.7071 * s;
      for (let j = 0; j < D; j++)
        for (let i = 0; i < L; i++) {
          const b = P(x + i + 0.5, y + j + 0.5, z1), t = P(x + i + 0.5, y + j + 0.5, z1 + 0.28);
          out += `<path d="M${b[0] - rx},${b[1]} L${t[0] - rx},${t[1]} A${rx},${ry} 0 0 1 ${t[0] + rx},${t[1]} L${b[0] + rx},${b[1]} A${rx},${ry} 0 0 1 ${b[0] - rx},${b[1]}Z" fill="${shade(c, -0.22)}"/>`;
          out += `<ellipse cx="${t[0]}" cy="${t[1]}" rx="${rx}" ry="${ry}" fill="${shade(c, 0.12)}"/>`;
        }
    });
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - 3, y0 = Math.min(...ys) - 3;
  const w = Math.max(...xs) - x0 + 3, h = Math.max(...ys) - y0 + 3;
  return { viewBox: `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`, inner: out };
}

export const IsoBuild = memo(function IsoBuild({
  seed,
  colors,
  className,
}: {
  seed: number;
  colors?: BrickColor[];
  className?: string;
}) {
  const svg = useMemo(() => render(makeBuild(seed, colors)), [seed, colors]);
  return (
    <svg
      className={className}
      viewBox={svg.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg.inner }}
    />
  );
});
