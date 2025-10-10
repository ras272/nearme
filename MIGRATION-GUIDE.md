# 🚀 Guía de Migración - Nueva Arquitectura Simplificada

## 📊 Resumen de Cambios

### **ANTES** (Sistema antiguo)
- ❌ 24 hojas separadas (una por tratamiento)
- ❌ Tratamientos asignados según el nombre de la hoja
- ❌ Difícil de mantener y propenso a errores

### **DESPUÉS** (Nueva arquitectura)
- ✅ Solo 2 hojas: `Clinicas` y `TXS`
- ✅ Tratamientos asignados **automáticamente** según equipos
- ✅ Fácil de mantener y escalable

---

## 📋 Pasos de Migración

### **1. Preparar Google Sheets** 📝

#### **A. Crear hoja "Clinicas"**
1. En tu Google Spreadsheet, crea una nueva hoja llamada exactamente **"Clinicas"**
2. Estructura (columnas A-J):

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| nombre_clinica | direccion | telefono | whatsapp | email | horarios | equipos | latitud | longitud | ciudad |

3. Fila 1: Headers (nombres de columnas)
4. Fila 2+: Datos de cada clínica

**Ejemplo de datos:**
```
Benestar | Julio Correa 1591, Asunción | +595 21 123456 | +595 981 123456 | info@benestar.com | Lun-Vie: 8:00-18:00 | CMSlim, Endymed, Hydrafacial | -25.268755 | -57.5627624 | Asuncion
```

#### **B. Crear hoja "TXS"** (mapeo equipos → tratamientos)
1. Crea una nueva hoja llamada exactamente **"TXS"**
2. Estructura (columnas A-B):

| A (EQUIPO) | B (TRATAMIENTOS) |
|------------|------------------|
| CMSlim | Tonificacion Muscular, Tratamientos Faciales, Reduccion, Celulitis |
| Hydrafacial | Limpieza Facial, Tratamientos Faciales |
| Endymed | Tensado Facial, Tratamientos Faciales, Lineas de Expresion |
| Venus Legacy | Celulitis, Tensado Corporal |
| Elysion | Reduccion, Modelado Corporal |

**⚠️ Importante:**
- Los nombres de equipos en TXS deben coincidir **exactamente** con los de la columna G en Clinicas
- Los tratamientos se separan por comas
- Si una clínica tiene `CMSlim, Hydrafacial`, recibirá todos los tratamientos de ambos equipos

#### **C. Migrar datos existentes**
Si tienes las 24 hojas antiguas:

1. **Consolidar todas las clínicas en "Clinicas":**
   - Copia todas las clínicas de las hojas individuales
   - Pégalas en la nueva hoja "Clinicas"
   - Elimina duplicados (misma clínica que aparecía en múltiples hojas)

2. **Crear mapeo TXS:**
   - Identifica todos los equipos únicos que existen
   - Para cada equipo, lista los tratamientos que ofrece
   - Usa los nombres de las hojas antiguas como referencia para los tratamientos

#### **D. Eliminar hojas antiguas (opcional)**
- Una vez que todo funcione correctamente, puedes eliminar las 24 hojas antiguas
- **Recomendación:** Mantenerlas temporalmente como backup

---

### **2. Probar la Nueva Arquitectura** 🧪

#### **A. Regenerar JSON**
```bash
npm run update-data
```

**Verás logs como:**
```
🚀 Starting clinic data generation (NEW ARCHITECTURE)...
============================================================
✅ Environment variables configured
📊 Spreadsheet ID: 1keEup72u...

📋 Loading equipment-treatment mapping from TXS...
   ✓ CMSlim → [Tonificacion Muscular, Tratamientos Faciales, Reduccion, Celulitis]
   ✓ Hydrafacial → [Limpieza Facial, Tratamientos Faciales]
   ✓ Endymed → [Tensado Facial, Tratamientos Faciales, Lineas de Expresion]
✅ Loaded mapping for 3 equipment types

📥 Fetching Clinicas sheet...
✅ Found 40 rows

🔄 Transforming clinics with dynamic treatment mapping...
   📍 BENESTAR: CMSlim, Endymed, Hydrafacial → [Celulitis, Limpieza Facial, ...]
   ...

✅ Valid clinics: 40
============================================================

🗺️ Processing coordinates for 40 clinics...
✅ All clinics already have coordinates!

✅ Clinics after grouping: 40 (removed 0 duplicates)

✅ SUCCESS! JSON file generated at: C:\...\public\data\clinics.json
📊 Total clinics: 40
🔧 Equipment types mapped: 3
📅 Generated at: 2025-10-08T...
💾 File size: 156.78 KB

📝 NEW ARCHITECTURE: Only 2 sheets required (Clinicas + TXS)
```

#### **B. Verificar JSON generado**
1. Abre `public/data/clinics.json`
2. Verifica que:
   - Todas las clínicas están presentes
   - Cada clínica tiene `treatment` con tratamientos asignados
   - El mapeo `equipment_treatment_map` está incluido

**Ejemplo de clínica en JSON:**
```json
{
  "id": 1,
  "name": "BENESTAR",
  "address": "Julio Correa 1591 esq, Asunción 001525",
  "equipment": ["CMSlim", "Endymed", "Hydrafacial"],
  "treatment": "Celulitis, Limpieza Facial, Lineas de Expresion, Reduccion, Tensado Facial, Tonificacion Muscular, Tratamientos Faciales",
  ...
}
```

#### **C. Probar en desarrollo**
```bash
npm run dev
```

Abre `http://localhost:3000?refresh=true` para cargar directamente desde Google Sheets API (modo developer).

