import { useEffect, useRef } from 'react';
import { loadImageFile } from '../model/serialize';
import { finishCanvasDraft } from '../pixi/canvasActions';
import { useSceneStore } from '../store/sceneStore';
import type { ToolId } from '../model/types';

const TOOLS: { id: ToolId; label: string; short: string }[] = [
  { id: 'select', label: 'Select', short: 'Sel' },
  { id: 'pan', label: 'Pan', short: 'Pan' },
  { id: 'scale', label: 'Scale', short: 'Sc' },
  { id: 'dimension', label: 'Dimension', short: 'Dim' },
  { id: 'plot', label: 'Plot', short: 'Plt' },
  { id: 'building', label: 'Building', short: 'Bld' },
  { id: 'terrace', label: 'Terrace', short: 'Ter' },
  { id: 'path', label: 'Path', short: 'Pth' },
  { id: 'fence', label: 'Fence', short: 'Fnc' },
  { id: 'tree', label: 'Tree', short: 'Tr' },
  { id: 'bush', label: 'Bush', short: 'Bu' },
];

function ToolButtons({ className }: { className?: string }) {
  const activeTool = useSceneStore((s) => s.activeTool);
  const setActiveTool = useSceneStore((s) => s.setActiveTool);

  return (
    <div className={className}>
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => setActiveTool(tool.id)}
          title={tool.label}
          aria-label={tool.label}
        >
          <span className="tool-label-full">{tool.label}</span>
          <span className="tool-label-short">{tool.short}</span>
        </button>
      ))}
    </div>
  );
}

export function Toolbar({
  onExportClick,
  onPlantsClick,
  onSaveClick,
  onLoadClick,
  onNewClick,
  menuOpen,
  onMenuToggle,
  onMenuClose,
}: {
  onExportClick: () => void;
  onPlantsClick: () => void;
  onSaveClick: () => void;
  onLoadClick: () => void;
  onNewClick: () => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}) {
  const snapEnabled = useSceneStore((s) => s.snapEnabled);
  const background = useSceneStore((s) => s.scene.background);
  const past = useSceneStore((s) => s.past);
  const future = useSceneStore((s) => s.future);
  const draftActive = useSceneStore((s) => s.draftActive);

  const setBackground = useSceneStore((s) => s.setBackground);
  const setBackgroundOpacity = useSceneStore((s) => s.setBackgroundOpacity);
  const setSnapEnabled = useSceneStore((s) => s.setSnapEnabled);
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuClose();
      }
    };
    document.addEventListener('pointerdown', onDocClick);
    return () => document.removeEventListener('pointerdown', onDocClick);
  }, [menuOpen, onMenuClose]);

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
    onMenuClose();
  };

  return (
    <>
      <header className="toolbar toolbar-top">
        <div className="toolbar-brand">
          <span className="brand-icon" aria-hidden>
            🌿
          </span>
          <span className="brand-name">Garden Planner</span>
        </div>

        <ToolButtons className="toolbar-tools toolbar-tools-desktop" />

        {draftActive && (
          <button
            type="button"
            className="btn btn-done"
            onClick={() => finishCanvasDraft()}
          >
            Done
          </button>
        )}

        <div className="toolbar-actions toolbar-actions-desktop">
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

        <div className="toolbar-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="btn btn-menu"
            onClick={onMenuToggle}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            Menu
          </button>
          {menuOpen && (
            <div className="toolbar-overflow" role="menu">
              <label className="btn btn-secondary overflow-item">
                Upload image
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  hidden
                  onChange={handleUpload}
                />
              </label>

              {background && (
                <label className="opacity-control overflow-item">
                  Opacity
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={background.opacity}
                    onChange={(e) =>
                      setBackgroundOpacity(parseFloat(e.target.value))
                    }
                  />
                </label>
              )}

              <label className="snap-toggle overflow-item">
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                />
                Snap grid
              </label>

              <button
                type="button"
                className="btn overflow-item"
                onClick={() => {
                  undo();
                  onMenuClose();
                }}
                disabled={past.length === 0}
              >
                Undo
              </button>
              <button
                type="button"
                className="btn overflow-item"
                onClick={() => {
                  redo();
                  onMenuClose();
                }}
                disabled={future.length === 0}
              >
                Redo
              </button>
              <button
                type="button"
                className="btn overflow-item"
                onClick={() => {
                  onSaveClick();
                  onMenuClose();
                }}
              >
                Save JSON
              </button>
              <button
                type="button"
                className="btn overflow-item"
                onClick={() => {
                  onLoadClick();
                  onMenuClose();
                }}
              >
                Load JSON
              </button>
              <button
                type="button"
                className="btn overflow-item"
                onClick={() => {
                  onNewClick();
                  onMenuClose();
                }}
              >
                New
              </button>
              <button
                type="button"
                className="btn overflow-item"
                onClick={onPlantsClick}
              >
                Plants
              </button>
              <button
                type="button"
                className="btn btn-primary overflow-item"
                onClick={onExportClick}
              >
                Export
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="toolbar toolbar-tools-mobile" aria-label="Drawing tools">
        <ToolButtons className="toolbar-tools" />
      </nav>
    </>
  );
}
