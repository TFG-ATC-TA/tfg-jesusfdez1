"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type TabItem = {
  title?: string;
  icon?: LucideIcon;
  type?: "separator";
  action?: () => void;
};

interface Props {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  onChange?: (index: number | null) => void;
  activeIndex?: number;
}

export function ExpandableTabs({ tabs, className, activeColor: _activeColor = "text-primary", onChange, activeIndex }: Props) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !(ref.current as Element).contains(e.target as Node)) {
        onChange?.(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onChange]);

  return (
    <div ref={ref} className={cn(
      "flex flex-wrap items-center justify-center rounded-xl",
      "border-2 border-border dark:border-border/50",
      "bg-background dark:bg-gray-800",
      "p-1 gap-3 shadow-md dark:shadow-lg",
      "z-70 mx-4",
      className
    )}>
      {tabs.map((tab, i) => tab.type === "separator" 
        ? <div key={i} className="mx-2 h-5 w-[2px] rounded-full bg-border dark:bg-border/50" /> 
        : (
          <button
            key={i}
            onClick={() => {
              onChange?.(i);
            }}
            className={cn(
              "flex items-center rounded-lg p-2 text-sm font-medium",
              "transition-colors",
              "hover:bg-primary hover:text-primary-foreground",
              activeIndex === i 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground dark:text-white"
            )}>
            {tab.icon && <tab.icon size={20} />}
          </button>
        )
      )}
    </div>
  );
}
