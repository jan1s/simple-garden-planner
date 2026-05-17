import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Scene } from '../model/types';
import { ELEMENT_DRAW_ORDER } from '../model/types';
import {
  drawAnnotation,
  drawDimension,
  drawElement,
  drawPlant,
} from '../pixi/drawElements';
import type { PlanDrawStyle } from '../pixi/drawStyle';
import { drawPlotGrid } from '../pixi/drawPlotGrid';
import { createNorthIndicatorOverlay } from '../pixi/drawNorthIndicator';
import { createScaleBarOverlay } from '../pixi/drawScaleBar';
import { computeExportBounds } from './exportBounds';

export type ExportOptions = {
  scale: number;
  padding: number;
  includeBackground: boolean;
  includeDimensions: boolean;
  style?: PlanDrawStyle;
};

/** Target width of scale bar on exported image (screen px). */
export const EXPORT_SCALE_BAR_PX = 400;

function exportScreenInsets(arch: boolean, hasScale: boolean) {
  return {
    top: arch ? 56 : 28,
    right: arch ? 56 : 28,
    bottom: hasScale ? 40 : 28,
    left: hasScale ? EXPORT_SCALE_BAR_PX + 32 : 28,
  };
}

export async function renderSceneToCanvas(
  scene: Scene,
  options: ExportOptions,
): Promise<HTMLCanvasElement> {
  const {
    scale,
    padding,
    includeBackground,
    includeDimensions,
    style = 'garden',
  } = options;
  const arch = style === 'architectural';
  const hasScale = !!(scene.pixelsPerMeter && scene.pixelsPerMeter > 0);
  const insets = exportScreenInsets(arch, hasScale);

  await document.fonts.ready;

  const bounds = computeExportBounds(scene, {
    includeBackground: (includeBackground || arch) && !!scene.background,
    includeDimensions,
  });
  const contentW = bounds.maxX - bounds.minX;
  const contentH = bounds.maxY - bounds.minY;

  const width = Math.max(
    100,
    Math.ceil(
      contentW * scale + insets.left + insets.right + padding * 2,
    ),
  );
  const height = Math.max(
    100,
    Math.ceil(
      contentH * scale + insets.top + insets.bottom + padding * 2,
    ),
  );

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
    insets.left + padding - bounds.minX * scale,
    insets.top + padding - bounds.minY * scale,
  );
  root.scale.set(scale);
  app.stage.addChild(root);

  if (includeBackground && !arch && scene.background) {
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
        drawDimension(c, el, scene, style);
        root.addChild(c);
      } else if (el.type === 'annotation') {
        const c = new Container();
        drawAnnotation(c, el, style);
        root.addChild(c);
      } else if (el.type === 'tree' || el.type === 'bush') {
        const c = new Container();
        drawPlant(c, el, scene, style);
        root.addChild(c);
      } else if (el.type === 'plot') {
        const c = new Container();
        const g = new Graphics();
        drawElement(g, el, scene, style);
        c.addChild(g);
        if (el.grid?.enabled) drawPlotGrid(c, el, scene, style);
        root.addChild(c);
      } else {
        const g = new Graphics();
        drawElement(g, el, scene, style);
        root.addChild(g);
      }
    }
  }

  if (arch) {
    app.stage.addChild(
      createNorthIndicatorOverlay(width - 28, 28, 44),
    );
  }

  if (hasScale) {
    const scaleBar = createScaleBarOverlay(
      padding + 8,
      height - padding - 8,
      scene,
      EXPORT_SCALE_BAR_PX,
    );
    if (scaleBar) {
      app.stage.addChild(scaleBar);
    }
  }

  app.renderer.render({ container: app.stage });

  const extracted = app.renderer.extract.canvas({
    target: app.stage,
    clearColor: '#ffffff',
  }) as HTMLCanvasElement;

  app.destroy(true, { children: true, texture: true });

  return extracted;
}
