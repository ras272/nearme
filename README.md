# Near My Clinic 🏥

Una aplicación web para encontrar clínicas médicas con equipos Ares Paraguay. Permite a los usuarios buscar, filtrar y contactar clínicas por ubicación, equipos disponibles y otros criterios.

## 🚀 Características

- 🗺️ **Mapa interactivo** con ubicaciones de clínicas
- 🔍 **Búsqueda y filtros** por equipo médico, ciudad y nombre
- 📱 **Diseño responsive** optimizado para móviles
- 📍 **Geolocalización** para mostrar distancias
- 💬 **Contacto directo** via WhatsApp, llamadas y email
- 🗺️ **Direcciones integradas** con Google Maps
- 📊 **Datos en tiempo real** desde Google Sheets

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.2.4
- **React**: 19
- **TypeScript**: 5
- **Estilos**: Tailwind CSS 4.1.9
- **UI Components**: Shadcn/ui
- **APIs**: Google Sheets API, Google Maps API
- **Iconos**: Lucide React

## 📋 Prerequisitos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Google Cloud Console
- Google Sheet configurado

## ⚙️ Configuración

### 1. Clonar y Instalar

```bash
git clone <tu-repositorio>
cd NEARME
npm install
```

### 2. Configurar Google Sheets API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google Sheets API**
4. Crea una **API Key** en Credenciales
5. (Opcional) Habilita **Google Maps JavaScript API** para el mapa

### 3. Crear Google Sheets (NUEVA ARQUITECTURA - 2 hojas)

El sistema requiere **2 hojas** en tu Google Spreadsheet:

#### **Hoja "Clinicas"** - Todas las clínicas

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| nombre_clinica | direccion | telefono | whatsapp | email | horarios | equipos | latitud | longitud | ciudad |

**Ejemplo:**
| nombre_clinica | direccion | telefono | whatsapp | email | horarios | equipos | latitud | longitud | ciudad |
|----------------|-----------|----------|----------|--------|----------|---------|---------|----------|---------|
| Benestar | Julio Correa 1591, Asunción | +595 21 123456 | +595 981 123456 | info@benestar.com | Lun-Vie: 8:00-18:00 | CMSlim, Endymed, Hydrafacial | -25.27 | -57.57 | Asuncion |

#### **Hoja "TXS"** - Mapeo equipos → tratamientos

| A (EQUIPO) | B (TRATAMIENTOS) |
|------------|------------------|
| CMSlim | Tonificacion Muscular, Tratamientos Faciales, Reduccion, Celulitis |
| Hydrafacial | Limpieza Facial, Tratamientos Faciales |
| Endymed | Tensado Facial, Tratamientos Faciales, Lineas de Expresion |

**Importante:**
- Crear **2 hojas** con los nombres exactos: **"Clinicas"** y **"TXS"**
- Los datos deben empezar en la **fila 2** (fila 1 = headers)
- En "Clinicas", separar múltiples equipos con **comas** (columna G)
- En "TXS", separar múltiples tratamientos con **comas** (columna B)
- Coordenadas en **formato decimal** (-25.2637, -57.5759)
- Hacer el sheet **público** o compartido con "cualquier persona con el enlace puede ver"
- **Los tratamientos se asignan automáticamente** según los equipos listados

### 4. Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_GOOGLE_SHEETS_ID=tu_spreadsheet_id_aqui
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_maps_api_key_aqui
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🧪 Probar Configuración

Ve a `http://localhost:3000/test-connection` para verificar:
- ✅ Variables de entorno configuradas
- ✅ Conexión con Google Sheets
- ✅ Datos cargados correctamente

## 📦 Despliegue

### Vercel (Recomendado)

1. **Conectar repositorio:**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configurar variables de entorno en Vercel:**
   - Ve a tu proyecto en vercel.com
   - Settings → Environment Variables
   - Agrega las mismas variables del `.env.local`

3. **Configurar dominio personalizado:**
   - Settings → Domains
   - Agregar `encuentra.ares.com.py`

### Configuración DNS

Para el subdominio `encuentra.ares.com.py`:

```
Tipo: CNAME
Nombre: encuentra
Valor: cname.vercel-dns.com
```

## 🏗️ Estructura del Proyecto

```
NEARME/
├── app/
│   ├── page.tsx                 # Página principal
│   ├── test-connection/         # Página de prueba de API
│   └── layout.tsx              # Layout global
├── components/
│   ├── ui/                     # Componentes Shadcn/ui
│   ├── google-map.tsx          # Componente de mapa
│   ├── contact-dialog.tsx      # Modal de contacto
│   ├── quick-contact-buttons.tsx # Botones de contacto rápido
│   └── mobile-view-toggle.tsx   # Toggle móvil mapa/lista
├── lib/
│   ├── google-sheets.ts        # Integración con Google Sheets
│   └── utils.ts               # Utilidades
└── docs/
    └── google-sheets-structure.md # Documentación del Sheet
```

## 🎯 Ciudades Soportadas

El proyecto incluye 30 ciudades principales de Paraguay:
- **Área Metropolitana**: Asunción, San Lorenzo, Luque, Capiatá, etc.
- **Interior**: Ciudad del Este, Encarnación, Coronel Oviedo, etc.

## 🔧 Desarrollo

### Comandos Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linter
```

### Agregar Nueva Clínica

1. Abre tu Google Sheet
2. Agrega una nueva fila con todos los datos
3. La aplicación actualizará automáticamente

## 🐛 Troubleshooting

### Error de conexión con Google Sheets
- Verifica que la API Key sea correcta
- Confirma que Google Sheets API esté habilitada
- Revisa que el Sheet sea público

### Mapa no funciona
- Verifica la API Key de Google Maps
- Confirma que Google Maps JavaScript API esté habilitada
- Revisa las coordenadas en el Sheet

### Datos no aparecen
- Ve a `/test-connection` para diagnosticar
- Revisa la consola del navegador
- Confirma la estructura del Google Sheet

## 📞 Soporte

Para soporte técnico, revisa:
1. Los logs en `/test-connection`
2. La consola del navegador (F12)
3. La documentación de Google APIs

## 📄 Licencia

© 2024 Ares Paraguay. Todos los derechos reservados.