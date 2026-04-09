import React, { createContext, useContext, useState, useEffect } from 'react';
import { Ticket, Status } from '../types/ticket';
import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '@/utils/toast';

interface TicketContextType {
  tickets: Ticket[];
  pendingTickets: any[];
  loading: boolean;
  addTicket: (ticket: Omit<Ticket, 'id' | 'status' | 'created_at'>) => Promise<void>;
  updateTicketStatus: (id: string, status: Status, extraData?: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  refreshTickets: () => Promise<void>;
  syncOfflineTickets: () => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dti_pending_tickets');
    if (saved) {
      setPendingTickets(JSON.parse(saved));
    }

    refreshTickets();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chamados'
        },
        () => {
          refreshTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chamados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("[TicketContext] Error fetching tickets:", error);
        throw error;
      }
      setTickets(data || []);
    } catch (err) {
      console.error("[TicketContext] Failed to refresh tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTicket = async (ticketData: Omit<Ticket, 'id' | 'status' | 'created_at'>) => {
    try {
      console.log("[TicketContext] Attempting to insert ticket:", ticketData);
      const { error } = await supabase.from('chamados').insert([ticketData]);
      
      if (error) {
        console.error("[TicketContext] Supabase insert error:", error);
        throw error;
      }
      
      console.log("[TicketContext] Ticket inserted successfully");
    } catch (error: any) {
      console.error("[TicketContext] addTicket caught error:", error);
      const updatedPending = [...pendingTickets, { ...ticketData, tempId: Date.now() }];
      setPendingTickets(updatedPending);
      localStorage.setItem('dti_pending_tickets', JSON.stringify(updatedPending));
      throw error;
    }
  };

  const updateTicketStatus = async (id: string, status: Status, extraData: Partial<Ticket> = {}) => {
    try {
      const updatePayload = { status, ...extraData };
      const { error } = await supabase.from('chamados').update(updatePayload).eq('id', id);
      if (error) throw error;
      showSuccess(`Chamado atualizado.`);
      refreshTickets();
    } catch (err: any) {
      console.error("[TicketContext] updateTicketStatus error:", err);
      showError(`Erro ao atualizar: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      const { error } = await supabase.from('chamados').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Chamado excluído.");
      refreshTickets();
    } catch (err: any) {
      console.error("[TicketContext] deleteTicket error:", err);
      showError(`Erro ao excluir: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const syncOfflineTickets = async () => {
    if (pendingTickets.length === 0) return;
    setLoading(true);
    let successCount = 0;
    const remaining = [...pendingTickets];

    for (const ticket of pendingTickets) {
      try {
        const { tempId, ...dataToSave } = ticket;
        const { error } = await supabase.from('chamados').insert([dataToSave]);
        if (!error) {
          successCount++;
          const index = remaining.findIndex(t => t.tempId === tempId);
          if (index > -1) remaining.splice(index, 1);
        } else {
          console.error("[TicketContext] Sync error for ticket:", tempId, error);
        }
      } catch (err) {
        console.error("[TicketContext] Sync exception:", err);
      }
    }

    setPendingTickets(remaining);
    localStorage.setItem('dti_pending_tickets', JSON.stringify(remaining));
    setLoading(false);

    if (successCount > 0) {
      showSuccess(`${successCount} chamados sincronizados!`);
      refreshTickets();
    }
  };

  return (
    <TicketContext.Provider value={{ 
      tickets, 
      pendingTickets, 
      loading, 
      addTicket, 
      updateTicketStatus, 
      deleteTicket, 
      refreshTickets,
      syncOfflineTickets
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) throw new Error('useTicketContext deve ser usado dentro de um TicketProvider');
  return context;
};