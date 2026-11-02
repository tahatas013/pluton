import { motion } from 'motion/react';
import { useNav, type TabId } from '../nav';
import { haptic } from '../lib/haptics';
import { BrickIcon, HeartIcon, PlanetIcon, SearchIcon } from './Icons';

const TABS: { id: TabId; label: string; Icon: typeof PlanetIcon }[] = [
  { id: 'kesfet', label: 'Keşfet', Icon: PlanetIcon },
  { id: 'ara', label: 'Ara', Icon: SearchIcon },
  { id: 'koleksiyon', label: 'Koleksiyon', Icon: BrickIcon },
  { id: 'istekler', label: 'İstekler', Icon: HeartIcon },
];

export function TabBar() {
  const { tab, selectTab } = useNav();
  return (
    <nav className="tabbar" aria-label="Sekmeler">
      {TABS.map(({ id, label, Icon }) => {
        const on = id === tab;
        return (
          <button
            key={id}
            className={`tabbar-btn ${on ? 'on' : ''}`}
            aria-current={on ? 'page' : undefined}
            onClick={() => {
              haptic();
              selectTab(id);
            }}
          >
            {on && (
              <motion.span
                layoutId="tabbar-pill"
                className="tabbar-pill"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.42 }}
              />
            )}
            <Icon filled={on} size={24} />
            <span className="tabbar-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
