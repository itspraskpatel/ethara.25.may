"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/app/api/lib/utils';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckCircle2, 
  Settings, 
  LogOut,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckCircle2 },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-white border-r">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">T</div>
        <span className="text-xl font-headline font-bold text-foreground">Tasko</span>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}>
                  <Icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-1">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5"
        >
          <LogOut size={18} />
          Log out
        </Button>
      </div>
    </div>
  );
}