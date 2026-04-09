"use client";

import React from 'react';
import NOCMonitor from '@/components/features/NOCMonitor';
import NetworkDiagnostic from '@/components/features/NetworkDiagnostic';
import { ShieldCheck, Activity } from 'lucide-react';

const Network = () => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">Infraestrutura & Rede</h1>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">Monitoramento em Tempo Real TechDept</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest">Sistemas Operacionais</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <NOCMonitor />
        </div>
        <div className="lg:col-span-1">
          <NetworkDiagnostic />
        </div>
      </div>
    </div>
  );
};

export default Network;