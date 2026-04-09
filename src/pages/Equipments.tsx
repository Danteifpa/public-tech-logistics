"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
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
import { 
  Monitor, 
  Plus, 
  MapPin,
  Trash2,
  Loader2,
  Search,
  Printer,
  Share2,
  RotateCcw,
  User,
  Calendar,
  QrCode,
  Wrench,
  Building2,
  Cpu
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { exportEquipmentSheetPDF } from '@/utils/export-equipment-sheet';
import { exportLoanTermPDF } from '@/utils/export-loan-term';
import { cn } from '@/lib/utils';
import QRCodeModal from '@/components/features/QRCodeModal';
import { format, addDays } from 'date-fns';
import { Patrimonio } from '../types/patrimonio';

const SETORES = [
  "TechDept", "GABINETE", "ATENDIMENTO", "PERÍCIA", "ARQUIVO", 
  "DAL", "DIARIO", "FOLHA", "MOVIMENTAÇÃO", "GABINETE-ADJUNTO", 
  "DDO", "JURIDICO", "DSO", "ENCARGOS"
];

const SECRETARIAS = [
  "AdminDept", "SESAU", "SEMED", "SEMCAT", "SEMURB", "SEMUTRAN", 
  "SEMFIN", "SEMGOV", "SEMHAB", "SEMMA", "SEMPES", "SEMSA", 
  "SEMSEG", "SEMSUR", "SEMEL", "SEMIC", "SEMPA"
];

const TIPOS = ["PC", "Notebook", "Impressora", "Monitor", "Switch"];
const FORNECEDORES = ["Locdesk", "Central TI", "Próprio"];

const Equipments = () => {
  const [equipments, setEquipments] = useState<Patrimonio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<Patrimonio | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('dti_user') || '{}');

  const [loanForm, setLoanForm] = useState({
    nome: '',
    matricula: '',
    secretaria: '',
    data_devolucao: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    observacoes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    motivo: '',
    fornecedor_destino: '',
    data_saida: format(new Date(), 'yyyy-MM-dd')
  });

  const [formData, setFormData] = useState({
    tag: '',
    tipo: '',
    modelo: '',
    setor: '',
    especificacoes: '',
    configuracao: '',
    fornecedor: '',
    vencimento_contrato: ''
  });

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patrimonio')
        .select('*')
        .order('tag', { ascending: true });

      if (error) throw error;
      setEquipments(data || []);
    } catch (err: any) {
      showError("Erro ao carregar patrimônio");
    } finally {
      setLoading(false);
    }
  };

  const handleLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquip || !loanForm.secretaria || !loanForm.data_devolucao) return;
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('patrimonio')
        .update({
          status: 'Emprestado',
          local_atual: loanForm.secretaria,
          responsavel_nome: loanForm.nome,
          responsavel_matricula: loanForm.matricula,
          especificacoes: loanForm.observacoes
        })
        .eq('id', selectedEquip.id);

      if (error) throw error;

      await supabase.from('agenda_secretaria').insert([{
        titulo: `DEVOLUÇÃO: TAG ${selectedEquip.tag} (${loanForm.nome})`,
        descricao: `Equipamento: ${selectedEquip.tipo} ${selectedEquip.modelo}. Local: ${loanForm.secretaria}`,
        data: loanForm.data_devolucao,
        hora: '09:00',
        tipo: 'devolucao',
        tecnico_id: currentUser.id
      }]);

      exportLoanTermPDF(selectedEquip, loanForm);
      showSuccess("Empréstimo registrado e lembrete criado na Agenda!");
      setIsLoanOpen(false);
      setLoanForm({ 
        nome: '', 
        matricula: '', 
        secretaria: '', 
        data_devolucao: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        observacoes: ''
      });
      fetchEquipments();
    } catch (err: any) {
      showError(`Erro ao registrar empréstimo: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquip) return;
    setIsActionLoading(true);
    try {
      const { error: equipError } = await supabase
        .from('patrimonio')
        .update({
          status: 'EM MANUTENÇÃO',
          local_atual: maintenanceForm.fornecedor_destino || 'TechDept (Interno)'
        })
        .eq('id', selectedEquip.id);

      if (equipError) throw equipError;

      const { error: historyError } = await supabase
        .from('chamados')
        .insert([{
          servidor: 'SISTEMA / TechDept',
          setor: selectedEquip.setor,
          assunto: `MANUTENÇÃO: TAG ${selectedEquip.tag}`,
          problema: `Motivo: ${maintenanceForm.motivo} | Destino: ${maintenanceForm.fornecedor_destino || 'Interno'} | Saída: ${maintenanceForm.data_saida}`,
          status: 'Em Atendimento',
          prioridade: 'Média',
          telefone: selectedEquip.tag,
          atendente: currentUser.name,
          atendente_id: currentUser.id
        }]);

      if (historyError) throw historyError;

      showSuccess("Equipamento enviado para manutenção!");
      setIsMaintenanceOpen(false);
      setMaintenanceForm({ motivo: '', fornecedor_destino: '', data_saida: format(new Date(), 'yyyy-MM-dd') });
      fetchEquipments();
    } catch (err: any) {
      showError(`Erro ao registrar manutenção: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReturn = async (equip: Patrimonio) => {
    if (!confirm(`Confirmar devolução do equipamento TAG ${equip.tag}?`)) return;
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
        .eq('id', equip.id);

      if (error) throw error;
      showSuccess("Equipamento devolvido ao estoque!");
      fetchEquipments();
    } catch (err: any) {
      showError(`Erro ao processar devolução: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return equipments.filter(e => {
      const matchesSearch = 
        e.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.fornecedor && e.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.responsavel_nome && e.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSector = filterSector === "all" || e.setor === filterSector;
      
      return matchesSearch && matchesSector;
    });
  }, [equipments, searchTerm, filterSector]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('patrimonio').insert([{
        ...formData,
        status: 'Ativo'
      }]);
      if (error) throw error;
      showSuccess("Equipamento cadastrado!");
      setIsAddOpen(false);
      setFormData({ tag: '', tipo: '', modelo: '', setor: '', especificacoes: '', configuracao: '', fornecedor: '', vencimento_contrato: '' });
      fetchEquipments();
    } catch (err: any) {
      showError("Erro ao cadastrar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este item do patrimônio?")) return;
    try {
      const { error } = await supabase.from('patrimonio').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Item removido");
      fetchEquipments();
    } catch (err) {
      showError("Erro ao remover");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">Inventário de Patrimônio</h1>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">Gestão de Ativos e Cautela TechDept</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input 
              placeholder="Buscar TAG, setor, fornecedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-[#E2E8F0] focus:ring-[#3B82F6]"
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-md px-6">
                <Plus className="w-4 h-4 mr-2" /> Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-lg">
              <DialogHeader><DialogTitle className="font-bold text-[#1E3A8A]">Cadastrar Patrimônio</DialogTitle></DialogHeader>
              <form onSubmit={handleAddEquipment} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">TAG / Nº</Label>
                    <Input value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} required placeholder="Ex: 12345" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">Tipo</Label>
                    <Select onValueChange={v => setFormData({...formData, tipo: v})} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-white">{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Marca / Modelo</Label>
                  <Input value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} required placeholder="Ex: Samsung .164" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Configuração Técnica (Unificado)</Label>
                  <Textarea 
                    value={formData.configuracao} 
                    onChange={e => setFormData({...formData, configuracao: e.target.value})} 
                    placeholder="Ex: i5 12th, 16GB RAM, 512GB SSD" 
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">Fornecedor</Label>
                    <Select onValueChange={v => setFormData({...formData, fornecedor: v})} required>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-white">{FORNECEDORES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase">Vencimento Contrato</Label>
                    <Input type="date" value={formData.vencimento_contrato} onChange={e => setFormData({...formData, vencimento_contrato: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Setor</Label>
                  <Select onValueChange={v => setFormData({...formData, setor: v})} required>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent className="bg-white">{SETORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button type="submit" className="w-full bg-[#1E3A8A] text-white font-bold uppercase text-[11px] h-12 rounded-xl">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-white border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="border-b border-[#F1F5F9] flex flex-row items-center justify-between bg-[#F8FAFC] py-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1E3A8A]">
            <Monitor className="w-4 h-4 text-[#3B82F6]" /> Ativos Cadastrados
          </CardTitle>
          <Select value={filterSector} onValueChange={setFilterSector}>
            <SelectTrigger className="w-[160px] h-9 bg-white border-[#E2E8F0] text-[11px] font-bold uppercase tracking-widest rounded-lg">
              <SelectValue placeholder="Filtrar Setor" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Todos os Setores</SelectItem>
              {SETORES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#3B82F6]" />
              <p className="text-[11px] font-bold uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F1F5F9] text-[#1E3A8A] text-[10px] uppercase tracking-widest font-bold border-b border-[#E2E8F0]">
                    <th className="px-6 py-4">TAG/Nº</th>
                    <th className="px-6 py-4">Equipamento</th>
                    <th className="px-6 py-4">Configuração</th>
                    <th className="px-6 py-4">Local / Responsável</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8] italic text-sm">Nenhum item encontrado.</td></tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors group">
                        <td className="px-6 py-4"><Badge variant="outline" className="font-mono text-[11px] text-[#1E3A8A] border-[#E2E8F0] bg-white">{item.tag || 'S/P'}</Badge></td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#1E293B] text-sm">{item.modelo}</div>
                          <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">{item.tipo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#64748B]">
                            <Cpu className="w-3 h-3 text-[#3B82F6]" />
                            <span className="truncate max-w-[150px]">{item.configuracao || 'Não informada'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.status === 'Emprestado' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[11px] font-bold text-amber-600 uppercase tracking-widest">
                                <Building2 className="w-3.5 h-3.5" /> {item.local_atual}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] uppercase">
                                <User className="w-3 h-3" /> {item.responsavel_nome}
                              </div>
                            </div>
                          ) : item.status === 'EM MANUTENÇÃO' ? (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-orange-600 uppercase tracking-widest">
                              <Wrench className="w-3.5 h-3.5" /> {item.local_atual || 'Manutenção'}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] font-bold text-[#1E3A8A] uppercase tracking-widest">
                              <MapPin className="w-3.5 h-3.5 text-[#3B82F6]" /> {item.setor}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={cn(
                            "text-[10px] font-bold uppercase",
                            item.status === 'Ativo' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                            item.status === 'Emprestado' ? "bg-amber-100 text-amber-700 border-amber-200" :
                            item.status === 'EM MANUTENÇÃO' ? "bg-orange-100 text-orange-700 border-orange-200" :
                            "bg-slate-100 text-slate-700 border-slate-200"
                          )}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-[#3B82F6] hover:bg-blue-50 h-9 w-9" 
                              onClick={() => {
                                setSelectedEquip(item);
                                setIsQRModalOpen(true);
                              }}
                              title="Gerar QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-[#3B82F6] hover:bg-blue-50 h-9 w-9" onClick={() => exportEquipmentSheetPDF(item, [])}>
                              <Printer className="w-4 h-4" />
                            </Button>
                            
                            {item.status === 'Ativo' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-[10px] uppercase h-8 rounded-lg"
                                  onClick={() => {
                                    setSelectedEquip(item);
                                    setIsLoanOpen(true);
                                  }}
                                >
                                  <Share2 className="w-3 h-3 mr-1" /> Emprestar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-orange-200 text-orange-700 hover:bg-orange-50 font-bold text-[10px] uppercase h-8 rounded-lg"
                                  onClick={() => {
                                    setSelectedEquip(item);
                                    setIsMaintenanceOpen(true);
                                  }}
                                >
                                  <Wrench className="w-3 h-3 mr-1" /> Manutenção
                                </Button>
                              </>
                            )}

                            {(item.status === 'Emprestado' || item.status === 'EM MANUTENÇÃO') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-[10px] uppercase h-8 rounded-lg"
                                onClick={() => handleReturn(item)}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" /> Devolver
                              </Button>
                            )}
                            
                            <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-red-600 h-9 w-9" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isLoanOpen} onOpenChange={setIsLoanOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-[#1E3A8A] flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-500" /> Registrar Empréstimo (Cautela)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLoan} className="space-y-4 py-4">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-2">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Equipamento Selecionado</p>
              <p className="text-xs font-bold text-[#1E3A8A]">{selectedEquip?.tag} - {selectedEquip?.modelo}</p>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Nome do Responsável</Label>
              <Input 
                value={loanForm.nome} 
                onChange={e => setLoanForm({...loanForm, nome: e.target.value})} 
                required 
                placeholder="Nome completo do servidor" 
                className="rounded-xl"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Matrícula</Label>
                <Input 
                  value={loanForm.matricula} 
                  onChange={e => setLoanForm({...loanForm, matricula: e.target.value})} 
                  required 
                  placeholder="000.000-0" 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Secretaria Destino</Label>
                <Select onValueChange={v => setLoanForm({...loanForm, secretaria: v})} required>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {SECRETARIAS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Data Prevista de Devolução</Label>
              <Input 
                type="date" 
                value={loanForm.data_devolucao} 
                onChange={e => setLoanForm({...loanForm, data_devolucao: e.target.value})} 
                required 
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Descrição/Observações do Equipamento</Label>
              <Textarea 
                value={loanForm.observacoes}
                onChange={e => setLoanForm({...loanForm, observacoes: e.target.value})}
                placeholder="Ex: Acompanha carregador e mouse, equipamento sem avarias"
                className="rounded-xl min-h-[80px]"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsLoanOpen(false)}>Cancelar</Button>
              <Button 
                type="submit" 
                className="bg-[#1E3A8A] text-white font-bold uppercase text-[11px] h-12 rounded-xl px-8"
                disabled={isActionLoading}
              >
                {isActionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirmar e Gerar Termo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-orange-600 flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Registrar Manutenção / Troca
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMaintenance} className="space-y-4 py-4">
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl mb-2">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Equipamento Selecionado</p>
              <p className="text-xs font-bold text-[#1E3A8A]">{selectedEquip?.tag} - {selectedEquip?.modelo}</p>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase">Motivo da Manutenção</Label>
              <Textarea 
                value={maintenanceForm.motivo} 
                onChange={e => setMaintenanceForm({...maintenanceForm, motivo: e.target.value})} 
                required 
                placeholder="Descreva o problema ou motivo da troca..." 
                className="rounded-xl min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Destino / Fornecedor</Label>
                <Select onValueChange={v => setMaintenanceForm({...maintenanceForm, fornecedor_destino: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Interno (TechDept)" /></SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="TechDept (Interno)">TechDept (Interno)</SelectItem>
                    <SelectItem value="LOCDESK">LOCDESK</SelectItem>
                    <SelectItem value="CENTRAL TI">CENTRAL TI</SelectItem>
                    <SelectItem value="GARANTIA FABRICANTE">GARANTIA FABRICANTE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Data de Saída</Label>
                <Input 
                  type="date" 
                  value={maintenanceForm.data_saida} 
                  onChange={e => setMaintenanceForm({...maintenanceForm, data_saida: e.target.value})} 
                  className="rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsMaintenanceOpen(false)}>Cancelar</Button>
              <Button 
                type="submit" 
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[11px] h-12 rounded-xl px-8"
                disabled={isActionLoading}
              >
                {isActionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Registrar Saída"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <QRCodeModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        equipment={selectedEquip} 
      />
    </div>
  );
};

export default Equipments;