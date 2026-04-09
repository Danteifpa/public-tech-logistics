import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportPatrimonioPDF = (data: any[]) => {
  const doc = new jsPDF();
  
  // Cabeçalho Institucional
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138); // #1E3A8A
  doc.text('TechDept - RELATÓRIO DE PATRIMÔNIO (ALUGADOS)', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Prefeitura de Metropolitan - AdminDept', 14, 30);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 35);

  // Agrupando por Fornecedor
  const suppliers = [...new Set(data.map(item => item.fornecedor || 'Próprio/Não Informado'))];
  let currentY = 45;

  suppliers.forEach(supplier => {
    const supplierItems = data.filter(item => (item.fornecedor || 'Próprio/Não Informado') === supplier);
    
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text(`FORNECEDOR: ${supplier.toUpperCase()}`, 14, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['TAG/Nº', 'TIPO', 'MODELO', 'SETOR', 'STATUS', 'VENC. CONTRATO']],
      body: supplierItems.map(item => [
        item.tag,
        item.tipo,
        item.modelo,
        item.setor,
        item.status,
        item.vencimento_contrato ? new Date(item.vencimento_contrato).toLocaleDateString('pt-BR') : '---'
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { bottom: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Adiciona nova página se necessário
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  });

  doc.save(`relatorio-patrimonio-fornecedores-${Date.now()}.pdf`);
};