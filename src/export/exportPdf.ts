import { jsPDF } from 'jspdf';
import type { Scene } from '../model/types';
import { renderSceneToCanvas, type ExportOptions } from './renderScene';

export type PaperSize = 'a4' | 'a3';

function slug(name: string): string {
  return name.replace(/\s+/g, '-').toLowerCase() || 'garden';
}

/** Use portrait when the plan is taller than wide (typical garden photos). */
export function canvasPdfOrientation(
  canvas: HTMLCanvasElement,
): 'portrait' | 'landscape' {
  return canvas.height > canvas.width ? 'portrait' : 'landscape';
}

function fitImageOnPage(
  canvas: HTMLCanvasElement,
  imgW: number,
  imgH: number,
): { drawW: number; drawH: number } {
  const aspect = canvas.width / canvas.height;
  let drawW = imgW;
  let drawH = drawW / aspect;
  if (drawH > imgH) {
    drawH = imgH;
    drawW = drawH * aspect;
  }
  return { drawW, drawH };
}

function addPlanPage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  title: string,
  scene: Scene,
): void {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const titleH = 18;
  const imgW = pageW - margin * 2;
  const imgH = pageH - margin * 2 - titleH;
  const { drawW, drawH } = fitImageOnPage(canvas, imgW, imgH);
  const x = margin + (imgW - drawW) / 2;
  const y = margin + titleH;

  pdf.setFontSize(14);
  pdf.text(title, margin, margin + 6);
  pdf.setFontSize(9);
  const scaleText = scene.pixelsPerMeter
    ? `Scale: ${scene.pixelsPerMeter.toFixed(1)} px/m`
    : 'Scale: not calibrated';
  pdf.text(`${scaleText}  |  ${new Date().toLocaleDateString()}`, margin, margin + 12);

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
}

export async function exportPdf(
  scene: Scene,
  paper: PaperSize = 'a4',
  options: Partial<ExportOptions> = {},
): Promise<void> {
  const base: ExportOptions = {
    scale: options.scale ?? 1,
    padding: options.padding ?? 40,
    includeBackground: options.includeBackground ?? false,
    includeDimensions: options.includeDimensions ?? true,
  };

  const gardenCanvas = await renderSceneToCanvas(scene, {
    ...base,
    style: 'garden',
    includeBackground: options.includeBackground ?? false,
  });

  const archCanvas = await renderSceneToCanvas(scene, {
    ...base,
    style: 'architectural',
    includeBackground: false,
  });

  const gardenOrient = canvasPdfOrientation(gardenCanvas);
  const archOrient = canvasPdfOrientation(archCanvas);

  const pdf = new jsPDF({
    orientation: gardenOrient,
    unit: 'mm',
    format: paper,
  });

  addPlanPage(pdf, gardenCanvas, scene.name, scene);

  pdf.addPage(paper, archOrient === 'portrait' ? 'p' : 'l');
  addPlanPage(pdf, archCanvas, `${scene.name} — Architectural`, scene);

  pdf.save(`${slug(scene.name)}-plan.pdf`);
}
