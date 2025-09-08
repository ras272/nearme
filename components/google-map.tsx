"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Clinic } from "@/lib/google-sheets"

interface GoogleMapProps {
  clinics: Clinic[]
  onClinicSelect?: (clinic: Clinic) => void
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function GoogleMap({ clinics, onClinicSelect }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userMarker, setUserMarker] = useState<any>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Load Google Maps API
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY"}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => {
      setIsLoaded(true)
    }

    script.onerror = () => {
      console.error("Error loading Google Maps API")
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google) return

    const mapOptions = {
      center: { lat: -25.2637, lng: -57.5759 }, // Asunción center
      zoom: 10,
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
    
    // Request user location when map is initialized
    getUserLocation(newMap)
  }, [isLoaded])

  // Get user location function
  const getUserLocation = (mapInstance?: any) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          
          setUserLocation(pos)
          setLocationError(null)
          
          const currentMap = mapInstance || map
          if (currentMap) {
            // Create user location marker
            const userLocationMarker = new window.google.maps.Marker({
              position: pos,
              map: currentMap,
              title: "Tu ubicación",
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," +
                  encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" fill="white"/>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.3"/>
                    </svg>
                  `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12),
              },
            })
            
            // Create info window for user location
            const userInfoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; text-align: center;">
                  <h3 style="margin: 0 0 8px 0; color: #3b82f6;">📍 Tu Ubicación</h3>
                  <p style="margin: 0; font-size: 14px; color: #666;">Estás aquí</p>
                </div>
              `,
            })
            
            userLocationMarker.addListener("click", () => {
              userInfoWindow.open(currentMap, userLocationMarker)
            })
            
            setUserMarker(userLocationMarker)
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Permisos de ubicación denegados")
              break
            case error.POSITION_UNAVAILABLE:
              setLocationError("Ubicación no disponible")
              break
            case error.TIMEOUT:
              setLocationError("Tiempo de espera agotado")
              break
            default:
              setLocationError("Error desconocido obteniendo ubicación")
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      setLocationError("Geolocalización no soportada en este navegador")
    }
  }

  // Add markers for clinics
  useEffect(() => {
    if (!map || !window.google) return

    // Clear existing clinic markers (but keep user marker)
    markers.forEach((marker) => {
      if (marker !== userMarker) {
        marker.setMap(null)
      }
    })

    const newMarkers = clinics
      .map((clinic) => {
        if (!clinic.lat || !clinic.lng) return null

        const marker = new window.google.maps.Marker({
          position: { lat: clinic.lat, lng: clinic.lng },
          map: map,
          title: clinic.name,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
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

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
          <div style="max-width: 300px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${clinic.name}</h3>
            <div style="margin-bottom: 8px;">
              ${clinic.equipment.map((eq) => `<span style="background: #f0f9ff; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-right: 4px;">${eq}</span>`).join("")}
            </div>
            <p style="margin: 4px 0; font-size: 14px; color: #666;">📍 ${clinic.address}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #666;">📞 ${clinic.phone}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #666;">🕒 ${clinic.hours}</p>
            ${userLocation ? `<p style="margin: 4px 0; font-size: 14px; color: #059669; font-weight: 600;">📍 ${clinic.distance}</p>` : ''}
            <div style="margin-top: 8px;">
              <button onclick="window.open('https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola! Encontré su clínica en la página de Ares Paraguay y me interesa obtener más información sobre tratamientos disponibles.\n\n¿Podrían brindarme más detalles sobre consultas y tratamientos?\n\n¡Gracias!`)}')" 
                      style="background: #059669; color: white; border: none; padding: 6px 12px; border-radius: 4px; margin-right: 8px; cursor: pointer;">
                WhatsApp
              </button>
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ''}&destination=${encodeURIComponent(clinic.address)}')"
                      style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                Cómo llegar
              </button>
            </div>
          </div>
        `,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
          setSelectedClinic(clinic)
          onClinicSelect?.(clinic)
        })

        return marker
      })
      .filter(Boolean)

    // Keep user marker in the markers array if it exists
    const allMarkers = userMarker ? [userMarker, ...newMarkers] : newMarkers
    setMarkers(allMarkers)

    // Adjust map bounds to show all markers including user location
    if (allMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      allMarkers.forEach((marker) => {
        if (marker) bounds.extend(marker.getPosition())
      })
      map.fitBounds(bounds)
      
      // Set a reasonable zoom level if there are markers
      const listener = window.google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom() > 15) map.setZoom(15)
        window.google.maps.event.removeListener(listener)
      })
    }
  }, [map, clinics, onClinicSelect, userMarker, userLocation])

  if (!isLoaded) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle>Mapa de Clínicas</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium">Cargando mapa...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mapa de Clínicas</span>
          <div className="flex items-center gap-2">
            {locationError && (
              <Badge variant="destructive" className="text-xs">
                {locationError}
              </Badge>
            )}
            {userLocation && (
              <Badge variant="default" className="text-xs bg-blue-600">
                📍 Tu ubicación detectada
              </Badge>
            )}
            <Badge variant="secondary">{clinics.length} clínicas</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-full p-0">
        <div ref={mapRef} className="w-full h-full rounded-b-lg" style={{ minHeight: "500px" }} />
      </CardContent>
    </Card>
  )
}
