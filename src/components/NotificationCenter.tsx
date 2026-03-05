import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { tasks } = useTasks();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Generate notifications based on tasks
  useEffect(() => {
    const newNotifications: Notification[] = [];
    const today = new Date();
    
    tasks.forEach(task => {
      const dueDate = new Date(task.due_date);
      const isOverdue = dueDate < today && task.status !== 'done';
      
      const tomorrow = new Date(today);
      tomorrow.setHours(today.getHours() + 24);
      const isNearing = dueDate >= today && dueDate <= tomorrow && task.status !== 'done';
      
      if (isOverdue) {
        newNotifications.push({
          id: `overdue-${task.id}`,
          title: 'Tarefa Atrasada',
          message: `"${task.title}" está atrasada.`,
          type: 'error',
          timestamp: dueDate,
          read: false
        });
      } else if (isNearing) {
        newNotifications.push({
          id: `nearing-${task.id}`,
          title: 'Próxima do Vencimento',
          message: `"${task.title}" vence em breve.`,
          type: 'warning',
          timestamp: dueDate,
          read: false
        });
      }
    });

    // Add a welcome notification if empty
    if (newNotifications.length === 0 && tasks.length === 0) {
      newNotifications.push({
        id: 'welcome',
        title: 'Bem-vindo!',
        message: 'Comece adicionando uma nova tarefa.',
        type: 'info',
        timestamp: new Date(),
        read: false
      });
    }

    setNotifications(newNotifications);
  }, [tasks]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleOpen = () => setIsOpen(!isOpen);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertCircle size={16} className="text-amber-500" />;
      case 'error': return <AlertCircle size={16} className="text-rose-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        onClick={toggleOpen}
        className="relative p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notificações</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Bell size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${notification.read ? 'opacity-60' : 'bg-white dark:bg-slate-900'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-slate-900 dark:text-slate-100 ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                          {notification.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
