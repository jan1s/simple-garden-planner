import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { boundsOfPoints } from '../model/geometry';
import { getElementPoints } from '../pixi/hitTest';
import type { Point, Scene } from '../model/types';
import { ELEMENT_DRAW_ORDER } from '../model/types';
import { drawDimension, drawElement, drawPlant } from '../pixi/drawElements';
import { drawPlotGrid } from '../pixi/drawPlotGrid';

export type ExportOptions = {
  scale: number;
  padding: number;
  includeBackground: boolean;
  includeDimensions: boolean;
};

const MIN_EXPORT_EXTENT = 80;

function expandBounds(bounds: {
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

function computeExportBounds(scene: Scene): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const allPoints: Point[] = scene.elements.flatMap((el) => {
    const pts = getElementPoints(el);
    if (el.type === 'tree' || el.type === 'bush') {
      const below = 50 + (el.comment?.trim() ? 36 : 0);
      pts.push(
        { x: el.position.x - 60, y: el.position.y + below },
        { x: el.position.x + 60, y: el.position.y + below },
      );
    }
    return pts;
  });

  if (scene.background) {
    allPoints.push(
      { x: 0, y: 0 },
      { x: scene.background.width, y: scene.background.height },
    );
  }

  if (allPoints.length === 0) {
    if (scene.background) {
      return expandBounds({
        minX: 0,
        minY: 0,
        maxX: scene.background.width,
        maxY: scene.background.height,
      });
    }
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }

  return expandBounds(boundsOfPoints(allPoints));
}

export async function renderSceneToCanvas(
  scene: Scene,
  options: ExportOptions,
): Promise<HTMLCanvasElement> {
  const { scale, padding, includeBackground, includeDimensions } = options;

  await document.fonts.ready;

  const bounds = computeExportBounds(scene);
  const contentW = bounds.maxX - bounds.minX;
  const contentH = bounds.maxY - bounds.minY;
  const width = Math.max(100, Math.ceil(contentW * scale + padding * 2));
  const height = Math.max(100, Math.ceil(contentH * scale + padding * 2));

  const app = new Application();
  await app.init({
    width,
    height,
    background: '#ffffff',
    antialias: true,
    resolution: 2,
  });

  const root = new Container();
  root.position.set(
    padding - bounds.minX * scale,
    padding - bounds.minY * scale,
  );
  root.scale.set(scale);
  app.stage.addChild(root);

  if (includeBackground && scene.background) {
    const texture = Texture.from(scene.background.imageDataUrl);
    const sprite = new Sprite(texture);
    sprite.alpha = scene.background.opacity;
    root.addChildAt(sprite, 0);
  }

  for (const type of ELEMENT_DRAW_ORDER) {
    if (type === 'dimension' && !includeDimensions) continue;
    const els = scene.elements.filter((el) => el.type === type);
    for (const el of els) {
      if (el.type === 'dimension') {
        const c = new Container();
        drawDimension(c, el, scene);
        root.addChild(c);
      } else if (el.type === 'tree' || el.type === 'bush') {
        const c = new Container();
        drawPlant(c, el, scene);
        root.addChild(c);
      } else if (el.type === 'plot') {
        const c = new Container();
        const g = new Graphics();
        drawElement(g, el, scene);
        c.addChild(g);
        if (el.grid?.enabled) drawPlotGrid(c, el, scene);
        root.addChild(c);
      } else {
        const g = new Graphics();
        drawElement(g, el, scene);
        root.addChild(g);
      }
    }
  }

  app.renderer.render({ container: app.stage });

  // Copy pixels before destroy — destroying the app clears the WebGL canvas
  const extracted = app.renderer.extract.canvas({
    target: app.stage,
    clearColor: '#ffffff',
  }) as HTMLCanvasElement;

  app.destroy(true, { children: true, texture: true });

  return extracted;
}
