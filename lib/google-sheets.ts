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
  maps_url: string
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
  mapsUrl?: string // URL directo de Google Maps (opcional)
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

// ============================================
// NEW ARCHITECTURE: Simplified 2-sheet structure
// ============================================
// Configuration for Google Sheets API with simplified structure
const GOOGLE_SHEETS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || "",
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "",
  // Only 2 sheets: Clinicas (all clinics) + TXS (equipment → treatments mapping)
  sheets: {
    "Clinicas": "Clinicas!A2:K",  // All clinics in one sheet (K = maps_url)
    "TXS": "TXS!A2:B"              // Equipment to treatments mapping
  }
}

// Equipment to Treatments mapping interface
export interface EquipmentTreatmentMap {
  [equipment: string]: string[]  // e.g., "CMSlim" → ["Reduccion", "Modelado", "Celulitis"]
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

function getCachedData(cacheKey: string, forceRefresh: boolean = false): Clinic[] | null {
  // Developer mode: bypass cache if refresh=true in URL
  if (forceRefresh) {
    console.log('🔄 Developer mode: Force refresh enabled, bypassing cache')
    clinicCache = null
    return null
  }
  
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

// ============================================
// GEOCODING FUNCTIONS - Automatic lat/lng conversion
// ============================================

interface GeocodingCacheEntry {
  lat: number
  lng: number
  timestamp: number
}

interface GeocodingCache {
  [address: string]: GeocodingCacheEntry
}

let geocodingCache: GeocodingCache = {}
const GEOCODING_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Get cached coordinates for an address
function getCachedCoordinates(address: string): { lat: number; lng: number } | null {
  const normalizedAddress = address.toLowerCase().trim()
  const cached = geocodingCache[normalizedAddress]
  
  if (!cached) return null
  
  const now = Date.now()
  if (now - cached.timestamp > GEOCODING_CACHE_DURATION) {
    delete geocodingCache[normalizedAddress]
    return null
  }
  
  console.log(`🎯 Using cached coordinates for: ${address}`)
  return { lat: cached.lat, lng: cached.lng }
}

// Cache coordinates for an address
function setCachedCoordinates(address: string, lat: number, lng: number): void {
  const normalizedAddress = address.toLowerCase().trim()
  geocodingCache[normalizedAddress] = {
    lat,
    lng,
    timestamp: Date.now()
  }
  console.log(`💾 Cached coordinates for: ${address} -> ${lat}, ${lng}`)
}

// Geocode an address using Google Maps Geocoding API
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  const cached = getCachedCoordinates(address)
  if (cached) return cached
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('⚠️ Google Maps API key not configured for geocoding')
    return null
  }
  
