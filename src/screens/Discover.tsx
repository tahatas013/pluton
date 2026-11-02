import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCatalog, type Catalog, type LegoSet } from '../data/catalog';
import { partsLabel } from '../data/avail';
import { BUDGETS, MOODS, coverOf, getCollection, isCurrent, sortSets, type Collection } from '../data/collections';
import { brickVars, shortThemeName, type BrickColor } from '../data/colors';
import { useStore } from '../data/store';
import { dateTR, greeting, num } from '../lib/format';
import { haptic } from '../lib/haptics';
import { isIOS, isStandalone, readFlag, writeFlag } from '../lib/platform';
import { useNav, type ListRoute } from '../nav';
import { MoreButton, Section } from '../ui/Bits';
import { Segmented } from '../ui/Choice';
import { CloseIcon, DiceIcon, SearchIcon, ShareIcon } from '../ui/Icons';
import { hashSeed } from '../ui/IsoBuild';
import { Screen } from '../ui/Screen';
import { AvailBadge, Rail, SetImage } from '../ui/SetBits';

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const DAY = 86400000;

type Push = (r: Omit<ListRoute, 'key'>) => void;
const openCollection = (push: Push, c: Collection, count: number) => {
  haptic();
  push({ title: c.title, eyebrow: `${c.subtitle} · ${num(count)} set`, color: c.color, query: { coll: c.id } });
};

interface Featured {
  set: LegoSet;
  kicker: string;
  color: BrickColor;
}

function useDiscoverData(cat: Catalog, ownedKeys: string[], wishKeys: string[]) {
  return useMemo(() => {
    const current = cat.sets.filter((s) => isCurrent(s, cat));
    const of = (c: Collection) => sortSets(cat.sets.filter((s) => c.match(s, cat)), c.sort);

    const moods = MOODS.map((c) => {
      const list = cat.sets.filter((s) => c.match(s, cat));
      return { c, count: list.length, cover: coverOf(list) };
    }).filter((m) => m.count >= 3);

    const yeniTr = getCollection('yeni-tr', cat)!;
    const yurtdisi = getCollection('yurtdisi', cat)!;
    const yakinda = getCollection('yakinda', cat)!;
    const freshTr = of(yeniTr);
    const abroad = sortSets(cat.sets.filter((s) => yurtdisi.match(s, cat)), 'big').filter((s) => s.year >= cat.latestYear - 1);
    const soon = of(yakinda);
    const budgets = BUDGETS.map((c) => ({ c, list: of(c) })).filter((b) => b.list.length > 0);

    // Öne çıkanlar: her biri farklı bir "neden bakmalıyım" hikâyesi
    const used = new Set<string>();
    const take = (list: LegoSet[]) => {
      const s = list.find((x) => x.img && !used.has(x.num));
      if (s) used.add(s.num);
      return s;
    };
    const featured: Featured[] = [];
    const now = Date.now();
    const arrivals = freshTr.filter((s) => s.tr?.since && now - Date.parse(s.tr.since) < 120 * DAY);
    const a = take(sortSets(arrivals, 'big'));
    if (a) featured.push({ set: a, kicker: "Türkiye'ye yeni geldi", color: 'green' });
    const y = take(sortSets(current.filter((s) => s.year === cat.latestYear), 'big'));
    if (y) featured.push({ set: y, kicker: 'Yılın en büyüğü', color: 'red' });
    const so = take(sortSets(soon, 'big'));
    if (so) featured.push({ set: so, kicker: 'Yakında geliyor', color: 'purple' });
    const ab = take(abroad);
    if (ab) featured.push({ set: ab, kicker: "Türkiye'de henüz yok", color: 'navy' });
    const dailyPool = current.filter((s) => s.img && s.parts >= 300 && !used.has(s.num));
    if (dailyPool.length) {
      const d = dailyPool[hashSeed(new Date().toISOString().slice(0, 10)) % dailyPool.length];
      featured.push({ set: d, kicker: 'Günün önerisi', color: 'orange' });
    }

    // Koleksiyona göre: en çok sahip olunan / istenen tema
    const mine = new Set([...ownedKeys, ...wishKeys]);
    const counts = new Map<number, number>();
    for (const k of mine) {
      const s = cat.byNum.get(k);
      if (s && cat.rootById.get(s.root) && s.root > 0) counts.set(s.root, (counts.get(s.root) ?? 0) + 1);
    }
    const topRoot = [...counts.entries()].sort((p, q) => q[1] - p[1])[0]?.[0];
    const forYou = topRoot != null
      ? sortSets(current.filter((s) => s.root === topRoot && !mine.has(s.num)), 'new').slice(0, 14)
      : [];

    const themes = cat.featured.slice(0, 12).map((t) => {
      const list = current.filter((s) => s.root === t.id);
      return { t, count: list.length, cover: coverOf(list) ?? t.cover };
    });

    return { moods, freshTr, abroad, soon, budgets, featured, forYou, topRoot, themes, current };
  }, [cat, ownedKeys, wishKeys]);
}

