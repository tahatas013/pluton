import { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalog } from '../data/catalog';
import { getCollection, sortSets, type SortKey } from '../data/collections';
import { brickVars, shortThemeName } from '../data/colors';
import { num } from '../lib/format';
import { haptic } from '../lib/haptics';
import { useNav, type ListRoute } from '../nav';
import { Segmented } from '../ui/Choice';
import { Screen } from '../ui/Screen';
import { SetCard } from '../ui/SetBits';

type Where = 'all' | 'tr' | 'abroad';
const inTr = (a: string) => a === 'tr' || a === 'tr-pre' || a === 'tr-out';
const STEP = 40;

export function ListScreen({ route }: { route: ListRoute }) {
  const cat = useCatalog();
  const nav = useNav();
  const { theme, year, minParts, avail, coll } = route.query;
  const collection = coll ? getCollection(coll, cat) : null;

  const base = useMemo(
    () =>
      cat.sets.filter(
        (s) =>
          (!collection || collection.match(s, cat)) &&
          (theme == null || s.root === theme) &&
          (year == null || s.year === year) &&
          (minParts == null || s.parts >= minParts) &&
          (avail == null || (avail === 'tr' ? s.avail === 'tr' || s.avail === 'tr-pre' : s.avail === avail)),
      ),
    [cat, collection, theme, year, minParts, avail],
  );
  const hasTr = useMemo(() => avail == null && base.some((s) => s.tr) && base.some((s) => !s.tr), [base, avail]);
  const hasPrice = useMemo(() => base.some((s) => s.tr?.price), [base]);
  const [where, setWhere] = useState<Where>('all');

  // Tema listesinde yıllara, diğer listelerde temalara göre süzme çipleri
  const chips = useMemo(() => {
    if (theme != null) {
      const years = [...new Set(base.map((s) => s.year))].sort((a, b) => b - a);
      return years.map((y) => ({ id: y, label: String(y) }));
    }
    const counts = new Map<number, number>();
    for (const s of base) counts.set(s.root, (counts.get(s.root) ?? 0) + 1);
    if (counts.size < 2) return [];
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => ({ id, label: shortThemeName(cat.rootById.get(id)?.name ?? '') }));
  }, [base, theme, cat]);

  const [chip, setChip] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>(collection?.sort ?? (theme != null || avail != null ? 'new' : 'big'));
  const [limit, setLimit] = useState(STEP);

  const list = useMemo(() => {
    let f = chip == null ? base : base.filter((s) => (theme != null ? s.year === chip : s.root === chip));
    if (where === 'tr') f = f.filter((s) => inTr(s.avail));
    if (where === 'abroad') f = f.filter((s) => s.avail === 'abroad');
    return sortSets(f, sort);
  }, [base, chip, sort, theme, where]);

  useEffect(() => setLimit(STEP), [chip, sort, where]);

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

  const sorts: { id: SortKey; label: string }[] = [
    { id: 'new', label: 'En yeni' },
    { id: 'big', label: 'En büyük' },
    ...(hasPrice ? [{ id: 'cheap' as SortKey, label: 'En uygun' }] : []),
  ];

  return (
    <Screen title={route.title} eyebrow={route.eyebrow} color={route.color} onBack={nav.pop}>
      <Segmented id={route.key} label="Sıralama" options={sorts} value={sort} onChange={setSort} />

      {hasTr && (
        <Segmented
          id={`${route.key}-w`}
          label="Nerede satılıyor"
          options={[
            { id: 'all', label: 'Hepsi' },
            { id: 'tr', label: "Türkiye'de" },
            { id: 'abroad', label: 'Yurt dışı' },
          ]}
          value={where}
          onChange={setWhere}
        />
      )}

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
