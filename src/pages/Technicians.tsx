import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Users, Plus, Trash2, Loader2, UserCheck, UserX, ShieldAlert, Briefcase } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface Technician {
  id: string;
  nome: string;
  status: string;
  disponivel: boolean;
  nivel_acesso: string;
}

const Technicians = () => {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('tecnico');

  useEffect(() => {
    fetchTechs();
  }, []);

  const fetchTechs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tecnicos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setTechs(data || []);
    } catch (err) {
      showError("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      const { error } = await supabase.from('tecnicos').insert([{
        nome: nome.trim(),
        matricula: nome.trim().toLowerCase().replace(/\s+/g, '-'), 
        senha: 'suportedti',
        nivel_acesso: cargo,
        status: 'Ativo',
        disponivel: true
      }]);
      
      if (error) throw error;
      
      showSuccess("Membro da equipe cadastrado!");
      setIsAddOpen(false);
      setNome('');
      fetchTechs();
    } catch (err) {
      showError("Erro ao cadastrar. Verifique se este nome já existe.");
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('tecnicos')
        .update({ disponivel: !current })
        .eq('id', id);
      if (error) throw error;
      fetchTechs();
    } catch (err) {
      showError("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja remover este membro da equipe?")) return;
    try {
      const { error } = await supabase.from('tecnicos').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Removido com sucesso");
      fetchTechs();
    } catch (err) {
      showError("Erro ao remover.");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">Gerenciar Equipe</h1>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">Controle de Técnicos e Estagiários</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-md px-6">
              <Plus className="w-4 h-4 mr-2" /> Novo Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="font-bold text-[#1E3A8A] text-lg">Cadastrar na Equipe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTech} className="space-y-6 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Nome Completo</Label>
                <Input 
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="border-[#E2E8F0] focus:ring-[#3B82F6] rounded-xl h-12"
                  placeholder="Ex: Marcos Silva"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Cargo / Função</Label>
                <Select value={cargo} onValueChange={setCargo}>
                  <SelectTrigger className="h-12 rounded-xl border-[#E2E8F0]">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="tecnico">Técnico de Suporte</SelectItem>
                    <SelectItem value="estagiario">Estagiário de TI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest mb-1">Acesso Padrão</p>
                <p className="text-[11px] text-[#1E3A8A]">Senha inicial: <span className="font-bold">suportedti</span></p>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold uppercase text-[11px] tracking-widest h-12 rounded-xl">
                  Finalizar Cadastro
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-[#3B82F6]" /></div>
        ) : techs.map(tech => (
          <Card key={tech.id} className="bg-white border-[#E2E8F0] hover:border-[#3B82F6]/30 transition-all rounded-2xl overflow-hidden shadow-sm group">
            <div className={`h-1.5 w-full ${tech.disponivel ? 'bg-[#10B981]' : 'bg-slate-200'}`} />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#F1F5F9] p-3 rounded-xl border border-[#E2E8F0]">
                  <Users className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <Badge className={cn(
                  "font-bold uppercase text-[9px] tracking-widest",
                  tech.nivel_acesso === 'admin' ? "bg-purple-100 text-purple-700 border-purple-200" : 
                  tech.nivel_acesso === 'estagiario' ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200"
                )}>
                  {tech.nivel_acesso === 'admin' ? 'Admin' : tech.nivel_acesso === 'estagiario' ? 'Estagiário' : 'Técnico'}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-[#1E293B] tracking-tight mb-4">{tech.nome}</h3>
              
              <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  {tech.disponivel ? <UserCheck className="w-4 h-4 text-[#10B981]" /> : <UserX className="w-4 h-4 text-[#94A3B8]" />}
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                    {tech.disponivel ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <Switch 
                    checked={tech.disponivel} 
                    onCheckedChange={() => toggleAvailability(tech.id, tech.disponivel)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tech.id)} className="text-[#94A3B8] hover:text-red-600 h-9 w-9 rounded-full">
                    <Trash2 className="w-4.5 h-4.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Technicians;