"use client"

import { useState } from "react"
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Navigation, 
  Share2, 
  Heart, 
  Copy, 
  Check, 
  Clock,
  MapPin,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import type { Clinic } from "@/lib/google-sheets"

interface ClinicDetailModalProps {
  clinic: Clinic
  children: React.ReactNode
}

export default function ClinicDetailModal({ clinic, children }: ClinicDetailModalProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleWhatsApp = () => {
    const treatments = clinic.treatment.split(", ").join(" y ")
    const message = encodeURIComponent(
      `Hola! Encontré su clínica "${clinic.name}" en la página de Ares Paraguay y me interesa obtener más información sobre los tratamientos de ${treatments}.

¿Podrían brindarme más detalles sobre:
- Disponibilidad de turnos
- Costos y formas de pago
- Duración de los tratamientos

¡Muchas gracias!`
    )
    window.open(`https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, "")}?text=${message}`, "_blank")
  }

  const handlePhoneCall = () => {
    window.open(`tel:${clinic.phone}`, "_self")
  }

  const handleEmail = () => {
    const treatments = clinic.treatment.split(", ").join(", ")
    const subject = encodeURIComponent(`Consulta sobre tratamientos - ${clinic.name}`)
    const body = encodeURIComponent(`Estimados,

Encontré su clínica en la página de Ares Paraguay y me interesa obtener más información sobre los siguientes tratamientos: ${treatments}.

¿Podrían brindarme más detalles sobre:
- Disponibilidad de turnos
- Costos y formas de pago
- Duración de los tratamientos
- Preparación previa requerida

Quedo atento a su respuesta.

Saludos cordiales.`)

    window.open(`mailto:${clinic.email}?subject=${subject}&body=${body}`, "_self")
  }

  const handleDirections = () => {
    // Use direct Maps URL if available, otherwise fallback to address
    if (clinic.mapsUrl && clinic.mapsUrl.trim() !== "") {
      window.open(clinic.mapsUrl, "_blank")
    } else {
      const encodedAddress = encodeURIComponent(clinic.address)
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank")
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: `${clinic.name} - Clínicas Ares Paraguay`,
      text: `Descubre esta clínica con equipos médicos de última generación: ${clinic.equipment.slice(0, 3).join(", ")}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${clinic.name}\n📍 ${clinic.address}\n📞 ${clinic.phone}\n🏥 Tratamientos: ${clinic.treatment}\n💼 Equipos: ${clinic.equipment.join(", ")}\n\n🔗 ${window.location.href}`
        )
        toast({
          title: "Información copiada",
          description: "Los datos de la clínica se copiaron al portapapeles",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Error al compartir",
        description: "No se pudo compartir la información",
        variant: "destructive",
      })
    }
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    const favorites = JSON.parse(localStorage.getItem("clinic-favorites") || "[]")

    if (!isFavorite) {
      favorites.push(clinic.id)
      toast({
        title: "Clínica guardada",
        description: `${clinic.name} se agregó a favoritos`,
      })
    } else {
      const index = favorites.indexOf(clinic.id)
      if (index > -1) favorites.splice(index, 1)
      toast({
        title: "Clínica removida",
        description: `${clinic.name} se quitó de favoritos`,
      })
    }

    localStorage.setItem("clinic-favorites", JSON.stringify(favorites))
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({
        title: "Copiado",
        description: `${field} copiado al portapapeles`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      })
    }
  }

  const treatmentList = clinic.treatment.split(", ").filter(t => t.trim().length > 0)
  const equipmentList = clinic.equipment.filter(eq => eq && eq.trim().length > 0)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden p-0 gap-0 border-0 bg-white">
        {/* Header minimalista */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-medium text-gray-900">{clinic.name}</h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>{clinic.city}</span>
                <span>•</span>
                <span>{clinic.distance}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Content scrollable */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-6">
          
          {/* Stats row */}
          <div className="flex gap-4 text-center">
            <div className="flex-1">
              <div className="text-2xl font-light text-gray-900">{treatmentList.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Tratamientos</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-light text-gray-900">{equipmentList.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Equipos</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-light text-blue-600">{clinic.distance.replace(' km', '')}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">KM</div>
            </div>
          </div>

          {/* Tratamientos */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Tratamientos</h3>
            <div className="flex flex-wrap gap-1.5">
              {treatmentList.map((treatment, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center px-2.5 py-1 text-xs text-gray-700 bg-gray-100 rounded-full"
                >
                  {treatment}
                </span>
              ))}
            </div>
          </div>

          {/* Equipos */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Equipos médicos</h3>
            <div className="space-y-1.5">
              {equipmentList.map((equipment, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  • {equipment}
                </div>
              ))}
            </div>
          </div>

          {/* Contact info minimalista */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Contacto</h3>
            
            {/* Dirección */}
            <div className="group">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Dirección</div>
                  <div className="text-sm text-gray-900">{clinic.address}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(clinic.address, "Dirección")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "Dirección" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Teléfono */}
            <div className="group">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Teléfono</div>
                  <div className="text-sm text-gray-900">{clinic.phone}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(clinic.phone, "Teléfono")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                >
                  {copiedField === "Teléfono" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Email */}
            {clinic.email && (
              <div className="group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Email</div>
                    <div className="text-sm text-gray-900">{clinic.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(clinic.email, "Email")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                  >
                    {copiedField === "Email" ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Horarios */}
            <div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Horarios</div>
                <div className="text-sm text-gray-900">{clinic.hours}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleWhatsApp}
              className="w-full bg-black hover:bg-gray-800 text-white h-11 font-normal"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contactar por WhatsApp
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handlePhoneCall}
                variant="outline"
                className="h-11 font-normal border-gray-200 hover:bg-gray-50"
              >
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </Button>
              <Button
                onClick={handleDirections}
                variant="outline"
                className="h-11 font-normal border-gray-200 hover:bg-gray-50"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Ubicación
              </Button>
            </div>

            {clinic.email && (
              <Button
                onClick={handleEmail}
                variant="ghost"
                className="w-full h-11 font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar email
              </Button>
            )}

            <Button
              onClick={handleShare}
              variant="ghost"
              className="w-full h-11 font-normal text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}