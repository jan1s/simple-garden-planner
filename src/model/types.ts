export type Point = { x: number; y: number };

export type StrokeStyle = {
  color: string;
  width: number;
};

export type ElementType =
  | 'building'
  | 'plot'
  | 'path'
  | 'terrace'
  | 'fence'
  | 'tree'
  | 'bush';

export type PlotGrid = {
  enabled: boolean;
  /** Cell edge length in meters (uses scale calibration) */
  cellSizeM: number;
  /** Grid rotation in degrees (0 = east/north aligned to image axes) */
  orientationDeg: number;
  /** Shift grid origin from plot centroid along grid columns (m) */
  offsetXM: number;
  /** Shift grid origin from plot centroid along grid rows (m) */
  offsetYM: number;
  showLabels: boolean;
};

export type PolygonElement = {
  type: 'building' | 'plot' | 'terrace';
  id: string;
  points: Point[];
  stroke: StrokeStyle;
  fill?: string;
  /** When true, position and vertices cannot be changed with the select tool */
  locked?: boolean;
  /** Bed grid inside plot (plot type only) */
  grid?: PlotGrid;
};

export type PathElement = {
  type: 'path';
  id: string;
  points: Point[];
  widthM: number;
  color: string;
};

export type FenceElement = {
  type: 'fence';
  id: string;
  points: Point[];
  color: string;
  heightM?: number;
};

export type PlantElement = {
  type: 'tree' | 'bush';
  id: string;
  /** Display id on canvas, e.g. B-01 (tree) or S-01 (bush) */
  label: string;
  position: Point;
  species?: string;
  /** Crown diameter in meters */
  sizeM: number;
  opacity: number;
  comment?: string;
};

export type DimensionElement = {
  type: 'dimension';
  id: string;
  a: Point;
  b: Point;
  offset: number;
};

export type AnnotationElement = {
  type: 'annotation';
  id: string;
  /** Arrow tip — points at the feature on the plan */
  tip: Point;
  /** Text label position (leader attaches here) */
  anchor: Point;
  text: string;
};

export type GardenElement =
  | PolygonElement
  | PathElement
  | FenceElement
  | PlantElement
  | DimensionElement
  | AnnotationElement;

export type Background = {
  imageDataUrl: string;
  opacity: number;
  width: number;
  height: number;
};

export type Scene = {
  id: string;
  name: string;
  pixelsPerMeter: number | null;
  background: Background | null;
  elements: GardenElement[];
};

export type OverlayElementType = 'dimension' | 'annotation';

export type LayerVisibility = Record<ElementType | OverlayElementType, boolean>;

export type ToolId =
  | 'select'
  | 'pan'
  | 'building'
  | 'plot'
  | 'terrace'
  | 'path'
  | 'fence'
  | 'tree'
  | 'bush'
  | 'dimension'
  | 'annotation'
  | 'scale';

export const ELEMENT_DRAW_ORDER: (ElementType | OverlayElementType)[] = [
  'plot',
  'terrace',
  'path',
  'building',
  'fence',
  'tree',
  'bush',
  'dimension',
  'annotation',
];

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  building: true,
  plot: true,
  path: true,
  terrace: true,
  fence: true,
  tree: true,
  bush: true,
  dimension: true,
  annotation: true,
};
