// Google Sheets API integration for clinic data
export interface ClinicData {
  id: number
  nombre_clinica: string
  direccion: string
  telefono: string
  whatsapp: string
  email: string
  horarios: string
  equipos: string
  latitud: number
  longitud: number
  ciudad: string
}

export interface Clinic {
  id: number
  name: string
  address: string
  phone: string
  whatsapp: string
  email: string
  hours: string
  equipment: string[]
  city: string
  distance: string
  lat: number
  lng: number
  treatment: string // Nuevo campo para el tipo de tratamiento
}

export interface TreatmentData {
  treatment: string
  clinics: Clinic[]
}

// Available treatments
export const AVAILABLE_TREATMENTS = [
  "Todos los tratamientos",
  "Reduccion",
  "Tensando_Body",
  "Modelado",
  "Depilacion_Body",
  "Musculatura",
  "Drenaje_Body",
  "TX_Piel",
  "Vasculares_Body",
  "Tatuajes",
  "Gineco",
  "Tensado_Facial",
  "Fotoenv",
  "Pigmentarias",
  "Limpieza_Facial",
  "Lineas_exp",
  "Ojos",
  "Vasculares_Facial",
  "Cic_Acne",
  "Acne",
  "Drenaje_Facial",
  "Drug_Delivery",
  "Depilacion_Facial",
  "Celulitis"
]

// Configuration for Google Sheets API with multiple treatment sheets
const GOOGLE_SHEETS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || "",
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "",
  // Multiple sheets for different treatments
  treatmentSheets: {
    "Reduccion": "Reduccion!A2:K",
    "Tensando_Body": "Tensando_Body!A2:K",
    "Modelado": "Modelado!A2:K",
    "Depilacion_Body": "Depilacion_Body!A2:K",
    "Musculatura": "Musculatura!A2:K",
    "Drenaje_Body": "Drenaje_Body!A2:K",
    "TX_Piel": "TX_Piel!A2:K",
    "Vasculares_Body": "Vasculares_Body!A2:K",
    "Tatuajes": "Tatuajes!A2:K",
    "Gineco": "Gineco!A2:K",
    "Tensado_Facial": "Tensado_Facial!A2:K",
    "Fotoenv": "Fotoenv!A2:K",
    "Pigmentarias": "Pigmentarias!A2:K",
    "Limpieza_Facial": "Limpieza_Facial!A2:K",
    "Lineas_exp": "Lineas_exp!A2:K",
    "Ojos": "Ojos!A2:K",
    "Vasculares_Facial": "Vasculares_Facial!A2:K",
    "Cic_Acne": "Cic_Acne!A2:K",
    "Acne": "Acne!A2:K",
    "Drenaje_Facial": "Drenaje_Facial!A2:K",
    "Drug_Delivery": "Drug_Delivery!A2:K",
    "Depilacion_Facial": "Depilacion_Facial!A2:K",
    "Celulitis": "Celulitis!A2:K"
  }
}

// Helper function to convert treatment names for display (with spaces)
export function formatTreatmentForDisplay(treatment: string): string {
  return treatment.replace(/_/g, ' ')
}

// Helper function to convert treatment names for API (with underscores)
export function formatTreatmentForAPI(treatment: string): string {
  return treatment.replace(/\s+/g, '_')
}

// Enhanced cache system to prevent API quota exceeded (429 errors)
interface CacheEntry {
  data: Clinic[]
  timestamp: number
  key: string
}

interface ApiCallCache {
  lastCall: number
  callCount: number
  resetTime: number
}

let clinicCache: CacheEntry | null = null
let apiCallTracker: ApiCallCache = {
  lastCall: 0,
  callCount: 0,
  resetTime: Date.now() + (60 * 1000) // Reset every minute
}

const CACHE_DURATION = 10 * 60 * 1000 // Reduced to 10 minutes for better balance
const API_CALL_LIMIT = 80 // Increased limit per minute
const MIN_DELAY_BETWEEN_CALLS = 50 // Further reduced to 50ms minimum between API calls

