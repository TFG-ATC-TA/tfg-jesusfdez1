/**
 * Contenedor de página principal
 * Proporciona layout consistente con scroll y padding para todas las páginas
 */

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Props del componente PageContainer
 */
export default function PageContainer({
  children,
  scrollable = false
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-52px)]">
          <div className="h-full p-2 md:px-8 sm:landscape:pb-24 md:landscape:pb-16">{children}</div>
        </ScrollArea>
      ) : (
        <div className="h-full p-2 md:px-8 sm:landscape:pb-24 md:landscape:pb-16">{children}</div>
      )}
    </>
  );
}
