import { Graphics } from 'pixi.js';
import type { GridHandlePositions } from '../model/grid';
import { HANDLE_DRAW_SCREEN_PX } from '../utils/touch';

export function drawGridHandles(
  g: Graphics,
  handles: GridHandlePositions,
  viewportScale = 1,
): void {
  const { origin, orientation } = handles;
  const s = viewportScale > 0 ? viewportScale : 1;
  const originR = (HANDLE_DRAW_SCREEN_PX + 2) / s;
  const orientR = HANDLE_DRAW_SCREEN_PX / s;
  const innerR = 4 / s;
  const cross = 5 / s;

  g.moveTo(origin.x, origin.y);
  g.lineTo(orientation.x, orientation.y);
  g.stroke({ color: '#c2410c', width: 2 / s, alpha: 0.9 });

  g.circle(origin.x, origin.y, originR);
  g.fill({ color: '#ffffff' });
  g.circle(origin.x, origin.y, originR);
  g.stroke({ color: '#c2410c', width: 3 / s });

  g.circle(origin.x, origin.y, innerR);
  g.fill({ color: '#c2410c' });

  g.circle(orientation.x, orientation.y, orientR);
  g.fill({ color: '#ffffff' });
  g.circle(orientation.x, orientation.y, orientR);
  g.stroke({ color: '#ea580c', width: 2.5 / s });

  g.moveTo(orientation.x - cross, orientation.y);
  g.lineTo(orientation.x + cross, orientation.y);
  g.moveTo(orientation.x, orientation.y - cross);
  g.lineTo(orientation.x, orientation.y + cross);
  g.stroke({ color: '#ea580c', width: 1.5 / s });
}