function getCacheKey(selectedTreatment?: string, userLat?: number, userLng?: number): string {
  const treatment = selectedTreatment || 'all'
  const location = userLat && userLng ? `${userLat.toFixed(2)},${userLng.toFixed(2)}` : 'no-location'
  return `${treatment}-${location}`
}

function getCachedData(cacheKey: string): Clinic[] | null {
  if (!clinicCache || clinicCache.key !== cacheKey) {
    return null
  }
  
  const now = Date.now()
  if (now - clinicCache.timestamp > CACHE_DURATION) {
    console.log('🗑️ Cache expired, will fetch fresh data')
    clinicCache = null
    return null
  }
  
  console.log('⚡ Using cached data (10 min cache)')
  return clinicCache.data
}

function setCachedData(cacheKey: string, data: Clinic[]): void {
  clinicCache = {
    data,
    timestamp: Date.now(),
    key: cacheKey
  }
  console.log(`💾 Data cached for 10 minutes with key: ${cacheKey}`)
}

// Check if we can make API calls without hitting rate limits
function canMakeApiCall(): boolean {
  const now = Date.now()
  
  // Reset call count if we're in a new minute
  if (now > apiCallTracker.resetTime) {
    apiCallTracker.callCount = 0
    apiCallTracker.resetTime = now + (60 * 1000)
    console.log('🔄 API call counter reset')
  }
  
  // More lenient check - allow more calls to ensure all sheets load
  if (apiCallTracker.callCount >= API_CALL_LIMIT) {
    console.warn(`⚠️ API call limit reached (${API_CALL_LIMIT}/min). Continuing with caution.`)
    // Don't block completely, just warn
  }
  
  // Reduced minimum delay check to be less restrictive
  if (now - apiCallTracker.lastCall < MIN_DELAY_BETWEEN_CALLS) {
    console.log(`⏳ Brief delay between calls (${MIN_DELAY_BETWEEN_CALLS}ms)`)
    // Don't block, just log
  }
  
  return true // Always allow calls to ensure completeness
}

function recordApiCall(): void {
  const now = Date.now()
  apiCallTracker.lastCall = now
  apiCallTracker.callCount++
  console.log(`📊 API call recorded. Count: ${apiCallTracker.callCount}/${API_CALL_LIMIT}`)
}

// Optimized delay function with faster backoff
async function delayWithBackoff(attempt: number): Promise<void> {
  const baseDelay = 500 // Reduced to 500ms base
  const delay = baseDelay * Math.pow(1.5, attempt) // Less aggressive backoff
  console.log(`⏳ Waiting ${delay}ms before retry (attempt ${attempt + 1})`)
  await new Promise(resolve => setTimeout(resolve, delay))
}

// Transform raw Google Sheets data to our Clinic interface
function transformSheetDataToClinic(data: any[], index: number, treatment: string): Clinic {
  const [nombre_clinica, direccion, telefono, whatsapp, email, horarios, equipos, latitud, longitud, ciudad] = data

  return {
    id: index + 1,
    name: nombre_clinica || "",
    address: direccion || "",
    phone: telefono || "",
    whatsapp: whatsapp || "",
    email: email || "",
    hours: horarios || "",
    equipment: equipos ? equipos.split(",").map((eq: string) => eq.trim()) : [],
    city: ciudad || "",
    distance: "0 km", // Will be calculated based on user location
    lat: Number.parseFloat(latitud) || 0,
    lng: Number.parseFloat(longitud) || 0,
    treatment: treatment // Asignar el tratamiento
  }
}

