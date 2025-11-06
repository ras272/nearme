// Script to generate static JSON from Google Sheets
// Run with: npm run update-data

import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      process.env[key] = value
    }
  })
  console.log('✅ Loaded environment variables from .env.local\n')
} else {
  console.warn('⚠️ .env.local file not found\n')
}

// Same interfaces as in lib/google-sheets.ts
interface Clinic {
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
  treatment: string
  mapsUrl?: string
}

// ============================================
// NEW ARCHITECTURE: Simplified 2-sheet structure
// ============================================
// Configuration
const GOOGLE_SHEETS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || "",
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "",
  // Only 2 sheets: Clinicas (all clinics) + TXS (equipment → treatments mapping)
  sheets: {
    "Clinicas": "Clinicas!A2:K",  // K = maps_url
    "TXS": "TXS!A2:B"
  }
}

// Equipment to Treatments mapping interface
interface EquipmentTreatmentMap {
  [equipment: string]: string[]  // e.g., "CMSlim" → ["Reduccion", "Modelado", "Celulitis"]
}

// Geocoding cache
interface GeocodingCache {
  [address: string]: { lat: number; lng: number }
}

let geocodingCache: GeocodingCache = {}

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
    
    console.log(`✅ Loaded mapping for ${Object.keys(mapping).length} equipment types\n`)
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

