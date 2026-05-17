import { distance } from '../../model/geometry';
import { useSceneStore } from '../../store/sceneStore';
import type { Point } from '../../model/types';

export class ScaleTool {
  reset(): void {
    useSceneStore.getState().setScaleDraft({ a: null, b: null });
  }

  onDown(world: Point): void {
    const store = useSceneStore.getState();
    const { scaleDraft } = store;

    if (!scaleDraft.a) {
      store.setScaleDraft({ a: world, b: null });
      store.setStatusMessage('Scale: click second point on known distance');
      return;
    }

    if (!scaleDraft.b) {
      store.setScaleDraft({ a: scaleDraft.a, b: world });
      const pxLen = distance(scaleDraft.a, world);
      const metersStr = prompt(
        `Enter the real-world distance between the two points (in meters).\nMeasured: ${pxLen.toFixed(0)} pixels`,
        '5',
      );
      if (metersStr) {
        const meters = parseFloat(metersStr);
        if (meters > 0) {
          const ppm = pxLen / meters;
          store.setPixelsPerMeter(ppm);
          store.setStatusMessage(`Scale set: ${ppm.toFixed(1)} px/m`);
        }
      }
      store.setScaleDraft({ a: null, b: null });
    }
  }

  getPreview(): { a: Point | null; b: Point | null } {
    return useSceneStore.getState().scaleDraft;
  }
}
