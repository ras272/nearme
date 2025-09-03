# Configuración de Variables de Entorno en Vercel

## 🔧 Variables de Entorno para Producción

### **Paso 1: En Vercel Dashboard**

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```
Variable Name: NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
Value: AIzaSyDK050y49aUpbFuTueJ6lTwSuMUk4TJD0s
Environment: Production, Preview, Development

Variable Name: NEXT_PUBLIC_GOOGLE_SHEETS_ID  
Value: 1keEup72uKK_t1rm4Vk0BtmT0zzrwITKZNDIEPOPMSwo
Environment: Production, Preview, Development

Variable Name: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Value: [TU_GOOGLE_MAPS_API_KEY_AQUI]
Environment: Production, Preview, Development
```

### **Paso 2: Verificar Configuración**

Después de agregar las variables:
1. Ve a **Deployments**
2. Click en "Redeploy" para aplicar cambios
3. Verifica que el build sea exitoso

### **Paso 3: Probar en Producción**

Una vez deployado:
1. Ve a `tu-app.vercel.app/test-connection`
2. Verifica que las APIs funcionen correctamente
3. Comprueba que las clínicas se carguen desde Google Sheets

## 🛠️ Troubleshooting

### Variables no funcionan
- Asegúrate de que empiecen con `NEXT_PUBLIC_`
- Redeploya después de agregar variables
- Verifica que no haya espacios en los valores

### API Key inválida
- Confirma que la API Key sea correcta
- Verifica que Google Sheets API esté habilitada
- Revisa las restricciones de la API Key

### Spreadsheet no accesible
- Confirma que el Sheet sea público
- Verifica el ID del spreadsheet
- Revisa que la hoja se llame "Clinicas"