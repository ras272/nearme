"use client"

import type React from "react"

import { useState } from "react"
import { Phone, Mail, MessageCircle, Navigation, Share2, Heart, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import type { Clinic } from "@/lib/google-sheets"

interface ContactDialogProps {
  clinic: Clinic
  children: React.ReactNode
}

export default function ContactDialog({ clinic, children }: ContactDialogProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola! Encontré su clínica en la página de Ares Paraguay y me interesa obtener más información sobre los tratamientos que ofrecen.

¿Podrían brindarme más detalles sobre consultas y tratamientos disponibles?

¡Muchas gracias!`,
    )
    window.open(`https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, "")}?text=${message}`, "_blank")
  }

  const handlePhoneCall = () => {
    window.open(`tel:${clinic.phone}`, "_self")
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(`Consulta sobre tratamientos - ${clinic.name}`)
    const body = encodeURIComponent(`Estimados,

Encontré su clínica en la página de Ares Paraguay y me interesa obtener más información sobre los tratamientos que ofrecen.

¿Podrían brindarme más detalles sobre:
- Tipos de tratamientos disponibles
- Costos y formas de pago
- Disponibilidad de turnos

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
      title: `${clinic.name} - Near My Clinic`,
      text: `Encontré esta clínica con equipos médicos: ${clinic.equipment.join(", ")}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${clinic.name}\n${clinic.address}\n${clinic.phone}\n\nEquipos: ${clinic.equipment.join(", ")}\n\n${window.location.href}`,
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

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-emerald-200">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base sm:text-lg">
            <span className="text-balance pr-2 text-emerald-900">{clinic.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={`flex-shrink-0 hover:bg-emerald-50 ${isFavorite ? "text-red-500" : "text-emerald-600"}`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-sm text-emerald-700">
            Información de contacto y equipos disponibles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-emerald-800">Equipos Disponibles</h4>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {clinic.equipment.map((eq) => (
                <Badge key={eq} className="text-xs bg-emerald-100 text-emerald-800 border-emerald-300">
                  {eq}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-emerald-200" />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-emerald-800">Información de Contacto</h4>

            {/* Address */}
            <div className="flex items-start justify-between p-3 bg-emerald-50/50 rounded-lg gap-2 border border-emerald-100">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-900">Dirección</p>
                  <p className="text-xs text-emerald-700 leading-relaxed break-words">{clinic.address}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(clinic.address, "Dirección")}
                className="flex-shrink-0 hover:bg-emerald-100 text-emerald-600"
              >
                {copiedField === "Dirección" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg gap-2 border border-emerald-100">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-900">Teléfono</p>
                  <p className="text-xs text-emerald-700 break-all">{clinic.phone}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(clinic.phone, "Teléfono")}
                className="flex-shrink-0 hover:bg-emerald-100 text-emerald-600"
              >
                {copiedField === "Teléfono" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Email */}
            {clinic.email && (
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg gap-2 border border-emerald-100">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-emerald-900">Email</p>
                    <p className="text-xs text-emerald-700 break-all">{clinic.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(clinic.email, "Email")}
                  className="flex-shrink-0 hover:bg-emerald-100 text-emerald-600"
                >
                  {copiedField === "Email" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Hours */}
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900">Horarios</p>
                  <p className="text-xs text-emerald-700 leading-relaxed">{clinic.hours}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-emerald-200" />

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleWhatsApp}
                className="w-full text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={handlePhoneCall}
                variant="outline"
                className="w-full text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 bg-transparent"
              >
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleEmail}
                variant="outline"
                className="w-full text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 bg-transparent"
                disabled={!clinic.email}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                onClick={handleDirections}
                variant="outline"
                className="w-full text-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 bg-transparent"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Cómo llegar
              </Button>
            </div>

            <Button
              onClick={handleShare}
              variant="ghost"
              className="w-full text-sm text-emerald-700 hover:bg-emerald-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir clínica
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
