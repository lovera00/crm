# DOCUMENTO TÉCNICO COMPLETO - SISTEMA DE GESTIÓN DE COBRANZAS

## 1. RESUMEN EJECUTIVO

**Aplicación:** Sistema integral de gestión de cobranzas para entornos de call center  
**Fecha de elaboración:** 28 de enero de 2026  
**Estado del documento:** Especificación funcional completa - VERSIÓN 1.0

### Características principales:

- Gestión completa de deudores, codeudores y referencias
- Sistema de deudas con cuotas y máquina de estados configurables
- Registro detallado de seguimientos con impacto automático en estados
- Sistema de reglas de negocio configurable por administradores
- Roles diferenciados: Gestor, Supervisor, Administrador
- Cálculos automáticos diarios (mora, gestión, totales)

---

## 2. OBJETIVOS DEL SISTEMA

### 2.1 Objetivo General

Centralizar y optimizar el proceso de cobranza en entornos de call center mediante una plataforma flexible que permita adaptar las reglas de negocio sin necesidad de reprogramación.

### 2.2 Objetivos Específicos

| Objetivo | Descripción |
|----------|-------------|
| Gestión Centralizada | Unificar información de deudores, deudas y gestiones |
| Automatización | Cálculos automáticos de mora, gestión y estados |
| Flexibilidad | Sistema de reglas configurable por administradores |
| Control | Supervisión en tiempo real de la operación |
| Auditoría | Trazabilidad completa de todas las operaciones |

---

## 3. ARQUITECTURA DEL SISTEMA

### 3.1 Módulos Principales

El sistema está compuesto por los siguientes módulos:

1. **Módulo de Personas** - Gestión de deudores, codeudores y referencias
2. **Módulo de Deudas** - Administración de obligaciones y cuotas
3. **Módulo de Seguimiento** - Registro de gestiones y contactos
4. **Configurador** - Reglas de negocio y parámetros del sistema
5. **Gestión de Carteras** - Asignación y reasignación de deudas
6. **Sistema de Roles** - Autenticación y autorización

### 3.2 Tecnologías Requeridas

| Componente | Tecnología |
|------------|------------|
| Backend | API con lógica de máquina de estados dinámica |
| Base de datos | Relacional con soporte para transacciones complejas |
| Frontend | Interfaz web responsiva |
| Servicios | Sistema de tareas programadas (cron jobs) |
| Seguridad | Autenticación y autorización por roles |

---

## 4. MÓDULO DE PERSONAS (DEUDORES/CODEUDORES)

### 4.1 Datos Básicos (Obligatorios)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| nombres | string | Sí | Nombres de la persona |
| apellidos | string | Sí | Apellidos de la persona |
| documento | string | Sí | Número de documento (único) |
| fecha_creacion | datetime | Auto | Fecha de creación del registro |
| creado_por | int | Auto | ID del gestor que creó |
| fecha_modificacion | datetime | Auto | Última modificación |
| modificado_por | int | Auto | ID del último gestor que modificó |

### 4.2 Atributos Especiales

Cada atributo tiene:
- **Estado:** SI / NO / Pendiente de Verificación
- **Fecha de última modificación:** Auditoría automática

**Atributos:**
- Funcionario Público
- Jubilado
- IPS Activo

### 4.3 Datos Varios / Maestros de Cartera

**Descripción:** Información provista por la entidad financiera  
**Formato:** Clave-valor estructurado  
**Regla:** Solo carga inicial (CREATE-ONLY)

**Ejemplo:**
```json
{
  "entidad_origen": "Banco XYZ",
  "numero_contrato": "CT-2024-001",
  "fecha_moroso_inicial": "2024-01-15",
  "direccion_fiscal": "Calle Principal 123"
}
```

### 4.4 Sub-módulos de Registros Múltiples

#### 4.4.1 Teléfonos

```sql
tabla: telefonos
- id (PK)
- persona_id (FK)
- numero (string)
- estado: ['Pendiente de Verificación', 'Activo', 'Inactivo'] (default: Pendiente)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

#### 4.4.2 Correos Electrónicos

```sql
tabla: emails
- id (PK)
- persona_id (FK)
- email (string, unique)
- estado: ['Pendiente de Verificación', 'Activo', 'Inactivo'] (default: Pendiente)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

