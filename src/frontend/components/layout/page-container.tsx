import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
