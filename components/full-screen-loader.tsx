"use client"

import { Loader2 } from "lucide-react"

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      {/* Logo de Ares */}
      <div className="mb-8">
        <img 
          src="/images/isologo-ares.png" 
          alt="Ares Paraguay" 
          className="w-20 h-20 sm:w-24 sm:h-24"
        />
      </div>
      
      {/* Spinner elegante */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
      </div>
      
      {/* Texto minimalista */}
      <div className="mt-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando clínicas</h3>
      </div>
      
      {/* Indicador de progreso sutil */}
      <div className="mt-4 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}