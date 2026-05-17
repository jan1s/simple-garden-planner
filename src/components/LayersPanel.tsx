import { useSceneStore } from '../store/sceneStore';
import type { LayerVisibility } from '../model/types';

const LAYER_LABELS: { key: keyof LayerVisibility; label: string }[] = [
  { key: 'plot', label: 'Plot outline' },
  { key: 'terrace', label: 'Terraces' },
  { key: 'path', label: 'Paths' },
  { key: 'building', label: 'Buildings' },
  { key: 'fence', label: 'Fences' },
  { key: 'tree', label: 'Trees' },
  { key: 'bush', label: 'Bushes' },
  { key: 'dimension', label: 'Dimensions' },
];

export function LayersPanel() {
  const visibility = useSceneStore((s) => s.layerVisibility);
  const toggleLayer = useSceneStore((s) => s.toggleLayer);
  const sceneName = useSceneStore((s) => s.scene.name);
  const setSceneName = useSceneStore((s) => s.setSceneName);
  const ppm = useSceneStore((s) => s.scene.pixelsPerMeter);

  return (
    <aside className="panel layers-panel">
      <h2>Project</h2>
      <label className="field">
        Name
        <input
          type="text"
          value={sceneName}
          onChange={(e) => setSceneName(e.target.value)}
        />
      </label>
      <p className="scale-info">
        {ppm
          ? `Scale: ${ppm.toFixed(1)} px/m`
          : 'Scale: not set — use Scale tool'}
      </p>

      <h2>Layers</h2>
      <ul className="layer-list">
        {LAYER_LABELS.map(({ key, label }) => (
          <li key={key}>
            <label>
              <input
                type="checkbox"
                checked={visibility[key]}
                onChange={() => toggleLayer(key)}
              />
              {label}
            </label>
          </li>
        ))}
      </ul>

      <div className="help-box help-box-desktop">
        <strong>Shortcuts</strong>
        <ul>
          <li>Space + drag — pan</li>
          <li>Right-drag — pan</li>
          <li>Scroll — zoom</li>
          <li>Enter — finish shape</li>
          <li>Del — delete</li>
          <li>Trees: B-01… Bushes: S-01…</li>
          <li>Ctrl+Z — undo</li>
        </ul>
      </div>

      <div className="help-box help-box-mobile">
        <strong>Touch tips</strong>
        <ul>
          <li>Pan tool or two-finger pinch to move and zoom</li>
          <li>Tap Done to finish a shape</li>
          <li>Layers / Props buttons open side panels</li>
          <li>Menu — upload, save, export</li>
        </ul>
      </div>
    </aside>
  );
}
