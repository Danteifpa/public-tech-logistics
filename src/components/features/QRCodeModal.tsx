"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from 'lucide-react';
import { Patrimonio } from '../../types/patrimonio';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Patrimonio | null;
}

const QRCodeModal = ({ isOpen, onClose, equipment }: QRCodeModalProps) => {
  if (!equipment) return null;

  const qrUrl = `https://suporte.masternerd.com.br/inventario/detalhes?tag=${equipment.tag}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-[#E2E8F0] rounded-2xl max-w-sm p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <DialogTitle className="text-lg font-bold text-[#1E3A8A] flex items-center gap-2">
            QR Code de Identificação
          </DialogTitle>
        </DialogHeader>

        <div className="p-8 flex flex-col items-center justify-center space-y-6 print:p-0">
          {/* Área do QR Code para Impressão */}
          <div id="qr-code-area" className="bg-white p-6 rounded-2xl border-2 border-[#F1F5F9] shadow-sm flex flex-col items-center space-y-4">
            <div className="px-4 py-1 bg-[#1E3A8A] rounded-full mb-2">
              <span className="text-white font-black text-sm tracking-tighter">TechDept AdminDept</span>
            </div>
            
            <QRCodeSVG 
              value={qrUrl} 
              size={180}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%231E3A8A%22/><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2250%22 font-family=%22Saira Stencil One%22 fill=%22white%22>TechDept</text></svg>",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />

            <div className="text-center">
              <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-1">Patrimônio / TAG</p>
              <p className="text-2xl font-black text-[#1E3A8A] tracking-tighter">{equipment.tag}</p>
            </div>
          </div>

          <p className="text-[10px] text-[#94A3B8] font-medium text-center px-4">
            Este código permite o acesso rápido à ficha técnica e histórico do equipamento via dispositivos móveis.
          </p>
        </div>

        <DialogFooter className="p-4 bg-[#F1F5F9] border-t border-[#E2E8F0] flex gap-2 sm:justify-center">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 border-[#E2E8F0] text-[#64748B] font-bold uppercase text-[10px] tracking-widest h-10 rounded-xl"
          >
            Fechar
          </Button>
          <Button 
            onClick={handlePrint}
            className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold uppercase text-[10px] tracking-widest h-10 rounded-xl shadow-md"
          >
            <Printer className="w-3.5 h-3.5 mr-2" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;