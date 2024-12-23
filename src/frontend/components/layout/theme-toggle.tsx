'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Laptop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState('system')

  useEffect(() => {
    setMounted(true)
    setSelectedTheme(theme || 'system')
  }, [theme])

  if (!mounted) {
    return null
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setSelectedTheme(newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleThemeChange('light')}
          className={selectedTheme === 'light' ? 'bg-gray-200 dark:bg-gray-700' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('dark')}
          className={selectedTheme === 'dark' ? 'bg-gray-200 dark:bg-gray-700' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Oscuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('system')}
          className={selectedTheme === 'system' ? 'bg-gray-200 dark:bg-gray-700' : ''}
        >
          <Laptop className="mr-2 h-4 w-4" />
          <span>Automático</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}