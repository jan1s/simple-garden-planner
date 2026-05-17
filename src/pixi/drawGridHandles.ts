import { Graphics } from 'pixi.js';
import type { GridHandlePositions } from '../model/grid';

export function drawGridHandles(g: Graphics, handles: GridHandlePositions): void {
  const { origin, orientation } = handles;

  g.moveTo(origin.x, origin.y);
  g.lineTo(orientation.x, orientation.y);
  g.stroke({ color: '#c2410c', width: 2, alpha: 0.9 });

  g.circle(origin.x, origin.y, 10);
  g.fill({ color: '#ffffff' });
  g.circle(origin.x, origin.y, 10);
  g.stroke({ color: '#c2410c', width: 3 });

  g.circle(origin.x, origin.y, 4);
  g.fill({ color: '#c2410c' });

  g.circle(orientation.x, orientation.y, 9);
  g.fill({ color: '#ffffff' });
  g.circle(orientation.x, orientation.y, 9);
  g.stroke({ color: '#ea580c', width: 2.5 });

  g.moveTo(orientation.x - 5, orientation.y);
  g.lineTo(orientation.x + 5, orientation.y);
  g.moveTo(orientation.x, orientation.y - 5);
  g.lineTo(orientation.x, orientation.y + 5);
  g.stroke({ color: '#ea580c', width: 1.5 });
}
