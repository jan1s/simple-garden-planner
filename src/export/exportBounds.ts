import {
  buildPathRibbon,
  boundsOfPoints,
  metersToPixels,
  midpoint,
  perpendicularOffset,
} from '../model/geometry';
import {
  computePlotGridCells,
  computePlotGridEdgeLabels,
  computePlotGridLines,
} from '../model/grid';
import type { GardenElement, Point, Scene } from '../model/types';

const MIN_EXPORT_EXTENT = 80;

const DEFAULT_BOUNDS_MARGIN_PX = 24;
const ARCH_BOUNDS_MARGIN_PX = 40;

function expandMinExtent(bounds: {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}) {
  let { minX, minY, maxX, maxY } = bounds;
  const w = maxX - minX;
  const h = maxY - minY;

  if (w < MIN_EXPORT_EXTENT) {
    const cx = (minX + maxX) / 2;
    minX = cx - MIN_EXPORT_EXTENT / 2;
    maxX = cx + MIN_EXPORT_EXTENT / 2;
  }
  if (h < MIN_EXPORT_EXTENT) {
    const cy = (minY + maxY) / 2;
    minY = cy - MIN_EXPORT_EXTENT / 2;
    maxY = cy + MIN_EXPORT_EXTENT / 2;
  }

  return { minX, minY, maxX, maxY };
}

function expandPolygonBounds(
  points: Point[],
  strokeWidth: number,
): Point[] {
  if (points.length === 0) return [];
  const pad = strokeWidth + 12;
  const box = boundsOfPoints(points);
  return [
    ...points,
    { x: box.minX - pad, y: box.minY - pad },
    { x: box.maxX + pad, y: box.minY - pad },
    { x: box.maxX + pad, y: box.maxY + pad },
    { x: box.minX - pad, y: box.maxY + pad },
  ];
}

function collectElementPoints(
  el: GardenElement,
  scene: Scene,
  includeDimensions: boolean,
): Point[] {
  const ppm = scene.pixelsPerMeter;

  switch (el.type) {
    case 'tree':
    case 'bush': {
      const r = metersToPixels(el.sizeM, ppm) / 2;
      const ry = el.type === 'tree' ? r : r * 0.72;
      const belowLabel = ry + 5 + 16;
      const below = belowLabel + (el.comment?.trim() ? 40 : 0);
      const pts: Point[] = [
        { x: el.position.x - r - 12, y: el.position.y - r - 12 },
        { x: el.position.x + r + 12, y: el.position.y + below },
      ];
      if (el.comment?.trim()) {
        pts.push(
          { x: el.position.x - 110, y: el.position.y + belowLabel },
          { x: el.position.x + 110, y: el.position.y + below },
        );
      }
      return pts;
    }
    case 'dimension': {
      if (!includeDimensions) return [];
      const off = perpendicularOffset(el.a, el.b, el.offset);
      const aOff = { x: el.a.x + off.x, y: el.a.y + off.y };
      const bOff = { x: el.b.x + off.x, y: el.b.y + off.y };
      const mid = midpoint(aOff, bOff);
      return [
        el.a,
        el.b,
        aOff,
        bOff,
        { x: mid.x - 48, y: mid.y - 28 },
        { x: mid.x + 48, y: mid.y + 8 },
      ];
    }
    case 'annotation': {
      const pad = 72;
      return [
        el.tip,
        el.anchor,
        { x: el.anchor.x - pad, y: el.anchor.y - pad },
        { x: el.anchor.x + pad, y: el.anchor.y + pad },
      ];
    }
    case 'path': {
      if (el.points.length < 2) return el.points;
      const halfW = metersToPixels(el.widthM, ppm) / 2 + 4;
      const ribbon = buildPathRibbon(el.points, halfW);
      return ribbon.length >= 3 ? ribbon : el.points;
    }
    case 'fence': {
      const pad = 8;
      return el.points.flatMap((p) => [
        { x: p.x - pad, y: p.y - pad },
        { x: p.x + pad, y: p.y + pad },
      ]);
    }
    case 'building':
    case 'plot':
    case 'terrace': {
      const pts = expandPolygonBounds(el.points, el.stroke?.width ?? 2);
      if (el.type === 'plot' && el.grid?.enabled) {
        for (const [a, b] of computePlotGridLines(el, el.grid, ppm)) {
          pts.push(a, b);
        }
        if (el.grid.showLabels) {
          for (const edge of computePlotGridEdgeLabels(el, el.grid, ppm)) {
            pts.push(edge.position);
          }
          for (const cell of computePlotGridCells(el, el.grid, ppm)) {
            pts.push(cell.center);
          }
        }
      }
      return pts;
    }
    default:
      return [];
  }
}

export function computeExportBounds(
  scene: Scene,
  options: {
    /** Include reference image rectangle in bounds (even if not drawn). */
    includeBackground?: boolean;
    includeDimensions?: boolean;
    /** Extra world-space margin around content. */
    marginPx?: number;
  } = {},
): { minX: number; minY: number; maxX: number; maxY: number } {
  const {
    includeBackground = true,
    includeDimensions = true,
    marginPx = DEFAULT_BOUNDS_MARGIN_PX,
  } = options;

  const allPoints: Point[] = scene.elements.flatMap((el) =>
    collectElementPoints(el, scene, includeDimensions),
  );

  if (includeBackground && scene.background) {
    allPoints.push(
      { x: 0, y: 0 },
      { x: scene.background.width, y: scene.background.height },
    );
  }

  let bounds =
    allPoints.length === 0
      ? scene.background
        ? {
            minX: 0,
            minY: 0,
            maxX: scene.background.width,
            maxY: scene.background.height,
          }
        : { minX: 0, minY: 0, maxX: 800, maxY: 600 }
      : boundsOfPoints(allPoints);

  bounds = expandMinExtent(bounds);

  return {
    minX: bounds.minX - marginPx,
    minY: bounds.minY - marginPx,
    maxX: bounds.maxX + marginPx,
    maxY: bounds.maxY + marginPx,
  };
}

export { ARCH_BOUNDS_MARGIN_PX };
