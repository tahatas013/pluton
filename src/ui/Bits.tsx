import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { BRICK, brickVars, type BrickColor } from '../data/colors';
import { IsoBuild } from './IsoBuild';

export function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <div className={`label-tile ${subtitle ? 'two-line' : ''}`}>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MoreButton({ onClick, label = 'Tümü' }: { onClick: () => void; label?: string }) {
  return (
    <button className="tile press more-btn" onClick={onClick}>
      {label}
    </button>
  );
}

export function Empty({
  seed,
  title,
  text,
  action,
}: {
  seed: number;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty tile">
      <IsoBuild seed={seed} />
      <b>{title}</b>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Stat({ color, value, label }: { color: BrickColor; value: string; label: string }) {
  return (
    <div className="stat brick studs" style={brickVars(color)}>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}

const BURST_COLORS: BrickColor[] = ['red', 'yellow', 'blue', 'green', 'orange', 'pink', 'azure', 'lime'];

/** Koleksiyona ekleyince fışkıran küçük renkli düğmeler. */
export function Burst({ trigger }: { trigger: number }) {
  const [shots, setShots] = useState<number[]>([]);
  useEffect(() => {
    if (!trigger) return;
    setShots((s) => [...s, trigger]);
    const t = setTimeout(() => setShots((s) => s.filter((x) => x !== trigger)), 900);
    return () => clearTimeout(t);
  }, [trigger]);
  return (
    <span className="burst" aria-hidden="true">
      {shots.map((id) =>
        BURST_COLORS.map((c, i) => {
          const a = (i / BURST_COLORS.length) * Math.PI * 2 + (id % 7) * 0.3;
          const d = 64 + (i % 3) * 18;
          return (
            <motion.i
              key={`${id}-${i}`}
              style={{ background: BRICK[c].bg, boxShadow: `0 2px 0 ${BRICK[c].edge}` }}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
              animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d - 20, scale: 1, opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.2, 0.8, 0.3, 1] }}
            />
          );
        }),
      )}
    </span>
  );
}
