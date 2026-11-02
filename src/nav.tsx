import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { BrickColor } from './data/colors';

export type TabId = 'kesfet' | 'ara' | 'koleksiyon' | 'istekler';

export interface ListQuery {
  theme?: number;
  year?: number;
  minParts?: number;
  avail?: 'tr' | 'abroad';
  coll?: string; // data/collections.ts içindeki koleksiyon kimliği
}

export interface ListRoute {
  key: string;
  title: string;
  eyebrow: string;
  color: BrickColor;
  query: ListQuery;
}

interface Nav {
  tab: TabId;
  stacks: Record<TabId, ListRoute[]>;
  selectTab: (t: TabId) => void;
  push: (r: Omit<ListRoute, 'key'>) => void;
  pop: () => void;
  setNum: string | null;
  openSet: (num: string) => void;
  closeSet: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  focusSearch: () => void;
  registerScroller: (tab: TabId, el: HTMLElement | null) => void;
  searchInput: RefObject<HTMLInputElement | null>;
}

const NavContext = createContext<Nav | null>(null);

export function useNav() {
  const n = useContext(NavContext);
  if (!n) throw new Error('NavProvider yok');
  return n;
}

let keySeq = 0;
const EMPTY: Record<TabId, ListRoute[]> = { kesfet: [], ara: [], koleksiyon: [], istekler: [] };

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>('kesfet');
  const [stacks, setStacks] = useState(EMPTY);
  const [setNum, setSetNum] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scrollers = useRef(new Map<TabId, HTMLElement>());
  const searchInput = useRef<HTMLInputElement | null>(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const stacksRef = useRef(stacks);
  stacksRef.current = stacks;

  const selectTab = useCallback((t: TabId) => {
    if (t === tabRef.current) {
      // Aynı sekmeye tekrar dokununca: önce en başa dön, sonra yukarı kaydır
      if (stacksRef.current[t].length) setStacks((s) => ({ ...s, [t]: [] }));
      else scrollers.current.get(t)?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTab(t);
  }, []);

  const push = useCallback((r: Omit<ListRoute, 'key'>) => {
    const t = tabRef.current;
    setStacks((s) => ({ ...s, [t]: [...s[t], { ...r, key: `r${++keySeq}` }] }));
  }, []);

  const pop = useCallback(() => {
    const t = tabRef.current;
    setStacks((s) => ({ ...s, [t]: s[t].slice(0, -1) }));
  }, []);

  const focusSearch = useCallback(() => {
    // Klavyenin iPhone'da açılması için odaklama aynı dokunuş içinde olmalı
    flushSync(() => {
      setTab('ara');
      setStacks((s) => ({ ...s, ara: [] }));
    });
    searchInput.current?.focus();
  }, []);

  const registerScroller = useCallback((t: TabId, el: HTMLElement | null) => {
    if (el) scrollers.current.set(t, el);
    else scrollers.current.delete(t);
  }, []);

  const value = useMemo<Nav>(
    () => ({
      tab,
      stacks,
      selectTab,
      push,
      pop,
      setNum,
      openSet: setSetNum,
      closeSet: () => setSetNum(null),
      settingsOpen,
      setSettingsOpen,
      focusSearch,
      registerScroller,
      searchInput,
    }),
    [tab, stacks, selectTab, push, pop, setNum, settingsOpen, focusSearch, registerScroller],
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
