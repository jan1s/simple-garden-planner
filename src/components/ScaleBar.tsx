import { formatMeters } from '../model/geometry';
import { scaleBarForViewport } from '../pixi/drawScaleBar';
import { useSceneStore } from '../store/sceneStore';

const TARGET_SCREEN_PX = 400;

/** Scale bar tied to viewport zoom — represents real-world distance at current zoom. */
export function ScaleBar() {
  const ppm = useSceneStore((s) => s.scene.pixelsPerMeter);
  const viewportScale = useSceneStore((s) => s.viewportScale);

  if (!ppm || ppm <= 0) return null;

  const { barMeters, barScreenPx } = scaleBarForViewport(
    ppm,
    viewportScale,
    TARGET_SCREEN_PX,
  );

  return (
    <div className="scale-bar" aria-label={`Scale bar: ${formatMeters(barMeters)}`}>
      <div className="scale-bar-line" style={{ width: barScreenPx }} />
      <span className="scale-bar-label">{formatMeters(barMeters)}</span>
    </div>
  );
}