#### 4.4.3 Referencias Personales

```sql
tabla: referencias_personales
- id (PK)
- persona_id (FK)
- nombre (string)
- parentesco (string)
- telefono (string)
- estado: ['Pendiente de Verificación', 'Activo', 'Inactivo'] (default: Pendiente)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

#### 4.4.4 Referencias Laborales

```sql
tabla: referencias_laborales
- id (PK)
- persona_id (FK)
- nombre (string)
- empresa (string, optional)
- telefono (string)
- estado: ['Pendiente de Verificación', 'Activo', 'Inactivo'] (default: Pendiente)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

### 4.5 Reglas del Módulo Personas

- **No eliminación:** Los contactos no se eliminan, solo cambian de estado
- **Auditoría completa:** Todos los registros tienen datos de creación/modificación
- **Relaciones:** Una persona puede tener múltiples registros en cada sub-módulo

---

## 5. MÓDULO DE DEUDAS

### 5.1 Estructura Jerárquica

#### 5.1.1 Deuda Maestra (Obligación)

```sql
tabla: deudas_maestras
- id (PK)
- acreedor (string)          -- Nombre de la entidad
- concepto (string)          -- Descripción de la deuda
- saldo_capital_total (decimal)  -- Calculado automáticamente
- deuda_total (decimal)      -- Calculado: saldo + intereses + gastos
- estado_actual (FK)         -- Relación a catálogo de estados
- gestor_asignado (FK)       -- Responsable de la gestión
- dias_mora (int)            -- Calculado diariamente
- dias_gestion (int)         -- Calculado diariamente
- gastos_cobranza (decimal)  -- Registrado a nivel maestra
- interes_moratorio (decimal)
- interes_punitorio (decimal)
- fecha_ultimo_pago (date)
- monto_cuota (decimal)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

#### 5.1.2 Detalle de Cuotas

```sql
tabla: cuotas
- id (PK)
- deuda_maestra_id (FK)
- numero_cuota (int)
- fecha_vencimiento (date)
- capital_original (decimal)
- saldo_capital (decimal)
- interes_moratorio_acumulado (decimal)
- interes_punitorio_acumulado (decimal)
- estado_cuota: ['Pendiente', 'Vencida', 'Pagada', 'En Acuerdo']
- fecha_ultimo_pago (date)
- monto_cuota (decimal)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

### 5.2 Relaciones

- Una persona puede estar asociada a múltiples deudas (como deudor principal o codeudor)
- Una deuda maestra puede tener múltiples cuotas
- Una deuda puede tener múltiples personas asociadas (deudor principal + codeudores)

### 5.3 Máquina de Estados - Catálogo Completo

#### 5.3.1 Estados Definidos

```sql
tabla: estados_deuda
- id (PK)
- nombre (string, unique)
- descripcion (text)
- es_estado_final (boolean)
- requiere_autorizacion (boolean)
- orden (int)  -- Para visualización
```

#### 5.3.2 Transiciones de Estado

```sql
tabla: transiciones_estado
- id (PK)
- estado_origen_id (FK)
- estado_destino_id (FK)
- requiere_autorizacion (boolean)
- descripcion (text)
- activo (boolean)
```

#### 5.3.3 Definición Detallada de Estados

| Estado | Descripción | Condición Entrada | Condición Salida | Es Final |
|--------|-------------|-------------------|------------------|----------|
| 1. Nuevo | Deuda recién cargada | Creación/importación | Primer seguimiento → En Gestión | No |
| 2. En Gestión | Gestión activa | Primer seguimiento registrado | Varias opciones | No |
| 3. Con Acuerdo | Acuerdo vigente aprobado | Acuerdo autorizado por supervisor | Cumplido → Cancelada / Incumplido → En Gestión | No |
| 4. Cancelada | Deuda pagada totalmente | Saldo capital = 0 | NINGUNA | Sí |
| 5. Incobrable | No recuperable por decisión operativa | Decisión de supervisor | Reactivación manual excepcional | Sí* |
| 6. Judicializada | Derivada a instancia judicial | Marcada por supervisor | Cancelada o Incobrable | No |
| 7. Fallecido | Deudor principal fallecido | Confirmación de fallecimiento | Cancelada o Incobrable | No |
| 8. Suspendida | Gestión temporalmente detenida | Causa externa (reclamo, error) | Resuelta → En Gestión | No |

