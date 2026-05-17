import { loadImageFile } from '../model/serialize';
import { useSceneStore } from '../store/sceneStore';
import type { ToolId } from '../model/types';

const TOOLS: { id: ToolId; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'pan', label: 'Pan' },
  { id: 'scale', label: 'Scale' },
  { id: 'dimension', label: 'Dimension' },
  { id: 'plot', label: 'Plot' },
  { id: 'building', label: 'Building' },
  { id: 'terrace', label: 'Terrace' },
  { id: 'path', label: 'Path' },
  { id: 'fence', label: 'Fence' },
  { id: 'tree', label: 'Tree' },
  { id: 'bush', label: 'Bush' },
];

export function Toolbar({
  onExportClick,
  onPlantsClick,
  onSaveClick,
  onLoadClick,
  onNewClick,
}: {
  onExportClick: () => void;
  onPlantsClick: () => void;
  onSaveClick: () => void;
  onLoadClick: () => void;
  onNewClick: () => void;
}) {
  const activeTool = useSceneStore((s) => s.activeTool);
  const snapEnabled = useSceneStore((s) => s.snapEnabled);
  const background = useSceneStore((s) => s.scene.background);
  const past = useSceneStore((s) => s.past);
  const future = useSceneStore((s) => s.future);

  const setActiveTool = useSceneStore((s) => s.setActiveTool);
  const setBackground = useSceneStore((s) => s.setBackground);
  const setBackgroundOpacity = useSceneStore((s) => s.setBackgroundOpacity);
  const setSnapEnabled = useSceneStore((s) => s.setSnapEnabled);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { imageDataUrl, width, height } = await loadImageFile(file);
      setBackground({ imageDataUrl, opacity: 0.85, width, height });
      useSceneStore.getState().setStatusMessage('Reference image uploaded');
    } catch {
      useSceneStore.getState().setStatusMessage('Failed to load image');
    }
    e.target.value = '';
  };

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <span className="brand-icon">🌿</span>
        <span className="brand-name">Garden Planner</span>
      </div>

      <div className="toolbar-tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="toolbar-actions">
        <label className="btn btn-secondary">
          Upload image
          <input
            type="file"
            accept="image/jpeg,image/png"
            hidden
            onChange={handleUpload}
          />
        </label>

        {background && (
          <label className="opacity-control">
            Opacity
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={background.opacity}
              onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
            />
          </label>
        )}

        <label className="snap-toggle">
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={(e) => setSnapEnabled(e.target.checked)}
          />
          Snap grid
        </label>

        <button type="button" className="btn" onClick={undo} disabled={past.length === 0}>
          Undo
        </button>
        <button type="button" className="btn" onClick={redo} disabled={future.length === 0}>
          Redo
        </button>
        <button type="button" className="btn" onClick={onSaveClick}>
          Save JSON
        </button>
        <button type="button" className="btn" onClick={onLoadClick}>
          Load JSON
        </button>
        <button type="button" className="btn btn-secondary" onClick={onNewClick}>
          New
        </button>
        <button type="button" className="btn btn-secondary" onClick={onPlantsClick}>
          Plants
        </button>
        <button type="button" className="btn btn-primary" onClick={onExportClick}>
          Export
        </button>
      </div>
    </header>
  );
}
