# Configuración DNS para encuentra.ares.com.py

## 🌐 Configurando el Subdominio

### **Paso 1: En Vercel**

1. Ve a tu proyecto → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Ingresa: `encuentra.ares.com.py`
4. Vercel te mostrará instrucciones específicas

### **Paso 2: Configurar DNS**

#### **Opción A: CNAME (Recomendado)**
En el panel DNS de ares.com.py:

```
Tipo: CNAME
Nombre: encuentra
Destino: cname.vercel-dns.com
TTL: 300 (o automático)
```

#### **Opción B: Registro A (Alternativo)**
Si tu proveedor no soporta CNAME:

```
Tipo: A
Nombre: encuentra  
Valor: 76.76.19.61
TTL: 300
```

### **Paso 3: Verificación**

#### **Verificar DNS (5-30 minutos después)**
```bash
# En tu computadora, abrir CMD/Terminal
nslookup encuentra.ares.com.py

# Debería mostrar:
# encuentra.ares.com.py canonical name = cname.vercel-dns.com
```

#### **Verificar HTTPS (puede tomar hasta 24 horas)**
- Ve a `https://encuentra.ares.com.py`
- Debería mostrar certificado SSL válido
- La aplicación debería cargar normalmente

### **Paso 4: Proveedores Comunes**

#### **GoDaddy**
1. DNS Management → DNS Records
2. Add Record → CNAME
3. Host: `encuentra`
4. Points to: `cname.vercel-dns.com`
5. TTL: 1 Hour

#### **Cloudflare**
1. DNS → Records
2. Add record → CNAME
3. Name: `encuentra`
4. Target: `cname.vercel-dns.com`
5. Proxy status: DNS only (gray cloud)

#### **Namecheap**
1. Advanced DNS
2. Add New Record → CNAME
3. Host: `encuentra`
4. Value: `cname.vercel-dns.com`
5. TTL: Automatic

#### **Hosting Paraguay (Local)**
1. Panel de Control → Dominios → DNS
2. Agregar Registro → CNAME
3. Subdominio: `encuentra`
4. Destino: `cname.vercel-dns.com`

### **Paso 5: Redirección desde WordPress (Opcional)**

Si quieres que `ares.com.py/encuentra` redirija al subdominio:

En tu WordPress (ares.com.py), edita `.htaccess`:

```apache
# Redirect /encuentra to subdomain
RewriteEngine On
RewriteRule ^encuentra/?(.*)$ https://encuentra.ares.com.py/$1 [R=301,L]
```

## 🕒 Tiempos de Propagación

- **DNS**: 5 minutos - 24 horas
- **SSL Certificate**: 10 minutos - 24 horas  
- **Vercel Verification**: 1-5 minutos

## ✅ Checklist de Verificación

- [ ] Dominio agregado en Vercel
- [ ] DNS configurado correctamente
- [ ] `nslookup` devuelve resultado correcto
- [ ] `https://encuentra.ares.com.py` carga
- [ ] Certificado SSL activo
- [ ] APIs funcionando en producción
- [ ] `/test-connection` exitoso

## 🆘 Problemas Comunes

### DNS no propaga
- Esperar 24-48 horas máximo
- Verificar configuración con herramientas online
- Contactar soporte del proveedor DNS

### Certificado SSL no funciona
- Vercel maneja SSL automáticamente
- Puede tomar hasta 24 horas
- Verificar que DNS esté correcto

### Subdominio no resuelve
- Confirmar que el registro CNAME sea correcto
- Verificar que no haya conflictos con otros registros
- Probar con `dig encuentra.ares.com.py` en terminal