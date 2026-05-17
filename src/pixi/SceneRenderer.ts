import { Assets, Container, Graphics, Sprite } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import { useSceneStore } from '../store/sceneStore';
import { ELEMENT_DRAW_ORDER } from '../model/types';
import { isPolygonLocked } from '../model/elements';
import type { GardenElement } from '../model/types';
import {
  drawDimension,
  drawElement,
  drawHandles,
  drawPlant,
  drawPreviewPolygon,
} from './drawElements';
import { drawPlotGrid } from './drawPlotGrid';
import { drawGridHandles } from './drawGridHandles';
import type { ToolController } from './interaction/ToolController';

const PREVIEW_COLORS: Record<string, string> = {
  building: '#374151',
  plot: '#15803d',
  terrace: '#92400e',
  path: '#78716c',
  fence: '#57534e',
};

export class SceneRenderer {
  private bgLayer = new Container();
  private elementsLayer = new Container();
  private overlayLayer = new Container();
  private bgSprite: Sprite | null = null;
  private unsub: (() => void) | null = null;

  private viewport: Viewport;
  private getToolController: () => ToolController | null;
  private bgDataUrl: string | null = null;

  constructor(
    viewport: Viewport,
    getToolController: () => ToolController | null,
  ) {
    this.viewport = viewport;
    this.getToolController = getToolController;
    viewport.addChild(this.bgLayer);
    viewport.addChild(this.elementsLayer);
    viewport.addChild(this.overlayLayer);
  }

  mount(): void {
    this.unsub = useSceneStore.subscribe(() => this.render());

    this.viewport.on('pointerdblclick', (e) => {
      this.getToolController()?.onDoubleClick(e);
      this.render();
    });
  }

  destroy(): void {
    this.unsub?.();
  }

  render(): void {
    const state = useSceneStore.getState();
    const { scene, layerVisibility, selectedIds } = state;
    const toolCtrl = this.getToolController();
    const preview = toolCtrl?.getPreviewState();

    // Background
    if (scene.background) {
      if (scene.background.imageDataUrl !== this.bgDataUrl) {
        this.bgDataUrl = scene.background.imageDataUrl;
        void this.loadBackground(scene.background.imageDataUrl, scene.background.opacity);
      } else if (this.bgSprite) {
        this.bgSprite.alpha = scene.background.opacity;
      }
    } else {
      this.bgLayer.removeChildren();
      this.bgSprite = null;
      this.bgDataUrl = null;
    }

    // Elements
    this.elementsLayer.removeChildren();

    for (const type of ELEMENT_DRAW_ORDER) {
      if (layerVisibility[type] === false) continue;
      const els = scene.elements.filter((el) => el.type === type);
      for (const el of els) {
        if (el.type === 'dimension') {
          const c = new Container();
          drawDimension(c, el, scene);
          this.elementsLayer.addChild(c);
        } else if (el.type === 'tree' || el.type === 'bush') {
          const c = new Container();
          drawPlant(c, el, scene);
          this.elementsLayer.addChild(c);
        } else if (el.type === 'plot') {
          const c = new Container();
          const g = new Graphics();
          drawElement(g, el, scene);
          c.addChild(g);
          if (el.grid?.enabled) drawPlotGrid(c, el, scene);
          this.elementsLayer.addChild(c);
        } else {
          const g = new Graphics();
          drawElement(g, el, scene);
          this.elementsLayer.addChild(g);
        }
      }
    }

    // Overlay: previews + selection handles
    this.overlayLayer.removeChildren();
    const overlay = new Graphics();

    if (preview?.polygon && preview.polygon.points.length > 0) {
      drawPreviewPolygon(
        overlay,
        preview.polygon.points,
        false,
        PREVIEW_COLORS[preview.polygon.type] ?? '#2563eb',
      );
    }

    if (preview?.polyline && preview.polyline.points.length > 0) {
      drawPreviewPolygon(
        overlay,
        preview.polyline.points,
        false,
        PREVIEW_COLORS[preview.polyline.type] ?? '#78716c',
      );
    }

    if (preview?.dimension?.a && preview.dimension.b) {
      const dimEl = {
        type: 'dimension' as const,
        id: '__preview__',
        a: preview.dimension.a,
        b: preview.dimension.b,
        offset: 30,
      };
      const c = new Container();
      drawDimension(c, dimEl, scene);
      this.overlayLayer.addChild(c);
    }

    if (preview?.scale?.a) {
      overlay.circle(preview.scale.a.x, preview.scale.a.y, 6);
      overlay.fill({ color: '#dc2626' });
      if (preview.scale.b) {
        overlay.moveTo(preview.scale.a.x, preview.scale.a.y);
        overlay.lineTo(preview.scale.b.x, preview.scale.b.y);
        overlay.stroke({ color: '#dc2626', width: 2 });
        overlay.circle(preview.scale.b.x, preview.scale.b.y, 6);
        overlay.fill({ color: '#dc2626' });
      }
    }

    const viewportScale = this.viewport.scale.x;

    if (preview?.selectHandles && preview.selectHandles.length > 0) {
      drawHandles(overlay, preview.selectHandles, '#2563eb', viewportScale);
    }

    if (preview?.gridHandles) {
      drawGridHandles(overlay, preview.gridHandles, viewportScale);
    }

    // Selection highlight
    for (const id of selectedIds) {
      const el = scene.elements.find((x) => x.id === id);
      if (!el) continue;
      this.highlightElement(overlay, el);
    }

    this.overlayLayer.addChild(overlay);
  }

  private async loadBackground(dataUrl: string, opacity: number): Promise<void> {
    try {
      const texture = await Assets.load(dataUrl);
      if (this.bgDataUrl !== dataUrl) return;
      this.bgLayer.removeChildren();
      this.bgSprite = new Sprite(texture);
      this.bgSprite.alpha = opacity;
      this.bgLayer.addChild(this.bgSprite);
    } catch {
      // ignore load errors
    }
  }

  private highlightElement(g: Graphics, el: GardenElement): void {
    if (el.type === 'tree' || el.type === 'bush') {
      g.circle(el.position.x, el.position.y, 24);
      g.stroke({ color: '#2563eb', width: 2 });
    } else if (el.type === 'dimension') {
      g.moveTo(el.a.x, el.a.y);
      g.lineTo(el.b.x, el.b.y);
      g.stroke({ color: '#2563eb', width: 2 });
    } else if ('points' in el && el.points.length > 0) {
      const flat = el.points.flatMap((p: { x: number; y: number }) => [p.x, p.y]);
      g.poly(flat);
      if (isPolygonLocked(el)) {
        g.stroke({ color: '#b45309', width: 2, alpha: 0.9 });
      } else {
        g.stroke({ color: '#2563eb', width: 2, alpha: 0.8 });
      }
    }
  }
}
