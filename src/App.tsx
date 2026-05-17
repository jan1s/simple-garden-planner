import { useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportModal } from './components/ExportModal';
import { PlantTableModal } from './components/PlantTableModal';
import { PixiCanvas } from './pixi/PixiCanvas';
import { downloadSceneFile, sceneFromJson } from './model/serialize';
import { useSceneStore } from './store/sceneStore';
import './styles/app.css';

function App() {
  const [exportOpen, setExportOpen] = useState(false);
  const [plantsOpen, setPlantsOpen] = useState(false);
  const loadRef = useRef<HTMLInputElement>(null);
  const statusMessage = useSceneStore((s) => s.statusMessage);
  const ppm = useSceneStore((s) => s.scene.pixelsPerMeter);

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
        onExportClick={() => setExportOpen(true)}
        onPlantsClick={() => setPlantsOpen(true)}
        onSaveClick={handleSave}
        onLoadClick={handleLoad}
        onNewClick={handleNew}
      />

      <main className="workspace">
        <LayersPanel />
        <PixiCanvas />
        <PropertiesPanel />
      </main>

      <footer className="status-bar">
        <span>{statusMessage}</span>
        <span className="status-right">
          {ppm ? `Scale: ${ppm.toFixed(1)} px/m` : 'Scale not set'}
        </span>
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
