import { useEffect, useRef } from 'react';
import { loadImageFile } from '../model/serialize';
import { finishCanvasDraft } from '../pixi/canvasActions';
import { useSceneStore } from '../store/sceneStore';
import type { ToolId } from '../model/types';
import { IconButton } from './IconButton';
import { ToolbarIcon, type ToolbarIconId } from './icons/ToolbarIcons';

type ToolDef = {
  id: ToolId;
  label: string;
  icon: ToolbarIconId;
};

const TOOL_GROUPS: ToolDef[][] = [
  [
    { id: 'select', label: 'Select', icon: 'select' },
    { id: 'pan', label: 'Pan', icon: 'pan' },
  ],
  [
    { id: 'scale', label: 'Scale', icon: 'scale' },
    { id: 'dimension', label: 'Dimension', icon: 'dimension' },
    { id: 'annotation', label: 'Annotation', icon: 'annotation' },
  ],
  [
    { id: 'plot', label: 'Plot', icon: 'plot' },
    { id: 'building', label: 'Building', icon: 'building' },
    { id: 'terrace', label: 'Terrace', icon: 'terrace' },
  ],
  [
    { id: 'path', label: 'Path', icon: 'path' },
    { id: 'fence', label: 'Fence', icon: 'fence' },
  ],
  [
    { id: 'tree', label: 'Tree', icon: 'tree' },
    { id: 'bush', label: 'Bush', icon: 'bush' },
  ],
];

