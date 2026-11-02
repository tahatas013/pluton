import { useMemo, useState } from 'react';
import { useCatalog, type LegoSet } from '../data/catalog';
import { BRICK, brickVars, shortThemeName } from '../data/colors';
import { STATUSES, statusInfo, useStore, type Owned, type Status } from '../data/store';
import { num } from '../lib/format';
import { useNav } from '../nav';
import { Empty, Stat } from '../ui/Bits';
import { Segmented } from '../ui/Choice';
import { GearIcon } from '../ui/Icons';
import { Screen } from '../ui/Screen';
import { SetCard } from '../ui/SetBits';

type Filter = 'all' | Status;

export function Collection() {
  const cat = useCatalog();
  const nav = useNav();
  const owned = useStore((s) => s.owned);
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(
    () =>
      Object.values(owned)
        .map((o) => ({ o, s: cat.byNum.get(o.num) }))
        .filter((x): x is { o: Owned; s: LegoSet } => !!x.s)
        .sort((a, b) => b.o.added - a.o.added),
    [owned, cat],
  );

  const stats = useMemo(() => {
    let sets = 0, parts = 0, figs = 0;
    const byRoot = new Map<number, number>();
    for (const { o, s } of items) {
      sets += o.qty;
      parts += s.parts * o.qty;
      figs += s.figs * o.qty;
      byRoot.set(s.root, (byRoot.get(s.root) ?? 0) + o.qty);
    }
    const themes = [...byRoot.entries()]
      .map(([id, n]) => ({ t: cat.rootById.get(id), n }))
      .filter((x) => x.t)
      .sort((a, b) => b.n - a.n);
    return { sets, parts, figs, themes };
  }, [items, cat]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const { o } of items) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [items]);

  const shown = filter === 'all' ? items : items.filter((x) => x.o.status === filter);
  const filters = [
    { id: 'all' as Filter, label: 'Tümü', count: items.length },
    ...STATUSES.filter((s) => s.id !== 'sokuldu' || counts.sokuldu).map((s) => ({
      id: s.id as Filter,
      label: s.label,
      count: counts[s.id] ?? 0,
    })),
  ];

  return (
    <Screen
      tab="koleksiyon"
      title="Koleksiyon"
      eyebrow="Senin setlerin"
      right={
        <button className="icon-btn tile press" aria-label="Ayarlar" onClick={() => nav.setSettingsOpen(true)}>
          <GearIcon size={22} />
        </button>
      }
    >
      {items.length === 0 ? (
        <Empty
          seed={1903}
          title="Raflar boş… şimdilik"
          text="Bir sete göz at ve “Koleksiyona ekle”ye dokun. Sahip olduğun her set burada birikecek."
          action={
            <button className="brick press btn" style={brickVars('red')} onClick={() => nav.selectTab('kesfet')}>
              Keşfetmeye başla
            </button>
          }
        />
      ) : (
        <>
          <div className="stats">
            <Stat color="yellow" value={num(stats.sets)} label="set" />
            <Stat color="blue" value={num(stats.parts)} label="parça" />
            <Stat color="red" value={num(stats.figs)} label="minifigür" />
          </div>

          {stats.themes.length > 0 && (
            <div className="theme-bar tile">
              <div className="bar" role="img" aria-label="Temalara göre dağılım">
                {stats.themes.map(({ t, n }) => (
                  <i key={t!.id} style={{ flexGrow: n, background: BRICK[t!.color].bg }} />
                ))}
              </div>
              <div className="legend">
                {stats.themes.slice(0, 5).map(({ t, n }) => (
                  <span key={t!.id}>
                    <i style={{ background: BRICK[t!.color].bg }} />
                    {shortThemeName(t!.name)} <em>{n}</em>
                  </span>
                ))}
                {stats.themes.length > 5 && <span className="legend-more">+{stats.themes.length - 5} tema</span>}
              </div>
            </div>
          )}

          <Segmented id="koleksiyon" label="Duruma göre süz" options={filters} value={filter} onChange={setFilter} />

          {shown.length ? (
            <div className="grid">
              {shown.map(({ o, s }) => {
                const st = statusInfo(o.status);
                return (
                  <SetCard
                    key={s.num}
                    set={s}
                    badge={
                      <span className="status-badge" style={brickVars(st.color)}>
                        {st.label}
                        {o.qty > 1 && ` ×${o.qty}`}
                      </span>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <p className="foot tile">Bu durumda set yok.</p>
          )}
        </>
      )}
    </Screen>
  );
}
