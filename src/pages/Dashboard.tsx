"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTicketContext } from '../context/TicketContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Search,
  RefreshCw,
  Clock,
  Printer,
  TrendingUp,
  CheckCircle2,
  Loader2,
  FileDown,
  Monitor,
  HardDrive,
  Plus,
  PieChart as PieChartIcon,
  ExternalLink,
  ShieldAlert,
  Wrench,
  Calendar as CalendarIcon,
  Bell
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Status, Ticket } from '../types/ticket';
import { Patrimonio } from '../types/patrimonio';
import { AgendaItem } from '../types/agenda';
import { cn } from '@/lib/utils';
import { differenceInMinutes, parseISO, format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';
import NOCMonitor from '@/components/features/NOCMonitor';
import NetworkDiagnostic from '@/components/features/NetworkDiagnostic';
import UrgentAlert from '@/components/features/UrgentAlert';
import { exportPatrimonioPDF } from '@/utils/export-pdf';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const Dashboard = () => {
  const { tickets, loading: contextLoading, refreshTickets } = useTicketContext();
  const currentUser = JSON.parse(localStorage.getItem('dti_user') || '{}');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isAssumeOpen, setIsAssumeOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [resolution, setResolution] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [techs, setTechs] = useState<{id: string, nome: string}[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);
  const [nextAppointment, setNextAppointment] = useState<AgendaItem | null>(null);
  
  const [urgentAlerts, setUrgentAlerts] = useState<Ticket[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ALLOWED_TECHS = ['Marcos', 'Bruno', 'Dante'];
  const canAssume = ALLOWED_TECHS.some(name => currentUser.name?.toLowerCase().includes(name.toLowerCase()));

  useEffect(() => {
    refreshTickets();
    fetchTechs();
    fetchPatrimonio();
    fetchNextAppointment();
    audioRef.current = new Audio(ALERT_SOUND_URL);

    const channel = supabase
      .channel('dashboard-realtime-v4')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chamados' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTicket = payload.new as Ticket;
            if (newTicket.prioridade === 'Alta') {
              setUrgentAlerts(prev => [...prev, newTicket]);
              audioRef.current?.play().catch(e => console.log("Áudio bloqueado"));
            }
          }
          refreshTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTechs = async () => {
    try {
      const { data, error } = await supabase.from('tecnicos').select('id, nome').eq('status', 'Ativo');
      if (error) throw error;
      setTechs(data || []);
    } catch (err) {
      console.error("[Dashboard] Error fetching techs:", err);
    }
  };

  const fetchPatrimonio = async () => {
    try {
      const { data, error } = await supabase.from('patrimonio').select('*').order('tag', { ascending: true });
      if (error) throw error;
      setPatrimonios(data || []);
    } catch (err) {
      console.error("[Dashboard] Error fetching patrimonio:", err);
    }
  };

  const fetchNextAppointment = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('agenda_secretaria')
        .select('*')
        .gte('data', today)
        .order('data', { ascending: true })
        .order('hora', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      setNextAppointment(data);
    } catch (err) {
      console.error("[Dashboard] Error fetching next appointment:", err);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      t.servidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.atendente && t.atendente.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tickets, searchTerm]);

  const patrimonioStats = useMemo(() => {
    const stats: Record<string, number> = {};
    patrimonios.forEach(p => {
      stats[p.tipo] = (stats[p.tipo] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [patrimonios]);

  const stats = useMemo(() => {
    const completed = tickets.filter(t => t.status === 'Concluído' && t.finalizado_em);
    const active = tickets.filter(t => t.status !== 'Concluído' && t.status !== 'Cancelado');
    
    let slaFormatted = '---';
    if (completed.length > 0) {
      const totalMinutes = completed.reduce((acc, t) => {
        const start = parseISO(t.created_at);
        const end = parseISO(t.finalizado_em!);
        return acc + Math.max(0, differenceInMinutes(end, start));
      }, 0);
      
      const avgMinutes = Math.round(totalMinutes / completed.length);
      const hours = Math.floor(avgMinutes / 60);
      const mins = avgMinutes % 60;
      slaFormatted = `${hours}h ${mins}min`;
    }
    
    return {
      sla: slaFormatted,
      completedCount: completed.length,
      activeCount: active.length
    };
  }, [tickets]);

  const handleAssumeAction = async (techName: string, techId?: string) => {
    if (!selectedTicket) return;
    if (!canAssume) {
      showError("Acesso Negado: Você não tem permissão para assumir chamados.");
      return;
    }

    setLocalLoading(true);
    try {
      const { error } = await supabase
        .from('chamados')
        .update({ 
          status: 'Em Atendimento',
          atendente: techName,
          atendente_id: techId 
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      
      showSuccess(`Chamado assumido por ${techName}`);
      setIsAssumeOpen(false);
      setSelectedTicket(null);
      await refreshTickets();
    } catch (err: any) {
      showError(`Erro ao assumir: ${err.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendToSupplier = async (ticket: Ticket) => {
    setLocalLoading(true);
    try {
      const { error } = await supabase.from('chamados').update({ status: 'Enviado para Fornecedor' }).eq('id', ticket.id);
      if (error) throw error;
      showSuccess("Chamado encaminhado para o fornecedor externo.");
      await refreshTickets();
    } catch (err: any) {
      showError("Erro ao encaminhar.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancelAction = async (reason: string) => {
    if (!selectedTicket) return;
    setLocalLoading(true);
    try {
      const { error } = await supabase
        .from('chamados')
        .update({ 
          status: 'Cancelado',
          motivo_cancelamento: reason,
          cancelado_por: currentUser.id,
          finalizado_em: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      showSuccess("Chamado cancelado com sucesso");
      setIsCancelOpen(false);
      setSelectedTicket(null);
      await refreshTickets();
    } catch (err: any) {
      showError(`Erro ao cancelar: ${err.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleFinalizeAction = async () => {
    if (!selectedTicket || !resolution.trim()) return;
    setLocalLoading(true);
    try {
      const { error } = await supabase
        .from('chamados')
        .update({ 
          status: 'Concluído',
          resolucao: resolution,
          finalizado_em: new Date().toISOString(),
          finalizado_por: currentUser.id
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      showSuccess("Chamado finalizado");
      setIsFinalizeOpen(false);
      setSelectedTicket(null);
      await refreshTickets();
    } catch (err: any) {
      showError(`Erro ao finalizar: ${err.message}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const generateOS = (ticket: Ticket) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `<html><head><title>OS - ${ticket.id.slice(0, 8)}</title><style>body{font-family:sans-serif;padding:40px;}.header{border-bottom:2px solid #1e3a8a;margin-bottom:20px;padding-bottom:10px;}.section{margin-bottom:20px;}.label{font-weight:bold;}</style></head><body><div class="header"><h1>TechDept - Ordem de Serviço</h1></div><div class="section"><p><span class="label">Protocolo:</span> #${ticket.id.slice(0, 8).toUpperCase()}</p><p><span class="label">Servidor:</span> ${ticket.servidor}</p><p><span class="label">Setor:</span> ${ticket.setor}</p><p><span class="label">Assunto:</span> ${ticket.assunto}</p></div><div class="section"><p><span class="label">Problema:</span> ${ticket.problema}</p></div><div class="section"><p><span class="label">Resolução:</span> ${ticket.resolucao || '---'}</p></div><div class="section"><p><span class="label">Técnico:</span> ${ticket.atendente || '---'}</p></div><script>window.print();</script></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aberto': return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold uppercase text-[10px]">Aberto</Badge>;
      case 'Em Atendimento': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-bold uppercase text-[10px]">Em Atendimento</Badge>;
      case 'Enviado para Fornecedor': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-bold uppercase text-[10px]">Externo</Badge>;
      case 'Concluído': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-bold uppercase text-[10px]">Concluído</Badge>;
      case 'Cancelado': return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold uppercase text-[10px]">Cancelado</Badge>;
      case 'EM MANUTENÇÃO': return <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-bold uppercase text-[10px]">Manutenção</Badge>;
      default: return null;
    }
  };

  const activeTickets = filteredTickets.filter(t => t.status !== 'Concluído' && t.status !== 'Cancelado');
  const historyTickets = filteredTickets.filter(t => t.status === 'Concluído' || t.status === 'Cancelado');

  return (
    <div className="space-y-6 md:space-y-8 pb-10 relative">
      {urgentAlerts.map(alert => (
        <UrgentAlert 
          key={alert.id} 
          ticket={alert} 
          onClose={(id) => setUrgentAlerts(prev => prev.filter(t => t.id !== id))} 
        />
      ))}

      {/* Alerta de Próximo Compromisso */}
      {nextAppointment && (
        <div className="animate-fade-in-up">
          <div className="bg-[#1E3A8A] border border-[#3B82F6]/30 rounded-2xl p-4 flex items-center justify-between shadow-lg overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Bell className="w-5 h-5 text-blue-300 animate-bounce" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-0.5">Próximo Compromisso</p>
                <h3 className="text-white font-bold text-sm md:text-base">
                  {nextAppointment.titulo} — {nextAppointment.data.split('-').reverse().slice(0, 2).join('/')} às {nextAppointment.hora.slice(0, 5)}
                </h3>
              </div>
            </div>
            <Button asChild variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-10 px-4 text-xs font-bold uppercase tracking-widest">
              <a href="/agenda">Ver Agenda</a>
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E3A8A] tracking-tight">Painel de Controle</h1>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" /> Operador: {currentUser.name}
          </div>
        </div>
        <div className="flex flex-wrap w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input 
              placeholder="Buscar chamado..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 md:h-11 rounded-xl border-[#E2E8F0] focus:ring-[#3B82F6]"
            />
          </div>
          <Button className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E3A8A] font-bold text-[10px] md:text-[11px] uppercase tracking-widest h-10 md:h-11 rounded-xl border border-[#E2E8F0]" onClick={refreshTickets} disabled={contextLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", contextLoading && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <NOCMonitor />
        </div>
        <div className="lg:col-span-1 flex flex-col">
          <NetworkDiagnostic />
        </div>
      </div>

      <Tabs defaultValue="ativos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-[#F1F5F9] p-1 rounded-xl h-10 md:h-12 border border-[#E2E8F0]">
          <TabsTrigger value="ativos" className="font-bold text-[9px] md:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1E3A8A]">
            Ativos ({activeTickets.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="font-bold text-[9px] md:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1E3A8A]">
            Histórico ({historyTickets.length})
          </TabsTrigger>
          <TabsTrigger value="patrimonio" className="font-bold text-[9px] md:text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1E3A8A]">
            Patrimônio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-soft-blue transition-all duration-300">
              <div className="h-1 bg-[#3B82F6] w-full" />
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#3B82F6]" />
                  <Badge variant="secondary" className="bg-blue-50 text-[#3B82F6] border-none text-[9px] md:text-[10px] font-bold">SLA MÉDIO</Badge>
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#1E293B]">{stats.sla}</div>
                <p className="text-[9px] md:text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mt-1">Tempo Médio de Solução</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-soft-blue transition-all duration-300">
              <div className="h-1 bg-[#10B981] w-full" />
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-[#10B981]" />
                  <Badge variant="secondary" className="bg-emerald-50 text-[#10B981] border-none text-[9px] md:text-[10px] font-bold">PRODUTIVIDADE</Badge>
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#1E293B]">{stats.completedCount}</div>
                <p className="text-[9px] md:text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mt-1">Chamados Concluídos</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-soft-blue transition-all duration-300">
              <div className="h-1 bg-amber-500 w-full" />
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                  <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-none text-[9px] md:text-[10px] font-bold">EM FILA</Badge>
                </div>
                <div className="text-xl md:text-2xl font-bold text-[#1E293B]">{stats.activeCount}</div>
                <p className="text-[9px] md:text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mt-1">Chamados em Aberto</p>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[#1E3A8A] text-[10px] md:text-[11px] uppercase tracking-wider font-bold border-b border-[#E2E8F0]">
                    <th className="px-4 md:px-6 py-3 md:py-4">Protocolo</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Servidor / Setor</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Assunto</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Atendente</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Status</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {activeTickets.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8] italic text-sm">Nenhum chamado ativo.</td></tr>
                  ) : (
                    activeTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-[#F8FAFC] transition-colors group">
                        <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-[10px] md:text-[11px] text-[#64748B]">#{ticket.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="font-bold text-[#1E293B] text-xs md:text-sm">{ticket.servidor}</div>
                          <div className="text-[9px] md:text-[11px] text-[#3B82F6] font-semibold uppercase">{ticket.setor}</div>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4"><div className="text-xs md:text-sm font-medium text-[#1E293B]">{ticket.assunto}</div></td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          {ticket.atendente ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 md:h-7 md:w-7 border border-[#E2E8F0]">
                                <AvatarFallback className="bg-[#F1F5F9] text-[#1E3A8A] text-[9px] md:text-[10px] font-bold">{ticket.atendente.slice(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] md:text-[11px] font-semibold text-[#64748B]">{ticket.atendente}</span>
                            </div>
                          ) : <span className="text-[9px] md:text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">Aguardando</span>}
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">{getStatusBadge(ticket.status)}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                          <div className="flex justify-end gap-1 md:gap-2">
                            {ticket.status === 'Aberto' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className={cn(
                                    "font-bold text-[9px] md:text-[10px] uppercase tracking-widest h-7 md:h-8 rounded-lg",
                                    canAssume ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  )} 
                                  onClick={() => {
                                    if (!canAssume) {
                                      showError("Apenas Marcos, Bruno ou Dante podem assumir chamados.");
                                      return;
                                    }
                                    setSelectedTicket(ticket);
                                    if (currentUser.role === 'admin') setIsAssumeOpen(true);
                                    else handleAssumeAction(currentUser.name, currentUser.id);
                                  }}
                                >
                                  {canAssume ? "Assumir" : <ShieldAlert className="w-3 h-3" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold text-[9px] md:text-[10px] uppercase tracking-widest h-7 md:h-8 rounded-lg" onClick={() => {
                                  setSelectedTicket(ticket);
                                  if (confirm("Deseja cancelar este chamado?")) handleCancelAction("Cancelado pelo técnico/admin");
                                }}>Cancelar</Button>
                              </>
                            )}
                            {(ticket.status === 'Em Atendimento' || ticket.status === 'Enviado para Fornecedor') && (
                              <>
                                {ticket.status === 'Em Atendimento' && (
                                  <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50 font-bold text-[9px] md:text-[10px] uppercase tracking-widest h-7 md:h-8 rounded-lg" onClick={() => handleSendToSupplier(ticket)}>
                                    <ExternalLink className="w-3 h-3 mr-1" /> Externo
                                  </Button>
                                )}
                                <Button size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[9px] md:text-[10px] uppercase tracking-widest h-7 md:h-8 rounded-lg" onClick={() => {
                                  setSelectedTicket(ticket);
                                  setResolution('');
                                  setIsFinalizeOpen(true);
                                }}>Finalizar</Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold text-[9px] md:text-[10px] uppercase tracking-widest h-7 md:h-8 rounded-lg" onClick={() => {
                                  setSelectedTicket(ticket);
                                  setCancelReason('');
                                  setIsCancelOpen(true);
                                }}>Cancelar</Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[#1E3A8A] text-[10px] md:text-[11px] uppercase tracking-wider font-bold border-b border-[#E2E8F0]">
                    <th className="px-4 md:px-6 py-3 md:py-4">Protocolo</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Servidor / Setor</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Assunto</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Status</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {historyTickets.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-[#94A3B8] italic text-sm">Nenhum histórico.</td></tr>
                  ) : (
                    historyTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-[#F8FAFC] transition-colors group">
                        <td className="px-4 md:px-6 py-3 md:py-4 font-mono text-[10px] md:text-[11px] text-[#64748B]">#{ticket.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="font-bold text-[#1E293B] text-xs md:text-sm">{ticket.servidor}</div>
                          <div className="text-[9px] md:text-[11px] text-[#3B82F6] font-semibold uppercase">{ticket.setor}</div>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4"><div className="text-xs md:text-sm font-medium text-[#1E293B]">{ticket.assunto}</div></td>
                        <td className="px-4 md:px-6 py-3 md:py-4">{getStatusBadge(ticket.status)}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                          {ticket.status === 'Concluído' && (
                            <Button variant="outline" size="sm" className="border-[#E2E8F0] text-[#1E3A8A] font-bold text-[9px] md:text-[10px] uppercase tracking-widest h-7 md:h-8 rounded-lg" onClick={() => generateOS(ticket)}>
                              <Printer className="w-3 h-3 mr-1" /> OS
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patrimonio" className="mt-0 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-base md:text-lg font-bold text-[#1E3A8A] uppercase tracking-widest">Inventário de Patrimônio</h2>
            <div className="flex gap-3 w-full md:w-auto">
              <Button 
                onClick={() => exportPatrimonioPDF(patrimonios)}
                className="flex-1 md:flex-none bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[10px] md:text-[11px] uppercase tracking-widest h-10 rounded-xl shadow-md"
              >
                <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white border-none shadow-sm overflow-hidden">
              <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC] py-3 md:py-4">
                <CardTitle className="text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1E3A8A]">
                  <PieChartIcon className="w-4 h-4 text-[#3B82F6]" /> Distribuição de Equipamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={patrimonioStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {patrimonioStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {patrimonioStats.map((stat, index) => (
                <Card key={stat.name} className="bg-white border-none shadow-sm overflow-hidden">
                  <div className="h-1 w-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          {stat.name === 'PC' ? <Monitor className="w-4 h-4 text-[#3B82F6]" /> : <HardDrive className="w-4 h-4 text-[#3B82F6]" />}
                        </div>
                        <div>
                          <div className="text-lg md:text-xl font-bold text-[#1E293B]">{stat.value}</div>
                          <p className="text-[9px] md:text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">{stat.name}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAssumeOpen} onOpenChange={setIsAssumeOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-[90vw] md:max-w-md">
          <DialogHeader><DialogTitle className="font-bold text-[#1E3A8A]">Atribuir Técnico</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label className="text-xs font-bold uppercase">Selecione o Técnico</Label>
            <Select onValueChange={(val) => {
              const tech = techs.find(t => t.id === val);
              if (tech) handleAssumeAction(tech.nome, tech.id);
            }}>
              <SelectTrigger className="h-11 rounded-xl mt-2"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent className="bg-white">
                {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAssumeOpen(false)} disabled={localLoading}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinalizeOpen} onOpenChange={setIsFinalizeOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-[90vw] md:max-w-md">
          <DialogHeader><DialogTitle className="font-bold text-[#1E3A8A]">Finalizar Chamado</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Resolução Técnica</Label>
              <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="O que foi feito?" className="min-h-[100px] rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsFinalizeOpen(false)} disabled={localLoading}>Cancelar</Button>
            <Button className="bg-[#10B981] text-white font-bold uppercase text-[11px] h-11 rounded-xl px-8" onClick={handleFinalizeAction} disabled={localLoading || !resolution.trim()}>
              {localLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Concluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-[90vw] md:max-w-md">
          <DialogHeader><DialogTitle className="font-bold text-red-600">Cancelar Chamado</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Motivo do Cancelamento</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Por que cancelar?" className="min-h-[100px] rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCancelOpen(false)} disabled={localLoading}>Voltar</Button>
            <Button className="bg-red-600 text-white font-bold uppercase text-[11px] h-11 rounded-xl px-8" onClick={() => handleCancelAction(cancelReason)} disabled={localLoading || !cancelReason.trim()}>
              {localLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;