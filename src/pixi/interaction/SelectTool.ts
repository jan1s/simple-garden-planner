import type { FederatedPointerEvent } from 'pixi.js';
import { snapPoint, translatePoints } from '../../model/geometry';
import { isPolygonLocked } from '../../model/elements';
import {
  getGridHandlePositions,
  gridOffsetsForFixedOrigin,
  gridOffsetsFromOriginWorld,
  hitTestGridHandle,
  orientationDegFromWorld,
  type GridHandlePositions,
} from '../../model/grid';
import { useSceneStore } from '../../store/sceneStore';
import type { GardenElement, PlotGrid, Point, PolygonElement } from '../../model/types';
import {
  findTopElementAt,
  getElementPoints,
  hitTestVertex,
  hitToleranceForViewport,
  vertexHitToleranceForViewport,
} from '../hitTest';

type DragMode =
  | { kind: 'none' }
  | { kind: 'move'; startWorld: Point; originalElements: Map<string, GardenElement> }
  | { kind: 'vertex'; elementId: string; vertexIndex: number; startWorld: Point }
  | {
      kind: 'grid-origin';
      elementId: string;
      orientationDeg: number;
    }
  | {
      kind: 'grid-orientation';
      elementId: string;
      /** World position held fixed while orientation changes */
      pivot: Point;
    };

function isLocked(el: GardenElement): boolean {
  return isPolygonLocked(el);
}

function asPlot(el: GardenElement): PolygonElement | null {
  return el.type === 'plot' ? el : null;
}

export class SelectTool {
  private drag: DragMode = { kind: 'none' };
  private moved = false;

  onDown(world: Point, e: FederatedPointerEvent, viewportScale = 1): void {
    const store = useSceneStore.getState();
    const { scene, selectedIds, layerVisibility, activeTool } = store;
    const vertexTol = vertexHitToleranceForViewport(viewportScale);
    const elementTol = hitToleranceForViewport(viewportScale);

    if (activeTool === 'select') {
      for (const id of selectedIds) {
        const el = scene.elements.find((x) => x.id === id);
        const plot = el ? asPlot(el) : null;
        if (!plot?.grid?.enabled) continue;

        const handle = hitTestGridHandle(
          world,
          plot,
          scene.pixelsPerMeter,
          viewportScale,
        );
        if (handle) {
          store.pushHistory();
          const handles = getGridHandlePositions(
            plot,
            plot.grid,
            scene.pixelsPerMeter,
          );
          if (!handles) return;

          if (handle === 'origin') {
            this.drag = {
              kind: 'grid-origin',
              elementId: id,
              orientationDeg: plot.grid.orientationDeg,
            };
          } else {
            this.drag = {
              kind: 'grid-orientation',
              elementId: id,
              pivot: { ...handles.origin },
            };
          }
          this.moved = false;
          store.setStatusMessage(
            handle === 'origin'
              ? 'Drag to move grid origin'
              : 'Drag to rotate grid around origin',
          );
          return;
        }
      }
    }

    for (const id of selectedIds) {
      const el = scene.elements.find((x) => x.id === id);
      if (!el || isLocked(el)) continue;
      const points = this.getEditablePoints(el);
      const vi = hitTestVertex(world, points, vertexTol);
      if (vi >= 0) {
        store.pushHistory();
        this.drag = {
          kind: 'vertex',
          elementId: id,
          vertexIndex: vi,
          startWorld: world,
        };
        this.moved = false;
        return;
      }
    }

    const hit = findTopElementAt(
      world,
      scene.elements,
      layerVisibility,
      elementTol,
    );

    if (hit) {
      if (e.shiftKey) {
        store.addToSelection(hit.id);
      } else if (!selectedIds.includes(hit.id)) {
        store.select([hit.id]);
      }

      const ids = useSceneStore.getState().selectedIds;
      const movableIds = ids.filter((id) => {
        const el = scene.elements.find((x) => x.id === id);
        return el && !isLocked(el);
      });

      if (movableIds.length === 0) {
        if (isLocked(hit)) {
          store.setStatusMessage('Plot is locked — unlock in Properties to move');
        }
        return;
      }

      const originals = new Map<string, GardenElement>();
      for (const id of movableIds) {
        const el = scene.elements.find((x) => x.id === id);
        if (el) originals.set(id, structuredClone(el));
      }
      store.pushHistory();
      this.drag = {
        kind: 'move',
        startWorld: world,
        originalElements: originals,
      };
      this.moved = false;
    } else {
      store.clearSelection();
    }
  }

