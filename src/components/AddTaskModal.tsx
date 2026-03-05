import React, { useState } from 'react';
import { X, Calendar, Flag, Plus, Type, AlignLeft, Repeat } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

interface AddTaskModalProps {
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose }) => {
  const { addTask } = useTasks();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addTask(title, priority, new Date(startDate).toISOString(), new Date(endDate).toISOString(), recurring);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl p-0 w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nova Tarefa</h2>
            <p className="text-sm text-slate-500">Adicione uma nova tarefa ao seu quadro</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Type size={14} /> Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
              placeholder="Nome da tarefa"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={14} /> Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar size={14} /> Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flag size={14} /> Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-slate-600"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Repeat size={14} /> Recorrência
              </label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as any)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white text-slate-600"
              >
                <option value="none">Nenhuma</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleAdd} 
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 font-medium flex items-center gap-2"
          >
            <Plus size={18} />
            Criar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
};
