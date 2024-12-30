'use client';

import { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Settings, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { roleColors } from '@/constants/data';

type UserNavProps = {
  isMinimized: boolean;
};


export function UserNav({ isMinimized }: UserNavProps) {
  const { data: session } = useSession();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (session) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center w-full p-2 rounded-md border-2 border-input hover:bg-accent hover:text-accent-foreground   bg-white dark:bg-gray-800  dark:text-white ",
              isMinimized ? "justify-center" : "justify-start"
            )}>
              <Avatar className="h-8 w-8">
                <AvatarImage
                  alt={session.user?.name ?? ''}
                />
                <AvatarFallback>
                  {session.user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              {!isMinimized && (
                <span className="ml-3 truncate text-md font-semibold">
                  {`${session.user?.name} ${session.user?.surname}`}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn("mt-2", {
              "ml-10": !isMinimized,
              "ml-[4.5rem]": isMinimized,
            })}
            align="end"
            forceMount
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium leading-none">
                  {`${session.user?.email}`}
                </p>
                <Badge
                  className="text-xs leading-none pointer-events-none"
                  style={{ backgroundColor: roleColors[session.user?.role], color: 'white' }}
                >
                {session.user?.role}
              </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  return null;
}