### 5.4 Cálculos Automatizados

#### 5.4.1 Días de Mora

```python
def calcular_dias_mora(deuda_id):
    cuota_mas_antigua = Cuota.objects.filter(
        deuda_maestra_id=deuda_id,
        fecha_vencimiento__lt=date.today(),
        estado_cuota__in=['Pendiente', 'Vencida']
    ).order_by('fecha_vencimiento').first()
    
    if cuota_mas_antigua:
        return (date.today() - cuota_mas_antigua.fecha_vencimiento).days
    return 0
```

#### 5.4.2 Días de Gestión

```python
def calcular_dias_gestion(deuda_id):
    deuda = DeudaMaestra.objects.get(id=deuda_id)
    if deuda.fecha_asignacion_gestor:
        return (date.today() - deuda.fecha_asignacion_gestor).days
    return 0
```

#### 5.4.3 Totales

```python
def actualizar_totales(deuda_id):
    cuotas = Cuota.objects.filter(deuda_maestra_id=deuda_id, estado_cuota='Pendiente')
    
    saldo_capital = sum(c.saldo_capital for c in cuotas)
    intereses = sum(c.interes_moratorio_acumulado + c.interes_punitorio_acumulado for c in cuotas)
    
    deuda = DeudaMaestra.objects.get(id=deuda_id)
    deuda.saldo_capital_total = saldo_capital
    deuda.deuda_total = saldo_capital + intereses + deuda.gastos_cobranza
    deuda.save()
```

### 5.5 Proceso Automatizado Diario

```bash
# Cron job ejecutado diariamente a las 02:00 AM
0 2 * * * /ruta/script/actualizar_deudas.py
```

**Script de actualización:**

```python
# actualizar_deudas.py
from datetime import date
from deudas.models import DeudaMaestra

def actualizar_todas_deudas():
    deudas = DeudaMaestra.objects.filter(
        estado_actual__nombre__in=['Nuevo', 'En Gestión', 'Con Acuerdo']
    )
    
    for deuda in deudas:
        # Actualizar días de mora
        deuda.dias_mora = calcular_dias_mora(deuda.id)
        
        # Actualizar días de gestión
        deuda.dias_gestion = calcular_dias_gestion(deuda.id)
        
        # Recalcular totales
        actualizar_totales(deuda.id)
        
        deuda.save()
```

---

## 6. MÓDULO DE SEGUIMIENTO/HISTORIAL DE GESTIÓN

### 6.1 Estructura de Datos

```sql
tabla: seguimientos
- id (PK)
- gestor_id (FK)             -- Quién realizó la gestión
- persona_id (FK)            -- Deudor/codeudor contactado
- tipo_gestion_id (FK)       -- Catálogo configurable
- fecha_hora (datetime)      -- Timestamp de la gestión
- observacion (text)         -- Hasta 1200 caracteres (configurable)
- requiere_seguimiento (boolean)
- fecha_proximo_seguimiento (date)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

### 6.2 Tabla de Relación Seguimiento-Deuda

```sql
tabla: seguimientos_deudas
- id (PK)
- seguimiento_id (FK)
- deuda_maestra_id (FK)
```

### 6.3 Flujo de Creación de Seguimiento

1. Gestor selecciona Persona
2. Sistema muestra deudas asociadas
3. Gestor selecciona una o varias deudas
4. Selecciona Tipo de Gestión del catálogo configurable
5. Ingresa observación (opcional)
6. Sistema:
   - Valida regla para Tipo de Gestión
   - Aplica cambio de estado si corresponde
   - Crea solicitud de autorización si es necesario
   - Registra seguimiento con auditoría

### 6.4 Validaciones

- **Persona requerida:** Debe existir persona asociada
- **Al menos una deuda:** Cada seguimiento debe relacionarse con al menos una deuda
- **Tipo de gestión válido:** Debe existir en catálogo activo
- **Longitud observación:** Máximo configurable (default: 1200 caracteres)

---

## 7. MÓDULO DE CONFIGURACIÓN DE REGLAS

### 7.1 Acceso y Permisos

- **Rol exclusivo:** Administrador
- **Sin acceso:** Gestores y Supervisores (solo lectura para visualización)

### 7.2 Estructura de Configuración

#### 7.2.1 Catálogo de Tipos de Gestión

```sql
tabla: tipos_gestion
- id (PK)
- nombre (string, unique)      -- Ej: "Llamada Inicial", "Email Recordatorio"
- descripcion (text)
- activo (boolean)
- orden (int)
- color (string)               -- Para UI (ej: "#FF5733")
- icono (string)              -- Para UI (ej: "phone")
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

