'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import AdminView from './adminview'

// import UserView from './userview'

export default function FarmViewPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const farmId = params?.farmId as string
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [farmData, setFarmData] = useState(null)
  const [serverMessage, setServerMessage] = useState('')

  useEffect(() => {
    const checkAccess = async () => {
      if (!session?.accessToken) {
        console.error('No hay sesión iniciada')
        return
      }

      try {
        const response = await fetch(`http://localhost:5001/farm/${farmId}/access`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${session.accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setHasAccess(true)
          setFarmData(data) // Guardar los datos recibidos
        } else {
          const errorData = await response.json()
          setServerMessage(errorData.message || 'Acceso denegado')
          setHasAccess(false)
        }
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, []) // Eliminar dependencias para que se ejecute solo una vez

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-background">
        <Card className="w-full max-w-md bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Cargando información de la granja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-[125px] rounded-xl" />

          </CardContent>
          <CardFooter>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Por favor, espere...</span>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (status === 'unauthenticated' || !hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-background">
        <Card className="w-full max-w-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              Acceso denegado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
                <AlertTitle className="font-semibold">Permiso restringido</AlertTitle>
              <AlertDescription>
              {serverMessage}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div>
  
          {session?.user?.role === 'Administrador' ? (
            <div>
              <AdminView farmData={farmData} />
            </div>
          ) : (
            <div>
              </div>
          )}

    </div>
  )
}