function ToolButtons({ className }: { className?: string }) {
  const activeTool = useSceneStore((s) => s.activeTool);
  const setActiveTool = useSceneStore((s) => s.setActiveTool);

  return (
    <div className={className}>
      {TOOL_GROUPS.map((group, gi) => (
        <div
          key={gi}
          className="tool-group"
          role="group"
          aria-label="Drawing tools"
        >
          {group.map((tool) => (
            <IconButton
              key={tool.id}
              icon={tool.icon}
              label={tool.label}
              className={activeTool === tool.id ? 'active' : ''}
              onClick={() => {
                setActiveTool(tool.id);
                if (tool.id === 'annotation') {
                  useSceneStore
                    .getState()
                    .setStatusMessage('Annotation: click arrow target');
                }
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function OverflowMenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ToolbarIconId;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="overflow-row"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
    >
      <ToolbarIcon name={icon} className="overflow-row-icon" />
      <span>{label}</span>
    </button>
  );
}

export function Toolbar({
  onExportClick,
  onPlantsClick,
  onSaveClick,
  onLoadClick,
  onNewClick,
  onSettingsClick,
  settingsOpen = false,
  menuOpen,
  onMenuToggle,
  onMenuClose,
}: {
  onExportClick: () => void;
  onPlantsClick: () => void;
  onSaveClick: () => void;
  onLoadClick: () => void;
  onNewClick: () => void;
  onSettingsClick: () => void;
  settingsOpen?: boolean;
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
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onMenuClose();
    };
    const id = window.setTimeout(() => {
      document.addEventListener('pointerdown', onDocPointerDown);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('pointerdown', onDocPointerDown);
    };
  }, [menuOpen, onMenuClose]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const triggerUpload = () => uploadRef.current?.click();

  return (
    <div className="app-chrome">
      <input
        ref={uploadRef}
        type="file"
        accept="image/jpeg,image/png"
        hidden
        onChange={handleUploadFile}
      />

      <header className="toolbar toolbar-top">
        <div className="toolbar-brand">
          <span className="brand-icon" aria-hidden>
            🌿
          </span>
          <span className="brand-name">Garden Planner</span>
        </div>

        <ToolButtons className="toolbar-tools toolbar-tools-desktop" />

        {draftActive && (
          <IconButton
            icon="check"
            label="Finish shape"
            variant="done"
            showLabel
            className="btn-done-text"
            onClick={() => finishCanvasDraft()}
          />
        )}

        <div className="toolbar-actions toolbar-actions-mobile">
          <IconButton icon="image-plus" label="Upload image" onClick={triggerUpload} />
          <IconButton
            icon="folder-open"
            label="Load JSON"
            onClick={() => {
              onLoadClick();
              onMenuClose();
            }}
          />
        </div>

        <div className="toolbar-actions toolbar-actions-desktop">
          <IconButton icon="image-plus" label="Upload image" onClick={triggerUpload} />

          {background && (
            <label className="toolbar-opacity" title="Background opacity">
              <ToolbarIcon name="image-plus" className="icon-btn-svg icon-muted" />
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={background.opacity}
                onChange={(e) =>
                  setBackgroundOpacity(parseFloat(e.target.value))
                }
                aria-label="Background opacity"
              />
            </label>
          )}

          <IconButton
            icon="grid"
            label={snapEnabled ? 'Snap grid on' : 'Snap grid off'}
            className={snapEnabled ? 'active' : ''}
            onClick={() => setSnapEnabled(!snapEnabled)}
          />

          <span className="toolbar-divider" aria-hidden />

          <IconButton
            icon="undo"
            label="Undo"
            onClick={undo}
            disabled={past.length === 0}
          />
          <IconButton
            icon="redo"
            label="Redo"
            onClick={redo}
            disabled={future.length === 0}
          />

          <span className="toolbar-divider" aria-hidden />

          <IconButton
            icon="settings"
            label="Project settings"
            className={settingsOpen ? 'active' : ''}
            onClick={onSettingsClick}
          />

          <IconButton icon="save" label="Save JSON" onClick={onSaveClick} />
          <IconButton icon="folder-open" label="Load JSON" onClick={onLoadClick} />
          <IconButton icon="file-plus" label="New scene" onClick={onNewClick} />
          <IconButton icon="table" label="Plants table" onClick={onPlantsClick} />
          <IconButton
            icon="download"
            label="Export"
            variant="primary"
            onClick={onExportClick}
          />
        </div>

        <div className="toolbar-menu-wrap" ref={menuRef}>
          <IconButton
            icon="menu"
            label="Menu"
            className="btn-menu"
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          />
          {menuOpen && (
            <>
              <button
                type="button"
                className="toolbar-menu-backdrop"
                aria-label="Close menu"
                onClick={onMenuClose}
              />
              <div className="toolbar-overflow" role="menu">
              <OverflowMenuItem
                icon="image-plus"
                label="Upload image"
                onClick={triggerUpload}
              />

              {background && (
                <label className="overflow-row overflow-row-range">
                  <ToolbarIcon name="image-plus" className="overflow-row-icon" />
                  <span>Opacity</span>
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

              <OverflowMenuItem
                icon="grid"
                label={snapEnabled ? 'Snap grid on' : 'Snap grid off'}
                onClick={() => setSnapEnabled(!snapEnabled)}
              />

              <OverflowMenuItem
                icon="undo"
                label="Undo"
                disabled={past.length === 0}
                onClick={() => {
                  undo();
                  onMenuClose();
                }}
              />
              <OverflowMenuItem
                icon="redo"
                label="Redo"
                disabled={future.length === 0}
                onClick={() => {
                  redo();
                  onMenuClose();
                }}
              />
              <OverflowMenuItem
                icon="settings"
                label="Project settings"
                onClick={() => {
                  onSettingsClick();
                  onMenuClose();
                }}
              />
              <OverflowMenuItem
                icon="save"
                label="Save JSON"
                onClick={() => {
                  onSaveClick();
                  onMenuClose();
                }}
              />
              <OverflowMenuItem
                icon="folder-open"
                label="Load JSON"
                onClick={() => {
                  onLoadClick();
                  onMenuClose();
                }}
              />
              <OverflowMenuItem
                icon="file-plus"
                label="New scene"
                onClick={() => {
                  onNewClick();
                  onMenuClose();
                }}
              />
              <OverflowMenuItem icon="table" label="Plants table" onClick={onPlantsClick} />
              <OverflowMenuItem icon="download" label="Export" onClick={onExportClick} />
              </div>
            </>
          )}
        </div>
      </header>

      <nav className="toolbar toolbar-tools-mobile" aria-label="Drawing tools">
        <ToolButtons className="toolbar-tools" />
      </nav>
    </div>
  );
}