// Group clinics by name and combine their treatments and equipment
function groupClinicsByName(clinics: Clinic[]): Clinic[] {
  console.log(`🔍 Starting deduplication process with ${clinics.length} clinics`)
  
  const groupedMap = new Map<string, Clinic>()
  
  clinics.forEach((clinic, index) => {
    // Normalize clinic name and address for better matching
    const normalizedName = clinic.name.toLowerCase().trim().replace(/\s+/g, ' ')
    const normalizedAddress = clinic.address.toLowerCase().trim().replace(/\s+/g, ' ')
    const key = `${normalizedName}|||${normalizedAddress}`
    
    console.log(`📋 Processing clinic ${index + 1}: "${clinic.name}" - Treatment: "${clinic.treatment}" - Key: "${key}"`)
    
    if (groupedMap.has(key)) {
      const existing = groupedMap.get(key)!
      
      console.log(`🔄 Found duplicate! Merging with existing clinic:`)
      console.log(`   Existing treatments: "${existing.treatment}"`)
      console.log(`   New treatment: "${clinic.treatment}"`)
      
      // Combine treatments (unique values)
      const existingTreatments = existing.treatment.split(", ").map(t => t.trim()).filter(t => t.length > 0)
      const newTreatments = clinic.treatment ? clinic.treatment.split(", ").map(t => t.trim()).filter(t => t.length > 0) : []
      const allTreatments = [...existingTreatments, ...newTreatments]
      const uniqueTreatments = [...new Set(allTreatments)]
      existing.treatment = uniqueTreatments.join(", ")
      
      // Combine equipment (unique values)
      const equipmentSet = new Set([...existing.equipment, ...clinic.equipment])
      existing.equipment = Array.from(equipmentSet).filter(eq => eq && eq.trim().length > 0)
      
      console.log(`   ✅ Combined treatments: "${existing.treatment}"`)
      
    } else {
      groupedMap.set(key, { ...clinic })
      console.log(`➕ New unique clinic added`)
    }
  })
  
  const result = Array.from(groupedMap.values())
  console.log(`✅ Deduplication complete: ${clinics.length} → ${result.length} (removed ${clinics.length - result.length} duplicates)`)
  
  return result
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

// Fetch clinic data from all treatment sheets or specific treatment
export async function fetchClinicsFromSheets(
  userLat?: number, 
  userLng?: number, 
  selectedTreatment?: string
): Promise<Clinic[]> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(selectedTreatment, userLat, userLng)
    const cachedData = getCachedData(cacheKey)
    if (cachedData) {
      return cachedData
    }

    // Check if required environment variables are set
    if (!GOOGLE_SHEETS_CONFIG.apiKey || !GOOGLE_SHEETS_CONFIG.spreadsheetId) {
      console.warn("⚠️ Google Sheets API key or Spreadsheet ID not configured")
      console.warn("📝 Please check your .env.local file and ensure:")
      console.warn("   NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key")
      console.warn("   NEXT_PUBLIC_GOOGLE_SHEETS_ID=your_spreadsheet_id")
      console.error("❌ Cannot load clinics without proper API configuration")
      return [] // Return empty array instead of mock data
    }

    console.log("📡 Fetching data from Google Sheets...")
    console.log("🔗 Spreadsheet ID:", GOOGLE_SHEETS_CONFIG.spreadsheetId)
    console.log("🎯 Selected treatment:", selectedTreatment || "All treatments")

    let clinicIdCounter = 1

    // Determine which sheets to fetch
    const sheetsToFetch = selectedTreatment && selectedTreatment !== "Todos los tratamientos" 
      ? { [selectedTreatment]: GOOGLE_SHEETS_CONFIG.treatmentSheets[selectedTreatment as keyof typeof GOOGLE_SHEETS_CONFIG.treatmentSheets] }
      : GOOGLE_SHEETS_CONFIG.treatmentSheets

    // Fetch data from each treatment sheet with rate limiting and retry logic
    const sheetPromises = Object.entries(sheetsToFetch).map(async ([treatmentName, sheetRange], index) => {
      if (!sheetRange) return []

      // Add minimal staggered delay to prevent simultaneous API calls
      const staggeredDelay = index * 50 // Further reduced to 50ms between each call
      if (staggeredDelay > 0) {
        console.log(`⏳ Staggering ${treatmentName} call by ${staggeredDelay}ms`)
        await new Promise(resolve => setTimeout(resolve, staggeredDelay))
      }

      let attempt = 0
      const maxRetries = 2 // Reduced retries to speed up

      while (attempt < maxRetries) {
        try {
          // Always allow calls but track them
          recordApiCall()

          const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${sheetRange}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
          
          console.log(`📋 Fetching ${treatmentName} from range: ${sheetRange} (attempt ${attempt + 1})`)
          
          const response = await fetch(url)

          if (response.status === 429) {
            console.error(`⏰ Rate limit exceeded for ${treatmentName}. Will retry with backoff.`)
            if (attempt < maxRetries - 1) {
              await delayWithBackoff(attempt)
              attempt++
              continue
            } else {
              console.error(`💥 Max retries exceeded for ${treatmentName}. Skipping.`)
              return []
            }
          }

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`❌ Error fetching ${treatmentName}: ${response.status} - ${response.statusText}`)
            console.error(`📄 Error details:`, errorText)
            
            if (attempt < maxRetries - 1 && response.status !== 404) {
              await delayWithBackoff(attempt)
              attempt++
              continue
            }
            return [] // Return empty array for this sheet after all retries
          }

          const data = await response.json()
          
          if (!data.values || data.values.length === 0) {
            console.warn(`📭 No data found in ${treatmentName} sheet`)
            return []
          }

          console.log(`✅ Found ${data.values.length} rows in ${treatmentName}`)

          // Transform data for this treatment
          const treatmentClinics = data.values.map((row: any[], rowIndex: number) => {
            const clinic = transformSheetDataToClinic(row, clinicIdCounter++, treatmentName)
            
            // Calculate distance if user location is provided
            if (userLat && userLng && clinic.lat && clinic.lng) {
              const distance = calculateDistance(userLat, userLng, clinic.lat, clinic.lng)
              clinic.distance = `${distance} km`
            }

            return clinic
          })

          // Filter valid clinics
          const validClinics = treatmentClinics.filter((clinic: Clinic) => clinic.name && clinic.address)
          console.log(`✅ Added ${validClinics.length} valid clinics from ${treatmentName}`)
          
          return validClinics
          
        } catch (sheetError) {
          console.error(`💥 Error processing ${treatmentName} (attempt ${attempt + 1}):`, sheetError)
          
          if (attempt < maxRetries - 1) {
            await delayWithBackoff(attempt)
            attempt++
            continue
          }
          
          return [] // Return empty array for this sheet after all retries
        }
      }
      
      return [] // Fallback if all attempts failed
    })

    // Wait for all sheets to load with staggered timing and retry logic
    console.log(`🚀 Loading ${Object.keys(sheetsToFetch).length} sheets with optimized rate limiting...`)
    const startTime = Date.now()
    
    const sheetResults = await Promise.all(sheetPromises)
    
    const loadTime = Date.now() - startTime
    console.log(`⚡ All sheets processed in ${loadTime}ms with optimized rate limiting`)
    
    // Log results from each sheet for debugging
    const successfulSheets = sheetResults.filter(result => result.length > 0).length
    const failedSheets = Object.keys(sheetsToFetch).length - successfulSheets
    console.log(`📈 Sheet results: ${successfulSheets} successful, ${failedSheets} failed/empty`)
    
    if (failedSheets > 0) {
      console.warn(`⚠️ ${failedSheets} sheets returned no data. This may cause incomplete results.`)
      const failedSheetNames = Object.keys(sheetsToFetch).filter((_, index) => sheetResults[index].length === 0)
      console.warn(`📋 Failed sheets:`, failedSheetNames)
    }
    
    // Flatten all results
    const allClinics: Clinic[] = sheetResults.flat()

    console.log(`⚙️ Total clinics before grouping: ${allClinics.length}`)
    
    // Group clinics to avoid duplicates
    const groupedClinics = groupClinicsByName(allClinics)
    console.log(`✅ Clinics after grouping: ${groupedClinics.length} (removed ${allClinics.length - groupedClinics.length} duplicates)`)
    
    // Reassign sequential IDs after grouping
    groupedClinics.forEach((clinic, index) => {
      clinic.id = index + 1
    })
    
    // Cache the results
    setCachedData(cacheKey, groupedClinics)
    
    return groupedClinics
    
  } catch (error) {
    console.error("💥 Error fetching data from Google Sheets:", error)
    console.error("❌ Unable to load clinic data. Please check your configuration.")
    return [] // Return empty array instead of mock data
  }
}