  try {
    // Add Paraguay bias for better local results
    const encodedAddress = encodeURIComponent(`${address}, Paraguay`)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=py&language=es`
    
    console.log(`🗺️ Geocoding address: ${address}`)
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      const coordinates = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      }
      
      // Cache the result
      setCachedCoordinates(address, coordinates.lat, coordinates.lng)
      
      console.log(`✅ Geocoded: ${address} -> ${coordinates.lat}, ${coordinates.lng}`)
      return coordinates
    } else {
      console.warn(`❌ Geocoding failed for: ${address}. Status: ${data.status}`)
      return null
    }
  } catch (error) {
    console.error(`💥 Geocoding error for ${address}:`, error)
    return null
  }
}

// Batch geocode multiple addresses with rate limiting
export async function batchGeocodeAddresses(addresses: string[]): Promise<Map<string, { lat: number; lng: number }>> {
  const results = new Map<string, { lat: number; lng: number }>()
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  console.log(`🚀 Starting batch geocoding for ${addresses.length} addresses`)
  
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    
    // Check if we already have coordinates
    const cached = getCachedCoordinates(address)
    if (cached) {
      results.set(address, cached)
      continue
    }
    
    // Geocode the address
    const coordinates = await geocodeAddress(address)
    if (coordinates) {
      results.set(address, coordinates)
    }
    
    // Rate limiting: wait between requests to avoid quota issues
    if (i < addresses.length - 1) {
      await delay(100) // 100ms between requests
    }
  }
  
  console.log(`✅ Batch geocoding completed. Success: ${results.size}/${addresses.length}`)
  return results
}

// Optimized delay function with faster backoff
async function delayWithBackoff(attempt: number): Promise<void> {
  const baseDelay = 500 // Reduced to 500ms base
  const delay = baseDelay * Math.pow(1.5, attempt) // Less aggressive backoff
  console.log(`⏳ Waiting ${delay}ms before retry (attempt ${attempt + 1})`)
  await new Promise(resolve => setTimeout(resolve, delay))
}

// ============================================
// NEW FUNCTIONS: Equipment → Treatment Mapping
// ============================================

// Load equipment-to-treatment mapping from TXS sheet
async function loadEquipmentToTreatmentMapping(): Promise<EquipmentTreatmentMap> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/TXS!A2:B?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
  
  console.log('📋 Loading equipment-treatment mapping from TXS sheet...')
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`❌ Error fetching TXS sheet: ${response.status}`)
      return {}
    }
    
    const data = await response.json()
    
    if (!data.values || data.values.length === 0) {
      console.warn('⚠️ TXS sheet is empty or not found')
      return {}
    }
    
    const mapping: EquipmentTreatmentMap = {}
    
    // Parse TXS format: [EQUIPO, "Tratamiento1, Tratamiento2, ..."]
    data.values.forEach((row: any[]) => {
      const [equipment, treatmentsStr] = row
      if (equipment && treatmentsStr) {
        const normalizedEquipment = equipment.trim()
        mapping[normalizedEquipment] = treatmentsStr
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
        
        console.log(`   ✓ ${normalizedEquipment} → [${mapping[normalizedEquipment].join(', ')}]`)
      }
    })
    
    console.log(`✅ Loaded mapping for ${Object.keys(mapping).length} equipment types`)
    return mapping
    
  } catch (error) {
    console.error('💥 Error loading TXS mapping:', error)
    return {}
  }
}

// Map equipment list to treatments using TXS mapping
function mapEquipmentsToTreatments(
  equipments: string[], 
  mapping: EquipmentTreatmentMap
): string[] {
  const treatmentsSet = new Set<string>()
  
  equipments.forEach(equipment => {
    const normalizedEquipment = equipment.trim()
    const treatments = mapping[normalizedEquipment]
    
    if (treatments && treatments.length > 0) {
      treatments.forEach(treatment => treatmentsSet.add(treatment))
    } else {
      console.warn(`⚠️ No treatments found for equipment: ${normalizedEquipment}`)
    }
  })
  
  return Array.from(treatmentsSet).sort()
}

// Transform raw Google Sheets data to our Clinic interface (NEW VERSION - no treatment param)
function transformSheetDataToClinic(
  data: any[],
  index: number,
  equipmentTreatmentMap: EquipmentTreatmentMap
): Clinic {
  const [nombre_clinica, direccion, telefono, whatsapp, email, horarios, equipos, latitud, longitud, ciudad, maps_url] = data

  // Parse equipment list
  const equipmentList = equipos 
    ? equipos.split(",").map((eq: string) => eq.trim()).filter((eq: string) => eq.length > 0)
    : []

  // ✨ NEW: Map equipment → treatments dynamically using TXS
  const treatments = mapEquipmentsToTreatments(equipmentList, equipmentTreatmentMap)

  // Parse coordinates - support both manual and geocoded
  let lat = 0
  let lng = 0
  
  // Try to parse manual coordinates first
  if (latitud && longitud) {
    lat = Number.parseFloat(latitud)
    lng = Number.parseFloat(longitud)
  }

  return {
    id: index + 1,
    name: nombre_clinica || "",
    address: direccion || "",
    phone: telefono || "",
    whatsapp: whatsapp || "",
    email: email || "",
    hours: horarios || "",
    equipment: equipmentList,
    city: ciudad || "",
    distance: "0 km", // Will be calculated based on user location
    lat,
    lng,
    treatment: treatments.join(", "), // Treatments mapped dynamically from equipment
    mapsUrl: maps_url || "" // Direct Google Maps link
  }
}

// Enhanced version: Process clinics with automatic geocoding for missing coordinates
export async function processClinicCoordinates(clinics: Clinic[]): Promise<Clinic[]> {
  console.log(`🗺️ Processing coordinates for ${clinics.length} clinics...`)
  
  // Find clinics without coordinates
  const clinicsNeedingGeocode = clinics.filter(clinic => 
    clinic.address && (!clinic.lat || !clinic.lng || (clinic.lat === 0 && clinic.lng === 0))
  )
  
  if (clinicsNeedingGeocode.length === 0) {
    console.log(`✅ All clinics already have coordinates!`)
    return clinics
  }
  
  console.log(`🔍 Found ${clinicsNeedingGeocode.length} clinics needing geocoding:`)
  clinicsNeedingGeocode.forEach(clinic => {
    console.log(`   - ${clinic.name}: ${clinic.address}`)
  })
  
  // Extract unique addresses for batch geocoding
  const addressesToGeocode = [...new Set(
    clinicsNeedingGeocode.map(clinic => clinic.address)
  )]
  
  console.log(`🚀 Starting batch geocoding for ${addressesToGeocode.length} unique addresses...`)
  
  // Batch geocode all addresses
  const geocodedCoordinates = await batchGeocodeAddresses(addressesToGeocode)
  
  // Update clinics with geocoded coordinates
  const updatedClinics = clinics.map(clinic => {
    if (clinic.address && (!clinic.lat || !clinic.lng || (clinic.lat === 0 && clinic.lng === 0))) {
      const coordinates = geocodedCoordinates.get(clinic.address)
      if (coordinates) {
        console.log(`✅ Updated ${clinic.name}: ${coordinates.lat}, ${coordinates.lng}`)
        return {
          ...clinic,
          lat: coordinates.lat,
          lng: coordinates.lng
        }
      } else {
        console.warn(`⚠️ Could not geocode: ${clinic.name} (${clinic.address})`)
      }
    }
    return clinic
  })
  
  const successfulGeocodes = updatedClinics.filter(clinic => clinic.lat && clinic.lng && !(clinic.lat === 0 && clinic.lng === 0)).length
  const totalClinics = clinics.length
  
  console.log(`🎉 Geocoding complete! ${successfulGeocodes}/${totalClinics} clinics have coordinates`)
  
  return updatedClinics
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
    // Check for developer mode (force refresh from Google Sheets)
    const forceRefresh = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).get('refresh') === 'true'
    
    if (forceRefresh) {
      console.log('🛠️ Developer mode activated: refresh=true - fetching from Google Sheets')
      return fetchClinicsFromSheetsAPI(userLat, userLng, selectedTreatment)
    }
    
    // Check cache first
    const cacheKey = getCacheKey(selectedTreatment, userLat, userLng)
    const cachedData = getCachedData(cacheKey, false)
    if (cachedData) {
      return cachedData
    }

    // ⚡ NEW: Load from static JSON file (super fast!)
    console.log("⚡ Loading clinics from static JSON file...")
    
    try {
      const response = await fetch('/data/clinics.json')
      if (!response.ok) {
        console.warn('⚠️ Static JSON not found, falling back to Google Sheets API')
        return fetchClinicsFromSheetsAPI(userLat, userLng, selectedTreatment)
      }
      
      const jsonData = await response.json()
      console.log(`✅ Loaded ${jsonData.total_clinics} clinics from static JSON (generated: ${jsonData.generated_at})`)
      
      let clinics: Clinic[] = jsonData.clinics
      
      // Filter by treatment if specified
      if (selectedTreatment && selectedTreatment !== "Todos los tratamientos") {
        clinics = clinics.filter((clinic) => {
          const treatments = clinic.treatment.split(", ")
          return treatments.some(treatment => treatment.trim() === selectedTreatment)
        })
        console.log(`🔍 Filtered to ${clinics.length} clinics for treatment: ${selectedTreatment}`)
      }
      
      // Calculate distances if user location is provided
      if (userLat && userLng) {
        console.log(`📍 Calculating distances from user location: ${userLat}, ${userLng}`)
        clinics.forEach(clinic => {
          if (clinic.lat && clinic.lng) {
            const distance = calculateDistance(userLat, userLng, clinic.lat, clinic.lng)
            clinic.distance = `${distance} km`
          }
        })
      }
      
      // Cache the results
      setCachedData(cacheKey, clinics)
      
      return clinics
      
    } catch (jsonError) {
      console.error('💥 Error loading static JSON:', jsonError)
      console.warn('⚠️ Falling back to Google Sheets API')
      return fetchClinicsFromSheetsAPI(userLat, userLng, selectedTreatment)
    }
    
  } catch (error) {
    console.error("💥 Error fetching data:", error)
    return []
  }
}

// Original function to fetch from Google Sheets API (fallback or dev mode) - NEW ARCHITECTURE
async function fetchClinicsFromSheetsAPI(
  userLat?: number, 
  userLng?: number, 
  selectedTreatment?: string
): Promise<Clinic[]> {
  try {
    // Check if required environment variables are set
    if (!GOOGLE_SHEETS_CONFIG.apiKey || !GOOGLE_SHEETS_CONFIG.spreadsheetId) {
      console.warn("⚠️ Google Sheets API key or Spreadsheet ID not configured")
      console.warn("📝 Please check your .env.local file and ensure:")
      console.warn("   NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key")
      console.warn("   NEXT_PUBLIC_GOOGLE_SHEETS_ID=your_spreadsheet_id")
      console.error("❌ Cannot load clinics without proper API configuration")
      return []
    }

    console.log("📡 Fetching data from Google Sheets API (NEW ARCHITECTURE)...")
    console.log("🔗 Spreadsheet ID:", GOOGLE_SHEETS_CONFIG.spreadsheetId)
    console.log("🎯 Selected treatment:", selectedTreatment || "All treatments")

    // ============================================
    // STEP 1: Load TXS mapping (equipment → treatments)
    // ============================================
    const equipmentTreatmentMap = await loadEquipmentToTreatmentMapping()
    
    if (Object.keys(equipmentTreatmentMap).length === 0) {
      console.error("❌ No equipment-treatment mapping loaded from TXS sheet!")
      console.warn("⚠️ Clinics will have no treatments assigned")
    }

    // ============================================
    // STEP 2: Read single "Clinicas" sheet
    // ============================================
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/Clinicas!A2:K?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
    
    console.log(`📋 Fetching all clinics from single "Clinicas" sheet...`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Error fetching Clinicas sheet: ${response.status} - ${response.statusText}`)
      console.error(`📄 Error details:`, errorText)
      return []
    }

    const data = await response.json()
    
    if (!data.values || data.values.length === 0) {
      console.warn(`📭 No data found in Clinicas sheet`)
      return []
    }

    console.log(`✅ Found ${data.values.length} clinics in sheet`)

    // ============================================
    // STEP 3: Transform clinics with dynamic treatment mapping
    // ============================================
    const allClinics: Clinic[] = data.values.map((row: any[], index: number) => {
      const clinic = transformSheetDataToClinic(row, index + 1, equipmentTreatmentMap)
      
      // Calculate distance if user location is provided
      if (userLat && userLng && clinic.lat && clinic.lng) {
        const distance = calculateDistance(userLat, userLng, clinic.lat, clinic.lng)
        clinic.distance = `${distance} km`
      }

      return clinic
    })

    // Filter valid clinics (must have name and address)
    const validClinics = allClinics.filter(clinic => clinic.name && clinic.address)
    console.log(`✅ ${validClinics.length} valid clinics loaded`)

    // ============================================
    // STEP 4: Geocode missing coordinates
    // ============================================
    console.log(`🗺️ Starting geocoding process...`)
    const clinicsWithCoordinates = await processClinicCoordinates(validClinics)
    
    // ============================================
    // STEP 5: Deduplicate by name + address
    // ============================================
    const groupedClinics = groupClinicsByName(clinicsWithCoordinates)
    console.log(`✅ Clinics after grouping: ${groupedClinics.length} (removed ${clinicsWithCoordinates.length - groupedClinics.length} duplicates)`)
    
    // ============================================
    // STEP 6: Filter by treatment if specified
    // ============================================
    let filteredClinics = groupedClinics
    if (selectedTreatment && selectedTreatment !== "Todos los tratamientos") {
      filteredClinics = groupedClinics.filter((clinic) => {
        const clinicTreatments = clinic.treatment.split(", ")
        return clinicTreatments.some(treatment => treatment.trim() === selectedTreatment)
      })
      console.log(`🔍 Filtered to ${filteredClinics.length} clinics for treatment: ${selectedTreatment}`)
    }
    
    // ============================================
    // STEP 7: Calculate distances (if user location available)
    // ============================================
    if (userLat && userLng) {
      console.log(`📍 Calculating distances from user location: ${userLat}, ${userLng}`)
      filteredClinics.forEach(clinic => {
        if (clinic.lat && clinic.lng) {
          const distance = calculateDistance(userLat, userLng, clinic.lat, clinic.lng)
          clinic.distance = `${distance} km`
        }
      })
    }
    
    // Reassign sequential IDs
    filteredClinics.forEach((clinic, index) => {
      clinic.id = index + 1
    })
    
    // Cache the results
    const cacheKey = getCacheKey(selectedTreatment, userLat, userLng)
    setCachedData(cacheKey, filteredClinics)
    
    console.log(`🎉 Successfully loaded ${filteredClinics.length} clinics with NEW ARCHITECTURE`)
    
    return filteredClinics
    
  } catch (error) {
    console.error("💥 Error fetching data from Google Sheets:", error)
    console.error("❌ Unable to load clinic data. Please check your configuration.")
    return []
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
