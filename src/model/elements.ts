import type { GardenElement, PolygonElement } from './types';

export function isPolygonElement(
  el: GardenElement,
): el is PolygonElement {
  return el.type === 'building' || el.type === 'plot' || el.type === 'terrace';
}

export function isPolygonLocked(el: GardenElement): boolean {
  return isPolygonElement(el) && el.locked === true;
}
