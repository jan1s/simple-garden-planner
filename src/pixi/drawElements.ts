import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  buildPathRibbon,
  metersToPixels,
  formatMeters,
  distance,
  pixelsToMeters,
  midpoint,
  perpendicularOffset,
} from '../model/geometry';
import { isPolygonLocked } from '../model/elements';
import type { GardenElement, PlantElement, Point, Scene } from '../model/types';
import { isArchitectural, type PlanDrawStyle } from './drawStyle';

const ARCH_STROKE = '#000000';
const ARCH_FILL_LIGHT = '#f5f5f5';
const ARCH_TEXT = '#000000';

const DIM_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  fill: '#1e3a5f',
  fontWeight: '600',
});

const PLANT_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  fill: '#ffffff',
  fontWeight: '700',
});

const PLANT_COMMENT_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 9,
  fill: '#374151',
  fontStyle: 'italic',
  wordWrap: true,
  wordWrapWidth: 200,
  align: 'center',
});

const ARCH_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 10,
  fill: ARCH_TEXT,
  fontWeight: '600',
});

const ARCH_COMMENT_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 8,
  fill: ARCH_TEXT,
  fontStyle: 'italic',
  wordWrap: true,
  wordWrapWidth: 200,
  align: 'center',
});

const ARCH_DIM_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 12,
  fill: ARCH_TEXT,
  fontWeight: '600',
});

const ANNOTATION_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 12,
  fill: '#1e3a5f',
  fontWeight: '600',
});

const ARCH_ANNOTATION_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  fill: ARCH_TEXT,
  fontWeight: '600',
});

/** Pixi fill() expects #hex or number; plot/terrace use rgba() in defaults. */
function fillStyle(color: string): { color: string; alpha?: number } {
  const rgba = color.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgba) return { color };
  const r = Math.round(Number(rgba[1]));
  const g = Math.round(Number(rgba[2]));
  const b = Math.round(Number(rgba[3]));
  const hex =
    '#' +
    [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
  const alpha = rgba[4] !== undefined ? Number(rgba[4]) : 1;
  return { color: hex, alpha };
}

export function drawElement(
  g: Graphics,
  el: GardenElement,
  scene: Scene,
  style: PlanDrawStyle = 'garden',
): void {
  const ppm = scene.pixelsPerMeter;
  const arch = isArchitectural(style);

  switch (el.type) {
    case 'building':
    case 'plot':
    case 'terrace': {
      if (el.points.length < 2) return;
      const flat = el.points.flatMap((p) => [p.x, p.y]);
      if (arch && el.points.length >= 3) {
        if (el.type === 'building') {
          g.poly(flat).fill({ color: ARCH_FILL_LIGHT });
        }
        g.poly(flat).stroke({
          color: ARCH_STROKE,
          width: el.type === 'plot' ? 2 : 1.5,
          join: 'round',
          cap: 'round',
        });
      } else {
        if (el.fill && el.points.length >= 3) {
          g.poly(flat).fill(fillStyle(el.fill));
        }
        const strokeOpts = {
          color: el.stroke.color,
          width: el.stroke.width,
          join: 'round' as const,
          cap: 'round' as const,
        };
        if (el.type === 'plot' && isPolygonLocked(el)) {
          g.poly(flat).stroke({ ...strokeOpts, width: el.stroke.width + 1 });
        } else {
          g.poly(flat).stroke(strokeOpts);
        }
      }
      break;
    }
    case 'path': {
      if (el.points.length < 2) return;
      const halfW = metersToPixels(el.widthM, ppm) / 2;
      const ribbon = buildPathRibbon(el.points, halfW);
      if (arch) {
        if (ribbon.length >= 3) {
          const ribbonFlat = ribbon.flatMap((p) => [p.x, p.y]);
          g.poly(ribbonFlat).fill({ color: ARCH_FILL_LIGHT });
          g.poly(ribbonFlat).stroke({
            color: ARCH_STROKE,
            width: 1,
            cap: 'round',
            join: 'round',
          });
        }
      } else {
        if (ribbon.length >= 3) {
          g.poly(ribbon.flatMap((p) => [p.x, p.y])).fill(
            fillStyle(el.color.startsWith('#') ? el.color : '#78716c'),
          );
        }
        const pathFlat = el.points.flatMap((p) => [p.x, p.y]);
        g.poly(pathFlat).stroke({
          color: '#44403c',
          width: 1,
          cap: 'round',
          join: 'round',
        });
      }
      break;
    }
    case 'fence': {
      if (el.points.length < 2) return;
      const fenceFlat = el.points.flatMap((p) => [p.x, p.y]);
      g.poly(fenceFlat).stroke({
        color: arch ? ARCH_STROKE : el.color,
        width: arch ? 1.5 : 2,
        cap: 'round',
        join: 'round',
      });
      for (const p of el.points) {
        if (arch) {
          g.rect(p.x - 2, p.y - 2, 4, 4).stroke({ color: ARCH_STROKE, width: 1 });
        } else {
          g.circle(p.x, p.y, 3).fill({ color: el.color });
        }
      }
      break;
    }
    case 'tree':
    case 'bush':
      break;
    default:
      break;
  }
}

