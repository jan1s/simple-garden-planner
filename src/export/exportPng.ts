import type { Scene } from '../model/types';
import { renderSceneToCanvas, type ExportOptions } from './renderScene';

function slug(name: string): string {
  return name.replace(/\s+/g, '-').toLowerCase() || 'garden';
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export async function exportPng(
  scene: Scene,
  options: Partial<ExportOptions> = {},
): Promise<void> {
  const base: ExportOptions = {
    scale: options.scale ?? 1,
    padding: options.padding ?? 40,
    includeBackground: options.includeBackground ?? true,
    includeDimensions: options.includeDimensions ?? true,
  };

  const baseName = slug(scene.name);

  const gardenCanvas = await renderSceneToCanvas(scene, {
    ...base,
    style: 'garden',
  });
  downloadCanvas(gardenCanvas, `${baseName}-plan.png`);

  const archCanvas = await renderSceneToCanvas(scene, {
    ...base,
    style: 'architectural',
    includeBackground: false,
  });
  downloadCanvas(archCanvas, `${baseName}-plan-architectural.png`);
}
