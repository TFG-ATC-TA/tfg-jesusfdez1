/**
 * Gráfico de temperatura y giroscopio
 * Visualiza datos de sensores de temperatura y giroscopio con filtros interactivos
 * Permite analizar patrones de temperatura y movimiento en tiempo real
 * Integra múltiples fuentes de datos y proporciona estadísticas en tiempo real
 */

"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { createChart, ColorType, type Time, type IChartApi, type ISeriesApi } from "lightweight-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { useTheme } from "next-themes"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, ChevronDown, AlertTriangle, ThermometerSun, ThermometerSnowflake } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import type React from "react"
import { useSession } from "next-auth/react"

/**
 * Tipo para puntos de datos del sensor
 * Combina lecturas de temperatura y giroscopio con timestamps
 * Permite el manejo de valores nulos para datos faltantes
 */
type DataPoint = {
  timestamp: number
  surfaceTemperature: number | null
  overSurfaceTemperature: number | null
  gyroX: number | null
}

/**
 * Props del componente de renderizado del gráfico
 * Define la estructura de datos y configuración para el renderizado
 */
interface ChartRendererProps {
  data: {
    surface: Array<{ time: Time; value: number }>
    overSurface: Array<{ time: Time; value: number }>
    gyro: Array<{ time: Time; value: number }>
  }
  showSurfaceTemp: boolean
  showOverSurfaceTemp: boolean
  showGyroX: boolean
  theme: string
  systemTheme: string
}

/**
 * Componente interno que renderiza el gráfico de temperatura y giroscopio
 * Maneja la creación y actualización del gráfico con lightweight-charts
 * Gestiona la configuración de tema, series y eventos de redimensionamiento
 */
