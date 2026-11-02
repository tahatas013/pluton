// Tasarım maketleri için ortak çizimler: izometrik tuğla, durum çubuğu, sekme ikonları.
const U = [0.866, 0.5], V = [-0.866, 0.5];
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function build(bricks) {
  const s = 20, H = 1.2, pts = [];
  const P = (a, b, c) => { const p = [a * U[0] * s + b * V[0] * s, a * U[1] * s + b * V[1] * s - c * s]; pts.push(p); return p; };
  const poly = (ps, fill) => `<polygon points="${ps.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="rgba(0,0,0,.18)" stroke-width=".6" stroke-linejoin="round"/>`;
  let out = '';
  [...bricks].sort((p, q) => p.z - q.z || (p.x + p.y) - (q.x + q.y)).forEach(k => {
    const z0 = k.z * H, z1 = z0 + H, { x, y, L, D, c } = k;
    out += poly([P(x, y + D, z0), P(x + L, y + D, z0), P(x + L, y + D, z1), P(x, y + D, z1)], shade(c, -0.18));
    out += poly([P(x + L, y, z0), P(x + L, y + D, z0), P(x + L, y + D, z1), P(x + L, y, z1)], shade(c, -0.34));
    out += poly([P(x, y, z1), P(x + L, y, z1), P(x + L, y + D, z1), P(x, y + D, z1)], c);
    for (let j = 0; j < D; j++) for (let i = 0; i < L; i++) {
      const b = P(x + i + .5, y + j + .5, z1), t = P(x + i + .5, y + j + .5, z1 + .28);
      const rx = .3 * 1.2247 * s, ry = .3 * .7071 * s;
      out += `<path d="M${b[0] - rx},${b[1]} L${t[0] - rx},${t[1]} A${rx},${ry} 0 0 1 ${t[0] + rx},${t[1]} L${b[0] + rx},${b[1]} A${rx},${ry} 0 0 1 ${b[0] - rx},${b[1]}Z" fill="${shade(c, -0.22)}"/>`;
      out += `<ellipse cx="${t[0]}" cy="${t[1]}" rx="${rx}" ry="${ry}" fill="${shade(c, 0.12)}"/>`;
    }
  });
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs) - 4, y0 = Math.min(...ys) - 4, w = Math.max(...xs) - x0 + 4, h = Math.max(...ys) - y0 + 4;
  return `<svg viewBox="${x0} ${y0} ${w} ${h}" preserveAspectRatio="xMidYMid meet">${out}</svg>`;
}
const BUILDS = [
  [ {x:0,y:0,z:0,L:4,D:3,c:'#A0A5A9'}, {x:0,y:0,z:1,L:2,D:3,c:'#E3000B'}, {x:2,y:1,z:1,L:2,D:2,c:'#A0A5A9'}, {x:0,y:1,z:2,L:2,D:2,c:'#FFD500'}, {x:2,y:1,z:2,L:1,D:2,c:'#0055BF'} ],
  [ {x:0,y:0,z:0,L:5,D:3,c:'#6C6E68'}, {x:1,y:0,z:1,L:3,D:3,c:'#A0A5A9'}, {x:1,y:1,z:2,L:3,D:1,c:'#A0A5A9'}, {x:2,y:1,z:3,L:1,D:1,c:'#E3000B'} ],
  [ {x:0,y:0,z:0,L:4,D:3,c:'#05131D'}, {x:0,y:0,z:1,L:4,D:2,c:'#6C6E68'}, {x:1,y:0,z:2,L:2,D:2,c:'#E9C46A'}, {x:1,y:0,z:3,L:1,D:1,c:'#E3000B'} ],
  [ {x:0,y:0,z:0,L:4,D:2,c:'#FFD500'}, {x:0,y:0,z:1,L:2,D:2,c:'#FFFFFF'}, {x:2,y:0,z:1,L:2,D:1,c:'#0055BF'}, {x:0,y:1,z:2,L:2,D:1,c:'#FFD500'} ],
  [ {x:0,y:0,z:0,L:4,D:3,c:'#00852B'}, {x:1,y:0,z:1,L:2,D:2,c:'#F07C1E'}, {x:0,y:2,z:1,L:4,D:1,c:'#0055BF'}, {x:1,y:0,z:2,L:2,D:1,c:'#FFD500'}, {x:3,y:2,z:2,L:1,D:1,c:'#E3000B'} ],
];
document.querySelectorAll('[data-build]').forEach(el => el.innerHTML = build(BUILDS[+el.dataset.build]));

document.querySelectorAll('[data-sb]').forEach(el => {
  const c = el.dataset.sb;
  el.innerHTML = `<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="${c}"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="${c}"/><rect x="10" y="3" width="3" height="9" rx="1" fill="${c}"/><rect x="15" y="0" width="3" height="12" rx="1" fill="${c}"/></svg>
  <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5l2.4-2.9a3.6 3.6 0 00-4.8 0zM3.6 6.3a6.6 6.6 0 018.8 0l1.6-1.9a9.1 9.1 0 00-12 0zM.4 2.5a11.6 11.6 0 0115.2 0" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round"/></svg>
  <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="${c}" opacity=".4"/><rect x="2.5" y="2.5" width="19" height="8" rx="2.2" fill="${c}"/><path d="M25 4.5v4a2 2 0 000-4z" fill="${c}" opacity=".5"/></svg>`;
});

const ICONS = {
  kesfet: (f) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="5.6" ${f ? 'fill="currentColor"' : ''}/><ellipse cx="12" cy="12" rx="10.5" ry="3.6" transform="rotate(-22 12 12)"/></svg>`,
  ara: () => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>`,
  koleksiyon: () => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="9" width="18" height="11" rx="2.5"/><rect x="6" y="5" width="4.5" height="4" rx="1"/><rect x="13.5" y="5" width="4.5" height="4" rx="1"/></svg>`,
  istekler: () => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.4 12 20 12 20z"/></svg>`,
  zar: () => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>`,
};
const TABS = [['kesfet', 'Keşfet'], ['ara', 'Ara'], ['koleksiyon', 'Koleksiyon'], ['istekler', 'İstekler']];
document.querySelectorAll('[data-tab]').forEach(el => {
  el.innerHTML = TABS.map(([k, l], i) => `<div class="${i === 0 ? 'on' : ''}" data-k="${k}">${ICONS[k](i === 0)}<span>${l}</span></div>`).join('');
});
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = ICONS[el.dataset.icon]());
