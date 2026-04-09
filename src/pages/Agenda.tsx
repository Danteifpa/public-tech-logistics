"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Bell,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendaItem, AgendaType } from '../types/agenda';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Agenda = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('dti_user') || '{}');

  const [newItem, setNewItem] = useState({
    titulo: '',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora: '08:00',
    tipo: 'lembrete' as AgendaType
  });

  useEffect(() => {
    fetchAgenda();
  }, [currentMonth]);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentMonth).toISOString().split('T')[0];
      const end = endOfMonth(currentMonth).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('agenda_secretaria')
        .select('*')
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: true })
        .order('hora', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      showError(`Erro ao carregar agenda: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const { error } = await supabase.from('agenda_secretaria').insert([{
        titulo: newItem.titulo,
        descricao: newItem.descricao,
        data: newItem.data,
        hora: newItem.hora,
        tipo: newItem.tipo,
        tecnico_id: currentUser.id
      }]);

      if (error) throw error;

      // Dispara notificação por e-mail via Edge Function
      await supabase.functions.invoke('send-notification', {
        body: { 
          type: 'agenda', 
          data: newItem, 
          tecnico: currentUser.name 
        }
      });
      
      showSuccess("Compromisso agendado e e-mail enviado!");
      setIsAddOpen(false);
      setNewItem({
        titulo: '',
        descricao: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        hora: '08:00',
        tipo: 'lembrete'
      });
      fetchAgenda();
    } catch (err: any) {
      showError(`Erro ao agendar: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este compromisso?")) return;
    try {
      const { error } = await supabase.from('agenda_secretaria').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Removido da agenda");
      fetchAgenda();
    } catch (err: any) {
      showError(`Erro ao remover: ${err.message}`);
    }
  };

  const openAddModal = (date: Date) => {
    setNewItem(prev => ({ ...prev, data: format(date, 'yyyy-MM-dd') }));
    setIsAddOpen(true);
  };

  const getTypeStyles = (tipo: AgendaType) => {
    switch (tipo) {
      case 'evento': return "bg-red-50 text-red-700 border-red-100";
      case 'reuniao': return "bg-blue-50 text-blue-700 border-blue-100";
      case 'devolucao': return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#1E3A8A] rounded-2xl shadow-lg">
          <CalendarIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] tracking-tight capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <p className="text-[10px] md:text-xs font-semibold text-[#64748B] uppercase tracking-widest">Agenda da Secretaria</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm flex-1 md:flex-none">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-10 w-10 rounded-none hover:bg-slate-50">
            <ChevronLeft className="w-5 h-5 text-[#1E3A8A]" />
          </Button>
          <div className="w-[1px] bg-[#E2E8F0]" />
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-10 w-10 rounded-none hover:bg-slate-50">
            <ChevronRight className="w-5 h-5 text-[#1E3A8A]" />
          </Button>
        </div>

        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[10px] md:text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-md px-6 flex-1 md:flex-none"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo
        </Button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[9px] md:text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.1em] md:tracking-[0.2em] py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-[#E2E8F0] border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {calendarDays.map((day, idx) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayItems = items.filter(item => item.data === dayStr);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={idx} 
              onClick={() => openAddModal(day)}
              className={cn(
                "min-h-[80px] md:min-h-[120px] bg-white p-1 md:p-2 transition-colors hover:bg-[#F8FAFC] cursor-pointer relative",
                !isSameMonth(day, monthStart) && "bg-[#F1F5F9]/50 text-[#CBD5E1]"
              )}
            >
              <div className="flex justify-between items-center mb-1 md:mb-2">
                <span className={cn(
                  "text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-[#3B82F6] text-white" : "text-[#64748B]"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-0.5 md:space-y-1">
                {dayItems.map(item => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "px-1 md:px-2 py-0.5 md:py-1 rounded-md text-[8px] md:text-[9px] font-bold truncate border group relative",
                      getTypeStyles(item.tipo)
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.hora.slice(0, 5)} {item.titulo}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity ml-1"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up pb-12">
      {renderHeader()}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-sm bg-white p-2 md:p-4">
            {renderDays()}
            {loading ? (
              <div className="h-[400px] md:h-[600px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
              </div>
            ) : renderCells()}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-[#F8FAFC] border-b border-[#F1F5F9] py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1E3A8A]">
                <Bell className="w-4 h-4 text-amber-500" /> Próximos Compromissos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {items.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">Nenhum compromisso este mês.</p>
              ) : items.slice(0, 5).map(item => (
                <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-all">
                  <div className={cn(
                    "w-1 rounded-full",
                    item.tipo === 'evento' ? "bg-red-500" :
                    item.tipo === 'reuniao' ? "bg-blue-500" : 
                    item.tipo === 'devolucao' ? "bg-emerald-500" : "bg-slate-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1E293B] truncate">{item.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-[#94A3B8]" />
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">
                        {item.data.split('-').reverse().slice(0, 2).join('/')} às {item.hora.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Legenda de Cores</span>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Suporte Externo (Eventos)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Reuniões Internas TechDept</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Devolução de Equipamentos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-bold text-[#1E3A8A]">Novo Compromisso</DialogTitle></DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Título</Label>
              <Input value={newItem.titulo} onChange={e => setNewItem({...newItem, titulo: e.target.value})} required placeholder="Ex: Falar com Arlindo da AdminDept" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Data</Label>
                <Input type="date" value={newItem.data} onChange={e => setNewItem({...newItem, data: e.target.value})} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Hora</Label>
                <Input type="time" value={newItem.hora} onChange={e => setNewItem({...newItem, hora: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Tipo de Compromisso</Label>
              <Select value={newItem.tipo} onValueChange={(v: AgendaType) => setNewItem({...newItem, tipo: v})}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="evento">Suporte Externo (Vermelho)</SelectItem>
                  <SelectItem value="reuniao">Reunião Interna (Azul)</SelectItem>
                  <SelectItem value="devolucao">Devolução (Verde)</SelectItem>
                  <SelectItem value="lembrete">Lembrete Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter><Button type="submit" className="w-full bg-[#1E3A8A] text-white font-bold uppercase text-[11px] h-12 rounded-xl">Agendar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;