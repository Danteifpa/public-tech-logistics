import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, User, Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const Login = () => {
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Busca o usuário pelo nome ou matrícula (admin)
      const { data: user, error } = await supabase
        .from('tecnicos')
        .select('*')
        .or(`nome.eq.${nome.trim()},matricula.eq.${nome.trim()}`)
        .eq('senha', password)
        .eq('status', 'Ativo')
        .single();

      if (error || !user) {
        showError("Credenciais incorretas ou usuário inativo.");
        return;
      }

      localStorage.setItem('dti_auth', 'true');
      localStorage.setItem('dti_user', JSON.stringify({
        id: user.id,
        name: user.nome,
        role: user.nivel_acesso // 'admin', 'tecnico' ou 'estagiario'
      }));

      showSuccess(`Bem-vindo, ${user.nome}!`);
      
      // Redirecionamento estratégico: Admin vai para Relatórios, outros para Chamados
      if (user.nivel_acesso === 'admin') {
        navigate('/relatorios');
      } else {
        navigate('/painel');
      }
      
    } catch (err) {
      showError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans animate-fade-in-up">
      <Card className="max-w-md w-full shadow-2xl border-[#E2E8F0] bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-blue">
        <div className="h-2 bg-[#1E3A8A] w-full" />
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="flex justify-center mb-4">
            <div className="px-6 py-2 bg-[#F1F5F9] border border-[#BFDBFE] rounded-full shadow-sm inline-block transition-transform duration-300 hover:scale-105 cursor-pointer">
              <span className="logo-flat text-3xl tracking-tight bg-gradient-to-r from-[#1E3A8A] to-[#10B981] bg-clip-text text-transparent">
                TechDept - AdminDept
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Acesso Administrativo</CardTitle>
          <CardDescription className="text-[#64748B] font-medium">Gestão técnica da Prefeitura de Metropolitan</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-sm font-semibold text-[#1E293B]">Usuário ou Nome</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#3B82F6]" />
                <Input 
                  id="nome" 
                  value={nome} 
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-white border-[#E2E8F0] text-[#1E293B] pl-11 h-11 rounded-xl focus:ring-[#3B82F6] transition-all duration-200"
                  placeholder="Ex: admin ou seu nome"
                  required 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-[#1E293B]">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#94A3B8]" />
                <Input 
                  id="password" 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-[#E2E8F0] text-[#1E293B] pl-11 h-11 rounded-xl focus:ring-[#3B82F6] transition-all duration-200"
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 h-12 font-bold text-sm uppercase tracking-widest rounded-xl shadow-md transition-all duration-200 active:scale-95 mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar no Sistema"}
            </Button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">
              Prefeitura de Metropolitan • AdminDept
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;