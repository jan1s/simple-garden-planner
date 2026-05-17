import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  computePlotGridCells,
  computePlotGridLines,
} from '../model/grid';
import type { PolygonElement, Scene } from '../model/types';

const GRID_LINE_STYLE = { color: '#86efac', width: 1, alpha: 0.85 };
const CELL_LABEL_STYLE = new TextStyle({
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  fill: '#166534',
  fontWeight: '600',
  align: 'center',
});

export function drawPlotGrid(
  container: Container,
  plot: PolygonElement,
  scene: Scene,
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
  g.stroke(GRID_LINE_STYLE);
  container.addChild(g);

  if (grid.showLabels) {
    for (const cell of cells) {
      const label = new Text({ text: cell.name, style: CELL_LABEL_STYLE });
      label.anchor.set(0.5);
      label.position.set(cell.center.x, cell.center.y);
      label.alpha = 0.9;
      container.addChild(label);
    }
  }
}
