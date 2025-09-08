"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, CheckCircle, XCircle } from "lucide-react"
import { geocodeAddress, batchGeocodeAddresses } from "@/lib/google-sheets"

interface GeocodeResult {
  address: string
  lat?: number
  lng?: number
  success: boolean
  error?: string
}

export default function TestGeocodingPage() {
  const [singleAddress, setSingleAddress] = useState("")
  const [batchAddresses, setBatchAddresses] = useState("Av. España 1234, Asunción\nRuta 2 Km 15, Ciudad del Este\nAv. Mariscal López 567, Encarnación")
  const [singleResult, setSingleResult] = useState<GeocodeResult | null>(null)
  const [batchResults, setBatchResults] = useState<GeocodeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBatchLoading, setIsBatchLoading] = useState(false)

  const handleSingleGeocode = async () => {
    if (!singleAddress.trim()) return

    setIsLoading(true)
    setSingleResult(null)

    try {
      const result = await geocodeAddress(singleAddress)
      if (result) {
        setSingleResult({
          address: singleAddress,
          lat: result.lat,
          lng: result.lng,
          success: true
        })
      } else {
        setSingleResult({
          address: singleAddress,
          success: false,
          error: "No se pudo geocodificar la dirección"
        })
      }
    } catch (error) {
      setSingleResult({
        address: singleAddress,
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchGeocode = async () => {
    const addresses = batchAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)

    if (addresses.length === 0) return

    setIsBatchLoading(true)
    setBatchResults([])

    try {
      console.log('🚀 Starting batch geocoding for:', addresses)
      const results = await batchGeocodeAddresses(addresses)
      
      const formattedResults: GeocodeResult[] = addresses.map(address => {
        const coords = results.get(address)
        if (coords) {
          return {
            address,
            lat: coords.lat,
            lng: coords.lng,
            success: true
          }
        } else {
          return {
            address,
            success: false,
            error: "No se pudo geocodificar"
          }
        }
      })

      setBatchResults(formattedResults)
    } catch (error) {
      console.error('Error in batch geocoding:', error)
    } finally {
      setIsBatchLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          🗺️ Prueba de Geocodificación Automática
        </h1>
        <p className="text-gray-600">
          Convierte direcciones de Paraguay a coordenadas automáticamente
        </p>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Estado de la API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm">Google Maps API Key:</span>
            <Badge variant={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "default" : "destructive"}>
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "✅ Configurada" : "❌ No configurada"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Single Address Test */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Geocodificación Individual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Av. España 1234, Asunción"
              value={singleAddress}
              onChange={(e) => setSingleAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSingleGeocode()}
            />
            <Button 
              onClick={handleSingleGeocode}
              disabled={isLoading || !singleAddress.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              Geocodificar
            </Button>
          </div>

          {singleResult && (
            <Alert className={singleResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-start gap-2">
                {singleResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="font-medium mb-1">{singleResult.address}</div>
                    {singleResult.success ? (
                      <div className="text-sm text-green-700">
                        <strong>Coordenadas:</strong> {singleResult.lat}, {singleResult.lng}
                        <br />
                        <a 
                          href={`https://www.google.com/maps/@${singleResult.lat},${singleResult.lng},15z`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          📍 Ver en Google Maps
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        <strong>Error:</strong> {singleResult.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Batch Geocoding Test */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Geocodificación en Lotes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Direcciones (una por línea):
            </label>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg resize-none"
              rows={5}
              value={batchAddresses}
              onChange={(e) => setBatchAddresses(e.target.value)}
              placeholder="Av. España 1234, Asunción&#10;Ruta 2 Km 15, Ciudad del Este&#10;Av. Mariscal López 567, Encarnación"
            />
          </div>

          <Button 
            onClick={handleBatchGeocode}
            disabled={isBatchLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isBatchLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Geocodificando...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Geocodificar Todas
              </>
            )}
          </Button>

          {batchResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                Resultados ({batchResults.filter(r => r.success).length}/{batchResults.length} exitosos)
              </h4>
              
              <div className="space-y-2">
                {batchResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 border rounded-lg ${
                      result.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">{result.address}</span>
                    </div>
                    
                    {result.success ? (
                      <div className="text-xs text-green-700 ml-6">
                        <code>{result.lat}, {result.lng}</code>
                        {' | '}
                        <a 
                          href={`https://www.google.com/maps/@${result.lat},${result.lng},15z`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver en mapa
                        </a>
                      </div>
                    ) : (
                      <div className="text-xs text-red-700 ml-6">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>✅ Ahora puedes:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li>Poner solo direcciones en tu Google Sheet (sin lat/lng)</li>
              <li>El sistema convertirá automáticamente direcciones → coordenadas</li>
              <li>Se cachean los resultados para evitar repetir búsquedas</li>
              <li>Funciona como fallback si no hay coordenadas manuales</li>
            </ul>
            
            <p className="mt-4"><strong>🎯 Tips para mejores resultados:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
              <li>Incluye la ciudad: "Av. España 1234, Asunción"</li>
              <li>Usa referencias conocidas: "Centro Comercial X, Ciudad"</li>
              <li>Evita abreviaciones confusas</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}