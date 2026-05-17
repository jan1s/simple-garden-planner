import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  DEFAULT_BUSH_SIZE_M,
  DEFAULT_FILLS,
  DEFAULT_FENCE_COLOR,
  DEFAULT_PATH_COLOR,
  DEFAULT_PATH_WIDTH_M,
  DEFAULT_PLANT_OPACITY,
  DEFAULT_STROKES,
  DEFAULT_TREE_SIZE_M,
} from '../model/defaults';
import { DEFAULT_PLOT_GRID } from '../model/grid';
import { nextPlantLabel } from '../model/plants';
import { normalizeScene } from '../model/plants';
import {
  createEmptyScene,
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../model/serialize';
import type {
  GardenElement,
  LayerVisibility,
  Point,
  Scene,
  ToolId,
} from '../model/types';
import { DEFAULT_LAYER_VISIBILITY } from '../model/types';

const MAX_UNDO = 50;

type SceneSnapshot = {
  scene: Scene;
  selectedIds: string[];
};

type AppState = {
  scene: Scene;
  activeTool: ToolId;
  selectedIds: string[];
  layerVisibility: LayerVisibility;
  snapEnabled: boolean;
  past: SceneSnapshot[];
  future: SceneSnapshot[];
  scaleDraft: { a: Point | null; b: Point | null };
  statusMessage: string;
  draftActive: boolean;

  setActiveTool: (tool: ToolId) => void;
  setDraftActive: (active: boolean) => void;
  setStatusMessage: (msg: string) => void;
  setSnapEnabled: (enabled: boolean) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setSceneName: (name: string) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  setBackground: (bg: Scene['background']) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setPixelsPerMeter: (ppm: number | null) => void;
  setScaleDraft: (draft: { a: Point | null; b: Point | null }) => void;

  select: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  clearSelection: () => void;

  addElement: (element: GardenElement) => void;
  updateElement: (id: string, patch: Partial<GardenElement>) => void;
  removeSelected: () => void;
  removeElement: (id: string) => void;
  setElements: (elements: GardenElement[]) => void;

  loadScene: (scene: Scene) => void;
  newScene: () => void;
};

function snapshot(state: AppState): SceneSnapshot {
  return {
    scene: structuredClone(state.scene),
    selectedIds: [...state.selectedIds],
  };
}

function restore(snapshot: SceneSnapshot): Pick<AppState, 'scene' | 'selectedIds'> {
  return {
    scene: structuredClone(snapshot.scene),
    selectedIds: [...snapshot.selectedIds],
  };
}

const saved = loadFromLocalStorage();
const initialScene = saved ? normalizeScene(saved) : createEmptyScene();

export const useSceneStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    scene: initialScene,
    activeTool: 'select',
    selectedIds: [],
    layerVisibility: { ...DEFAULT_LAYER_VISIBILITY },
    snapEnabled: false,
    past: [],
    future: [],
    scaleDraft: { a: null, b: null },
    statusMessage: saved
      ? 'Scene restored from browser storage'
      : 'Upload a reference image to get started',
    draftActive: false,

    setActiveTool: (tool) =>
      set({
        activeTool: tool,
        scaleDraft: { a: null, b: null },
        draftActive: false,
      }),

    setDraftActive: (active) => set({ draftActive: active }),

    setStatusMessage: (msg) => set({ statusMessage: msg }),

    setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),

    toggleLayer: (layer) =>
      set((s) => ({
        layerVisibility: {
          ...s.layerVisibility,
          [layer]: !s.layerVisibility[layer],
        },
      })),

    setSceneName: (name) =>
      set((s) => ({
        scene: { ...s.scene, name },
      })),

    pushHistory: () => {
      const state = get();
      const snap = snapshot(state);
      set({
        past: [...state.past.slice(-MAX_UNDO + 1), snap],
        future: [],
      });
    },

    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      const currSnap = snapshot(get() as AppState);
      set({
        ...restore(prev),
        past: past.slice(0, -1),
        future: [currSnap, ...future],
        statusMessage: 'Undo',
      });
    },

    redo: () => {
      const { past, future } = get();
      if (future.length === 0) return;
      const next = future[0];
      const currSnap = snapshot(get() as AppState);
      set({
        ...restore(next),
        past: [...past, currSnap],
        future: future.slice(1),
        statusMessage: 'Redo',
      });
    },

    setBackground: (bg) => {
      get().pushHistory();
      set((s) => ({ scene: { ...s.scene, background: bg } }));
    },

    setBackgroundOpacity: (opacity) =>
      set((s) => {
        if (!s.scene.background) return s;
        return {
          scene: {
            ...s.scene,
            background: { ...s.scene.background, opacity },
          },
        };
      }),

    setPixelsPerMeter: (ppm) => {
      get().pushHistory();
      set((s) => ({ scene: { ...s.scene, pixelsPerMeter: ppm } }));
    },

    setScaleDraft: (draft) => set({ scaleDraft: draft }),

    select: (ids) => set({ selectedIds: ids }),

    addToSelection: (id) =>
      set((s) => ({
        selectedIds: s.selectedIds.includes(id)
          ? s.selectedIds
          : [...s.selectedIds, id],
      })),

    clearSelection: () => set({ selectedIds: [] }),

    addElement: (element) => {
      get().pushHistory();
      set((s) => ({
        scene: {
          ...s.scene,
          elements: [...s.scene.elements, element],
        },
        selectedIds: [element.id],
      }));
    },

    updateElement: (id, patch) => {
      set((s) => ({
        scene: {
          ...s.scene,
          elements: s.scene.elements.map((el) =>
            el.id === id ? ({ ...el, ...patch } as GardenElement) : el,
          ),
        },
      }));
    },

    removeSelected: () => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;
      get().pushHistory();
      set((s) => ({
        scene: {
          ...s.scene,
          elements: s.scene.elements.filter((el) => !selectedIds.includes(el.id)),
        },
        selectedIds: [],
        statusMessage: 'Deleted selected elements',
      }));
    },

    removeElement: (id) => {
      get().pushHistory();
      set((s) => ({
        scene: {
          ...s.scene,
          elements: s.scene.elements.filter((el) => el.id !== id),
        },
        selectedIds: s.selectedIds.filter((sid) => sid !== id),
      }));
    },

    setElements: (elements) => {
      set((s) => ({
        scene: { ...s.scene, elements },
      }));
    },

    loadScene: (scene) => {
      set({
        scene: normalizeScene(structuredClone(scene)),
        selectedIds: [],
        past: [],
        future: [],
        statusMessage: `Loaded "${scene.name}"`,
      });
    },

    newScene: () => {
      const scene = createEmptyScene();
      set({
        scene,
        selectedIds: [],
        past: [],
        future: [],
        statusMessage: 'New scene created',
      });
    },
  })),
);

