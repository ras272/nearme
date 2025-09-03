# Configuración Google Cloud Console

## 🔧 Configurar Google Sheets API

### **Paso 1: Crear Proyecto en Google Cloud**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Nombre del proyecto: **"Near My Clinic"**
4. Click **"Create"**

### **Paso 2: Habilitar APIs**

#### **Google Sheets API**
1. En el menú lateral → **APIs & Services** → **Library**
2. Busca **"Google Sheets API"**
3. Click **"Enable"**

#### **Google Maps JavaScript API (Opcional)**
1. En Library, busca **"Maps JavaScript API"**
2. Click **"Enable"**
3. También habilita **"Places API"** si planeas usar búsqueda

### **Paso 3: Crear Credenciales**

#### **API Key para Google Sheets**
1. **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"API Key"**
3. Copia la API Key generada
4. Click **"Restrict Key"** (recomendado)

#### **Restringir API Key (Seguridad)**
1. **Application restrictions**: HTTP referrers
2. **Website restrictions**: 
   - `https://encuentra.ares.com.py/*`
   - `https://*.vercel.app/*` (para testing)
   - `http://localhost:3000/*` (para desarrollo)

3. **API restrictions**: 
   - ✅ Google Sheets API
   - ✅ Maps JavaScript API (si la usas)

### **Paso 4: Configurar Facturación (Si necesitas Maps)**

**⚠️ Solo necesario para Google Maps API**

1. **Billing** → **Link a billing account**
2. Agregar tarjeta de crédito
3. **Nota**: Google da $200 USD gratis mensualmente

### **Paso 5: Cuotas y Límites**

#### **Google Sheets API** (Gratis)
- **100 requests/100 seconds/user**
- **300 requests/minute**
- Suficiente para tu aplicación

#### **Maps JavaScript API** (Costo)
- **$7 USD por 1,000 cargas de mapa**
- **Primeros $200 USD gratis cada mes**
- Considera si realmente necesitas el mapa

## 📊 **Google Sheet Configuración**

### **Paso 1: Crear Google Sheet**
1. Ve a [sheets.google.com](https://sheets.google.com)
2. **Blank spreadsheet**
3. Nombra: **"Clinicas Ares Paraguay"**

### **Paso 2: Configurar Estructura**

#### **Hoja: "Clinicas"**
En la **Fila 1** (Headers):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| nombre_clinica | direccion | telefono | whatsapp | email | horarios | equipos | latitud | longitud | ciudad |

#### **Ejemplo de Datos (Fila 2+):**

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Centro Médico Ares | Av. España 123, Asunción | +595 21 123456 | +595 981 123456 | info@centroares.com.py | Lun-Vie: 8:00-18:00 | CMSlim,Dexa | -25.2637 | -57.5759 | Asunción |

### **Paso 3: Hacer Sheet Público**
1. Click **"Share"** (esquina superior derecha)
2. **"Change to anyone with the link"**
3. **Viewer** (solo lectura)
4. Click **"Done"**

### **Paso 4: Obtener Sheet ID**
De la URL del sheet:
```
https://docs.google.com/spreadsheets/d/1keEup72uKK_t1rm4Vk0BtmT0zzrwITKZNDIEPOPMSwo/edit
```
El ID es: `1keEup72uKK_t1rm4Vk0BtmT0zzrwITKZNDIEPOPMSwo`

## 🔍 **Obtener Coordenadas**

### **Método 1: Google Maps**
1. Ve a [maps.google.com](https://maps.google.com)
2. Busca la dirección
3. Click derecho en el marcador
4. Las coordenadas aparecen en el popup
5. Primer número = Latitud, Segundo = Longitud

### **Método 2: Herramientas Online**
- [latlong.net](https://www.latlong.net/)
- [gps-coordinates.net](https://gps-coordinates.net/)

## ✅ **Checklist de Configuración**

### Google Cloud
- [ ] Proyecto creado
- [ ] Google Sheets API habilitada
- [ ] API Key generada
- [ ] API Key restringida correctamente
- [ ] (Opcional) Maps API habilitada
- [ ] (Opcional) Facturación configurada

### Google Sheet
- [ ] Sheet creado con nombre "Clinicas Ares Paraguay"
- [ ] Hoja nombrada "Clinicas"
- [ ] Headers correctos en fila 1
- [ ] Al menos 1 clínica de ejemplo
- [ ] Sheet compartido públicamente
- [ ] Sheet ID copiado

### Variables de Entorno
- [ ] `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` configurada
- [ ] `NEXT_PUBLIC_GOOGLE_SHEETS_ID` configurada
- [ ] (Opcional) `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` configurada

## 🚨 **Seguridad**

### **⚠️ Importante**
- **NUNCA** compartas tu API Key públicamente
- **SIEMPRE** restringe las API Keys
- **REVISA** regularmente el uso en Google Cloud Console
- **CONSIDERA** usar Service Account para mayor seguridad

### **Restricciones Recomendadas**
```
HTTP referrers:
- https://encuentra.ares.com.py/*
- https://*.vercel.app/*
- http://localhost:3000/*

API restrictions:
- Google Sheets API
- Maps JavaScript API (solo si la usas)
```

## 💰 **Costos Estimados**

### **Google Sheets API**: **GRATIS**
- Ilimitado para uso normal
- Suficiente para tu aplicación

### **Google Maps API**: **~$0-20 USD/mes**
- Depende del tráfico
- $200 USD gratis mensualmente
- Considera si realmente necesitas mapa

## 🆘 **Troubleshooting**

### **Error 403: API Key inválida**
- Verifica que la API Key sea correcta
- Confirma que Google Sheets API esté habilitada
- Revisa las restricciones de la API Key

### **Error 404: Sheet no encontrado**
- Confirma que el Sheet ID sea correcto
- Verifica que el sheet sea público
- Asegúrate de que la hoja se llame "Clinicas"

### **No se cargan datos**
- Revisa la estructura del sheet
- Confirma que los headers estén en la fila 1
- Verifica que haya datos desde la fila 2