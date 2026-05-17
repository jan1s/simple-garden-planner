import { useMemo, useRef } from 'react';
import {
  applyPlantCsvToScene,
  downloadPlantCsv,
  getPlantTableRows,
} from '../export/plantTable';
import { normalizeScene } from '../model/plants';
import { useSceneStore } from '../store/sceneStore';
import type { PlantElement } from '../model/types';

export function PlantTableModal({ onClose }: { onClose: () => void }) {
  const scene = useSceneStore((s) => s.scene);
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const updateElement = useSceneStore((s) => s.updateElement);
  const pushHistory = useSceneStore((s) => s.pushHistory);
  const select = useSceneStore((s) => s.select);
  const removeElement = useSceneStore((s) => s.removeElement);
  const setStatusMessage = useSceneStore((s) => s.setStatusMessage);
  const importRef = useRef<HTMLInputElement>(null);

  const historyPushed = useRef(false);

  const rows = useMemo(() => getPlantTableRows(scene), [scene]);

  const commitHistory = () => {
    if (!historyPushed.current) {
      pushHistory();
      historyPushed.current = true;
    }
  };

  const updatePlant = (id: string, patch: Partial<PlantElement>) => {
    commitHistory();
    updateElement(id, patch);
  };

  const handleRowClick = (elementId: string) => {
    select([elementId]);
  };

  const handleDelete = (elementId: string, label: string) => {
    if (!confirm(`Remove plant ${label}?`)) return;
    removeElement(elementId);
    setStatusMessage(`Removed ${label}`);
  };

  const handleExport = () => {
    downloadPlantCsv(scene);
    setStatusMessage('Plant list exported as CSV');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        pushHistory();
        const cloned = structuredClone(useSceneStore.getState().scene);
        const { updated, skipped } = applyPlantCsvToScene(
          reader.result as string,
          cloned,
        );
        useSceneStore.setState({
          scene: normalizeScene(cloned),
          statusMessage: `Imported CSV: ${updated} updated${skipped ? `, ${skipped} skipped` : ''}`,
        });
        historyPushed.current = false;
      } catch {
        setStatusMessage('Failed to import CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-wide plant-table-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <h2>Plant list</h2>
          <span className="plant-count">{rows.length} plants</span>
        </div>

        <p className="field-hint">
          Edit values below or export to CSV. Import updates existing plants by ID
          column. Click a row to select it on the plan.
        </p>

        <div className="plant-table-wrap">
          {rows.length === 0 ? (
            <p className="empty-hint">No trees or bushes placed yet.</p>
          ) : (
            <table className="plant-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Species</th>
                  <th>Diameter (m)</th>
                  <th>Opacity</th>
                  <th>Comment</th>
                  <th>Bed</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.elementId}
                    className={
                      selectedIds.includes(row.elementId) ? 'selected' : ''
                    }
                    onClick={() => handleRowClick(row.elementId)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        className="table-input"
                        value={row.label}
                        onChange={(e) =>
                          updatePlant(row.elementId, {
                            label: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="table-input"
                        value={row.type}
                        onChange={(e) =>
                          updatePlant(row.elementId, {
                            type: e.target.value as 'tree' | 'bush',
                          })
                        }
                      >
                        <option value="tree">Tree</option>
                        <option value="bush">Bush</option>
                      </select>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        className="table-input"
                        value={row.species}
                        onChange={(e) =>
                          updatePlant(row.elementId, {
                            species: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        className="table-input table-input-narrow"
                        type="number"
                        min={0.5}
                        max={15}
                        step={0.5}
                        value={row.diameterM}
                        onChange={(e) =>
                          updatePlant(row.elementId, {
                            sizeM: parseFloat(e.target.value) || 1,
                          })
                        }
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        className="table-input table-input-narrow"
                        type="number"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={row.opacity}
                        onChange={(e) =>
                          updatePlant(row.elementId, {
                            opacity: parseFloat(e.target.value) || 0.85,
                          })
                        }
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        className="table-input"
                        value={row.comment}
                        onChange={(e) =>
                          updatePlant(row.elementId, {
                            comment: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="bed-cell">{row.bed || '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        title="Remove plant"
                        onClick={() =>
                          handleDelete(row.elementId, row.label)
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => importRef.current?.click()}
          >
            Import CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={rows.length === 0}
          >
            Export CSV
          </button>
        </div>

        <input
          ref={importRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={handleImport}
        />
      </div>
    </div>
  );
}
