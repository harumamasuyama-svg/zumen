import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlanShape, PlanState, Point, Tool } from '../types';
import { canvasSize, drawPlanToCanvas } from '../lib/drawing';

interface Props {
  plan: PlanState;
  tool: Tool;
  selectedId?: string;
  onChange: (plan: PlanState) => void;
  onSelect: (id?: string) => void;
}

const sizes: Record<string, { width: number; height: number }> = {
  wall: { width: 150, height: 16 },
  partition: { width: 110, height: 12 },
  door: { width: 84, height: 18 },
  slidingDoor: { width: 110, height: 22 },
  toilet: { width: 50, height: 68 },
  urinal: { width: 42, height: 64 },
  sink: { width: 86, height: 54 },
  kitchen: { width: 130, height: 58 },
  desk: { width: 110, height: 74 },
  chair: { width: 44, height: 44 },
  dimension: { width: 160, height: 34 },
  text: { width: 90, height: 32 }
};

function hitTest(shapes: PlanShape[], point: Point) {
  return [...shapes].reverse().find((s) => point.x >= s.x && point.x <= s.x + s.width && point.y >= s.y && point.y <= s.y + s.height);
}

export function DrawingCanvas({ plan, tool, selectedId, onChange, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ start: Point; shape?: PlanShape; pan?: Point }>();
  const selected = useMemo(() => plan.shapes.find((s) => s.id === selectedId), [plan.shapes, selectedId]);

  useEffect(() => { if (canvasRef.current) void drawPlanToCanvas(canvasRef.current, plan, selectedId); }, [plan, selectedId]);

  const toCanvasPoint = (event: React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
  };

  const addShape = (point: Point) => {
    if (!sizes[tool]) return;
    const size = sizes[tool];
    const text = tool === 'text' ? window.prompt('Text', 'After') || 'After' : undefined;
    const shape: PlanShape = { id: crypto.randomUUID(), kind: tool, x: point.x - size.width / 2, y: point.y - size.height / 2, ...size, text };
    onChange({ ...plan, shapes: [...plan.shapes, shape] });
    onSelect(shape.id);
  };

  const pointerDown = (event: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture(event.pointerId);
    const point = toCanvasPoint(event);
    if (tool === 'pan') { setDrag({ start: { x: event.clientX, y: event.clientY }, pan }); return; }
    const hit = hitTest(plan.shapes, point);
    if (tool === 'eraser' || tool === 'deleteArea') {
      if (hit) onChange({ ...plan, shapes: plan.shapes.filter((s) => s.id !== hit.id) });
      return;
    }
    if (tool === 'select') {
      onSelect(hit?.id);
      setDrag(hit ? { start: point, shape: hit } : undefined);
      return;
    }
    addShape(point);
  };

  const pointerMove = (event: React.PointerEvent) => {
    if (!drag) return;
    if (drag.pan) {
      setPan({ x: drag.pan.x + event.clientX - drag.start.x, y: drag.pan.y + event.clientY - drag.start.y });
      return;
    }
    if (drag.shape) {
      const point = toCanvasPoint(event);
      const dx = point.x - drag.start.x;
      const dy = point.y - drag.start.y;
      onChange({ ...plan, shapes: plan.shapes.map((s) => s.id === drag.shape!.id ? { ...s, x: drag.shape!.x + dx, y: drag.shape!.y + dy } : s) });
    }
  };

  return (
    <div className="canvasShell">
      <div className="canvasBar">
        <button onClick={() => setZoom((z) => Math.max(0.45, z - 0.1))}>-</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2.4, z + 0.1))}>+</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Fit</button>
        {selected && <span className="selectionLabel">Selected: {labelFor(selected.kind)}</span>}
      </div>
      <div className="canvasViewport">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ transform: 'translate(' + pan.x + 'px, ' + pan.y + 'px) scale(' + zoom + ')' }}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={() => setDrag(undefined)}
        />
      </div>
    </div>
  );
}

export function labelFor(kind: string) {
  const labels: Record<string, string> = {
    select: 'Select',
    pan: 'Pan',
    wall: 'Wall',
    partition: 'Partition',
    door: 'Door',
    slidingDoor: 'Sliding door',
    toilet: 'Toilet',
    urinal: 'Urinal',
    sink: 'Wash basin',
    kitchen: 'Sink',
    desk: 'Desk',
    chair: 'Chair',
    dimension: 'Dimension',
    text: 'Text',
    eraser: 'Eraser',
    deleteArea: 'Delete'
  };
  return labels[kind] ?? kind;
}