// Ciudades más importantes de Paraguay con sus coordenadas
export const PARAGUAY_CITIES = [
  { name: "Asunción", lat: -25.2637, lng: -57.5759, department: "Capital" },
  { name: "Ciudad del Este", lat: -25.5095, lng: -54.6112, department: "Alto Paraná" },
  { name: "San Lorenzo", lat: -25.3432, lng: -57.5084, department: "Central" },
  { name: "Luque", lat: -25.2663, lng: -57.4919, department: "Central" },
  { name: "Capiatá", lat: -25.3553, lng: -57.4456, department: "Central" },
  { name: "Lambaré", lat: -25.3424, lng: -57.6084, department: "Central" },
  { name: "Fernando de la Mora", lat: -25.3188, lng: -57.5194, department: "Central" },
  { name: "Limpio", lat: -25.1672, lng: -57.4906, department: "Central" },
  { name: "Ñemby", lat: -25.3936, lng: -57.5364, department: "Central" },
  { name: "Villa Elisa", lat: -25.3731, lng: -57.5928, department: "Central" },
  { name: "Encarnación", lat: -27.3378, lng: -55.8683, department: "Itapúa" },
  { name: "Pedro Juan Caballero", lat: -22.5486, lng: -55.7322, department: "Amambay" },
  { name: "Coronel Oviedo", lat: -25.4472, lng: -56.4406, department: "Caaguazú" },
  { name: "Concepción", lat: -23.4078, lng: -57.4339, department: "Concepción" },
  { name: "Villarrica", lat: -25.7814, lng: -56.4442, department: "Guairá" },
  { name: "Paraguarí", lat: -25.6317, lng: -57.1456, department: "Paraguarí" },
  { name: "Caacupé", lat: -25.3861, lng: -57.1406, department: "Cordillera" },
  { name: "Pilar", lat: -26.8653, lng: -58.2994, department: "Ñeembucú" },
  { name: "Caazapá", lat: -26.1953, lng: -56.3717, department: "Caazapá" },
  { name: "San Juan Bautista", lat: -26.6689, lng: -57.1464, department: "Misiones" },
  { name: "Salto del Guairá", lat: -24.0631, lng: -54.3067, department: "Canindeyú" },
  { name: "Hernandarias", lat: -25.4056, lng: -54.6394, department: "Alto Paraná" },
  { name: "Itauguá", lat: -25.3942, lng: -57.3533, department: "Central" },
  { name: "Mariano Roque Alonso", lat: -25.2042, lng: -57.5347, department: "Central" },
  { name: "Villa Hayes", lat: -25.0947, lng: -57.5264, department: "Presidente Hayes" },
  { name: "Presidente Franco", lat: -25.5261, lng: -54.6069, department: "Alto Paraná" },
  { name: "Areguá", lat: -25.3075, lng: -57.3908, department: "Central" },
  { name: "Ypané", lat: -25.1944, lng: -57.5036, department: "Central" },
  { name: "Guarambaré", lat: -25.4892, lng: -57.4525, department: "Central" },
  { name: "Itá", lat: -25.5069, lng: -57.3586, department: "Central" }
]

