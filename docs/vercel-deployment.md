# Guía de Despliegue en Vercel - Near My Clinic

## 🚀 Paso a Paso para Desplegar en encuentra.ares.com.py

### 1. Preparar Repositorio Git

Si no tienes tu código en GitHub/GitLab:

```bash
# Inicializar repositorio
git init
git add .
git commit -m "Initial commit - Near My Clinic"

# Conectar con GitHub (crea un repo en github.com primero)
git remote add origin https://github.com/tu-usuario/nearme.git
git push -u origin main
```

### 2. Configurar Vercel

#### A. Registrarse en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con GitHub/GitLab
3. Conecta tu repositorio

#### B. Importar Proyecto
1. Click en "Add New..." → "Project"
2. Selecciona tu repositorio de NEARME
3. Framework Preset: **Next.js** (autodetectado)
4. **NO HAGAS DEPLOY AUN** - Configura variables primero

#### C. Configurar Variables de Entorno
En la página de configuración del proyecto, agrega:

```
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY = tu_api_key_real
NEXT_PUBLIC_GOOGLE_SHEETS_ID = tu_spreadsheet_id_real  
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = tu_maps_api_key_real
```

#### D. Hacer Deploy
1. Click "Deploy"
2. Espera que termine el build
3. ¡Tu app estará en `https://nearme-xxx.vercel.app`!

### 3. Configurar Dominio Personalizado

#### A. En Vercel Dashboard
1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Add Domain: `encuentra.ares.com.py`
4. Vercel te dará instrucciones DNS

#### B. Configurar DNS en tu Proveedor
En el panel de tu dominio ares.com.py:

```
Tipo: CNAME
Nombre: encuentra
Valor: cname.vercel-dns.com
TTL: 300 (o automático)
```

**Alternativamente**, si tu proveedor no soporta CNAME para subdominios:
```
Tipo: A
Nombre: encuentra  
Valor: 76.76.19.61
```

### 4. Verificar Configuración

#### A. Probar el Sitio
1. Ve a `https://encuentra.ares.com.py`
2. Debería cargar la aplicación
3. Ve a `https://encuentra.ares.com.py/test-connection`
4. Verifica que las APIs funcionen

#### B. Certificado SSL
- Vercel automáticamente provee HTTPS
- Puede tomar 5-10 minutos en activarse

### 5. Configurar Redirects (Opcional)

Si quieres que `ares.com.py/encuentra` redirija a `encuentra.ares.com.py`:

En tu WordPress (ares.com.py), agrega en `.htaccess`:
```apache
# Redirect /encuentra to subdomain
RewriteRule ^encuentra/?(.*)$ https://encuentra.ares.com.py/$1 [R=301,L]
```

### 6. Monitoreo y Mantenimiento

#### A. Auto-Deploy
- Vercel auto-deploya cuando haces push a main
- Cada cambio en Google Sheets se refleja automáticamente

#### B. Logs y Analytics
- Ve a Vercel Dashboard → Functions → Logs
- Monitoring automático incluido

### 7. Comandos Útiles

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy desde terminal
vercel

# Deploy a producción
vercel --prod

# Ver logs en tiempo real
vercel logs
```

## 🛠️ Troubleshooting

### Dominio no funciona
- Verifica configuración DNS (usa `nslookup encuentra.ares.com.py`)
- DNS puede tomar 24-48 horas en propagarse

### Variables de entorno no funcionan
- Deben empezar con `NEXT_PUBLIC_`
- Redeploya después de cambiar variables

### Build falla
- Revisa logs en Vercel Dashboard
- Verifica que no haya errores de TypeScript

### APIs no funcionan en producción
- Confirma que las API Keys sean válidas
- Verifica que las APIs estén habilitadas en Google Cloud

## ✅ Checklist Final

- [ ] Repositorio en GitHub/GitLab
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] DNS configurado
- [ ] Dominio personalizado funcionando
- [ ] HTTPS activo
- [ ] APIs funcionando en producción
- [ ] Test de conexión exitoso

## 📞 Soporte

Si tienes problemas:
1. Revisa Vercel logs
2. Verifica DNS con herramientas online
3. Prueba `/test-connection` en producción