import { useSceneStore } from '../store/sceneStore';
import type { LayerVisibility } from '../model/types';
import { LegalDisclaimer } from './LegalDisclaimer';

const LAYER_LABELS: { key: keyof LayerVisibility; label: string }[] = [
  { key: 'plot', label: 'Plot outline' },
  { key: 'terrace', label: 'Terraces' },
  { key: 'path', label: 'Paths' },
  { key: 'building', label: 'Buildings' },
  { key: 'fence', label: 'Fences' },
  { key: 'tree', label: 'Trees' },
  { key: 'bush', label: 'Bushes' },
  { key: 'dimension', label: 'Dimensions' },
  { key: 'annotation', label: 'Annotations' },
];

export function SettingsPanel() {
  const visibility = useSceneStore((s) => s.layerVisibility);
  const toggleLayer = useSceneStore((s) => s.toggleLayer);
  const sceneName = useSceneStore((s) => s.scene.name);
  const setSceneName = useSceneStore((s) => s.setSceneName);
  const ppm = useSceneStore((s) => s.scene.pixelsPerMeter);

  return (
    <div className="panel settings-panel">
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
          : 'Scale not set — use Scale tool on canvas'}
      </p>

      <h2>Layers</h2>
      <p className="field-hint">Toggle visibility of element types on the plan.</p>
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

      <h2>Legal</h2>
      <LegalDisclaimer variant="full" />
    </div>
  );
}
