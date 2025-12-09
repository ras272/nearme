"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Loader2,
  AlertCircle,
  MessageCircle,
  Eye,
  Navigation,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/toaster";
import GoogleMap from "@/components/google-map";
import QuickContactButtons from "@/components/quick-contact-buttons";
import ContactDialog from "@/components/contact-dialog";
import ClinicDetailModal from "@/components/clinic-detail-modal";
import MobileViewToggle from "@/components/mobile-view-toggle";
import FullScreenLoader from "@/components/full-screen-loader";
import {
  fetchClinicsFromSheets,
  getUserLocation,
  getUniqueEquipment,
  getUniqueCities,
  getUniqueTreatments,
  getUniqueClinicNames,
  formatTreatmentForDisplay,
  formatTreatmentForAPI,
  AVAILABLE_TREATMENTS,
  type Clinic,
} from "@/lib/google-sheets";

export default function ClinicFinder() {
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedTreatment, setSelectedTreatment] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Estado para la carga inicial
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "pending" | "granted" | "denied" | "unavailable"
  >("pending");
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [treatmentOptions, setTreatmentOptions] =
    useState<string[]>(AVAILABLE_TREATMENTS);
  const [selectedClinicName, setSelectedClinicName] = useState<string>(""); // Nuevo estado para clínica seleccionada
  const [clinicNameOptions, setClinicNameOptions] = useState<string[]>([]); // Nuevo estado para opciones de clínicas
  const [isDeveloperMode, setIsDeveloperMode] = useState(false); // Estado para modo desarrollador

  // Load clinic data on component mount
  useEffect(() => {
    // Check for developer mode
    const urlParams = new URLSearchParams(window.location.search);
    const refreshParam = urlParams.get("refresh");
    setIsDeveloperMode(refreshParam === "true");

    // Start the complete loading flow
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Load clinics first (fast)
      console.log("🚀 Step 1: Loading clinics data...");
      const initialClinics = await fetchClinicsFromSheets();
      setAllClinics(initialClinics);
      setFilteredClinics(initialClinics);
      setEquipmentOptions(getUniqueEquipment(initialClinics));
      setCityOptions(getUniqueCities(initialClinics));
      setClinicNameOptions(getUniqueClinicNames(initialClinics));
      setTreatmentOptions(getUniqueTreatments(initialClinics));

      // Step 2: Request user location (show after clinics load)
      console.log("🚀 Step 2: Requesting user location...");
      await requestUserLocationWithPrompt();
    } catch (err) {
      setError(
        "Error al cargar las clínicas desde Google Sheets. Verifica tu configuración.",
      );
      console.error("Error initializing app:", err);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const requestUserLocationWithPrompt = async () => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocationPermission("unavailable");
      return;
    }

    // Show location prompt to user
    setShowLocationPrompt(true);

    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setLocationPermission("granted");
      setShowLocationPrompt(false);

      console.log("📍 Location granted, reloading clinics with distances...");

      // Reload clinics with distance calculation
      const clinicsWithDistances = await fetchClinicsFromSheets(
        location.lat,
        location.lng,
      );
      setAllClinics(clinicsWithDistances);
      setFilteredClinics(clinicsWithDistances);
    } catch (err) {
      console.log("User location not available:", err);
      setLocationPermission("denied");
      setShowLocationPrompt(false);
      // Continue without location - distances will show as "0 km"
    }
  };

  const loadClinicsForTreatment = async (treatment: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const clinics = await fetchClinicsFromSheets(
        userLocation?.lat,
        userLocation?.lng,
        treatment,
      );
      console.log(
        `📊 Frontend received ${clinics.length} clinics for treatment: ${treatment}`,
      );

      setAllClinics(clinics);
      setFilteredClinics(clinics);

      // Update filter options based on loaded data
      setEquipmentOptions(getUniqueEquipment(clinics));
      setCityOptions(getUniqueCities(clinics));
      setClinicNameOptions(getUniqueClinicNames(clinics));
    } catch (err) {
      setError(
        "Error al cargar las clínicas desde Google Sheets. Verifica tu configuración.",
      );
      console.error("Error loading clinics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload clinics when treatment filter changes
  useEffect(() => {
    if (selectedTreatment) {
      loadClinicsForTreatment(selectedTreatment);
    }
  }, [selectedTreatment]);

  const [showMapModal, setShowMapModal] = useState(false);

  const handleSearch = useCallback(() => {
    let filtered = allClinics;

    if (selectedTreatment && selectedTreatment !== "Todos los tratamientos") {
      filtered = filtered.filter((clinic) => {
        // Check if the selected treatment is in the clinic's treatment list
        const treatments = clinic.treatment.split(", ");
        return treatments.some(
          (treatment) => treatment.trim() === selectedTreatment,
        );
      });
    }

    if (selectedEquipment && selectedEquipment !== "Todos los equipos") {
      filtered = filtered.filter((clinic) =>
        clinic.equipment.includes(selectedEquipment),
      );
    }

    if (selectedCity && selectedCity !== "Todas las ciudades") {
      filtered = filtered.filter((clinic) => clinic.city === selectedCity);
    }

    if (selectedClinicName && selectedClinicName !== "todas") {
      filtered = filtered.filter(
        (clinic) => clinic.name === selectedClinicName,
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          clinic.address.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Sort by distance if user location is available
    if (userLocation) {
      filtered.sort((a, b) => {
        const distanceA = Number.parseFloat(a.distance.replace(" km", ""));
        const distanceB = Number.parseFloat(b.distance.replace(" km", ""));
        return distanceA - distanceB;
      });
    }

    setFilteredClinics(filtered);
  }, [
    allClinics,
    selectedTreatment,
    selectedEquipment,
    selectedCity,
    selectedClinicName,
    searchTerm,
    userLocation,
  ]);

  // Auto-search when filters change
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    // Scroll to clinic in list
    const clinicElement = document.getElementById(`clinic-${clinic.id}`);
    if (clinicElement) {
      clinicElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const mapComponent = (
    <GoogleMap clinics={filteredClinics} onClinicSelect={handleClinicSelect} />
  );

  const listComponent = (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Clínicas Encontradas ({filteredClinics.length})
          {isLoading && (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin inline ml-2 text-gray-400" />
          )}
        </h2>

        <Button
          onClick={() => setShowMapModal(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <MapPin className="w-4 h-4" />
          Ver Mapa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <Card className="border-gray-200">
            <CardContent className="p-6 sm:p-8 text-center">
              <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400 animate-spin" />
              <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-900">
                Cargando clínicas...
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {allClinics.length === 0
                  ? "Cargando datos desde Google Sheets en paralelo ⚡"
                  : "Procesando y organizando información..."}
              </p>
            </CardContent>
          </Card>
        ) : filteredClinics.length > 0 ? (
          // Tarjetas tipo App Store - Modernas con esquinas redondeadas
          filteredClinics.map((clinic, index) => (
            <div
              key={clinic.id}
              id={`clinic-${clinic.id}`}
              className={`group bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200/60 transition-all duration-300 cursor-pointer ${selectedClinic?.id === clinic.id
                  ? "ring-2 ring-blue-500 ring-offset-2 bg-gradient-to-br from-blue-50/50 to-blue-100/30"
                  : ""
                }`}
              onClick={() => setSelectedClinic(clinic)}
            >
              {/* Header con info principal */}
              <div className="mb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">
                    {clinic.name}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-blue-100 text-blue-800 border-0 text-xs font-medium">
                      {clinic.distance}
                    </Badge>
                    <ClinicDetailModal clinic={clinic}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:bg-gray-100 text-gray-600 hover:text-gray-900 p-1.5 h-auto"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </ClinicDetailModal>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{clinic.city}</p>
              </div>

              {/* Grid de métricas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {clinic.equipment.length}
                  </div>
                  <div className="text-xs text-gray-600">Equipos</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {clinic.treatment.split(", ").length}
                  </div>
                  <div className="text-xs text-gray-600">Tratamientos</div>
                </div>
              </div>

              {/* Tratamientos como chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {clinic.treatment
                  .split(", ")
                  .slice(0, 3)
                  .map((treatment, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs bg-gray-100 text-gray-700 border-0"
                    >
                      {treatment}
                    </Badge>
                  ))}
                {clinic.treatment.split(", ").length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                  >
                    +{clinic.treatment.split(", ").length - 3}
                  </Badge>
                )}
              </div>

              {/* Equipos disponibles */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Equipos disponibles:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {clinic.equipment.slice(0, 4).map((equipment, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      {equipment}
                    </Badge>
                  ))}
                  {clinic.equipment.length > 4 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                    >
                      +{clinic.equipment.length - 4} más
                    </Badge>
                  )}
                </div>
              </div>

              {/* Info adicional */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{clinic.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span className="truncate">{clinic.hours}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-0 rounded-xl shadow-sm hover:shadow-md transition-all text-xs px-3 py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    const treatments = clinic.treatment.split(", ").join(" y ");
                    const message = encodeURIComponent(
                      `Hola! Encontré su clínica en la página de Ares Paraguay y me interesa obtener más información sobre los tratamientos de ${treatments}.`,
                    );
                    window.open(
                      `https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, "")}?text=${message}`,
                      "_blank",
                    );
                  }}
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-gray-200 hover:bg-gray-50 text-xs px-3 py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${clinic.phone}`, "_self");
                  }}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Llamar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-gray-200 hover:bg-gray-50 text-xs px-3 py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Use direct Maps URL if available, otherwise fallback to address search
                    if (clinic.mapsUrl && clinic.mapsUrl.trim() !== "") {
                      window.open(clinic.mapsUrl, "_blank");
                    } else {
                      const address = encodeURIComponent(clinic.address);
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${address}`,
                        "_blank",
                      );
                    }
                  }}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Ubicación
                </Button>
              </div>
            </div>
          ))
        ) : allClinics.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-gray-200">
              <CardContent className="p-6 sm:p-8 text-center">
                <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-900">
                  No hay clínicas configuradas
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Verifica la configuración de Google Sheets o agrega datos al
                  spreadsheet
                </p>
                <Button
                  onClick={initializeApp}
                  variant="outline"
                  className="text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Intentar nuevamente
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="col-span-full">
            <Card className="border-gray-200">
              <CardContent className="p-6 sm:p-8 text-center">
                <Search className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-900">
                  No se encontraron clínicas
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Full Screen Loader para carga inicial */}
      {isInitialLoad && <FullScreenLoader />}

      {/* Location Permission Prompt */}
      {showLocationPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Navigation className="w-8 h-8 text-blue-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📍 Encuentra clínicas cerca de ti
              </h3>

              <p className="text-gray-600 mb-6">
                Para mostrarte las clínicas más cercanas y calcular distancias,
                necesitamos acceso a tu ubicación.
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowLocationPrompt(false);
                    setLocationPermission("denied");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  No permitir
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const location = await getUserLocation();
                      setUserLocation(location);
                      setLocationPermission("granted");
                      setShowLocationPrompt(false);

                      console.log(
                        "📍 Location granted, reloading clinics with distances...",
                      );
                      // Reload clinics with distances
                      const clinicsWithDistances = await fetchClinicsFromSheets(
                        location.lat,
                        location.lng,
                      );
                      setAllClinics(clinicsWithDistances);
                      setFilteredClinics(clinicsWithDistances);
                    } catch (err) {
                      setLocationPermission("denied");
                      setShowLocationPrompt(false);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Permitir ubicación
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Tu ubicación solo se usa para mostrar distancias. No se
                almacena.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 py-4 px-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/images/isologo-ares.png"
                  alt="Ares Paraguay"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                    Tu clínica más cercana
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                    Encontrá la clínica ideal para tus tratamientos con
                    tecnología respaldada por Ares Paraguay
                  </p>
                </div>
                {isDeveloperMode && (
                  <div className="ml-2">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                      🛠️ Dev Mode
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                {/* Location Status Indicator */}
                {locationPermission === "granted" && userLocation && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Navigation className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">
                      Ubicación activa
                    </span>
                  </div>
                )}
                {locationPermission === "denied" && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">
                      Sin ubicación
                    </span>
                  </div>
                )}

                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Clínicas disponibles</span>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 border-gray-200"
                >
                  {filteredClinics.length}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="py-4 px-4">
            <div className="max-w-7xl mx-auto">
              <Alert className="border-gray-300 bg-gray-50">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-sm text-gray-800">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        <section className="py-6 sm:py-8 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-gray-900">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  Buscar Clínicas
                  {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tipo de Tratamiento
                    </label>
                    <Select
                      value={selectedTreatment}
                      onValueChange={setSelectedTreatment}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10 border-gray-200 focus:ring-gray-400">
                        <SelectValue placeholder="Seleccionar tratamiento" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentOptions.map((treatment) => (
                          <SelectItem key={treatment} value={treatment}>
                            {formatTreatmentForDisplay(treatment)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Modelo de Equipo
                    </label>
                    <Select
                      value={selectedEquipment}
                      onValueChange={setSelectedEquipment}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10 border-gray-200 focus:ring-gray-400">
                        <SelectValue placeholder="Seleccionar equipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos los equipos">
                          Todos los equipos
                        </SelectItem>
                        {equipmentOptions.map((equipment) => (
                          <SelectItem key={equipment} value={equipment}>
                            {equipment}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Ciudad
                    </label>
                    <Select
                      value={selectedCity}
                      onValueChange={setSelectedCity}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10 border-gray-200 focus:ring-gray-400">
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptions.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Clínica
                    </label>
                    <Select
                      value={selectedClinicName}
                      onValueChange={setSelectedClinicName}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10 border-gray-200 focus:ring-gray-400">
                        <SelectValue placeholder="Seleccionar clínica" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">
                          Todas las clínicas
                        </SelectItem>
                        {clinicNameOptions.map((clinicName) => (
                          <SelectItem key={clinicName} value={clinicName}>
                            {clinicName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSearch}
                  className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={isLoading}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Clínicas
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-6 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Solo en móvil mostrar el toggle */}
            <div className="lg:hidden">
              <MobileViewToggle
                mapView={mapComponent}
                listView={listComponent}
                clinicsCount={filteredClinics.length}
              />
            </div>

            {/* En desktop solo mostrar la lista */}
            <div className="hidden lg:block">{listComponent}</div>
          </div>
        </section>

        {/* Modal del Mapa */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Mapa de Clínicas</h3>
                <Button
                  onClick={() => setShowMapModal(false)}
                  variant="outline"
                  size="sm"
                >
                  Cerrar
                </Button>
              </div>
              <div className="flex-1 min-h-0">{mapComponent}</div>
            </div>
          </div>
        )}

        <footer className="bg-gray-50 py-6 sm:py-8 px-4 mt-8 sm:mt-12 border-t border-gray-200">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Ares Paraguay
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Equipos médicos de última generación
              </p>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              <p>© 2025 Ares Paraguay. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>

        <Toaster />
      </div>
    </>
  );
}
