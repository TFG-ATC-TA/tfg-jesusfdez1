'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { navItems } from '@/constants/data';
import { UserNav } from '@/components/layout/user-nav';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

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
      <div className={cn(
        "flex items-center",
        isMinimized 
          ? "justify-center px-3 pt-7 pb-3" 
          : "justify-between px-6 pt-7 pb-4"
      )}>
        <Link href="/" className={cn("flex items-center justify-center", isMinimized ? "w-full ml-1" : "")}>
          <Image
            src="/logo.svg"
            alt="LactoKeeper Logo"
            width="50"
            height="50"
            className="text-primary dark:opacity-80"
          />
          {!isMinimized && (
            <span className="font-['LT_Saeada'] text-2xl text-foreground flex flex-col items-center leading-none ml-4">
              LACTO
              <span className="text-primary">KEEPER</span>
            </span>
          )}
        </Link>
        {!isMinimized && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            className="rounded-md border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isMinimized && (
        <div className="flex justify-center mt-2 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={toggle}
            className="rounded-md border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}
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