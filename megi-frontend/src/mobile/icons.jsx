// Ikone iz mockupa (outline, 24 px). currentColor -> boja dolazi iz CSS-a.
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const TruckIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);

export const BagIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M5 8h14l-1 12H6z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const GridIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const ListIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
);

export const UserIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const BackIcon = (props) => (
  <svg {...base} strokeWidth={2} width={22} height={22} {...props}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const SearchIcon = (props) => (
  <svg {...base} strokeWidth={2} width={18} height={18} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const MinusIcon = (props) => (
  <svg {...base} strokeWidth={2.2} width={18} height={18} {...props}>
    <path d="M5 12h14" />
  </svg>
);

export const PlusIcon = (props) => (
  <svg {...base} strokeWidth={2.2} width={18} height={18} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const PrinterIcon = (props) => (
  <svg {...base} strokeWidth={2} width={22} height={22} {...props}>
    <path d="M6 9V3h12v6" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M7 14h10v7H7z" />
  </svg>
);

export const CloseIcon = (props) => (
  <svg {...base} strokeWidth={2} width={18} height={18} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
