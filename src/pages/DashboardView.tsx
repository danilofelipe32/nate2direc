import React, { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import { 
  CheckCircle2, AlertOctagon, Clock, Activity, 
  TrendingUp, CalendarDays, ListTodo, Zap 
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DashboardView: React.FC = () => {
  const { tasks, dateRange, setDateRange } = useTasks();

  // --- Data Processing ---

  const statusData = useMemo(() => {
    let filtered = tasks;
    if (dateRange.startDate && dateRange.endDate) {
      filtered = tasks.filter(task => {
        const taskDate = parseISO(task.due_date);
        return isWithinInterval(taskDate, { 
          start: startOfDay(parseISO(dateRange.startDate)), 
          end: endOfDay(parseISO(dateRange.endDate)) 
        });
      });
    }
    return [
      { name: 'A Fazer', value: filtered.filter(t => t.status === 'todo').length, color: '#6366f1' },
      { name: 'Em Progresso', value: filtered.filter(t => t.status === 'in-progress').length, color: '#f59e0b' },
      { name: 'Concluído', value: filtered.filter(t => t.status === 'done').length, color: '#10b981' },
    ];
  }, [tasks, dateRange]);

  const priorityData = useMemo(() => {
    let filtered = tasks;
    if (dateRange.startDate && dateRange.endDate) {
      filtered = tasks.filter(task => {
        const taskDate = parseISO(task.due_date);
        return isWithinInterval(taskDate, { 
          start: startOfDay(parseISO(dateRange.startDate)), 
          end: endOfDay(parseISO(dateRange.endDate)) 
        });
      });
    }
    return [
      { name: 'Baixa', value: filtered.filter(t => t.priority === 'low').length, fill: '#10b981' },
      { name: 'Média', value: filtered.filter(t => t.priority === 'medium').length, fill: '#f59e0b' },
      { name: 'Alta', value: filtered.filter(t => t.priority === 'high').length, fill: '#f43f5e' },
    ];
  }, [tasks, dateRange]);

  const overdueTasks = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'done');
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;
  
  const weeklyWorkload = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const count = tasks.filter(t => isSameDay(parseISO(t.due_date), day)).length;
      return {
        name: format(day, 'EEE', { locale: ptBR }),
        tasks: count,
        fullDate: day
      };
    });
  }, [tasks]);

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    return tasks
      .filter(t => t.status !== 'done' && parseISO(t.due_date) >= today)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5);
  }, [tasks]);

  // --- Components ---

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`p-2 rounded-lg ${color.bg} ${color.text}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <h3 className="text-4xl font-light font-mono text-slate-900 dark:text-white tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visão geral da sua produtividade e métricas.</p>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#111111] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <CalendarDays size={16} className="text-slate-400" />
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              className="p-0 border-none text-xs text-slate-600 dark:text-slate-300 focus:outline-none bg-transparent font-mono"
              value={dateRange.startDate}
              onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <span className="text-slate-300 dark:text-slate-700">-</span>
            <input 
              type="date" 
              className="p-0 border-none text-xs text-slate-600 dark:text-slate-300 focus:outline-none bg-transparent font-mono"
              value={dateRange.endDate}
              onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Taxa de Conclusão" 
          value={`${completionRate}%`} 
          icon={Activity} 
          color={{ bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' }}
          subtext="Baseado no total de tarefas"
        />
        <StatCard 
          title="Tarefas Atrasadas" 
          value={overdueTasks.length} 
          icon={AlertOctagon} 
          color={{ bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' }}
          subtext="Requer atenção imediata"
        />
        <StatCard 
          title="Em Progresso" 
          value={tasks.filter(t => t.status === 'in-progress').length} 
          icon={Zap} 
          color={{ bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }}
          subtext="Tarefas sendo executadas"
        />
        <StatCard 
          title="Total de Tarefas" 
          value={tasks.length} 
          icon={ListTodo} 
          color={{ bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' }}
          subtext={`${tasks.filter(t => t.status === 'done').length} concluídas`}
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Workload - Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
              Carga de Trabalho Semanal
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tw-colors-slate-900)', 
                    color: '#fff',
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTasks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution - Pie */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
            Distribuição
          </h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tw-colors-slate-900)', 
                    color: '#fff',
                    borderRadius: '8px', 
                    border: 'none',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  formatter={(value) => <span className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming & Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines List */}
        <div className="lg:col-span-1 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm h-[320px] flex flex-col">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
            Próximos Prazos
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {upcomingDeadlines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <CheckCircle2 size={24} className="mb-2 opacity-30" />
                <p className="text-xs font-medium">Tudo em dia!</p>
              </div>
            ) : (
              upcomingDeadlines.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                  <div className={`w-1 h-8 rounded-full ${
                    task.priority === 'high' ? 'bg-rose-500' : 
                    task.priority === 'medium' ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {format(parseISO(task.due_date), "dd MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm h-[320px] flex flex-col">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-6">
            Tarefas por Prioridade
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} barSize={32} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(150,150,150,0.1)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }} 
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(150,150,150,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--tw-colors-slate-900)', 
                    color: '#fff',
                    borderRadius: '8px', 
                    border: 'none',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
