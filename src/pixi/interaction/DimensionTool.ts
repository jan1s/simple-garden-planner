import { snapPoint } from '../../model/geometry';
import { createDimensionElement, useSceneStore } from '../../store/sceneStore';
import type { Point } from '../../model/types';

export class DimensionTool {
  private a: Point | null = null;
  private b: Point | null = null;

  reset(): void {
    this.a = null;
    this.b = null;
  }

  onDown(world: Point): void {
    const store = useSceneStore.getState();
    const snapped = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);

    if (!this.a) {
      this.a = snapped;
      store.setStatusMessage('Dimension: click second point');
      return;
    }

    this.b = snapped;
    const offset = 30;
    const el = createDimensionElement(this.a, this.b, offset);
    store.addElement(el);
    store.setStatusMessage('Dimension added');
    this.reset();
  }

  onMove(world: Point): void {
    if (!this.a) return;
    const store = useSceneStore.getState();
    this.b = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);
  }

  getPreview(): { a: Point | null; b: Point | null } {
    return { a: this.a, b: this.b };
  }
}
