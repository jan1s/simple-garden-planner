import { jsPDF } from 'jspdf';
import type { Scene } from '../model/types';
import { renderSceneToCanvas, type ExportOptions } from './renderScene';

export type PaperSize = 'a4' | 'a3';

const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
};

function slug(name: string): string {
  return name.replace(/\s+/g, '-').toLowerCase() || 'garden';
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
  paper: PaperSize,
  isFirstPage: boolean,
): void {
  const { w, h } = PAPER_MM[paper];
  if (!isFirstPage) {
    pdf.addPage([w, h], 'landscape');
  }

  const margin = 12;
  const titleH = 18;
  const imgW = w - margin * 2;
  const imgH = h - margin * 2 - titleH;
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

  const { w, h } = PAPER_MM[paper];
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [w, h],
  });

  addPlanPage(pdf, gardenCanvas, scene.name, scene, paper, true);
  addPlanPage(
    pdf,
    archCanvas,
    `${scene.name} — Architectural`,
    scene,
    paper,
    false,
  );

  pdf.save(`${slug(scene.name)}-plan.pdf`);
}
