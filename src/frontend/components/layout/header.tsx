/**
 * Componente de header con navegación de breadcrumbs
 * Muestra la ruta actual y permite navegación hacia atrás
 */

import { Home } from "lucide-react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Traducciones de rutas para mostrar nombres amigables
 * Mapea las rutas técnicas a nombres en español
 */
const pathTranslations: { [key: string]: string } = {
  'users': 'Usuarios',
  'farms': 'Granjas',
  'devices': 'Dispositivos',
  'notifications': 'Notificaciones',
};

/**
 * Componente de header principal
 * Renderiza breadcrumbs de navegación basados en la ruta actual
 */
export default function Header() {
  const pathname = usePathname();
  const pathSegments = pathname?.slice(1).split('/').filter(Boolean) || [];

  /**
   * Obtiene la traducción de un segmento de ruta
   * @param segment - Segmento de ruta a traducir
   * @returns Nombre traducido o el segmento original si no hay traducción
   */
  const getTranslatedSegment = (segment: string) => {
    return pathTranslations[segment.toLowerCase()] || segment;
  };

  return (
    <header className="sticky inset-x-0 top-0 w-full">
      <nav className="flex items-center py-2 sm:px-6 sm:py-2">
        <div className="text-sm font-medium flex-grow mx-4 flex items-center mt-3">
          {/* Solo mostrar breadcrumbs si no estamos en la página principal */}
          {pathname !== '/' && (
            <>
              {/* Enlace a la página principal */}
              <Link href="/" className="hover:text-primary flex items-center relative top-[0.5px]">
                <Home className="h-4 w-4" />
              </Link>
              {/* Breadcrumbs dinámicos basados en la ruta */}
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
      </nav>
    </header>
  );
}
