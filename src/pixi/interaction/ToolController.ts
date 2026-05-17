import type { FederatedPointerEvent } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import { useSceneStore } from '../../store/sceneStore';
import type { Point, ToolId } from '../../model/types';
import { vertexHitToleranceForViewport } from '../hitTest';
import { PolygonTool } from './PolygonTool';
import { PolylineTool } from './PolylineTool';
import { PlaceTool } from './PlaceTool';
import { SelectTool } from './SelectTool';
import { ScaleTool } from './ScaleTool';
import { DimensionTool } from './DimensionTool';

export type ToolContext = {
  viewport: Viewport;
  getWorldPoint: (e: FederatedPointerEvent) => Point;
  getViewportScale: () => number;
  requestRender: () => void;
};

export class ToolController {
  private selectTool = new SelectTool();
  private polygonTool = new PolygonTool();
  private polylineTool = new PolylineTool();
  private placeTool = new PlaceTool();
  private scaleTool = new ScaleTool();
  private dimensionTool = new DimensionTool();
  private panning = false;
  private spaceHeld = false;
  private lastPan: Point | null = null;
  private unsub: (() => void) | null = null;
  private activePointers = 0;

  private ctx: ToolContext;

  constructor(ctx: ToolContext) {
    this.ctx = ctx;
  }

  mount(viewport: Viewport): void {
    viewport.eventMode = 'static';
    viewport.on('pointerdown', this.onDown);
    viewport.on('pointermove', this.onMove);
    viewport.on('pointerup', this.onUp);
    viewport.on('pointerupoutside', this.onUp);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.unsub = useSceneStore.subscribe(
      (s) => s.activeTool,
      () => this.cancelDrafts(),
    );
  }

  destroy(): void {
    const { viewport } = this.ctx;
    viewport.off('pointerdown', this.onDown);
    viewport.off('pointermove', this.onMove);
    viewport.off('pointerup', this.onUp);
    viewport.off('pointerupoutside', this.onUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.unsub?.();
    useSceneStore.getState().setDraftActive(false);
  }

  finishDraft(): void {
    if (this.polygonTool.hasPoints()) this.polygonTool.finish();
    if (this.polylineTool.hasPoints()) this.polylineTool.finish();
    this.updateDraftFlag();
    this.ctx.requestRender();
  }

  private cancelDrafts(): void {
    this.polygonTool.reset();
    this.polylineTool.reset();
    this.dimensionTool.reset();
    this.scaleTool.reset();
    this.updateDraftFlag();
    this.ctx.requestRender();
  }

  private updateDraftFlag(): void {
    const active =
      this.polygonTool.hasPoints() || this.polylineTool.hasPoints();
    useSceneStore.getState().setDraftActive(active);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      this.spaceHeld = true;
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      this.cancelDrafts();
      useSceneStore.getState().clearSelection();
    }
    if (e.key === 'Enter') {
      this.finishDraft();
      this.ctx.requestRender();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target instanceof HTMLInputElement)) {
      useSceneStore.getState().removeSelected();
      this.ctx.requestRender();
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useSceneStore.getState().undo();
        this.ctx.requestRender();
      }
      if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useSceneStore.getState().redo();
        this.ctx.requestRender();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.spaceHeld = false;
  };

  private isPanMode(tool: ToolId): boolean {
    return tool === 'pan' || this.spaceHeld;
  }

  private onDown = (e: FederatedPointerEvent) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
    }

    if (!e.isPrimary || this.activePointers > 0) {
      return;
    }

    this.activePointers += 1;

    const tool = useSceneStore.getState().activeTool;
    const world = this.ctx.getWorldPoint(e);
    const scale = this.ctx.getViewportScale();

    if (this.isPanMode(tool) || e.button === 1) {
      this.panning = true;
      this.lastPan = { x: e.globalX, y: e.globalY };
      return;
    }

    if (e.button !== 0) return;

    switch (tool) {
      case 'select':
        this.selectTool.onDown(world, e, scale);
        break;
      case 'building':
      case 'plot':
      case 'terrace': {
        const closeTol = vertexHitToleranceForViewport(scale);
        this.polygonTool.onDown(world, tool, closeTol);
        break;
      }
      case 'path':
      case 'fence':
        this.polylineTool.onDown(world, tool);
        break;
      case 'tree':
      case 'bush':
        this.placeTool.onDown(world, tool);
        break;
      case 'scale':
        this.scaleTool.onDown(world);
        break;
      case 'dimension':
        this.dimensionTool.onDown(world);
        break;
    }
    this.updateDraftFlag();
    this.ctx.requestRender();
  };

  private onMove = (e: FederatedPointerEvent) => {
    if (this.panning && this.lastPan) {
      const dx = e.globalX - this.lastPan.x;
      const dy = e.globalY - this.lastPan.y;
      this.ctx.viewport.x += dx;
      this.ctx.viewport.y += dy;
      this.lastPan = { x: e.globalX, y: e.globalY };
      return;
    }

    const world = this.ctx.getWorldPoint(e);
    const tool = useSceneStore.getState().activeTool;

    if (tool === 'select') {
      this.selectTool.onMove(world);
    } else if (['building', 'plot', 'terrace'].includes(tool)) {
      this.polygonTool.onMove(world);
    } else if (['path', 'fence'].includes(tool)) {
      this.polylineTool.onMove(world);
    } else if (tool === 'dimension') {
      this.dimensionTool.onMove(world);
    }
    this.ctx.requestRender();
  };

  private onUp = (e: FederatedPointerEvent) => {
    this.activePointers = Math.max(0, this.activePointers - 1);

    if (this.panning) {
      this.panning = false;
      this.lastPan = null;
      return;
    }

    const world = this.ctx.getWorldPoint(e);
    const tool = useSceneStore.getState().activeTool;

    if (tool === 'select') {
      this.selectTool.onUp(world);
    }
    this.updateDraftFlag();
    this.ctx.requestRender();
  };

  getPreviewState() {
    return {
      polygon: this.polygonTool.getPreview(),
      polyline: this.polylineTool.getPreview(),
      dimension: this.dimensionTool.getPreview(),
      scale: this.scaleTool.getPreview(),
      selectHandles: this.selectTool.getHandlePoints(),
      gridHandles: this.selectTool.getGridHandleOverlay(),
    };
  }

  onDoubleClick = (_e: FederatedPointerEvent) => {
    const tool = useSceneStore.getState().activeTool;
    if (['building', 'plot', 'terrace'].includes(tool)) {
      this.polygonTool.finish();
    } else if (['path', 'fence'].includes(tool)) {
      this.polylineTool.finish();
    }
    this.updateDraftFlag();
    this.ctx.requestRender();
  };
}
