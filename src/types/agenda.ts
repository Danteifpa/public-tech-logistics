export type AgendaType = 'evento' | 'lembrete' | 'reuniao' | 'devolucao';

export interface AgendaItem {
  id: string;
  titulo: string;
  descricao?: string;
  data: string; // Formato YYYY-MM-DD
  hora: string; // Formato HH:mm
  tipo: AgendaType;
  created_at: string;
}