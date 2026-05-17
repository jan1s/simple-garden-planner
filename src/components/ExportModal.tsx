import { useState } from 'react';
import { exportPdf, type PaperSize } from '../export/exportPdf';
import { exportPng } from '../export/exportPng';
import { useSceneStore } from '../store/sceneStore';
import { LegalDisclaimer } from './LegalDisclaimer';

export function ExportModal({ onClose }: { onClose: () => void }) {
  const scene = useSceneStore((s) => s.scene);
  const [paper, setPaper] = useState<PaperSize>('a4');
  const [includeBackground, setIncludeBackground] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opts = {
    scale: 1,
    padding: 48,
    includeBackground,
    includeDimensions,
  };

  const handlePng = async () => {
    setExporting(true);
    setError(null);
    try {
      await exportPng(scene, opts);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = async () => {
    if (!scene.pixelsPerMeter && includeDimensions) {
      const ok = confirm(
        'Scale is not calibrated. Dimensions may show pixel values. Export anyway?',
      );
      if (!ok) return;
    }
    setExporting(true);
    setError(null);
    try {
      await exportPdf(scene, paper, {
        ...opts,
        includeBackground: false,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Export plan</h2>

        <p className="export-hint">
          Exports include two views: a colored garden plan and a black-and-white
          architectural sheet. Both include a scale bar when the scene is
          calibrated (Scale tool). Paths, labels, dimensions, and grid are
          included in the crop.
        </p>

        <label className="field">
          Paper size (PDF)
          <select value={paper} onChange={(e) => setPaper(e.target.value as PaperSize)}>
            <option value="a4">A4 landscape</option>
            <option value="a3">A3 landscape</option>
          </select>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={includeBackground}
            onChange={(e) => setIncludeBackground(e.target.checked)}
          />
          Include reference image (PNG)
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={includeDimensions}
            onChange={(e) => setIncludeDimensions(e.target.checked)}
          />
          Include dimension annotations
        </label>

        {error && <p className="error-text">{error}</p>}

        <LegalDisclaimer variant="full" className="export-disclaimer" />

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePng}
            disabled={exporting}
          >
            PNG (2 files)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePdf}
            disabled={exporting}
          >
            PDF (2 pages)
          </button>
        </div>
      </div>
    </div>
  );
}
