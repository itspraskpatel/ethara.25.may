"use client"

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { data: session } = useSession();
  const [displayName, setDisplayName] = useState('User');

  useEffect(() => {
    // Prefer session user name from NextAuth, fall back to localStorage
    if (session?.user?.name) {
      setDisplayName(session.user.name);
      return;
    }
    try {
      const stored = localStorage.getItem('signupName');
      if (stored) setDisplayName(stored);
    } catch {
      // ignore
    }
  }, [session]);

  return (
    <nav className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 lg:gap-8 flex-1">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu size={20} />
        </Button>
        <div className="relative w-full max-w-md hidden sm:block">
        </div>
      </div>

      <div className="flex items-center gap-4">
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3  pl-2 hover:bg-secondary/20 py-1 px-2 rounded-xl transition-colors ">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{displayName}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarFallback>{displayName.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </div>
    </nav>
  );
}