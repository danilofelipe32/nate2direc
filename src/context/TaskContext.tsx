import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  comments?: Comment[];
  startDate?: string;
  endDate?: string;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, priority: 'low' | 'medium' | 'high', startDate: string, endDate: string, recurring?: 'none' | 'daily' | 'weekly' | 'monthly') => Promise<void>;
  updateTask: (updatedTask: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  updateTaskStatus: (id: number, status: string) => Promise<void>;
  addComment: (taskId: number, text: string) => Promise<void>;
  refreshTasks: () => void;
  dateRange: { startDate: string; endDate: string };
  setDateRange: (range: { startDate: string; endDate: string }) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchTasks = () => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        const validTasks = data.map((t: any) => ({
          ...t,
          status: ['todo', 'in-progress', 'done'].includes(t.status) ? t.status : 'todo',
          priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium',
          recurring: ['none', 'daily', 'weekly', 'monthly'].includes(t.recurring) ? t.recurring : 'none',
          comments: Array.isArray(t.comments) ? t.comments : []
        }));
        setTasks(validTasks);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const refreshTasks = () => fetchTasks();

  const addTask = async (title: string, priority: 'low' | 'medium' | 'high', startDate: string, endDate: string, recurring: 'none' | 'daily' | 'weekly' | 'monthly' = 'none') => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: '', due_date: endDate, startDate, endDate, priority, recurring, comments: [] })
      });
      if (!res.ok) throw new Error('Failed to add task');
      const newTask = await res.json();
      setTasks([...tasks, { id: newTask.id, title, description: '', due_date: endDate, status: 'todo', priority, recurring, comments: [], startDate, endDate }]);
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Falha ao adicionar tarefa.");
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      await fetch(`/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedTask.title,
          description: updatedTask.description,
          due_date: updatedTask.due_date,
          status: updatedTask.status,
          priority: updatedTask.priority,
          recurring: updatedTask.recurring,
          comments: updatedTask.comments,
          startDate: updatedTask.startDate,
          endDate: updatedTask.endDate
        })
      });
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (error) {
      console.error("Failed to update task", error);
      alert("Falha ao atualizar tarefa.");
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete task", error);
      alert("Falha ao deletar tarefa.");
    }
  };

  const updateTaskStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, status: status as any } : t));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const addComment = async (taskId: number, text: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      createdAt: new Date().toISOString(),
      author: 'Você' // In a real app, this would be the logged-in user
    };

    const updatedComments = [...(task.comments || []), newComment];
    const updatedTask = { ...task, comments: updatedComments };

    await updateTask(updatedTask);
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, updateTaskStatus, addComment, refreshTasks, dateRange, setDateRange }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
