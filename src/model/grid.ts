import { HANDLE_RADIUS } from './defaults';
import { distance, metersToPixels, pointInPolygon } from './geometry';
import { HANDLE_DRAW_SCREEN_PX, worldTolerance } from '../utils/touch';
import type { PlotGrid, Point, PolygonElement } from './types';

export const DEFAULT_PLOT_GRID: PlotGrid = {
  enabled: false,
  cellSizeM: 2,
  orientationDeg: 0,
  offsetXM: 0,
  offsetYM: 0,
  showLabels: true,
};

export function normalizePlotGrid(plot: PolygonElement): PolygonElement {
  if (plot.type !== 'plot') return plot;
  return {
    ...plot,
    grid: { ...DEFAULT_PLOT_GRID, ...plot.grid },
  };
}

/** Column index 0 → A, 1 → B, 26 → AA */
export function colToLetter(col: number): string {
  let n = col;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

export function cellName(col: number, row: number): string {
  return `${colToLetter(col)}${row + 1}`;
}

export type GridCell = {
  col: number;
  row: number;
  name: string;
  center: Point;
  corners: [Point, Point, Point, Point];
};

export type GridEdgeLabel = {
  kind: 'col' | 'row';
  text: string;
  position: Point;
};

type GridAxes = {
  origin: Point;
  ex: Point;
  ey: Point;
  spacingPx: number;
};

function polygonCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function buildAxes(
  plot: PolygonElement,
  grid: PlotGrid,
  pixelsPerMeter: number | null,
): GridAxes | null {
  if (plot.points.length < 3) return null;

  const spacingPx = metersToPixels(grid.cellSizeM, pixelsPerMeter);
  if (spacingPx < 4) return null;

  const centroid = polygonCentroid(plot.points);
  const rad = (grid.orientationDeg * Math.PI) / 180;
  const ex = { x: Math.cos(rad), y: Math.sin(rad) };
  const ey = { x: -Math.sin(rad), y: Math.cos(rad) };

  const offsetPxX = metersToPixels(grid.offsetXM, pixelsPerMeter);
  const offsetPxY = metersToPixels(grid.offsetYM, pixelsPerMeter);

  const origin = {
    x: centroid.x + ex.x * offsetPxX + ey.x * offsetPxY,
    y: centroid.y + ex.y * offsetPxX + ey.y * offsetPxY,
  };

  return { origin, ex, ey, spacingPx };
}

export type GridHandlePositions = {
  origin: Point;
  orientation: Point;
};

export function getPlotGridAxes(
  plot: PolygonElement,
  grid: PlotGrid,
  pixelsPerMeter: number | null,
): GridAxes | null {
  return buildAxes(plot, grid, pixelsPerMeter);
}

/** World positions for interactive origin and orientation handles. */
export function getGridHandlePositions(
  plot: PolygonElement,
  grid: PlotGrid,
  pixelsPerMeter: number | null,
): GridHandlePositions | null {
  const axes = buildAxes(plot, grid, pixelsPerMeter);
  if (!axes) return null;
  const armLen = Math.max(axes.spacingPx * 2.5, 40);
  return {
    origin: { ...axes.origin },
    orientation: {
      x: axes.origin.x + axes.ex.x * armLen,
      y: axes.origin.y + axes.ex.y * armLen,
    },
  };
}

export type GridHandleId = 'origin' | 'orientation';

export function hitTestGridHandle(
  world: Point,
  plot: PolygonElement,
  pixelsPerMeter: number | null,
  viewportScale = 1,
): GridHandleId | null {
  const grid = plot.grid;
  if (plot.type !== 'plot' || !grid?.enabled) return null;
  const handles = getGridHandlePositions(plot, grid, pixelsPerMeter);
  if (!handles) return null;

  const screenR = HANDLE_DRAW_SCREEN_PX + 10;
  const r = Math.max(HANDLE_RADIUS + 6, worldTolerance(screenR, viewportScale));
  const dOrigin = distance(world, handles.origin);
  const dOrient = distance(world, handles.orientation);

  if (dOrient <= r && dOrient <= dOrigin) return 'orientation';
  if (dOrigin <= r) return 'origin';
  return null;
}

/**
 * Offsets (m) so that at `orientationDeg` the grid origin sits at `fixedOriginWorld`.
 * Used when rotating: keeps the pivot fixed while axes turn.
 */
export function gridOffsetsForFixedOrigin(
  plot: PolygonElement,
  fixedOriginWorld: Point,
  orientationDeg: number,
  pixelsPerMeter: number | null,
): { offsetXM: number; offsetYM: number } {
  const centroid = polygonCentroid(plot.points);
  const rad = (orientationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = fixedOriginWorld.x - centroid.x;
  const dy = fixedOriginWorld.y - centroid.y;
  const offsetPxX = dx * cos + dy * sin;
  const offsetPxY = -dx * sin + dy * cos;
  const ppm = pixelsPerMeter && pixelsPerMeter > 0 ? pixelsPerMeter : 50;
  return { offsetXM: offsetPxX / ppm, offsetYM: offsetPxY / ppm };
}

/** Convert dragged origin (world) to grid offset in meters from plot centroid. */
export function gridOffsetsFromOriginWorld(
  plot: PolygonElement,
  grid: PlotGrid,
  originWorld: Point,
  pixelsPerMeter: number | null,
): { offsetXM: number; offsetYM: number } {
  return gridOffsetsForFixedOrigin(
    plot,
    originWorld,
    grid.orientationDeg,
    pixelsPerMeter,
  );
}

export function orientationDegFromWorld(
  origin: Point,
  world: Point,
): number {
  const deg = (Math.atan2(world.y - origin.y, world.x - origin.x) * 180) / Math.PI;
  return Math.round(deg * 10) / 10;
}

export function worldToGridLocal(p: Point, axes: GridAxes): Point {
  const dx = p.x - axes.origin.x;
  const dy = p.y - axes.origin.y;
  return {
    x: dx * axes.ex.x + dy * axes.ex.y,
    y: dx * axes.ey.x + dy * axes.ey.y,
  };
}

export function gridLocalToWorld(local: Point, axes: GridAxes): Point {
  return {
    x:
      axes.origin.x +
      local.x * axes.ex.x +
      local.y * axes.ey.x,
    y:
      axes.origin.y +
      local.x * axes.ex.y +
      local.y * axes.ey.y,
  };
}

export function computePlotGridCells(
  plot: PolygonElement,
  grid: PlotGrid,
  pixelsPerMeter: number | null,
): GridCell[] {
  if (!grid.enabled || plot.points.length < 3) return [];

  const axes = buildAxes(plot, grid, pixelsPerMeter);
  if (!axes) return [];

  const locals = plot.points.map((p) => worldToGridLocal(p, axes));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const l of locals) {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x);
    maxY = Math.max(maxY, l.y);
  }

  const col0 = Math.floor(minX / axes.spacingPx);
  const col1 = Math.ceil(maxX / axes.spacingPx);
  const row0 = Math.floor(minY / axes.spacingPx);
  const row1 = Math.ceil(maxY / axes.spacingPx);

  const cells: GridCell[] = [];

  for (let col = col0; col < col1; col++) {
    for (let row = row0; row < row1; row++) {
      const x0 = col * axes.spacingPx;
      const y0 = row * axes.spacingPx;
      const x1 = x0 + axes.spacingPx;
      const y1 = y0 + axes.spacingPx;
      const center = gridLocalToWorld(
        { x: (x0 + x1) / 2, y: (y0 + y1) / 2 },
        axes,
      );

      if (!pointInPolygon(center, plot.points)) continue;

      const corners = [
        gridLocalToWorld({ x: x0, y: y0 }, axes),
        gridLocalToWorld({ x: x1, y: y0 }, axes),
        gridLocalToWorld({ x: x1, y: y1 }, axes),
        gridLocalToWorld({ x: x0, y: y1 }, axes),
      ] as [Point, Point, Point, Point];

      cells.push({
        col,
        row,
        name: cellName(col, row),
        center,
        corners,
      });
    }
  }

  return cells;
}

