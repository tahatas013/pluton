import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCatalog, type LegoSet } from '../data/catalog';
import { brickVars, shortThemeName } from '../data/colors';
import { useStore } from '../data/store';
import { dateTR, greeting, num } from '../lib/format';
import { haptic } from '../lib/haptics';
import { isIOS, isStandalone, readFlag, writeFlag } from '../lib/platform';
import { useNav } from '../nav';
import { Section } from '../ui/Bits';
import { ArrowRight, BrickIcon, CloseIcon, DiceIcon, SearchIcon, ShareIcon, TagIcon } from '../ui/Icons';
import { IsoBuild } from '../ui/IsoBuild';
import { Screen } from '../ui/Screen';
import { Rail, SetImage } from '../ui/SetBits';

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function Discover() {
  const cat = useCatalog();
  const nav = useNav();
  const recent = useStore((s) => s.recent);

  const latest = useMemo(() => cat.sets.filter((s) => s.year === cat.latestYear), [cat]);
  const cover = latest.find((s) => s.img) ?? latest[0];
  const themes = cat.featured.slice(0, 8);
  const bigCount = useMemo(() => cat.sets.filter((s) => s.parts >= 3000).length, [cat]);
  const pool = useMemo(() => {
    const p = cat.sets.filter((s) => s.parts >= 150 && s.img);
    return p.length ? p : cat.sets;
  }, [cat]);
  const [lucky, setLucky] = useState<LegoSet>(() => pick(pool));
  const recentSets = recent.map((n) => cat.byNum.get(n)).filter((s): s is LegoSet => !!s).slice(0, 12);
  const [installHint, setInstallHint] = useState(() => isIOS() && !isStandalone() && !readFlag('pluton:kurulum'));
  const thisYear = cat.latestYear === new Date().getFullYear();

  const tr = useMemo(() => {
    const inTr = cat.sets.filter((s) => s.avail === 'tr' || s.avail === 'tr-pre');
    const fresh = [...inTr]
      .sort((a, b) => (b.tr?.since ?? '').localeCompare(a.tr?.since ?? '') || b.year - a.year || b.parts - a.parts)
      .slice(0, 14);
    const abroad = cat.sets.filter((s) => s.avail === 'abroad');
    return {
      count: inTr.length,
      latestCount: latest.filter((s) => s.tr).length,
      fresh,
      abroad: abroad.slice(0, 14),
      abroadCount: abroad.length,
    };
  }, [cat, latest]);

  return (
    <Screen tab="kesfet" title="Keşfet" eyebrow={greeting()}>
      {installHint && (
        <div className="install brick studs" style={brickVars('yellow')}>
          <b>Plüton'u ana ekrana ekle</b>
          <p>
            Safari'de alttaki <ShareIcon size={16} className="inline-ic" /> Paylaş düğmesine dokun, sonra{' '}
            <strong>Ana Ekrana Ekle</strong>. Uygulama gibi tam ekran açılır.
          </p>
          <button
            className="install-x"
            aria-label="Kapat"
            onClick={() => {
              writeFlag('pluton:kurulum');
              setInstallHint(false);
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      <button className="tile press search-field" onClick={nav.focusSearch}>
        <SearchIcon size={22} className="search-ic" />
        <span className="search-ph">Set adı ya da numarası</span>
      </button>

      <div className="bento">
        <button
          className="brick studs press hero"
          style={brickVars('red')}
          onClick={() => {
            haptic();
            nav.push({
              title: thisYear ? 'Bu yılın setleri' : `${cat.latestYear} setleri`,
              eyebrow: `${num(latest.length)} set`,
              color: 'red',
              query: { year: cat.latestYear },
            });
          }}
        >
          <span className="hero-num">{cat.latestYear}</span>
          <span className="hero-label">
            {num(latest.length)} yeni set <ArrowRight size={17} />
          </span>
          {tr.count > 0 && <span className="hero-sub">{num(tr.latestCount)} tanesi Türkiye'de</span>}
          {cover && (
            <span className="hero-sticker">
              <SetImage set={cover} />
            </span>
          )}
        </button>

        {themes.map((t) => (
          <button
            key={t.id}
            className="brick press theme-sq"
            style={brickVars(t.color)}
            onClick={() => {
              haptic();
              nav.push({ title: t.name, eyebrow: `${num(t.count)} set`, color: t.color, query: { theme: t.id } });
            }}
          >
            <i className="studs4" />
            <span>{shortThemeName(t.name)}</span>
          </button>
        ))}

        {tr.count > 0 && (
          <button
            className="brick studs press half"
            style={brickVars('green')}
            onClick={() => {
              haptic();
              nav.push({
                title: "Türkiye'de satışta",
                eyebrow: 'lego.tr',
                color: 'green',
                query: { avail: 'tr' },
              });
            }}
          >
            <TagIcon size={22} className="half-ic" />
            <b>Türkiye'de satışta</b>
            <small>{num(tr.count)} set</small>
          </button>
        )}
        <button
          className={`brick studs press ${tr.count > 0 ? 'half' : 'wide'}`}
          style={brickVars(tr.count > 0 ? 'blue' : 'green')}
          onClick={() => {
            haptic();
            nav.push({
              title: 'Dev yapılar',
              eyebrow: '3.000+ parça',
              color: tr.count > 0 ? 'blue' : 'green',
              query: { minParts: 3000 },
            });
          }}
        >
          {tr.count > 0 ? <BrickIcon size={22} className="half-ic" /> : null}
          <b>Dev yapılar</b>
          <small>
            {tr.count > 0 ? '' : '3.000+ parça · '}
            {num(bigCount)} set
          </small>
          {tr.count === 0 && (
            <IsoBuild seed={20261102} className="wide-art" colors={['blue', 'yellow', 'red', 'orange']} />
          )}
        </button>
      </div>

      <Section title="Şansına bir set">
        <div className="lucky tile">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.button
              key={lucky.num}
              className="lucky-main"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              onClick={() => {
                haptic();
                nav.openSet(lucky.num);
              }}
            >
              <SetImage set={lucky} className="lucky-img" />
              <span className="lucky-text">
                <span className="lucky-name">{lucky.name}</span>
                <span className="lucky-meta">
                  <span className="chip-num">{lucky.base}</span> {lucky.year} · {num(lucky.parts)} parça
                </span>
              </span>
            </motion.button>
          </AnimatePresence>
          <button
            className="brick press lucky-dice"
            style={brickVars('blue')}
            aria-label="Başka bir set göster"
            onClick={() => {
              haptic();
              let next = pick(pool);
              if (pool.length > 1) while (next.num === lucky.num) next = pick(pool);
              setLucky(next);
            }}
          >
            <DiceIcon size={26} />
          </button>
        </div>
      </Section>

      {tr.fresh.length > 0 && (
        <Section title="Türkiye'de yeni">
          <Rail sets={tr.fresh} />
        </Section>
      )}

      {tr.abroad.length > 0 && (
        <Section
          title="Yalnızca yurt dışında"
          action={
            <button
              className="tile press more-btn"
              onClick={() => {
                haptic();
                nav.push({
                  title: 'Yalnızca yurt dışında',
                  eyebrow: `${num(tr.abroadCount)} set Türkiye'de yok`,
                  color: 'navy',
                  query: { avail: 'abroad' },
                });
              }}
            >
              Tümü
            </button>
          }
        >
          <Rail sets={tr.abroad} />
        </Section>
      )}

      <Section title={thisYear ? 'Bu yılın en büyükleri' : `${cat.latestYear} en büyükleri`}>
        <Rail sets={latest.slice(0, 14)} />
      </Section>

      {recentSets.length > 0 && (
        <Section title="Son baktıkların">
          <Rail sets={recentSets} />
        </Section>
      )}

      <p className="foot tile">
        {num(cat.sets.length)} set · Katalog {dateTR(cat.generated)}
        {cat.source === 'dev-fixture' ? ' · örnek veri' : ' · Rebrickable'}
        {cat.trGenerated && <> · Türkiye fiyatları {dateTR(cat.trGenerated)}</>}
      </p>
    </Screen>
  );
}
