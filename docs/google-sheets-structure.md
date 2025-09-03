# Estructura de Google Sheet para NEARME - Organizada por Tratamientos

## Configuración del Sheet

### Nombre del archivo: `Clinicas Ares Paraguay`

### Estructura de hojas por tratamiento:

El spreadsheet debe tener una hoja separada para cada tipo de tratamiento:

1. **Reduccion** - Equipos para reducción corporal
2. **Tensando_Body** - Equipos para tensado corporal
3. **Modelado** - Equipos para modelado corporal
4. **Depilacion_Body** - Equipos para depilación corporal
5. **Musculatura** - Equipos para musculación y fitness
6. **Drenaje_Body** - Equipos para drenaje corporal
7. **TX_Piel** - Equipos para tratamiento de piel
8. **Vasculares_Body** - Equipos para tratamientos vasculares corporales
9. **Tatuajes** - Equipos para remoción de tatuajes
10. **Gineco** - Equipos ginecológicos
11. **Tensando_Facial** - Equipos para tensado facial
12. **Fotoenv** - Equipos de fotoenvejecimiento
13. **Pigmentarias** - Equipos para tratamiento de pigmentaciones
14. **Limpieza_Facial** - Equipos para limpieza facial
15. **Lineas_exp** - Equipos para líneas de expresión
16. **Ojos** - Equipos para tratamiento del contorno de ojos
17. **Vasculares_Facial** - Equipos para tratamientos vasculares faciales
18. **Cic_Acne** - Equipos para cicatrices de acné
19. **Acne** - Equipos para tratamiento del acné
20. **Drenaje_Facial** - Equipos para drenaje facial
21. **Drug_Delivery** - Equipos de liberación de medicamentos
22. **Depilacion_Facial** - Equipos para depilación facial
23. **Celulitis** - Equipos para tratamiento de celulitis

### Estructura de columnas para CADA hoja (Fila 1 - Headers):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| nombre_clinica | direccion | telefono | whatsapp | email | horarios | equipos | latitud | longitud | ciudad |

### Ejemplo de datos por hoja:

#### Hoja "Reduccion" (Fila 2 en adelante):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Centro Médico Fitness | Av. España 1234, Asunción | +595 21 123456 | +595 981 123456 | info@fitness.com.py | Lun-Vie: 8:00-18:00 | CMSlim,Equipo A | -25.2637 | -57.5759 | Asunción |
| Clínica Wellness | Ruta 2 Km 15, Ciudad del Este | +595 61 456789 | +595 982 456789 | contacto@wellness.com.py | Lun-Sab: 7:00-19:00 | CMSlim,Equipo B | -25.5095 | -54.6112 | Ciudad del Este |

#### Hoja "Depilacion_Body" (Fila 2 en adelante):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Centro Médico Wellness | Ruta 2 Km 15, Ciudad del Este | +595 61 456789 | +595 982 456789 | contacto@wellness.com.py | Lun-Sab: 7:00-19:00 | CMSlim,Láser C | -25.5095 | -54.6112 | Ciudad del Este |
| Estética Bella | Av. Mariscal López 567, Encarnación | +595 71 789012 | +595 983 789012 | info@bella.com.py | Lun-Vie: 8:30-17:30 | Láser D | -27.3378 | -55.8683 | Encarnación |

## Ventajas de esta estructura:

1. **Misma clínica en múltiples hojas**: Una clinica puede ofrecer varias hojas_*^que son simila829
2. **Equipos específicos por tratamiento**: Cada hoja muestra solo los equipos relevantes para ese tratamiento
3. **Búsqueda eficiente**: Los usuarios pueden filtrar directamente por tipo de tratamiento
4. **Organización clara**: Fácil mantenimiento y actualización de datos

## Notas importantes:

1. **equipos**: Separar múltiples equipos con comas (,)
2. **latitud/longitud**: Usar formato decimal (ej: -25.2637)
3. **whatsapp**: Incluir código de país (+595)
4. **Nombres de hojas**: Deben coincidir exactamente con los configurados en el código
5. **Los headers deben estar en la fila 1 de cada hoja**
6. **Los datos deben empezar en la fila 2 de cada hoja**
7. **Una clínica puede repetirse en varias hojas con diferentes equipos**

## Cómo obtener coordenadas:

1. Ve a [Google Maps](https://maps.google.com)
2. Busca la dirección de la clínica
3. Haz clic derecho en el marcador
4. Selecciona las coordenadas que aparecen
5. El primer número es latitud, el segundo es longitud

## Permisos del Sheet:

- Debe ser **público** o **compartido con "cualquier persona con el enlace puede ver"**
- No necesita permisos de edición, solo lectura