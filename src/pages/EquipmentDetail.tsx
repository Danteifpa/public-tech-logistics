"use client";

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  User, 
  History as HistoryIcon, 
  MapPin,
  Calendar,
  RotateCcw,
  UserPlus,
  MessageSquareWarning,
  Wrench,
  Cpu
} from 'lucide-react';
import { Patrimonio } from '../types/patrimonio';
import { Ticket } from '../types/ticket';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';

const EquipmentDetail = () => {
  const { tag: pathTag } = useParams();
  const [searchParams] = useSearchParams();
  
  const rawTag = pathTag || searchParams.get('tag') || '';
  const tag = rawTag.trim();
  
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Patrimonio | null>(null);
  const [history, setHistory] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const isAuthenticated = localStorage.getItem('dti_auth') === 'true';

  useEffect(() => {
    if (!isAuthenticated) {
      showError("Acesso restrito. Por favor, faça login para ver os detalhes do patrimônio.");
      navigate('/login', { replace: true });
      return;
    }

    if (tag) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [tag, isAuthenticated, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Busca exclusiva na tabela patrimonio pela coluna tag (text)
      const { data: equipData, error: equipError } = await supabase
        .from('patrimonio')
        .eq('tag', tag)
        .maybeSingle();
      
      if (equipError) throw equipError;
      
      if (equipData) {
        setEquipment(equipData);

        // Busca histórico de chamados vinculados a esta TAG
        const { data: historyData } = await supabase
          .from('chamados')
          .filter('telefone', 'ilike', `%${tag}%`)
          .order('created_at', { ascending: false });
        
        setHistory(historyData || []);
      } else {
        setEquipment(null);
      }
    } catch (err) {
      console.error("Erro ao buscar dados do patrimônio:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!equipment || !confirm(`Confirmar devolução do equipamento TAG ${equipment.tag}?`)) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('patrimonio')
        .update({
          status: 'Ativo',
          local_atual: null,
          responsavel_nome: null,
          responsavel_matricula: null
        })
        .eq('id', equipment.id);

      if (error) throw error;
      showSuccess("Equipamento devolvido ao estoque!");
      fetchData();
    } catch (err) {
      showError("Erro ao processar devolução.");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4 opacity-20" />
        <h1 className="text-xl font-bold text-[#1E293B]">Equipamento não encontrado</h1>
        <p className="text-slate-500 mb-2">A TAG informada (<span className="font-bold text-[#1E3A8A]">{tag}</span>) não consta em nosso inventário.</p>
        <Button asChild className="bg-[#1E3A8A] rounded-xl">
          <Link to="/solicitar">Voltar ao Início</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 flex flex-col items-center pb-20">
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-[#64748B] hover:text-[#1E3A8A]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div className="px-4 py-1.5 bg-[#F1F5F9] border border-[#BFDBFE] rounded-full">
            <span className="logo-flat text-xl tracking-tight">TechDept</span>
          </div>
        </div>

        <Card className="bg-white border-[#E2E8F0] shadow-xl rounded-2xl overflow-hidden">
          <div className={cn(
            "h-2 w-full", 
            equipment.status === 'Emprestado' ? "bg-amber-500" : 
            equipment.status === 'EM MANUTENÇÃO' ? "bg-orange-500" : 
            "bg-[#10B981]"
          )} />
          <CardHeader className="text-center pb-2 pt-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-50 rounded-full border border-blue-100">
                <Monitor className="w-10 h-10 text-[#3B82F6]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Ficha Técnica do Bem</CardTitle>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="outline" className="font-mono text-sm border-[#E2E8F0] bg-slate-50">TAG: {equipment.tag}</Badge>
              <Badge className={cn(
                "uppercase text-[10px] font-bold",
                equipment.status === 'Ativo' ? "bg-emerald-100 text-emerald-700" : 
                equipment.status === 'EM MANUTENÇÃO' ? "bg-orange-100 text-orange-700" :
                "bg-amber-100 text-amber-700"
              )}>{equipment.status}</Badge>
            </div>
          </CardHeader>

          <CardContent className="px-6 md:px-8 pb-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#F1F5F9]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Modelo / Marca</p>
                <p className="font-bold text-[#1E293B]">{equipment.modelo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Tipo</p>
                <p className="font-bold text-[#1E293B]">{equipment.tipo}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Configuração Técnica
                </p>
                <p className="text-sm font-bold text-[#1E293B] bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {equipment.configuracao || 'Configuração padrão de fábrica'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Setor de Origem</p>
                <p className="font-bold text-[#1E293B]">{equipment.setor}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Propriedade</p>
                <p className="font-bold text-[#3B82F6]">{equipment.fornecedor || 'Próprio'}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                {equipment.status === 'EM MANUTENÇÃO' ? <Wrench className="w-4 h-4 text-orange-500 mt-0.5" /> : <User className="w-4 h-4 text-[#3B82F6] mt-0.5" />}
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">
                    {equipment.status === 'EM MANUTENÇÃO' ? 'Destino da Manutenção' : 'Responsável Atual'}
                  </p>
                  <p className="text-sm font-bold text-[#1E293B]">
                    {equipment.status === 'EM MANUTENÇÃO' ? (equipment.local_atual || 'TechDept Interno') : (equipment.responsavel_nome || 'Nenhum responsável vinculado')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#3B82F6] mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">Localização Atual</p>
                  <p className="text-sm font-bold text-[#1E293B]">{equipment.local_atual || equipment.setor}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#3B82F6] mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">Vencimento Contrato / Garantia</p>
                  <p className="text-sm font-bold text-[#1E293B]">
                    {equipment.vencimento_contrato ? new Date(equipment.vencimento_contrato).toLocaleDateString('pt-BR') : '---'}
                  </p>
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex items-center gap-2 text-[#1E3A8A] font-bold text-xs uppercase tracking-widest mb-2">
                  <ShieldCheck className="w-4 h-4" /> Painel do Técnico
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 font-bold uppercase text-[10px] tracking-widest h-12 rounded-xl"
                    onClick={() => navigate(`/equipamentos?tag=${equipment.tag}`)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Trocar Responsável
                  </Button>
                  
                  {(equipment.status === 'Emprestado' || equipment.status === 'EM MANUTENÇÃO') && (
                    <Button 
                      variant="outline" 
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest h-12 rounded-xl"
                      onClick={handleReturn}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                      Devolver Equipamento
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-2 text-[#1E3A8A] font-bold text-xs uppercase tracking-widest">
                <HistoryIcon className="w-4 h-4" /> Histórico de Movimentações
              </div>
              
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                    Nenhum registro encontrado para este bem.
                  </p>
                ) : (
                  history.map((ticket) => (
                    <div key={ticket.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold uppercase",
                          ticket.assunto.includes('MANUTENÇÃO') ? "border-orange-200 text-orange-700 bg-orange-50" : ""
                        )}>
                          {ticket.assunto.includes('MANUTENÇÃO') ? 'Manutenção' : ticket.status}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mb-1">{ticket.assunto}</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{ticket.problema}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                asChild 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[11px] tracking-widest h-14 rounded-xl shadow-lg shadow-red-100"
              >
                <Link to={`/solicitar?tag=${equipment.tag}`}>
                  <MessageSquareWarning className="w-5 h-5 mr-2" /> Reportar Problema / Abrir Chamado
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center">
          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">
            TechDept - Secretaria Municipal de Administração
          </p>
        </footer>
      </div>
    </div>
  );
};

export default EquipmentDetail;