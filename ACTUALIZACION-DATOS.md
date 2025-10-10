# 📊 Guía de Actualización de Datos

## ⚡ Nueva Arquitectura: JSON Estático + Mapeo TXS

La aplicación ahora usa una arquitectura simplificada:
- **Solo 2 hojas** de Google Sheets: `Clinicas` y `TXS`
- Los tratamientos se asignan **automáticamente** según los equipos de cada clínica
- Carga **instantánea** desde JSON estático (de 10-15 segundos a <500ms)

---

## 🚀 Cómo Actualizar los Datos

Cada vez que actualices Google Sheets, debes regenerar el archivo JSON:

### **Paso 1: Actualizar Google Sheets**
Edita tu Google Sheet normalmente con los datos de las clínicas.

### **Paso 2: Instalar dependencias (solo primera vez)**
```bash
npm install
```

### **Paso 3: Regenerar el JSON**
```bash
npm run update-data
```

Este comando:
- 📋 Lee la hoja `TXS` (mapeo equipos → tratamientos)
- 🏥 Lee la hoja `Clinicas` (todas las clínicas)
- ✨ Asigna tratamientos automáticamente según los equipos
- 🗺️ Geocodifica direcciones sin coordenadas
- 🔄 Deduplica clínicas repetidas
- 💾 Guarda todo en `/public/data/clinics.json`

### **Paso 4: Verificar**
- El archivo se genera en: `public/data/clinics.json`
- Verás un resumen en consola con el número de clínicas procesadas

### **Paso 5: Desplegar (si aplica)**
```bash
npm run build
# O sube los cambios a tu repo y Vercel se encarga automáticamente
```

---

## 📋 Estructura de Google Sheets (NUEVA)

### **Hoja "Clinicas"** (columnas A-J)
| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| nombre_clinica | direccion | telefono | whatsapp | email | horarios | **equipos** | latitud | longitud | ciudad |

**Importante:**
- La columna **G (equipos)** debe contener los equipos separados por comas
- Ejemplo: `CMSlim, Hydrafacial, Endymed`
- Los tratamientos se asignan automáticamente según TXS

### **Hoja "TXS"** (mapeo equipos → tratamientos)
| A (EQUIPO) | B (TRATAMIENTOS) |
|------------|------------------|
| CMSlim | Tonificacion Muscular, Tratamientos Faciales, Reduccion, Celulitis |
| Hydrafacial | Limpieza Facial, Tratamientos Faciales |
| Endymed | Tensado Facial, Tratamientos Faciales, Lineas de Expresion |

---

## 📋 Cuándo Actualizar

**Actualiza el JSON cuando:**
- ✅ Agregues nuevas clínicas a la hoja "Clinicas"
- ✅ Modifiques datos de clínicas existentes (dirección, teléfono, equipos, etc.)
- ✅ Cambies el mapeo en la hoja "TXS" (agregar/modificar equipos o tratamientos)
- ✅ Actualices coordenadas

**NO necesitas actualizar si:**
- ❌ Solo cambias estilos de la web
- ❌ Modificas componentes React
- ❌ Ajustas filtros o UI

---

## 🛠️ Modo Desarrollador (Dev Mode)

Si quieres testear cambios sin regenerar el JSON, agrega `?refresh=true` a la URL:

```
http://localhost:3000?refresh=true
```

Esto cargará los datos **directamente desde Google Sheets API** (lento pero datos en tiempo real).

---

## 📊 Ventajas del Sistema Actual

| Antes (Google Sheets API) | Ahora (JSON Estático) |
|---------------------------|----------------------|
| 10-15 segundos de carga | <500ms de carga ⚡ |
| 24 requests a Google | 1 request local |
| Límites de cuota | Sin límites |
| Depende de red | Funciona offline* |

*después de la primera carga

---

## ⚠️ Problemas Comunes

### "Error: Cannot find module 'tsx'"
```bash
npm install
```

### "Error loading static JSON"
Verifica que existe el archivo `public/data/clinics.json`. Si no, ejecuta:
```bash
npm run update-data
```

### "API Key not configured"
Asegúrate de tener el archivo `.env.local` con:
```env
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=tu_api_key
NEXT_PUBLIC_GOOGLE_SHEETS_ID=tu_spreadsheet_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_maps_api_key
```

---

## 📅 Automatización (Opcional)

Para actualizar datos automáticamente cada X tiempo, puedes:

1. **GitHub Actions** (recomendado)
   - Crea workflow que ejecute `npm run update-data`
   - Programa para correr diariamente o semanalmente

2. **Cron Job en Servidor**
   ```bash
   # Editar crontab
   crontab -e
   
   # Ejecutar diariamente a las 3am
   0 3 * * * cd /ruta/proyecto && npm run update-data && git add . && git commit -m "Update data" && git push
   ```

3. **Zapier/Make**
   - Trigger: Cambio en Google Sheets
   - Action: Webhook que ejecuta el script

---

## 💡 Tips

- 📅 **Recomendación**: Actualiza el JSON después de cada cambio importante en el Sheet
- 🔔 **Notificación**: El script muestra un resumen de clínicas procesadas
- 💾 **Tamaño**: El JSON pesa ~50-200KB dependiendo del número de clínicas
- ⏱️ **Tiempo**: Generar el JSON toma 1-3 minutos (geocoding incluido)

---

## 🆘 Soporte

Si tienes problemas:
1. Verifica los logs del comando `npm run update-data`
2. Confirma que Google Sheets API esté habilitada
3. Revisa que todas las hojas tengan el formato correcto
4. Verifica permisos del Google Sheet (debe ser público o compartido)
