import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TicketProvider } from "./context/TicketContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewTicket from "./pages/NewTicket";
import Management from "./pages/Management";
import Settings from "./pages/Settings";
import PublicRequest from "./pages/PublicRequest";
import Login from "./pages/Login";
import RegisterTeam from "./pages/RegisterTeam";
import NotFound from "./pages/NotFound";
import SecretaryDashboard from "./pages/SecretaryDashboard";
import About from "./pages/About";
import Equipments from "./pages/Equipments";
import Technicians from "./pages/Technicians";
import Reports from "./pages/Reports";
import Network from "./pages/Network";
import EquipmentDetail from "./pages/EquipmentDetail";
import ExternalSupport from "./pages/ExternalSupport";
import Agenda from "./pages/Agenda";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('dti_auth') === 'true';
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TicketProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicRequest />} />
            <Route path="/solicitar" element={<PublicRequest />} />
            <Route path="/login" element={<Login />} />
            <Route path="/equipe/registro" element={<RegisterTeam />} />
            
            {/* Rotas de Patrimônio (QR Code) */}
            <Route path="/inventario/detalhes" element={<EquipmentDetail />} />
            <Route path="/patrimonio/:tag" element={<EquipmentDetail />} />
            <Route path="/equipamento/:tag" element={<EquipmentDetail />} />
            
            {/* Rotas Protegidas */}
            <Route path="/painel" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
            <Route path="/equipamentos" element={<PrivateRoute><Equipments /></PrivateRoute>} />
            <Route path="/atendimento-externo" element={<PrivateRoute><ExternalSupport /></PrivateRoute>} />
            <Route path="/analise" element={<PrivateRoute><SecretaryDashboard /></PrivateRoute>} />
            <Route path="/novo" element={<PrivateRoute><NewTicket /></PrivateRoute>} />
            <Route path="/sobre" element={<PrivateRoute><About /></PrivateRoute>} />
            <Route path="/tecnicos" element={<PrivateRoute><Technicians /></PrivateRoute>} />
            <Route path="/relatorios" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/rede" element={<PrivateRoute><Network /></PrivateRoute>} />
            <Route path="/gerenciamento" element={<PrivateRoute><Management /></PrivateRoute>} />
            <Route path="/configuracoes" element={<PrivateRoute><Settings /></PrivateRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TicketProvider>
  </QueryClientProvider>
);

export default App;