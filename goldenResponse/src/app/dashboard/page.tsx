"use client"

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Clock, Link, ListTodo, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ProjectCardData = {
  id: string;
  title: string;
  description: string;
  memberCount: number;
  taskCount: number;
  progress: number;
  inProgressCount: number;
  completedCount: number;
};

type ApiProject = {
  id: string;
  name: string;
  description?: string | null;
  members?: Array<{ id: string }>;
  tasks?: Array<{ id: string; status?: string }>;
};

function mapProject(proj: ApiProject): ProjectCardData {
  const taskCount = proj.tasks?.length ?? 0;
  const inProgressCount = proj.tasks?.filter((task) => task.status === 'IN_PROGRESS').length ?? 0;
  const completedCount = proj.tasks?.filter((task) => task.status === 'DONE').length ?? 0;
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  return {
    id: proj.id,
    title: proj.name,
    description: proj.description || 'No description yet.',
    memberCount: proj.members?.length ?? 0,
    taskCount,
    progress,
    inProgressCount,
    completedCount,
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [userName, setUserName] = useState('User');

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
        const mapped = list.map((proj: ApiProject) => mapProject(proj));
        setProjects(mapped);
      })
      .catch(() => {
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('signupName');
    if (stored) {
      setUserName(stored);
    }
  }, []);

  const totalTasks = projects.reduce((sum, proj) => sum + proj.taskCount, 0);
  const inProgressTasks = projects.reduce((sum, proj) => sum + proj.inProgressCount, 0);
  const completedTasks = projects.reduce((sum, proj) => sum + proj.completedCount, 0);
  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: ListTodo, color: 'text-primary bg-primary/10' },
    { label: 'In Progress', value: inProgressTasks, icon: Clock, color: 'text-accent bg-accent/10' },
    { label: 'Completed', value: completedTasks, icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
  ];

  const resetCreateForm = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateError('');
  };

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    if (status === 'unauthenticated' || !session?.user?.id) {
      setCreateError('Please sign in before creating a project.');
      await signIn();
      return;
    }
    const name = createName.trim();
    if (!name) {
      setCreateError('Project name is required');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: createDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in to create a project.');
        }
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to create project');
      }

      const created = await res.json();
      setProjects((prev) => [mapProject(created), ...prev]);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create project failed';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Good Morning, {userName}</h1>
          <p className="text-muted-foreground mt-1">Here is what is happening with your projects today.</p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 h-11 px-6 font-semibold ">
              <Plus size={18} />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Create new project</DialogTitle>
              <DialogDescription>
                Set a name and optional description to get your project started.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  placeholder="Complete the Redesign"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Short summary for the team..."
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                />
              </div>
              {createError ? (
                <p className="text-sm text-destructive">{createError}</p>
              ) : null}
              <DialogFooter>
                <Button type="submit" className="rounded-xl" disabled={creating}>
                  {creating ? 'Creating...' : 'Create project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-none shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl", stat.color)}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-headline font-bold">Active Projects</h2>
          <Button variant="link" className="text-primary font-semibold" onClick={()=>{
            // load page /projects
            window.location.href = '/dashboard/projects';
          }}>View all</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="rounded-2xl border-none shadow-sm p-6 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              </Card>
            ))
          ) : (
            projects.map((proj) => (
              <ProjectCard 
                key={proj.id}
                id={proj.id}
                title={proj.title}
                description={proj.description}
                memberCount={proj.memberCount}
                taskCount={proj.taskCount}
                progress={proj.progress}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}