"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Building2, Wrench, FileText, Send, RotateCcw, Loader2, MapPin } from 'lucide-react';
import { exportExternalReportPDF } from '@/utils/export-external-report';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

const ExternalSupport = () => {
  const currentUser = JSON.parse(localStorage.getItem('dti_user') || '{}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    orgao: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora: '08:00',
    pedido: '',
    solucao: '',
    materiais: ''
  });

  const handleClear = () => {
    setFormData({
      orgao: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: '08:00',
      pedido: '',
      solucao: '',
      materiais: ''
    });
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Salva na Agenda com tecnico_id
      const { error } = await supabase.from('agenda_secretaria').insert([{
        titulo: `ATENDIMENTO EXTERNO: ${formData.orgao}`,
        descricao: formData.pedido,
        data: formData.data,
        hora: formData.hora,
        tipo: 'evento',
        tecnico_id: currentUser.id
      }]);

      if (error) throw error;

      // 2. Dispara notificação por e-mail
      await supabase.functions.invoke('send-notification', {
        body: { 
          type: 'atendimento_externo', 
          data: formData, 
          tecnico: currentUser.name 
        }
      });

      // 3. Gera o PDF
      exportExternalReportPDF({
        ...formData,
        tecnico: currentUser.name || 'Técnico TechDept'
      });
      
      showSuccess("Atendimento registrado e e-mail enviado!");
      handleClear();
    } catch (err: any) {
      showError(`Erro ao processar registro: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up max-w-3xl mx-auto">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">Atendimento Externo</h1>
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">Registro de Suporte Técnico Fora da TechDept</p>
      </div>

      <Card className="bg-white border-[#E2E8F0] shadow-xl rounded-2xl overflow-hidden">
        <div className="h-2 bg-[#3B82F6] w-full" />
        <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC] py-6">
          <CardTitle className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#3B82F6]" /> Novo Registro de Atendimento
          </CardTitle>
          <CardDescription className="text-[#64748B]">Os dados serão salvos na agenda e enviados por e-mail.</CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleGenerateReport} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Órgão Solicitante</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-[#94A3B8]" />
                  <Input 
                    value={formData.orgao}
                    onChange={(e) => setFormData({...formData, orgao: e.target.value})}
                    placeholder="Ex: AdminDept"
                    className="pl-10 h-11 rounded-xl border-[#E2E8F0]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Data</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-[#94A3B8]" />
                  <Input 
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                    className="pl-10 h-11 rounded-xl border-[#E2E8F0]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Hora Início</Label>
                <Input 
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({...formData, hora: e.target.value})}
                  className="h-11 rounded-xl border-[#E2E8F0]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Descrição do Pedido</Label>
              <Textarea 
                value={formData.pedido}
                onChange={(e) => setFormData({...formData, pedido: e.target.value})}
                placeholder="O que foi solicitado?"
                className="min-h-[80px] rounded-xl border-[#E2E8F0]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Atividades Realizadas</Label>
              <Textarea 
                value={formData.solucao}
                onChange={(e) => setFormData({...formData, solucao: e.target.value})}
                placeholder="Quais procedimentos foram realizados?"
                className="min-h-[80px] rounded-xl border-[#E2E8F0]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">Materiais Utilizados</Label>
              <div className="relative">
                <Wrench className="absolute left-3 top-3 w-4 h-4 text-[#94A3B8]" />
                <Textarea 
                  value={formData.materiais}
                  onChange={(e) => setFormData({...formData, materiais: e.target.value})}
                  placeholder="Ex: 2 cabos HDMI, 1 Adaptador, etc."
                  className="pl-10 min-h-[60px] rounded-xl border-[#E2E8F0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleClear}
                className="text-[#64748B] hover:text-[#1E293B] font-bold text-xs uppercase tracking-widest"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Limpar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-md transition-all active:scale-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Finalizar & Notificar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExternalSupport;