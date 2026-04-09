import { Patrimonio } from '../types/patrimonio';

// Simulação de chamada ao Gemini/IA
// Em produção, isso chamaria uma Edge Function ou API segura
export const getAISuggestion = async (patrimonio: Patrimonio, assunto: string): Promise<string> => {
  // Simulando delay de processamento da IA
  await new Promise(resolve => setTimeout(resolve, 1500));

  const specs = patrimonio.especificacoes || "Configuração padrão";
  
  if (assunto.toLowerCase().includes('internet')) {
    return `Sugestão IA: Para este ${patrimonio.modelo}, verifique o driver de rede e o cabo RJ45. Especificações indicam placa Gigabit.`;
  }
  
  if (assunto.toLowerCase().includes('impressora')) {
    return `Sugestão IA: Verifique o spooler de impressão. Este modelo costuma apresentar erro de sensor de papel quando o toner está abaixo de 10%.`;
  }

  return `Sugestão IA: Baseado no modelo ${patrimonio.modelo} (${specs}), realize um check-up de hardware e limpeza de arquivos temporários.`;
};