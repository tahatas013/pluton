import { memo, useState, type ReactNode } from 'react';
import type { LegoSet } from '../data/catalog';
import { useStore } from '../data/store';
import { availBadge, partsLabel } from '../data/avail';
import { brickVars } from '../data/colors';
import { useNav } from '../nav';
import { haptic } from '../lib/haptics';
import { CheckIcon, ChevronRight, GlobeIcon, HeartIcon, TrFlag } from './Icons';
import { IsoBuild, hashSeed } from './IsoBuild';

export const SetImage = memo(function SetImage({ set, className }: { set: LegoSet; className?: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(set.img ? 'loading' : 'error');
  return (
    <div className={`set-img ${className ?? ''}`} data-state={state}>
      {set.img && state !== 'error' && (
        <img
          src={set.img}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
        />
      )}
      {state === 'error' && <IsoBuild seed={hashSeed(set.num)} className="set-img-fallback" />}
    </div>
  );
});

export function AvailBadge({ set, inline, big }: { set: LegoSet; inline?: boolean; big?: boolean }) {
  const b = availBadge(set);
  // Kartlarda "satıştan kalktı" gürültü yapar; yalnızca set sayfasında göster
  if (!b || (!big && set.avail === 'retired')) return null;
  return (
    <span className={`avail-badge ${inline || big ? 'inline' : ''} ${big ? 'big' : ''}`} style={brickVars(b.color)}>
      {b.icon === 'tr' && <TrFlag size={big ? 13 : 10} />}
      {b.icon === 'globe' && <GlobeIcon size={big ? 15 : 12} />}
      {big ? b.long : b.text}
    </span>
  );
}

function Marks({ num: n }: { num: string }) {
  const owned = useStore((s) => !!s.owned[n]);
  const wished = useStore((s) => !!s.wish[n]);
  if (!owned && !wished) return null;
  return (
    <div className="marks">
      {owned && (
        <span className="mark mark-owned" aria-label="Koleksiyonda">
          <CheckIcon size={13} />
        </span>
      )}
      {wished && !owned && (
        <span className="mark mark-wish" aria-label="İstek listesinde">
          <HeartIcon size={13} filled />
        </span>
      )}
    </div>
  );
}

export const SetCard = memo(function SetCard({ set, badge }: { set: LegoSet; badge?: ReactNode }) {
  const { openSet } = useNav();
  return (
    <button
      className="tile press set-card"
      onClick={() => {
        haptic();
        openSet(set.num);
      }}
    >
      <SetImage set={set} />
      {badge ?? <Marks num={set.num} />}
      <AvailBadge set={set} />
      <div className="set-card-body">
        <div className="set-card-name">{set.name}</div>
        <div className="set-card-meta">
          <span className="chip-num">{set.base}</span>
          <span>{partsLabel(set)}</span>
        </div>
      </div>
    </button>
  );
});

export const SetRow = memo(function SetRow({
  set,
  extra,
}: {
  set: LegoSet;
  extra?: ReactNode;
}) {
  const { openSet } = useNav();
  return (
    <button
      className="tile press set-row"
      onClick={() => {
        haptic();
        openSet(set.num);
      }}
    >
      <SetImage set={set} className="set-row-img" />
      <div className="set-row-body">
        <div className="set-row-name">{set.name}</div>
        <div className="set-row-meta">
          <span className="chip-num">{set.base}</span>
          <span>
            {set.year} · {partsLabel(set)}
          </span>
        </div>
        <AvailBadge set={set} inline />
        {extra}
      </div>
      <Marks num={set.num} />
      <ChevronRight size={18} className="set-row-chev" />
    </button>
  );
});

export function Rail({ sets }: { sets: LegoSet[] }) {
  return (
    <div className="rail" role="list">
      {sets.map((s) => (
        <div role="listitem" key={s.num} className="rail-item">
          <SetCard set={s} />
        </div>
      ))}
    </div>
  );
}
