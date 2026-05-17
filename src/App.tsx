import { useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { SettingsPanel } from './components/SettingsPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportModal } from './components/ExportModal';
import { PlantTableModal } from './components/PlantTableModal';
import { NorthIndicator } from './components/NorthIndicator';
import { ScaleBar } from './components/ScaleBar';
import { CanvasShortcuts } from './components/CanvasShortcuts';
import { LegalDisclaimer } from './components/LegalDisclaimer';
import { PixiCanvas } from './pixi/PixiCanvas';
import { downloadSceneFile, sceneFromJson } from './model/serialize';
import { useSceneStore } from './store/sceneStore';
import './styles/app.css';

type OpenPanel = 'settings' | 'properties' | null;

function App() {
  const [exportOpen, setExportOpen] = useState(false);
  const [plantsOpen, setPlantsOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const loadRef = useRef<HTMLInputElement>(null);
  const statusMessage = useSceneStore((s) => s.statusMessage);
  const ppm = useSceneStore((s) => s.scene.pixelsPerMeter);

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const closePanel = () => setOpenPanel(null);

  const handleSave = () => {
    downloadSceneFile(useSceneStore.getState().scene);
    useSceneStore.getState().setStatusMessage('Scene saved to file');
  };

  const handleLoad = () => loadRef.current?.click();

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const scene = sceneFromJson(reader.result as string);
        useSceneStore.getState().loadScene(scene);
      } catch {
        useSceneStore.getState().setStatusMessage('Invalid scene file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNew = () => {
    if (
      useSceneStore.getState().scene.elements.length > 0 &&
      !confirm('Create a new scene? Unsaved changes remain in browser storage until overwritten.')
    ) {
      return;
    }
    useSceneStore.getState().newScene();
  };

  return (
    <div className="app">
      <Toolbar
        onExportClick={() => {
          setMenuOpen(false);
          setExportOpen(true);
        }}
        onPlantsClick={() => {
          setMenuOpen(false);
          setPlantsOpen(true);
        }}
        onSaveClick={handleSave}
        onLoadClick={handleLoad}
        onNewClick={handleNew}
        onSettingsClick={() => togglePanel('settings')}
        settingsOpen={openPanel === 'settings'}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((o) => !o)}
        onMenuClose={() => setMenuOpen(false)}
      />

      <main className="workspace">
        <div className="canvas-wrap">
          <div className="panel-toggles">
            <button
              type="button"
              className="panel-toggle"
              onClick={() => togglePanel('settings')}
              aria-expanded={openPanel === 'settings'}
            >
              Settings
            </button>
            <button
              type="button"
              className="panel-toggle"
              onClick={() => togglePanel('properties')}
              aria-expanded={openPanel === 'properties'}
            >
              Props
            </button>
          </div>
          <PixiCanvas />
          <NorthIndicator />
          <ScaleBar />
          <CanvasShortcuts />
        </div>

        <div className="panel-desktop panel-desktop-right">
          <PropertiesPanel />
        </div>
      </main>

      {openPanel === 'settings' && (
        <>
          <button
            type="button"
            className="panel-backdrop panel-backdrop-open"
            aria-label="Close settings"
            onClick={closePanel}
          />
          <aside
            className="panel-drawer panel-drawer-settings panel-drawer-open"
            role="dialog"
            aria-label="Settings"
          >
            <button
              type="button"
              className="panel-drawer-close"
              onClick={closePanel}
              aria-label="Close"
            >
              ×
            </button>
            <SettingsPanel />
          </aside>
        </>
      )}

      {openPanel === 'properties' && (
        <>
          <button
            type="button"
            className="panel-backdrop panel-backdrop-open panel-backdrop-tablet"
            aria-label="Close properties"
            onClick={closePanel}
          />
          <aside
            className="panel-drawer panel-drawer-properties panel-drawer-open"
            role="dialog"
            aria-label="Properties"
          >
            <button
              type="button"
              className="panel-drawer-close"
              onClick={closePanel}
              aria-label="Close"
            >
              ×
            </button>
            <PropertiesPanel />
          </aside>
        </>
      )}

      <footer className="app-footer">
        <div className="status-bar">
          <span className="status-message">{statusMessage}</span>
          <span className="status-right">
            {ppm ? `Scale: ${ppm.toFixed(1)} px/m` : 'Scale not set'}
          </span>
        </div>
        <LegalDisclaimer variant="compact" />
      </footer>

      <input
        ref={loadRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleLoadFile}
      />

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
      {plantsOpen && <PlantTableModal onClose={() => setPlantsOpen(false)} />}
    </div>
  );
}

export default App;