/** Column letters (A, B, …) and row numbers (1, 2, …) along the grid bounding edges. */
export function computePlotGridEdgeLabels(
  plot: PolygonElement,
  grid: PlotGrid,
  pixelsPerMeter: number | null,
): GridEdgeLabel[] {
  const cells = computePlotGridCells(plot, grid, pixelsPerMeter);
  if (cells.length === 0) return [];

  const axes = buildAxes(plot, grid, pixelsPerMeter);
  if (!axes) return [];

  const locals = plot.points.map((p) => worldToGridLocal(p, axes));
  let minX = Infinity;
  let minY = Infinity;
  for (const l of locals) {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
  }

  const labelPad = axes.spacingPx * 0.55;
  const colSet = new Set(cells.map((c) => c.col));
  const rowSet = new Set(cells.map((c) => c.row));
  const labels: GridEdgeLabel[] = [];

  for (const col of [...colSet].sort((a, b) => a - b)) {
    labels.push({
      kind: 'col',
      text: colToLetter(col),
      position: gridLocalToWorld(
        { x: (col + 0.5) * axes.spacingPx, y: minY - labelPad },
        axes,
      ),
    });
  }

  for (const row of [...rowSet].sort((a, b) => a - b)) {
    labels.push({
      kind: 'row',
      text: String(row + 1),
      position: gridLocalToWorld(
        { x: minX - labelPad, y: (row + 0.5) * axes.spacingPx },
        axes,
      ),
    });
  }

  return labels;
}

