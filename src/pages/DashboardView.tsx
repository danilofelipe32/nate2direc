import React from 'react';
import { useTasks } from '../context/TaskContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

export const DashboardView: React.FC = () => {
  const { tasks } = useTasks();

  const statusData = [
    { name: 'A Fazer', value: tasks.filter(t => t.status === 'todo').length },
    { name: 'Em Progresso', value: tasks.filter(t => t.status === 'in-progress').length },
    { name: 'Concluído', value: tasks.filter(t => t.status === 'done').length },
  ];

  const priorityData = [
    { name: 'Baixa', value: tasks.filter(t => t.priority === 'low').length },
    { name: 'Média', value: tasks.filter(t => t.priority === 'medium').length },
    { name: 'Alta', value: tasks.filter(t => t.priority === 'high').length },
  ];

  const overdueTasks = tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'done');
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">Visão geral da sua produtividade</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-indigo-50 rounded-xl text-indigo-600">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Taxa de Conclusão</p>
            <h3 className="text-3xl font-bold text-slate-900">{completionRate}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Tarefas Atrasadas</p>
            <h3 className="text-3xl font-bold text-slate-900">{overdueTasks.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-amber-50 rounded-xl text-amber-600">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Tarefas Pendentes</p>
            <h3 className="text-3xl font-bold text-slate-900">{tasks.filter(t => t.status !== 'done').length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-[450px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
            Tarefas por Status
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-[450px] flex flex-col">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
            Tarefas por Prioridade
          </h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#f43f5e' : index === 1 ? '#f59e0b' : '#10b981'} />
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
