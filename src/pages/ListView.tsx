import React, { useState } from 'react';
import { useTasks, Task } from '../context/TaskContext';
import { Edit2, Trash2, CheckCircle, Circle, AlertCircle, GripVertical, MessageSquare } from 'lucide-react';
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { CommentModal } from '../components/CommentModal';
import { EditTaskModal } from '../components/EditTaskModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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

const STATUS_LABELS = {
  todo: 'A Fazer',
  'in-progress': 'Em Progresso',
  done: 'Concluído',
};

const STATUS_COLORS = {
  todo: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-50 text-blue-700',
  done: 'bg-emerald-50 text-emerald-700',
};

interface SortableTaskRowProps {
  task: Task;
  updateTaskStatus: (id: number, status: string) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  onCommentClick: (task: Task) => void;
  onEditClick: (task: Task) => void;
}

const SortableTaskRow: React.FC<SortableTaskRowProps> = ({ task, updateTaskStatus, deleteTask, onCommentClick, onEditClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    position: isDragging ? 'relative' : 'static' as any,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-slate-50/80 transition-colors group ${isDragging ? 'bg-indigo-50 shadow-lg' : ''}`}
    >
      <td className="p-4 w-10">
        <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-indigo-600">
          <GripVertical size={16} />
        </div>
      </td>
      <td className="p-4 w-10">
        <button 
          onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
          className={`transition-colors ${task.status === 'done' ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
        >
          {task.status === 'done' ? <CheckCircle size={22} className="fill-emerald-50" /> : <Circle size={22} />}
        </button>
      </td>
      <td className="p-4 cursor-pointer" onClick={() => onEditClick(task)}>
        <div className={`font-medium text-slate-900 ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>{task.title}</div>
        {task.description && <div className="text-xs text-slate-500 truncate max-w-md mt-0.5">{task.description}</div>}
      </td>
      <td className="p-4">
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide border ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </td>
      <td className="p-4 text-sm text-slate-500 font-mono">
        <div className="flex flex-col gap-0.5">
          {task.startDate && <span>Início: {new Date(task.startDate).toLocaleDateString('pt-BR')}</span>}
          {task.endDate && <span>Fim: {new Date(task.endDate).toLocaleDateString('pt-BR')}</span>}
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => onCommentClick(task)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
            title="Comentários"
          >
            <MessageSquare size={18} />
            {task.comments && task.comments.length > 0 && (
              <span className="text-xs font-bold">{task.comments.length}</span>
            )}
          </button>
          <button 
            onClick={() => deleteTask(task.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const ListView: React.FC = () => {
  const { tasks, deleteTask, updateTaskStatus, updateTask, dateRange, setDateRange } = useTasks();
  const [filter, setFilter] = useState('');
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  const [commentingTask, setCommentingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  React.useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTasks = orderedTasks.filter(task => {
    const matchesFilter = task.title.toLowerCase().includes(filter.toLowerCase()) ||
                          task.description.toLowerCase().includes(filter.toLowerCase());
    
    let matchesDate = true;
    if (dateRange.startDate && dateRange.endDate) {
      const taskDate = parseISO(task.due_date);
      matchesDate = isWithinInterval(taskDate, { 
        start: startOfDay(parseISO(dateRange.startDate)), 
        end: endOfDay(parseISO(dateRange.endDate)) 
      });
    }
    return matchesFilter && matchesDate;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lista de Tarefas</h1>
          <p className="text-slate-500 text-sm">Gerencie suas tarefas em formato de lista</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <input 
              type="date" 
              className="p-1.5 border-none text-xs text-slate-600 focus:outline-none"
              value={dateRange.startDate}
              onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
              title="Data Inicial"
            />
            <span className="text-slate-300">-</span>
            <input 
              type="date" 
              className="p-1.5 border-none text-xs text-slate-600 focus:outline-none"
              value={dateRange.endDate}
              onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
              title="Data Final"
            />
          </div>
          <input
            type="text"
            placeholder="Buscar tarefas..."
            className="p-2.5 border border-slate-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider w-10">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider w-1/2">Tarefa</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Prioridade</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Vencimento</th>
                <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <SortableContext 
                items={filteredTasks.map(t => t.id)} 
                strategy={verticalListSortingStrategy}
              >
                {filteredTasks.map((task) => (
                  <SortableTaskRow 
                    key={task.id} 
                    task={task} 
                    updateTaskStatus={updateTaskStatus} 
                    deleteTask={deleteTask} 
                    onCommentClick={setCommentingTask}
                    onEditClick={setEditingTask}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
        
        {commentingTask && (
          <CommentModal
            task={commentingTask}
            onClose={() => setCommentingTask(null)}
          />
        )}
        
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={async (updatedTask) => {
              await updateTask(updatedTask);
              setEditingTask(null);
            }}
          />
        )}
        
        {filteredTasks.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
              <CheckCircle className="text-slate-400" size={24} />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">Nenhuma tarefa encontrada</h3>
            <p className="text-slate-500 text-sm">Tente ajustar sua busca ou adicione uma nova tarefa.</p>
          </div>
        )}
      </div>
    </div>
  );
};
