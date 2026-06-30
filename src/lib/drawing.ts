import type { PlanShape, PlanState } from '../types';

export const canvasSize = { width: 900, height: 620 };

export function drawShape(ctx: CanvasRenderingContext2D, shape: PlanShape, selected = false, faded = false) {
  ctx.save();
  ctx.globalAlpha = faded ? 0.38 : 1;
  ctx.translate(shape.x + shape.width / 2, shape.y + shape.height / 2);
  ctx.rotate(((shape.rotation ?? 0) * Math.PI) / 180);
  ctx.translate(-shape.width / 2, -shape.height / 2);
  const stroke = selected ? '#0f6bdc' : shape.color ?? '#111827';
  const fill = selected ? '#dbeafe' : '#ffffff';
  ctx.lineWidth = selected ? 3 : 2;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;

  switch (shape.kind) {
    case 'wall':
      ctx.fillStyle = '#20242b';
      ctx.fillRect(0, 0, shape.width, shape.height);
      break;
    case 'partition':
      ctx.fillStyle = '#667085';
      ctx.fillRect(0, 0, shape.width, shape.height);
      break;
    case 'door':
      ctx.strokeRect(0, 0, shape.width, shape.height);
      ctx.beginPath();
      ctx.moveTo(0, shape.height);
      ctx.arc(0, shape.height, Math.max(shape.width, 50), -Math.PI / 2, 0);
      ctx.stroke();
      break;
    case 'slidingDoor':
      ctx.strokeRect(0, shape.height * 0.3, shape.width, shape.height * 0.4);
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(shape.width - 10, 0);
      ctx.moveTo(10, shape.height);
      ctx.lineTo(shape.width - 10, shape.height);
      ctx.stroke();
      break;
    case 'toilet':
      ctx.beginPath();
      ctx.ellipse(shape.width / 2, shape.height * 0.58, shape.width * 0.28, shape.height * 0.34, 0, 0, Math.PI * 2);
      ctx.rect(shape.width * 0.18, 4, shape.width * 0.64, shape.height * 0.28);
      ctx.fill();
      ctx.stroke();
      break;
    case 'urinal':
      ctx.beginPath();
      ctx.roundRect(shape.width * 0.2, 4, shape.width * 0.6, shape.height - 8, 14);
      ctx.fill();
      ctx.stroke();
      break;
    case 'sink':
      ctx.beginPath();
      ctx.roundRect(0, 0, shape.width, shape.height, 8);
      ctx.moveTo(shape.width * 0.5, shape.height * 0.22);
      ctx.ellipse(shape.width * 0.5, shape.height * 0.54, shape.width * 0.28, shape.height * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'kitchen':
      ctx.strokeRect(0, 0, shape.width, shape.height);
      ctx.beginPath();
      ctx.arc(shape.width * 0.28, shape.height / 2, 14, 0, Math.PI * 2);
      ctx.rect(shape.width * 0.55, 8, shape.width * 0.34, shape.height - 16);
      ctx.stroke();
      break;
    case 'desk':
      ctx.fillStyle = selected ? '#dbeafe' : '#f8fafc';
      ctx.fillRect(0, 0, shape.width, shape.height);
      ctx.strokeRect(0, 0, shape.width, shape.height);
      break;
    case 'chair':
      ctx.beginPath();
      ctx.roundRect(5, 5, shape.width - 10, shape.height - 10, 7);
      ctx.fill();
      ctx.stroke();
      break;
    case 'dimension':
      ctx.beginPath();
      ctx.moveTo(0, shape.height / 2);
      ctx.lineTo(shape.width, shape.height / 2);
      ctx.moveTo(0, 4);
      ctx.lineTo(0, shape.height - 4);
      ctx.moveTo(shape.width, 4);
      ctx.lineTo(shape.width, shape.height - 4);
      ctx.stroke();
      ctx.font = '13px sans-serif';
      ctx.fillStyle = stroke;
      ctx.fillText(shape.text || Math.round(shape.width * 10) + 'mm', shape.width / 2 - 28, shape.height / 2 - 6);
      break;
    case 'text':
      ctx.font = '18px sans-serif';
      ctx.fillStyle = stroke;
      ctx.fillText(shape.text || '文字', 0, 22);
      break;
    default:
      ctx.strokeRect(0, 0, shape.width, shape.height);
  }
  if (selected) {
    ctx.strokeStyle = '#0f6bdc';
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-5, -5, shape.width + 10, shape.height + 10);
  }
  ctx.restore();
}

export async function drawPlanToCanvas(canvas: HTMLCanvasElement, plan: PlanState, selectedId?: string, faded = false) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e5e7eb';
  for (let x = 0; x < canvas.width; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y < canvas.height; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  if (plan.image) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.92;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.globalAlpha = faded ? 0.2 : 0.58;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        ctx.globalAlpha = 1;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = plan.image!;
    });
  }
  plan.shapes.forEach((shape) => drawShape(ctx, shape, selectedId === shape.id, faded));
}

export async function planToDataUrl(plan: PlanState, selectedId?: string) {
  const canvas = document.createElement('canvas');
  await drawPlanToCanvas(canvas, plan, selectedId);
  return canvas.toDataURL('image/png', 1);
}
