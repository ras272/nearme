// Script to generate static JSON from Google Sheets
// Run with: npm run update-data

import * as fs from 'fs'
import * as path from 'path'

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
}

// Configuration
const GOOGLE_SHEETS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || "",
  spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "",
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

// Geocoding cache
interface GeocodingCache {
  [address: string]: { lat: number; lng: number }
}

let geocodingCache: GeocodingCache = {}

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

// Transform raw data to Clinic
function transformSheetDataToClinic(data: any[], index: number, treatment: string): Clinic {
  const [nombre_clinica, direccion, telefono, whatsapp, email, horarios, equipos, latitud, longitud, ciudad] = data

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
    equipment: equipos ? equipos.split(",").map((eq: string) => eq.trim()) : [],
    city: ciudad || "",
    distance: "0 km",
    lat,
    lng,
    treatment: treatment
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

// Main function
async function generateClinicsJSON() {
  console.log('\n🚀 Starting clinic data generation from Google Sheets...\n')
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
    console.log(`📊 Spreadsheet ID: ${GOOGLE_SHEETS_CONFIG.spreadsheetId}`)
    console.log(`📋 Total sheets to fetch: ${Object.keys(GOOGLE_SHEETS_CONFIG.treatmentSheets).length}\n`)

    let clinicIdCounter = 1
    const allClinics: Clinic[] = []

    // Fetch data from all sheets
    for (const [treatmentName, sheetRange] of Object.entries(GOOGLE_SHEETS_CONFIG.treatmentSheets)) {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.spreadsheetId}/values/${sheetRange}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        
        console.log(`📥 Fetching ${treatmentName}...`)
        
        const response = await fetch(url)
        
        if (!response.ok) {
          console.error(`❌ Error fetching ${treatmentName}: ${response.status}`)
          continue
        }

        const data = await response.json()
        
        if (!data.values || data.values.length === 0) {
          console.warn(`📭 No data in ${treatmentName}`)
          continue
        }

        console.log(`✅ Found ${data.values.length} rows in ${treatmentName}`)

        const treatmentClinics = data.values.map((row: any[]) => 
          transformSheetDataToClinic(row, clinicIdCounter++, treatmentName)
        )

        const validClinics = treatmentClinics.filter((clinic: Clinic) => clinic.name && clinic.address)
        allClinics.push(...validClinics)
        
        console.log(`✅ Added ${validClinics.length} valid clinics from ${treatmentName}\n`)
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`💥 Error processing ${treatmentName}:`, error)
      }
    }

    console.log('=' .repeat(60))
    console.log(`\n📊 Total clinics fetched: ${allClinics.length}`)

    // Process coordinates
    const clinicsWithCoordinates = await processClinicCoordinates(allClinics)
    
    // Group and deduplicate
    const groupedClinics = groupClinicsByName(clinicsWithCoordinates)
    
    // Reassign IDs
    groupedClinics.forEach((clinic, index) => {
      clinic.id = index + 1
    })

    // Prepare output
    const output = {
      generated_at: new Date().toISOString(),
      total_clinics: groupedClinics.length,
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
    console.log(`📅 Generated at: ${output.generated_at}`)
    console.log(`💾 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`)
    console.log('🎉 Done! Your app will now load instantly from this static file.')
    console.log('💡 Run this script again whenever you update Google Sheets.\n')
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
generateClinicsJSON()
