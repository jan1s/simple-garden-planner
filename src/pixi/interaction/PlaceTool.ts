import { snapPoint } from '../../model/geometry';
import { createPlantElement, useSceneStore } from '../../store/sceneStore';
import type { Point } from '../../model/types';

export class PlaceTool {
  onDown(world: Point, type: 'tree' | 'bush'): void {
    const store = useSceneStore.getState();
    const snapped = snapPoint(world, store.scene.pixelsPerMeter, store.snapEnabled);
    const el = createPlantElement(type, snapped, store.scene.elements);
    store.addElement(el);
    store.setStatusMessage(
      `Placed ${type} ${(el as { label: string }).label}`,
    );
  }
}