#### 7.2.2 Reglas de Transición Configurables

```sql
tabla: reglas_transicion
- id (PK)
- tipo_gestion_id (FK)
- estado_origen_id (FK)        -- NULL = "CUALQUIERA"
- estado_destino_id (FK)       -- NULL = "EL MISMO"
- requiere_autorizacion (boolean)
- mensaje_ui (string)          -- Mensaje que ve el gestor
- validacion_adicional (text)  -- JSON con condiciones extra
- activo (boolean)
- creado_por, fecha_creacion, modificado_por, fecha_modificacion
```

### 7.3 Valores Especiales para Estados

- **Estado Origen = NULL:** Representa "CUALQUIERA" (aplica a cualquier estado)
- **Estado Destino = NULL:** Representa "EL MISMO" (no cambia estado)

### 7.4 Ejemplos de Reglas Configuradas

| ID | Tipo Gestión | Estado Origen | Estado Destino | Requiere Auth | Descripción |
|----|--------------|---------------|----------------|---------------|-------------|
| 1 | Llamada Inicial | Nuevo | En Gestión | No | Primer contacto |
| 2 | Email Recordatorio | CUALQUIERA | EL MISMO | No | Solo registro |
| 3 | Negociar Acuerdo | En Gestión | Con Acuerdo | Sí | Necesita aprobación supervisor |
| 4 | Confirmar Fallecimiento | CUALQUIERA | Fallecido | Sí | Cambio crítico |
| 5 | Derivar a Legal | En Gestión | Judicializada | Sí | Decisión importante |

### 7.5 Interfaz de Configuración (Admin)

**Validaciones en UI:**
- No permitir reglas duplicadas (mismo tipo + mismo origen)
- Mostrar advertencia si se desactiva regla en uso
- Confirmación para eliminación

---

## 8. SISTEMA DE AUTORIZACIONES

### 8.1 Estructura de Solicitudes

```sql
tabla: solicitudes_autorizacion
- id (PK)
- seguimiento_id (FK)          -- Seguimiento que generó la solicitud
- deuda_maestra_id (FK)        -- Deuda afectada
- estado_origen_id (FK)        -- Estado actual
- estado_destino_id (FK)       -- Estado solicitado
- gestor_solicitante_id (FK)   -- Quién solicitó
- supervisor_asignado_id (FK)  -- Quién debe autorizar
- estado_solicitud: ['Pendiente', 'Aprobada', 'Rechazada', 'Expirada']
- fecha_solicitud (datetime)
- fecha_resolucion (datetime)
- comentario_solicitante (text)
- comentario_supervisor (text)
- prioridad: ['Baja', 'Media', 'Alta', 'Crítica']
```

### 8.2 Flujo de Autorización

1. **Gestor crea seguimiento** con Tipo de Gestión que requiere autorización
2. **Sistema:**
   - Crea solicitud de autorización en estado 'Pendiente'
   - Notifica a supervisores disponibles
   - Bloquea cambios en la deuda hasta resolución
3. **Supervisor recibe notificación y revisa**
   - **Opciones:**
     - a) **Aprobar:** Deuda cambia al nuevo estado
     - b) **Rechazar:** Deuda mantiene estado original
     - c) **Pedir más información:** Solicita aclaraciones al gestor
4. **Sistema** registra decisión con auditoría completa

### 8.3 Notificaciones

- **Email:** Notificación inmediata a supervisor asignado
- **En-app:** Badge en interfaz con contador de pendientes
- **Recordatorio:** Notificación diaria si hay solicitudes >24h pendientes

---

## 9. GESTIÓN DE CARTERAS

### 9.1 Asignación de Deudas

