import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LucideIcon, Settings, LogOut } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { navItems } from '@/constants/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { roleColors } from '@/constants/data';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MobileSidebar({ className }: SidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const tabs = navItems
    .filter(item => item.roles.includes(session?.user?.role ?? ''))
    .map(item => ({
      title: item.name,
      icon: item.icon as LucideIcon,
    }));

  const activeIndex = navItems.findIndex(item => pathname.startsWith(item.href));

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-80 pb-4 px-2 bg-gradient-to-t  to-transparent ">
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          <ExpandableTabs
            tabs={tabs}
            activeIndex={activeIndex}
            onChange={(index) => {
              if (index === null) return;
              const navItem = navItems[index];
              if (navItem?.href) {
                router.push(navItem.href);
              }
            }}
            className="flex-1 shadow-md dark:shadow-lg rounded-xl 
                     border-2 border-border dark:border-border/50 mb-4 
                     bg-background dark:bg-gray-800"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-xl shadow-md dark:shadow-lg
                                border-2 border-border dark:border-border/50 
                                bg-background dark:bg-gray-800 mb-4
                                hover:bg-accent hover:text-accent-foreground
                                transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage alt={session?.user?.name ?? ''} />
                  <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mb-2">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-medium leading-none">
                    {`${session?.user?.email}`}
                  </p>
                  <Badge
                    className="text-xs leading-none pointer-events-none w-fit"
                    style={{ backgroundColor: roleColors[session?.user?.role ?? 'defaultRole'], color: 'white' }}
                  >
                    {session?.user?.role}
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
        </div>
      </div>
    </>
  );
}