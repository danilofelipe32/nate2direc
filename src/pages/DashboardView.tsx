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
import { format, addDays, isSameDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

export const DashboardView: React.FC = () => {
  const { tasks } = useTasks();

  // --- Data Processing ---

  const statusData = useMemo(() => [
    { name: 'A Fazer', value: tasks.filter(t => t.status === 'todo').length, color: '#6366f1' },
    { name: 'Em Progresso', value: tasks.filter(t => t.status === 'in-progress').length, color: '#f59e0b' },
    { name: 'Concluído', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' },
  ], [tasks]);

  const priorityData = useMemo(() => [
    { name: 'Baixa', value: tasks.filter(t => t.priority === 'low').length, fill: '#10b981' },
    { name: 'Média', value: tasks.filter(t => t.priority === 'medium').length, fill: '#f59e0b' },
    { name: 'Alta', value: tasks.filter(t => t.priority === 'high').length, fill: '#f43f5e' },
  ], [tasks]);

  const overdueTasks = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'done');
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;
  
  // Weekly Trend Data (Mocked based on due dates for demonstration of "Workload")
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
    <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500 ${color.bg}`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${color.bg} ${color.text} shadow-sm group-hover:rotate-12 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen space-y-8 pb-10 relative">
      {/* Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-400/20 blur-[100px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-emerald-400/20 blur-[100px]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Visão geral da sua produtividade e métricas.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/60 shadow-sm">
          <CalendarDays size={16} className="text-indigo-600" />
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Taxa de Conclusão" 
          value={`${completionRate}%`} 
          icon={Activity} 
          color={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }}
          subtext="Baseado no total de tarefas"
        />
        <StatCard 
          title="Tarefas Atrasadas" 
          value={overdueTasks.length} 
          icon={AlertOctagon} 
          color={{ bg: 'bg-rose-100', text: 'text-rose-600' }}
          subtext="Requer atenção imediata"
        />
        <StatCard 
          title="Em Progresso" 
          value={tasks.filter(t => t.status === 'in-progress').length} 
          icon={Zap} 
          color={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
          subtext="Tarefas sendo executadas"
        />
        <StatCard 
          title="Total de Tarefas" 
          value={tasks.length} 
          icon={ListTodo} 
          color={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
          subtext={`${tasks.filter(t => t.status === 'done').length} concluídas`}
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Workload - Area Chart */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-lg flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Carga de Trabalho Semanal
            </h3>
            <span className="text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
              Próximos 7 dias
            </span>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyWorkload}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.5)', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' 
                  }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTasks)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution - Radial Bar or Pie */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-lg flex flex-col h-[400px]">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-emerald-600" />
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
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  formatter={(value) => <span className="text-slate-600 font-medium ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="text-center">
                <span className="text-3xl font-bold text-slate-800">{tasks.length}</span>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Tarefas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming & Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Deadlines List */}
        <div className="lg:col-span-1 bg-white/40 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-lg h-[350px] flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            Próximos Prazos
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {upcomingDeadlines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Tudo em dia!</p>
              </div>
            ) : (
              upcomingDeadlines.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-1.5 h-10 rounded-full ${
                    task.priority === 'high' ? 'bg-rose-500' : 
                    task.priority === 'medium' ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <CalendarDays size={10} />
                      {format(parseISO(task.due_date), "d 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                  {task.priority === 'high' && (
                    <AlertOctagon size={16} className="text-rose-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-lg h-[350px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <AlertOctagon size={20} className="text-rose-500" />
            Tarefas por Prioridade
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} barSize={40} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.2)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
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