```sql
tabla: asignaciones_cartera
- id (PK)
- deuda_maestra_id (FK)
- gestor_id (FK)
- supervisor_asignador_id (FK)
- fecha_asignacion (datetime)
- fecha_reaasignacion (datetime, null)
- motivo_reaasignacion (text, null)
- activo (boolean)
```

### 9.2 Reglas de Asignación

- **Una deuda, un gestor:** Cada deuda maestra tiene un único gestor asignado
- **Múltiples deudas por gestor:** Un gestor puede tener muchas deudas
- **Codeudores compartidos:** Un gestor ve todos los codeudores de sus deudas
- **Reasignación:** Solo supervisores pueden reasignar deudas

### 9.3 Dashboard de Supervisor

**Vista para dashboard:**
```sql
CREATE VIEW vista_dashboard_supervisor AS
SELECT 
    g.nombre as gestor,
    COUNT(DISTINCT dm.id) as total_deudas,
    COUNT(DISTINCT CASE WHEN ed.nombre = 'En Gestión' THEN dm.id END) as en_gestion,
    COUNT(DISTINCT CASE WHEN ed.nombre = 'Con Acuerdo' THEN dm.id END) con_acuerdo,
    AVG(dm.dias_mora) as promedio_mora,
    SUM(dm.deuda_total) as cartera_total
FROM gestores g
LEFT JOIN deudas_maestras dm ON dm.gestor_asignado = g.id
LEFT JOIN estados_deuda ed ON dm.estado_actual = ed.id
GROUP BY g.id, g.nombre;
```

---

## 10. ROLES Y PERMISOS

### 10.1 Matriz de Permisos Completa

| Permiso | Gestor | Supervisor | Administrador |
|---------|--------|------------|---------------|
| **Personas** ||||
| Ver personas asignadas | Sí | Sí | Sí |
| Ver todas las personas | Sí | Sí | Sí |
| Crear/editar personas | Sí | Sí | Sí |
| **Deudas** ||||
| Ver deudas asignadas | Sí | Sí | Sí |
| Ver todas las deudas | Sí | Sí | Sí |
| Cambiar estado (automático) | Sí | Sí | Sí |
| Cambiar estado (manual) | No | Sí | Sí |
| **Seguimientos** ||||
| Crear seguimientos | Sí | Sí | Sí |
| Ver seguimientos propios | Sí | Sí | Sí |
| Ver todos seguimientos | Sí | Sí | Sí |
| **Configuración** ||||
| Ver tipos de gestión | Sí | Sí | Sí |
| Crear/editar tipos | No | No | Sí |
| Ver reglas | Sí | Sí | Sí |
| Crear/editar reglas | No | No | Sí |
| **Carteras** ||||
| Ver cartera propia | Sí | Sí | Sí |
| Asignar/reaasignar | No | Sí | Sí |
| **Autorizaciones** ||||
| Crear solicitudes | Sí | Sí | Sí |
| Aprobar/rechazar | No | Sí | Sí |
| Ver historial auth | Sí | Sí | Sí |

### 10.2 Definición de Roles

#### 10.2.1 Gestor (Agente de Cobranza)

```json
{
  "rol": "gestor",
  "descripcion": "Usuario operativo que gestiona su cartera asignada",
  "permisos_clave": [
    "crear_seguimientos",
    "ver_personas_asignadas", 
    "ver_deudas_asignadas",
    "solicitar_autorizaciones"
  ],
  "restricciones": [
    "no_configurar_reglas",
    "no_autorizar_solicitudes",
    "no_reaasignar_carteras"
  ]
}
```

#### 10.2.2 Supervisor

```json
{
  "rol": "supervisor",
  "descripcion": "Usuario administrativo que monitorea y autoriza",
  "permisos_clave": [
    "ver_todo",
    "autorizar_solicitudes",
    "gestionar_carteras",
    "cambiar_estados_manual"
  ],
  "restricciones": [
    "no_configurar_reglas",
    "no_eliminar_datos_historicos"
  ]
}
```

#### 10.2.3 Administrador

```json
{
  "rol": "administrador",
  "descripcion": "Usuario técnico que configura el sistema",
  "permisos_clave": [
    "configurar_reglas",
    "gestionar_usuarios",
    "ver_logs_sistema",
    "modificar_parametros"
  ],
  "restricciones": [
    "no_eliminar_auditorias",
    "no_modificar_datos_historicos"
  ]
}
```

