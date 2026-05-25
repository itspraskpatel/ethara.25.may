import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/api/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface TaskCardProps {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName: string;
  dueDate?: string | null;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onPriorityChange?: (taskId: string, priority: TaskPriority) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export function TaskCard({
  id,
  title,
  status,
  priority,
  assigneeName,
  dueDate,
  onStatusChange,
  onPriorityChange,
  onDelete,
}: TaskCardProps) {
  const assigneeLabel = assigneeName || 'Team';
  const dueLabel = (() => {
    if (!dueDate) return 'No due date';
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) return 'No due date';
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  })();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);

  const handleStatusSelect = (value: TaskStatus) => {
    if (value === status) return;
    setPendingStatus(value);
    setStatusOpen(true);
  };

  const confirmStatusChange = () => {
    if (!pendingStatus) return;
    onStatusChange?.(id, pendingStatus);
    setStatusOpen(false);
    setPendingStatus(null);
  };
  return (
    <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all  active:cursor-grabbing group">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Select value={priority} onValueChange={(value) => onPriorityChange?.(id, value as TaskPriority)}>
            <SelectTrigger className={cn("h-7 w-[92px] rounded-lg text-[10px] px-2", priorityColors[priority])}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">LOW</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
              <SelectItem value="HIGH">HIGH</SelectItem>
              <SelectItem value="URGENT">URGENT</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 hover:cursor-grab">
            <Select value={status} onValueChange={(value) => handleStatusSelect(value as TaskStatus)}>
              <SelectTrigger className="h-7 w-[110px] rounded-lg text-[10px] px-2 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        
        <h4 className="text-sm font-medium leading-tight whitespace-normal break-words">{title}</h4>

        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span className="text-[10px] font-medium">{dueLabel}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">{assigneeLabel}</span>
            <Avatar className="h-6 w-6 border-2 border-white">
              <AvatarImage src={`https://picsum.photos/seed/${assigneeLabel}/100/100`} />
              <AvatarFallback>{assigneeLabel.charAt(0) || 'T'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{title}" from the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusOpen} onOpenChange={setStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change status?</AlertDialogTitle>
            <AlertDialogDescription>
              Move "{title}" to {pendingStatus?.replace('_', ' ')?.toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}