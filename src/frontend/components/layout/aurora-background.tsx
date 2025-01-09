"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

// [--dark-aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main className="relative h-full w-full overflow-hidden flex items-stretch">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `
          [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
          [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
          [--light-aurora:repeating-linear-gradient(100deg,var(--blue-600)_10%,var(--blue-500)_20%,var(--blue-700)_30%)]
          [--dark-aurora:repeating-linear-gradient(100deg,var(--blue-700)_10%,var(--blue-600)_20%,var(--blue-800)_30%)]

          [background-image:var(--white-gradient),var(--light-aurora)]
          dark:[background-image:var(--dark-gradient),var(--dark-aurora)]
          [background-size:300%,_200%]
          [background-position:50%_50%,50%_50%]
          filter blur-[10px] invert dark:invert-0
          after:content-[""] after:absolute after:inset-0 
          after:[background-image:var(--white-gradient),var(--light-aurora)] 
          after:dark:[background-image:var(--dark-gradient),var(--dark-aurora)]
          after:[background-size:200%,_100%] 
          after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
          pointer-events-none
          absolute -inset-[40px] opacity-50 will-change-transform h-[130%]`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_50%_100%,black_20%,var(--transparent)_70%)]`
          )}
        />
      </div>
      <div
        className={cn(
          "relative z-10 flex flex-col h-full w-full items-center justify-start bg-transparent",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </main>
  );
};
