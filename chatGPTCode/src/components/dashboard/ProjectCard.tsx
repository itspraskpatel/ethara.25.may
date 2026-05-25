import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Layout } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  memberCount: number;
  taskCount: number;
  progress: number;
}

export function ProjectCard({ id, title, description, memberCount, taskCount, progress }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/projects/${id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer rounded-2xl border-none shadow-sm group hover:shadow-md transition-shadow hover:ring-1 hover:ring-primary/20">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Layout size={20} />
            </div>
            <Badge variant="secondary" className="font-normal text-muted-foreground bg-secondary/50">
              {taskCount} tasks
            </Badge>
          </div>
          <CardTitle className="text-xl font-headline tracking-tight">{title}</CardTitle>
          <CardDescription className="line-clamp-2 mt-1">{description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users size={16} />
              <span>{memberCount} members</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-secondary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}