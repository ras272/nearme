"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

declare global {
  interface Window {
    google: any
  }
}

export default function TestMapsPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string>("")

  useEffect(() => {
    // Mostrar la API key (solo para testing)
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "NO CONFIGURADA"
    setApiKey(key)

    if (window.google) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      setIsLoaded(true)
      setError(null)
    }

    script.onerror = () => {
      setError("Error cargando Google Maps API. Verifica tu API key.")
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return

    try {
      const mapOptions = {
        center: { lat: -25.2637, lng: -57.5759 }, // Asunción
        zoom: 12,
        styles: [
          {
            featureType: "poi.medical",
            elementType: "geometry.fill",
            stylers: [{ color: "#059669" }],
          },
        ],
      }

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions)
      setMap(newMap)

      // Agregar un marcador de prueba
      const marker = new window.google.maps.Marker({
        position: { lat: -25.2637, lng: -57.5759 },
        map: newMap,
        title: "Marcador de Prueba - Asunción",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#059669"/>
                <path d="M16 8C13.79 8 12 9.79 12 12C12 15.5 16 22 16 22S20 15.5 20 12C20 9.79 18.21 8 16 8ZM16 14C15.45 14 15 13.55 15 13S15.45 12 16 12S17 12.45 17 13S16.55 14 16 14Z" fill="white"/>
              </svg>
            `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32),
        },
      })

      // InfoWindow de prueba
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 8px 0; color: #059669;">¡API de Google Maps Funcionando!</h3>
            <p style="margin: 0; font-size: 14px;">Este marcador confirma que tu API key está configurada correctamente.</p>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(newMap, marker)
      })

      setError(null)
    } catch (err) {
      setError("Error inicializando el mapa: " + (err as Error).message)
    }
  }, [isLoaded])

  const testGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          if (map) {
            map.setCenter(pos)
            map.setZoom(15)

            new window.google.maps.Marker({
              position: pos,
              map: map,
              title: "Tu ubicación",
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" fill="#3b82f6"/>
                      <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                  `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12),
              },
            })
          }
        },
        () => {
          setError("Error obteniendo tu ubicación")
        }
      )
    } else {
      setError("Geolocalización no soportada en este navegador")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-2">
          Prueba de Google Maps API
        </h1>
        <p className="text-gray-600">
          Verifica que tu API key esté funcionando correctamente
        </p>
      </div>

      {/* Estado de la API */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Estado de la API</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isLoaded ? "default" : "secondary"} className="w-full justify-center">
              {isLoaded ? "✅ Cargada" : "⏳ Cargando..."}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded truncate">
              {apiKey.length > 20 ? `${apiKey.substring(0, 20)}...` : apiKey}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={map ? "default" : "secondary"} className="w-full justify-center">
              {map ? "✅ Inicializado" : "⏳ Esperando..."}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controles de prueba */}
      <div className="flex gap-4 justify-center">
        <Button onClick={testGeolocation} disabled={!map}>
          📍 Probar Geolocalización
        </Button>
        <Button 
          onClick={() => window.open('/test-connection', '_blank')}
          variant="outline"
        >
          🔗 Probar Conexión API
        </Button>
      </div>

      {/* Mapa */}
      <Card className="h-[500px]">
        <CardHeader>
          <CardTitle>Mapa de Prueba</CardTitle>
        </CardHeader>
        <CardContent className="h-full p-0">
          {!isLoaded ? (
            <div className="w-full h-full bg-gray-100 rounded-b-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg font-medium">Cargando Google Maps...</p>
                <p className="text-sm">Verificando API key...</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full rounded-b-lg" style={{ minHeight: "400px" }} />
          )}
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>¿Qué verificar?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span>El mapa se carga correctamente</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span>Aparece un marcador verde en Asunción</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span>Al hacer clic en el marcador aparece un info window</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span>La geolocalización funciona (si das permiso)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">ℹ️</span>
            <span>No hay errores en la consola del navegador (F12)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}