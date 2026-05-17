import { snapPoint } from '../../model/geometry';
import {
  createPolygonElement,
  useSceneStore,
} from '../../store/sceneStore';
import type { Point } from '../../model/types';

export class PolygonTool {
  private points: Point[] = [];
  private cursor: Point | null = null;
  private type: 'building' | 'plot' | 'terrace' = 'plot';

  reset(): void {
    this.points = [];
    this.cursor = null;
  }

  onDown(world: Point, type: 'building' | 'plot' | 'terrace'): void {
    this.type = type;
    const store = useSceneStore.getState();
    const snapped = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);

    // Close on first point if 3+ points
    if (
      this.points.length >= 3 &&
      Math.hypot(snapped.x - this.points[0].x, snapped.y - this.points[0].y) < 12
    ) {
      this.finish();
      return;
    }

    this.points.push(snapped);
    store.setStatusMessage(
      `Polygon: ${this.points.length} points — double-click or Enter to finish`,
    );
  }

  onMove(world: Point): void {
    const store = useSceneStore.getState();
    this.cursor = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);
  }

  finish(): void {
    if (this.points.length < 3) {
      this.reset();
      return;
    }
    const el = createPolygonElement(this.type, [...this.points]);
    useSceneStore.getState().addElement(el);
    useSceneStore.getState().setStatusMessage(`Added ${this.type}`);
    this.reset();
  }

  getPreview(): { points: Point[]; cursor: Point | null; closed: boolean; type: string } {
    const pts = [...this.points];
    if (this.cursor) pts.push(this.cursor);
    return {
      points: pts,
      cursor: this.cursor,
      closed: false,
      type: this.type,
    };
  }
}