// Autosave
useSceneStore.subscribe(
  (s) => s.scene,
  (scene) => saveToLocalStorage(scene),
);

export function createPolygonElement(
  type: 'building' | 'plot' | 'terrace',
  points: Point[],
): GardenElement {
  const stroke = DEFAULT_STROKES[type] ?? DEFAULT_STROKES.building;
  const fill = DEFAULT_FILLS[type];
  return {
    type,
    id: uuidv4(),
    points,
    stroke,
    fill,
    ...(type === 'plot' ? { grid: { ...DEFAULT_PLOT_GRID } } : {}),
  };
}

export function createPathElement(points: Point[]): GardenElement {
  return {
    type: 'path',
    id: uuidv4(),
    points,
    widthM: DEFAULT_PATH_WIDTH_M,
    color: DEFAULT_PATH_COLOR,
  };
}

export function createFenceElement(points: Point[]): GardenElement {
  return {
    type: 'fence',
    id: uuidv4(),
    points,
    color: DEFAULT_FENCE_COLOR,
    heightM: 1.8,
  };
}

export function createPlantElement(
  type: 'tree' | 'bush',
  position: Point,
  existingElements: GardenElement[],
): GardenElement {
  return {
    type,
    id: uuidv4(),
    label: nextPlantLabel(type, existingElements),
    position,
    sizeM: type === 'tree' ? DEFAULT_TREE_SIZE_M : DEFAULT_BUSH_SIZE_M,
    opacity: DEFAULT_PLANT_OPACITY,
  };
}

export function createDimensionElement(
  a: Point,
  b: Point,
  offset: number,
): GardenElement {
  return {
    type: 'dimension',
    id: uuidv4(),
    a,
    b,
    offset,
  };
}
