import React, { useState } from 'react';
import { Plus, Trash2, Calendar, GripVertical, Flag, Repeat, MessageSquare } from 'lucide-react';
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
import { CommentModal } from '../components/CommentModal';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

const COLUMNS = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'in-progress', title: 'Em Progresso' },
  { id: 'done', title: 'Concluído' },
];

const PRIORITY_COLORS = {
  low: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  high: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const TaskCard: React.FC<{ task: Task; onDelete: (id: number) => void; onClick: (task: Task) => void; onComment: (task: Task) => void }> = ({ task, onDelete, onClick, onComment }) => {
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
        className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl shadow-2xl border border-indigo-500/50 opacity-80 h-[100px] rotate-2 scale-105"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(task)}
      className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 group hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden pl-4"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        task.priority === 'high' ? 'bg-rose-500' : 
        task.priority === 'medium' ? 'bg-amber-500' : 
        'bg-emerald-500'
      }`} />
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={(e) => e.stopPropagation()}>
            <GripVertical size={16} />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate">{task.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onComment(task); }} 
            className="text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
          >
            <MessageSquare size={14} />
            {task.comments && task.comments.length > 0 && (
              <span className="text-[10px] font-bold font-mono">{task.comments.length}</span>
            )}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} 
            className="text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {task.comments && task.comments.length > 0 && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-3 italic">
          "{task.comments[task.comments.length - 1].text}"
        </p>
      )}
      
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-white/5">
        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex flex-col gap-1">
          {task.startDate && (
            <p className="flex items-center gap-1.5">
              <Calendar size={10} /> {new Date(task.startDate).toLocaleDateString('pt-BR')}
            </p>
          )}
          {task.endDate && (
            <p className="flex items-center gap-1.5">
              <Calendar size={10} /> {new Date(task.endDate).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.recurring && task.recurring !== 'none' && (
            <div className="text-indigo-500 dark:text-indigo-400" title={`Recorrência: ${task.recurring}`}>
              <Repeat size={12} />
            </div>
          )}
          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border flex items-center gap-1 ${PRIORITY_COLORS[task.priority || 'medium']}`}>
            <Flag size={8} className="fill-current" />
            {PRIORITY_LABELS[task.priority || 'medium']}
          </span>
        </div>
      </div>
    </div>
  );
};

const Column: React.FC<{ id: string; title: string; tasks: Task[]; onDelete: (id: number) => void; onTaskClick: (task: Task) => void; onCommentClick: (task: Task) => void }> = ({ id, title, tasks, onDelete, onTaskClick, onCommentClick }) => {
  const { setNodeRef } = useSortable({ id: id, data: { type: 'Column', id } });

  return (
    <div ref={setNodeRef} className="bg-slate-100/50 dark:bg-[#111111] p-4 rounded-2xl flex flex-col gap-4 min-h-[500px] border border-slate-200/50 dark:border-white/5">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          {title}
          <span className="bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full shadow-sm border border-slate-200 dark:border-white/5 font-mono">
            {tasks.length}
          </span>
        </h2>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 flex-1">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onClick={onTaskClick} onComment={onCommentClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export const KanbanBoard: React.FC = () => {
  const { tasks, deleteTask, updateTaskStatus, updateTask, dateRange, setDateRange } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [commentingTask, setCommentingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const filteredTasks = tasks.filter(task => {
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    let matchesDate = true;
    if (dateRange.startDate && dateRange.endDate) {
      const taskDate = parseISO(task.due_date);
      matchesDate = isWithinInterval(taskDate, { 
        start: startOfDay(parseISO(dateRange.startDate)), 
        end: endOfDay(parseISO(dateRange.endDate)) 
      });
    }
    return matchesPriority && matchesDate;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    // Visual only
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
          opacity: '0.4',
        },
      },
    }),
  };

  return (
    <div className="pb-10">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Quadro Kanban</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie suas tarefas visualmente</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-[#111111] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <input 
              type="date" 
              className="p-0 border-none text-xs text-slate-600 dark:text-slate-300 focus:outline-none bg-transparent font-mono"
              value={dateRange.startDate}
              onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <span className="text-slate-300 dark:text-slate-700">-</span>
            <input 
              type="date" 
              className="p-0 border-none text-xs text-slate-600 dark:text-slate-300 focus:outline-none bg-transparent font-mono"
              value={dateRange.endDate}
              onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-[#111111] p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            {(['all', 'low', 'medium', 'high'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setFilterPriority(priority)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                  filterPriority === priority
                    ? priority === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' :
                      priority === 'low' ? 'bg-emerald-500 text-white shadow-sm' :
                      priority === 'medium' ? 'bg-amber-500 text-white shadow-sm' :
                      'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {priority === 'all' ? 'Todas' : PRIORITY_LABELS[priority]}
              </button>
            ))}
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
              tasks={filteredTasks.filter((t) => t.status === col.id)}
              onDelete={deleteTask}
              onTaskClick={setEditingTask}
              onCommentClick={setCommentingTask}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} onDelete={() => {}} onClick={() => {}} onComment={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={updateTask}
        />
      )}
      {commentingTask && (
        <CommentModal
          task={commentingTask}
          onClose={() => setCommentingTask(null)}
        />
      )}
    </div>
  );
};