function drawLabelBadgeCentered(
  container: Container,
  x: number,
  y: number,
  label: string,
  badgeColor: string,
): void {
  const text = new Text({ text: label, style: PLANT_LABEL_STYLE });
  text.anchor.set(0.5, 0.5);
  const padX = 6;
  const padY = 3;
  const w = text.width + padX * 2;
  const h = text.height + padY * 2;
  const bg = new Graphics();
  bg.roundRect(x - w / 2, y - h / 2, w, h, 4).fill({ color: badgeColor });
  text.position.set(x, y);
  container.addChild(bg);
  container.addChild(text);
}

function drawPlantArchitectural(
  container: Container,
  el: PlantElement,
  scene: Scene,
): void {
  const ppm = scene.pixelsPerMeter;
  const r = metersToPixels(el.sizeM, ppm) / 2;
  const { x, y } = el.position;
  const g = new Graphics();

  if (el.type === 'tree') {
    // Deciduous tree symbol: circle + center dot
    g.circle(x, y, r).stroke({ color: ARCH_STROKE, width: 1.5 });
    g.circle(x, y, Math.max(2, r * 0.12)).fill({ color: ARCH_STROKE });
  } else {
    // Shrub symbol: ellipse outline + stipple
    g.ellipse(x, y, r, r * 0.72).stroke({ color: ARCH_STROKE, width: 1.25 });
    const dots = 6;
    for (let i = 0; i < dots; i++) {
      const a = (i / dots) * Math.PI * 2;
      const dx = Math.cos(a) * r * 0.45;
      const dy = Math.sin(a) * r * 0.32;
      g.circle(x + dx, y + dy, Math.max(1.5, r * 0.08)).fill({ color: ARCH_STROKE });
    }
  }

  container.addChild(g);

  const label = new Text({ text: el.label, style: ARCH_LABEL_STYLE });
  label.anchor.set(0.5, 0);
  if (el.type === 'tree') {
    label.position.set(x, y + r + 5);
  } else {
    const ry = r * 0.72;
    label.position.set(x, y + ry + 5);
  }
  container.addChild(label);

  if (el.comment?.trim()) {
    const comment = new Text({
      text: el.comment.trim(),
      style: ARCH_COMMENT_STYLE,
    });
    comment.anchor.set(0.5, 0);
    const labelBottom =
      el.type === 'tree' ? y + r + 5 + 14 : y + r * 0.72 + 5 + 14;
    comment.position.set(x, labelBottom);
    container.addChild(comment);
  }
}

/** Draws plant shape, centered id badge, and optional comment below. */
export function drawPlant(
  container: Container,
  el: PlantElement,
  scene: Scene,
  style: PlanDrawStyle = 'garden',
): void {
  if (isArchitectural(style)) {
    drawPlantArchitectural(container, el, scene);
    return;
  }

  const ppm = scene.pixelsPerMeter;
  const opacity = el.opacity ?? 1;
  const r = metersToPixels(el.sizeM, ppm) / 2;
  const badgeColor = el.type === 'tree' ? '#15803d' : '#4d7c0f';

  const shape = new Graphics();
  shape.alpha = opacity;

  if (el.type === 'tree') {
    shape
      .circle(el.position.x, el.position.y, r)
      .fill({ color: '#166534' })
      .stroke({ color: '#14532d', width: 2 });
    shape.circle(el.position.x - r * 0.3, el.position.y - r * 0.2, r * 0.35).fill({
      color: '#22c55e',
      alpha: 0.7,
    });
  } else {
    shape
      .ellipse(el.position.x, el.position.y, r, r * 0.75)
      .fill({ color: '#4d7c0f' })
      .stroke({ color: '#365314', width: 1.5 });
  }

  container.addChild(shape);

  drawLabelBadgeCentered(
    container,
    el.position.x,
    el.position.y,
    el.label,
    badgeColor,
  );

  if (el.comment?.trim()) {
    const comment = new Text({
      text: el.comment.trim(),
      style: PLANT_COMMENT_STYLE,
    });
    comment.anchor.set(0.5, 0);
    comment.position.set(el.position.x, el.position.y + r + 10);
    container.addChild(comment);
  }
}

function drawArrowhead(
  g: Graphics,
  tip: Point,
  from: Point,
  size: number,
  color: string,
): void {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const wing = size;
  const left = {
    x: tip.x - wing * Math.cos(angle - Math.PI / 7),
    y: tip.y - wing * Math.sin(angle - Math.PI / 7),
  };
  const right = {
    x: tip.x - wing * Math.cos(angle + Math.PI / 7),
    y: tip.y - wing * Math.sin(angle + Math.PI / 7),
  };
  g.moveTo(tip.x, tip.y)
    .lineTo(left.x, left.y)
    .lineTo(right.x, right.y)
    .lineTo(tip.x, tip.y)
    .fill({ color });
}

