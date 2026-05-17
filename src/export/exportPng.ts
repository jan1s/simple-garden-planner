import type { Scene } from '../model/types';
import { renderSceneToCanvas, type ExportOptions } from './renderScene';

export async function exportPng(
  scene: Scene,
  options: Partial<ExportOptions> = {},
): Promise<void> {
  const opts: ExportOptions = {
    scale: options.scale ?? 1,
    padding: options.padding ?? 40,
    includeBackground: options.includeBackground ?? true,
    includeDimensions: options.includeDimensions ?? true,
  };

  const canvas = await renderSceneToCanvas(scene, opts);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scene.name.replace(/\s+/g, '-').toLowerCase() || 'garden'}-plan.png`;
  a.click();
}
