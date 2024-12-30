'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Milk } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { navItems } from '@/constants/data';
import { UserNav } from '@/components/layout/user-nav';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession();
  const { isMinimized, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        `relative hidden h-screen flex-none border-r bg-card transition-all duration-300 ease-in-out md:flex md:flex-col`,
        !isMinimized ? 'w-64' : 'w-20',
        className
      )}
    >
      <div className="flex items-center justify-between p-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Milk className="h-9 w-8 text-primary" />
          <span className={cn('font-bold text-xl', isMinimized && 'hidden')}>LactoKeeper</span>
        </Link>
        <Button
          variant="outline"
          size="icon"
          onClick={toggle}
          className="rounded-md border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground "
        >
          <ChevronLeft className={cn("h-4 w-4", isMinimized && 'rotate-180')} />
        </Button>
      </div>
      <div className="flex-grow py-6 flex flex-col px-3">
        <nav className="space-y-3">
          {navItems
            .filter(item => item.roles.includes(session?.user?.role ?? ''))
            .map((item) => (
              <Link key={item.name} href={item.href} className="block">
               <Button variant="outline"
                  className={cn(
                    "w-full justify-start hover:bg-primary hover:text-primary-foreground ",
                    pathname.startsWith(item.href) ? 'bg-primary text-primary-foreground' : ' dark:bg-gray-800  dark:text-white',
                    isMinimized ? "px-4" : "px-6")}
                  title={item.description}>
                  <item.icon className={cn("h-5 w-5", !isMinimized && "mr-3")} />
                  {!isMinimized && <span>{item.name}</span>}
                </Button>
              </Link>
            ))}
        </nav>
      </div>
      <div className="px-3 py-2 mb-3">
        <UserNav isMinimized={isMinimized} />
      </div>
    </aside>
  );
}