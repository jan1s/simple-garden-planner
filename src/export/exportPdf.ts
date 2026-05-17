import { jsPDF } from 'jspdf';
import type { Scene } from '../model/types';
import { renderSceneToCanvas, type ExportOptions } from './renderScene';

export type PaperSize = 'a4' | 'a3';

const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
};

export async function exportPdf(
  scene: Scene,
  paper: PaperSize = 'a4',
  options: Partial<ExportOptions> = {},
): Promise<void> {
  const opts: ExportOptions = {
    scale: options.scale ?? 1,
    padding: options.padding ?? 40,
    includeBackground: options.includeBackground ?? false,
    includeDimensions: options.includeDimensions ?? true,
  };

  const canvas = await renderSceneToCanvas(scene, opts);
  const imgData = canvas.toDataURL('image/png');

  const { w, h } = PAPER_MM[paper];
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [w, h],
  });

  const margin = 12;
  const titleH = 18;
  const imgW = w - margin * 2;
  const imgH = h - margin * 2 - titleH;

  const aspect = canvas.width / canvas.height;
  let drawW = imgW;
  let drawH = drawW / aspect;
  if (drawH > imgH) {
    drawH = imgH;
    drawW = drawH * aspect;
  }

  const x = margin + (imgW - drawW) / 2;
  const y = margin + titleH;

  pdf.setFontSize(14);
  pdf.text(scene.name, margin, margin + 6);
  pdf.setFontSize(9);
  const scaleText = scene.pixelsPerMeter
    ? `Scale: ${scene.pixelsPerMeter.toFixed(1)} px/m`
    : 'Scale: not calibrated';
  pdf.text(`${scaleText}  |  ${new Date().toLocaleDateString()}`, margin, margin + 12);

  pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
  pdf.save(`${scene.name.replace(/\s+/g, '-').toLowerCase() || 'garden'}-plan.pdf`);
}
