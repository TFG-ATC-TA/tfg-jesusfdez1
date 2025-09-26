import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DataTableSearchProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DataTableSearch({ value, onChange }: DataTableSearchProps) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        placeholder="Buscar..."
        value={value}
        onChange={onChange}
        className="pl-8 w-full bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700"
        aria-label="Buscar"
      />
    </div>
  );
}