---

## 11. INTERFACES DE USUARIO

### 11.1 Pantallas Principales

#### 11.1.1 Login y Dashboard

El dashboard debe mostrar:
- Saludo personalizado con nombre de usuario
- Notificaciones pendientes
- Tarjetas resumen: Cartera total, Pendientes, Métricas de efectividad
- Buscador de personas/deudas
- Lista de deudas asignadas con: número, deudor, estado, días de mora

#### 11.1.2 Ficha de Persona

Pestañas disponibles:
- Datos básicos
- Teléfonos
- Emails
- Referencias
- Deudas

**Datos mostrados:**
- Nombre completo
- Documento
- Atributos especiales con fecha de última modificación
- Botones para agregar teléfonos, emails y referencias

#### 11.1.3 Crear Seguimiento

Campos del formulario:
- Persona seleccionada (display only)
- Deudas asociadas (checkboxes para selección múltiple)
- Tipo de Gestión (dropdown con indicación de cambio de estado)
- Observación (textarea con contador de caracteres)
- Botones: Cancelar, Guardar Seguimiento

### 11.2 Responsividad

- **Desktop:** Pantallas completas con sidebars
- **Tablet:** Layout adaptable con menús colapsables
- **Mobile:** Vista priorizada, formularios simplificados

---

## 12. BASE DE DATOS - ESQUEMA COMPLETO

### 12.1 Entidades Principales

Las entidades principales del sistema son:
- **Personas** - Deudores, codeudores y referencias
- **Deudas_Maestras** - Obligaciones financieras
- **Cuotas** - Detalle de pagos pendientes
- **Seguimientos** - Registro de gestiones
- **Estados_Deuda** - Catálogo de estados
- **Tipos_Gestion** - Catálogo de tipos de gestión
- **Reglas_Transicion** - Configuración de reglas de negocio
- **Transiciones_Estado** - Definición de transiciones permitidas

### 12.2 Script SQL de Creación

```sql
-- Tabla principal de personas
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    funcionario_publico VARCHAR(20) CHECK (funcionario_publico IN ('SI', 'NO', 'Pendiente')),
    fecha_mod_funcionario DATE,
    jubilado VARCHAR(20) CHECK (jubilado IN ('SI', 'NO', 'Pendiente')),
    fecha_mod_jubilado DATE,
    ips_activo VARCHAR(20) CHECK (ips_activo IN ('SI', 'NO', 'Pendiente')),
    fecha_mod_ips DATE,
    datos_varios JSONB,
    creado_por INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modificado_por INTEGER REFERENCES usuarios(id),
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de deudas maestras
CREATE TABLE deudas_maestras (
    id SERIAL PRIMARY KEY,
    acreedor VARCHAR(200) NOT NULL,
    concepto TEXT NOT NULL,
    saldo_capital_total DECIMAL(15,2) DEFAULT 0,
    deuda_total DECIMAL(15,2) DEFAULT 0,
    estado_actual INTEGER REFERENCES estados_deuda(id),
    gestor_asignado INTEGER REFERENCES usuarios(id),
    dias_mora INTEGER DEFAULT 0,
    dias_gestion INTEGER DEFAULT 0,
    gastos_cobranza DECIMAL(15,2) DEFAULT 0,
    interes_moratorio DECIMAL(15,2) DEFAULT 0,
    interes_punitorio DECIMAL(15,2) DEFAULT 0,
    fecha_ultimo_pago DATE,
    monto_cuota DECIMAL(15,2),
    fecha_asignacion_gestor DATE,
    creado_por INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modificado_por INTEGER REFERENCES usuarios(id),
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación personas-deudas (codeudores)
CREATE TABLE personas_deudas (
    id SERIAL PRIMARY KEY,
    persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
    deuda_maestra_id INTEGER REFERENCES deudas_maestras(id) ON DELETE CASCADE,
    es_deudor_principal BOOLEAN DEFAULT TRUE,
    creado_por INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(persona_id, deuda_maestra_id)
);

-- Índices para optimización
CREATE INDEX idx_personas_documento ON personas(documento);
CREATE INDEX idx_deudas_estado ON deudas_maestras(estado_actual);
CREATE INDEX idx_deudas_gestor ON deudas_maestras(gestor_asignado);
CREATE INDEX idx_personas_deudas_persona ON personas_deudas(persona_id);
CREATE INDEX idx_personas_deudas_deuda ON personas_deudas(deuda_maestra_id);
```

