import { HIT_TOLERANCE } from '../model/defaults';
import {
  distance,
  minDistanceToPolyline,
  pointInPolygon,
} from '../model/geometry';
import type { GardenElement, Point } from '../model/types';
import { ELEMENT_DRAW_ORDER } from '../model/types';

export function getElementPoints(el: GardenElement): Point[] {
  if (el.type === 'tree' || el.type === 'bush') return [el.position];
  if (el.type === 'dimension') return [el.a, el.b];
  if ('points' in el) return el.points;
  return [];
}

export function hitTestElement(
  worldPoint: Point,
  el: GardenElement,
  tolerance = HIT_TOLERANCE,
): boolean {
  switch (el.type) {
    case 'building':
    case 'plot':
    case 'terrace':
      if (el.points.length >= 3 && pointInPolygon(worldPoint, el.points)) {
        return true;
      }
      return minDistanceToPolyline(worldPoint, el.points) <= tolerance;
    case 'path':
    case 'fence':
      return minDistanceToPolyline(worldPoint, el.points) <= tolerance + 4;
    case 'tree':
    case 'bush':
      return distance(worldPoint, el.position) <= tolerance + 20;
    case 'dimension':
      return (
        minDistanceToPolyline(worldPoint, [el.a, el.b]) <= tolerance ||
        distance(worldPoint, el.a) <= tolerance ||
        distance(worldPoint, el.b) <= tolerance
      );
    default:
      return false;
  }
}

export function hitTestVertex(
  worldPoint: Point,
  points: Point[],
  tolerance = HIT_TOLERANCE,
): number {
  for (let i = 0; i < points.length; i++) {
    if (distance(worldPoint, points[i]) <= tolerance) return i;
  }
  return -1;
}

export function findTopElementAt(
  point: Point,
  elements: GardenElement[],
  visibility: Record<string, boolean>,
): GardenElement | null {
  const order = [...ELEMENT_DRAW_ORDER].reverse();
  for (const type of order) {
    if (visibility[type] === false) continue;
    const candidates = elements.filter((el) => el.type === type);
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (hitTestElement(point, candidates[i])) return candidates[i];
    }
  }
  return null;
}

export function getElementCentroid(el: GardenElement): Point {
  const pts = getElementPoints(el);
  if (pts.length === 0) return { x: 0, y: 0 };
  const sum = pts.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / pts.length, y: sum.y / pts.length };
}
