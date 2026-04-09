import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Ticket, Status } from '../../types/ticket';
import { Clock, CheckCircle2, AlertCircle, Calendar, MapPin, XCircle } from 'lucide-react';
import { useTicketContext } from '../../context/TicketContext';
import { showSuccess } from '@/utils/toast';

interface MyTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
  serverName: string;
}

const MyTicketsModal = ({ isOpen, onClose, tickets, serverName }: MyTicketsModalProps) => {
  const { updateTicketStatus, refreshTickets } = useTicketContext();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const userTickets = tickets.filter(t => 
    t.servidor.toLowerCase().trim() === serverName.toLowerCase().trim()
  );

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case 'Aberto':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold uppercase text-[10px]">Pendente</Badge>;
      case 'Em Atendimento':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold uppercase text-[10px]">Em Atendimento</Badge>;
      case 'Concluído':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold uppercase text-[10px]">Concluído</Badge>;
      case 'Cancelado':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold uppercase text-[10px]">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const handleCancelClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (ticket.status === 'Aberto') {
      if (confirm("Deseja realmente cancelar sua solicitação?")) {
        handleCancelSubmit("Cancelado pelo solicitante.");
      }
    } else {
      setCancelReason('');
      setIsCancelDialogOpen(true);
    }
  };

  const handleCancelSubmit = async (reason?: string) => {
    const finalReason = reason || cancelReason;
    if (!selectedTicket || (selectedTicket.status === 'Em Atendimento' && !finalReason.trim())) return;

    await updateTicketStatus(selectedTicket.id, 'Cancelado', {
      resolucao: `CANCELADO PELO SERVIDOR: ${finalReason}`,
      finalizado_em: new Date().toISOString(),
      finalizado_por: 'Solicitante'
    });
    
    showSuccess("Chamado cancelado com sucesso.");
    setIsCancelDialogOpen(false);
    setSelectedTicket(null);
    refreshTickets();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white border-[#E2E8F0] p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <DialogTitle className="text-xl font-bold text-[#1E3A8A]">Meus Chamados</DialogTitle>
            <DialogDescription className="text-[#64748B] font-medium">
              Histórico de solicitações para: <span className="font-bold text-[#3B82F6]">{serverName || 'Nenhum nome salvo'}</span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            {userTickets.length === 0 ? (
              <div className="text-center py-16 text-[#94A3B8]">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-20 text-[#3B82F6]" />
                <p className="font-medium">Nenhum chamado encontrado para este nome.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userTickets.map((ticket) => (
                  <div key={ticket.id} className="p-5 border border-[#E2E8F0] rounded-2xl bg-white hover:bg-[#F8FAFC] transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-mono text-[11px] text-[#94A3B8] font-bold">
                        #{ticket.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(ticket.status)}
                        {(ticket.status === 'Aberto' || ticket.status === 'Em Atendimento') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 text-[10px] font-bold uppercase"
                            onClick={() => handleCancelClick(ticket)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                    <h4 className="font-bold text-[#1E293B] text-base mb-1.5">{ticket.assunto}</h4>
                    <p className="text-sm text-[#64748B] mb-4 line-clamp-2 leading-relaxed">{ticket.problema}</p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                        {formatDate(ticket.created_at)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#3B82F6]" />
                        {ticket.setor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="p-4 bg-[#F1F5F9] border-t border-[#E2E8F0] text-center">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">TechDept AdminDept - Prefeitura de Metropolitan</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Justificativa de Cancelamento para o Servidor */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-red-600 text-lg">Cancelar Solicitação</DialogTitle>
            <DialogDescription className="text-[#64748B] text-sm">
              Seu chamado já está sendo atendido por um técnico. Por favor, informe o motivo do cancelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Motivo</Label>
              <Textarea 
                placeholder="Ex: O problema foi resolvido sozinho, etc." 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px] border-[#E2E8F0] rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)} className="text-[#64748B] font-bold uppercase text-[11px]">Voltar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[11px] h-11 rounded-xl px-8" onClick={() => handleCancelSubmit()} disabled={!cancelReason.trim()}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyTicketsModal;