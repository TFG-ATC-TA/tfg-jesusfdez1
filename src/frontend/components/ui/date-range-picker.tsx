'use client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format, parse, subDays } from 'date-fns';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type { DateRange } from 'react-day-picker';

// Utility functions
export type TimePickerType = "minutes" | "seconds" | "hours";

export function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}

export function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };

export function getValidNumber(
  value: string,
  { max, min = 0, loop = false }: GetValidNumberConfig
) {
  let numericValue = parseInt(value, 10);

  if (!isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, "0");
  }

  return "00";
}

export function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}

export function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value;
  return getValidNumber(value, { max: 59 });
}

type GetValidArrowNumberConfig = {
  min: number;
  max: number;
  step: number;
};

export function getValidArrowNumber(
  value: string,
  { min, max, step }: GetValidArrowNumberConfig
) {
  let numericValue = parseInt(value, 10);
  if (!isNaN(numericValue)) {
    numericValue += step;
    return getValidNumber(String(numericValue), { min, max, loop: true });
  }
  return "00";
}

export function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step });
}

export function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step });
}

export function setMinutes(date: Date, value: string) {
  const minutes = getValidMinuteOrSecond(value);
  date.setMinutes(parseInt(minutes, 10));
  return date;
}

export function setSeconds(date: Date, value: string) {
  const seconds = getValidMinuteOrSecond(value);
  date.setSeconds(parseInt(seconds, 10));
  return date;
}

export function setHours(date: Date, value: string) {
  const hours = getValidHour(value);
  date.setHours(parseInt(hours, 10));
  return date;
}

export function setDateByType(
  date: Date,
  value: string,
  type: TimePickerType
) {
  switch (type) {
    case "minutes":
      return setMinutes(date, value);
    case "seconds":
      return setSeconds(date, value);
    case "hours":
      return setHours(date, value);
    default:
      return date;
  }
}

export function getDateByType(date: Date, type: TimePickerType) {
  switch (type) {
    case "minutes":
      return getValidMinuteOrSecond(String(date.getMinutes()));
    case "seconds":
      return getValidMinuteOrSecond(String(date.getSeconds()));
    case "hours":
      return getValidHour(String(date.getHours()));
    default:
      return "00";
  }
}

export function getArrowByType(
  value: string,
  step: number,
  type: TimePickerType
) {
  switch (type) {
    case "minutes":
      return getValidArrowMinuteOrSecond(value, step);
    case "seconds":
      return getValidArrowMinuteOrSecond(value, step);
    case "hours":
      return getValidArrowHour(value, step);
    default:
      return "00";
  }
}

// TimePickerInput Component
export interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
}

export const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  (
    {
      className,
      type = "tel",
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)),
      setDate,
      onChange,
      onKeyDown,
      picker,
      onLeftFocus,
      onRightFocus,
      ...props
    },
    ref
  ) => {
    const [flag, setFlag] = React.useState<boolean>(false);
    const [prevIntKey, setPrevIntKey] = React.useState<string>("0");

    React.useEffect(() => {
      if (flag) {
        const timer = setTimeout(() => {
          setFlag(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }, [flag]);

    const calculatedValue = React.useMemo(() => {
      return getDateByType(date, picker);
    }, [date, picker]);

    const calculateNewValue = (key: string) => {
      return !flag ? "0" + key : calculatedValue.slice(1, 2) + key;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") return;
      e.preventDefault();
      if (e.key === "ArrowRight") onRightFocus?.();
      if (e.key === "ArrowLeft") onLeftFocus?.();
      if (["ArrowUp", "ArrowDown"].includes(e.key)) {
        const step = e.key === "ArrowUp" ? 1 : -1;
        const newValue = getArrowByType(calculatedValue, step, picker);
        if (flag) setFlag(false);
        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newValue, picker));
      }
      if (e.key >= "0" && e.key <= "9") {
        const newValue = calculateNewValue(e.key);
        if (flag) onRightFocus?.();
        setFlag((prev) => !prev);
        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newValue, picker));
      }
    };

    return (
      <Input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn(
          "w-[48px] text-center font-mono text-base tabular-nums caret-transparent focus:bg-accent focus:text-accent-foreground [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        value={value || calculatedValue}
        onChange={(e) => {
          e.preventDefault();
          onChange?.(e);
        }}
        type={type}
        inputMode="decimal"
        onKeyDown={(e) => {
          onKeyDown?.(e);
          handleKeyDown(e);
        }}
        {...props}
      />
    );
  }
);

TimePickerInput.displayName = "TimePickerInput";

// TimePicker Component
interface TimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Horas
        </Label>
        <TimePickerInput
          picker="hours"
          date={date}
          setDate={setDate}
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutos
        </Label>
        <TimePickerInput
          picker="minutes"
          id="minutes24"
          date={date}
          setDate={setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => secondRef.current?.focus()}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="seconds" className="text-xs">
          Segundos
        </Label>
        <TimePickerInput
          picker="seconds"
          id="seconds24"
          date={date}
          setDate={setDate}
          ref={secondRef}
          onLeftFocus={() => minuteRef.current?.focus()}
        />
      </div>
    </div>
  );
}