**Verificaciones:**
- ✅ Las clínicas se muestran correctamente
- ✅ Los filtros de tratamiento funcionan
- ✅ Los filtros de equipo funcionan
- ✅ Los tratamientos se muestran en cada tarjeta de clínica

---

### **3. Troubleshooting** 🔧

#### **Error: "No equipment-treatment mapping loaded from TXS sheet!"**
**Causa:** La hoja TXS no existe o está mal nombrada.
**Solución:** Verifica que la hoja se llame exactamente "TXS" (mayúsculas).

#### **Error: "No data in Clinicas sheet"**
**Causa:** La hoja Clinicas está vacía o mal nombrada.
**Solución:** Verifica que la hoja se llame exactamente "Clinicas".

#### **Clínicas sin tratamientos**
**Causa:** Los equipos listados no tienen mapeo en TXS.
**Logs:**
```
⚠️ No treatments found for equipment: CMSlim XYZ
```
**Solución:** Agrega el equipo a la hoja TXS con sus tratamientos correspondientes.

#### **Tratamientos duplicados**
**Causa:** Un equipo aparece varias veces en la columna equipos con espacios extra.
**Ejemplo:** `CMSlim, CMSlim, Endymed`
**Solución:** El sistema automáticamente elimina duplicados, pero limpia la columna para evitar confusión.

#### **Filtros no funcionan**
**Causa:** El JSON no se regeneró después de los cambios.
**Solución:** Ejecuta `npm run update-data` nuevamente.

---

### **4. Deploy a Producción** 🚀

#### **A. Commit cambios**
```bash
git status
git add .
git commit -m "feat: simplificar arquitectura a 2 hojas (Clinicas + TXS) con mapeo automático de tratamientos"
```

#### **B. Push a repositorio**
```bash
git push origin main
```

#### **C. Regenerar JSON en producción**
Si usas Vercel:
1. Los cambios se deployarán automáticamente
2. **IMPORTANTE:** Ejecuta `npm run update-data` localmente después del deploy
3. Commit el nuevo `clinics.json` generado
4. Push nuevamente

O ejecuta el script en producción si tienes acceso SSH:
```bash
npm run update-data
```

#### **D. Verificar en producción**
1. Abre tu sitio en producción
2. Verifica que las clínicas se cargan correctamente
3. Prueba los filtros de tratamientos y equipos

---

## 📊 Comparación de Estructuras

### **Antes: 24 hojas separadas**
```
Spreadsheet:
├── Reduccion (hoja 1)
│   ├── Clinica A
│   └── Clinica B
├── Modelado (hoja 2)
│   ├── Clinica A (duplicado)
│   └── Clinica C
├── Tensado_Facial (hoja 3)
│   └── Clinica B (duplicado)
...
└── Celulitis (hoja 24)
```

### **Después: 2 hojas**
```
Spreadsheet:
├── Clinicas (hoja única con TODAS las clínicas)
│   ├── Clinica A | equipos: CMSlim, Endymed
│   ├── Clinica B | equipos: Hydrafacial
│   └── Clinica C | equipos: CMSlim, Hydrafacial
│
└── TXS (mapeo equipos → tratamientos)
    ├── CMSlim → [Reduccion, Modelado, Celulitis]
    ├── Endymed → [Tensado Facial, Lineas Expresion]
    └── Hydrafacial → [Limpieza Facial, Acne]

Resultado:
- Clinica A tiene: Reduccion, Modelado, Celulitis, Tensado Facial, Lineas Expresion
- Clinica B tiene: Limpieza Facial, Acne
- Clinica C tiene: Reduccion, Modelado, Celulitis, Limpieza Facial, Acne
```

---

## ✅ Checklist de Migración

### **Google Sheets:**
- [ ] Hoja "Clinicas" creada (columnas A-J)
- [ ] Hoja "TXS" creada (columnas A-B)
- [ ] Datos de clínicas migrados a "Clinicas"
- [ ] Mapeo completo de equipos en "TXS"
- [ ] Sheets públicas o compartidas

### **Testing:**
- [ ] `npm run update-data` ejecutado sin errores
- [ ] JSON generado en `public/data/clinics.json`
- [ ] Clínicas tienen tratamientos asignados
- [ ] `npm run dev` funciona correctamente
- [ ] Filtros de tratamiento funcionan
- [ ] Filtros de equipo funcionan

### **Producción:**
- [ ] Cambios commiteados a git
- [ ] Push a repositorio
- [ ] JSON regenerado en producción
- [ ] Sitio verificado en producción

---

## 🎉 Beneficios de la Nueva Arquitectura

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Hojas de Google Sheets** | 24 hojas | 2 hojas |
| **Mantenimiento** | Duplicar clínica en cada hoja | Una sola entrada por clínica |
| **Agregar tratamiento** | Crear nueva hoja | Agregar línea en TXS |
| **Agregar equipo** | Editar todas las hojas | Agregar línea en TXS |
| **Escalabilidad** | Difícil (más hojas = más complejidad) | Fácil (solo editar TXS) |
| **Riesgo de errores** | Alto (datos duplicados) | Bajo (única fuente de verdad) |
| **Velocidad de carga** | Lenta (24 API calls) | Rápida (2 API calls) |

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. **Revisa logs:** `npm run update-data` muestra información detallada
2. **Verifica estructura:** Asegúrate que las hojas tengan los nombres exactos
3. **Limpia cache:** Usa `?refresh=true` en la URL para datos en tiempo real
4. **Consulta docs:** Lee ACTUALIZACION-DATOS.md y README.md

---

## 🚀 ¡Listo!

Tu sistema ahora usa la arquitectura simplificada con solo 2 hojas. Disfruta de:
- ✅ Mantenimiento más simple
- ✅ Menos errores
- ✅ Carga más rápida
- ✅ Mayor escalabilidad

**¡Felicidades! 🎉**
