import { useEffect, useMemo, useRef, useState } from 'react';
import { BringToFront, Download, Eraser, FileDown, FileImage, FolderOpen, Grid2X2, History, MousePointer2, Move, RotateCcw, RotateCw, Save, Type, Upload } from 'lucide-react';
import { DrawingCanvas, labelFor } from './components/DrawingCanvas';
import { ThreePreview } from './components/ThreePreview';
import { createDemoShapes, createProject } from './lib/defaults';
import { clonePlan, fileToPlanImage } from './lib/pdf';
import type { CompareLayout, PlanState, ProjectState, ThreeMode, Tool, ViewMode } from './types';

const tools: Tool[] = ['select', 'pan', 'wall', 'partition', 'door', 'slidingDoor', 'toilet', 'urinal', 'sink', 'kitchen', 'desk', 'chair', 'dimension', 'text', 'eraser'];

export function App() {
  const [project, setProject] = useState<ProjectState>(() => createProject());
  const [tool, setTool] = useState<Tool>('select');
  const [view, setView] = useState<ViewMode>('edit');
  const [compareLayout, setCompareLayout] = useState<CompareLayout>('side');
  const [threeMode, setThreeMode] = useState<ThreeMode>('iso');
  const [selectedId, setSelectedId] = useState<string>();
  const [history, setHistory] = useState<ProjectState[]>([]);
  const [future, setFuture] = useState<ProjectState[]>([]);
  const importProjectRef = useRef<HTMLInputElement>(null);
  const activePlan = project[project.activeRevision];
  const selected = useMemo(() => activePlan.shapes.find((s) => s.id === selectedId), [activePlan.shapes, selectedId]);

  const commit = (next: ProjectState) => {
    setHistory((h) => [...h.slice(-40), project]);
    setFuture([]);
    setProject({ ...next, updatedAt: new Date().toISOString() });
  };

  const updateActivePlan = (plan: PlanState) => commit({ ...project, [project.activeRevision]: plan });

  const loadDrawing = async (file: File) => {
    const image = await fileToPlanImage(file);
    const plan = { ...activePlan, image, imageName: file.name };
    commit({ ...project, [project.activeRevision]: plan });
  };

  const saveBefore = () => commit({ ...project, before: clonePlan(activePlan), activeRevision: 'before' });
  const saveAfter = () => commit({ ...project, after: clonePlan(activePlan), activeRevision: 'after' });
  const seedDemo = () => commit({ ...project, after: { ...project.after, shapes: createDemoShapes() }, activeRevision: 'after' });

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((f) => [project, ...f]);
    setHistory((h) => h.slice(0, -1));
    setProject(previous);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, project]);
    setFuture((f) => f.slice(1));
    setProject(next);
  };

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ZUMEN-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadJson = async (file: File) => {
    const loaded = JSON.parse(await file.text()) as ProjectState;
    commit(loaded);
  };

  const exportPng = async () => {
    const { exportPlanPng } = await import('./lib/exporters');
    await exportPlanPng(project);
  };

  const exportPdf = async () => {
    const { exportComparisonPdf } = await import('./lib/exporters');
    await exportComparisonPdf(project, compareLayout === 'side' ? 'l' : 'p');
  };

  const exportWord = async () => {
    const { exportComparisonDocx } = await import('./lib/exporters');
    await exportComparisonDocx(project, compareLayout === 'side' ? 'landscape' : 'portrait');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><img src={`${import.meta.env.BASE_URL}zumen-logo.png`} alt="ZUMEN" /><span>Plan editor and 3D preview</span></div>
        <div className="menuGroup">
          <label className="command"><Upload size={16} />Import<input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => e.target.files?.[0] && void loadDrawing(e.target.files[0])} /></label>
          <button onClick={saveJson}><Save size={16} />Save</button>
          <button onClick={() => importProjectRef.current?.click()}><FolderOpen size={16} />Open</button>
          <input ref={importProjectRef} hidden type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && void loadJson(e.target.files[0])} />
          <button onClick={undo} disabled={!history.length}><RotateCcw size={16} />Undo</button>
          <button onClick={redo} disabled={!future.length}><RotateCw size={16} />Redo</button>
        </div>
        <div className="menuGroup right">
          <button onClick={() => void exportPng()}><FileImage size={16} />PNG</button>
          <button onClick={() => void exportPdf()}><FileDown size={16} />PDF</button>
          <button onClick={() => void exportWord()}><Download size={16} />Word</button>
        </div>
      </header>

      <aside className="toolbar">
        <button className="wide" onClick={seedDemo}><Grid2X2 size={17} />Sample</button>
        {tools.map((item) => <button key={item} className={tool === item ? 'active' : ''} onClick={() => setTool(item)} title={labelFor(item)}>{iconFor(item)}<span>{labelFor(item)}</span></button>)}
      </aside>

      <main className="workspace">
        <div className="workspaceTabs">
          <button className={view === 'edit' ? 'active' : ''} onClick={() => setView('edit')}>Edit</button>
          <button className={view === 'compare' ? 'active' : ''} onClick={() => setView('compare')}>Before / After</button>
          <button className={view === 'split3d' ? 'active' : ''} onClick={() => setView('split3d')}>Plan + 3D</button>
        </div>
        {view === 'edit' && <DrawingCanvas plan={activePlan} tool={tool} selectedId={selectedId} onChange={updateActivePlan} onSelect={setSelectedId} />}
        {view === 'compare' && <Comparison before={project.before} after={project.after} layout={compareLayout} />}
        {view === 'split3d' && <div className="splitPane"><DrawingCanvas plan={project.after} tool={tool} selectedId={selectedId} onChange={(plan) => commit({ ...project, after: plan, activeRevision: 'after' })} onSelect={setSelectedId} /><ThreePreview plan={project.after} selectedId={selectedId} mode={threeMode} /></div>}
      </main>

      <aside className="properties">
        <section>
          <h2>Revision</h2>
          <div className="segmented"><button className={project.activeRevision === 'before' ? 'active' : ''} onClick={() => setProject({ ...project, activeRevision: 'before' })}>Before</button><button className={project.activeRevision === 'after' ? 'active' : ''} onClick={() => setProject({ ...project, activeRevision: 'after' })}>After</button></div>
          <button className="primary" onClick={saveBefore}>Save current as before</button>
          <button className="primary ghost" onClick={saveAfter}>Save current as after</button>
        </section>
        <section>
          <h2>View</h2>
          <label>Compare layout</label>
          <select value={compareLayout} onChange={(e) => setCompareLayout(e.target.value as CompareLayout)}><option value="side">Side by side</option><option value="stack">Top and bottom</option><option value="overlay">Overlay</option></select>
          <label>3D mode</label>
          <select value={threeMode} onChange={(e) => setThreeMode(e.target.value as ThreeMode)}><option value="bird">Bird view</option><option value="iso">Isometric</option><option value="walk">Walkthrough</option></select>
        </section>
        <section>
          <h2>Project</h2>
          <label>Title</label>
          <input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
          <label>Comments</label>
          <textarea value={project.comments} onChange={(e) => setProject({ ...project, comments: e.target.value })} />
        </section>
        <section>
          <h2>Selection</h2>
          {selected ? <div className="info"><b>{labelFor(selected.kind)}</b><span>X {Math.round(selected.x)} / Y {Math.round(selected.y)}</span><span>{Math.round(selected.width)} x {Math.round(selected.height)}</span></div> : <p className="muted">Select an item on the plan.</p>}
        </section>
      </aside>
    </div>
  );
}

function Comparison({ before, after, layout }: { before: PlanState; after: PlanState; layout: CompareLayout }) {
  if (layout === 'overlay') return <div className="compare overlay"><MiniPlan plan={before} faded /><MiniPlan plan={after} /></div>;
  return <div className={'compare ' + layout}><MiniPlan title="Before" plan={before} /><MiniPlan title="After" plan={after} /></div>;
}

function MiniPlan({ plan, title, faded }: { plan: PlanState; title?: string; faded?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { void import('./lib/drawing').then((m) => { if (ref.current) void m.drawPlanToCanvas(ref.current, plan, undefined, faded); }); }, [plan, faded]);
  return <div className="miniPlan">{title && <h3>{title}</h3>}<canvas ref={ref} width={900} height={620} /></div>;
}

function iconFor(tool: Tool) {
  if (tool === 'select') return <MousePointer2 size={17} />;
  if (tool === 'pan') return <Move size={17} />;
  if (tool === 'eraser') return <Eraser size={17} />;
  if (tool === 'text') return <Type size={17} />;
  if (tool === 'dimension') return <History size={17} />;
  return <BringToFront size={17} />;
}
