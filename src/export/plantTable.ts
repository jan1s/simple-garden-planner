import { findBedCellAtPosition } from '../model/grid';
import type { PlantElement, PolygonElement, Scene } from '../model/types';

export type PlantTableRow = {
  elementId: string;
  label: string;
  type: 'tree' | 'bush';
  species: string;
  diameterM: number;
  opacity: number;
  comment: string;
  bed: string;
};

const CSV_HEADERS = [
  'ID',
  'Type',
  'Species',
  'Diameter_m',
  'Opacity',
  'Comment',
  'Bed',
] as const;

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function getPlantTableRows(scene: Scene): PlantTableRow[] {
  const plot = scene.elements.find(
    (el): el is PolygonElement => el.type === 'plot',
  );
  const ppm = scene.pixelsPerMeter;

  return scene.elements
    .filter((el): el is PlantElement => el.type === 'tree' || el.type === 'bush')
    .map((plant) => ({
      elementId: plant.id,
      label: plant.label,
      type: plant.type,
      species: plant.species ?? '',
      diameterM: plant.sizeM,
      opacity: plant.opacity,
      comment: plant.comment ?? '',
      bed: findBedCellAtPosition(plant.position, plot, ppm),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

export function plantRowsToCsv(rows: PlantTableRow[]): string {
  const lines = [
    CSV_HEADERS.join(','),
    ...rows.map((r) =>
      [
        escapeCsv(r.label),
        r.type,
        escapeCsv(r.species),
        r.diameterM.toString(),
        r.opacity.toString(),
        escapeCsv(r.comment),
        escapeCsv(r.bed),
      ].join(','),
    ),
  ];
  return lines.join('\n');
}

export function downloadPlantCsv(scene: Scene, filename?: string): void {
  const rows = getPlantTableRows(scene);
  const csv = plantRowsToCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename ??
    `${scene.name.replace(/\s+/g, '-').toLowerCase() || 'garden'}-plants.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/** Apply CSV rows to existing plants matched by label (ID column). */
export function applyPlantCsvToScene(
  csv: string,
  scene: Scene,
): { updated: number; skipped: number } {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { updated: 0, skipped: 0 };

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const labelIdx = header.indexOf('id');
  if (labelIdx < 0) return { updated: 0, skipped: lines.length - 1 };

  const typeIdx = header.indexOf('type');
  const speciesIdx = header.indexOf('species');
  const diamIdx = header.findIndex((h) => h === 'diameter_m' || h === 'diameter');
  const opacityIdx = header.indexOf('opacity');
  const commentIdx = header.indexOf('comment');

  let updated = 0;
  let skipped = 0;

  const elements = scene.elements.map((el) => {
    if (el.type !== 'tree' && el.type !== 'bush') return el;
    return { ...el };
  });

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const label = cols[labelIdx]?.trim();
    if (!label) {
      skipped++;
      continue;
    }

    const idx = elements.findIndex(
      (el) =>
        (el.type === 'tree' || el.type === 'bush') &&
        (el as PlantElement).label.toLowerCase() === label.toLowerCase(),
    );
    if (idx < 0) {
      skipped++;
      continue;
    }

    const plant = elements[idx] as PlantElement;
    if (typeIdx >= 0) {
      const t = cols[typeIdx]?.trim().toLowerCase();
      if (t === 'tree' || t === 'bush') plant.type = t;
    }
    if (speciesIdx >= 0) plant.species = cols[speciesIdx]?.trim() ?? '';
    if (diamIdx >= 0) {
      const d = parseFloat(cols[diamIdx]);
      if (!Number.isNaN(d) && d > 0) plant.sizeM = d;
    }
    if (opacityIdx >= 0) {
      const o = parseFloat(cols[opacityIdx]);
      if (!Number.isNaN(o)) plant.opacity = Math.max(0.1, Math.min(1, o));
    }
    if (commentIdx >= 0) plant.comment = cols[commentIdx]?.trim() ?? '';

    const newLabel = cols[labelIdx]?.trim();
    if (newLabel) plant.label = newLabel;

    elements[idx] = plant;
    updated++;
  }

  scene.elements = elements;
  return { updated, skipped };
}
