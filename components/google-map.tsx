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
  const [hasFittedBounds, setHasFittedBounds] = useState(false)
  const [markersCreated, setMarkersCreated] = useState(false)

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

  // Create beautiful clinic markers with modern design
  const createClinicMarker = (clinic: any, index: number) => {
    // Different colors for visual variety
    const colors = [
      { primary: '#059669', secondary: '#10b981', accent: '#6ee7b7' }, // Green
      { primary: '#3b82f6', secondary: '#60a5fa', accent: '#93c5fd' }, // Blue  
      { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#c4b5fd' }, // Purple
      { primary: '#ef4444', secondary: '#f87171', accent: '#fca5a5' }, // Red
      { primary: '#f59e0b', secondary: '#fbbf24', accent: '#fde68a' }, // Orange
    ]
    
    const colorScheme = colors[index % colors.length]
    
    // Enhanced modern marker with glow effect and animations
    const markerSvg = `
      <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer glow -->
        <defs>
          <filter id="glow-${index}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
          <linearGradient id="gradient-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${colorScheme.secondary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorScheme.primary};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Shadow -->
        <ellipse cx="20" cy="48" rx="12" ry="4" fill="black" opacity="0.2"/>
        
        <!-- Main pin body with gradient -->
        <path d="M20 4C12.268 4 6 10.268 6 18C6 28 20 46 20 46S34 28 34 18C34 10.268 27.732 4 20 4Z" 
              fill="url(#gradient-${index})" 
              stroke="white" 
              stroke-width="2"
              filter="url(#glow-${index})"/>
        
        <!-- Medical cross icon -->
        <g transform="translate(20, 18)">
          <circle r="8" fill="white" opacity="0.95"/>
          <path d="M-3 -1 H3 V1 H-3 Z M-1 -3 H1 V3 H-1 Z" fill="${colorScheme.primary}"/>
        </g>
        
        <!-- Pulse ring animation -->
        <circle cx="20" cy="18" r="8" fill="none" stroke="${colorScheme.accent}" stroke-width="2" opacity="0.6">
          <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
      </svg>
    `
    
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(markerSvg),
      scaledSize: new window.google.maps.Size(40, 52),
      anchor: new window.google.maps.Point(20, 52),
      labelOrigin: new window.google.maps.Point(20, 55)
    }
  }

  // Create user location marker with premium design
  const createUserLocationMarker = () => {
    const userMarkerSvg = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="userGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </radialGradient>
          <filter id="userGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        <!-- Outer pulse ring -->
        <circle cx="16" cy="16" r="12" fill="none" stroke="#3b82f6" stroke-width="1" opacity="0.3">
          <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Middle ring -->
        <circle cx="16" cy="16" r="10" fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.5">
          <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Main circle -->
        <circle cx="16" cy="16" r="8" fill="url(#userGradient)" 
                stroke="white" stroke-width="3" filter="url(#userGlow)"/>
        
        <!-- Inner dot -->
        <circle cx="16" cy="16" r="3" fill="white"/>
      </svg>
    `
    
    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(userMarkerSvg),
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 16),
    }
  }
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
            // Create user location marker with premium design
            const userLocationMarker = new window.google.maps.Marker({
              position: pos,
              map: currentMap,
              title: "Tu ubicación",
              icon: createUserLocationMarker(),
              zIndex: 1000, // Higher z-index to appear above clinic markers
            })
            
            // Create stylized info window for user location
            const userInfoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="
                  padding: 16px; 
                  text-align: center;
                  border-radius: 12px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 280px;
                ">
                  <div style="
                    width: 48px; 
                    height: 48px; 
                    background: linear-gradient(135deg, #3b82f6, #60a5fa);
                    border-radius: 50%;
                    margin: 0 auto 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                  ">
                    <span style="font-size: 20px;📍</span>
                  </div>
                  
                  <h3 style="
                    margin: 0 0 8px 0; 
                    color: #1f2937;
                    font-size: 18px;
                    font-weight: 600;
                  ">Tu Ubicación</h3>
                  
                  <p style="
                    margin: 0;
                    font-size: 14px;
                    color: #6b7280;
                  ">Usamos tu ubicación para calcular distancias a las clínicas</p>
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

    // Only create markers if they haven't been created yet or if clinics changed
    if (markersCreated && markers.length > 0) return

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
          icon: createClinicMarker(clinic, clinics.indexOf(clinic)),
          zIndex: 100, // Lower than user marker
          // Add animation only on first creation
          animation: !markersCreated ? window.google.maps.Animation.DROP : null,
        })

        // Create modern, stylized info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
          <div style="
            max-width: 360px; 
            padding: 20px;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
          ">
            <div style="margin-bottom: 16px;">
              <div style="
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
              ">
                <div style="
                  width: 40px;
                  height: 40px;
                  background: linear-gradient(135deg, #059669, #10b981);
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
                ">
                  <span style="color: white; font-size: 18px; font-weight: bold;">+</span>
                </div>
                <div>
                  <h3 style="
                    margin: 0;
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                    line-height: 1.2;
                  ">${clinic.name}</h3>
                  <p style="
                    margin: 0;
                    font-size: 14px;
                    color: #6b7280;
                    font-weight: 500;
                  ">${clinic.city}</p>
                </div>
              </div>
              
              ${userLocation ? `
                <div style="
                  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
                  padding: 8px 12px;
                  border-radius: 8px;
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span style="font-size: 12px;">📍</span>
                  <span style="
                    font-size: 13px;
                    font-weight: 600;
                    color: #1e40af;
                  ">${clinic.distance} de distancia</span>
                </div>
              ` : ''}
            </div>
            
            <div style="margin-bottom: 16px;">
              <p style="
                margin: 0 0 8px 0;
                font-size: 12px;
                font-weight: 600;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">Equipos Disponibles</p>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${clinic.equipment.slice(0, 4).map((eq) => `
                  <span style="
                    background: #f0fdf4;
                    color: #166534;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid #bbf7d0;
                  ">${eq}</span>
                `).join('')}
                ${clinic.equipment.length > 4 ? `
                  <span style="
                    background: #f9fafb;
                    color: #6b7280;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid #e5e7eb;
                  ">+${clinic.equipment.length - 4} más</span>
                ` : ''}
              </div>
            </div>
            
            <div style="
              background: #f8fafc;
              padding: 12px;
              border-radius: 12px;
              margin-bottom: 16px;
              border: 1px solid #e2e8f0;
            ">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 14px;">📍</span>
                <span style="font-size: 13px; color: #475569;">${clinic.address}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 14px;">📞</span>
                <span style="font-size: 13px; color: #475569;">${clinic.phone}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px;">🕒</span>
                <span style="font-size: 13px; color: #475569;">${clinic.hours}</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
              <button onclick="window.open('https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola! Encontré su clínica en la página de Ares Paraguay y me interesa obtener más información sobre tratamientos disponibles.\n\n¿Podrían brindarme más detalles sobre consultas y tratamientos?\n\n¡Gracias!`)}')"
                      style="
                        background: linear-gradient(135deg, #059669, #10b981);
                        color: white;
                        border: none;
                        padding: 12px 16px;
                        border-radius: 10px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        flex: 1;
                        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
                        transition: all 0.2s ease;
                      "
                      onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(5, 150, 105, 0.4)'"
                      onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(5, 150, 105, 0.3)'">
                WhatsApp
              </button>
              
              <button onclick="window.open('${clinic.mapsUrl && clinic.mapsUrl.trim() !== "" ? clinic.mapsUrl : `https://www.google.com/maps/dir/?api=1${userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : ""}&destination=${encodeURIComponent(clinic.address)}`}')"
                      style="
                        background: #ffffff;
                        color: #374151;
                        border: 1px solid #d1d5db;
                        padding: 12px 16px;
                        border-radius: 10px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        flex: 1;
                        transition: all 0.2s ease;
                      "
                      onmouseover="this.style.background='#f9fafb'; this.style.borderColor='#9ca3af'"
                      onmouseout="this.style.background='#ffffff'; this.style.borderColor='#d1d5db'">
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

    // Adjust map bounds to show all markers including user location ONLY on initial load
    if (allMarkers.length > 0 && !hasFittedBounds) {
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
      
      // Mark that we've already fitted bounds so it doesn't happen again
      setHasFittedBounds(true)
    }

    // Mark markers as created
    if (!markersCreated) {
      setMarkersCreated(true)
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
