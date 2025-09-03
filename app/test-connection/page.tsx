"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Database, Settings } from "lucide-react"
import { testGoogleSheetsConnection, fetchClinicsFromSheets } from "@/lib/google-sheets"

export default function TestConnection() {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [clinicsData, setClinicsData] = useState<any>(null)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    setClinicsData(null)

    try {
      const result = await testGoogleSheetsConnection()
      setTestResult(result)

      if (result.success) {
        // If connection is successful, try to fetch actual data
        const clinics = await fetchClinicsFromSheets()
        setClinicsData({
          count: clinics.length,
          cities: [...new Set(clinics.map(c => c.city))],
          equipment: [...new Set(clinics.flatMap(c => c.equipment))]
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
      })
    } finally {
      setIsTesting(false)
    }
  }

  const envVars = {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID,
    mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test de Conexión - Near My Clinic</h1>
          <p className="text-gray-600">Verifica la configuración de Google Sheets API</p>
        </div>

        {/* Environment Variables Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Variables de Entorno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">GOOGLE_SHEETS_API_KEY:</span>
              <Badge variant={envVars.apiKey ? "default" : "destructive"}>
                {envVars.apiKey ? "✓ Configurada" : "✗ No configurada"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">GOOGLE_SHEETS_ID:</span>
              <Badge variant={envVars.spreadsheetId ? "default" : "destructive"}>
                {envVars.spreadsheetId ? "✓ Configurada" : "✗ No configurada"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">GOOGLE_MAPS_API_KEY:</span>
              <Badge variant={envVars.mapsApiKey ? "default" : "secondary"}>
                {envVars.mapsApiKey ? "✓ Configurada" : "✗ No configurada"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Test Button */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Prueba de Conexión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleTestConnection} 
              disabled={isTesting || !envVars.apiKey || !envVars.spreadsheetId}
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Probando conexión...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Probar Conexión con Google Sheets
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                Resultado de la Prueba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                  {testResult.message}
                </AlertDescription>
              </Alert>

              {testResult.data && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-medium mb-2">Detalles:</h4>
                  <pre className="text-sm text-gray-700 overflow-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Clinics Data Preview */}
        {clinicsData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Datos Obtenidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{clinicsData.count}</div>
                  <div className="text-sm text-gray-600">Clínicas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{clinicsData.cities.length}</div>
                  <div className="text-sm text-gray-600">Ciudades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{clinicsData.equipment.length}</div>
                  <div className="text-sm text-gray-600">Equipos</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Ciudades encontradas:</h4>
                <div className="flex flex-wrap gap-2">
                  {clinicsData.cities.map((city: string) => (
                    <Badge key={city} variant="outline">{city}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Equipos encontrados:</h4>
                <div className="flex flex-wrap gap-2">
                  {clinicsData.equipment.map((equipment: string) => (
                    <Badge key={equipment} variant="secondary">{equipment}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="space-y-2 text-sm">
              <li>Crea un proyecto en <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-blue-600">Google Cloud Console</a></li>
              <li>Habilita la <strong>Google Sheets API</strong></li>
              <li>Crea una <strong>API Key</strong> en Credenciales</li>
              <li>Crea un Google Sheet con la estructura correcta (ver docs/google-sheets-structure.md)</li>
              <li>Comparte el sheet como <strong>"público"</strong> o <strong>"cualquiera con el enlace puede ver"</strong></li>
              <li>Configura las variables en <code>.env.local</code></li>
              <li>Reinicia el servidor de desarrollo</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}