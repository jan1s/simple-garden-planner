import { snapPoint } from '../../model/geometry';
import {
  createFenceElement,
  createPathElement,
  useSceneStore,
} from '../../store/sceneStore';
import type { Point } from '../../model/types';

export class PolylineTool {
  private points: Point[] = [];
  private cursor: Point | null = null;
  private type: 'path' | 'fence' = 'path';

  reset(): void {
    this.points = [];
    this.cursor = null;
  }

  onDown(world: Point, type: 'path' | 'fence'): void {
    this.type = type;
    const store = useSceneStore.getState();
    const snapped = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);
    this.points.push(snapped);
    store.setStatusMessage(
      `${type}: ${this.points.length} points — double-click or Enter to finish`,
    );
  }

  onMove(world: Point): void {
    const store = useSceneStore.getState();
    this.cursor = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);
  }

  finish(): void {
    if (this.points.length < 2) {
      this.reset();
      return;
    }
    const el =
      this.type === 'path'
        ? createPathElement([...this.points])
        : createFenceElement([...this.points]);
    useSceneStore.getState().addElement(el);
    useSceneStore.getState().setStatusMessage(`Added ${this.type}`);
    this.reset();
  }

  getPreview(): { points: Point[]; cursor: Point | null; type: string } {
    const pts = [...this.points];
    if (this.cursor) pts.push(this.cursor);
    return { points: pts, cursor: this.cursor, type: this.type };
  }
}
