import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const exportLoanTermPDF = (equipment: any, loanData: { nome: string, matricula: string, secretaria: string, data_devolucao: string, observacoes?: string }) => {
  const doc = new jsPDF();
  const now = new Date();
  const termId = `${equipment.tag || '000'}-${format(now, 'yyyyMMdd')}`;

  // Cabeçalho Institucional
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text('PREFEITURA MUNICIPAL DE ANANINDEUA', 105, 20, { align: 'center' });
  doc.text('SECRETARIA MUNICIPAL DE ADMINISTRAÇÃO – AdminDept', 105, 25, { align: 'center' });
  doc.text('DEPARTAMENTO DE TECNOLOGIA DA INFORMAÇÃO – TechDept', 105, 30, { align: 'center' });

  // Título do Termo
  doc.setFontSize(12);
  doc.text(`TERMO DE RESPONSABILIDADE E CAUTELA DE EQUIPAMENTO Nº ${termId}`, 105, 45, { align: 'center' });

  // Texto de Compromisso
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  const dataDevolucaoFormatada = format(new Date(loanData.data_devolucao), "dd/MM/yyyy");
  
  const textoCompromisso = `Eu, ${loanData.nome.toUpperCase()}, matrícula ${loanData.matricula}, vinculado(a) à secretaria ${loanData.secretaria.toUpperCase()}, declaro para os devidos fins que recebo o equipamento ${equipment.tipo} ${equipment.modelo} (TAG: ${equipment.tag}) em perfeitas condições de conservação e funcionamento, e me comprometo a utilizá-lo exclusivamente para fins profissionais e devolvê-lo ao TechDept impreterivelmente até a data ${dataDevolucaoFormatada}.`;

  const splitTexto = doc.splitTextToSize(textoCompromisso, 170);
  doc.text(splitTexto, 20, 65);

  // Seção de Observações do Equipamento (NOVO)
  if (loanData.observacoes) {
    doc.setFont("helvetica", "bold");
    doc.text('OBSERVAÇÕES DO ESTADO DO EQUIPAMENTO:', 20, 95);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitObs = doc.splitTextToSize(loanData.observacoes, 170);
    doc.text(splitObs, 20, 102);
  }

  // Seção de Responsabilidades Detalhadas
  const respStartY = loanData.observacoes ? 120 : 100;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text('DAS RESPONSABILIDADES:', 20, respStartY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const responsabilidades = [
    "I. Zelar pela guarda e integridade do bem, evitando danos por negligência ou mau uso;",
    "II. Não ceder ou emprestar o equipamento a terceiros sem autorização prévia do TechDept;",
    "III. Comunicar imediatamente qualquer falha técnica ou sinistro (roubo/furto) mediante BO;",
    "IV. Responsabilizar-se civil e administrativamente por eventuais danos causados ao patrimônio público."
  ];
  
  let respY = respStartY + 7;
  responsabilidades.forEach(line => {
    doc.text(line, 20, respY);
    respY += 7;
  });

  // Dados do Equipamento para Conferência
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text('DADOS DO BEM:', 20, respY + 15);
  doc.setFont("helvetica", "normal");
  doc.text(`Tipo: ${equipment.tipo}`, 20, respY + 22);
  doc.text(`Modelo: ${equipment.modelo}`, 20, respY + 29);
  doc.text(`Patrimônio/TAG: ${equipment.tag || '---'}`, 20, respY + 36);

  // Data e Assinaturas
  const footerY = 230;
  doc.setFont("helvetica", "bold");
  doc.text(`Metropolitan, ${format(now, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 105, footerY, { align: 'center' });

  doc.setDrawColor(0);
  doc.line(25, footerY + 30, 90, footerY + 30);
  doc.line(120, footerY + 30, 185, footerY + 30);
  
  doc.setFontSize(9);
  doc.text('Assinatura do Receptor', 57.5, footerY + 35, { align: 'center' });
  doc.text('Responsável TI (AdminDept/TechDept)', 152.5, footerY + 35, { align: 'center' });

  // Rodapé de Sistema
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Documento gerado eletronicamente pelo Sistema TechDept em ${format(now, 'dd/MM/yyyy HH:mm')}`, 105, 285, { align: 'center' });

  doc.save(`termo-cautela-${equipment.tag}-${loanData.matricula}.pdf`);
};