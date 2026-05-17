import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const N_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 12,
  fill: '#000000',
  fontWeight: '700',
});

/** Draws a north arrow pointing up (negative Y). Origin is arrow base center. */
export function drawNorthIndicator(
  container: Container,
  size: number,
): void {
  const g = new Graphics();
  const shaftHalf = size * 0.38;
  const headW = size * 0.2;

  g.moveTo(0, shaftHalf)
    .lineTo(0, -shaftHalf)
    .moveTo(0, -shaftHalf)
    .lineTo(-headW, -shaftHalf + headW * 1.1)
    .moveTo(0, -shaftHalf)
    .lineTo(headW, -shaftHalf + headW * 1.1)
    .stroke({ color: '#000000', width: 2, cap: 'round', join: 'round' });

  const label = new Text({ text: 'N', style: N_LABEL_STYLE });
  label.anchor.set(0.5, 1);
  label.position.set(0, -shaftHalf - 6);

  container.addChild(g);
  container.addChild(label);
}

/** Screen-space overlay; `topRightX`/`topRightY` = top-right anchor of the indicator box. */
export function createNorthIndicatorOverlay(
  topRightX: number,
  topRightY: number,
  size = 40,
): Container {
  const c = new Container();
  c.position.set(topRightX - size * 0.5, topRightY + size * 0.55);
  drawNorthIndicator(c, size);
  return c;
}