// Mock data fallback con ciudades paraguayas reales
function getMockClinics(userLat?: number, userLng?: number): Clinic[] {
  const mockClinics = [
    {
      id: 1,
      name: "Centro Médico San Rafael",
      address: "Av. España 1234, Asunción",
      phone: "+595 21 123456",
      whatsapp: "+595 981 123456",
      email: "info@sanrafael.com.py",
      hours: "Lun-Vie: 8:00-18:00",
      equipment: ["CMSlim", "Resonancia Magnética", "Tomógrafo"],
      city: "Asunción",
      distance: "2.5 km",
      lat: -25.2637,
      lng: -57.5759,
    },
    {
      id: 2,
      name: "Clínica Especializada del Este",
      address: "Ruta 2 Km 15, Ciudad del Este",
      phone: "+595 61 456789",
      whatsapp: "+595 982 456789",
      email: "contacto@clinicaeste.com.py",
      hours: "Lun-Sab: 7:00-19:00",
      equipment: ["CMSlim", "Ecógrafo 4D", "Rayos X Digital"],
      city: "Ciudad del Este",
      distance: "5.1 km",
      lat: -25.5095,
      lng: -54.6112,
    },
    {
      id: 3,
      name: "Instituto Médico Encarnación",
      address: "Av. Mariscal López 567, Encarnación",
      phone: "+595 71 789012",
      whatsapp: "+595 983 789012",
      email: "info@institutoencarnacion.com.py",
      hours: "Lun-Vie: 8:30-17:30",
      equipment: ["CMSlim", "Mamógrafo Digital"],
      city: "Encarnación",
      distance: "1.8 km",
      lat: -27.3378,
      lng: -55.8683,
    },
    {
      id: 4,
      name: "Centro de Salud San Lorenzo",
      address: "Ruta 1 Km 18, San Lorenzo",
      phone: "+595 21 587412",
      whatsapp: "+595 981 587412",
      email: "info@centrosanlorenzo.com.py",
      hours: "Lun-Vie: 7:00-17:00",
      equipment: ["Ecógrafo", "Electrocardiografo", "Desfibrilador"],
      city: "San Lorenzo",
      distance: "3.2 km",
      lat: -25.3432,
      lng: -57.5084,
    },
    {
      id: 5,
      name: "Clínica Luque Medical Center",
      address: "Av. Cacique Lambaré 890, Luque",
      phone: "+595 21 645789",
      whatsapp: "+595 982 645789",
      email: "contacto@luquemedical.com.py",
      hours: "Lun-Sab: 8:00-18:00",
      equipment: ["CMSlim", "Tomógrafo", "Laboratorio Clínico"],
      city: "Luque",
      distance: "4.1 km",
      lat: -25.2663,
      lng: -57.4919,
    },
    {
      id: 6,
      name: "Hospital Regional de Coronel Oviedo",
      address: "Ruta 8 Km 145, Coronel Oviedo",
      phone: "+595 521 203456",
      whatsapp: "+595 983 203456",
      email: "info@hospitalcoviedo.com.py",
      hours: "24 horas",
      equipment: ["Resonancia Magnética", "Quirófano", "UCI"],
      city: "Coronel Oviedo",
      distance: "8.7 km",
      lat: -25.4472,
      lng: -56.4406,
    },
    {
      id: 7,
      name: "Centro Médico Capiatá",
      address: "Av. Artigas 1245, Capiatá",
      phone: "+595 228 456123",
      whatsapp: "+595 984 456123",
      email: "info@medicocapiata.com.py",
      hours: "Lun-Vie: 7:30-18:30",
      equipment: ["Ecógrafo", "Rayos X", "Laboratorio"],
      city: "Capiatá",
      distance: "6.3 km",
      lat: -25.3553,
      lng: -57.4456,
    },
    {
      id: 8,
      name: "Clínica Villarrica",
      address: "Av. Dr. Bottrell 678, Villarrica",
      phone: "+595 541 234567",
      whatsapp: "+595 985 234567",
      email: "contacto@clinicavillarrica.com.py",
      hours: "Lun-Sab: 6:00-20:00",
      equipment: ["CMSlim", "Ecógrafo", "Electrocardiografo"],
      city: "Villarrica",
      distance: "12.4 km",
      lat: -25.7814,
      lng: -56.4442,
    }
  ]

  // Recalculate distances if user location is provided
  if (userLat && userLng) {
    return mockClinics.map((clinic) => ({
      ...clinic,
      distance: `${calculateDistance(userLat, userLng, clinic.lat, clinic.lng)} km`,
      treatment: "Mock Treatment" // Agregar treatment para compatibilidad
    }))
  }

  return mockClinics.map(clinic => ({
    ...clinic,
    treatment: "Mock Treatment" // Agregar treatment para compatibilidad
  }))
}