---

## 13. API - ENDPOINTS PRINCIPALES

### 13.1 Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "gestor1",
  "password": "********"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "gestor1",
    "rol": "gestor",
    "nombre": "Juan Gestor"
  }
}
```

### 13.2 Personas

```http
GET /api/personas?documento=12345678
GET /api/personas/{id}/deudas
POST /api/personas/{id}/telefonos
PUT /api/telefonos/{id}/estado
```

### 13.3 Deudas

```http
GET /api/deudas?estado=En%20Gesti%C3%B3n&gestor=1
GET /api/deudas/{id}/cuotas
POST /api/deudas/{id}/cambiar-estado
GET /api/deudas/{id}/historial-estados
```

### 13.4 Seguimientos

```http
POST /api/seguimientos
Content-Type: application/json

{
  "persona_id": 1,
  "deudas_ids": [1, 2],
  "tipo_gestion_id": 3,
  "observacion": "Cliente prometió pago para el viernes..."
}

GET /api/personas/{id}/seguimientos
GET /api/deudas/{id}/seguimientos
```

### 13.5 Autorizaciones

```http
GET /api/autorizaciones/pendientes
POST /api/autorizaciones/{id}/aprobar
POST /api/autorizaciones/{id}/rechazar
```

### 13.6 Configuración (solo admin)

```http
GET /api/config/tipos-gestion
POST /api/config/tipos-gestion
PUT /api/config/reglas/{id}
GET /api/config/reglas?tipo_gestion_id=1
```

---

## 14. CONSIDERACIONES DE SEGURIDAD

### 14.1 Autenticación

- JWT tokens con expiración de 24 horas
- Refresh tokens para renovación automática
- Rate limiting: 100 requests/minuto por usuario

### 14.2 Autorización

- Middleware de roles en todos los endpoints
- Validación de ownership: Gestor solo ve sus deudas
- Auditoría de acceso a datos sensibles

### 14.3 Protección de Datos

- **Encriptación:** AES-256 para datos sensibles
- **Máscara de datos:** Documentos y teléfonos en logs
- **Backups automáticos:** Diarios con retención de 30 días

---
## 15. GLOSARIO DE TÉRMINOS

| Término | Definición |
|---------|------------|
| Deuda Maestra | Obligación financiera principal que puede contener múltiples cuotas |
| Codeudor | Persona adicional responsable de la deuda junto con el deudor principal |
| Días de Mora | Número de días desde el vencimiento de la cuota más antigua |
| Días de Gestión | Número de días desde la asignación al gestor actual |
| Tipo de Gestión | Categoría configurable de acción de seguimiento |
| Regla de Transición | Configuración que define cómo un Tipo de Gestión afecta el estado |

---

## 16. ANEXOS

### 16.1 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 OK | Operación exitosa |
| 201 Created | Recurso creado |
| 400 Bad Request | Datos inválidos |
| 401 Unauthorized | No autenticado |
| 403 Forbidden | Sin permisos |
| 404 Not Found | Recurso no existe |
| 422 Unprocessable Entity | Validación fallida |
| 500 Internal Server Error | Error del servidor |

### 16.2 Formatos de Fecha

| Contexto | Formato |
|----------|---------|
| API | ISO 8601 (YYYY-MM-DDTHH:mm:ssZ) |
| Base de datos | GTM-3 |
| Interfaz | Formato local del usuario |

### 16.3 Unidades Monetarias

| Contexto | Formato |
|----------|---------|
| Base de datos | DECIMAL(15,2) - 13 enteros, 2 decimales |
| Interfaz | Guaranies con Separador de miles con puntos (ej: Gs 15.000) |
| Cálculos | Precisión de centavos |

---

**FIN DEL DOCUMENTO**

Este documento especifica completamente los requerimientos para el Sistema de Gestión de Cobranzas y servirá como guía para el desarrollo, testing e implementación del proyecto.
