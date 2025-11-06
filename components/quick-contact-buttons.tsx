"use client"

import type React from "react"

import { Phone, MessageCircle, Navigation, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import ContactDialog from "./contact-dialog"
import type { Clinic } from "@/lib/google-sheets"

interface QuickContactButtonsProps {
  clinic: Clinic
}

export default function QuickContactButtons({ clinic }: QuickContactButtonsProps) {
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    const message = encodeURIComponent(
      `Hola! Encontré su clínica en la página de Ares Paraguay y me interesa obtener más información sobre tratamientos disponibles.

¿Podrían brindarme más detalles sobre los tratamientos que ofrecen?

¡Gracias!`,
    )
    window.open(`https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, "")}?text=${message}`, "_blank")
  }

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Use direct Maps URL if available, otherwise fallback to address
    if (clinic.mapsUrl && clinic.mapsUrl.trim() !== "") {
      window.open(clinic.mapsUrl, "_blank")
    } else {
      const encodedAddress = encodeURIComponent(clinic.address)
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank")
    }
  }

  const handlePhoneCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`tel:${clinic.phone}`, "_self")
  }

  return (
    <div className="flex gap-2 pt-2">
      <Button
        size="sm"
        onClick={handleWhatsApp}
        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium px-2 py-2"
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        <span className="text-xs">WhatsApp</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handlePhoneCall}
        className="flex-1 border-2 border-emerald-300 text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:border-emerald-400 bg-white shadow-sm hover:shadow-md transition-all duration-200 font-medium px-2 py-2"
      >
        <Phone className="w-4 h-4 mr-1" />
        <span className="text-xs">Llamar</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleDirections}
        className="flex-shrink-0 border-2 border-blue-300 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 bg-white shadow-sm hover:shadow-md transition-all duration-200 px-1.5 py-2"
      >
        <Navigation className="w-4 h-4" />
      </Button>

      <ContactDialog clinic={clinic}>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 border-2 border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:border-purple-400 bg-white shadow-sm hover:shadow-md transition-all duration-200 px-1.5 py-2"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </ContactDialog>
    </div>
  )
}
