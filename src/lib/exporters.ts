import { Document, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { jsPDF } from 'jspdf';
import type { ProjectState } from '../types';
import { planToDataUrl } from './drawing';

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function exportComparisonPdf(project: ProjectState, orientation: 'p' | 'l') {
  const before = await planToDataUrl(project.before);
  const after = await planToDataUrl(project.after);
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(project.name || 'ZUMEN proposal', 14, 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Date: ' + new Date().toLocaleDateString('ja-JP'), 14, 23);
  const imgW = orientation === 'l' ? (pageW - 42) / 2 : pageW - 28;
  const imgH = imgW * 0.68;
  if (orientation === 'l') {
    pdf.text('Before plan', 14, 34);
    pdf.addImage(before, 'PNG', 14, 38, imgW, imgH);
    pdf.text('After plan', 28 + imgW, 34);
    pdf.addImage(after, 'PNG', 28 + imgW, 38, imgW, imgH);
    pdf.text('Comments', 14, 48 + imgH);
    pdf.rect(14, 52 + imgH, pageW - 28, 32);
    pdf.text(project.comments || '', 17, 60 + imgH, { maxWidth: pageW - 34 });
  } else {
    pdf.text('Before plan', 14, 34);
    pdf.addImage(before, 'PNG', 14, 38, imgW, imgH);
    pdf.text('After plan', 14, 48 + imgH);
    pdf.addImage(after, 'PNG', 14, 52 + imgH, imgW, imgH);
    pdf.text('Comments', 14, 66 + imgH * 2);
    pdf.rect(14, 70 + imgH * 2, pageW - 28, 38);
    pdf.text(project.comments || '', 17, 78 + imgH * 2, { maxWidth: pageW - 34 });
  }
  pdf.save('ZUMEN-comparison.pdf');
}

export async function exportComparisonDocx(project: ProjectState, orientation: 'portrait' | 'landscape') {
  const before = await planToDataUrl(project.before);
  const after = await planToDataUrl(project.after);
  const imageWidth = orientation === 'landscape' ? 340 : 480;
  const imageHeight = Math.round(imageWidth * 0.68);
  const doc = new Document({
    sections: [{
      properties: { page: { size: { orientation: orientation as any } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: project.name || 'ZUMEN proposal', bold: true, size: 32 })] }),
        new Paragraph({ text: 'Date: ' + new Date().toLocaleDateString('ja-JP') }),
        new Paragraph({ text: ' ' }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ text: 'Before plan' }), new Paragraph({ children: [new ImageRun({ type: 'png', data: dataUrlToBytes(before), transformation: { width: imageWidth, height: imageHeight } })] })] }),
          new TableCell({ children: [new Paragraph({ text: 'After plan' }), new Paragraph({ children: [new ImageRun({ type: 'png', data: dataUrlToBytes(after), transformation: { width: imageWidth, height: imageHeight } })] })] })
        ] })] }),
        new Paragraph({ text: ' ' }),
        new Paragraph({ children: [new TextRun({ text: '3D perspective', bold: true })] }),
        new Paragraph({ text: 'Use the Plan + 3D screen to confirm the 3D perspective.' }),
        new Paragraph({ text: ' ' }),
        new Paragraph({ children: [new TextRun({ text: 'Comments', bold: true })] }),
        new Paragraph({ text: project.comments || ' ' })
      ]
    }]
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'ZUMEN-comparison.docx');
}

export async function exportPlanPng(project: ProjectState) {
  const dataUrl = await planToDataUrl(project.after);
  const blob = await (await fetch(dataUrl)).blob();
  downloadBlob(blob, 'ZUMEN-after-plan.png');
}
