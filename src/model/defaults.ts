import type { StrokeStyle } from './types';

export const DEFAULT_STROKES: Record<string, StrokeStyle> = {
  building: { color: '#374151', width: 2 },
  plot: { color: '#15803d', width: 3 },
  terrace: { color: '#92400e', width: 2 },
};

export const DEFAULT_FILLS: Record<string, string> = {
  plot: 'rgba(34, 197, 94, 0.15)',
  terrace: 'rgba(180, 83, 9, 0.25)',
  building: 'rgba(55, 65, 81, 0.2)',
};

export const DEFAULT_PATH_WIDTH_M = 1.2;
export const DEFAULT_PATH_COLOR = '#78716c';
export const DEFAULT_FENCE_COLOR = '#57534e';
export const DEFAULT_TREE_SIZE_M = 4;
export const DEFAULT_BUSH_SIZE_M = 1.5;
export const DEFAULT_PLANT_OPACITY = 0.85;
export const SNAP_GRID_M = 0.25;
export const HANDLE_RADIUS = 8;
export const HIT_TOLERANCE = 10;
