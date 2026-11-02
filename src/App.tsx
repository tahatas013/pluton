import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  motionValue,
  useDragControls,
  useMotionValue,
  type MotionValue,
} from 'motion/react';
import { CatalogContext, loadCatalog, type Catalog } from './data/catalog';
import { brickVars } from './data/colors';
import { hydrate } from './data/store';
import { NavProvider, useNav, type ListRoute, type TabId } from './nav';
import { Collection } from './screens/Collection';
import { Discover } from './screens/Discover';
import { ListScreen } from './screens/ListScreen';
import { Search } from './screens/Search';
import { SetDetail } from './screens/SetDetail';
import { Settings } from './screens/Settings';
import { Wishlist } from './screens/Wishlist';
import { Sheet } from './ui/Sheet';
import { TabBar } from './ui/TabBar';
import { ToastHost } from './ui/Toast';

export function App() {
  const [cat, setCat] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    Promise.all([loadCatalog(), hydrate()])
      .then(([c]) => setCat(c))
      .catch((e: Error) => setError(e.message));
  };
  useEffect(load, []);

  if (error) {
    return (
      <div className="boot plate">
        <div className="boot-error tile">
          <b>Katalog yüklenemedi</b>
          <p>İnternet bağlantını kontrol edip tekrar dene.</p>
          <button className="brick press btn" style={brickVars('red')} onClick={load}>
            Tekrar dene
          </button>
        </div>
      </div>
    );
  }
  if (!cat) return <Boot />;

  return (
    <CatalogContext.Provider value={cat}>
      <NavProvider>
        <MotionConfig reducedMotion="user">
          <Shell />
        </MotionConfig>
      </NavProvider>
    </CatalogContext.Provider>
  );
}

function Boot() {
  return (
    <div className="boot" aria-label="Plüton yükleniyor">
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <rect width="96" height="96" rx="24" fill="#E3000B" />
        <circle cx="48" cy="48" r="25" fill="#FFD500" />
        <circle cx="48" cy="48" r="25" fill="none" stroke="#D9AE00" strokeWidth="3" />
        <path d="M48 58s-10-6.2-10-13.4a5.6 5.6 0 0110-3.4 5.6 5.6 0 0110 3.4C58 51.8 48 58 48 58z" fill="#E8BC00" />
      </svg>
    </div>
  );
}

const TABS: TabId[] = ['kesfet', 'ara', 'koleksiyon', 'istekler'];
const ROOTS: Record<TabId, () => ReactNode> = {
  kesfet: () => <Discover />,
  ara: () => <Search />,
  koleksiyon: () => <Collection />,
  istekler: () => <Wishlist />,
};

function Shell() {
  const nav = useNav();
  const sheetOpen = !!nav.setNum || nav.settingsOpen;
  const lastSet = useRef<string | null>(null);
  if (nav.setNum) lastSet.current = nav.setNum;

  return (
    <>
      <motion.div
        className="app-layer"
        animate={sheetOpen ? { scale: 0.93, y: 8, borderRadius: 28 } : { scale: 1, y: 0, borderRadius: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
      >
        {TABS.map((t) => (
          <TabPane key={t} tab={t} active={nav.tab === t} />
        ))}
        <div className="status-cap" />
        <TabBar />
      </motion.div>

      <Sheet open={!!nav.setNum} onClose={nav.closeSet} label="Set ayrıntısı">
        {lastSet.current && <SetDetail key={lastSet.current} num={lastSet.current} />}
      </Sheet>
      <Sheet open={nav.settingsOpen} onClose={() => nav.setSettingsOpen(false)} label="Ayarlar">
        <Settings />
      </Sheet>
      <ToastHost />
    </>
  );
}

// ── Sekme içi gezinme: üstüne açılan liste ekranları, kenardan kaydırıp geri dönme ──

const xs = new Map<string, MotionValue<number>>();
const width = () => (typeof window === 'undefined' ? 400 : window.innerWidth);
function routeX(key: string) {
  let v = xs.get(key);
  if (!v) {
    v = motionValue(width());
    xs.set(key, v);
  }
  return v;
}

/** Üstteki ekran kayarken alttaki ekran hafifçe sola çekilir (iOS'taki gibi). */
function useParallax(above?: ListRoute) {
  const p = useMotionValue(0);
  const last = useRef<MotionValue<number> | null>(null);
  if (above) last.current = routeX(above.key);
  const src = last.current;
  useEffect(() => {
    if (!src) return;
    const upd = (v: number) => {
      const w = width();
      p.set(-0.28 * Math.max(0, Math.min(w, w - v)));
    };
    upd(src.get());
    return src.on('change', upd);
  }, [src, p]);
  return p;
}

function TabPane({ tab, active }: { tab: TabId; active: boolean }) {
  const { stacks } = useNav();
  const stack = stacks[tab];
  const px = useParallax(stack[0]);
  return (
    <div className={`tab-pane ${active ? 'is-active' : ''}`} aria-hidden={!active} inert={!active}>
      <motion.div className="stack-layer" style={{ x: px }}>
        {ROOTS[tab]()}
      </motion.div>
      <AnimatePresence initial={false}>
        {stack.map((r, i) => (
          <PushedScreen key={r.key} route={r} above={stack[i + 1]} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function PushedScreen({ route, above }: { route: ListRoute; above?: ListRoute }) {
  const nav = useNav();
  const x = routeX(route.key);
  const px = useParallax(above);
  const controls = useDragControls();
  return (
    <motion.div className="stack-layer pushed" style={{ x: px }}>
      <motion.div
        className="stack-inner"
        style={{ x }}
        initial={{ x: width() }}
        animate={{ x: 0 }}
        exit={{ x: width() }}
        transition={{ type: 'spring', bounce: 0, duration: 0.42 }}
        drag="x"
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 1 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > width() * 0.3 || info.velocity.x > 500) nav.pop();
        }}
        onAnimationComplete={() => {
          if (x.get() >= width()) xs.delete(route.key);
        }}
      >
        <ListScreen route={route} />
        <div className="edge-swipe" onPointerDown={(e) => controls.start(e)} />
      </motion.div>
    </motion.div>
  );
}
