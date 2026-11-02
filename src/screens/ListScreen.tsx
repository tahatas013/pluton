import { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalog } from '../data/catalog';
import { brickVars, shortThemeName } from '../data/colors';
import { num } from '../lib/format';
import { haptic } from '../lib/haptics';
import { useNav, type ListRoute } from '../nav';
import { Segmented } from '../ui/Choice';
import { Screen } from '../ui/Screen';
import { SetCard } from '../ui/SetBits';

type Sort = 'new' | 'big';
const STEP = 40;

export function ListScreen({ route }: { route: ListRoute }) {
  const cat = useCatalog();
  const nav = useNav();
  const { theme, year, minParts } = route.query;

  const base = useMemo(
    () =>
      cat.sets.filter(
        (s) =>
          (theme == null || s.root === theme) &&
          (year == null || s.year === year) &&
          (minParts == null || s.parts >= minParts),
      ),
    [cat, theme, year, minParts],
  );

  // Tema listesinde yıllara, yıl listesinde temalara göre süzme çipleri
  const chips = useMemo(() => {
    if (theme != null) {
      const years = [...new Set(base.map((s) => s.year))].sort((a, b) => b - a);
      return years.map((y) => ({ id: y, label: String(y) }));
    }
    if (year != null) {
      const counts = new Map<number, number>();
      for (const s of base) counts.set(s.root, (counts.get(s.root) ?? 0) + 1);
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => ({ id, label: shortThemeName(cat.rootById.get(id)?.name ?? '') }));
    }
    return [];
  }, [base, theme, year, cat]);

  const [chip, setChip] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>(theme != null ? 'new' : 'big');
  const [limit, setLimit] = useState(STEP);

  const list = useMemo(() => {
    const f = chip == null ? base : base.filter((s) => (theme != null ? s.year === chip : s.root === chip));
    return sort === 'big' ? [...f].sort((a, b) => b.parts - a.parts) : f;
  }, [base, chip, sort, theme]);

  useEffect(() => setLimit(STEP), [chip, sort]);

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setLimit((l) => l + STEP), {
      rootMargin: '600px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [list, limit]);

  return (
    <Screen title={route.title} eyebrow={route.eyebrow} color={route.color} onBack={nav.pop}>
      <Segmented
        id={route.key}
        label="Sıralama"
        options={[
          { id: 'new', label: 'En yeni' },
          { id: 'big', label: 'En büyük' },
        ]}
        value={sort}
        onChange={setSort}
      />

      {chips.length > 1 && (
        <div className="chips-row">
          {[{ id: null as number | null, label: 'Tümü' }, ...chips].map((c) => {
            const sel = c.id === chip;
            return (
              <button
                key={String(c.id)}
                className={`chip press ${sel ? 'brick is-down' : 'tile'}`}
                style={sel ? brickVars('yellow') : undefined}
                onClick={() => {
                  if (!sel) haptic();
                  setChip(c.id);
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="count-row">
        <span className="label-tile small">{num(list.length)} set</span>
      </div>
      <div className="grid">
        {list.slice(0, limit).map((s) => (
          <SetCard key={s.num} set={s} />
        ))}
      </div>
      {limit < list.length && <div ref={sentinel} className="more" />}
    </Screen>
  );
}
