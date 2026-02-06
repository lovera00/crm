# API Documentation

## Base URL
All endpoints are prefixed with `/api`.

## Authentication
Currently, the API uses simple API key authentication (to be implemented).

## Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Headers included: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Error Handling
All errors follow the same format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "statusCode": 400,
  "details": { /* optional details */ }
}
```

## Endpoints

### Health Check
`GET /api/health`

Check system health and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-02-06T11:00:00.000Z",
  "system": {
    "app": "crm-cobranzas",
    "version": "0.1.0",
    "node": "v20.11.0",
    "environment": "development",
    "uptime": 1234.56
  },
  "checks": {
    "database": {
      "status": "healthy",
      "duration": 5
    }
  },
  "responseTime": 10
}
```

**Status Codes:**
- `200`: All systems healthy
- `503`: One or more systems unhealthy

---

### Daily Debt Updates
`POST /api/actualizaciones-diarias`

Trigger daily updates for all debts (interest accrual, state transitions).

**Request Body (optional):**
```json
{
  "fechaReferencia": "2025-02-06T00:00:00.000Z"
}
```

**Response:**
```json
{
  "actualizadas": 150,
  "interesAcumulado": 1250.75,
  "transiciones": [
    { "deudaId": 1, "estadoAnterior": "NUEVA", "estadoNuevo": "EN_GESTION" }
  ]
}
```

**Rate Limit:** 10 requests per minute

---

### Authorization Requests
`GET /api/autorizaciones?supervisorId={id}`

Get pending authorization requests for a supervisor.

**Query Parameters:**
- `supervisorId` (required): Supervisor ID

**Response:**
```json
{
  "solicitudes": [
    {
      "id": 1,
      "deudaId": 100,
      "estadoSolicitado": "DESCUENTO",
      "motivo": "Cliente negoció descuento",
      "fechaSolicitud": "2025-02-06T10:30:00.000Z",
      "estado": "PENDIENTE"
    }
  ]
}
```

---

`POST /api/autorizaciones`

Approve or reject an authorization request.

**Request Body:**
```json
{
  "solicitudId": 1,
  "supervisorId": 5,
  "aprobar": true,
  "comentarioSupervisor": "Aprobado según política"
}
```

**Response:**
```json
{
  "solicitudId": 1,
  "aprobada": true,
  "deudaActualizada": true,
  "nuevoEstado": "DESCUENTO"
}
```

---

### Follow-ups
`POST /api/seguimientos`

Create a new follow-up for debts.

**Request Body:**
```json
{
  "gestorId": 10,
  "personaId": 25,
  "deudaIds": [100, 101, 102],
  "tipoGestionId": 3,
  "observacion": "Cliente prometió pago para el viernes",
  "requiereSeguimiento": true,
  "fechaProximoSeguimiento": "2025-02-10T09:00:00.000Z"
}
```

**Response:**
```json
{
  "seguimientoId": 500,
  "deudasActualizadas": [100, 101, 102],
  "transicionesAplicadas": [
    { "deudaId": 100, "estadoAnterior": "EN_GESTION", "estadoNuevo": "PROMESA_PAGO" }
  ],
  "solicitudesAutorizacion": []
}
```

---

## State Machine Rules

The system uses a rule-based state transition engine with:

### Rule Priority
Rules are evaluated by priority (higher number = higher priority).

### Conditional Rules
Rules can include conditions:

```json
{
  "condicion": {
    "operador": "and",
    "condiciones": [
      {
        "campo": "diasVencidos",
        "operador": "gt",
        "valor": 90
      },
      {
        "campo": "monto",
        "operador": "gt",
        "valor": 10000
      }
    ]
  }
}
```

### Available Operators
- Comparison: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`
- Logical: `and`, `or`, `not`

---

## Environment Variables

See `.env.example` for all available environment variables.