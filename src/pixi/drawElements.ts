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
import type { GardenElement, PlantElement, Scene } from '../model/types';

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
): void {
  const ppm = scene.pixelsPerMeter;

  switch (el.type) {
    case 'building':
    case 'plot':
    case 'terrace': {
      if (el.points.length < 2) return;
      const flat = el.points.flatMap((p) => [p.x, p.y]);
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
      break;
    }
    case 'path': {
      if (el.points.length < 2) return;
      const halfW = metersToPixels(el.widthM, ppm) / 2;
      const ribbon = buildPathRibbon(el.points, halfW);
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
      break;
    }
    case 'fence': {
      if (el.points.length < 2) return;
      const fenceFlat = el.points.flatMap((p) => [p.x, p.y]);
      g.poly(fenceFlat).stroke({
        color: el.color,
        width: 2,
        cap: 'round',
        join: 'round',
      });
      for (const p of el.points) {
        g.circle(p.x, p.y, 3).fill({ color: el.color });
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

/** Draws plant shape, centered id badge, and optional comment below. */
export function drawPlant(
  container: Container,
  el: PlantElement,
  scene: Scene,
): void {
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

export function drawDimension(
  container: Container,
  el: Extract<GardenElement, { type: 'dimension' }>,
  scene: Scene,
): void {
  const ppm = scene.pixelsPerMeter;
  const lenPx = distance(el.a, el.b);
  const lenM = pixelsToMeters(lenPx, ppm);
  const label = lenM != null ? formatMeters(lenM) : `${lenPx.toFixed(0)} px`;

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
    .stroke({ color: '#1e3a5f', width: 1.5 });

  const tick = perpendicularOffset(aOff, bOff, 6);
  g.moveTo(aOff.x - tick.x, aOff.y - tick.y)
    .lineTo(aOff.x + tick.x, aOff.y + tick.y)
    .moveTo(bOff.x - tick.x, bOff.y - tick.y)
    .lineTo(bOff.x + tick.x, bOff.y + tick.y)
    .stroke({ color: '#1e3a5f', width: 1.5 });

  container.addChild(g);

  const text = new Text({ text: label, style: DIM_STYLE });
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
): void {
  for (const p of points) {
    g.circle(p.x, p.y, 7);
    g.fill({ color: '#fff' });
    g.stroke({ color, width: 2 });
  }
}
