import { SNAP_GRID_M } from './defaults';
import type { Point } from './types';

export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function polylineLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function distanceToSegment(
  p: Point,
  a: Point,
  b: Point,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return distance(p, proj);
}

export function minDistanceToPolyline(p: Point, points: Point[]): number {
  if (points.length === 0) return Infinity;
  if (points.length === 1) return distance(p, points[0]);
  let min = Infinity;
  for (let i = 1; i < points.length; i++) {
    min = Math.min(min, distanceToSegment(p, points[i - 1], points[i]));
  }
  return min;
}

export function pixelsToMeters(px: number, pixelsPerMeter: number | null): number | null {
  if (!pixelsPerMeter || pixelsPerMeter <= 0) return null;
  return px / pixelsPerMeter;
}

export function metersToPixels(m: number, pixelsPerMeter: number | null): number {
  if (!pixelsPerMeter) return m * 50;
  return m * pixelsPerMeter;
}

export function formatMeters(m: number): string {
  if (m < 1) return `${(m * 100).toFixed(0)} cm`;
  return `${m.toFixed(2)} m`;
}

export function snapPoint(
  point: Point,
  pixelsPerMeter: number | null,
  enabled: boolean,
): Point {
  if (!enabled || !pixelsPerMeter) return point;
  const gridPx = SNAP_GRID_M * pixelsPerMeter;
  return {
    x: Math.round(point.x / gridPx) * gridPx,
    y: Math.round(point.y / gridPx) * gridPx,
  };
}

export function translatePoints(points: Point[], dx: number, dy: number): Point[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function perpendicularOffset(a: Point, b: Point, offset: number): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return { x: nx * offset, y: ny * offset };
}

function jointOffsets(
  prev: Point,
  curr: Point,
  next: Point,
  halfWidth: number,
): { left: Point; right: Point } {
  const v1x = curr.x - prev.x;
  const v1y = curr.y - prev.y;
  const v2x = next.x - curr.x;
  const v2y = next.y - curr.y;
  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);

  if (len1 < 1e-6 || len2 < 1e-6) {
    const off = perpendicularOffset(prev, next, halfWidth);
    return {
      left: { x: curr.x + off.x, y: curr.y + off.y },
      right: { x: curr.x - off.x, y: curr.y - off.y },
    };
  }

  const n1x = -v1y / len1;
  const n1y = v1x / len1;
  const n2x = -v2y / len2;
  const n2y = v2x / len2;

  let bx = n1x + n2x;
  let by = n1y + n2y;
  const blen = Math.hypot(bx, by);

  if (blen < 1e-6) {
    return {
      left: { x: curr.x + n1x * halfWidth, y: curr.y + n1y * halfWidth },
      right: { x: curr.x - n1x * halfWidth, y: curr.y - n1y * halfWidth },
    };
  }

  bx /= blen;
  by /= blen;

  const dot = bx * n1x + by * n1y;
  const miterLen = halfWidth / Math.max(Math.abs(dot), 0.2);
  const clamped = Math.min(miterLen, halfWidth * 6);

  return {
    left: { x: curr.x + bx * clamped, y: curr.y + by * clamped },
    right: { x: curr.x - bx * clamped, y: curr.y - by * clamped },
  };
}

/** Continuous filled outline for a polyline path (no gaps at corners). */
export function buildPathRibbon(points: Point[], halfWidth: number): Point[] {
  if (points.length < 2 || halfWidth <= 0) return [];

  const left: Point[] = [];
  const right: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const curr = points[i];

    if (i === 0) {
      const next = points[i + 1];
      const off = perpendicularOffset(curr, next, halfWidth);
      left.push({ x: curr.x + off.x, y: curr.y + off.y });
      right.push({ x: curr.x - off.x, y: curr.y - off.y });
    } else if (i === points.length - 1) {
      const prev = points[i - 1];
      const off = perpendicularOffset(prev, curr, halfWidth);
      left.push({ x: curr.x + off.x, y: curr.y + off.y });
      right.push({ x: curr.x - off.x, y: curr.y - off.y });
    } else {
      const joint = jointOffsets(points[i - 1], curr, points[i + 1], halfWidth);
      left.push(joint.left);
      right.push(joint.right);
    }
  }

  return [...left, ...right.reverse()];
}

export function boundsOfPoints(points: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}
