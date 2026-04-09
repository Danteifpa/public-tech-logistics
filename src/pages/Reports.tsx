"use client";

import React, { useState, useMemo } from 'react';
import { useTicketContext } from '../context/TicketContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  Activity, 
  Calendar,
  FileBarChart,
  Monitor,
  CheckCircle2,
  FileText,
  Share2,
  MapPin,
  User,
  FileDown,
  ShieldAlert
} from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfYear, 
  isWithinInterval, 
  parseISO,
  format,
  subDays,
  eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportManagementPDF } from '@/utils/export-management-pdf';
import { exportLoanTermPDF } from '@/utils/export-loan-term';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Reports = () => {
  const { tickets } = useTicketContext();
  const [period, setPeriod] = useState('month');
  const [patrimonios, setPatrimonios] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchPatrimonio = async () => {
      const { data } = await supabase.from('patrimonio').select('*');
      setPatrimonios(data || []);
    };
    fetchPatrimonio();
  }, []);

  const { filteredTickets, periodLabel } = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    let label = "";

    if (period === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
      label = format(now, 'MMMM yyyy', { locale: ptBR });
    } else if (period === 'last_month') {
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      label = format(lastMonth, 'MMMM yyyy', { locale: ptBR });
    } else {
      start = startOfYear(now);
      end = now;
      label = `Ano ${format(now, 'yyyy')}`;
    }

    const filtered = tickets.filter(t => {
      const date = parseISO(t.created_at);
      return isWithinInterval(date, { start, end });
    });

    return { filteredTickets: filtered, periodLabel: label };
  }, [tickets, period]);

  const barChartData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTickets = tickets.filter(t => t.created_at.startsWith(dayStr));
      
      return {
        name: format(day, 'dd/MM', { locale: ptBR }),
        abertos: dayTickets.filter(t => t.status === 'Aberto' || t.status === 'Em Atendimento').length,
        concluidos: dayTickets.filter(t => t.status === 'Concluído').length
      };
    });
  }, [tickets]);

  const pieChartData = useMemo(() => {
    const types: Record<string, number> = {};
    patrimonios.forEach(p => {
      types[p.tipo] = (types[p.tipo] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [patrimonios]);

  const kpis = useMemo(() => {
    const pending = tickets.filter(t => t.status === 'Aberto' || t.status === 'Em Atendimento').length;
    const loans = patrimonios.filter(p => p.status === 'Emprestado').length;
    return {
      totalAssets: patrimonios.length,
      pendingTickets: pending,
      loanCount: loans,
      uptime: "99.8%"
    };
  }, [patrimonios, tickets]);

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">Análise Estratégica TechDept AdminDept</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-[#E2E8F0] h-11">
            <Calendar className="w-4 h-4 text-[#3B82F6] ml-2" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full md:w-[160px] border-none shadow-none focus:ring-0 h-8 font-bold text-[11px] uppercase tracking-wider">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="month">Mês Atual</SelectItem>
                <SelectItem value="last_month">Mês Passado</SelectItem>
                <SelectItem value="year">Ano Inteiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[11px] uppercase tracking-widest h-11 rounded-xl shadow-md px-6 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            onClick={() => exportManagementPDF(filteredTickets, patrimonios, periodLabel)}
          >
            <FileText className="w-4 h-4" /> GERAR PDF DE GESTÃO
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-soft-blue transition-all duration-300">
          <div className="h-1.5 bg-[#3B82F6] w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Monitor className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-[0.2em]">Inventário</span>
            </div>
            <div className="text-4xl font-black text-[#1E293B] tracking-tighter">{kpis.totalAssets}</div>
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-widest mt-1">Total de Ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-soft-blue transition-all duration-300">
          <div className="h-1.5 bg-amber-500 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Pendências</span>
            </div>
            <div className="text-4xl font-black text-[#1E293B] tracking-tighter">{kpis.pendingTickets}</div>
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-widest mt-1">Chamados Pendentes</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden group hover:shadow-soft-blue transition-all duration-300">
          <div className="h-1.5 bg-[#10B981] w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Activity className="w-6 h-6 text-[#10B981]" />
              </div>
              <span className="text-[10px] font-black text-[#10B981] uppercase tracking-[0.2em]">Infraestrutura</span>
            </div>
            <div className="text-4xl font-black text-[#1E293B] tracking-tighter">{kpis.uptime}</div>
            <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-widest mt-1">% Uptime da Rede</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC] py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1E3A8A]">
              <TrendingUp className="w-4 h-4 text-[#3B82F6]" /> Fluxo de Chamados (30 Dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  <Bar dataKey="abertos" name="Abertos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="concluidos" name="Concluídos" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[#F1F5F9] bg-[#F8FAFC] py-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#1E3A8A]">
              <FileBarChart className="w-4 h-4 text-[#3B82F6]" /> Distribuição de Patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;