import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Verificar que ScrollArea esté correctamente exportado

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
          <div className="h-full p-2 md:px-8">{children}</div>
        </ScrollArea>
      ) : (
        <div className="h-full p-2 md:px-8">{children}</div>
      )}
    </>
  );
}
