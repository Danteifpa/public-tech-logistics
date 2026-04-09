"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ExternalLink, Shield, Zap, Monitor } from 'lucide-react';

const NOCMonitor = () => {
  const monitorUrl = "http://192.168.20.142:3001/status/semad";

  return (
    <div className="space-y-3 animate-fade-in-up h-full flex flex-col">
      {/* Header do NOC - Mais compacto */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#1E3A8A] p-2 md:p-3 rounded-xl border border-[#3B82F6]/30 shadow-lg gap-2">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="p-1.5 bg-[#3B82F6]/20 rounded-lg border border-[#3B82F6]/40">
            <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#60A5FA] animate-pulse" />
          </div>
          <div>
            <h2 className="text-[9px] md:text-[11px] font-black text-white uppercase tracking-[0.12em] md:tracking-[0.15em] flex items-center gap-2">
              NOC | CENTRAL DE OPERAÇÕES
            </h2>
            <p className="text-[7px] md:text-[8px] text-[#93C5FD] font-bold uppercase tracking-widest">Monitoramento AdminDept</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 md:gap-3 px-2 w-full sm:w-auto justify-center sm:justify-end border-t sm:border-t-0 border-[#3B82F6]/20 pt-1.5 sm:pt-0">
          <div className="flex items-center gap-1">
            <Shield className="w-2 h-2 md:w-2.5 md:h-2.5 text-[#10B981]" />
            <span className="text-[7px] md:text-[8px] font-bold text-[#10B981] uppercase tracking-tighter">Protegido</span>
          </div>
          <div className="h-2.5 w-[1px] bg-[#3B82F6]/30" />
          <div className="flex items-center gap-1">
            <Zap className="w-2 h-2 md:w-2.5 md:h-2.5 text-amber-400" />
            <span className="text-[7px] md:text-[8px] font-bold text-amber-400 uppercase tracking-tighter">Disponível</span>
          </div>
        </div>
      </div>

      {/* Card de Acesso - Altura reduzida e padding menor */}
      <Card className="bg-[#0F172A] border-[#1E293B] shadow-2xl rounded-2xl overflow-hidden border-2 group relative py-6 md:py-8 flex-1 flex flex-col justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        
        <CardContent className="relative flex flex-col items-center justify-center text-center space-y-3 md:space-y-4 px-4">
          <div className="p-2.5 md:p-3 bg-blue-500/10 rounded-full border border-blue-500/20 mb-0.5">
            <Monitor className="w-6 h-6 md:w-10 md:h-10 text-[#3B82F6] opacity-80" />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight">Monitoramento em Tempo Real</h3>
            <p className="text-[10px] md:text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Acesse o status detalhado de todos os serviços e servidores da rede AdminDept.
            </p>
          </div>

          <Button 
            asChild
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-[9px] md:text-[10px] uppercase tracking-[0.1em] h-10 md:h-12 px-6 md:px-8 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all duration-300 hover:scale-105 active:scale-95 group w-full sm:w-auto"
          >
            <a href={monitorUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse" />
              ACESSAR MONITORAMENTO
              <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          </Button>

          <div className="pt-1 flex items-center gap-1.5">
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-[7px] md:text-[9px] font-bold text-[#10B981] uppercase tracking-widest">Link Externo Seguro</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <div className="px-3 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full">
          <p className="text-[7px] md:text-[8px] text-[#94A3B8] font-bold uppercase tracking-[0.2em]">TechDept - AdminDept Metropolitan</p>
        </div>
      </div>
    </div>
  );
};

export default NOCMonitor;