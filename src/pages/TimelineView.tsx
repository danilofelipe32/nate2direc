import React, { useState, useMemo } from 'react';
import { useTasks, Task } from '../context/TaskContext';
import { EditTaskModal } from '../components/EditTaskModal';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  parseISO, 
  subDays,
  isPast,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  MouseSensor,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GripVertical, Filter, X, MessageSquare } from 'lucide-react';
import { CommentModal } from '../components/CommentModal';

// --- Components ---

const ResizeHandle: React.FC<{ 
  taskId: number; 
  type: 'start' | 'end'; 
  date: string;
}> = ({ taskId, type, date }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize-${type}-${taskId}`,
    data: { taskId, type, originalDate: date, isResize: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute top-0 bottom-0 w-3 cursor-col-resize z-20 hover:bg-white/40 transition-colors flex items-center justify-center ${
        type === 'start' ? 'left-0 rounded-l-md' : 'right-0 rounded-r-md'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-0.5 h-4 bg-white/50 rounded-full" />
    </div>
  );
};

const DraggableTaskBar: React.FC<{ 
  task: Task; 
  date: Date; 
  isStart?: boolean; 
  isEnd?: boolean; 
  onClick: (task: Task) => void 
}> = ({ task, date, isStart, isEnd, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}-${format(date, 'yyyy-MM-dd')}`,
    data: { task, originalDate: format(date, 'yyyy-MM-dd') },
  });

  const getTaskColor = (task: Task) => {
    const dueDate = parseISO(task.due_date);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    if (isPast(dueDate) || isToday(dueDate)) {
      return 'bg-rose-500 border-rose-600 shadow-rose-200 dark:shadow-rose-900/20';
    }
    if (dueDate <= threeDaysFromNow) {
      return 'bg-orange-500 border-orange-600 shadow-orange-200 dark:shadow-orange-900/20';
    }
    
    const priorityColors = {
      low: 'bg-emerald-500 border-emerald-600',
      medium: 'bg-amber-500 border-amber-600',
      high: 'bg-rose-500 border-rose-600',
    };
    return priorityColors[task.priority];
  };

  if (isDragging) {
    return <div ref={setNodeRef} className="opacity-0" />;
  }

  return (
    <div
      ref={setNodeRef}
      className={`h-8 ${isStart ? 'rounded-l-md border-l' : ''} ${isEnd ? 'rounded-r-md border-r' : ''} border-y ${getTaskColor(task)} cursor-pointer flex items-center justify-between relative group hover:brightness-110 transition-all z-10 shadow-sm`}
      title={task.title}
      onClick={() => onClick(task)}
    >
      {isStart && <ResizeHandle taskId={task.id} type="start" date={format(date, 'yyyy-MM-dd')} />}
      
      <div 
        {...listeners} 
        {...attributes} 
        className="flex-1 h-full flex items-center px-2 min-w-0 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        {isStart && <span className="text-[10px] font-bold text-white truncate w-full pointer-events-none drop-shadow-sm">{task.title}</span>}
      </div>

      {isEnd && <ResizeHandle taskId={task.id} type="end" date={format(date, 'yyyy-MM-dd')} />}
      
      <div className="absolute right-1 opacity-0 group-hover:opacity-100 text-white/80 pointer-events-none">
        <GripVertical size={12} />
      </div>
    </div>
  );
};

const DroppableCell: React.FC<{ date: Date; taskId: number; children?: React.ReactNode }> = ({ date, taskId, children }) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${taskId}-${dateStr}`,
    data: { date: dateStr, taskId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-12 border-r border-b border-slate-100 dark:border-white/5 min-w-[60px] relative transition-colors ${
        isOver ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
      } ${isToday(date) ? 'bg-slate-50/50 dark:bg-white/5' : ''}`}
    >
      <div className="absolute inset-1">
        {children}
      </div>
    </div>
  );
};

export const TimelineView: React.FC = () => {
  const { tasks, updateTask, dateRange, setDateRange } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [commentingTask, setCommentingTask] = useState<Task | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  // Calculate date range
  const startDate = useMemo(() => {
    if (dateRange.startDate) return parseISO(dateRange.startDate);
    return subDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 3);
  }, [currentDate, dateRange.startDate]);

  const endDate = useMemo(() => {
    if (dateRange.endDate) return parseISO(dateRange.endDate);
    // If custom start date is set but no end date, show 2 weeks from start
    if (dateRange.startDate && !dateRange.endDate) return addDays(parseISO(dateRange.startDate), 14);
    return addDays(endOfWeek(currentDate, { weekStartsOn: 0 }), 10);
  }, [currentDate, dateRange.endDate, dateRange.startDate]);
  
  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  // Filter tasks based on the visible date range
  const filteredTasks = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return tasks;

    return tasks.filter(task => {
      const taskDate = parseISO(task.due_date);
      // Check if task date is within the visible range
      return isWithinInterval(taskDate, { 
        start: startOfDay(startDate), 
        end: endOfDay(endDate) 
      });
    });
  }, [tasks, startDate, endDate, dateRange.startDate, dateRange.endDate]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.task) {
      setActiveTask(event.active.data.current.task);
    } else if (event.active.data.current?.isResize) {
      const task = tasks.find(t => t.id === event.active.data.current?.taskId);
      if (task) setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.data.current?.isResize) {
      const { taskId, type } = active.data.current;
      const newDateStr = over.data.current?.date;
      const task = tasks.find(t => t.id === taskId);
      
      if (task && newDateStr) {
        const updatedTask = { ...task };
        if (type === 'start') {
          updatedTask.startDate = newDateStr;
          // Ensure startDate <= endDate
          if (task.endDate && parseISO(newDateStr) > parseISO(task.endDate)) {
            updatedTask.endDate = newDateStr;
            updatedTask.due_date = newDateStr + 'T23:59:59Z';
          }
        } else {
          updatedTask.endDate = newDateStr;
          updatedTask.due_date = newDateStr + 'T23:59:59Z';
          // Ensure endDate >= startDate
          if (task.startDate && parseISO(newDateStr) < parseISO(task.startDate)) {
            updatedTask.startDate = newDateStr;
          }
        }
        updateTask(updatedTask);
      }
      return;
    }

    if (over && active.data.current?.task && active.data.current?.originalDate) {
      const task = active.data.current.task as Task;
      const originalDateStr = active.data.current.originalDate;
      const newDateStr = over.data.current?.date;
      
      if (newDateStr && originalDateStr && newDateStr !== originalDateStr) {
        const originalDate = parseISO(originalDateStr);
        const newDate = parseISO(newDateStr);
        
        // Calculate the difference in time
        const diffTime = newDate.getTime() - originalDate.getTime();
        
        const updatedTask = { ...task };
        
        // Update due_date
        const originalDueDate = parseISO(task.due_date);
        const newDueDate = new Date(originalDueDate.getTime() + diffTime);
        updatedTask.due_date = newDueDate.toISOString();
        
        // Update startDate if it exists
        if (task.startDate) {
          const originalStartDate = parseISO(task.startDate);
          const newStartDate = new Date(originalStartDate.getTime() + diffTime);
          updatedTask.startDate = newStartDate.toISOString().split('T')[0];
        }
        
        // Update endDate if it exists
        if (task.endDate) {
          const originalEndDate = parseISO(task.endDate);
          const newEndDate = new Date(originalEndDate.getTime() + diffTime);
          updatedTask.endDate = newEndDate.toISOString().split('T')[0];
        }

        updateTask(updatedTask);
      }
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
    setDateRange({ startDate: '', endDate: '' });
  };
  
  const navigatePrev = () => setCurrentDate(subDays(currentDate, 7));
  const navigateNext = () => setCurrentDate(addDays(currentDate, 7));

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setCurrentDate(new Date());
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Cronograma Gantt</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Arraste as tarefas para reagendar ou clique para editar</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter Inputs */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#111111] px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 pr-2 border-r border-slate-100 dark:border-white/10">
              <Filter size={14} className="text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filtrar</span>
            </div>
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
            {(dateRange.startDate || dateRange.endDate) && (
              <button 
                onClick={clearFilters}
                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                title="Limpar filtros"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Navigation Controls - Only show if not filtering */}
          {(!dateRange.startDate && !dateRange.endDate) && (
            <div className="flex items-center gap-1 bg-white dark:bg-[#111111] p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
              <button onClick={navigatePrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={navigateToday} className="px-3 py-1.5 font-medium text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5">
                <CalendarIcon size={14} />
                Hoje
              </button>
              <button onClick={navigateNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col flex-1 min-h-[600px]">
          {/* Header Row */}
          <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <div className="w-64 flex-shrink-0 p-4 font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 z-10 flex items-center">
              Tarefa
            </div>
            <div className="flex overflow-x-auto hide-scrollbar">
              {days.map(day => (
                <div 
                  key={day.toISOString()} 
                  className={`min-w-[60px] p-2 text-center border-r border-slate-200 dark:border-white/10 flex-shrink-0 ${isToday(day) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                >
                  <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center mx-auto font-mono ${isToday(day) ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="overflow-auto flex-1">
            {filteredTasks.map(task => (
              <div key={task.id} className="flex hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                {/* Task Name Column */}
                <div className="w-64 flex-shrink-0 p-3 border-r border-slate-200 dark:border-white/10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#111111] sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      task.priority === 'high' ? 'bg-rose-500' : 
                      task.priority === 'medium' ? 'bg-amber-500' : 
                      'bg-emerald-500'
                    }`} />
                    <div 
                      className="truncate text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" 
                      title={task.title}
                      onClick={() => setEditingTask(task)}
                    >
                      {task.title}
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        {task.startDate && <span>{new Date(task.startDate).toLocaleDateString('pt-BR')}</span>}
                        {task.startDate && task.endDate && <span> - </span>}
                        {task.endDate && <span>{new Date(task.endDate).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCommentingTask(task)}
                    className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    title="Comentários"
                  >
                    <MessageSquare size={14} />
                    {task.comments && task.comments.length > 0 && (
                      <span className="text-[10px] font-bold font-mono">{task.comments.length}</span>
                    )}
                  </button>
                </div>

                {/* Timeline Columns */}
                <div className="flex">
                  {days.map(day => {
                    const hasDates = !!(task.startDate && task.endDate);
                    const isTaskDate = hasDates 
                      ? isWithinInterval(day, { 
                          start: startOfDay(parseISO(task.startDate!)), 
                          end: endOfDay(parseISO(task.endDate!)) 
                        })
                      : isSameDay(parseISO(task.due_date), day);
                    
                    const isStart = hasDates ? isSameDay(parseISO(task.startDate!), day) : true;
                    const isEnd = hasDates ? isSameDay(parseISO(task.endDate!), day) : true;

                    return (
                      <DroppableCell key={day.toISOString()} date={day} taskId={task.id}>
                        {isTaskDate && (
                          <DraggableTaskBar 
                            task={task} 
                            date={day}
                            isStart={isStart}
                            isEnd={isEnd}
                            onClick={setEditingTask} 
                          />
                        )}
                      </DroppableCell>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {filteredTasks.length === 0 && (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500 text-sm">
                {tasks.length === 0 ? "Nenhuma tarefa criada." : "Nenhuma tarefa encontrada neste intervalo."}
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="h-8 rounded-md shadow-xl bg-indigo-600 text-white flex items-center px-2 w-[150px] opacity-90 cursor-grabbing">
              <span className="text-xs font-bold truncate drop-shadow-sm">{activeTask.title}</span>
            </div>
          ) : null}
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
