"use client";

import { useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from "react-markdown"


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Sparkles } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

type ApiProject = {
  id: string;
  name: string;
};

type ApiTask = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  dueDate?: string | null;
};

type ApiMember = {
  userId: string;
  user: { id: string; name: string; email: string; image?: string | null };
};

export default function TasksPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createAssigneeId, setCreateAssigneeId] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [taskActionError, setTaskActionError] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/projects', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to load projects');
        }
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((proj: ApiProject) => ({ id: proj.id, name: proj.name }));
        setProjects(mapped);
        if (mapped.length && !selectedProjectId) {
          setSelectedProjectId(mapped[0].id);
        }
      })
      .catch(() => {
        setProjects([]);
      })
        .finally(() => setLoadingProjects(false));
      }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    fetch(`/api/tasks?projectId=${selectedProjectId}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to load tasks');
        }
        return res.json();
      })
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setTasks([]);
      })
      .finally(() => setLoadingTasks(false));
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setMembers([]);
      return;
    }

    setLoadingMembers(true);
    fetch(`/api/members?projectId=${selectedProjectId}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to load members');
        }
        return res.json();
      })
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setMembers([]);
      })
      .finally(() => setLoadingMembers(false));
  }, [selectedProjectId]);

  const kanbanTasks = useMemo(() => {
    const memberMap = new Map(members.map((member) => [member.userId, member.user.name]));
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority || 'MEDIUM',
      assigneeName: task.assignee?.name || task.assignee?.email || (task.assigneeId ? memberMap.get(task.assigneeId) || 'Member' : 'Team'),
      dueDate: task.dueDate ?? null,
    }));
  }, [tasks, members]);

  const assigneeOptions = useMemo(
    () => members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
    })),
    [members]
  );

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    if (status === 'unauthenticated' || !session?.user?.id) {
      setCreateError('Please sign in before creating a task.');
      await signIn();
      return;
    }
    const title = createTitle.trim();
    if (!title) {
      setCreateError('Task title is required');
      return;
    }
    if (!selectedProjectId) {
      setCreateError('Select a project first');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          projectId: selectedProjectId,
          dueDate: createDueDate ? new Date(createDueDate).toISOString() : undefined,
          assigneeId: createAssigneeId || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in to create a task.');
        }
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to create task');
      }

      const created = await res.json();
      setTasks((prev) => [created, ...prev]);
      setCreateTitle('');
      setCreateDueDate('');
      setCreateAssigneeId('');
      setCreateError('');
      setCreateOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create task failed';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenCreate = () => {
    if (loadingProjects) return;
    if (!projects.length) {
      setCreateError('Create a project first.');
    }
    if (!selectedProjectId && projects.length) {
      setCreateError('Select a project first.');
    }
    setCreateOpen(true);
  };

  const handleUpdatePriority = async (taskId: string, nextPriority: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: nextPriority }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update priority');
      }

      const updated = await res.json();
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update priority failed';
      setTaskActionError(message);
    }
  };


  const handleUpdateStatus = async (taskId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update task');
      }

      const updated = await res.json();
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update task failed';
      setTaskActionError(message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to delete task');
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete task failed';
      setTaskActionError(message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Keep work moving by project and status.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="sm:w-[220px]">
              <SelectValue placeholder={loadingProjects ? 'Loading projects...' : 'Select project'} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  {proj.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="rounded-xl gap-2 h-11 px-6 font-semibold"
            onClick={handleOpenCreate}
            disabled={loadingProjects}
          >
            <Plus size={18} />
            Add Task
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="rounded-xl gap-2 h-11 px-4 font-semibold"
                  variant="outline"
                  onClick={async () => {
                    if (!selectedProjectId) {
                      setSummaryResult('Select a project first');
                      setSummaryOpen(true);
                      return;
                    }
                    setSummaryOpen(true);
                    setSummaryLoading(true);
                    setSummaryResult(null);
                    try {
                      const res = await fetch('/api/ai', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: selectedProjectId }),
                      });
                      const payload = await res.json().catch(() => ({}));
                      setSummaryResult(payload?.summary ?? JSON.stringify(payload));
                    } catch (e) {
                      setSummaryResult('Failed to get summary');
                    } finally {
                      setSummaryLoading(false);
                    }
                  }}
                  disabled={loadingProjects || !selectedProjectId}
                  aria-label="Summarize project"
                >
                  <Sparkles size={18} className="text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Summarize project</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) {
                setCreateTitle('');
                setCreateDueDate('');
                setCreateAssigneeId('');
                setCreateError('');
              }
            }}
          >
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Create task</DialogTitle>
                <DialogDescription>Add a task to the selected project.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task title</Label>
                  <Input
                    id="task-title"
                    placeholder="Design QA checklist"
                    value={createTitle}
                    onChange={(event) => setCreateTitle(event.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due-date">Due date</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={createDueDate}
                    onChange={(event) => setCreateDueDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assign to</Label>
                  <Select
                    value={createAssigneeId || 'UNASSIGNED'}
                    onValueChange={(value) => setCreateAssigneeId(value === 'UNASSIGNED' ? '' : value)}
                  >
                    <SelectTrigger id="task-assignee">
                      <SelectValue placeholder={loadingMembers ? 'Loading members...' : 'Unassigned'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                      {assigneeOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email || 'User'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {createError ? (
                  <p className="text-sm text-destructive">{createError}</p>
                ) : null}
                <DialogFooter>
                  <Button type="submit" className="rounded-xl" disabled={creating}>
                    {creating ? 'Creating...' : 'Create task'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
            <Dialog open={summaryOpen} onOpenChange={(open) => { setSummaryOpen(open); if (!open) setSummaryResult(null); }}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Project summary</DialogTitle>
                  <DialogDescription>
                    {summaryLoading ? 'Generating summary...' : 'Summary for the selected project.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                  {summaryLoading ? (
                    <p>Loading...</p>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto">
                      <ReactMarkdown>{summaryResult ?? 'No summary available.'}</ReactMarkdown>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={() => setSummaryOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {loadingProjects ? (
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full mt-4" />
          </CardContent>
        </Card>
      ) : !projects.length ? (
        <Card className="border-dashed border-2 border-muted-foreground/20 rounded-2xl">
          <CardContent className="p-10 text-center space-y-2">
            <p className="text-lg font-semibold">No projects yet</p>
            <p className="text-sm text-muted-foreground">Create a project first to add tasks.</p>
          </CardContent>
        </Card>
      ) : loadingTasks ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i} className="rounded-2xl border-none shadow-sm p-6 space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {taskActionError ? (
            <p className="text-sm text-destructive">{taskActionError}</p>
          ) : null}
          <KanbanBoard
            tasks={kanbanTasks}
            onStatusChange={handleUpdateStatus}
            onPriorityChange={handleUpdatePriority}
            onDelete={handleDeleteTask}
          />
        </>
      )}
    </div>
  );
}
