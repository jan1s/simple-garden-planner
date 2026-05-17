import { DEFAULT_PLANT_OPACITY } from './defaults';
import { normalizePlotGrid } from './grid';
import type { GardenElement, PlantElement, Scene } from './types';

export const TREE_LABEL_PREFIX = 'B';
export const BUSH_LABEL_PREFIX = 'S';

export function nextPlantLabel(
  type: 'tree' | 'bush',
  existingElements: GardenElement[],
): string {
  const prefix = type === 'tree' ? TREE_LABEL_PREFIX : BUSH_LABEL_PREFIX;
  const used = new Set<number>();

  for (const el of existingElements) {
    if (el.type !== type) continue;
    const plant = el as PlantElement;
    const match = plant.label?.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
    if (match) used.add(parseInt(match[1], 10));
  }

  let n = 1;
  while (used.has(n)) n++;
  return `${prefix}-${String(n).padStart(2, '0')}`;
}

export function normalizePlant(
  el: GardenElement,
  elementsSoFar: GardenElement[],
): GardenElement {
  if (el.type === 'plot') return normalizePlotGrid(el);
  if (el.type !== 'tree' && el.type !== 'bush') return el;
  const plant = el as PlantElement;
  return {
    ...plant,
    label: plant.label ?? nextPlantLabel(plant.type, elementsSoFar),
    opacity:
      typeof plant.opacity === 'number' ? plant.opacity : DEFAULT_PLANT_OPACITY,
  };
}

export function normalizeScene(scene: Scene): Scene {
  const elements: GardenElement[] = [];
  for (const el of scene.elements) {
    elements.push(normalizePlant(el, elements));
  }
  return { ...scene, elements };
}

export function plantDetailLine(plant: PlantElement): string {
  const parts: string[] = [plant.label];
  if (plant.species?.trim()) parts.push(plant.species.trim());
  parts.push(`Ø ${plant.sizeM}m`);
  if (plant.comment?.trim()) parts.push(plant.comment.trim());
  return parts.join(', ');
}
