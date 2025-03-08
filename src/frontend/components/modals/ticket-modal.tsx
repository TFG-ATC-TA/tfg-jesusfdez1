'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
  } from "@/components/ui/table"
  import { ScrollArea } from "@/components/ui/scroll-area"

export function TicketModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useTheme()

const ticketColor = theme === 'dark' ? '#374151' : '#ffffff'
  const textColor = theme === 'dark' ? '#ffffff' : '#000000'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <style jsx global>{`
        .dialog-overlay {
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
        .sawtooth {
          height: 8px;
          background-image: 
            linear-gradient(45deg, transparent 33.333%, ${ticketColor} 33.333%, ${ticketColor} 66.667%, transparent 66.667%),
            linear-gradient(-45deg, transparent 33.333%, ${ticketColor} 33.333%, ${ticketColor} 66.667%, transparent 66.667%);
          background-size: 16px 16px;
          background-position: 0 0, 8px 0;
        }
      `}</style>
      <DialogTrigger asChild>
        <Button variant="outline">Ver ticket de recogida</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:bg-white dark:[&>button]:bg-gray-800 [&>button]:rounded-lg [&>button]:shadow">
        <div className="bg-transparent max-w-md mx-auto relative overflow-hidden">
          <div className="sawtooth"></div>
          <div className={`bg-white dark:bg-gray-800 px-1 py-3`}>
            <ScrollArea className="h-[calc(70vh-48px)] px-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">+ Ticket de recogida de leche</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">#{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</p>
              </div>
              
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Fecha recogida</TableCell>
                    <TableCell className="py-1">{new Date().toLocaleDateString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Hora recogida</TableCell>
                    <TableCell className="py-1">{new Date().toLocaleTimeString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Matrícula cisterna</TableCell>
                    <TableCell className="py-1">1234 ABC</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Empresa de recogida</TableCell>
                    <TableCell className="py-1">Lácteos S.A.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Nombre del camionero</TableCell>
                    <TableCell className="py-1">Juan Pérez</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">ID del tanque</TableCell>
                    <TableCell className="py-1">LETRAQ23</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Nº etiqueta muestra</TableCell>
                    <TableCell className="py-1">M-12345</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Tª de la leche</TableCell>
                    <TableCell className="py-1">4°C</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-1 font-semibold">Muestra para inhibidores</TableCell>
                    <TableCell className="py-1">Sí</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <div className="mt-4">
                <h3 className="font-bold mb-1 text-sm">Detalles de recogida:</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-1">Tanque</TableHead>
                      <TableHead className="py-1">Litros</TableHead>
                      <TableHead className="py-1">Compartimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="py-1">LETRAQ23</TableCell>
                      <TableCell className="py-1">1000</TableCell>
                      <TableCell className="py-1">1</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-1">LETRAQ24</TableCell>
                      <TableCell className="py-1">1500</TableCell>
                      <TableCell className="py-1">2</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-center text-xs text-gray-500">
                <p>Firma del camionero: _________________</p>
                <p>Firma del responsable: _________________</p>
              </div>
            </ScrollArea>
          </div>
          <div className="sawtooth rotate-180"></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

