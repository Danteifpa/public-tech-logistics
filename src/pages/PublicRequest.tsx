"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTicketContext } from '../context/TicketContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, History, Settings, Search, Loader2, UserCheck } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import MyTicketsModal from '@/components/features/MyTicketsModal';
import { Patrimonio } from '../types/patrimonio';
import { cn } from '@/lib/utils';

const SETORES_OFICIAIS = [
  "TechDept", "GABINETE", "ATENDIMENTO", "PERÍCIA", "ARQUIVO", 
  "DAL", "DIARIO", "FOLHA", "MOVIMENTAÇÃO", "GABINETE-ADJUNTO", 
  "DDO", "JURIDICO", "DSO", "ENCARGOS"
];

const ASSUNTOS = ["Impressora", "Internet", "Computador", "Sistemas", "Suporte Interno"];

const PROBLEMAS = [
  "Papel preso/Toner", 
  "Sem conexão/Lento", 
  "PC não liga/Lento", 
  "Erro de login/Acesso", 
  "Verificação de Rotina"
];

interface ServidorAutorizado {
  id: string;
  nome: string;
  setor: string;
}

const PublicRequest = () => {
  const { addTicket, tickets } = useTicketContext();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAuthenticated = localStorage.getItem('dti_auth') === 'true';
  
  const [servidor, setServidor] = useState('');
  const [setor, setSetor] = useState('');
  const [assunto, setAssunto] = useState('');
  const [problema, setProblema] = useState('');
  const [prioridade, setPrioridade] = useState<string>('Média');
  
  const [tagPatrimonio, setTagPatrimonio] = useState(searchParams.get('tag') || '');
  const [patrimonioEncontrado, setPatrimonioEncontrado] = useState<Patrimonio | null>(null);
  const [isLoadingPatrimonio, setIsLoadingPatrimonio] = useState(false);

  // Estados para Autocomplete
  const [servidoresAutorizados, setServidoresAutorizados] = useState<ServidorAutorizado[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidServer, setIsValidServer] = useState(false);

  useEffect(() => {
    fetchServidores();
    if (tagPatrimonio) {
      handleSearchPatrimonio();
    }
  }, []);

  const fetchServidores = async () => {
    try {
      const { data, error } = await supabase
        .from('servidores_autorizados')
        .select('id, nome, setor')
        .eq('status', 'Ativo');
      
      if (error) throw error;
      setServidoresAutorizados(data || []);
    } catch (err) {
      console.error("Erro ao carregar servidores autorizados:", err);
    }
  };

  const suggestions = useMemo(() => {
    if (!servidor || servidor.length < 1 || isValidServer) return [];
    return servidoresAutorizados.filter(s => 
      (s.nome || '').toLowerCase().includes(servidor.toLowerCase())
    ).slice(0, 5);
  }, [servidor, servidoresAutorizados, isValidServer]);

  const handleSelectServidor = (s: ServidorAutorizado) => {
    setServidor(s.nome);
    setSetor(s.setor || '');
    setIsValidServer(true);
    setShowSuggestions(false);
    
    if (s.setor === 'GABINETE' || s.setor === 'GABINETE-ADJUNTO') {
      setPrioridade('Alta');
    } else {
      setPrioridade('Média');
    }
  };

  const handleInputChange = (val: string) => {
    setServidor(val);
    setIsValidServer(false);
    setShowSuggestions(true);
  };

  const handleSearchPatrimonio = async () => {
    const tagToSearch = tagPatrimonio.trim();
    if (!tagToSearch) return;
    setIsLoadingPatrimonio(true);
    try {
      const { data, error } = await supabase
        .from('patrimonio')
        .eq('tag', tagToSearch)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setPatrimonioEncontrado(data);
      } else {
        showError("Patrimônio não encontrado.");
        setPatrimonioEncontrado(null);
      }
    } catch (err) {
      showError("Erro ao buscar patrimônio.");
      setPatrimonioEncontrado(null);
    } finally {
      setIsLoadingPatrimonio(false);
    }
  };

  const handleClear = () => {
    setServidor('');
    setSetor('');
    setAssunto('');
    setProblema('');
    setTagPatrimonio('');
    setPatrimonioEncontrado(null);
    setPrioridade('Média');
    setIsValidServer(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!servidor.trim() || !setor) {
      showError("Preencha seu nome e selecione o setor.");
      return;
    }

    setIsSubmitting(true);
    const finalPriority = (setor === 'GABINETE' || setor === 'GABINETE-ADJUNTO') ? 'Alta' : prioridade;

    try {
      await addTicket({
        servidor: servidor.trim(), 
        setor: setor,   
        assunto: assunto,
        problema: problema,
        prioridade: finalPriority as any,
        telefone: tagPatrimonio ? `Patrimônio: ${tagPatrimonio.trim()}` : undefined
      });
      localStorage.setItem('dti_last_server', servidor.trim());
      showSuccess(`✅ Chamado enviado com sucesso!`);
      handleClear();
    } catch (error: any) {
      showError(`Falha ao enviar: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = servidor.length > 2 && setor && assunto && problema;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col items-center justify-center p-4 font-sans relative animate-fade-in-up">
      <Link 
        to={isAuthenticated ? "/painel" : "/login"} 
        className="absolute top-6 right-6 p-2 text-[#3B82F6] hover:bg-white rounded-full transition-all duration-300 shadow-sm border border-[#E2E8F0] hover:scale-110"
        title="Acesso Administrativo"
      >
        <Settings className="w-6 h-6" />
      </Link>

      <Card className="max-w-xl w-full shadow-xl border-[#E2E8F0] rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-blue">
        <div className="h-2 bg-[#1E3A8A] w-full" />
        <CardHeader className="pb-4 pt-8 text-center border-b border-[#F1F5F9]">
          <div className="flex justify-center mb-4">
            <div className="px-8 py-2 bg-[#F1F5F9] border border-[#BFDBFE] rounded-full shadow-sm inline-block transition-transform duration-300 hover:scale-105 cursor-pointer">
              <span className="logo-flat text-4xl tracking-tight pb-1 pr-1">
                TechDept
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1E3A8A] tracking-tight">Prefeitura de Metropolitan</CardTitle>
          <CardDescription className="text-[#64748B] font-medium uppercase text-[11px] tracking-widest">Abertura de Chamado Técnico</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-8 px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 relative">
              <Label htmlFor="servidor" className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
                Nome do Servidor {isValidServer && <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
              </Label>
              <div className="relative">
                <Input 
                  value={servidor}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Digite seu nome..." 
                  className={cn(
                    "h-11 rounded-xl border-[#E2E8F0] focus:ring-[#3B82F6] bg-white text-[#1E293B] transition-all duration-200",
                    isValidServer && "border-emerald-200 bg-emerald-50/30"
                  )}
                  required 
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectServidor(s)}
                        className="w-full px-4 py-3 text-left hover:bg-[#F1F5F9] transition-colors flex flex-col"
                      >
                        <span className="text-sm font-bold text-[#1E293B]">{s.nome}</span>
                        <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest">{s.setor}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="setor" className="text-sm font-semibold text-[#1E293B]">Setor</Label>
                <Select 
                  value={setor} 
                  onValueChange={(v) => {
                    setSetor(v);
                    if (v === 'GABINETE' || v === 'GABINETE-ADJUNTO') setPrioridade('Alta');
                  }} 
                  required
                  disabled={isValidServer}
                >
                  <SelectTrigger className={cn(
                    "h-11 rounded-xl border-[#E2E8F0] bg-white text-[#1E293B]",
                    isValidServer && "opacity-80 bg-slate-50 cursor-not-allowed"
                  )}>
                    <SelectValue placeholder="Selecione o Setor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0]">
                    {SETORES_OFICIAIS.map(s => (
                      <SelectItem key={s} value={s} className="focus:bg-[#F1F5F9]">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patrimonio" className="text-sm font-semibold text-[#1E293B]">Nº Patrimônio (Opcional)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={tagPatrimonio}
                    onChange={(e) => setTagPatrimonio(e.target.value)}
                    placeholder="Ex: 12345" 
                    className="h-11 rounded-xl border-[#E2E8F0] focus:ring-[#3B82F6] bg-white text-[#1E293B]"
                  />
                  <Button 
                    type="button" 
                    onClick={handleSearchPatrimonio}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] h-11 w-11 p-0 rounded-xl"
                    disabled={!tagPatrimonio || isLoadingPatrimonio}
                  >
                    {isLoadingPatrimonio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {patrimonioEncontrado && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl animate-fade-in-up">
                <p className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest mb-1">Equipamento Identificado</p>
                <p className="text-xs font-bold text-[#1E3A8A]">{patrimonioEncontrado.tipo} - {patrimonioEncontrado.modelo}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="assunto" className="text-sm font-semibold text-[#1E293B]">Assunto</Label>
                <Select value={assunto} onValueChange={setAssunto} required>
                  <SelectTrigger className="h-11 rounded-xl border-[#E2E8F0] bg-white text-[#1E293B] transition-all duration-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0]">
                    {ASSUNTOS.map(a => (
                      <SelectItem key={a} value={a} className="focus:bg-[#F1F5F9]">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="problema" className="text-sm font-semibold text-[#1E293B]">Problema</Label>
                <Select value={problema} onValueChange={setProblema} required>
                  <SelectTrigger className="h-11 rounded-xl border-[#E2E8F0] bg-white text-[#1E293B] transition-all duration-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0]">
                    {PROBLEMAS.map(p => (
                      <SelectItem key={p} value={p} className="focus:bg-[#F1F5F9]">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prioridade" className="text-sm font-semibold text-[#1E293B]">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade} required disabled={setor === 'GABINETE' || setor === 'GABINETE-ADJUNTO'}>
                <SelectTrigger className="h-11 rounded-xl border-[#E2E8F0] bg-white text-[#1E293B] transition-all duration-200">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0]">
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              {(setor === 'GABINETE' || setor === 'GABINETE-ADJUNTO') && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Prioridade Alta Automática para Gabinete</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleClear}
                className="text-[#64748B] hover:text-[#1E293B] font-semibold text-sm transition-colors duration-200"
              >
                Limpar
              </Button>
              <Button 
                type="submit" 
                className={cn(
                  "bg-[#10B981] h-11 px-8 text-white font-bold rounded-xl shadow-md transition-all duration-200 active:scale-95",
                  !isFormValid ? "opacity-50 cursor-not-allowed" : "hover:bg-[#059669]"
                )} 
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? "Enviando..." : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" /> Enviar Chamado
                  </span>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex flex-col items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(true)}
              className="text-[#3B82F6] border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 rounded-xl w-full h-11"
            >
              <History className="w-4 h-4" />
              Ver Meus Chamados
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <footer className="mt-8 text-center space-y-1">
        <p className="text-[#64748B] text-[11px] font-bold uppercase tracking-widest">
          Prefeitura de Metropolitan • AdminDept
        </p>
        <p className="text-[10px] text-[#94A3B8] font-medium">
          © 2026 Dante Dias Monteiro | TechDept - AdminDept Metropolitan
        </p>
      </footer>

      <MyTicketsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        tickets={tickets}
        serverName={servidor || localStorage.getItem('dti_last_server') || ''}
      />
    </div>
  );
};

export default PublicRequest;