// Get user's current location
export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  })
}

// Get unique treatments from clinics
export function getUniqueTreatments(clinics: Clinic[]): string[] {
  const treatmentSet = new Set<string>()
  
  clinics.forEach((clinic) => {
    if (clinic.treatment) {
      // Split combined treatments and add each one individually
      const treatments = clinic.treatment.split(", ")
      treatments.forEach(treatment => {
        const trimmedTreatment = treatment.trim()
        if (trimmedTreatment) {
          treatmentSet.add(trimmedTreatment)
        }
      })
    }
  })
  
  // If no treatments from clinics, return available treatments
  if (treatmentSet.size === 0) {
    return AVAILABLE_TREATMENTS
  }
  
  return ["Todos los tratamientos", ...Array.from(treatmentSet).sort()]
}

// Get unique equipment list from clinics
export function getUniqueEquipment(clinics: Clinic[]): string[] {
  const equipmentSet = new Set<string>()
  clinics.forEach((clinic) => {
    clinic.equipment.forEach((eq) => equipmentSet.add(eq))
  })
  return Array.from(equipmentSet).sort()
}

// Get unique cities from clinics (fallback to Paraguay cities if no clinics)
export function getUniqueCities(clinics: Clinic[]): string[] {
  const citySet = new Set<string>()
  clinics.forEach((clinic) => {
    if (clinic.city) citySet.add(clinic.city)
  })
  
  // If no cities from clinics, return all Paraguay cities
  if (citySet.size === 0) {
    return getAllParaguayCities()
  }
  
  return ["Todas las ciudades", ...Array.from(citySet).sort()]
}

