import type { ReactElement, ReactNode } from 'react';

/** Inline toolbar icons (24×24, stroke, currentColor). */

type IconProps = { size?: number; className?: string };

const defaults = { size: 20, className: undefined as string | undefined };

function Svg({
  size,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size ?? 20}
      height={size ?? 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconSelect(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M3 3l7 18 2-7 7-2L3 3z" />
      <path d="M13 13l6 6" />
    </Svg>
  );
}

export function IconPan(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M18 11V6a2 2 0 00-2-2 2 2 0 00-2 2" />
      <path d="M14 10V4a2 2 0 00-2-2 2 2 0 00-2 2v2" />
      <path d="M10 10.5V6a2 2 0 00-2-2 2 2 0 00-2 2v8" />
      <path d="M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 010-2.83l.88-.88" />
    </Svg>
  );
}

export function IconScale(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M21 8V3h-5" />
      <path d="M3 16v5h5" />
      <path d="M21 3l-7 7M3 21l7-7" />
    </Svg>
  );
}

export function IconDimension(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M4 12h16" />
      <path d="M4 8v8M20 8v8" />
    </Svg>
  );
}

export function IconPlot(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
    </Svg>
  );
}

export function IconBuilding(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M4 20V10l8-6 8 6v10" />
      <path d="M9 20v-6h6v6" />
    </Svg>
  );
}

export function IconTerrace(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M4 18h16" />
      <path d="M6 14h12" />
      <path d="M8 10h8" />
    </Svg>
  );
}

export function IconPath(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M4 17c3-6 5-8 8-8s5 2 8 8" />
    </Svg>
  );
}

export function IconFence(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M4 6v12M8 4v16M12 6v12M16 4v16M20 6v12" />
    </Svg>
  );
}

export function IconTree(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7" />
    </Svg>
  );
}

export function IconBush(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <ellipse cx="12" cy="13" rx="7" ry="4" />
    </Svg>
  );
}

export function IconCheck(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function IconImagePlus(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 15l-5-5L5 21" />
      <path d="M19 5v4M17 7h4" />
    </Svg>
  );
}

export function IconUndo(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M9 14H4V9" />
      <path d="M4 9a8 8 0 0113.5 3.5L20 14" />
    </Svg>
  );
}

export function IconRedo(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M15 14h5v-5" />
      <path d="M20 9a8 8 0 00-13.5-3.5L4 10" />
    </Svg>
  );
}

export function IconSave(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </Svg>
  );
}

export function IconFolderOpen(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M6 14H4a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v1" />
      <path d="M6 14l1.5 4h11L20 14V9H6z" />
    </Svg>
  );
}

export function IconFilePlus(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M12 18v-6M9 15h6" />
    </Svg>
  );
}

export function IconTable(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 10h18M9 5v14M15 5v14" />
    </Svg>
  );
}

export function IconDownload(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </Svg>
  );
}

export function IconMenu(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Svg>
  );
}

export function IconSettings(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  );
}

export function IconHelp(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 015 1c0 2-2.5 2-2.5 4" />
      <path d="M12 17h.01" strokeWidth="2.5" />
    </Svg>
  );
}

export function IconGrid(p: IconProps) {
  const { size, className } = { ...defaults, ...p };
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </Svg>
  );
}

export type ToolbarIconId =
  | 'select'
  | 'pan'
  | 'scale'
  | 'dimension'
  | 'plot'
  | 'building'
  | 'terrace'
  | 'path'
  | 'fence'
  | 'tree'
  | 'bush'
  | 'check'
  | 'image-plus'
  | 'undo'
  | 'redo'
  | 'save'
  | 'folder-open'
  | 'file-plus'
  | 'table'
  | 'download'
  | 'menu'
  | 'grid'
  | 'settings'
  | 'help';

const ICON_MAP: Record<ToolbarIconId, (p: IconProps) => ReactElement> = {
  select: IconSelect,
  pan: IconPan,
  scale: IconScale,
  dimension: IconDimension,
  plot: IconPlot,
  building: IconBuilding,
  terrace: IconTerrace,
  path: IconPath,
  fence: IconFence,
  tree: IconTree,
  bush: IconBush,
  check: IconCheck,
  'image-plus': IconImagePlus,
  undo: IconUndo,
  redo: IconRedo,
  save: IconSave,
  'folder-open': IconFolderOpen,
  'file-plus': IconFilePlus,
  table: IconTable,
  download: IconDownload,
  menu: IconMenu,
  grid: IconGrid,
  settings: IconSettings,
  help: IconHelp,
};

export function ToolbarIcon({
  name,
  size,
  className,
}: {
  name: ToolbarIconId;
  size?: number;
  className?: string;
}) {
  const C = ICON_MAP[name];
  return <C size={size} className={className} />;
}
