# Estructura de Google Sheet para NEARME - Arquitectura Simplificada (2 Hojas)

## 🎯 Nueva Arquitectura

El sistema ahora usa **solo 2 hojas** en lugar de 24+ hojas por tratamiento:

### Nombre del archivo: `Clinicas Ares Paraguay`

---

## 📋 Hoja 1: "Clinicas" - Todas las clínicas

**Rango de datos**: `A2:K` (Columnas A hasta K, desde fila 2)

### Estructura de columnas (Fila 1 - Headers):

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| nombre_clinica | direccion | telefono | whatsapp | email | horarios | equipos | latitud | longitud | ciudad | maps_url |

### Descripción de columnas:

- **A (nombre_clinica)**: Nombre de la clínica
- **B (direccion)**: Dirección completa
- **C (telefono)**: Teléfono con código de país (+595)
- **D (whatsapp)**: WhatsApp con código de país (+595)
- **E (email)**: Correo electrónico
- **F (horarios)**: Horarios de atención (ej: Lun-Vie: 8:00-18:00)
- **G (equipos)**: Lista de equipos separados por comas (ej: CMSlim, Endymed, Hydrafacial)
- **H (latitud)**: Coordenada decimal (ej: -25.2637)
- **I (longitud)**: Coordenada decimal (ej: -57.5759)
- **J (ciudad)**: Ciudad donde está ubicada
- **K (maps_url)**: ✨ **NUEVO** - Link directo de Google Maps (ej: https://maps.app.goo.gl/xxxxx)

### Ejemplo de datos (Fila 2 en adelante):

| nombre_clinica | direccion | telefono | whatsapp | email | horarios | equipos | latitud | longitud | ciudad | maps_url |
|----------------|-----------|----------|----------|--------|----------|---------|---------|----------|---------|----------|
| Benestar | Julio Correa 1591, Asunción | +595 21 123456 | +595 981 123456 | info@benestar.com | Lun-Vie: 8:00-18:00 | CMSlim, Endymed, Hydrafacial | -25.27 | -57.57 | Asuncion | https://maps.app.goo.gl/xxxxx |
| Centro Wellness | Av. España 1234, San Lorenzo | +595 21 654321 | +595 982 654321 | contacto@wellness.py | Lun-Sab: 7:00-19:00 | CMSlim, Hydrafacial | -25.34 | -57.51 | San Lorenzo | https://maps.app.goo.gl/yyyyy |

---

## 🔗 Hoja 2: "TXS" - Mapeo de Equipos a Tratamientos

**Rango de datos**: `A2:B` (Columnas A y B, desde fila 2)

### Estructura de columnas (Fila 1 - Headers):

| A (EQUIPO) | B (TRATAMIENTOS) |
|------------|------------------|
| Nombre del equipo | Lista de tratamientos separados por comas |

### Ejemplo de datos:

| EQUIPO | TRATAMIENTOS |
|--------|--------------|
| CMSlim | Tonificacion Muscular, Tratamientos Faciales, Reduccion, Celulitis |
| Hydrafacial | Limpieza Facial, Tratamientos Faciales |
| Endymed | Tensado Facial, Tratamientos Faciales, Lineas de Expresion |
| Morpheus8 | Tensado Facial, Rejuvenecimiento, Cicatrices |

---

## ✨ Ventajas de la nueva arquitectura:

1. ✅ **Mantenimiento simplificado**: Solo 2 hojas vs 24+ hojas
2. ✅ **Sin duplicación**: Cada clínica aparece una sola vez
3. ✅ **Mapeo automático**: Los tratamientos se asignan dinámicamente según los equipos
4. ✅ **Escalabilidad**: Agregar nuevos equipos/tratamientos solo requiere actualizar la hoja TXS
5. ✅ **Links directos de Maps**: Muestra el nombre de la clínica en Google Maps, no solo coordenadas

## 📝 Notas importantes:

### Hoja "Clinicas":
1. **equipos** (columna G): Separar múltiples equipos con comas (ej: CMSlim, Endymed)
2. **latitud/longitud** (columnas H, I): Usar formato decimal (ej: -25.2637, -57.5759)
3. **whatsapp** (columna D): Incluir código de país (+595 981 123456)
4. **maps_url** (columna K): ✨ **NUEVO** - Link directo de Google Maps
5. **Nombres de hojas**: Deben ser exactamente **"Clinicas"** y **"TXS"**
6. **Los headers deben estar en la fila 1**
7. **Los datos deben empezar en la fila 2**
8. **Cada clínica aparece UNA SOLA VEZ** con todos sus equipos listados

### Hoja "TXS":
1. Columna A: Nombre exacto del equipo (debe coincidir con lo listado en "Clinicas")
2. Columna B: Tratamientos separados por comas

---

## 🗺️ Cómo obtener el link de Google Maps (maps_url):

**Opción 1: Link directo de negocio** (Recomendado)
1. Ve a [Google Maps](https://maps.google.com)
2. Busca el nombre de la clínica
3. Haz clic en **"Compartir"**
4. Copia el enlace corto (formato: `https://maps.app.goo.gl/xxxxx`)
5. Pégalo en la columna K

**Opción 2: Coordenadas** (Fallback)
1. Busca la dirección en Google Maps
2. Haz clic derecho en el marcador
3. Selecciona las coordenadas
4. El primer número es **latitud** (columna H)
5. El segundo número es **longitud** (columna I)

**💡 Ventaja del link directo:**
- Muestra el nombre de la clínica en Maps
- Incluye fotos, reviews y horarios
- Mejor experiencia de usuario
- Navegación más precisa

## Permisos del Sheet:

- Debe ser **público** o **compartido con "cualquier persona con el enlace puede ver"**
- No necesita permisos de edición, solo lectura