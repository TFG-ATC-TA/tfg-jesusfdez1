import ThemeToggle from '@/components/layout/theme-toggle';
import { Home } from "lucide-react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const pathTranslations: { [key: string]: string } = {
  'users': 'Usuarios',
  'farms': 'Granjas',
  'devices': 'Dispositivos',
  'notifications': 'Notificaciones',
};

export default function Header() {
  const pathname = usePathname();
  const pathSegments = pathname?.slice(1).split('/').filter(Boolean) || [];

  const getTranslatedSegment = (segment: string) => {
    return pathTranslations[segment.toLowerCase()] || segment;
  };

  return (
    <header className="sticky inset-x-0 top-0 w-full">
      <nav className="flex items-center py-2 sm:px-6 sm:py-2">
        <div className="text-sm font-medium flex-grow mx-4 flex items-center mt-3">
          {pathname !== '/' && (
            <>
              <Link href="/" className="hover:text-primary flex items-center relative top-[0.5px]">
                <Home className="h-4 w-4" />
              </Link>
              {pathSegments.map((segment, index) => (
                <span key={segment}>
                  <span className="mx-2">/</span>
                  <Link 
                    href={'/' + pathSegments.slice(0, index + 1).join('/')}
                    className="hover:underline capitalize inline-flex items-center"
                  >
                    {getTranslatedSegment(segment)}
                  </Link>
                </span>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