  onMove(world: Point): void {
    if (this.drag.kind === 'none') return;

    const store = useSceneStore.getState();
    const snapped = this.snap(world);

    const drag = this.drag;

    if (drag.kind === 'grid-origin') {
      const el = store.scene.elements.find((x) => x.id === drag.elementId);
      const plot = el ? asPlot(el) : null;
      if (!plot?.grid) return;

      const offsets = gridOffsetsFromOriginWorld(
        plot,
        { ...plot.grid, orientationDeg: drag.orientationDeg },
        snapped,
        store.scene.pixelsPerMeter,
      );
      this.updatePlotGrid(plot.id, {
        orientationDeg: drag.orientationDeg,
        ...offsets,
      });
      this.moved = true;
      return;
    }

    if (drag.kind === 'grid-orientation') {
      const el = store.scene.elements.find((x) => x.id === drag.elementId);
      const plot = el ? asPlot(el) : null;
      if (!plot?.grid) return;

      const deg = orientationDegFromWorld(drag.pivot, snapped);
      const offsets = gridOffsetsForFixedOrigin(
        plot,
        drag.pivot,
        deg,
        store.scene.pixelsPerMeter,
      );
      this.updatePlotGrid(plot.id, {
        orientationDeg: deg,
        ...offsets,
      });
      this.moved = true;
      return;
    }

    if (drag.kind === 'vertex') {
      const { elementId, vertexIndex } = drag;
      const el = store.scene.elements.find((x) => x.id === elementId);
      if (!el || isLocked(el)) return;
      this.updatePoint(el, vertexIndex, snapped);
      this.moved = true;
    } else if (drag.kind === 'move') {
      const dx = world.x - drag.startWorld.x;
      const dy = world.y - drag.startWorld.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      this.moved = true;
      const elements = store.scene.elements.map((el) => {
        const orig = drag.kind === 'move' ? drag.originalElements.get(el.id) : null;
        if (!orig) return el;
        if (isLocked(orig)) return orig;
        return this.translateElement(orig, dx, dy);
      });
      store.setElements(elements);
    }
  }

  onUp(_world: Point): void {
    if (this.moved && this.drag.kind !== 'none') {
      const msg =
        this.drag.kind === 'grid-origin'
          ? 'Grid origin updated'
          : this.drag.kind === 'grid-orientation'
            ? 'Grid orientation updated'
            : 'Element updated';
      useSceneStore.getState().setStatusMessage(msg);
    }
    this.drag = { kind: 'none' };
  }

  getHandlePoints(): Point[] {
    const { scene, selectedIds } = useSceneStore.getState();
    const points: Point[] = [];
    for (const id of selectedIds) {
      const el = scene.elements.find((x) => x.id === id);
      if (!el || isLocked(el)) continue;
      points.push(...getElementPoints(el));
    }
    return points;
  }

  /** Grid handles when a single plot with grid is selected (select tool). */
  getGridHandleOverlay(): GridHandlePositions | null {
    const { scene, selectedIds, activeTool } = useSceneStore.getState();
    if (activeTool !== 'select' || selectedIds.length !== 1) return null;

    const el = scene.elements.find((x) => x.id === selectedIds[0]);
    const plot = el ? asPlot(el) : null;
    if (!plot?.grid?.enabled) return null;

    return getGridHandlePositions(plot, plot.grid, scene.pixelsPerMeter);
  }

  private snap(p: Point): Point {
    const { snapEnabled, scene } = useSceneStore.getState();
    return snapPoint(p, scene.pixelsPerMeter, snapEnabled);
  }

  private getEditablePoints(el: GardenElement): Point[] {
    return getElementPoints(el);
  }

  private updatePlotGrid(plotId: string, patch: Partial<PlotGrid>): void {
    const store = useSceneStore.getState();
    const el = store.scene.elements.find((x) => x.id === plotId);
    const plot = el ? asPlot(el) : null;
    if (!plot?.grid) return;
    store.updateElement(plotId, {
      grid: { ...plot.grid, ...patch },
    });
  }

  private updatePoint(el: GardenElement, index: number, p: Point): void {
    const store = useSceneStore.getState();
    if (el.type === 'tree' || el.type === 'bush') {
      store.updateElement(el.id, { position: p });
    } else if (el.type === 'dimension') {
      if (index === 0) store.updateElement(el.id, { a: p });
      else store.updateElement(el.id, { b: p });
    } else if ('points' in el) {
      const points = [...el.points];
      points[index] = p;
      store.updateElement(el.id, { points });
    }
  }

  private translateElement(el: GardenElement, dx: number, dy: number): GardenElement {
    if (el.type === 'tree' || el.type === 'bush') {
      return {
        ...el,
        position: { x: el.position.x + dx, y: el.position.y + dy },
      };
    }
    if (el.type === 'dimension') {
      return {
        ...el,
        a: { x: el.a.x + dx, y: el.a.y + dy },
        b: { x: el.b.x + dx, y: el.b.y + dy },
      };
    }
    if ('points' in el) {
      return { ...el, points: translatePoints(el.points, dx, dy) };
    }
    return el;
  }
}
