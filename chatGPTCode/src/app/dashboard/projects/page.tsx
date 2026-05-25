"use client";

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus } from 'lucide-react';

type ProjectCardData = {
  id: string;
  title: string;
  description: string;
  memberCount: number;
  taskCount: number;
  progress: number;
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
  const completedCount = proj.tasks?.filter((task) => task.status === 'DONE').length ?? 0;
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  return {
    id: proj.id,
    title: proj.name,
    description: proj.description || 'No description yet.',
    memberCount: proj.members?.length ?? 0,
    taskCount,
    progress,
  };
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createError, setCreateError] = useState('');

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
        setProjects(list.map((proj: ApiProject) => mapProject(proj)));
      })
      .catch(() => {
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
          <h1 className="text-3xl font-headline font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Track every project across your workspace.</p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 h-11 px-6 font-semibold">
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
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
        ) : projects.length ? (
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
        ) : (
          <Card className="col-span-full border-dashed border-2 border-muted-foreground/20 rounded-2xl">
            <CardContent className="p-10 text-center space-y-2">
              <p className="text-lg font-semibold">No projects yet</p>
              <p className="text-sm text-muted-foreground">Create a project to start tracking tasks.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
