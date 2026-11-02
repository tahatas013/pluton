import { useSyncExternalStore } from 'react';
import { get, set as idbSet } from 'idb-keyval';
import type { BrickColor } from './colors';

export type Status = 'kutuda' | 'yapildi' | 'sergide' | 'sokuldu';
export type Prio = 1 | 2 | 3;

export const STATUSES: { id: Status; label: string; color: BrickColor }[] = [
  { id: 'kutuda', label: 'Kutusunda', color: 'blue' },
  { id: 'yapildi', label: 'Yapıldı', color: 'green' },
  { id: 'sergide', label: 'Sergide', color: 'yellow' },
  { id: 'sokuldu', label: 'Söküldü', color: 'slate' },
];
export const statusInfo = (id: Status) => STATUSES.find((s) => s.id === id) ?? STATUSES[0];

export const PRIOS: { id: Prio; label: string; color: BrickColor }[] = [
  { id: 1, label: 'Çok istiyorum', color: 'red' },
  { id: 2, label: 'İstiyorum', color: 'orange' },
  { id: 3, label: 'Bir gün', color: 'azure' },
];
export const prioInfo = (id: Prio) => PRIOS.find((p) => p.id === id) ?? PRIOS[1];

export interface Owned {
  num: string;
  status: Status;
  qty: number;
  added: number;
  note?: string;
}

export interface Wish {
  num: string;
  prio: Prio;
  added: number;
}

export interface State {
  owned: Record<string, Owned>;
  wish: Record<string, Wish>;
  recent: string[];
}

const KEY = 'pluton:v1';
let state: State = { owned: {}, wish: {}, recent: [] };
const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export const getState = () => state;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function save() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  idbSet(KEY, state).catch(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* depolama dolu ya da kapalı */
    }
  });
}

function update(fn: (s: State) => State) {
  state = fn(state);
  listeners.forEach((l) => l());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 250);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && saveTimer) save();
  });
}

function sanitize(v: unknown): State | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Partial<State>;
  const owned: Record<string, Owned> = {};
  const wish: Record<string, Wish> = {};
  const statuses = new Set(STATUSES.map((s) => s.id));
  for (const [k, x] of Object.entries(o.owned ?? {})) {
    if (!x || typeof x !== 'object') continue;
    const it = x as Owned;
    owned[k] = {
      num: k,
      status: statuses.has(it.status) ? it.status : 'kutuda',
      qty: Math.max(1, Math.min(99, Math.round(Number(it.qty) || 1))),
      added: Number(it.added) || Date.now(),
      ...(typeof it.note === 'string' && it.note ? { note: it.note.slice(0, 500) } : {}),
    };
  }
  for (const [k, x] of Object.entries(o.wish ?? {})) {
    if (!x || typeof x !== 'object') continue;
    const it = x as Wish;
    wish[k] = { num: k, prio: ([1, 2, 3] as const).includes(it.prio) ? it.prio : 2, added: Number(it.added) || Date.now() };
  }
  const recent = Array.isArray(o.recent) ? o.recent.filter((r) => typeof r === 'string').slice(0, 20) : [];
  return { owned, wish, recent };
}

export async function hydrate() {
  try {
    let v: unknown = await get(KEY);
    if (!v) {
      const ls = localStorage.getItem(KEY);
      if (ls) v = JSON.parse(ls);
    }
    const s = sanitize(v);
    if (s) state = s;
  } catch {
    /* ilk açılış ya da depolama kapalı */
  }
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* tarayıcı izin vermeyebilir */
  }
}

export const actions = {
  addOwned(num: string) {
    update((s) => {
      const { [num]: _, ...wish } = s.wish;
      return { ...s, wish, owned: { ...s.owned, [num]: { num, status: 'kutuda', qty: 1, added: Date.now() } } };
    });
  },
  removeOwned(num: string): Owned | undefined {
    const prev = state.owned[num];
    update((s) => {
      const { [num]: _, ...owned } = s.owned;
      return { ...s, owned };
    });
    return prev;
  },
  restoreOwned(o: Owned) {
    update((s) => ({ ...s, owned: { ...s.owned, [o.num]: o } }));
  },
  patchOwned(num: string, patch: Partial<Omit<Owned, 'num'>>) {
    update((s) => (s.owned[num] ? { ...s, owned: { ...s.owned, [num]: { ...s.owned[num], ...patch } } } : s));
  },
  /** İstek listesine ekler ya da çıkarır; yeni durumu döndürür. */
  toggleWish(num: string): boolean {
    const had = !!state.wish[num];
    update((s) => {
      if (had) {
        const { [num]: _, ...wish } = s.wish;
        return { ...s, wish };
      }
      return { ...s, wish: { ...s.wish, [num]: { num, prio: 2, added: Date.now() } } };
    });
    return !had;
  },
  setPrio(num: string, prio: Prio) {
    update((s) => (s.wish[num] ? { ...s, wish: { ...s.wish, [num]: { ...s.wish[num], prio } } } : s));
  },
  viewed(num: string) {
    update((s) => ({ ...s, recent: [num, ...s.recent.filter((r) => r !== num)].slice(0, 20) }));
  },
  exportJSON(): string {
    return JSON.stringify(
      { app: 'pluton', v: 1, exported: new Date().toISOString(), owned: state.owned, wish: state.wish },
      null,
      2,
    );
  },
  /** Yedeği mevcut verilerle birleştirir (hiçbir şey silinmez). */
  importJSON(text: string): { owned: number; wish: number } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Dosya okunamadı. Plüton yedeği olduğundan emin ol.');
    }
    const incoming = sanitize(parsed);
    if (!incoming || (parsed as { app?: string }).app !== 'pluton') {
      throw new Error('Bu dosya bir Plüton yedeği değil.');
    }
    update((s) => ({
      ...s,
      owned: { ...s.owned, ...incoming.owned },
      wish: Object.fromEntries(
        Object.entries({ ...s.wish, ...incoming.wish }).filter(([k]) => !incoming.owned[k] && !s.owned[k]),
      ),
    }));
    return { owned: Object.keys(incoming.owned).length, wish: Object.keys(incoming.wish).length };
  },
};
