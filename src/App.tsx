/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, GripVertical, Bell, X } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

const COLUMNS = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'in-progress', title: 'Em Progresso' },
  { id: 'done', title: 'Concluído' },
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const TaskCard: React.FC<{ task: Task; onDelete: (id: number) => void; onClick: (task: Task) => void }> = ({ task, onDelete, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white p-4 rounded-xl shadow-lg border-2 border-zinc-900 opacity-50 h-[100px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(task)}
      className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 group hover:border-zinc-300 transition-colors cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div {...attributes} {...listeners} className="cursor-grab text-zinc-400 hover:text-zinc-600" onClick={(e) => e.stopPropagation()}>
          <GripVertical size={16} />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
          className="text-zinc-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <h3 className="font-medium text-zinc-900 mb-1">{task.title}</h3>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          <Calendar size={12} /> {new Date(task.due_date).toLocaleDateString('pt-BR')}
        </p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority || 'medium']}`}>
          {PRIORITY_LABELS[task.priority || 'medium']}
        </span>
      </div>
    </div>
  );
};

const Column: React.FC<{ id: string; title: string; tasks: Task[]; onDelete: (id: number) => void; onTaskClick: (task: Task) => void }> = ({ id, title, tasks, onDelete, onTaskClick }) => {
  const { setNodeRef } = useSortable({ id: id, data: { type: 'Column', id } });

  return (
    <div ref={setNodeRef} className="bg-zinc-100/50 p-4 rounded-2xl flex flex-col gap-4 min-h-[500px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-zinc-700 flex items-center gap-2">
          {title}
          <span className="bg-zinc-200 text-zinc-600 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
        </h2>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 flex-1">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onClick={onTaskClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const EditTaskModal: React.FC<{ task: Task; onClose: () => void; onSave: (updatedTask: Task) => void }> = ({ task, onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '');
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);

  const handleSave = () => {
    onSave({
      ...task,
      title,
      description,
      due_date: new Date(dueDate).toISOString(),
      priority,
      status
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Editar Tarefa</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Data de Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              <option value="todo">A Fazer</option>
              <option value="in-progress">Em Progresso</option>
              <option value="done">Concluído</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
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

    // Check subscription status
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const response = await fetch('/api/vapid-public-key');
      const { publicKey } = await response.json();

      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      await fetch('/api/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setIsSubscribed(true);
      alert('Notificações ativadas com sucesso!');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Falha ao ativar notificações. Verifique as permissões do navegador.');
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const date = new Date().toISOString();
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, description: '', due_date: date, priority: newPriority })
      });
      if (!res.ok) throw new Error('Failed to add task');
      const newTask = await res.json();
      setTasks([...tasks, { id: newTask.id, title: newTaskTitle, description: '', due_date: date, status: 'todo', priority: newPriority }]);
      setNewTaskTitle('');
      setNewPriority('medium');
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Falha ao adicionar tarefa.");
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
    } catch (error) {
      console.error("Failed to update status", error);
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

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          const newTasks = [...tasks];
          newTasks[activeIndex].status = tasks[overIndex].status;
          return arrayMove(newTasks, activeIndex, overIndex - 1);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverColumn = over.data.current?.type === 'Column';

    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        if (tasks[activeIndex].status !== overId) {
          const newTasks = [...tasks];
          newTasks[activeIndex].status = overId as any;
          return arrayMove(newTasks, activeIndex, activeIndex);
        }
        return tasks;
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    let newStatus = activeTask.status;

    if (over.data.current?.type === 'Column') {
      newStatus = overId as any;
    } else if (over.data.current?.type === 'Task') {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (activeTask.status !== newStatus) {
      updateTaskStatus(activeId, newStatus);
      setTasks(tasks.map(t => t.id === activeId ? { ...t, status: newStatus } : t));
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans text-zinc-900">
      <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planejador Profissional</h1>
          <p className="text-zinc-500">Gerencie suas tarefas com um quadro Kanban</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {!isSubscribed && (
            <button onClick={subscribeToPush} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors mr-2">
              <Bell size={20} /> Ativar Notificações
            </button>
          )}
          
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-zinc-500">Filtrar:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="p-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              <option value="all">Todas</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="p-2 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Nova tarefa..."
              className="p-2 border border-zinc-300 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
            />
            <button onClick={addTask} className="bg-zinc-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-zinc-800 transition-colors">
              <Plus size={20} /> Nova tarefa
            </button>
          </div>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasks.filter((t) => (t.status === col.id) && (filterPriority === 'all' || t.priority === filterPriority))}
              onDelete={deleteTask}
              onTaskClick={setEditingTask}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} onDelete={() => {}} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={updateTask}
        />
      )}
    </div>
  );
}
