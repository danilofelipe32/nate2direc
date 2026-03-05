import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, Calendar, Kanban, CheckSquare, Plus } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { AddTaskModal } from './AddTaskModal';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <CheckSquare className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ProPlanner</h1>
            <p className="text-xs text-slate-400">Gerenciamento Ágil</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link 
            to="/" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link 
            to="/kanban" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/kanban') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Kanban size={20} />
            <span className="font-medium">Quadro Kanban</span>
          </Link>
          <Link 
            to="/list" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/list') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <List size={20} />
            <span className="font-medium">Lista de Tarefas</span>
          </Link>
          <Link 
            to="/timeline" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/timeline') ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar size={20} />
            <span className="font-medium">Timeline</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-4 rounded-xl shadow-lg">
            <h3 className="font-semibold text-white mb-1 text-sm">Produtividade em alta</h3>
            <p className="text-xs text-indigo-100 opacity-90">Mantenha o foco e organize suas metas semanais.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 flex flex-col relative">
        {/* Top Header with Notification Center */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-end items-center sticky top-0 z-20 shadow-sm">
          <NotificationCenter />
        </header>
        
        <div className="p-8 max-w-7xl mx-auto flex-1 w-full">
          {children}
        </div>

        {/* Floating Add Task Button */}
        <button
          onClick={() => setIsAddTaskModalOpen(true)}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 transition-all duration-200 z-50"
          title="Nova Tarefa"
        >
          <Plus size={28} />
        </button>

        {isAddTaskModalOpen && (
          <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} />
        )}
      </main>
    </div>
  );
};
