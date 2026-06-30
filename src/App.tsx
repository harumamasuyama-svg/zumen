import { useEffect, useMemo, useRef, useState } from 'react';
import { BringToFront, Download, Eraser, FileDown, FileImage, FolderOpen, Grid2X2, History, MousePointer2, Move, PanelLeft, RotateCcw, RotateCw, Save, Type, Upload } from 'lucide-react';
import { DrawingCanvas, labelFor } from './components/DrawingCanvas';
import { ThreePreview } from './components/ThreePreview';
import { createDemoShapes, createProject } from './lib/defaults';
import { clonePlan, fileToPlanImage } from './lib/pdf';
import { exportComparisonDocx, exportComparisonPdf, exportPlanPng } from './lib/exporters';
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
    a.href = url; a.download = 'ZUMEN-project.json'; a.click(); URL.revokeObjectURL(url);
  };

  const loadJson = async (file: File) => {
    const text = await file.text();
    const loaded = JSON.parse(text) as ProjectState;
    commit(loaded);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><img src="./zumen-logo.png" alt="ZUMEN" /><span>改修提案 図面エディタ</span></div>
        <div className="menuGroup">
          <label className="command"><Upload size={16} />図面読込<input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => e.target.files?.[0] && void loadDrawing(e.target.files[0])} /></label>
          <button onClick={saveJson}><Save size={16} />保存</button>
          <button onClick={() => importProjectRef.current?.click()}><FolderOpen size={16} />読込</button>
          <input ref={importProjectRef} hidden type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && void loadJson(e.target.files[0])} />
          <button onClick={undo} disabled={!history.length}><RotateCcw size={16} />Undo</button>
          <button onClick={redo} disabled={!future.length}><RotateCw size={16} />Redo</button>
        </div>
        <div className="menuGroup right">
          <button onClick={() => exportPlanPng(project)}><FileImage size={16} />PNG</button>
          <button onClick={() => exportComparisonPdf(project, compareLayout === 'side' ? 'l' : 'p')}><FileDown size={16} />PDF</button>
          <button onClick={() => exportComparisonDocx(project, compareLayout === 'side' ? 'landscape' : 'portrait')}><Download size={16} />Word</button>
        </div>
      </header>

      <aside className="toolbar">
        <button className="wide" onClick={seedDemo}><Grid2X2 size={17} />サンプル</button>
        {tools.map((item) => <button key={item} className={tool === item ? 'active' : ''} onClick={() => setTool(item)} title={labelFor(item)}>{iconFor(item)}<span>{labelFor(item)}</span></button>)}
      </aside>

      <main className="workspace">
        <div className="workspaceTabs">
          <button className={view === 'edit' ? 'active' : ''} onClick={() => setView('edit')}>編集</button>
          <button className={view === 'compare' ? 'active' : ''} onClick={() => setView('compare')}>改修前後比較</button>
          <button className={view === 'split3d' ? 'active' : ''} onClick={() => setView('split3d')}>平面図 + 3D</button>
        </div>
        {view === 'edit' && <DrawingCanvas plan={activePlan} tool={tool} selectedId={selectedId} onChange={updateActivePlan} onSelect={setSelectedId} />}
        {view === 'compare' && <Comparison before={project.before} after={project.after} layout={compareLayout} />}
        {view === 'split3d' && <div className="splitPane"><DrawingCanvas plan={project.after} tool={tool} selectedId={selectedId} onChange={(plan) => commit({ ...project, after: plan, activeRevision: 'after' })} onSelect={setSelectedId} /><ThreePreview plan={project.after} selectedId={selectedId} mode={threeMode} /></div>}
      </main>

      <aside className="properties">
        <section>
          <h2>状態</h2>
          <div className="segmented"><button className={project.activeRevision === 'before' ? 'active' : ''} onClick={() => setProject({ ...project, activeRevision: 'before' })}>改修前</button><button className={project.activeRevision === 'after' ? 'active' : ''} onClick={() => setProject({ ...project, activeRevision: 'after' })}>改修後</button></div>
          <button className="primary" onClick={saveBefore}>現在を改修前として保存</button>
          <button className="primary ghost" onClick={saveAfter}>現在を改修後として保存</button>
        </section>
        <section>
          <h2>表示</h2>
          <label>比較方法</label>
          <select value={compareLayout} onChange={(e) => setCompareLayout(e.target.value as CompareLayout)}><option value="side">左右比較</option><option value="stack">上下比較</option><option value="overlay">重ね合わせ</option></select>
          <label>3D表示</label>
          <select value={threeMode} onChange={(e) => setThreeMode(e.target.value as ThreeMode)}><option value="bird">鳥瞰図</option><option value="iso">アイソメ図</option><option value="walk">ウォークスルー</option></select>
        </section>
        <section>
          <h2>物件情報</h2>
          <label>タイトル</label>
          <input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
          <label>コメント</label>
          <textarea value={project.comments} onChange={(e) => setProject({ ...project, comments: e.target.value })} />
        </section>
        <section>
          <h2>選択部品</h2>
          {selected ? <div className="info"><b>{labelFor(selected.kind)}</b><span>X {Math.round(selected.x)} / Y {Math.round(selected.y)}</span><span>{Math.round(selected.width)} x {Math.round(selected.height)}</span></div> : <p className="muted">部品を選択してください。</p>}
        </section>
      </aside>
    </div>
  );
}

function Comparison({ before, after, layout }: { before: PlanState; after: PlanState; layout: CompareLayout }) {
  if (layout === 'overlay') return <div className="compare overlay"><MiniPlan plan={before} faded /><MiniPlan plan={after} /></div>;
  return <div className={'compare ' + layout}><MiniPlan title="改修前" plan={before} /><MiniPlan title="改修後" plan={after} /></div>;
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
