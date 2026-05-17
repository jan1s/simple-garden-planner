import { v4 as uuidv4 } from 'uuid';
import { normalizeScene } from './plants';
import type { Scene } from './types';

const STORAGE_KEY = 'garden-planner-scene';

export function createEmptyScene(name = 'Untitled Garden'): Scene {
  return {
    id: uuidv4(),
    name,
    pixelsPerMeter: null,
    background: null,
    elements: [],
  };
}

export function sceneToJson(scene: Scene): string {
  return JSON.stringify(scene, null, 2);
}

export function sceneFromJson(json: string): Scene {
  const parsed = JSON.parse(json) as Scene;
  if (!parsed.id || !Array.isArray(parsed.elements)) {
    throw new Error('Invalid scene file');
  }
  return normalizeScene(parsed);
}

export function saveToLocalStorage(scene: Scene): void {
  try {
    localStorage.setItem(STORAGE_KEY, sceneToJson(scene));
  } catch {
    console.warn('Could not save to localStorage (quota exceeded?)');
  }
}

export function loadFromLocalStorage(): Scene | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sceneFromJson(raw);
  } catch {
    return null;
  }
}

export function downloadSceneFile(scene: Scene): void {
  const blob = new Blob([sceneToJson(scene)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scene.name.replace(/\s+/g, '-').toLowerCase() || 'garden'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function loadImageFile(file: File, maxSize = 4096): Promise<{
  imageDataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve({
          imageDataUrl: canvas.toDataURL('image/jpeg', 0.85),
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
