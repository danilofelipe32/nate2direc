import React from 'react';
import { useTasks, Task } from '../context/TaskContext';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TimelineView: React.FC = () => {
  const { tasks } = useTasks();

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const groupedTasks = sortedTasks.reduce((acc, task) => {
    const date = format(parseISO(task.due_date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Linha do Tempo</h1>
        <p className="text-slate-500 text-sm">Visualize suas entregas cronologicamente</p>
      </div>
      
      <div className="relative border-l-2 border-indigo-100 ml-4 space-y-12 pb-12">
        {Object.entries(groupedTasks).map(([date, groupTasks]: [string, Task[]]) => {
          const parsedDate = parseISO(date);
          const isOverdue = isPast(parsedDate) && !isToday(parsedDate);
          
          return (
            <div key={date} className="relative pl-8">
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${isOverdue ? 'bg-rose-500' : 'bg-indigo-500'}`} />
              
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                  {isToday(parsedDate) ? 'Hoje' : isTomorrow(parsedDate) ? 'Amanhã' : format(parsedDate, "d 'de' MMMM", { locale: ptBR })}
                </h3>
                <span className="text-sm text-slate-400 font-medium uppercase tracking-wide">{format(parsedDate, 'EEEE', { locale: ptBR })}</span>
              </div>

              <div className="space-y-3">
                {groupTasks.map(task => (
                  <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-semibold text-base ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{task.description || 'Sem descrição'}</p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border ${
                        task.priority === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                        task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {Object.keys(groupedTasks).length === 0 && (
           <div className="pl-8 text-slate-500 italic">Nenhuma tarefa agendada.</div>
        )}
      </div>
    </div>
  );
};
