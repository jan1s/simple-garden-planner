import { useCallback, useEffect, useRef } from 'react';
import { DEFAULT_PLOT_GRID } from '../model/grid';
import { useSceneStore } from '../store/sceneStore';
import type { GardenElement, PlotGrid } from '../model/types';

function PolygonProps({
  el,
  onUpdate,
}: {
  el: Extract<GardenElement, { type: 'building' | 'plot' | 'terrace' }>;
  onUpdate: (patch: Partial<GardenElement>) => void;
}) {
  return (
    <>
      <label className="field">
        Stroke color
        <input
          type="color"
          value={el.stroke.color}
          onChange={(e) =>
            onUpdate({ stroke: { ...el.stroke, color: e.target.value } })
          }
        />
      </label>
      <label className="field">
        Stroke width
        <input
          type="number"
          min={1}
          max={10}
          value={el.stroke.width}
          onChange={(e) =>
            onUpdate({
              stroke: { ...el.stroke, width: parseFloat(e.target.value) || 1 },
            })
          }
        />
      </label>
      {el.fill !== undefined && (
        <label className="field">
          Fill color
          <input
            type="color"
            value={el.fill?.startsWith('#') ? el.fill : '#22c55e'}
            onChange={(e) => onUpdate({ fill: e.target.value })}
          />
        </label>
      )}
      {el.type === 'plot' && (
        <label className="checkbox-field lock-field">
          <input
            type="checkbox"
            checked={el.locked === true}
            onChange={(e) => onUpdate({ locked: e.target.checked })}
          />
          Lock position (prevent accidental moves)
        </label>
      )}
    </>
  );
}

function PlotGridProps({
  grid,
  onUpdate,
  hasScale,
}: {
  grid: PlotGrid;
  onUpdate: (patch: Partial<PlotGrid>) => void;
  hasScale: boolean;
}) {
  return (
    <div className="grid-props">
      <h3 className="subsection-title">Bed grid</h3>
      {!hasScale && (
        <p className="field-hint grid-hint">
          Set scale first so cell spacing is accurate in meters.
        </p>
      )}
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={grid.enabled}
          onChange={(e) => onUpdate({ enabled: e.target.checked })}
        />
        Show grid inside plot
      </label>
      {grid.enabled && (
        <>
          <label className="field">
            Cell size (m)
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.5}
              value={grid.cellSizeM}
              onChange={(e) =>
                onUpdate({ cellSizeM: parseFloat(e.target.value) || 2 })
              }
            />
          </label>
          <label className="field">
            Orientation (°)
            <input
              type="number"
              min={-180}
              max={180}
              step={1}
              value={grid.orientationDeg}
              onChange={(e) =>
                onUpdate({ orientationDeg: parseFloat(e.target.value) || 0 })
              }
            />
          </label>
          <label className="field">
            Origin offset X (m)
            <input
              type="number"
              min={-100}
              max={100}
              step={0.5}
              value={grid.offsetXM}
              onChange={(e) =>
                onUpdate({ offsetXM: parseFloat(e.target.value) || 0 })
              }
            />
          </label>
          <label className="field">
            Origin offset Y (m)
            <input
              type="number"
              min={-100}
              max={100}
              step={0.5}
              value={grid.offsetYM}
              onChange={(e) =>
                onUpdate({ offsetYM: parseFloat(e.target.value) || 0 })
              }
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={grid.showLabels}
              onChange={(e) => onUpdate({ showLabels: e.target.checked })}
            />
            Show cell names (A1, B2, …)
          </label>
          <p className="field-hint">
            Columns: A, B, C… · Rows: 1, 2, 3… · Select plot + drag orange
            handles: centre = origin, arm tip = rotate around origin
          </p>
        </>
      )}
    </div>
  );
}

