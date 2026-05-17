/** Convert screen pixels to world-space hit tolerance at current zoom. */
export function worldTolerance(screenPx: number, viewportScale: number): number {
  const scale = viewportScale > 0 ? viewportScale : 1;
  return screenPx / scale;
}

export function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

export const VERTEX_HIT_SCREEN_PX = 24;
export const ELEMENT_HIT_SCREEN_PX = 20;
export const HANDLE_DRAW_SCREEN_PX = 14;
