import ThemeToggle from '@/components/layout/theme-toggle';
import { Home } from "lucide-react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const pathname = usePathname();
  const pathSegments = pathname?.slice(1).split('/').filter(Boolean) || [];

  return (
    <header className="sticky inset-x-0 top-0 w-full">
      <nav className="flex items-center py-2 sm:px-6 sm:py-2">
        <div className="text-sm font-medium flex-grow mx-4">
          {pathSegments.map((segment, index) => {
            const path = '/' + pathSegments.slice(0, index + 1).join('/');
            return (
              <span key={path}>
                {index > 0 && <span className="mx-2">/</span>}
                <Link 
                  href={path}
                  className="hover:underline capitalize inline-flex items-center"
                >
                  {segment === "dashboard" ? <span className="relative top-0.5"><Home className="h-4 w-4" /></span> : segment}
                </Link>
              </span>
            );
          })}
        </div>
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
