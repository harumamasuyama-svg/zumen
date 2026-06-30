export type Tool =
  | 'select'
  | 'pan'
  | 'wall'
  | 'partition'
  | 'door'
  | 'slidingDoor'
  | 'toilet'
  | 'urinal'
  | 'sink'
  | 'kitchen'
  | 'desk'
  | 'chair'
  | 'dimension'
  | 'text'
  | 'eraser'
  | 'deleteArea'
  | 'copyArea'
  | 'pasteArea';

export type ViewMode = 'edit' | 'compare' | 'split3d';
export type CompareLayout = 'side' | 'stack' | 'overlay';
export type ThreeMode = 'bird' | 'iso' | 'walk';

export interface Point { x: number; y: number; }

export interface PlanShape {
  id: string;
  kind: Tool;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  text?: string;
  color?: string;
}

export interface PlanState {
  image?: string;
  imageName?: string;
  shapes: PlanShape[];
}

export interface ProjectState {
  name: string;
  before: PlanState;
  after: PlanState;
  activeRevision: 'before' | 'after';
  comments: string;
  updatedAt: string;
}