interface CalendarDateRangePickerProps {
  className?: string;
  start?: Date;
  end?: Date;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

export function CalendarDateRangePicker({
  className,
  start = (() => {
    const date = subDays(new Date(), 1);
    date.setHours(0, 0, 0, 0);
    return date;
  })(),
  end = (() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  })(),
  onDateRangeChange,
}: CalendarDateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({ from: start, to: end });
  const [fromInput, setFromInput] = React.useState<string>(format(start, 'dd/MM/yyyy'));
  const [toInput, setToInput] = React.useState<string>(format(end, 'dd/MM/yyyy'));
  const [fromTime, setFromTime] = React.useState<string>('00:00:00');
  const [toTime, setToTime] = React.useState<string>('23:59:59');
  const [isEditing, setIsEditing] = React.useState<boolean>(false);

  const handleFromInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    const newFromDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
    if (!isNaN(newFromDate.getTime()) && newFromDate <= new Date()) {
      setDate((prev) => ({ ...prev, from: newFromDate } as DateRange));
    }
    setFromInput(e.target.value);
  };

  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsEditing(true);
    const newToDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
    if (!isNaN(newToDate.getTime()) && newToDate <= new Date()) {
      setDate((prev) => ({ ...prev, from: prev?.from ?? new Date(), to: newToDate } as DateRange));
    }
    setToInput(e.target.value);
  };

  const handleFromTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromTime(e.target.value);
    if (date?.from) {
      const newFromDate = new Date(date.from);
      const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
      newFromDate.setHours(hours, minutes, seconds);
      setDate((prev) => ({ ...prev, from: newFromDate } as DateRange));
    }
  };

  const handleToTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToTime(e.target.value);
    if (date?.to) {
      const newToDate = new Date(date.to);
      const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
      newToDate.setHours(hours, minutes, seconds);
      setDate((prev) => ({ ...prev, to: newToDate } as DateRange));
    }
  };

  React.useEffect(() => {
    if (!isEditing) {
      if (date?.from) {
        setFromInput(format(date.from, 'dd/MM/yyyy'));
        setFromTime(format(date.from, 'HH:mm:ss'));
      }
      if (date?.to) {
        setToInput(format(date.to, 'dd/MM/yyyy'));
        setToTime(format(date.to, 'HH:mm:ss'));
      }
    }
  }, [date, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    if (!selectedDate && date?.from) {
      const clickedDate = new Date(date.from);
      const endDate = new Date(clickedDate);
      clickedDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const newRange = { from: clickedDate, to: endDate };
      setDate(newRange);
      if (onDateRangeChange) {
        onDateRangeChange(newRange);
      }
      return;
    }

    if (selectedDate?.from) {
      const from = new Date(selectedDate.from);
      from.setHours(0, 0, 0, 0);
      
      const to = selectedDate.to ? new Date(selectedDate.to) : new Date(from);
      to.setHours(23, 59, 59, 999);

      const newRange = { from, to };
      setDate(newRange);
      if (onDateRangeChange) {
        onDateRangeChange(newRange);
      }
      return;
    }

    setDate(selectedDate);
    if (onDateRangeChange) {
      onDateRangeChange(selectedDate);
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full min-h-[4rem] sm:min-h-[3rem] lg:min-h-0 p-3 justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <div className="flex-1 flex flex-wrap items-center justify-center gap-1 sm:gap-x-2 sm:gap-y-0 px-2">
              <div className="flex flex-wrap items-center gap-0">
                <input
                  type="text"
                  value={fromInput}
                  onChange={handleFromInputChange}
                  onBlur={handleBlur}
                  placeholder="dd/MM/yyyy"
                  className="w-20 min-w-[5.5rem] border-none bg-transparent focus:outline-none text-right truncate"
                />
                <span className="text-muted-foreground ml-1">(</span>
                <input
                  type="text"
                  value={fromTime}
                  onChange={handleFromTimeChange}
                  className="w-[4rem] border-none bg-transparent focus:outline-none text-center truncate px-0"
                />
                <span className="text-muted-foreground">)</span>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground select-none">—</span>
              </div>
              <div className="flex flex-wrap items-center gap-0">
                <input
                  type="text"
                  value={toInput}
                  onChange={handleToInputChange}
                  onBlur={handleBlur}
                  placeholder="dd/MM/yyyy"
                  className="w-20 border-none bg-transparent focus:outline-none text-left truncate"
                />
                <span className="text-muted-foreground">(</span>
                <input
                  type="text"
                  value={toTime}
                  onChange={handleToTimeChange}
                  className="w-[4rem] border-none bg-transparent focus:outline-none text-center truncate px-0"
                />
                <span className="text-muted-foreground">)</span>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full sm:w-full p-0" // Cambiado a w-full para coincidir con el input principal
          align="start"
          sideOffset={4}
        >
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Seleccione el rango de fechas</Label>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={new Date()} // Mostrar el mes actual
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={1} // Cambiado a 1 para mostrar solo un calendario
            toMonth={new Date()} // Restringir navegación hacia el futuro
            locale={es}
            disabled={(date) => date > new Date()}
            classNames={{
              months: "flex justify-center space-y-4", // Ajustado para centrar el calendario
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
              day_today: "bg-accent text-accent-foreground rounded-md",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-md",
              day_hidden: "invisible",
            }}
          />
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-4 flex-1">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Escriba hora inicial</Label>
                <TimePicker 
                  date={date?.from} 
                  setDate={(newDate) => setDate((prev) => ({ ...prev, from: newDate } as DateRange))} 
                />
              </div>
            </div>
            <div className="p-4 flex-1">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Escriba hora final</Label>
                <TimePicker 
                  date={date?.to} 
                  setDate={(newDate) => setDate((prev) => ({ ...prev, to: newDate } as DateRange))} 
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}