function SingleElementProperties({
  el,
  onUpdate,
  hasScale,
}: {
  el: GardenElement;
  onUpdate: (patch: Partial<GardenElement>) => void;
  hasScale: boolean;
}) {
  return (
    <>
      <p className="element-type">{el.type}</p>

      {(el.type === 'building' || el.type === 'plot' || el.type === 'terrace') && (
        <PolygonProps el={el} onUpdate={onUpdate} />
      )}

      {el.type === 'plot' && (
        <PlotGridProps
          grid={{ ...DEFAULT_PLOT_GRID, ...el.grid }}
          hasScale={hasScale}
          onUpdate={(patch) =>
            onUpdate({
              grid: { ...DEFAULT_PLOT_GRID, ...el.grid, ...patch },
            })
          }
        />
      )}

      {el.type === 'path' && (
        <>
          <label className="field">
            Width (m)
            <input
              type="number"
              min={0.3}
              max={5}
              step={0.1}
              value={el.widthM}
              onChange={(e) =>
                onUpdate({ widthM: parseFloat(e.target.value) || 1 })
              }
            />
          </label>
          <label className="field">
            Color
            <input
              type="color"
              value={el.color.startsWith('#') ? el.color : '#78716c'}
              onChange={(e) => onUpdate({ color: e.target.value })}
            />
          </label>
        </>
      )}

      {el.type === 'fence' && (
        <>
          <label className="field">
            Height (m)
            <input
              type="number"
              min={0.5}
              max={3}
              step={0.1}
              value={el.heightM ?? 1.8}
              onChange={(e) =>
                onUpdate({ heightM: parseFloat(e.target.value) || 1.8 })
              }
            />
          </label>
          <label className="field">
            Color
            <input
              type="color"
              value={el.color.startsWith('#') ? el.color : '#57534e'}
              onChange={(e) => onUpdate({ color: e.target.value })}
            />
          </label>
        </>
      )}

      {(el.type === 'tree' || el.type === 'bush') && (
        <>
          <label className="field">
            Identifier
            <input
              type="text"
              value={el.label}
              onChange={(e) => onUpdate({ label: e.target.value.trim() })}
              placeholder={el.type === 'tree' ? 'B-01' : 'S-01'}
            />
          </label>
          <label className="field">
            Opacity
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={el.opacity}
              onChange={(e) =>
                onUpdate({ opacity: parseFloat(e.target.value) })
              }
            />
            <span className="field-hint">{Math.round(el.opacity * 100)}%</span>
          </label>
          <label className="field">
            Species
            <input
              type="text"
              value={el.species ?? ''}
              onChange={(e) => onUpdate({ species: e.target.value })}
              placeholder="e.g. Oak, Boxwood"
            />
          </label>
          <label className="field">
            Diameter (m)
            <input
              type="number"
              min={0.5}
              max={15}
              step={0.5}
              value={el.sizeM}
              onChange={(e) =>
                onUpdate({ sizeM: parseFloat(e.target.value) || 1 })
              }
            />
          </label>
          <label className="field">
            Comment
            <textarea
              rows={4}
              value={el.comment ?? ''}
              onChange={(e) => onUpdate({ comment: e.target.value })}
              placeholder="e.g. Needs to be cut down"
            />
          </label>
          <p className="plant-preview-line">
            On canvas: {el.label}
            {el.comment?.trim() ? ` — ${el.comment.trim()}` : ''}
          </p>
        </>
      )}

      {el.type === 'dimension' && (
        <label className="field">
          Label offset
          <input
            type="number"
            min={10}
            max={80}
            value={el.offset}
            onChange={(e) =>
              onUpdate({ offset: parseFloat(e.target.value) || 30 })
            }
          />
        </label>
      )}

      {el.type === 'annotation' && (
        <label className="field">
          Text
          <textarea
            rows={3}
            value={el.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Label on plan"
          />
        </label>
      )}
    </>
  );
}

export function PropertiesPanel() {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const elements = useSceneStore((s) => s.scene.elements);
  const hasScale = useSceneStore((s) => s.scene.pixelsPerMeter != null);
  const updateElement = useSceneStore((s) => s.updateElement);
  const pushHistory = useSceneStore((s) => s.pushHistory);

  const historyPushed = useRef(false);
  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null;

  useEffect(() => {
    historyPushed.current = false;
  }, [singleSelectedId]);

  const handleUpdate = useCallback(
    (patch: Partial<GardenElement>) => {
      if (!singleSelectedId) return;
      if (!historyPushed.current) {
        pushHistory();
        historyPushed.current = true;
      }
      updateElement(singleSelectedId, patch);
    },
    [singleSelectedId, pushHistory, updateElement],
  );

  const selected = elements.filter((el) => selectedIds.includes(el.id));
  const singleElement =
    singleSelectedId != null
      ? elements.find((el) => el.id === singleSelectedId)
      : undefined;

  return (
    <aside className="panel properties-panel">
      <h2>Properties</h2>

      {selected.length === 0 && (
        <p className="empty-hint">Select an element to edit its properties.</p>
      )}

      {selected.length > 1 && (
        <p className="empty-hint">{selected.length} elements selected</p>
      )}

      {singleElement && (
        <SingleElementProperties
          el={singleElement}
          onUpdate={handleUpdate}
          hasScale={hasScale}
        />
      )}
    </aside>
  );
}
