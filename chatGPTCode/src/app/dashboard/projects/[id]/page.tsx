"use client"

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Users, 
  ArrowLeft,
} from 'lucide-react';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState<{
    id: string;
    title: string;
    description: string;
    memberCount: number;
  } | null>(null);
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createAssigneeId, setCreateAssigneeId] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [taskActionError, setTaskActionError] = useState('');
  const [memberOpen, setMemberOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; userId: string; role: string; user: { id: string; name: string; email: string; image?: string | null } }>>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<Array<{ id: string; name: string; email: string; image?: string | null }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const projectId = Array.isArray(id) ? id[0] : id;

  const mapProject = (proj: any) => ({
    id: proj.id,
    title: proj.name ?? 'Untitled project',
    description: proj.description ?? 'No description yet.',
    memberCount: Array.isArray(proj.members) ? proj.members.length : 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          fetch('/api/projects', { credentials: 'include' }).then(r => r.json()),
          fetch(`/api/tasks?projectId=${projectId}`, { credentials: 'include' }).then(r => r.json())
        ]);
        
        const currentProject = projRes.find((p: any) => p.id === projectId);
        setProject(currentProject ? mapProject(currentProject) : null);
        const normalizedTasks = Array.isArray(tasksRes)
          ? tasksRes.map((task: any) => ({
              ...task,
              priority: task.priority || 'MEDIUM',
              dueDate: task.dueDate ?? null,
              assigneeName: task.assignee?.name || task.assignee?.email || (task.assigneeId ? 'Member' : 'Team'),
            }))
          : [];
        setTasks(normalizedTasks);
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const fetchMembers = async () => {
    if (!projectId) return;
    setMembersLoading(true);
    setMembersError('');
    try {
      const res = await fetch(`/api/members?projectId=${projectId}`, { credentials: 'include' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to load members');
      }
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load members';
      setMembersError(message);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (!memberOpen) return;
    fetchMembers();
  }, [memberOpen, projectId]);

  useEffect(() => {
    if (!projectId) return;
    fetchMembers();
  }, [projectId]);

  useEffect(() => {
    if (!memberOpen) return;
    if (userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        setUsersLoading(true);
        const res = await fetch(`/api/users?q=${encodeURIComponent(userQuery.trim())}`, { credentials: 'include' });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to search users');
        }
        const data = await res.json();
        setUserResults(Array.isArray(data) ? data : []);
      } catch {
        setUserResults([]);
      } finally {
        setUsersLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [memberOpen, userQuery]);

  useEffect(() => {
    if (!project) return;
    setProject((prev) => (prev ? { ...prev, memberCount: members.length } : prev));
  }, [members.length]);

  const existingMemberIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);
  const filteredResults = useMemo(
    () => userResults.filter((user) => !existingMemberIds.has(user.id)),
    [userResults, existingMemberIds]
  );

  const assigneeOptions = useMemo(
    () => members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
    })),
    [members]
  );

  const kanbanTasks = useMemo(() => {
    const memberMap = new Map(members.map((member) => [member.userId, member.user.name]));
    return tasks.map((task) => ({
      ...task,
      assigneeName: task.assigneeName || task.assignee?.name || task.assignee?.email || (task.assigneeId ? memberMap.get(task.assigneeId) || 'Member' : 'Team'),
    }));
  }, [tasks, members]);

  const handleAddMember = async (userId: string) => {
    if (!projectId) return;
    setMemberActionId(userId);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
          role: 'MEMBER',
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to add member');
      }
      await fetchMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add member';
      setMembersError(message);
    } finally {
      setMemberActionId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!projectId) return;
    setMemberActionId(userId);
    try {
      const res = await fetch('/api/members', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userId,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to remove member');
      }
      await fetchMembers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      setMembersError(message);
    } finally {
      setMemberActionId(null);
    }
  };

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

    setCreating(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          projectId,
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
      setTasks((prev) => [{ ...created, priority: created.priority || 'MEDIUM', dueDate: created.dueDate ?? null }, ...prev]);
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

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid grid-cols-3 gap-8">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="text-muted-foreground mt-2">The project you are looking for doesn't exist.</p>
        <Link href="/dashboard" className="mt-6">
          <Button variant="outline" className="rounded-xl">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'DONE').length;
  const isCompleted = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 rounded-lg -ml-2">
            <ArrowLeft size={16} />
            Back to Overview
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-headline font-bold tracking-tight">{project.title}</h1>
            <Badge variant="outline" className="rounded-lg bg-white">
              {isCompleted ? 'Completed' : 'In Progress'}
            </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      
                    </TooltipTrigger>
                  </Tooltip>
                </TooltipProvider>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">{project.description}</p>
          <div className="flex items-center gap-6 pt-2 border-2 p-2 rounded-3xl">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 px-2"
              onClick={() => setMemberOpen(true)}
            >
              <Users size={18} className="text-primary" />
              <span className="text-sm font-medium ">{project.memberCount} Team Members</span>
            </Button>
            <div className="flex -space-x-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center overflow-hidden">
                  <img src={`https://picsum.photos/seed/${i + 10}/100/100`} alt="Member" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                +2
              </div>
            </div>
          </div>
          <Dialog open={summaryOpen} onOpenChange={(open) => { setSummaryOpen(open); if (!open) setSummaryResult(null); }}>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Project summary</DialogTitle>
                <DialogDescription>
                  {summaryLoading ? 'Generating summary...' : 'Summary for this project.'}
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
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="rounded-xl gap-2 h-11 px-6 shadow-md font-semibold"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={18} />
            Add Task
          </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="rounded-xl gap-2 h-11 px-4 font-semibold m-4"
                      variant="outline"
                      onClick={async () => {
                        if (!projectId) {
                          setSummaryResult('Project id missing');
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
                            body: JSON.stringify({ projectId }),
                          });
                          const payload = await res.json().catch(() => ({}));
                          setSummaryResult(payload?.summary ?? JSON.stringify(payload));
                        } catch (e) {
                          setSummaryResult('Failed to get summary');
                        } finally {
                          setSummaryLoading(false);
                        }
                      }}
                      aria-label="Summarize project"
                    >
                      <Sparkles size={18} className="text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Summarize project</TooltipContent>
                </Tooltip>
              </TooltipProvider>
        </div>
      </div>

      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl">
        </div>
        
      </div>

      {taskActionError ? (
        <p className="text-sm text-destructive">{taskActionError}</p>
      ) : null}

      <KanbanBoard
        tasks={kanbanTasks}
        onStatusChange={handleUpdateStatus}
        onPriorityChange={handleUpdatePriority}
        onDelete={handleDeleteTask}
      />

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
            <DialogDescription>Add a task to this project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="task-title"
                placeholder="Design QA checklist"
                value={createTitle}
                onChange={(event) => setCreateTitle(event.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="task-due-date">Due date</label>
              <Input
                id="task-due-date"
                type="date"
                value={createDueDate}
                onChange={(event) => setCreateDueDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="task-assignee">Assign to</label>
              <Select
                value={createAssigneeId || 'UNASSIGNED'}
                onValueChange={(value) => setCreateAssigneeId(value === 'UNASSIGNED' ? '' : value)}
              >
                <SelectTrigger id="task-assignee">
                  <SelectValue placeholder={membersLoading ? 'Loading members...' : 'Unassigned'} />
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
            <div className="flex justify-end">
              <Button type="submit" className="rounded-xl" disabled={creating}>
                {creating ? 'Creating...' : 'Create task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Team members</DialogTitle>
            <DialogDescription>Manage who can access this project.</DialogDescription>
          </DialogHeader>

          {membersError ? (
            <p className="text-sm text-destructive">{membersError}</p>
          ) : null}

          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <p className="text-sm font-semibold">Current members</p>
              <ScrollArea className="h-64 rounded-xl border bg-secondary/10 p-3">
                <div className="space-y-3">
                  {membersLoading ? (
                    <p className="text-sm text-muted-foreground">Loading members...</p>
                  ) : members.length ? (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback>{member.user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{member.user.name}</p>
                            <p className="text-xs text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.userId)}
                          disabled={memberActionId === member.userId}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No members found.</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Add people</p>
              <Input
                placeholder="Search by name or email"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
              />
              <ScrollArea className="h-56 rounded-xl border bg-secondary/10 p-3">
                <div className="space-y-3">
                  {usersLoading ? (
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  ) : userQuery.trim().length < 2 ? (
                    <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
                  ) : filteredResults.length ? (
                    filteredResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(user.id)}
                          disabled={memberActionId === user.id}
                        >
                          Add
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No matching users.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}