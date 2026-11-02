import { useMemo } from 'react';
import { useCatalog, type LegoSet } from '../data/catalog';
import { brickVars } from '../data/colors';
import { PRIOS, useStore, type Wish } from '../data/store';
import { num } from '../lib/format';
import { useNav } from '../nav';
import { Empty } from '../ui/Bits';
import { Screen } from '../ui/Screen';
import { SetRow } from '../ui/SetBits';

export function Wishlist() {
  const cat = useCatalog();
  const nav = useNav();
  const wish = useStore((s) => s.wish);

  const items = useMemo(
    () =>
      Object.values(wish)
        .map((w) => ({ w, s: cat.byNum.get(w.num) }))
        .filter((x): x is { w: Wish; s: LegoSet } => !!x.s)
        .sort((a, b) => a.w.prio - b.w.prio || b.w.added - a.w.added),
    [wish, cat],
  );
  const parts = items.reduce((n, x) => n + x.s.parts, 0);

  return (
    <Screen tab="istekler" title="İstekler" eyebrow={items.length ? `${items.length} set seni bekliyor` : 'İstek listen'}>
      {items.length === 0 ? (
        <Empty
          seed={1402}
          title="Hayalindeki setler"
          text="Bir setin sayfasındaki kalbe dokun, buraya eklensin. Aldığında tek dokunuşla koleksiyona taşırsın."
          action={
            <button className="brick press btn" style={brickVars('pink')} onClick={() => nav.selectTab('kesfet')}>
              Set bul
            </button>
          }
        />
      ) : (
        <>
          <div className="wish-sum brick studs" style={brickVars('pink')}>
            <b>{num(parts)}</b>
            <small>parça seni bekliyor</small>
          </div>
          {PRIOS.map((p) => {
            const group = items.filter((x) => x.w.prio === p.id);
            if (!group.length) return null;
            return (
              <section key={p.id} className="section">
                <div className="section-head">
                  <h3 className="label-tile prio-label" style={brickVars(p.color)}>
                    {p.label} <em>{group.length}</em>
                  </h3>
                </div>
                <div className="list">
                  {group.map(({ s }) => (
                    <SetRow key={s.num} set={s} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </Screen>
  );
}
