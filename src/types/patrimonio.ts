export interface Patrimonio {
  id: string;
  tag: string;
  tipo: string;
  modelo: string; // Usado para Marca/Modelo
  setor: string;
  status: string;
  data_instalacao: string;
  especificacoes?: string;
  configuracao?: string; // Campo unificado para hardware
  local_atual?: string;
  responsavel_nome?: string;
  responsavel_matricula?: string;
  fornecedor?: string;
  vencimento_contrato?: string;
}