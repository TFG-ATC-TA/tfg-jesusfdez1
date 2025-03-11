import React, { memo, useCallback, useEffect, useState } from 'react';
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
  key?: string; // Added key prop for re-rendering
}

const FilterSelector = memo(({ filter, data, selectedFilters, onFilterChange, options }: FilterSelectorProps) => {
  const uniqueValues = options.length > 0 ? options : Array.from(new Set(data.map((item) => (item as Record<string, any>)[filter])));
  const filterName = columnNames[filter] || filter;
  
  // Local state to track what's currently selected
  const [localSelectedValues, setLocalSelectedValues] = useState<string[]>(selectedFilters[filter] || []);
  
  // Update local state when selectedFilters changes from parent
  useEffect(() => {
    setLocalSelectedValues(selectedFilters[filter] || []);
  }, [selectedFilters, filter]);

  const handleCheckboxChange = useCallback((value: string) => {
    const updatedFilters = localSelectedValues.includes(value)
      ? localSelectedValues.filter(v => v !== value)
      : [...localSelectedValues, value];
    
    setLocalSelectedValues(updatedFilters);
    
    onFilterChange({
      ...selectedFilters,
      [filter]: updatedFilters
    });
  }, [filter, selectedFilters, onFilterChange, localSelectedValues]);

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
                checked={localSelectedValues.includes(value)}
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
  // Unique key to force re-render when selectedFilters changes
  const [filterKey, setFilterKey] = useState(0);
  
  // Update key when selectedFilters changes to force re-render
  useEffect(() => {
    setFilterKey(prev => prev + 1);
  }, [JSON.stringify(selectedFilters)]);

  return (
    <div className="flex space-x-2">
      {filters.map((filter) => (
        <FilterSelector
          key={`${filter}-${filterKey}`}
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