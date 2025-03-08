"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "@radix-ui/react-icons"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/date-range-picker" // Reusa TimePicker
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Trash, Plus } from "lucide-react"

const TicketAddModal: React.FC<{ isOpen: boolean; onClose: () => void; onRefresh: () => void }> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { data: session } = useSession()
  const [ticketInfo, setTicketInfo] = useState({
    collectionDate: "",
    cisternLicensePlate: "",
    collectionCompany: "",
    driver: "",
    tankId: "",
    sampleLabel: "", // * obligatorio
    milkTemperature: "",
    inhibitorSampleTaken: false,
    litersPerTank: [
      {
        tankId: "",
        liters: "",
        compartment: "",
      },
    ],
  })

  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTicketInfo({ ...ticketInfo, [e.target.id]: e.target.value })
  }

  const handleAddTank = () => {
    setTicketInfo({
      ...ticketInfo,
      litersPerTank: [...ticketInfo.litersPerTank, { tankId: "", liters: "", compartment: "" }],
    })
  }

  const handleRemoveTank = (index: number) => {
    const updated = ticketInfo.litersPerTank.filter((_, i) => i !== index)
    setTicketInfo({ ...ticketInfo, litersPerTank: updated })
  }

  const handleTankChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const newTanks = [...ticketInfo.litersPerTank]
    newTanks[index] = { ...newTanks[index], [id]: value }
    setTicketInfo({ ...ticketInfo, litersPerTank: newTanks })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const createTicket = async () => {
      if (!session?.accessToken) {
        console.error("No hay sesión iniciada")
        toast({
          title: "Error",
          description: "No hay sesión iniciada",
          variant: "destructive",
        })
        return
      }

      try {
        const response = await fetch("http://localhost:5001/ticket", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${session.accessToken}`,
          },
          body: JSON.stringify(ticketInfo),
        })
        if (!response.ok) throw new Error("Error al crear el ticket")
        toast({
          description: "Ticket creado con éxito",
          variant: "success",
        })
        onClose()
        onRefresh()
      } catch (error) {
        console.error("Error al crear el ticket:", error)
        toast({
          title: "Error al crear el ticket",
          variant: "destructive",
        })
      }
    }
    createTicket()
  }

  const isFormValid =
    ticketInfo.collectionDate.trim() !== "" &&
    ticketInfo.cisternLicensePlate.trim() !== "" &&
    ticketInfo.collectionCompany.trim() !== "" &&
    ticketInfo.driver.trim() !== "" &&
    ticketInfo.sampleLabel.trim() !== "" &&
    ticketInfo.milkTemperature.trim() !== "" &&
    ticketInfo.litersPerTank.every(
      (tank) => tank.tankId.trim() !== "" && tank.liters.trim() !== "" && tank.compartment.trim() !== "",
    )

  function SingleDateTimePicker({
    value,
    onChange,
  }: {
    value: string
    onChange: (newValue: string) => void
  }) {
    const [showPicker, setShowPicker] = useState(false)
    const [internalDate, setInternalDate] = useState<Date>(() => {
      const parsed = new Date(value)
      return isNaN(parsed.getTime()) ? new Date() : parsed
    })

    const handleDateSelect = (selectedDate?: Date) => {
      if (!selectedDate) return
      const newDate = new Date(internalDate)
      newDate.setFullYear(selectedDate.getFullYear())
      newDate.setMonth(selectedDate.getMonth())
      newDate.setDate(selectedDate.getDate())
      setInternalDate(newDate)
      onChange(newDate.toISOString())
    }

    const handleTimeChange = (newDate?: Date) => {
      if (!newDate) return
      setInternalDate(newDate)
      onChange(newDate.toISOString())
    }

    return (
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: es }) : "Seleccione fecha y hora"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-4 w-auto sm:w-auto">
          <Calendar mode="single" selected={internalDate} onSelect={handleDateSelect} locale={es} className="mb-4" />
          <TimePicker date={internalDate} setDate={handleTimeChange} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[80vh] p-0 gap-0 bg-background mx-auto my-auto rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background rounded-lg h-16">
          <DialogTitle className="text-lg font-bold">Crear nuevo ticket</DialogTitle>
        </div>
        <ScrollArea className="flex-grow">
          <div className="p-4 md:p-6 space-y-6">
            <Card>
              <div className="px-4 md:px-6 mt-6">
                <CardTitle className="mb-4">Datos del ticket</CardTitle>
              </div>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Sección de Transporte */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Información de transporte</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="collectionDate">
                            Fecha y hora de recogida <span className="text-red-500">*</span>
                          </Label>
                          <SingleDateTimePicker
                            value={ticketInfo.collectionDate}
                            onChange={(newVal) => setTicketInfo({ ...ticketInfo, collectionDate: newVal })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cisternLicensePlate">
                            Matrícula cisterna <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="cisternLicensePlate"
                            value={ticketInfo.cisternLicensePlate}
                            onChange={handleInputChange}
                            className="bg-white dark:bg-gray-800 text-black dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="collectionCompany">
                            Empresa de recogida <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="collectionCompany"
                            value={ticketInfo.collectionCompany}
                            onChange={handleInputChange}
                            className="bg-white dark:bg-gray-800 text-black dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="driver">
                            Nombre del camionero <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="driver"
                            value={ticketInfo.driver}
                            onChange={handleInputChange}
                            className="bg-white dark:bg-gray-800 text-black dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Sección de Muestras */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Información de muestras</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sampleLabel">
                          Nº etiqueta interprofesional <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="sampleLabel"
                          value={ticketInfo.sampleLabel}
                          onChange={handleInputChange}
                          className="bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="milkTemperature">
                          Temperatura de la leche <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="milkTemperature"
                          value={ticketInfo.milkTemperature}
                          onChange={handleInputChange}
                          className="bg-white dark:bg-gray-800 text-black dark:text-white"
                        />
                      </div>
                      <div className="space-y-2 flex items-center gap-2">
                        <Label htmlFor="inhibitorSampleTaken" className="flex items-center h-full">
                          Muestra inhibidores
                        </Label>
                        <Checkbox
                          id="inhibitorSampleTaken"
                          checked={ticketInfo.inhibitorSampleTaken}
                          onCheckedChange={(checked) =>
                            setTicketInfo({ ...ticketInfo, inhibitorSampleTaken: !!checked })
                          }
                          className="bg-white dark:bg-gray-800 h-5 w-5"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Sección de Tanques */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Información de tanques</h3>
                      <Button
                        type="button"
                        onClick={handleAddTank}
                        className="h-9 w-9 px-2.5 text-sm flex items-center justify-center"
                      >
                        <Plus className="h-3.5 w-3.5 mr-0.5 ml-0.5" />
                      </Button>
                    </div>
                    {ticketInfo.litersPerTank.map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex-grow border p-4 rounded-md bg-gray-50 dark:bg-gray-900">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tankId">
                                ID del tanque <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="tankId"
                                value={item.tankId}
                                onChange={(e) => handleTankChange(index, e)}
                                className="bg-white dark:bg-gray-800 text-black dark:text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="liters">
                                Litros recogidos <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="liters"
                                value={item.liters}
                                onChange={(e) => handleTankChange(index, e)}
                                className="bg-white dark:bg-gray-800 text-black dark:text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="compartment">
                                Compartimento <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="compartment"
                                value={item.compartment}
                                onChange={(e) => handleTankChange(index, e)}
                                className="bg-white dark:bg-gray-800 text-black dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleRemoveTank(index)}
                          className="h-9 w-10 p-0 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={!isFormValid}>
                      Crear ticket
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default TicketAddModal

