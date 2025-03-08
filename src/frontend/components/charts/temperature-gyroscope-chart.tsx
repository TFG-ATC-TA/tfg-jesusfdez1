"use client"

import { useEffect, useRef, useState } from "react"
import { createChart, ColorType, Time, LineData } from "lightweight-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { useTheme } from 'next-themes'
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, ChevronDown, AlertTriangle, ThermometerSun, ThermometerSnowflake } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import React from 'react';
import { useSession } from 'next-auth/react'

type DataPoint = {
  timestamp: number
  surfaceTemperature: number | null
  overSurfaceTemperature: number | null
  gyroX: number | null
}

interface TemperatureProbeChartProps {
  bucket: string;
  startDate?: Date;
  endDate?: Date;
}

const TemperatureProbeChart: React.FC<TemperatureProbeChartProps> = ({ bucket, startDate, endDate }) => {
  const [data, setData] = useState<DataPoint[]>([])
  const [showSurfaceTemp, setShowSurfaceTemp] = useState(true)
  const [showOverSurfaceTemp, setShowOverSurfaceTemp] = useState(true)
  const [showGyroX, setShowGyroX] = useState(true)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [surfaceStats, setSurfaceStats] = useState<{ min: number | null, max: number | null }>({ min: null, max: null })
  const [overSurfaceStats, setOverSurfaceStats] = useState<{ min: number | null, max: number | null }>({ min: null, max: null })
  const { theme, systemTheme } = useTheme()
  const [fetchError, setFetchError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()


  useEffect(() => {
    const fetchData = async () => {
      // Verificar si hay un token de acceso
      if (!session?.accessToken) {
        console.error('No hay sesión iniciada');
        return;
      }

      try {
        const start = startDate?.toISOString() 
        const stop = endDate?.toISOString() 

        const [probeResponse, gyroResponse] = await Promise.all([
          fetch(`http://localhost:5001/history/data?bucket=${bucket}&start=${start}&stop=${stop}&_measurement=temperature_probe&fields=fields_surface_temperature,fields_over_surface_temperature&every=1m0s&fn=last&createEmpty=false&yieldName=last`, {
            headers: {
              'Authorization': `${session.accessToken}`,
            },
          }),
          fetch(`http://localhost:5001/history/data?bucket=${bucket}&start=${start}&stop=${stop}&_measurement=6_dof_imu&fields=fields_gyro_x&every=15s&fn=last&createEmpty=false&yieldName=last`, {
            headers: {
              'Authorization': `${session.accessToken}`,
            },
          })
        ])
        const probeData = await probeResponse.json()
        const gyroData = await gyroResponse.json()

        // Process and combine the data
        const combinedData: { [key: string]: DataPoint } = {}

        probeData?.forEach((item: any) => {
          const timestamp = new Date(item._time).getTime()
          if (!combinedData[timestamp]) {
            combinedData[timestamp] = {
              timestamp,
              surfaceTemperature: null,
              overSurfaceTemperature: null,
              gyroX: null
            }
          }
          if (item._field === 'fields_surface_temperature') {
            combinedData[timestamp].surfaceTemperature = item._value
          } else if (item._field === 'fields_over_surface_temperature') {
            combinedData[timestamp].overSurfaceTemperature = item._value
          }
        })

        gyroData?.forEach((item: any) => {
          const timestamp = new Date(item._time).getTime()
          if (!combinedData[timestamp]) {
            combinedData[timestamp] = {
              timestamp,
              surfaceTemperature: null,
              overSurfaceTemperature: null,
              gyroX: null
            }
          }
          combinedData[timestamp].gyroX = item._value
        })

        setData(Object.values(combinedData).sort((a, b) => a.timestamp - b.timestamp))
        setFetchError(Object.values(combinedData).length === 0)
      } catch (error) {
        setFetchError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [bucket, startDate, endDate, session])

  useEffect(() => {
    if (data.length) {
      const surfaceValues = data.map(d => d.surfaceTemperature).filter(v => v != null)
      const overValues = data.map(d => d.overSurfaceTemperature).filter(v => v != null)
      setSurfaceStats({
        min: surfaceValues.length ? Math.min(...surfaceValues) : null,
        max: surfaceValues.length ? Math.max(...surfaceValues) : null,
      })
      setOverSurfaceStats({
        min: overValues.length ? Math.min(...overValues) : null,
        max: overValues.length ? Math.max(...overValues) : null,
      })
    }
  }, [data])

  useEffect(() => {
    if (chartContainerRef.current) {
      const currentTheme = theme === 'system' ? systemTheme : theme;
      const isDarkMode = currentTheme === 'dark';

      const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(60, 64, 67, 0.8)';
      const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(60, 64, 67, 0.1)';

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: textColor,
        },
        grid: {
          horzLines: {
            color: gridColor,
          },
          vertLines: {
            color: gridColor,
          },
        },
        rightPriceScale: {
          visible: true,
          borderColor: gridColor,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        leftPriceScale: {
          visible: true,
          borderColor: gridColor,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        timeScale: {
          borderColor: gridColor,
          timeVisible: true,
          secondsVisible: true,
          tickMarkFormatter: (time: Time) => {
            const date = new Date((time as number) * 1000)
            const hours = date.toLocaleTimeString()
            const day = date.toLocaleDateString()
            return date.getHours() === 0 && date.getMinutes() === 0 ? `${day}` : hours
          },
        },
      })

      const surfaceTemperatureSeries = chart.addLineSeries({ 
        color: isDarkMode ? 'rgba(239, 68, 68, 0.8)' : 'rgba(185, 28, 28, 0.8)', 
        lineWidth: 1,
        priceScaleId: 'left',
        title: 'Temperatura superficie',
      })
      const overSurfaceTemperatureSeries = chart.addLineSeries({ 
        color: isDarkMode ? 'rgba(34, 197, 94, 0.8)' : 'rgba(21, 128, 61, 0.8)', 
        lineWidth: 1,
        priceScaleId: 'left',
        title: 'Temperatura sobre superficie',
      })
      const gyroXSeries = chart.addLineSeries({ 
        color: isDarkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(30, 64, 175, 0.8)', 
        lineWidth: 1,
        priceScaleId: 'right',
        title: 'Giroscopio X',
      })

      // Configurar los ejes
      chart.priceScale('left').applyOptions({
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      })

      chart.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      })

      const formatData = (data: DataPoint[], key: keyof DataPoint): LineData[] => {
        return data.map(point => ({
          time: (point.timestamp / 1000) as Time,
          value: point[key] ?? 0,
        }))
      }

      if (showSurfaceTemp) {
        surfaceTemperatureSeries.setData(formatData(data, 'surfaceTemperature'))
      } else {
        surfaceTemperatureSeries.setData([])
      }

      if (showOverSurfaceTemp) {
        overSurfaceTemperatureSeries.setData(formatData(data, 'overSurfaceTemperature'))
      } else {
        overSurfaceTemperatureSeries.setData([])
      }

      if (showGyroX) {
        gyroXSeries.setData(formatData(data, 'gyroX'))
      } else {
        gyroXSeries.setData([])
      }

    
      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current!.clientWidth, height: chartContainerRef.current!.clientHeight })
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        chart.remove()
      }
    }
  }, [data, theme, systemTheme, showSurfaceTemp, showOverSurfaceTemp, showGyroX])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row justify-between">
        <div>
          <CardTitle className="text-2xl font-bold">Temperaturas de la sonda</CardTitle>
          <CardDescription>Temperaturas de la superficie, sobre la superficie y eje X del giroscopio (°C)</CardDescription>
        </div>
        {!fetchError && (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full md:w-[200px] h-10 bg-white text-black dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 flex items-center justify-between space-x-2 cursor-pointer rounded-md p-2 text-sm md:mt-2">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filtro de datos</span>
              </div>
              <div className="ml-auto">
                <ChevronDown className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full md:w-[200px] rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <DropdownMenuItem className="flex items-center space-x-2 cursor-default" onSelect={(e) => e.preventDefault()}>
                <Checkbox checked={showSurfaceTemp} onCheckedChange={() => setShowSurfaceTemp(!showSurfaceTemp)} />
                <span className="pointer-events-none">Superficie</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-default" onSelect={(e) => e.preventDefault()}>
                <Checkbox checked={showOverSurfaceTemp} onCheckedChange={() => setShowOverSurfaceTemp(!showOverSurfaceTemp)} />
                <span className="pointer-events-none">Sobre la superficie</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-2 cursor-default" onSelect={(e) => e.preventDefault()}>
                <Checkbox checked={showGyroX} onCheckedChange={() => setShowGyroX(!showGyroX)} />
                <span className="pointer-events-none">Eje X del giroscopio</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      {fetchError && (
        <Alert variant="destructive" className="mb-4 mx-4 max-w-[calc(100%-2rem)] flex items-start space-x-3">
          <AlertTriangle className="mr-2  h-6 w-6" />
          <div>
          <AlertTitle className="font-semibold mt-1">Datos no disponibles</AlertTitle>
          <AlertDescription>
            No hay datos disponibles en este momento. Por favor, vuelva a intentarlo más tarde.
          </AlertDescription>
          </div>
        </Alert>
      )}
      {isLoading ? (
        <CardContent className="flex flex-col items-center justify-center h-[375px]">
          <Skeleton className="h-[375px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full">
            <Card className="bg-white bg-opacity-50 text-black dark:bg-gray-800 dark:bg-opacity-50 dark:text-white border border-gray-300 dark:border-gray-700 my-3 md:my-3 md:mx-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-6" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white bg-opacity-50 text-black dark:bg-gray-800 dark:bg-opacity-50 dark:text-white border border-gray-300 dark:border-gray-700 my-3 md:my-3 md:mx-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-6" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      ) : (
        !fetchError && (
          <>
            <CardContent className="flex flex-col">
              <ChartContainer className="h-[355px] w-full" config={{ /* your config here */ }}>
                <div ref={chartContainerRef} className="h-[355px] w-full" />
              </ChartContainer>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card className="bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow md:my-2 md:mx-2 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
                    <CardTitle className="text-base font-bold">
                      Temperatura de superficie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSnowflake className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-300" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-300">Mínima</span>
                        </div>
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{surfaceStats.min?.toFixed(2)}°C</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSun className="h-4 w-4 mr-1 text-red-600 dark:text-red-300" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-300">Máxima</span>
                        </div>
                        <span className="text-xl font-bold text-red-600 dark:text-red-300">{surfaceStats.max?.toFixed(2)}°C</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow md:my-2 md:mx-2 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
                    <CardTitle className="text-base font-bold">
                      Temperatura sobre superficie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSnowflake className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-300" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-300">Mínima</span>
                        </div>
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{overSurfaceStats.min?.toFixed(2)}°C</span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSun className="h-4 w-4 mr-1 text-red-600 dark:text-red-300" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-300">Máxima</span>
                        </div>
                        <span className="text-xl font-bold text-red-600 dark:text-red-300">{overSurfaceStats.max?.toFixed(2)}°C</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </>
        )
      )}
    </Card>
  )
}

export default TemperatureProbeChart;