export function Discover() {
  const cat = useCatalog();
  const nav = useNav();
  const owned = useStore((s) => s.owned);
  const wish = useStore((s) => s.wish);
  const recent = useStore((s) => s.recent);
  const ownedKeys = useMemo(() => Object.keys(owned), [owned]);
  const wishKeys = useMemo(() => Object.keys(wish), [wish]);
  const d = useDiscoverData(cat, ownedKeys, wishKeys);
  const recentSets = recent.map((n) => cat.byNum.get(n)).filter((s): s is LegoSet => !!s).slice(0, 12);
  const [installHint, setInstallHint] = useState(() => isIOS() && !isStandalone() && !readFlag('pluton:kurulum'));
  const [budget, setBudget] = useState(d.budgets[1]?.c.id ?? d.budgets[0]?.c.id ?? '');
  const budgetList = d.budgets.find((b) => b.c.id === budget);

  const pool = useMemo(() => {
    const p = d.current.filter((s) => s.parts >= 150 && s.img);
    return p.length ? p : cat.sets;
  }, [d.current, cat]);
  const [lucky, setLucky] = useState<LegoSet>(() => pick(pool));

  const inStockCount = useMemo(() => cat.sets.filter((s) => s.avail === 'tr').length, [cat]);
  const topRootName = d.topRoot != null ? shortThemeName(cat.rootById.get(d.topRoot)?.name ?? '') : '';

  return (
    <Screen
      tab="kesfet"
      title="Keşfet"
      eyebrow={cat.hasTr ? `${greeting()} · bugün ${num(inStockCount)} set Türkiye'de stokta` : greeting()}
    >
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

      {d.featured.length > 0 && <FeaturedCarousel items={d.featured} />}

      <Section title="Ne yapmak istersin?" subtitle="Ruh haline göre setler">
        <div className="moods">
          {d.moods.map(({ c, count, cover }) => (
            <button
              key={c.id}
              className="brick studs press mood"
              style={brickVars(c.color)}
              onClick={() => openCollection(nav.push, c, count)}
            >
              <span className="mood-title">{c.title}</span>
              <span className="mood-sub">{c.subtitle}</span>
              <span className="mood-count">{num(count)} set</span>
              {cover && (
                <span className="mood-sticker">
                  <SetImage set={cover} />
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>

      {d.freshTr.length > 0 && (
        <Section
          title="Türkiye'ye yeni geldi"
          subtitle="lego.tr'ye son eklenenler"
          action={<MoreButton onClick={() => openCollection(nav.push, getCollection('yeni-tr', cat)!, d.freshTr.length)} />}
        >
          <Rail sets={d.freshTr.slice(0, 14)} />
        </Section>
      )}

      {d.forYou.length > 0 && (
        <Section
          title={`${topRootName} sevenlere`}
          subtitle="Koleksiyonuna ve isteklerine göre"
          action={
            <MoreButton
              onClick={() => openCollection(nav.push, getCollection(`tema:${d.topRoot}`, cat)!, d.forYou.length)}
            />
          }
        >
          <Rail sets={d.forYou} />
        </Section>
      )}

      {d.budgets.length > 0 && budgetList && (
        <Section
          title="Bütçene göre"
          subtitle="lego.tr'de stokta · en çok parça verenler önce"
          action={<MoreButton onClick={() => openCollection(nav.push, budgetList.c, budgetList.list.length)} />}
        >
          <Segmented
            id="butce"
            label="Bütçe"
            options={d.budgets.map((b) => ({ id: b.c.id, label: b.c.short ?? b.c.title }))}
            value={budget}
            onChange={setBudget}
          />
          <div className="rail-gap" />
          <Rail sets={budgetList.list.slice(0, 14)} />
        </Section>
      )}

      <Section title="Temalar" subtitle="Sevdiğin dünyayı seç">
        <div className="theme-rail" role="list">
          {d.themes.map(({ t, count, cover }) => (
            <button
              key={t.id}
              role="listitem"
              className="brick studs press theme-card"
              style={brickVars(t.color)}
              onClick={() => {
                haptic();
                nav.push({ title: t.name, eyebrow: `${num(t.count)} set`, color: t.color, query: { theme: t.id } });
              }}
            >
              {cover && (
                <span className="theme-sticker">
                  <SetImage set={cover} />
                </span>
              )}
              <span className="theme-name">{shortThemeName(t.name)}</span>
              <span className="theme-count">{count > 0 ? `${num(count)} güncel set` : `${num(t.count)} set`}</span>
            </button>
          ))}
        </div>
      </Section>

      {d.abroad.length > 0 && (
        <Section
          title="Türkiye'de henüz yok"
          subtitle="Yurt dışında satışta, lego.tr'de yok"
          action={<MoreButton onClick={() => openCollection(nav.push, getCollection('yurtdisi', cat)!, d.abroad.length)} />}
        >
          <Rail sets={d.abroad.slice(0, 14)} />
        </Section>
      )}

      {d.soon.length > 0 && (
        <Section
          title="Yakında"
          subtitle="Duyuruldu, çıkmasına az kaldı"
          action={<MoreButton onClick={() => openCollection(nav.push, getCollection('yakinda', cat)!, d.soon.length)} />}
        >
          <Rail sets={d.soon.slice(0, 14)} />
        </Section>
      )}

      <Section title="Şansına bir set" subtitle="Zarı at, tanımadığın bir set çıksın">
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
                  <span className="chip-num">{lucky.base}</span> {lucky.year} · {partsLabel(lucky)}
                </span>
                <AvailBadge set={lucky} inline />
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

      {recentSets.length > 0 && (
        <Section title="Son baktıkların">
          <Rail sets={recentSets} />
        </Section>
      )}

      <p className="foot tile">
        {num(cat.sets.length)} ürün · Katalog {dateTR(cat.generated)}
        {cat.source === 'dev-fixture' ? ' · örnek veri' : ' · Rebrickable'}
        {cat.trGenerated && <> · Türkiye fiyatları {dateTR(cat.trGenerated)} · lego.tr</>}
      </p>
    </Screen>
  );
}

function FeaturedCarousel({ items }: { items: Featured[] }) {
  const cat = useCatalog();
  const { openSet } = useNav();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  return (
    <div className="featured">
      <div
        ref={track}
        className="featured-track"
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          const w = card ? card.offsetWidth + 12 : 1;
          const i = Math.round(el.scrollLeft / w);
          if (i !== active) setActive(i);
        }}
      >
        {items.map(({ set, kicker, color }) => (
          <button
            key={set.num}
            className="tile press featured-card"
            onClick={() => {
              haptic();
              openSet(set.num);
            }}
          >
            <span className="featured-img">
              <SetImage set={set} />
              <AvailBadge set={set} />
            </span>
            <span className="featured-body brick studs" style={brickVars(color)}>
              <span className="featured-kicker">{kicker}</span>
              <span className="featured-name">{set.name}</span>
              <span className="featured-meta">
                {shortThemeName(cat.rootById.get(set.root)?.name ?? '')} · {partsLabel(set)}
                {set.figs > 0 && ` · ${set.figs} minifigür`}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="dots" aria-hidden="true">
        {items.map((it, i) => (
          <i key={it.set.num} className={i === active ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
