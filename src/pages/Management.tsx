"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Users, 
  Plus, 
  Trash2, 
  Loader2, 
  UserCheck, 
  ShieldAlert, 
  UserPlus,
  Building2,
  Search,
  KeyRound,
  Lock
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const SETORES_OFICIAIS = [
  "TechDept", "GABINETE", "ATENDIMENTO", "PERÍCIA", "ARQUIVO", 
  "DAL", "DIARIO", "FOLHA", "MOVIMENTAÇÃO", "GABINETE-ADJUNTO", 
  "DDO", "JURIDICO", "DSO", "ENCARGOS"
];

interface Technician {
  id: string;
  nome: string;
  status: string;
  disponivel: boolean;
  nivel_acesso: string;
  senha?: string;
}

interface AuthorizedServer {
  id: string;
  nome: string;
  setor: string;
  status: string;
}

const Management = () => {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [servers, setServers] = useState<AuthorizedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Modais
  const [isAddTechOpen, setIsAddTechOpen] = useState(false);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  // Estados de Formulário
  const [newTech, setNewTech] = useState({ nome: '', cargo: 'tecnico' });
  const [newServer, setNewServer] = useState({ nome: '', setor: '' });
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('dti_user') || '{}');
  const isAdmin = currentUser.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [techsRes, serversRes] = await Promise.all([
        supabase.from('tecnicos').select('*').order('nome'),
        supabase.from('servidores_autorizados').select('*').order('nome')
      ]);

      if (techsRes.error) throw techsRes.error;
      if (serversRes.error) throw serversRes.error;

      setTechs(techsRes.data || []);
      setServers(serversRes.data || []);
    } catch (err) {
      showError("Erro ao carregar dados administrativos.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const { error } = await supabase.from('servidores_autorizados').insert([{
        nome: (newServer.nome || '').trim(),
        setor: newServer.setor,
        status: 'Ativo'
      }]);
      if (error) throw error;
      showSuccess("Servidor Cadastrado com Sucesso!");
      setIsAddServerOpen(false);
      setNewServer({ nome: '', setor: '' });
      fetchData();
    } catch (err) {
      showError("Erro ao autorizar servidor.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTech || !newPassword.trim()) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('tecnicos')
        .update({ senha: newPassword.trim() })
        .eq('id', selectedTech.id);

      if (error) throw error;
      showSuccess(`Senha de ${selectedTech.nome} atualizada!`);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setSelectedTech(null);
    } catch (err) {
      showError("Erro ao atualizar senha.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm("Remover este servidor da lista de autorizados?")) return;
    try {
      const { error } = await supabase.from('servidores_autorizados').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Servidor removido.");
      fetchData();
    } catch (err) {
      showError("Erro ao remover servidor.");
    }
  };

  // Filtro de Equipe: Apenas Marcos, Bruno e Dante
  const filteredTechs = useMemo(() => {
    const allowedNames = ['marcos', 'bruno', 'dante'];
    return techs.filter(t => 
      allowedNames.some(name => (t.nome || '').toLowerCase().includes(name))
    );
  }, [techs]);

  // Filtro de Servidores com Blindagem de Nulos
  const filteredServers = useMemo(() => {
    const search = (searchTerm || '').toLowerCase();
    return servers.filter(s => {
      const nome = (s.nome || '').toLowerCase();
      const setor = (s.setor || '').toLowerCase();
      return nome.includes(search) || setor.includes(search);
    });
  }, [servers, searchTerm]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 opacity-20" />
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500">Esta área é exclusiva para administradores do sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">Gerenciamento Administrativo</h1>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">Controle de Acessos e Equipe TechDept</p>
        </div>
      </div>

      <Tabs defaultValue="equipe" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#F1F5F9] p-1 rounded-xl h-12 border border-[#E2E8F0]">
          <TabsTrigger value="equipe" className="font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1E3A8A]">
            <Users className="w-4 h-4 mr-2" /> Equipe Técnica
          </TabsTrigger>
          <TabsTrigger value="servidores" className="font-bold text-[11px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1E3A8A]">
            <UserCheck className="w-4 h-4 mr-2" /> Servidores Autorizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipe" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-[#3B82F6]" /></div>
            ) : filteredTechs.map(tech => (
              <Card key={tech.id} className="bg-white border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm group hover:border-[#3B82F6]/30 transition-all">
                <div className={`h-1.5 w-full ${tech.disponivel ? 'bg-[#10B981]' : 'bg-slate-200'}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-[#F1F5F9] p-3 rounded-xl"><Users className="w-6 h-6 text-[#3B82F6]" /></div>
                    <Badge className="font-bold uppercase text-[9px] tracking-widest bg-blue-100 text-blue-700 border-blue-200">
                      {tech.nivel_acesso?.toUpperCase() || 'TÉCNICO'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-[#1E293B] mb-4">{tech.nome || 'Sem Nome'}</h3>
                  
                  <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Disponibilidade</span>
                      <Switch checked={tech.disponivel} onCheckedChange={async () => {
                        await supabase.from('tecnicos').update({ disponivel: !tech.disponivel }).eq('id', tech.id);
                        fetchData();
                      }} />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-[#E2E8F0] text-[#1E3A8A] font-bold text-[10px] uppercase tracking-widest h-9 rounded-xl hover:bg-blue-50"
                      onClick={() => {
                        setSelectedTech(tech);
                        setIsPasswordModalOpen(true);
                      }}
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-2" /> Alterar Senha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="servidores" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <Input 
                placeholder="Buscar servidor..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 h-11 rounded-xl border-[#E2E8F0]" 
              />
            </div>
            <Dialog open={isAddServerOpen} onOpenChange={setIsAddServerOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-md px-6">
                  <UserPlus className="w-4 h-4 mr-2" /> Novo Servidor
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-md">
                <DialogHeader><DialogTitle className="font-bold text-[#1E3A8A]">Autorizar Servidor</DialogTitle></DialogHeader>
                <form onSubmit={handleAddServer} className="space-y-6 py-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">Nome do Servidor</Label>
                    <Input 
                      value={newServer.nome} 
                      onChange={e => setNewServer({...newServer, nome: e.target.value})} 
                      className="rounded-xl h-12" 
                      placeholder="Ex: Analice Silva" 
                      required 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">Setor de Lotação</Label>
                    <Select value={newServer.setor} onValueChange={v => setNewServer({...newServer, setor: v})} required>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione o Setor" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {SETORES_OFICIAIS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-[#1E3A8A] text-white font-bold uppercase text-[11px] h-12 rounded-xl"
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Salvar Autorização"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-white border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[#1E3A8A] text-[10px] uppercase tracking-widest font-bold border-b border-[#E2E8F0]">
                    <th className="px-6 py-4">Nome do Servidor</th>
                    <th className="px-6 py-4">Setor / Lotação</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {loading ? (
                    <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-[#3B82F6]" /></td></tr>
                  ) : filteredServers.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-[#94A3B8] italic">Nenhum servidor encontrado.</td></tr>
                  ) : filteredServers.map(server => (
                    <tr key={server.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1E293B] text-sm">{server.nome || 'Sem Nome'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#3B82F6] uppercase tracking-widest">
                          <Building2 className="w-3.5 h-3.5" /> {server.setor || 'Sem Setor'}
                        </div>
                      </td>
                      <td className="px-6 py-4"><Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[9px] font-bold uppercase">Autorizado</Badge></td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteServer(server.id)} className="text-[#94A3B8] hover:text-red-600 h-9 w-9 rounded-full">
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Troca de Senha */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-[#1E3A8A] flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" /> Alterar Senha Técnica
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-6 py-4">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Técnico Selecionado</p>
              <p className="text-sm font-bold text-[#1E3A8A]">{selectedTech?.nome || '---'}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Nova Senha de Acesso</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                className="rounded-xl h-12" 
                placeholder="Mínimo 6 caracteres" 
                required 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</Button>
              <Button 
                type="submit" 
                className="bg-[#1E3A8A] text-white font-bold uppercase text-[11px] h-12 rounded-xl px-8"
                disabled={isActionLoading || !newPassword.trim()}
              >
                {isActionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirmar Alteração"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Management;