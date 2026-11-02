import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { brickVars, type BrickColor } from '../data/colors';
import { useNav, type TabId } from '../nav';
import { ChevronLeft } from './Icons';
import { haptic } from '../lib/haptics';

interface ScreenProps {
  tab?: TabId;
  title: string;
  eyebrow?: ReactNode;
  color?: BrickColor;
  right?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
}

/** Plaka zeminli kaydırılabilir ekran: büyük başlık karosu, kaydırınca küçük başlık. */
export function Screen({ tab, title, eyebrow, color, right, onBack, children }: ScreenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const { registerScroller } = useNav();

  useEffect(() => {
    if (!tab) return;
    registerScroller(tab, ref.current);
    return () => registerScroller(tab, null);
  }, [tab, registerScroller]);

  return (
    <div className="screen">
      <div
        ref={ref}
        className={`scroll plate ${onBack ? 'has-back' : ''}`}
        onScroll={(e) => {
          const c = e.currentTarget.scrollTop > 70;
          if (c !== compactRef.current) {
            compactRef.current = c;
            setCompact(c);
          }
        }}
      >
        <header
          className={color ? 'title-block brick studs' : 'title-block tile'}
          style={color ? brickVars(color) : undefined}
        >
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {right && <div className="title-right">{right}</div>}
        </header>
        {children}
      </div>

      {onBack && (
        <button
          className="back-btn tile press"
          aria-label="Geri"
          onClick={() => {
            haptic();
            onBack();
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <AnimatePresence>
        {compact && (
          <motion.div
            className="compact-title tile"
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            aria-hidden="true"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
