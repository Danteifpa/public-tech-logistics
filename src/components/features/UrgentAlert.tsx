"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UrgentAlertProps {
  ticket: {
    id: string;
    servidor: string;
    setor: string;
  };
  onClose: (id: string) => void;
}

const UrgentAlert = ({ ticket, onClose }: UrgentAlertProps) => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 animate-fade-in-up">
      <Card className="bg-red-600 border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)] overflow-hidden relative group">
        {/* Animação de Pulso de Fundo */}
        <div className="absolute inset-0 bg-red-500 animate-ping opacity-20 pointer-events-none" />
        
        <CardContent className="p-4 flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-2 rounded-full animate-pulse">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-0.5">
              🚨 NOVO CHAMADO URGENTE
            </h3>
            <div className="text-white/90">
              <p className="text-sm font-bold leading-tight">{ticket.servidor}</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{ticket.setor}</p>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onClose(ticket.id)}
            className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardContent>
        
        {/* Barra de progresso decorativa */}
        <div className="h-1 bg-white/30 w-full overflow-hidden">
          <div className="h-full bg-white animate-[progress_5s_linear_infinite]" style={{ width: '100%' }} />
        </div>
      </Card>
    </div>
  );
};

export default UrgentAlert;