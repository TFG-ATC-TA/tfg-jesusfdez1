import React, { memo, useCallback } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const columnNames: Record<string, string> = {
  role: 'rol',
  type: 'tipo',
};

interface FilterSelectorProps {
  filter: string;
  data: any[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  options: string[];
}

const FilterSelector = memo(({ filter, data, selectedFilters, onFilterChange, options }: FilterSelectorProps) => {
  const uniqueValues = options.length > 0 ? options : Array.from(new Set(data.map((item) => (item as Record<string, any>)[filter])));
  const filterName = columnNames[filter] || filter;

  const handleCheckboxChange = useCallback((value: string) => {
    const currentFilters = selectedFilters[filter] || [];
    const updatedFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value];
    onFilterChange({
      ...selectedFilters,
      [filter]: updatedFilters
    });
  }, [filter, selectedFilters, onFilterChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-[200px] bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filtrar por {filterName}</span>
        </div>
        <div className="ml-auto">
          <ChevronDown className="w-4 h-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
        {uniqueValues.map((value, index) => (
          <DropdownMenuItem
            key={index}
            className="flex items-center space-x-2 cursor-default"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
              <Checkbox
                checked={selectedFilters[filter]?.includes(value) || false}
                onCheckedChange={() => handleCheckboxChange(value)}
              />
              <span className="pointer-events-none ml-2">{value}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

interface DataTableFiltersProps {
  filters: string[];
  data: any[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  filterOptions: Record<string, string[]>;
}

export function DataTableFilters({ filters, data, selectedFilters, onFilterChange, filterOptions }: DataTableFiltersProps) {
  return (
    <div className="flex space-x-2">
      {filters.map((filter) => (
        <FilterSelector
          key={filter}
          filter={filter}
          data={data}
          selectedFilters={selectedFilters}
          onFilterChange={onFilterChange}
          options={filterOptions[filter] || []}
        />
      ))}
    </div>
  );
}