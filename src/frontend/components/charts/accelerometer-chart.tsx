"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createChart, ColorType, type Time, type LineData, type IChartApi, type ISeriesApi } from "lightweight-charts"
import { ChartContainer } from "@/components/ui/chart"
import { useTheme } from "next-themes"
import { AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"

type AccelData = {
  timestamp: number
  accel_x: number
  accel_y: number
  accel_z: number
}

interface AccelChartRendererProps {
  data: AccelData[]
  theme?: string
  systemTheme?: string
}

const AccelChartRenderer: React.FC<AccelChartRendererProps> = ({ data, theme, systemTheme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<Record<string, ISeriesApi<'Line'>>>({})

  useEffect(() => {
    if (!chartContainerRef.current) return

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
          return date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: "Europe/Madrid",
          })
        },
      },
    })

    chartRef.current = chart

    // Create series
    seriesRef.current.accelX = chart.addLineSeries({
      color: isDarkMode ? "rgba(239, 68, 68, 0.8)" : "rgba(185, 28, 28, 0.8)",
      lineWidth: 1,
      title: "Eje X",
    })

    seriesRef.current.accelY = chart.addLineSeries({
      color: isDarkMode ? "rgba(34, 197, 94, 0.8)" : "rgba(21, 128, 61, 0.8)",
      lineWidth: 1,
      title: "Eje Y",
    })

    seriesRef.current.accelZ = chart.addLineSeries({
      color: isDarkMode ? "rgba(59, 130, 246, 0.8)" : "rgba(30, 64, 175, 0.8)",
      lineWidth: 1,
      title: "Eje Z",
    })

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
    }
  }, [theme, systemTheme])

  // Update data when data changes
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current.accelX) return

    // Use setTimeout to ensure this runs after the chart is fully initialized
    setTimeout(() => {
      const formatData = (data: AccelData[], key: "accel_x" | "accel_y" | "accel_z"): LineData[] => {
        return data
          .map((point) => ({
            time: point.timestamp as Time,
            value: point[key],
          }))
          .sort((a, b) => (a.time as number) - (b.time as number))
      }

      const sortedData = data
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter((item, index, array) => index === 0 || item.timestamp !== array[index - 1].timestamp)

      if (sortedData.length > 0) {
        seriesRef.current.accelX?.setData(formatData(sortedData, "accel_x"))
        seriesRef.current.accelY?.setData(formatData(sortedData, "accel_y"))
        seriesRef.current.accelZ?.setData(formatData(sortedData, "accel_z"))
      }
    }, 0)
  }, [data])

  return <div ref={chartContainerRef} className="h-[300px] sm:h-[400px] w-full" />
}

export default function AccelerometerChart({ bucket }: { bucket: string }) {
  const [data, setData] = useState<AccelData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("Desconectado")
  const [loading, setLoading] = useState<boolean>(true)
  const [isClient, setIsClient] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const { theme, systemTheme } = useTheme()
  const { data: session, status } = useSession()

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const connectWebSocket = () => {
    if (status === "loading") return
    if (!session?.accessToken) {
      setError("No hay token de autenticación disponible")
      return
    }

    setConnectionStatus("Conectando...")
    wsRef.current = new WebSocket(
      `${process.env.NEXT_PUBLIC_WSS_URL}/realtime/data?from=${bucket}&info=6_dof_imu&token=${session.accessToken}`,
    )

    wsRef.current.onopen = () => {
      setConnectionStatus("Conectado")
      setError(null)
    }

    wsRef.current.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data)
        if (!rawData.payload || !Array.isArray(rawData.payload)) {
          throw new Error("Los datos recibidos no están en el formato esperado")
        }

        const newDataPoints = rawData.payload.map((item: {
          timestamp: number;
          fields: {
            accel_x: number;
            accel_y: number;
            accel_z: number;
          };
        }) => ({
          timestamp: Math.floor(item.timestamp),
          accel_x: item.fields.accel_x,
          accel_y: item.fields.accel_y,
          accel_z: item.fields.accel_z,
        }))

        setData((prevData) => {
          const combinedData = [...prevData, ...newDataPoints].sort((a, b) => a.timestamp - b.timestamp).slice(-1000)
          return combinedData
        })
        setLoading(false)
      } catch (err) {
        console.error("Error al procesar datos del WebSocket:", err)
        setError(`Error al procesar datos: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    wsRef.current.onerror = (event) => {
      console.error("Error de WebSocket:", event)
      setError("Error de conexión recibiendo datos en tiempo real. Por favor, vuelva a intentarlo más tarde.")
      setConnectionStatus("Error")
    }

    wsRef.current.onclose = (event) => {
      console.log("WebSocket desconectado", event.code, event.reason)
      setConnectionStatus("Desconectado")

      if (event.code === 1008) {
        setError(`Token inválido: ${event.reason || "Invalid token"}`)
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      connectWebSocket()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [session, status])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl sm:text-2xl font-bold break-words leading-tight">
              Datos del acelerómetro de la sonda
            </CardTitle>
            <CardDescription className="mt-1">Lecturas en tiempo real del acelerómetro (m/s²)</CardDescription>
          </div>
          <Badge
            variant={connectionStatus === "Conectado" ? "default" : "destructive"}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 pointer-events-none w-fit shrink-0 ${
              connectionStatus === "Conectado"
                ? "bg-green-800 dark:bg-green-700 text-white border border-green-800 dark:border-green-700"
                : "bg-red-700 dark:bg-red-900 text-white border border-red-700 dark:border-red-900"
            }`}
          >
            {connectionStatus === "Conectado" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{connectionStatus}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        {error ? (
          <div className="mb-4 px-3 sm:px-4 py-3 rounded-md bg-destructive dark:bg-red-900 border border-destructive dark:border-red-800 text-white flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 inline-block flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-sm font-medium break-words">{error}</span>
          </div>
        ) : loading ? (
          <Skeleton className="h-[300px] sm:h-[400px] w-full" />
        ) : (
          <ChartContainer className="h-[300px] sm:h-[400px] w-full" config={{}}>
            {isClient ? (
              <AccelChartRenderer data={data} theme={theme} systemTheme={systemTheme} />
            ) : (
              <div className="h-[300px] sm:h-[400px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
