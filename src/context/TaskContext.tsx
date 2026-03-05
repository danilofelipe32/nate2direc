import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, priority: 'low' | 'medium' | 'high') => Promise<void>;
  updateTask: (updatedTask: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  updateTaskStatus: (id: number, status: string) => Promise<void>;
  refreshTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = () => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        const validTasks = data.map((t: any) => ({
          ...t,
          status: ['todo', 'in-progress', 'done'].includes(t.status) ? t.status : 'todo',
          priority: ['low', 'medium', 'high'].includes(t.priority) ? t.priority : 'medium'
        }));
        setTasks(validTasks);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const refreshTasks = () => fetchTasks();

  const addTask = async (title: string, priority: 'low' | 'medium' | 'high') => {
    try {
      const date = new Date().toISOString();
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: '', due_date: date, priority })
      });
      if (!res.ok) throw new Error('Failed to add task');
      const newTask = await res.json();
      setTasks([...tasks, { id: newTask.id, title, description: '', due_date: date, status: 'todo', priority }]);
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
          priority: updatedTask.priority
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

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, updateTaskStatus, refreshTasks }}>
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