const ChartRenderer: React.FC<ChartRendererProps> = ({
  data,
  showSurfaceTemp,
  showOverSurfaceTemp,
  showGyroX,
  theme,
  systemTheme,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<Record<string, ISeriesApi<'Line'>>>({})
  const isInitializedRef = useRef(false)

  /**
   * Inicializa el gráfico con configuración de tema y series
   * Configura colores, escalas y formato de tiempo según el tema activo
   * Crea las series de datos para temperatura y giroscopio
   */
  useEffect(() => {
    if (!chartContainerRef.current || isInitializedRef.current) return

    const currentTheme = theme === "system" ? systemTheme : theme
    const isDarkMode = currentTheme === "dark"

    const textColor = isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(60, 64, 67, 0.8)"
    const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(60, 64, 67, 0.1)"

    // Create chart immediately
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: textColor,
      },
      grid: {
        horzLines: { color: gridColor },
        vertLines: { color: gridColor },
      },
      rightPriceScale: {
        visible: true,
        borderColor: gridColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      leftPriceScale: {
        visible: true,
        borderColor: gridColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
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

    chartRef.current = chart

    // Create series with appropriate colors and configuration
    seriesRef.current.surface = chart.addLineSeries({
      color: isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(185, 28, 28, 0.8)",
      lineWidth: 1,
      priceScaleId: "left",
      title: "Temperatura superficie",
    })

    seriesRef.current.overSurface = chart.addLineSeries({
      color: isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(21, 128, 61, 0.8)",
      lineWidth: 1,
      priceScaleId: "left",
      title: "Temperatura sobre superficie",
    })

    seriesRef.current.gyro = chart.addLineSeries({
      color: isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(30, 64, 175, 0.8)",
      lineWidth: 1,
      priceScaleId: "right",
      title: "Giroscopio X",
    })

    // Configure price scales for better visualization
    chart.priceScale("left").applyOptions({
      scaleMargins: { top: 0.2, bottom: 0.2 },
    })

    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.2, bottom: 0.2 },
    })

    isInitializedRef.current = true

    /**
     * Manejador de redimensionamiento para mantener el gráfico responsive
     * Ajusta el tamaño del gráfico cuando cambia el tamaño de la ventana
     */
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
      isInitializedRef.current = false
    }
  }, []) // Solo se ejecuta una vez al montar el componente

  /**
   * Actualiza el tema del gráfico sin recrear el gráfico completo
   * Mantiene los datos existentes y solo actualiza colores y configuración visual
   */
  useEffect(() => {
    if (!chartRef.current || !isInitializedRef.current) return

    const currentTheme = theme === "system" ? systemTheme : theme
    const isDarkMode = currentTheme === "dark"

    const textColor = isDarkMode ? "rgba(255, 255, 255, 0.8)" : "rgba(60, 64, 67, 0.8)"
    const gridColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(60, 64, 67, 0.1)"

    // Actualizar configuración del gráfico
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: textColor,
      },
      grid: {
        horzLines: { color: gridColor },
        vertLines: { color: gridColor },
      },
      rightPriceScale: {
        visible: true,
        borderColor: gridColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      leftPriceScale: {
        visible: true,
        borderColor: gridColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
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

    // Actualizar colores de las series
    if (seriesRef.current.surface) {
      seriesRef.current.surface.applyOptions({
        color: isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(185, 28, 28, 0.8)",
      })
    }

    if (seriesRef.current.overSurface) {
      seriesRef.current.overSurface.applyOptions({
        color: isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(21, 128, 61, 0.8)",
      })
    }

    if (seriesRef.current.gyro) {
      seriesRef.current.gyro.applyOptions({
        color: isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(30, 64, 175, 0.8)",
      })
    }
  }, [theme, systemTheme])

  /**
   * Actualiza los datos del gráfico cuando cambian los filtros o datos
   * Utiliza setTimeout para asegurar que se ejecute después de la inicialización completa
   * Maneja la visibilidad de cada serie según los filtros activos
   */
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current.surface || !isInitializedRef.current) return

    // Use setTimeout to ensure this runs after the chart is fully initialized
    setTimeout(() => {
      if (showSurfaceTemp && data.surface.length > 0) {
        seriesRef.current.surface?.setData(data.surface.map((d) => ({ time: d.time as Time, value: d.value })))
      } else {
        seriesRef.current.surface?.setData([])
      }

      if (showOverSurfaceTemp && data.overSurface.length > 0) {
        seriesRef.current.overSurface?.setData(data.overSurface.map((d) => ({ time: d.time as Time, value: d.value })))
      } else {
        seriesRef.current.overSurface?.setData([])
      }

      if (showGyroX && data.gyro.length > 0) {
        seriesRef.current.gyro?.setData(data.gyro.map((d) => ({ time: d.time as Time, value: d.value })))
      } else {
        seriesRef.current.gyro?.setData([])
      }
    }, 0)
  }, [data, showSurfaceTemp, showOverSurfaceTemp, showGyroX])

  return <div ref={chartContainerRef} className="h-[355px] w-full" />
}

/**
 * Props del componente principal del gráfico
 * Define los parámetros necesarios para obtener y visualizar los datos
 */
interface TemperatureGyroscopeProps {
  bucket: string
  startDate?: Date
  endDate?: Date
}

/**
 * Componente principal del gráfico de temperatura y giroscopio
 * Maneja la obtención de datos, filtros y renderizado del gráfico
 * Proporciona estadísticas en tiempo real y manejo de errores
 */
