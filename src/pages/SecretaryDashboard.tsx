import React, { useState, useMemo } from 'react';
import { useTicketContext } from '../context/TicketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Clock, 
  Users, 
  BarChart3, 
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { 
  isToday, 
  isThisWeek, 
  isThisMonth, 
  parseISO, 
  differenceInMinutes 
} from 'date-fns';

const SecretaryDashboard = () => {
  const { tickets } = useTicketContext();
  const [period, setPeriod] = useState('month');

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const date = parseISO(ticket.created_at);
      if (period === 'today') return isToday(date);
      if (period === 'week') return isThisWeek(date, { weekStartsOn: 1 });
      if (period === 'month') return isThisMonth(date);
      return true;
    });
  }, [tickets, period]);

  const stats = useMemo(() => {
    const completed = filteredTickets.filter(t => t.status === 'Concluído' && t.finalizado_em);
    
    // SLA Calculation
    let totalMinutes = 0;
    completed.forEach(t => {
      const start = parseISO(t.created_at);
      const end = parseISO(t.finalizado_em!);
      totalMinutes += Math.max(0, differenceInMinutes(end, start));
    });
    
    const avgMinutes = completed.length > 0 ? Math.round(totalMinutes / completed.length) : 0;
    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    const slaFormatted = completed.length > 0 ? `${hours}h ${mins}min` : '---';

    // Sector Data for Chart
    const sectorMap: Record<string, number> = {};
    filteredTickets.forEach(t => {
      sectorMap[t.setor] = (sectorMap[t.setor] || 0) + 1;
    });
    const sectorData = Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Technician Ranking
    const techMap: Record<string, number> = {};
    completed.forEach(t => {
      if (t.atendente) {
        techMap[t.atendente] = (techMap[t.atendente] || 0) + 1;
      }
    });
    const techRanking = Object.entries(techMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      slaFormatted,
      totalTickets: filteredTickets.length,
      completedCount: completed.length,
      sectorData,
      techRanking
    };
  }, [filteredTickets]);

  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Análise de Desempenho</h1>
          <p className="text-slate-500">Visão estratégica da TechDept AdminDept</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] border-none shadow-none focus:ring-0 h-9">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <div className="h-1 bg-blue-500 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none">SLA Médio</Badge>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.slaFormatted}</div>
            <p className="text-sm text-slate-500 mt-1">Tempo médio de solução</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <div className="h-1 bg-emerald-500 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none">Produtividade</Badge>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.completedCount}</div>
            <p className="text-sm text-slate-500 mt-1">Chamados finalizados no período</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <div className="h-1 bg-amber-500 w-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none">Volume Total</Badge>
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalTickets}</div>
            <p className="text-sm text-slate-500 mt-1">Total de solicitações abertas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sector Chart */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Chamados por Setor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sectorData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {stats.sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Technician Ranking */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Ranking de Técnicos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {stats.techRanking.length === 0 ? (
                <div className="text-center py-12 text-slate-400 italic">
                  Nenhum chamado finalizado no período.
                </div>
              ) : (
                stats.techRanking.map((tech, index) => (
                  <div key={tech.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-50 group hover:bg-white hover:shadow-md hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-amber-100 text-amber-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{tech.name}</div>
                        <div className="text-xs text-slate-500">Técnico de Suporte</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">{tech.count}</div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Finalizados</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecretaryDashboard;