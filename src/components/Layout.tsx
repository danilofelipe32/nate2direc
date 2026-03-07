import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, Calendar, Kanban, CheckSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationCenter } from './NotificationCenter';
import { AddTaskModal } from './AddTaskModal';
import { ThemeToggle } from './ThemeToggle';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#111111] border-r border-slate-200 dark:border-white/10 flex flex-col z-10 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-xl shadow-sm">
            <CheckSquare className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">ProPlanner</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Workspace</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1">
          <Link 
            to="/" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive('/') ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <LayoutDashboard size={18} strokeWidth={isActive('/') ? 2.5 : 2} />
            Dashboard
          </Link>
          <Link 
            to="/kanban" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive('/kanban') ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Kanban size={18} strokeWidth={isActive('/kanban') ? 2.5 : 2} />
            Quadro Kanban
          </Link>
          <Link 
            to="/list" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive('/list') ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <List size={18} strokeWidth={isActive('/list') ? 2.5 : 2} />
            Lista de Tarefas
          </Link>
          <Link 
            to="/timeline" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isActive('/timeline') ? 'bg-slate-100 dark:bg-white/10 text-indigo-600 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Calendar size={18} strokeWidth={isActive('/timeline') ? 2.5 : 2} />
            Timeline
          </Link>
        </nav>

        <div className="p-4">
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-1 text-xs uppercase tracking-wider">Produtividade</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Mantenha o foco e organize suas metas semanais.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0a0a0a] flex flex-col relative transition-colors duration-300">
        {/* Top Header */}
        <header className="bg-slate-50/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-8 py-4 flex justify-end items-center gap-4 sticky top-0 z-20">
          <ThemeToggle />
          <NotificationCenter />
        </header>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8 max-w-7xl mx-auto flex-1 w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Floating Add Task Button */}
        <button
          onClick={() => setIsAddTaskModalOpen(true)}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 flex items-center justify-center transition-all duration-200 z-50"
          title="Nova Tarefa"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {isAddTaskModalOpen && (
          <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} />
        )}
      </main>
    </div>
  );
};
