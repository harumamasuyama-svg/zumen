import type { PlanShape, ProjectState } from '../types';

export const createProject = (): ProjectState => ({
  name: 'ZUMEN 改修提案',
  before: { shapes: [] },
  after: { shapes: [] },
  activeRevision: 'after',
  comments: '',
  updatedAt: new Date().toISOString()
});

export const createDemoShapes = (): PlanShape[] => [
  { id: crypto.randomUUID(), kind: 'wall', x: 130, y: 110, width: 470, height: 16 },
  { id: crypto.randomUUID(), kind: 'wall', x: 130, y: 110, width: 16, height: 310 },
  { id: crypto.randomUUID(), kind: 'wall', x: 130, y: 404, width: 470, height: 16 },
  { id: crypto.randomUUID(), kind: 'wall', x: 584, y: 110, width: 16, height: 310 },
  { id: crypto.randomUUID(), kind: 'partition', x: 350, y: 126, width: 12, height: 278 },
  { id: crypto.randomUUID(), kind: 'door', x: 210, y: 398, width: 76, height: 16 },
  { id: crypto.randomUUID(), kind: 'toilet', x: 480, y: 170, width: 48, height: 64 },
  { id: crypto.randomUUID(), kind: 'sink', x: 455, y: 280, width: 90, height: 52 },
  { id: crypto.randomUUID(), kind: 'desk', x: 180, y: 190, width: 110, height: 72 },
  { id: crypto.randomUUID(), kind: 'chair', x: 215, y: 280, width: 42, height: 42 }
];
