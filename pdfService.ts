
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { RangeStats, UserProfile } from '../types';

class PdfService {
  
  public async generateReport(stats: RangeStats, user: UserProfile) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;
    let finalY = 0;

    // --- HEADER ---
    doc.setFontSize(22);
    doc.setTextColor(22, 163, 74); // Brand Green
    doc.text("RafaFit Coach", margin, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Informe de Progreso: ${stats.from} al ${stats.to}`, margin, 28);
    
    doc.setFontSize(10);
    doc.text(`Usuario: ${user.name} | Edad: ${user.age} | Peso Actual: ${user.weight}kg`, margin, 34);

    doc.line(margin, 38, pageWidth - margin, 38);

    // --- SUMMARY CARDS (DRAWN) ---
    let yPos = 50;
    const cardWidth = (pageWidth - (margin * 2) - 10) / 3;
    const cardHeight = 25;

    // Card 1: Peso
    this.drawCard(doc, margin, yPos, cardWidth, cardHeight, "Cambio Peso", `${stats.weight.change > 0 ? '+' : ''}${stats.weight.change} kg`, `${stats.weight.start} -> ${stats.weight.end}`);
    
    // Card 2: Adherencia
    this.drawCard(doc, margin + cardWidth + 5, yPos, cardWidth, cardHeight, "Adherencia Kcal", `${stats.nutrition.adherenceRate}%`, `Media: ${stats.nutrition.avgCalories} kcal`);

    // Card 3: Entrenos
    this.drawCard(doc, margin + (cardWidth + 5) * 2, yPos, cardWidth, cardHeight, "Entrenamientos", `${stats.training.completedSessions}`, `${Math.round(stats.training.totalMinutes / 60)} horas totales`);

    yPos += cardHeight + 15;

    // --- WEIGHT CHART (SIMPLE LINE) ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Evolución de Peso", margin, yPos);
    yPos += 5;
    
    if (stats.weight.history.length > 1) {
        this.drawSimpleLineChart(doc, margin, yPos, pageWidth - (margin * 2), 40, stats.weight.history);
        yPos += 45;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Faltan datos suficientes para la gráfica de peso.", margin, yPos + 10);
        yPos += 20;
    }

    // --- TABLE 1: WEIGHT HISTORY ---
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Registro de Peso", margin, yPos);
    
    autoTable(doc, {
        startY: yPos + 5,
        head: [['Fecha', 'Peso (kg)', 'Variación']],
        body: stats.weight.history.map((w, i, arr) => {
            const prev = i > 0 ? arr[i-1].weight : w.weight;
            const diff = (w.weight - prev).toFixed(1);
            const diffStr = i === 0 ? '-' : (Number(diff) > 0 ? `+${diff}` : diff);
            return [w.date, w.weight.toString(), diffStr];
        }),
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
        styles: { fontSize: 9 }
    });
    
    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 15;

    // --- TABLE 2: TRAINING SUMMARY ---
    // Check if page break needed
    if (finalY > 250) { doc.addPage(); finalY = 20; }

    doc.setFontSize(12);
    doc.text("Resumen de Entrenamientos (Días completados)", margin, finalY);

    const trainingRows = stats.dailyData
        .filter(d => d.completedWorkouts > 0)
        .map(d => [d.date, d.trainingMinutes + ' min', 'Completado']);

    if (trainingRows.length > 0) {
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Fecha', 'Duración', 'Estado']],
            body: trainingRows,
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] }, // Brand color
            styles: { fontSize: 9 }
        });
        // @ts-ignore
        finalY = doc.lastAutoTable.finalY + 15;
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Sin entrenamientos completados en este periodo.", margin, finalY + 10);
        finalY += 20;
    }

    // --- TABLE 3: NUTRITION SUMMARY ---
    if (finalY > 250) { doc.addPage(); finalY = 20; }

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Detalle Nutricional", margin, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Fecha', 'Kcal', 'Proteína (g)', 'Objetivo Kcal', 'Adherencia']],
        body: stats.dailyData.map(d => {
            if (d.calories === 0) return [d.date, '-', '-', '-', '-'];
            // Simple adherence check
            const target = user.macroSettings.targets.calories;
            const diff = Math.abs(d.calories - target);
            const status = diff < (target * 0.1) ? 'OK' : (d.calories > target ? 'Alto' : 'Bajo');
            
            return [
                d.date, 
                Math.round(d.calories), 
                Math.round(d.protein), 
                target,
                status
            ];
        }),
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
        styles: { fontSize: 8 }
    });

    // Save
    doc.save(`RafaFit_Report_${stats.from}_${stats.to}.pdf`);
  }

  private drawCard(doc: jsPDF, x: number, y: number, w: number, h: number, title: string, main: string, sub: string) {
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, y, w, h, 2, 2, 'FD');
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(title.toUpperCase(), x + 3, y + 6);
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(main, x + 3, y + 14);
      
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(sub, x + 3, y + 21);
  }

  private drawSimpleLineChart(doc: jsPDF, x: number, y: number, w: number, h: number, data: { date: string, weight: number }[]) {
      // Draw Box
      doc.setDrawColor(200);
      doc.rect(x, y, w, h);

      if (data.length < 2) return;

      const weights = data.map(d => d.weight);
      const minW = Math.min(...weights) - 1;
      const maxW = Math.max(...weights) + 1;
      const range = maxW - minW || 1;

      // Draw Guide Lines (Avg)
      const avg = weights.reduce((a,b) => a+b, 0) / weights.length;
      const avgY = y + h - ((avg - minW) / range) * h;
      doc.setDrawColor(200, 200, 200);
      doc.setLineDash([2, 2], 0);
      doc.line(x, avgY, x + w, avgY);
      doc.setLineDash([], 0); // reset

      // Plot Line
      doc.setDrawColor(22, 163, 74); // Green
      doc.setLineWidth(0.5);

      let prevX = 0, prevY = 0;
      data.forEach((d, i) => {
          const px = x + (i / (data.length - 1)) * w;
          const py = y + h - ((d.weight - minW) / range) * h;

          if (i > 0) {
              doc.line(prevX, prevY, px, py);
          }
          // Dot
          doc.setFillColor(22, 163, 74);
          doc.circle(px, py, 1, 'F');

          prevX = px;
          prevY = py;
      });

      // Labels Min/Max
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text(`${maxW.toFixed(1)}kg`, x + 1, y + 4);
      doc.text(`${minW.toFixed(1)}kg`, x + 1, y + h - 1);
  }
}

export const pdfService = new PdfService();
