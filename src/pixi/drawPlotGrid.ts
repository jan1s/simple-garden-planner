import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  computePlotGridCells,
  computePlotGridEdgeLabels,
  computePlotGridLines,
} from '../model/grid';
import type { PolygonElement, Scene } from '../model/types';
import { isArchitectural, type PlanDrawStyle } from './drawStyle';

/** Inner grid lines — light gray so edge labels and plants stand out. */
const GRID_LINE_STYLE = { color: '#c4c4c4', width: 1, alpha: 0.7 };
const ARCH_GRID_LINE_STYLE = { color: '#b8b8b8', width: 1, alpha: 0.75 };

/** In-cell ids (A1, B2) — subdued vs edge axis labels. */
const CELL_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 10,
  fill: '#9ca3af',
  fontWeight: '500',
  align: 'center',
});
const ARCH_CELL_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 10,
  fill: '#a3a3a3',
  fontWeight: '500',
  align: 'center',
});
const EDGE_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 12,
  fill: '#166534',
  fontWeight: '700',
  align: 'center',
});
const ARCH_EDGE_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 12,
  fill: '#000000',
  fontWeight: '700',
  align: 'center',
});

/** Extra fade on in-cell labels (gray fill is primary cue). */
const CELL_LABEL_ALPHA = 0.55;

export function drawPlotGrid(
  container: Container,
  plot: PolygonElement,
  scene: Scene,
  style: PlanDrawStyle = 'garden',
): void {
  const grid = plot.grid;
  if (!grid?.enabled || plot.type !== 'plot') return;

  const ppm = scene.pixelsPerMeter;
  const lines = computePlotGridLines(plot, grid, ppm);
  const cells = computePlotGridCells(plot, grid, ppm);

  const g = new Graphics();
  for (const [a, b] of lines) {
    g.moveTo(a.x, a.y).lineTo(b.x, b.y);
  }
  g.stroke(isArchitectural(style) ? ARCH_GRID_LINE_STYLE : GRID_LINE_STYLE);
  container.addChild(g);

  if (!grid.showLabels) return;

  const cellStyle = isArchitectural(style) ? ARCH_CELL_LABEL_STYLE : CELL_LABEL_STYLE;
  const edgeStyle = isArchitectural(style) ? ARCH_EDGE_LABEL_STYLE : EDGE_LABEL_STYLE;

  for (const edge of computePlotGridEdgeLabels(plot, grid, ppm)) {
    const label = new Text({ text: edge.text, style: edgeStyle });
    label.anchor.set(0.5);
    label.position.set(edge.position.x, edge.position.y);
    container.addChild(label);
  }

  for (const cell of cells) {
    const label = new Text({ text: cell.name, style: cellStyle });
    label.anchor.set(0.5);
    label.position.set(cell.center.x, cell.center.y);
    label.alpha = CELL_LABEL_ALPHA;
    container.addChild(label);
  }
}