const TemperatureGyrocopeChart: React.FC<TemperatureGyroscopeProps> = ({ bucket, startDate, endDate }) => {
  const [data, setData] = useState<DataPoint[]>([])
  const [showSurfaceTemp, setShowSurfaceTemp] = useState(true)
  const [showOverSurfaceTemp, setShowOverSurfaceTemp] = useState(true)
  const [showGyroX, setShowGyroX] = useState(true)
  const { theme, systemTheme } = useTheme()
  const [fetchError, setFetchError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const { data: session } = useSession()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  /**
   * Procesa los datos de forma memoizada para optimizar el rendimiento
   * Calcula estadísticas y formatea datos para el gráfico
   * Filtra valores nulos y calcula mínimos y máximos para cada serie
   */
  const { processedData, surfaceStats, overSurfaceStats } = useMemo(() => {
    if (!data.length) {
      return {
        processedData: { surface: [], overSurface: [], gyro: [] },
        surfaceStats: { min: null, max: null },
        overSurfaceStats: { min: null, max: null },
      }
    }

    /**
     * Función auxiliar para formatear datos de una serie específica
     * Filtra valores nulos y convierte timestamps a formato compatible
     */
    const formatData = (data: DataPoint[], key: keyof DataPoint) => {
      return data
        .filter((point) => point[key] !== null)
        .map((point) => ({
          time: point.timestamp / 1000,
          value: point[key] as number,
        }))
    }

    const surfaceValues = data.map((d) => d.surfaceTemperature).filter((v) => v !== null) as number[]
    const overValues = data.map((d) => d.overSurfaceTemperature).filter((v) => v !== null) as number[]

    return {
      processedData: {
        surface: formatData(data, "surfaceTemperature") as Array<{ time: Time; value: number }>,
        overSurface: formatData(data, "overSurfaceTemperature") as Array<{ time: Time; value: number }>,
        gyro: formatData(data, "gyroX") as Array<{ time: Time; value: number }>,
      },
      surfaceStats: {
        min: surfaceValues.length ? Math.min(...surfaceValues) : null,
        max: surfaceValues.length ? Math.max(...surfaceValues) : null,
      },
      overSurfaceStats: {
        min: overValues.length ? Math.min(...overValues) : null,
        max: overValues.length ? Math.max(...overValues) : null,
      },
    }
  }, [data])

  /**
   * Obtiene datos de temperatura y giroscopio desde la API
   * Realiza peticiones paralelas para optimizar el rendimiento
   * Combina y procesa los datos de diferentes fuentes
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) {
        console.error("No hay sesión iniciada")
        return
      }

      try {
        const start = startDate?.toISOString() || ''
        const stop = endDate?.toISOString() || ''

        // Realizar peticiones paralelas para optimizar rendimiento
        const [probeResponse, gyroResponse] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/history/data?bucket=${bucket}&start=${start}&stop=${stop}&_measurement=temperature_probe&fields=fields_surface_temperature,fields_over_surface_temperature&every=1m0s&fn=last&createEmpty=false&yieldName=last`,
            {
              headers: {
                Authorization: `${session.accessToken || ''}`,
              },
            },
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/history/data?bucket=${bucket}&start=${start}&stop=${stop}&_measurement=6_dof_imu&fields=fields_gyro_x&every=15s&fn=last&createEmpty=false&yieldName=last`,
            {
              headers: {
                Authorization: `${session.accessToken}`,
              },
            },
          ),
        ])

        const probeData = await probeResponse.json()
        const gyroData = await gyroResponse.json()

        // Combinar datos de diferentes fuentes por timestamp
        const combinedData: { [key: string]: DataPoint } = {}

        // Procesar datos de temperatura
        probeData?.forEach((item: {
          _time: string;
          _field: string;
          _value: number;
        }) => {
          const timestamp = new Date(item._time).getTime()
          if (!combinedData[timestamp]) {
            combinedData[timestamp] = {
              timestamp,
              surfaceTemperature: null,
              overSurfaceTemperature: null,
              gyroX: null,
            }
          }
          if (item._field === "fields_surface_temperature") {
            combinedData[timestamp].surfaceTemperature = item._value
          } else if (item._field === "fields_over_surface_temperature") {
            combinedData[timestamp].overSurfaceTemperature = item._value
          }
        })

        // Procesar datos de giroscopio
        gyroData?.forEach((item: {
          _time: string;
          _field: string;
          _value: number;
        }) => {
          const timestamp = new Date(item._time).getTime()
          if (!combinedData[timestamp]) {
            combinedData[timestamp] = {
              timestamp,
              surfaceTemperature: null,
              overSurfaceTemperature: null,
              gyroX: null,
            }
          }
          combinedData[timestamp].gyroX = item._value
        })

        setData(Object.values(combinedData).sort((a, b) => a.timestamp - b.timestamp))
        setFetchError(Object.values(combinedData).length === 0)
      } catch (error) {
        console.error('Error fetching temperature and gyroscope data:', error);
        setFetchError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [bucket, startDate, endDate, session])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col md:flex-row justify-between">
        <div>
          <CardTitle className="text-2xl font-bold">Temperaturas de la sonda</CardTitle>
          <CardDescription>
            Temperaturas de la superficie, sobre la superficie y eje X del giroscopio (°C)
          </CardDescription>
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
              <DropdownMenuItem
                className="flex items-center space-x-2 cursor-default"
                onSelect={(e) => e.preventDefault()}
              >
                <Checkbox checked={showSurfaceTemp} onCheckedChange={() => setShowSurfaceTemp(!showSurfaceTemp)} />
                <span className="pointer-events-none">Superficie</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center space-x-2 cursor-default"
                onSelect={(e) => e.preventDefault()}
              >
                <Checkbox
                  checked={showOverSurfaceTemp}
                  onCheckedChange={() => setShowOverSurfaceTemp(!showOverSurfaceTemp)}
                />
                <span className="pointer-events-none">Sobre la superficie</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center space-x-2 cursor-default"
                onSelect={(e) => e.preventDefault()}
              >
                <Checkbox checked={showGyroX} onCheckedChange={() => setShowGyroX(!showGyroX)} />
                <span className="pointer-events-none">Eje X del giroscopio</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      {/* Mensaje de error cuando no hay datos disponibles */}
      {fetchError && (
        <div className="mb-4 mx-4 max-w-[calc(100%-2rem)] px-4 py-3 rounded-md bg-destructive dark:bg-red-900 border border-destructive dark:border-red-800 text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 inline-block flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">
            No hay datos disponibles en este momento. Por favor, vuelva a intentarlo más tarde.
          </span>
        </div>
      )}

      {/* Estado de carga con skeletons */}
      {isLoading ? (
        <CardContent className="px-6 flex flex-col items-center justify-center h-[375px]">
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
            <CardContent className="px-6 flex flex-col">
              {/* Contenedor del gráfico con renderizado condicional */}
              <ChartContainer className="h-[355px] w-full" config={{}}>
                {isClient ? (
                  <ChartRenderer
                    data={processedData}
                    showSurfaceTemp={showSurfaceTemp}
                    showOverSurfaceTemp={showOverSurfaceTemp}
                    showGyroX={showGyroX}
                    theme={theme || 'light'}
                    systemTheme={systemTheme || 'light'}
                  />
                ) : (
                  <div className="h-[355px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                )}
              </ChartContainer>
              
              {/* Tarjetas de estadísticas con valores mínimos y máximos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card className="bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow md:my-2 md:mx-2 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
                    <CardTitle className="text-base font-bold">Temperatura de superficie</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSnowflake className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-300" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-300">Mínima</span>
                        </div>
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                          {surfaceStats.min?.toFixed(2)}°C
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSun className="h-4 w-4 mr-1 text-red-600 dark:text-red-300" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-300">Máxima</span>
                        </div>
                        <span className="text-xl font-bold text-red-600 dark:text-red-300">
                          {surfaceStats.max?.toFixed(2)}°C
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow md:my-2 md:mx-2 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
                    <CardTitle className="text-base font-bold">Temperatura sobre superficie</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSnowflake className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-300" />
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-300">Mínima</span>
                        </div>
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                          {overSurfaceStats.min?.toFixed(2)}°C
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                        <div className="flex items-center mb-1">
                          <ThermometerSun className="h-4 w-4 mr-1 text-red-600 dark:text-red-300" />
                          <span className="text-xs font-medium text-red-600 dark:text-red-300">Máxima</span>
                        </div>
                        <span className="text-xl font-bold text-red-600 dark:text-red-300">
                          {overSurfaceStats.max?.toFixed(2)}°C
                        </span>
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

export default TemperatureGyrocopeChart
