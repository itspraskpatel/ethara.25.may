"use client"

import { TaskCard, TaskPriority, TaskStatus } from './TaskCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: any;
  assigneeName: string;
  dueDate?: string | null;
}

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onPriorityChange?: (taskId: string, priority: TaskPriority) => void;
  onDelete?: (taskId: string) => void;
}

const COLUMNS: { label: string; status: TaskStatus }[] = [
  { label: 'To Do', status: 'TODO' },
  { label: 'In Progress', status: 'IN_PROGRESS' },
  { label: 'Completed', status: 'DONE' },
];

export function KanbanBoard({ tasks, onStatusChange, onPriorityChange, onDelete }: KanbanBoardProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-6 pb-6">
        {COLUMNS.map((col) => (
          <div key={col.status} className="w-80 flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </h3>
                <span className="bg-secondary text-muted-foreground px-2 py-0.5 rounded-full text-xs font-bold">
                  {tasks.filter(t => t.status === col.status).length}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-h-[500px] bg-secondary/20 rounded-2xl p-3">
              {tasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <TaskCard 
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    status={task.status}
                    priority={task.priority}
                    assigneeName={task.assigneeName}
                    dueDate={task.dueDate}
                    onStatusChange={onStatusChange}
                    onPriorityChange={onPriorityChange}
                    onDelete={onDelete}
                  />
                ))}
              {tasks.filter(t => t.status === col.status).length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl p-8 text-center space-y-2">
                  <p className="text-xs">No tasks yet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}