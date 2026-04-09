"use client";

import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Menu, 
  X, 
  Cog, 
  BarChart3, 
  Info, 
  HardDrive, 
  Users,
  PlusCircle,
  PieChart,
  LogOut,
  Activity,
  Calendar,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentUser = JSON.parse(localStorage.getItem('dti_user') || '{}');

  useEffect(() => {
    document.title = "PublicTech Logistics Manager";
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dti_auth');
    localStorage.removeItem('dti_user');
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Chamados Ativos', path: '/painel' },
    { icon: Calendar, label: 'Agenda da Secretaria', path: '/agenda' },
    { icon: MapPin, label: 'Atendimento Externo', path: '/atendimento-externo' },
    { icon: PieChart, label: 'Relatórios Gerenciais', path: '/relatorios' },
    { icon: Users, label: 'Gestão de Equipe', path: '/tecnicos' },
    { icon: Activity, label: 'Rede & NOC', path: '/rede' },
    { icon: HardDrive, label: 'Inventário Físico', path: '/equipamentos' },
    { icon: Settings, label: 'Gerenciamento', path: '/gerenciamento' },
    { icon: Info, label: 'Sobre o Sistema', path: '/sobre' },
  ];

  const TextLogo = () => (
    <div className="px-6 py-2 bg-[#F1F5F9] border border-[#BFDBFE] rounded-full shadow-sm transition-all duration-300 flex items-center justify-center">
      <span className="logo-flat text-3xl tracking-tight leading-none pb-1 pr-1">
        TechDept
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col md:flex-row font-sans">
      <div className="md:hidden bg-white p-4 flex justify-between items-center sticky top-0 z-[60] border-b border-[#E2E8F0]">
        <TextLogo />
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[#3B82F6]">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col border-r border-[#E2E8F0]",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-center border-b border-[#F1F5F9] bg-[#F1F5F9] h-24">
          <TextLogo />
        </div>
        
        <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item, idx) => (
            <Link
              key={`${item.path}-${idx}`}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === item.path 
                  ? "bg-[#1E3A8A] text-white shadow-md" 
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#3B82F6]"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-white" : "text-[#3B82F6]")} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC] space-y-4">
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-auto text-xs font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair do Sistema
          </Button>
          <div className="text-[10px] text-[#94A3B8] font-medium">
            © 2026 Dante Dias Monteiro<br />
            TechDept - AdminDept Metropolitan
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="hidden md:flex h-16 bg-[#F1F5F9] border-b border-[#1E3A8A] items-center px-8 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-[#1E3A8A] font-bold text-lg">Gestão de Chamados</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-[#1E3A8A] uppercase">{currentUser.name}</p>
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold">
                Acesso Administrativo Liberado
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 animate-fade-in-up">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;