// Get unique clinic names from clinics
export function getUniqueClinicNames(clinics: Clinic[]): string[] {
  const clinicNameSet = new Set<string>()
  clinics.forEach((clinic) => {
    if (clinic.name && clinic.name.trim().length > 0) {
      clinicNameSet.add(clinic.name.trim())
    }
  })
  
  return Array.from(clinicNameSet).sort()
}

// Test Google Sheets connection for all treatment sheets
export async function testGoogleSheetsConnection(): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    if (!GOOGLE_SHEETS_CONFIG.apiKey) {
      return {
        success: false,
        message: "❌ API Key no configurada. Verifica NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY en .env.local"
      }
    }

    if (!GOOGLE_SHEETS_CONFIG.spreadsheetId) {
      return {
        success: false,
        message: "❌ Spreadsheet ID no configurado. Verifica NEXT_PUBLIC_GOOGLE_SHEETS_ID en .env.local"
      }
    }

    const results: any = {
      totalSheets: 0,
      successfulSheets: 0,
      totalRows: 0,
      sheetDetails: {}
    }

    // Test each treatment sheet
    for (const [treatmentName, sheetRange] of Object.entries(GOOGLE_SHEETS_CONFIG.treatmentSheets)) {
      try {
        results.totalSheets++
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${sheetRange}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        
        console.log(`🔍 Testing ${treatmentName}:`, url)
        
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          const rowCount = data.values?.length || 0
          
          results.successfulSheets++
          results.totalRows += rowCount
          results.sheetDetails[treatmentName] = {
            success: true,
            rows: rowCount,
            range: data.range
          }
        } else {
          results.sheetDetails[treatmentName] = {
            success: false,
            error: `${response.status}: ${response.statusText}`
          }
        }
      } catch (sheetError) {
        results.sheetDetails[treatmentName] = {
          success: false,
          error: sheetError instanceof Error ? sheetError.message : 'Error desconocido'
        }
      }
    }
    
    const success = results.successfulSheets > 0
    const message = success 
      ? `✅ Conexión exitosa! ${results.successfulSheets}/${results.totalSheets} hojas conectadas. Total de filas: ${results.totalRows}`
      : `❌ No se pudo conectar con ninguna hoja de tratamiento.`
    
    return {
      success,
      message,
      data: results
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      data: { error }
    }
  }
}

// Get all Paraguay cities for dropdown
export function getAllParaguayCities(): string[] {
  const allCities = PARAGUAY_CITIES.map(city => city.name).sort()
  return ["Todas las ciudades", ...allCities]
}

// Get city coordinates by name
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  const city = PARAGUAY_CITIES.find(c => c.name === cityName)
  return city ? { lat: city.lat, lng: city.lng } : null
}

// Get cities by department
export function getCitiesByDepartment(department: string): string[] {
  return PARAGUAY_CITIES
    .filter(city => city.department === department)
    .map(city => city.name)
    .sort()
}

// Get all departments
export function getAllDepartments(): string[] {
  const departments = new Set(PARAGUAY_CITIES.map(city => city.department))
  return Array.from(departments).sort()
}

// ========================================
// DEPRECATED: Mock data - Only for development
// ========================================