// Geocode an address using Google Maps API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const normalizedAddress = address.toLowerCase().trim()
  
  // Check cache
  if (geocodingCache[normalizedAddress]) {
    console.log(`🎯 Using cached coordinates for: ${address}`)
    return geocodingCache[normalizedAddress]
  }
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('⚠️ Google Maps API key not configured')
    return null
  }
  
  try {
    const encodedAddress = encodeURIComponent(`${address}, Paraguay`)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&region=py&language=es`
    
    console.log(`🗺️ Geocoding: ${address}`)
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      const coordinates = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      }
      
      geocodingCache[normalizedAddress] = coordinates
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

// Transform raw data to Clinic (NEW VERSION - with equipment mapping)
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

  let lat = 0
  let lng = 0
  
  if (latitud && longitud) {
    lat = parseFloat(latitud)
    lng = parseFloat(longitud)
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
    distance: "0 km",
    lat,
    lng,
    treatment: treatments.join(", "), // Treatments mapped dynamically from equipment
    mapsUrl: maps_url || "" // Direct Google Maps link
  }
}

// Process clinics with geocoding
async function processClinicCoordinates(clinics: Clinic[]): Promise<Clinic[]> {
  console.log(`\n🗺️ Processing coordinates for ${clinics.length} clinics...`)
  
  const clinicsNeedingGeocode = clinics.filter(clinic => 
    clinic.address && (!clinic.lat || !clinic.lng || (clinic.lat === 0 && clinic.lng === 0))
  )
  
  if (clinicsNeedingGeocode.length === 0) {
    console.log(`✅ All clinics already have coordinates!\n`)
    return clinics
  }
  
  console.log(`🔍 Found ${clinicsNeedingGeocode.length} clinics needing geocoding`)
  
  const addressesToGeocode = [...new Set(clinicsNeedingGeocode.map(clinic => clinic.address))]
  
  console.log(`🚀 Starting batch geocoding for ${addressesToGeocode.length} unique addresses...\n`)
  
  for (let i = 0; i < addressesToGeocode.length; i++) {
    const address = addressesToGeocode[i]
    const coordinates = await geocodeAddress(address)
    
    if (coordinates) {
      // Update all clinics with this address
      clinics.forEach(clinic => {
        if (clinic.address === address && (!clinic.lat || !clinic.lng || (clinic.lat === 0 && clinic.lng === 0))) {
          clinic.lat = coordinates.lat
          clinic.lng = coordinates.lng
        }
      })
    }
    
    // Rate limiting: wait between requests
    if (i < addressesToGeocode.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  const successfulGeocodes = clinics.filter(clinic => clinic.lat && clinic.lng && !(clinic.lat === 0 && clinic.lng === 0)).length
  console.log(`\n✅ Geocoding complete! ${successfulGeocodes}/${clinics.length} clinics have coordinates\n`)
  
  return clinics
}

// Group clinics by name and combine treatments
function groupClinicsByName(clinics: Clinic[]): Clinic[] {
  console.log(`🔍 Starting deduplication with ${clinics.length} clinics`)
  
  const groupedMap = new Map<string, Clinic>()
  
  clinics.forEach((clinic) => {
    const normalizedName = clinic.name.toLowerCase().trim().replace(/\s+/g, ' ')
    const normalizedAddress = clinic.address.toLowerCase().trim().replace(/\s+/g, ' ')
    const key = `${normalizedName}|||${normalizedAddress}`
    
    if (groupedMap.has(key)) {
      const existing = groupedMap.get(key)!
      
      // Combine treatments
      const existingTreatments = existing.treatment.split(", ").map(t => t.trim()).filter(t => t.length > 0)
      const newTreatments = clinic.treatment ? clinic.treatment.split(", ").map(t => t.trim()).filter(t => t.length > 0) : []
      const allTreatments = [...existingTreatments, ...newTreatments]
      const uniqueTreatments = [...new Set(allTreatments)]
      existing.treatment = uniqueTreatments.join(", ")
      
      // Combine equipment
      const equipmentSet = new Set([...existing.equipment, ...clinic.equipment])
      existing.equipment = Array.from(equipmentSet).filter(eq => eq && eq.trim().length > 0)
      
    } else {
      groupedMap.set(key, { ...clinic })
    }
  })
  
  const result = Array.from(groupedMap.values())
  console.log(`✅ Deduplication complete: ${clinics.length} → ${result.length} (removed ${clinics.length - result.length} duplicates)\n`)
  
  return result
}

// Main function - NEW ARCHITECTURE
async function generateClinicsJSON() {
  console.log('\n🚀 Starting clinic data generation (NEW ARCHITECTURE)...\n')
  console.log('=' .repeat(60))
  
  try {
    // Check environment variables
    if (!GOOGLE_SHEETS_CONFIG.apiKey || !GOOGLE_SHEETS_CONFIG.spreadsheetId) {
      console.error('❌ Missing environment variables!')
      console.error('Please set:')
      console.error('  - NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY')
      console.error('  - NEXT_PUBLIC_GOOGLE_SHEETS_ID')
      process.exit(1)
    }

    console.log('✅ Environment variables configured')
    console.log(`📊 Spreadsheet ID: ${GOOGLE_SHEETS_CONFIG.spreadsheetId}\n`)

    // ============================================
    // STEP 1: Load TXS mapping (equipment → treatments)
    // ============================================
    console.log('📋 Loading equipment-treatment mapping from TXS...')
    const equipmentTreatmentMap = await loadEquipmentToTreatmentMapping()
    
    if (Object.keys(equipmentTreatmentMap).length === 0) {
      console.error('❌ No equipment-treatment mapping loaded from TXS sheet!')
      console.error('⚠️ Clinics will have no treatments assigned')
    } else {
      console.log(`✅ Mapping loaded: ${Object.keys(equipmentTreatmentMap).length} equipment types\n`)
    }

    // ============================================
    // STEP 2: Read single "Clinicas" sheet
    // ============================================
    console.log('📥 Fetching Clinicas sheet...')
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/Clinicas!A2:K?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`❌ Error fetching Clinicas: ${response.status}`)
      process.exit(1)
    }

    const data = await response.json()
    
    if (!data.values || data.values.length === 0) {
      console.error('📭 No data in Clinicas sheet')
      process.exit(1)
    }

    console.log(`✅ Found ${data.values.length} rows\n`)

    // ============================================
    // STEP 3: Transform clinics with dynamic treatment mapping
    // ============================================
    console.log('🔄 Transforming clinics with dynamic treatment mapping...')
    const allClinics: Clinic[] = data.values.map((row: any[], index: number) => {
      const clinic = transformSheetDataToClinic(row, index + 1, equipmentTreatmentMap)
      
      if (clinic.equipment.length > 0) {
        console.log(`   📍 ${clinic.name}: ${clinic.equipment.join(', ')} → [${clinic.treatment}]`)
      }
      
      return clinic
    })

    // Validate clinics
    const validClinics = allClinics.filter(clinic => clinic.name && clinic.address)
    console.log(`\n✅ Valid clinics: ${validClinics.length}`)
    
    if (validClinics.length === 0) {
      console.error('❌ No valid clinics found (must have name and address)')
      console.error('🔍 Debugging first 3 clinics:')
      allClinics.slice(0, 3).forEach((clinic, idx) => {
        console.error(`   Clinic ${idx + 1}:`)
        console.error(`      name: "${clinic.name}" (${clinic.name ? 'OK' : 'EMPTY'})`)
        console.error(`      address: "${clinic.address}" (${clinic.address ? 'OK' : 'EMPTY'})`)
      })
      process.exit(1)
    }

    console.log('=' .repeat(60))
    console.log(`\n📊 Total clinics before processing: ${validClinics.length}`)

    // ============================================
    // STEP 4: Geocode missing coordinates
    // ============================================
    const clinicsWithCoordinates = await processClinicCoordinates(validClinics)
    
    // ============================================
    // STEP 5: Deduplicate by name + address
    // ============================================
    const groupedClinics = groupClinicsByName(clinicsWithCoordinates)
    
    // Reassign IDs
    groupedClinics.forEach((clinic, index) => {
      clinic.id = index + 1
    })

    // ============================================
    // STEP 6: Generate JSON output
    // ============================================
    const output = {
      generated_at: new Date().toISOString(),
      total_clinics: groupedClinics.length,
      equipment_treatment_map: equipmentTreatmentMap, // Include mapping for reference
      clinics: groupedClinics
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'public', 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log(`📁 Created directory: ${dataDir}`)
    }

    // Write JSON file
    const outputPath = path.join(dataDir, 'clinics.json')
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
    
    console.log('=' .repeat(60))
    console.log(`\n✅ SUCCESS! JSON file generated at: ${outputPath}`)
    console.log(`📊 Total clinics: ${groupedClinics.length}`)
    console.log(`🔧 Equipment types mapped: ${Object.keys(equipmentTreatmentMap).length}`)
    console.log(`📅 Generated at: ${output.generated_at}`)
    console.log(`💾 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`)
    console.log('🎉 Done! Your app will now load instantly from this static file.')
    console.log('💡 Run this script again whenever you update Google Sheets.\n')
    console.log('📝 NEW ARCHITECTURE: Only 2 sheets required (Clinicas + TXS)\n')
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
generateClinicsJSON()