/** Leader line start on the badge edge toward the arrow tip. */
function annotationLineStart(
  anchor: Point,
  tip: Point,
  badgeHalfW: number,
  badgeHalfH: number,
): Point {
  const dx = tip.x - anchor.x;
  const dy = tip.y - anchor.y;
  if (Math.hypot(dx, dy) < 1) return { ...anchor };
  const scale = Math.max(
    Math.abs(dx) / Math.max(badgeHalfW, 1),
    Math.abs(dy) / Math.max(badgeHalfH, 1),
  );
  return { x: anchor.x + dx / scale, y: anchor.y + dy / scale };
}

export function drawAnnotation(
  container: Container,
  el: Extract<GardenElement, { type: 'annotation' }>,
  style: PlanDrawStyle = 'garden',
): void {
  const arch = isArchitectural(style);
  const lineColor = arch ? ARCH_STROKE : '#1e3a5f';
  const badgeColor = arch ? ARCH_STROKE : '#1e40af';
  const textStyle = arch ? ARCH_ANNOTATION_STYLE : ANNOTATION_STYLE;
  const label = el.text.trim() || 'Note';

  const text = new Text({ text: label, style: textStyle });
  text.anchor.set(0.5, 0.5);
  const padX = 8;
  const padY = 5;
  const badgeW = text.width + padX * 2;
  const badgeH = text.height + padY * 2;
  const halfW = badgeW / 2;
  const halfH = badgeH / 2;

  const lineFrom = annotationLineStart(el.anchor, el.tip, halfW, halfH);
  const g = new Graphics();
  g.moveTo(lineFrom.x, lineFrom.y)
    .lineTo(el.tip.x, el.tip.y)
    .stroke({ color: lineColor, width: arch ? 1.25 : 1.5 });
  drawArrowhead(g, el.tip, lineFrom, arch ? 7 : 9, lineColor);
  container.addChild(g);

  const bg = new Graphics();
  bg.roundRect(
    el.anchor.x - halfW,
    el.anchor.y - halfH,
    badgeW,
    badgeH,
    4,
  ).fill({ color: badgeColor });
  text.position.set(el.anchor.x, el.anchor.y);
  container.addChild(bg);
  container.addChild(text);
}

export function drawDimension(
  container: Container,
  el: Extract<GardenElement, { type: 'dimension' }>,
  scene: Scene,
  style: PlanDrawStyle = 'garden',
): void {
  const ppm = scene.pixelsPerMeter;
  const lenPx = distance(el.a, el.b);
  const lenM = pixelsToMeters(lenPx, ppm);
  const label = lenM != null ? formatMeters(lenM) : `${lenPx.toFixed(0)} px`;
  const lineColor = isArchitectural(style) ? ARCH_STROKE : '#1e3a5f';
  const textStyle = isArchitectural(style) ? ARCH_DIM_STYLE : DIM_STYLE;

  const off = perpendicularOffset(el.a, el.b, el.offset);
  const aOff = { x: el.a.x + off.x, y: el.a.y + off.y };
  const bOff = { x: el.b.x + off.x, y: el.b.y + off.y };
  const mid = midpoint(aOff, bOff);

  const g = new Graphics();
  g.moveTo(el.a.x, el.a.y)
    .lineTo(aOff.x, aOff.y)
    .moveTo(el.b.x, el.b.y)
    .lineTo(bOff.x, bOff.y)
    .moveTo(aOff.x, aOff.y)
    .lineTo(bOff.x, bOff.y)
    .stroke({ color: lineColor, width: 1.5 });

  const tick = perpendicularOffset(aOff, bOff, 6);
  g.moveTo(aOff.x - tick.x, aOff.y - tick.y)
    .lineTo(aOff.x + tick.x, aOff.y + tick.y)
    .moveTo(bOff.x - tick.x, bOff.y - tick.y)
    .lineTo(bOff.x + tick.x, bOff.y + tick.y)
    .stroke({ color: lineColor, width: 1.5 });

  container.addChild(g);

  const text = new Text({ text: label, style: textStyle });
  text.anchor.set(0.5);
  text.position.set(mid.x, mid.y - 14);
  container.addChild(text);
}

export function drawPreviewPolygon(
  g: Graphics,
  points: { x: number; y: number }[],
  closed: boolean,
  color = '#2563eb',
): void {
  if (points.length === 0) return;
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    g.lineTo(points[i].x, points[i].y);
  }
  if (closed && points.length >= 3) {
    g.closePath();
    g.fill({ color, alpha: 0.15 });
  }
  g.stroke({ color, width: 2, cap: 'round', join: 'round' });
  for (const p of points) {
    g.circle(p.x, p.y, 5);
    g.fill({ color: '#fff' });
    g.stroke({ color, width: 2 });
  }
}

export function drawHandles(
  g: Graphics,
  points: { x: number; y: number }[],
  color = '#2563eb',
  viewportScale = 1,
): void {
  const r = 7 / (viewportScale > 0 ? viewportScale : 1);
  const strokeW = 2 / (viewportScale > 0 ? viewportScale : 1);
  for (const p of points) {
    g.circle(p.x, p.y, r);
    g.fill({ color: '#fff' });
    g.stroke({ color, width: strokeW });
  }
}
