import { useDeferredValue, useMemo, useState } from 'react';
import { searchSets, useCatalog, type LegoSet } from '../data/catalog';
import { brickVars, shortThemeName } from '../data/colors';
import { useStore } from '../data/store';
import { num } from '../lib/format';
import { haptic } from '../lib/haptics';
import { useNav } from '../nav';
import { Empty, Section } from '../ui/Bits';
import { CloseIcon, SearchIcon } from '../ui/Icons';
import { Screen } from '../ui/Screen';
import { Rail, SetRow } from '../ui/SetBits';

const IDEAS = ['Millennium Falcon', 'Hogwarts', 'Titanic', 'Batmobile', 'Orchid', 'Concorde', 'Rivendell', 'Ferrari'];

export function Search() {
  const cat = useCatalog();
  const nav = useNav();
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const results = useMemo(() => searchSets(cat, dq), [cat, dq]);
  const recent = useStore((s) => s.recent);
  const recentSets = recent.map((n) => cat.byNum.get(n)).filter((s): s is LegoSet => !!s).slice(0, 12);

  return (
    <Screen tab="ara" title="Ara" eyebrow={`${num(cat.sets.length)} set içinde`}>
      <label className="tile search-field">
        <SearchIcon size={22} className="search-ic" />
        <input
          ref={nav.searchInput}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          placeholder="Set adı ya da numarası"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        {q && (
          <button className="search-clear" aria-label="Temizle" onClick={() => setQ('')}>
            <CloseIcon size={14} />
          </button>
        )}
      </label>

      {dq.trim() ? (
        results.length ? (
          <>
            <div className="count-row">
              <span className="label-tile small">{results.length >= 150 ? '150+ sonuç' : `${results.length} sonuç`}</span>
            </div>
            <div className="list">
              {results.map((s) => (
                <SetRow key={s.num} set={s} />
              ))}
            </div>
          </>
        ) : (
          <Empty seed={404} title="Bulunamadı" text={`"${dq}" için set yok. Set numarasını ya da İngilizce adını dene.`} />
        )
      ) : (
        <>
          {recentSets.length > 0 && (
            <Section title="Son baktıkların">
              <Rail sets={recentSets} />
            </Section>
          )}
          <Section title="Temalar">
            <div className="chip-cloud">
              {cat.roots.slice(0, 18).map((t) => (
                <button
                  key={t.id}
                  className="brick press chip"
                  style={brickVars(t.color)}
                  onClick={() => {
                    haptic();
                    nav.push({ title: t.name, eyebrow: `${num(t.count)} set`, color: t.color, query: { theme: t.id } });
                  }}
                >
                  {shortThemeName(t.name)}
                </button>
              ))}
            </div>
          </Section>
          <Section title="Bunları dene">
            <div className="chip-cloud">
              {IDEAS.map((idea) => (
                <button key={idea} className="tile press chip" onClick={() => setQ(idea)}>
                  {idea}
                </button>
              ))}
            </div>
          </Section>
        </>
      )}
    </Screen>
  );
}
