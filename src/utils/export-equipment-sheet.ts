import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportEquipmentSheetPDF = (equipment: any, history: any[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Cabeçalho Institucional
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // #1E3A8A
  doc.text('TechDept - FICHA DE IDENTIFICAÇÃO DE BEM', 105, 25, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('PREFEITURA MUNICIPAL DE ANANINDEUA', 105, 32, { align: 'center' });
  doc.text('SECRETARIA MUNICIPAL DE ADMINISTRAÇÃO - AdminDept', 105, 37, { align: 'center' });

  // DESTAQUE DE PROPRIEDADE (FORNECEDOR)
  if (equipment.fornecedor) {
    doc.setFillColor(241, 245, 249);
    doc.rect(20, 42, 170, 12, 'F');
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28); // Vermelho escuro
    doc.text(`PROPRIEDADE DE: ${equipment.fornecedor.toUpperCase()}`, 105, 50, { align: 'center' });
  }

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 58, 190, 58);

  // Seção 1: Dados Técnicos
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text('1. INFORMAÇÕES DO EQUIPAMENTO', 20, 68);

  const techData = [
    ['TAG / PATRIMÔNIO', equipment.tag || 'N/A'],
    ['TIPO DE EQUIPAMENTO', equipment.tipo],
    ['MARCA / MODELO', equipment.modelo],
    ['SETOR DE ALOCAÇÃO', equipment.setor],
    ['STATUS ATUAL', equipment.status],
    ['VENCIMENTO CONTRATO', equipment.vencimento_contrato ? format(new Date(equipment.vencimento_contrato), 'dd/MM/yyyy') : '---'],
    ['ESPECIFICAÇÕES', equipment.especificacoes || 'Configuração padrão de fábrica']
  ];

  autoTable(doc, {
    startY: 73,
    body: techData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', width: 50 } },
    margin: { left: 20, right: 20 }
  });

  // Seção 2: Histórico de Manutenção
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('2. ÚLTIMAS INTERVENÇÕES TÉCNICAS', 20, finalY);

  if (history.length > 0) {
    const historyData = history.slice(0, 3).map(h => [
      format(new Date(h.created_at), 'dd/MM/yy'),
      h.assunto,
      h.atendente || '---',
      h.status
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['DATA', 'ASSUNTO', 'TÉCNICO', 'STATUS']],
      body: historyData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('Nenhum chamado registrado para este patrimônio.', 20, finalY + 10);
  }

  // Assinaturas
  const signY = 250;
  doc.setDrawColor(0);
  doc.line(25, signY, 90, signY);
  doc.line(120, signY, 185, signY);
  
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);
  doc.text('ASSINATURA DO TÉCNICO (TechDept)', 57.5, signY + 5, { align: 'center' });
  doc.text('ASSINATURA DO RESPONSÁVEL', 152.5, signY + 5, { align: 'center' });

  doc.save(`ficha-patrimonio-${equipment.tag}.pdf`);
};