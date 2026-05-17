import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { formatMeters } from '../model/geometry';
import type { Scene } from '../model/types';

const SCALE_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  fill: '#000000',
  fontWeight: '600',
});

const NICE_METERS = [0.5, 1, 2, 5, 10, 20, 50, 100, 200];

/** Screen-space height from baseline to top of label (ticks + text). */
export const EXPORT_SCALE_BAR_HEIGHT = 28;

/** Canvas scale bar: fixed ~targetScreenPx on screen; length in meters changes when zooming. */
export function scaleBarForViewport(
  pixelsPerMeter: number,
  viewportScale: number,
  targetScreenPx = 400,
): { barMeters: number; barScreenPx: number } {
  const zoom = viewportScale > 0 ? viewportScale : 1;
  const barMeters = pickScaleBarMeters(targetScreenPx / zoom, pixelsPerMeter);
  const barScreenPx = barMeters * pixelsPerMeter * zoom;
  return { barMeters, barScreenPx };
}

/** Pick a round bar length (m) so the bar is roughly `targetPx` wide at `pixelsPerMeter`. */
export function pickScaleBarMeters(targetPx: number, pixelsPerMeter: number): number {
  const ideal = targetPx / pixelsPerMeter;
  for (const m of NICE_METERS) {
    if (m >= ideal * 0.55) return m;
  }
  return NICE_METERS[NICE_METERS.length - 1];
}

/**
 * Screen-space scale bar; anchor is bottom-left of the bar graphic.
 * Returns null if scale is not calibrated.
 */
export function createScaleBarOverlay(
  bottomLeftX: number,
  bottomLeftY: number,
  scene: Scene,
  targetBarPx = 400,
): Container | null {
  const ppm = scene.pixelsPerMeter;
  if (!ppm || ppm <= 0) return null;

  const barMeters = pickScaleBarMeters(targetBarPx, ppm);
  const barPx = barMeters * ppm;
  const tickH = 8;

  const c = new Container();
  c.position.set(bottomLeftX, bottomLeftY);

  const g = new Graphics();
  g.moveTo(0, 0)
    .lineTo(barPx, 0)
    .moveTo(0, 0)
    .lineTo(0, -tickH)
    .moveTo(barPx, 0)
    .lineTo(barPx, -tickH)
    .stroke({ color: '#000000', width: 2, cap: 'square' });

  const label = new Text({
    text: formatMeters(barMeters),
    style: SCALE_LABEL_STYLE,
  });
  label.anchor.set(0, 1);
  label.position.set(0, -tickH - 4);

  c.addChild(g);
  c.addChild(label);
  return c;
}
