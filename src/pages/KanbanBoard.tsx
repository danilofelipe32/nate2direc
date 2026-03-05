import React, { useState } from 'react';
import { Plus, Trash2, Calendar, GripVertical, Flag, Repeat } from 'lucide-react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasks, Task } from '../context/TaskContext';
import { EditTaskModal } from '../components/EditTaskModal';

const COLUMNS = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'in-progress', title: 'Em Progresso' },
  { id: 'done', title: 'Concluído' },
];

const PRIORITY_COLORS = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

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
        className="bg-white p-4 rounded-xl shadow-xl border-2 border-indigo-500 opacity-50 h-[100px] rotate-2"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(task)}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden pl-5"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${
        task.priority === 'high' ? 'bg-rose-500' : 
        task.priority === 'medium' ? 'bg-amber-500' : 
        'bg-emerald-500'
      }`} />
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
              task.priority === 'high' ? 'bg-rose-500 animate-pulse' : 
              task.priority === 'medium' ? 'bg-amber-500' : 
              'bg-emerald-500'
          }`} />
          <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-indigo-600" onClick={(e) => e.stopPropagation()}>
            <GripVertical size={16} />
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate flex-1">{task.title}</h3>
        {task.recurring && task.recurring !== 'none' && (
          <div className="text-indigo-500" title={`Recorrência: ${task.recurring}`}>
            <Repeat size={14} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar size={12} /> {new Date(task.due_date).toLocaleDateString('pt-BR')}
        </p>
        <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wide border flex items-center gap-1 ${PRIORITY_COLORS[task.priority || 'medium']}`}>
          <Flag size={10} className="fill-current" />
          {PRIORITY_LABELS[task.priority || 'medium']}
        </span>
      </div>
    </div>
  );
};

const Column: React.FC<{ id: string; title: string; tasks: Task[]; onDelete: (id: number) => void; onTaskClick: (task: Task) => void }> = ({ id, title, tasks, onDelete, onTaskClick }) => {
  const { setNodeRef } = useSortable({ id: id, data: { type: 'Column', id } });

  const getColumnColor = (id: string) => {
    switch(id) {
      case 'todo': return 'bg-slate-100 border-slate-200';
      case 'in-progress': return 'bg-blue-50 border-blue-100';
      case 'done': return 'bg-emerald-50 border-emerald-100';
      default: return 'bg-slate-100';
    }
  };

  const getHeaderColor = (id: string) => {
    switch(id) {
      case 'todo': return 'text-slate-700';
      case 'in-progress': return 'text-blue-700';
      case 'done': return 'text-emerald-700';
      default: return 'text-slate-700';
    }
  };

  return (
    <div ref={setNodeRef} className={`p-4 rounded-2xl flex flex-col gap-4 min-h-[500px] border ${getColumnColor(id)}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className={`font-bold flex items-center gap-2 ${getHeaderColor(id)}`}>
          {title}
          <span className="bg-white text-slate-600 text-xs px-2 py-1 rounded-full shadow-sm border border-slate-100 font-mono">{tasks.length}</span>
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

export const KanbanBoard: React.FC = () => {
  const { tasks, deleteTask, updateTaskStatus, updateTask } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    // This is purely visual in dnd-kit for sortable lists usually, 
    // but we can implement optimistic updates here if we want.
    // For simplicity, we'll rely on onDragEnd to commit changes.
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
    <div>
      <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Quadro Kanban</h1>
          <p className="text-zinc-500">Gerencie suas tarefas visualmente</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-zinc-500 mr-2">Filtrar:</span>
          {(['all', 'low', 'medium', 'high'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                filterPriority === priority
                  ? priority === 'all' ? 'bg-zinc-900 text-white border-zinc-900' :
                    priority === 'low' ? 'bg-emerald-500 text-white border-emerald-500' :
                    priority === 'medium' ? 'bg-amber-500 text-white border-amber-500' :
                    'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {priority === 'all' ? 'Todas' : PRIORITY_LABELS[priority]}
            </button>
          ))}
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
};
