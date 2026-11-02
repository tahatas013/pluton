import { motion } from 'motion/react';
import { brickVars, type BrickColor } from '../data/colors';
import { haptic } from '../lib/haptics';
import { CheckIcon } from './Icons';

interface Opt<T> {
  id: T;
  label: string;
  color: BrickColor;
}

/** Tuğla seçici: seçili olan renkli ve içeri basılmış durur. */
export function BrickChoice<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: Opt<T>[];
  value: T | null;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="choice" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <button
            key={String(o.id)}
            role="radio"
            aria-checked={sel}
            className={`choice-btn press ${sel ? 'brick is-down' : 'tile'}`}
            style={sel ? brickVars(o.color) : undefined}
            onClick={() => {
              if (!sel) haptic();
              onChange(o.id);
            }}
          >
            {sel && <CheckIcon size={15} />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Kayan sarı tuğlalı bölümlü kontrol. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  label,
}: {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
  label: string;
}) {
  return (
    <div className="seg tile" role="tablist" aria-label={label}>
      {options.map((o) => {
        const sel = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={sel}
            className={`seg-btn ${sel ? 'on' : ''}`}
            onClick={() => {
              if (!sel) haptic();
              onChange(o.id);
            }}
          >
            {sel && (
              <motion.span
                layoutId={`seg-${id}`}
                className="seg-pill"
                style={brickVars('yellow')}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.38 }}
              />
            )}
            <span className="seg-label">
              {o.label}
              {o.count != null && <em>{o.count}</em>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
