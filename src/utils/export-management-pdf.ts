import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const exportManagementPDF = (tickets: any[], patrimonios: any[], periodLabel: string) => {
  const doc = new jsPDF();
  const now = new Date();

  // Cabeçalho Institucional
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // #1E3A8A
  doc.text('RELATÓRIO DE GESTÃO - TechDept', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Prefeitura de Metropolitan - AdminDept', 14, 28);
  doc.text(`Período de Referência: ${periodLabel.toUpperCase()}`, 14, 33);
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 38);

  // 1. Agrupamento por Setor
  const sectorCounts: Record<string, number> = {};
  tickets.forEach(t => {
    sectorCounts[t.setor] = (sectorCounts[t.setor] || 0) + 1;
  });
  const sectorData = Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => [name, count]);

  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('1. Chamados por Setor', 14, 50);
  
  autoTable(doc, {
    startY: 55,
    head: [['Setor', 'Total de Chamados']],
    body: sectorData,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // 2. Equipamentos em Cautela (Emprestados)
  const emprestados = patrimonios.filter(p => p.status === 'Emprestado');
  const emprestadosData = emprestados.map(p => [
    p.tag,
    `${p.tipo} - ${p.modelo}`,
    p.local_atual || '---',
    p.responsavel_nome || '---'
  ]);

  const nextY = (doc as any).lastAutoTable.finalY + 15;
  doc.text('2. Equipamentos em Cautela (Emprestados)', 14, nextY);
  
  if (emprestadosData.length > 0) {
    autoTable(doc, {
      startY: nextY + 5,
      head: [['TAG', 'Equipamento', 'Local Atual', 'Responsável']],
      body: emprestadosData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], fontStyle: 'bold' }, // Amber
      alternateRowStyles: { fillColor: [255, 251, 235] },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Nenhum equipamento em regime de cautela no momento.', 14, nextY + 10);
    (doc as any).lastAutoTable = { finalY: nextY + 15 };
  }

  // 3. Inventário de Patrimônio (Total por Tipo)
  const patrimonioCounts: Record<string, number> = {};
  patrimonios.forEach(p => {
    patrimonioCounts[p.tipo] = (patrimonioCounts[p.tipo] || 0) + 1;
  });
  const patrimonioData = Object.entries(patrimonioCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => [name, count]);

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('3. Inventário de Patrimônio (Total Geral)', 14, finalY);
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [['Tipo de Equipamento', 'Total em Inventário']],
    body: patrimonioData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 },
  });

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `TechDept AdminDept - Relatório Gerencial Automático | Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`relatorio-gestao-dti-${format(now, 'yyyy-MM-dd')}.pdf`);
};