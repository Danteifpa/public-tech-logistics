"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UserPlus, ShieldAlert, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

const RegisterTechnician = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !password.trim()) {
      showError("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const matriculaAuto = fullName.toLowerCase().replace(/\s+/g, '-');

    try {
      const { error } = await supabase.from('tecnicos').insert([{
        nome: fullName,
        matricula: matriculaAuto,
        senha: password,
        nivel_acesso: 'tecnico',
        status: 'Ativo',
        disponivel: true
      }]);

      if (error) {
        if (error.code === '23505') throw new Error("Este nome já está cadastrado no sistema.");
        throw error;
      }

      showSuccess("Cadastro realizado! Agora você pode entrar no sistema.");
      navigate('/login');
    } catch (err: any) {
      showError(err.message || "Erro ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans animate-fade-in-up">
      <Card className="max-w-md w-full shadow-2xl border-[#E2E8F0] bg-white rounded-2xl overflow-hidden">
        <div className="h-2 bg-[#10B981] w-full" />
        <CardHeader className="text-center space-y-2 pt-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-50 rounded-full border border-emerald-100">
              <UserPlus className="w-8 h-8 text-[#10B981]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Auto-Cadastro de Equipe</CardTitle>
          <CardDescription className="text-[#64748B] font-medium">TechDept - Secretaria Municipal de Administração</CardDescription>
        </CardHeader>
        
        <CardContent className="px-8 pb-10 space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-amber-700 uppercase leading-tight">
              Acesso restrito a servidores e estagiários autorizados da AdminDept Metropolitan.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-[#1E293B]">Nome</Label>
                <Input 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: João"
                  className="rounded-xl h-11 border-[#E2E8F0]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-[#1E293B]">Sobrenome</Label>
                <Input 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Silva"
                  className="rounded-xl h-11 border-[#E2E8F0]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-[#1E293B]">Criar Senha de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#94A3B8]" />
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="rounded-xl h-11 pl-11 border-[#E2E8F0]"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 h-12 font-bold text-sm uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finalizar Cadastro"}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <Link to="/login" className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center justify-center gap-2">
              <ArrowLeft className="w-3 h-3" /> Já tenho cadastro / Voltar ao Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterTechnician;