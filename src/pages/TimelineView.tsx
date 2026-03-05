import React, { useState, useMemo } from 'react';
import { useTasks, Task } from '../context/TaskContext';
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
  isPast
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GripVertical } from 'lucide-react';

// --- Components ---

const DraggableTaskBar: React.FC<{ task: Task }> = ({ task }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const getTaskColor = (task: Task) => {
    const dueDate = parseISO(task.due_date);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    if (isPast(dueDate) || isToday(dueDate)) {
      return 'bg-rose-500 border-rose-600 shadow-rose-200';
    }
    if (dueDate <= threeDaysFromNow) {
      return 'bg-orange-500 border-orange-600 shadow-orange-200';
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
      {...listeners}
      {...attributes}
      className={`h-8 rounded-md shadow-sm border ${getTaskColor(task)} cursor-grab active:cursor-grabbing flex items-center justify-between px-2 relative group hover:brightness-110 transition-all`}
      title={task.title}
    >
      <span className="text-[10px] font-bold text-white truncate w-full">{task.title}</span>
      <div className="absolute right-1 opacity-0 group-hover:opacity-100 text-white/80">
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
      className={`h-12 border-r border-b border-slate-100 min-w-[60px] relative transition-colors ${
        isOver ? 'bg-indigo-50/50' : ''
      } ${isToday(date) ? 'bg-slate-50/30' : ''}`}
    >
      <div className="absolute inset-1">
        {children}
      </div>
    </div>
  );
};

export const TimelineView: React.FC = () => {
  const { tasks, updateTask } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  // Calculate date range (2 weeks window centered on current date or start of week)
  const startDate = useMemo(() => subDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 3), [currentDate]);
  const endDate = useMemo(() => addDays(endOfWeek(currentDate, { weekStartsOn: 0 }), 10), [currentDate]);
  
  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.task) {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.data.current?.task) {
      const task = active.data.current.task as Task;
      const newDateStr = over.data.current?.date;
      
      // Only update if the date is different
      if (newDateStr && newDateStr !== task.due_date.split('T')[0]) {
        // Keep the original time, just update the date part
        const originalDate = new Date(task.due_date);
        const newDate = parseISO(newDateStr);
        newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds());
        
        updateTask({
          ...task,
          due_date: newDate.toISOString()
        });
      }
    }
  };

  const navigateToday = () => setCurrentDate(new Date());
  const navigatePrev = () => setCurrentDate(subDays(currentDate, 7));
  const navigateNext = () => setCurrentDate(addDays(currentDate, 7));

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cronograma Gantt</h1>
          <p className="text-slate-500 text-sm">Arraste as tarefas para reagendar</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={navigatePrev} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={navigateToday} className="px-4 py-2 font-medium text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2">
            <CalendarIcon size={16} />
            Hoje
          </button>
          <button onClick={navigateNext} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-[600px]">
          {/* Header Row */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-64 flex-shrink-0 p-4 font-semibold text-slate-600 text-sm border-r border-slate-200 bg-slate-50 z-10">
              Tarefa
            </div>
            <div className="flex overflow-x-auto hide-scrollbar">
              {days.map(day => (
                <div 
                  key={day.toISOString()} 
                  className={`min-w-[60px] p-2 text-center border-r border-slate-200 flex-shrink-0 ${isToday(day) ? 'bg-indigo-50/50' : ''}`}
                >
                  <div className={`text-xs font-medium uppercase mb-1 ${isToday(day) ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="overflow-auto flex-1">
            {tasks.map(task => (
              <div key={task.id} className="flex hover:bg-slate-50/50 transition-colors">
                {/* Task Name Column */}
                <div className="w-64 flex-shrink-0 p-3 border-r border-slate-200 border-b border-slate-100 flex items-center gap-2 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-rose-500' : 
                    task.priority === 'medium' ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`} />
                  <div className="truncate text-sm font-medium text-slate-700" title={task.title}>
                    {task.title}
                  </div>
                </div>

                {/* Timeline Columns */}
                <div className="flex">
                  {days.map(day => {
                    const isTaskDate = isSameDay(parseISO(task.due_date), day);
                    return (
                      <DroppableCell key={day.toISOString()} date={day} taskId={task.id}>
                        {isTaskDate && <DraggableTaskBar task={task} />}
                      </DroppableCell>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="p-12 text-center text-slate-400 italic">
                Nenhuma tarefa para exibir.
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="h-8 rounded-md shadow-lg bg-indigo-600 text-white flex items-center px-2 w-[150px] opacity-90 cursor-grabbing">
              <span className="text-xs font-bold truncate">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
