import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number; filled?: boolean };

const base = ({ size = 24, filled: _f, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
});

export const PlanetIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="5.6" fill={p.filled ? 'currentColor' : 'none'} />
    <ellipse cx="12" cy="12" rx="10.5" ry="3.6" transform="rotate(-22 12 12)" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={p.filled ? 2.8 : 2.4}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const BrickIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="9" width="18" height="11" rx="2.5" fill={p.filled ? 'currentColor' : 'none'} />
    <rect x="6" y="5" width="4.5" height="4" rx="1" fill={p.filled ? 'currentColor' : 'none'} />
    <rect x="13.5" y="5" width="4.5" height="4" rx="1" fill={p.filled ? 'currentColor' : 'none'} />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg {...base(p)}>
    <path
      d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.3a4.3 4.3 0 017.5 2.5C19.5 15.4 12 20 12 20z"
      fill={p.filled ? 'currentColor' : 'none'}
    />
  </svg>
);

export const DiceIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const GearIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
  </svg>
);

export const ChevronLeft = (p: P) => (
  <svg {...base(p)} strokeWidth={2.6}>
    <path d="M14.5 5l-7 7 7 7" />
  </svg>
);

export const ChevronRight = (p: P) => (
  <svg {...base(p)} strokeWidth={2.4}>
    <path d="M9.5 5l7 7-7 7" />
  </svg>
);

export const ArrowRight = (p: P) => (
  <svg {...base(p)} strokeWidth={2.4}>
    <path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.6}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.6}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.6}>
    <path d="M5 12h14" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={2.8}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const ExternalIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4.5h5.5V10M19.5 4.5L11 13M18 14v4.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 014 18.5v-11A1.5 1.5 0 015.5 6H10" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11M7.5 8L12 3.5 16.5 8M6 11.5H5a1.5 1.5 0 00-1.5 1.5v6A1.5 1.5 0 005 20.5h14a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-1" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15.5v-11M7.5 9L12 4.5 16.5 9M4.5 15v3.5A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5V15" />
  </svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5M4.5 15v3.5A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5V15" />
  </svg>
);

export const BookIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 5.5A1.5 1.5 0 016 4h12.5v14H6a1.5 1.5 0 00-1.5 1.5zM4.5 19.5A1.5 1.5 0 006 21h12.5v-3" />
  </svg>
);

export const FigureIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="3" width="8" height="6.5" rx="2" />
    <path d="M6 20.5v-6.5a3 3 0 013-3h6a3 3 0 013 3v6.5M10 20.5v-4M14 20.5v-4" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
  </svg>
);
