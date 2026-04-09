export type Status = 'Aberto' | 'Em Atendimento' | 'Enviado para Fornecedor' | 'Concluído' | 'Cancelado';
export type Priority = 'Baixa' | 'Média' | 'Alta';

export interface Ticket {
  id: string;
  created_at: string;
  servidor: string;
  setor: string;
  assunto: string;
  problema: string;
  status: Status;
  prioridade: Priority;
  telefone?: string;
  atendente?: string;
  atendente_id?: string;
  resolucao?: string;
  finalizado_por?: string;
  finalizado_em?: string;
  cancelado_por?: string;
  motivo_cancelamento?: string;
}