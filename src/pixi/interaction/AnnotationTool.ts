import { snapPoint } from '../../model/geometry';
import { createAnnotationElement, useSceneStore } from '../../store/sceneStore';
import type { Point } from '../../model/types';

export class AnnotationTool {
  private tip: Point | null = null;
  private anchor: Point | null = null;

  reset(): void {
    this.tip = null;
    this.anchor = null;
  }

  onDown(world: Point): void {
    const store = useSceneStore.getState();
    const snapped = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);

    if (!this.tip) {
      this.tip = snapped;
      store.setStatusMessage('Annotation: click label position (text)');
      return;
    }

    this.anchor = snapped;
    const el = createAnnotationElement(this.tip, this.anchor);
    store.addElement(el);
    store.select([el.id]);
    store.setActiveTool('select');
    store.setStatusMessage('Edit annotation text in Properties');
    this.reset();
  }

  onMove(world: Point): void {
    if (!this.tip) return;
    const store = useSceneStore.getState();
    this.anchor = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);
  }

  getPreview(): { tip: Point | null; anchor: Point | null } {
    return { tip: this.tip, anchor: this.anchor };
  }
}
