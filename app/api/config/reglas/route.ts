import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { validateRequestBody } from '../../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AppError } from '../../../../src/domain/errors/app-error';

const crearReglaTransicionSchema = z.object({
  tipoGestionId: z.number().min(1, 'Tipo de gestión es requerido'),
  estadoOrigenId: z.number().nullable().optional(),
  estadoDestinoId: z.number().nullable().optional(),
  requiereAutorizacion: z.boolean().optional().default(false),
  mensajeUi: z.string().optional(),
  validacionAdicional: z.record(z.string(), z.any()).optional(),
  prioridad: z.number().optional().default(0),
  activo: z.boolean().optional().default(true),
});

const listarReglasSchema = z.object({
  tipo_gestion_id: z.coerce.number().optional(),
  estado_origen_id: z.coerce.number().optional(),
  activo: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

type CrearReglaTransicionInput = z.infer<typeof crearReglaTransicionSchema>;

async function POSTHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  if (token.role !== 'administrador') {
    throw new AppError('No tienes permisos para crear reglas de transición', 403, 'FORBIDDEN');
  }

  const body = await validateRequestBody<CrearReglaTransicionInput>(request, crearReglaTransicionSchema);

  const tipoGestion = await prisma.tipoGestion.findUnique({
    where: { id: body.tipoGestionId },
  });
  if (!tipoGestion) {
    throw new AppError('Tipo de gestión no encontrado', 404, 'NOT_FOUND');
  }

  if (body.estadoOrigenId) {
    const estadoOrigen = await prisma.estadoDeuda.findUnique({
      where: { id: body.estadoOrigenId },
    });
    if (!estadoOrigen) {
      throw new AppError('Estado origen no encontrado', 404, 'NOT_FOUND');
    }
  }

  if (body.estadoDestinoId) {
    const estadoDestino = await prisma.estadoDeuda.findUnique({
      where: { id: body.estadoDestinoId },
    });
    if (!estadoDestino) {
      throw new AppError('Estado destino no encontrado', 404, 'NOT_FOUND');
    }
  }

  const existingRule = await prisma.reglaTransicion.findFirst({
    where: {
      tipoGestionId: body.tipoGestionId,
      estadoOrigenId: body.estadoOrigenId,
      activo: true,
    },
  });

  if (existingRule) {
    throw new AppError('Ya existe una regla activa para este tipo de gestión y estado origen', 400, 'VALIDATION_ERROR');
  }

  const reglaTransicion = await prisma.reglaTransicion.create({
    data: {
      tipoGestionId: body.tipoGestionId,
      estadoOrigenId: body.estadoOrigenId,
      estadoDestinoId: body.estadoDestinoId,
      requiereAutorizacion: body.requiereAutorizacion ?? false,
      mensajeUi: body.mensajeUi,
      validacionAdicional: body.validacionAdicional,
      prioridad: body.prioridad ?? 0,
      activo: body.activo ?? true,
      creadoPorId: parseInt(token.id as string, 10),
    },
  });

  return NextResponse.json({
    id: reglaTransicion.id,
    tipoGestionId: reglaTransicion.tipoGestionId,
    estadoOrigenId: reglaTransicion.estadoOrigenId,
    estadoDestinoId: reglaTransicion.estadoDestinoId,
    requiereAutorizacion: reglaTransicion.requiereAutorizacion,
    mensajeUi: reglaTransicion.mensajeUi,
    prioridad: reglaTransicion.prioridad,
    activo: reglaTransicion.activo,
    fechaCreacion: reglaTransicion.fechaCreacion,
  }, { status: 201 });
}

async function GETHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const { searchParams } = new URL(request.url);
  const query = listarReglasSchema.parse({
    tipo_gestion_id: searchParams.get('tipo_gestion_id') ?? undefined,
    estado_origen_id: searchParams.get('estado_origen_id') ?? undefined,
    activo: searchParams.get('activo') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });

  const where: Record<string, unknown> = {};
  if (query.tipo_gestion_id) {
    where.tipoGestionId = query.tipo_gestion_id;
  }
  if (query.estado_origen_id) {
    where.estadoOrigenId = query.estado_origen_id;
  }
  if (query.activo !== undefined) {
    where.activo = query.activo === 'true';
  }

  const [reglas, total] = await Promise.all([
    prisma.reglaTransicion.findMany({
      where,
      include: {
        tipoGestion: { select: { id: true, nombre: true } },
        estadoOrigen: { select: { id: true, nombre: true } },
        estadoDestino: { select: { id: true, nombre: true } },
      },
      orderBy: [{ prioridad: 'asc' }, { tipoGestion: { orden: 'asc' } }],
      skip: query.offset,
      take: query.limit,
    }),
    prisma.reglaTransicion.count({ where }),
  ]);

  return NextResponse.json({
    reglas: reglas.map(r => ({
      id: r.id,
      tipoGestionId: r.tipoGestionId,
      tipoGestionNombre: r.tipoGestion?.nombre,
      estadoOrigenId: r.estadoOrigenId,
      estadoOrigenNombre: r.estadoOrigen?.nombre,
      estadoDestinoId: r.estadoDestinoId,
      estadoDestinoNombre: r.estadoDestino?.nombre,
      requiereAutorizacion: r.requiereAutorizacion,
      mensajeUi: r.mensajeUi,
      prioridad: r.prioridad,
      activo: r.activo,
      fechaCreacion: r.fechaCreacion,
      fechaModificacion: r.fechaModificacion,
    })),
    total,
    limit: query.limit,
    offset: query.offset,
  });
}

export { POSTHandler as POST, GETHandler as GET };
