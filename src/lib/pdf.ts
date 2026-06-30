import type { PlanState } from '../types';

export async function fileToPlanImage(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    return canvas.toDataURL('image/png', 1);
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function clonePlan(plan: PlanState): PlanState {
  return JSON.parse(JSON.stringify(plan));
}