/** Bed cell name (e.g. A1) at a world position, or empty if outside grid cells. */
export function findBedCellAtPosition(
  position: Point,
  plot: PolygonElement | undefined,
  pixelsPerMeter: number | null,
): string {
  if (!plot || plot.type !== 'plot' || !plot.grid?.enabled) return '';
  for (const cell of computePlotGridCells(plot, plot.grid, pixelsPerMeter)) {
    if (pointInPolygon(position, [...cell.corners])) return cell.name;
  }
  return '';
}

/** Line segments of grid clipped inside the plot (for drawing). */
export function computePlotGridLines(
  plot: PolygonElement,
  grid: PlotGrid,
  pixelsPerMeter: number | null,
): [Point, Point][] {
  if (!grid.enabled || plot.points.length < 3) return [];

  const axes = buildAxes(plot, grid, pixelsPerMeter);
  if (!axes) return [];

  const locals = plot.points.map((p) => worldToGridLocal(p, axes));
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const l of locals) {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x);
    maxY = Math.max(maxY, l.y);
  }

  const margin = axes.spacingPx;
  const segments: [Point, Point][] = [];

  const col0 = Math.floor(minX / axes.spacingPx);
  const col1 = Math.ceil(maxX / axes.spacingPx);
  const row0 = Math.floor(minY / axes.spacingPx);
  const row1 = Math.ceil(maxY / axes.spacingPx);

  for (let col = col0; col <= col1; col++) {
    const x = col * axes.spacingPx;
    const a = gridLocalToWorld({ x, y: minY - margin }, axes);
    const b = gridLocalToWorld({ x, y: maxY + margin }, axes);
    clipSegmentToPolygon(a, b, plot.points, segments);
  }

  for (let row = row0; row <= row1; row++) {
    const y = row * axes.spacingPx;
    const a = gridLocalToWorld({ x: minX - margin, y }, axes);
    const b = gridLocalToWorld({ x: maxX + margin, y }, axes);
    clipSegmentToPolygon(a, b, plot.points, segments);
  }

  return segments;
}

function clipSegmentToPolygon(
  a: Point,
  b: Point,
  polygon: Point[],
  out: [Point, Point][],
): void {
  const ts: number[] = [];
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (pointInPolygon(a, polygon)) ts.push(0);
  if (pointInPolygon(b, polygon)) ts.push(1);

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const t = segmentIntersectT(a, b, p1, p2);
    if (t !== null && t >= 0 && t <= 1) ts.push(t);
  }

  if (ts.length < 2) return;
  ts.sort((x, y) => x - y);

  for (let i = 0; i < ts.length - 1; i++) {
    const t0 = ts[i];
    const t1 = ts[i + 1];
    const mid = {
      x: a.x + (dx * (t0 + t1)) / 2,
      y: a.y + (dy * (t0 + t1)) / 2,
    };
    if (pointInPolygon(mid, polygon)) {
      out.push([
        { x: a.x + dx * t0, y: a.y + dy * t0 },
        { x: a.x + dx * t1, y: a.y + dy * t1 },
      ]);
    }
  }
}

function segmentIntersectT(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
): number | null {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  if (Math.abs(denom) < 1e-10) return null;
  const qp = { x: c.x - a.x, y: c.y - a.y };
  const t = (qp.x * s.y - qp.y * s.x) / denom;
  const u = (qp.x * r.y - qp.y * r.x) / denom;
  if (u >= 0 && u <= 1) return t;
  return null;
}
