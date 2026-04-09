import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportExternalReportPDF = (data: {
  orgao: string;
  data: string;
  pedido: string;
  solucao: string;
  materiais: string;
  tecnico: string;
}) => {
  const doc = new jsPDF();

  // Cabeçalho Institucional Atualizado
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // #1E3A8A
  doc.text('RELATÓRIO DE ATENDIMENTO TÉCNICO EXTERNO - TechDept/AdminDept', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('PREFEITURA MUNICIPAL DE ANANINDEUA', 105, 27, { align: 'center' });
  doc.text('SECRETARIA MUNICIPAL DE ADMINISTRAÇÃO - AdminDept', 105, 32, { align: 'center' });

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 38, 190, 38);

  // Dados do Atendimento
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.text(`ÓRGÃO ATENDIDO: ${data.orgao.toUpperCase()}`, 20, 48);

  const tableData = [
    ['DATA DO ATENDIMENTO', format(new Date(data.data), 'dd/MM/yyyy')],
    ['TÉCNICO RESPONSÁVEL', data.tecnico.toUpperCase()],
    ['DESCRIÇÃO DO PEDIDO', data.pedido],
    ['ATIVIDADES REALIZADAS', data.solucao],
    ['MATERIAIS/EQUIPAMENTOS UTILIZADOS', data.materiais || 'Nenhum material extra utilizado']
  ];

  autoTable(doc, {
    startY: 55,
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5, overflow: 'linebreak' },
    columnStyles: { 
      0: { fontStyle: 'bold', width: 60, fillColor: [248, 250, 252] },
      1: { width: 110 }
    },
    margin: { left: 20, right: 20 }
  });

  // Assinaturas
  const finalY = (doc as any).lastAutoTable.finalY + 40;
  doc.setDrawColor(0);
  doc.line(30, finalY, 90, finalY);
  doc.line(120, finalY, 180, finalY);
  
  doc.setFontSize(9);
  doc.text('ASSINATURA TechDept', 60, finalY + 5, { align: 'center' });
  doc.text('ASSINATURA SOLICITANTE', 150, finalY + 5, { align: 'center' });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Documento gerado pelo Sistema TechDept em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 285, { align: 'center' });

  doc.save(`relatorio-atendimento-externo-${data.orgao.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};