"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RotateCw, AlertTriangle, Thermometer, Droplets, Gauge, Activity, BarChart3, Zap } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useSession } from 'next-auth/react'


interface AirQualityData {
  time: string
  iaq: number
  temperature: number
  humidity: number
  co2_equivalent: number
  breath_voc_equivalent: number
  gas_percentage: number
  raw_pressure: number
  raw_gas: number
}

const getIAQStatus = (iaq: number): { text: string; color: string; bgColor: string } => {
  if (iaq <= 50) return { 
    text: 'Excelente',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
  }
  if (iaq <= 100) return { 
    text: 'Buena',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
  }
  if (iaq <= 150) return { 
    text: 'Regular',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
  }
  if (iaq <= 200) return { 
    text: 'Baja',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
  }
  if (iaq <= 300) return { 
    text: 'Mala',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
  }
  return { 
    text: 'Peligrosa',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
  }
}


const MetricCard = ({ icon: Icon, title, value, unit, status, colorClass }: {
  icon: any
  title: string
  value: string | number
  unit: string
  status?: string
  colorClass?: string
}) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
    <div className="flex items-center space-x-2">
      <Icon className={`h-4 w-4 md:h-5 md:w-5 ${colorClass || 'text-muted-foreground'}`} />
      <span className="text-sm md:text-base text-muted-foreground">{title}</span>
    </div>
    <div className="text-right">
      <span className="text-lg md:text-xl font-semibold">
        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
      </span>
      {status && (
        <p className={`text-xs md:text-sm font-medium ${colorClass || 'text-muted-foreground'}`}>
          {status}
        </p>
      )}
    </div>
  </div>
)

export default function AirQualityChart({ bucket }: { bucket: string }){
  const [airData, setAirData] = useState<AirQualityData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session, status } = useSession()

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    // Verificar si existe una sesión activa con accessToken
    if (!session?.accessToken) {
      console.error('No hay sesión iniciada');
      setIsLoading(false)
      return;
    }

    try {
      const start = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history/data?bucket=${bucket}&start=${start}&_measurement=air_quality&fields=fields_iaq,fields_heat_compensated_temperature,fields_heat_compensated_humidity,fields_co2_equivalent,fields_breath_voc_equivalent,fields_gas_percentage,fields_raw_pressure,fields_raw_gas&tags_board_id=01&every=1m0s&fn=%20last&createEmpty=false&yieldName=last`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${session.accessToken}`,
        },
      })
      const data = await response.json()

      // Crear un objeto para almacenar los valores
      const readings = {
        time: '',
        iaq: 0,
        temperature: 0,
        humidity: 0,
        co2_equivalent: 0,
        breath_voc_equivalent: 0,
        gas_percentage: 0,
        raw_pressure: 0,
        raw_gas: 0
      }

      // Procesar cada registro
      data.forEach((record: any) => {
        const field = record._field
        const value = parseFloat(record._value)
        
        // Guardar el tiempo del registro más reciente
        if (!readings.time || new Date(record._time) > new Date(readings.time)) {
          readings.time = record._time
        }

        // Mapear los campos según el tipo de medida
        switch (field) {
          case 'fields_iaq':
            readings.iaq = value
            break
          case 'fields_heat_compensated_temperature':
            readings.temperature = value
            break
          case 'fields_heat_compensated_humidity':
            readings.humidity = value
            break
          case 'fields_co2_equivalent':
            readings.co2_equivalent = value
            break
          case 'fields_breath_voc_equivalent':
            readings.breath_voc_equivalent = value
            break
          case 'fields_gas_percentage':
            readings.gas_percentage = value
            break
          case 'fields_raw_pressure':
            readings.raw_pressure = value
            break
          case 'fields_raw_gas':
            readings.raw_gas = value
            break
        }
      })

      // Verificar que tenemos todos los datos necesarios
      if (readings.time) {
        setAirData({
          time: new Date(readings.time).toLocaleString(),
          iaq: readings.iaq,
          temperature: readings.temperature,
          humidity: readings.humidity,
          co2_equivalent: readings.co2_equivalent,
          breath_voc_equivalent: readings.breath_voc_equivalent,
          gas_percentage: readings.gas_percentage,
          raw_pressure: readings.raw_pressure,
          raw_gas: readings.raw_gas
        })
      } else {
        setAirData(null)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setAirData(null)
    } finally {
      setIsLoading(false)
    }
  }, [bucket, session])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const iaqStatus = airData ? getIAQStatus(airData.iaq) : null

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-4">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-2xl font-bold">Calidad del aire</CardTitle>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchData}
          disabled={isLoading}
          className="h-8 w-8 md:h-10 md:w-10"
        >
          <RotateCw className={`h-4 w-4  ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Recargar datos</span>
        </Button>
      </CardHeader>
      <CardContent className="px-6 space-y-3 md:space-y-4">
        {airData ? (
          <>
            {/* Layout responsivo mejorado para tablets */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
              {/* IAQ Principal */}
              <div className="md:col-span-4 xl:col-span-3 text-center space-y-2 md:space-y-3">
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-foreground">
                    {airData.iaq.toFixed(0)}
                  </p>
                  <p className="text-sm md:text-base text-muted-foreground">Índice IAQ</p>
                </div>
                
                {iaqStatus && (
                  <div className={`inline-flex items-center justify-center w-full px-3 py-2 rounded-lg border ${iaqStatus.bgColor}`}>
                    <p className={`text-sm md:text-base font-medium ${iaqStatus.color}`}>
                      {iaqStatus.text}
                    </p>
                  </div>
                )}
              </div>

              {/* Grid de métricas - Sin huecos */}
              <div className="md:col-span-8 xl:col-span-9">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
                  <MetricCard
                    icon={Thermometer}
                    title="Temperatura"
                    value={airData.temperature}
                    unit="°C"
                    colorClass="text-red-500"
                  />
                  <MetricCard
                    icon={Droplets}
                    title="Humedad"
                    value={airData.humidity}
                    unit="%"
                    colorClass="text-blue-500"
                  />
                  <MetricCard
                    icon={Activity}
                    title="CO₂"
                    value={airData.co2_equivalent}
                    unit=" ppm"

                  />
                  <MetricCard
                    icon={Zap}
                    title="COV"
                    value={airData.breath_voc_equivalent}
                    unit=" ppm"
                    colorClass="text-amber-500"
                  />
                  <MetricCard
                    icon={Gauge}
                    title="Presión"
                    value={(airData.raw_pressure / 100).toFixed(1)}
                    unit=" hPa"
                    colorClass="text-indigo-500"
                  />
                  <MetricCard
                    icon={BarChart3}
                    title="Gas"
                    value={airData.gas_percentage}
                    unit="%"
                    colorClass="text-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Última actualización */}
            <div className="text-center pt-2 border-t">
              <p className="text-xs md:text-sm text-muted-foreground">
                Última actualización: {airData.time}
              </p>
            </div>
          </>        ) : (
          <div className="px-4 py-3 rounded-md bg-destructive dark:bg-red-900 border border-destructive dark:border-red-800 text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 inline-block flex-shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">No se pudieron obtener los datos del sensor en este momento. Por favor, vuelva a intentarlo más tarde.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

