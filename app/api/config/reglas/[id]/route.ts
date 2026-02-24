import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../src/infrastructure/lib/prisma';
import { createAuthenticatedRouteHandler } from '../../../../../src/infrastructure/auth/auth-middleware';
import { validateRequestBody } from '../../../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AuthenticatedUser } from '../../../../../src/infrastructure/auth/types';
import { AppError } from '../../../../../src/domain/errors/app-error';

const actualizarReglaTransicionSchema = z.object({
  tipoGestionId: z.number().optional(),
  estadoOrigenId: z.number().nullable().optional(),
  estadoDestinoId: z.number().nullable().optional(),
  requiereAutorizacion: z.boolean().optional(),
  mensajeUi: z.string().optional(),
  validacionAdicional: z.record(z.string(), z.any()).optional(),
  prioridad: z.number().optional(),
  activo: z.boolean().optional(),
});

type ActualizarReglaTransicionInput = z.infer<typeof actualizarReglaTransicionSchema>;

function extractId(request: NextRequest): number {
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/config\/reglas\/(\d+)/);
  if (!idMatch) {
    throw new AppError('ID inválido', 400, 'VALIDATION_ERROR');
  }
  const id = parseInt(idMatch[1], 10);
  if (isNaN(id)) {
    throw new AppError('ID inválido', 400, 'VALIDATION_ERROR');
  }
  return id;
}

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  const id = extractId(request);

  const regla = await prisma.reglaTransicion.findUnique({
    where: { id },
    include: {
      tipoGestion: { select: { id: true, nombre: true } },
      estadoOrigen: { select: { id: true, nombre: true } },
      estadoDestino: { select: { id: true, nombre: true } },
    },
  });

  if (!regla) {
    throw new AppError('Regla de transición no encontrada', 404, 'NOT_FOUND');
  }

  return NextResponse.json({
    id: regla.id,
    tipoGestionId: regla.tipoGestionId,
    tipoGestionNombre: regla.tipoGestion?.nombre,
    estadoOrigenId: regla.estadoOrigenId,
    estadoOrigenNombre: regla.estadoOrigen?.nombre,
    estadoDestinoId: regla.estadoDestinoId,
    estadoDestinoNombre: regla.estadoDestino?.nombre,
    requiereAutorizacion: regla.requiereAutorizacion,
    mensajeUi: regla.mensajeUi,
    validacionAdicional: regla.validacionAdicional,
    prioridad: regla.prioridad,
    activo: regla.activo,
    fechaCreacion: regla.fechaCreacion,
    fechaModificacion: regla.fechaModificacion,
  });
}

async function PUTHandler(request: NextRequest, user: AuthenticatedUser) {
  if (user.role !== 'administrador') {
    throw new AppError('No tienes permisos para modificar reglas de transición', 403, 'FORBIDDEN');
  }

  const id = extractId(request);
  const body = await validateRequestBody<ActualizarReglaTransicionInput>(request, actualizarReglaTransicionSchema);

  const existing = await prisma.reglaTransicion.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Regla de transición no encontrada', 404, 'NOT_FOUND');
  }

  if (body.tipoGestionId && body.tipoGestionId !== existing.tipoGestionId) {
    const tipoGestion = await prisma.tipoGestion.findUnique({
      where: { id: body.tipoGestionId },
    });
    if (!tipoGestion) {
      throw new AppError('Tipo de gestión no encontrado', 404, 'NOT_FOUND');
    }
  }

  if (body.estadoOrigenId !== undefined && body.estadoOrigenId !== existing.estadoOrigenId) {
    if (body.estadoOrigenId === null) {
      // null es válido (CUALQUIERA)
    } else {
      const estado = await prisma.estadoDeuda.findUnique({
        where: { id: body.estadoOrigenId },
      });
      if (!estado) {
        throw new AppError('Estado origen no encontrado', 404, 'NOT_FOUND');
      }
    }
  }

  if (body.estadoDestinoId !== undefined && body.estadoDestinoId !== existing.estadoDestinoId) {
    if (body.estadoDestinoId === null) {
      // null es válido (EL MISMO)
    } else {
      const estado = await prisma.estadoDeuda.findUnique({
        where: { id: body.estadoDestinoId },
      });
      if (!estado) {
        throw new AppError('Estado destino no encontrado', 404, 'NOT_FOUND');
      }
    }
  }

  const reglaActualizada = await prisma.reglaTransicion.update({
    where: { id },
    data: {
      ...body,
      modificadoPorId: parseInt(user.id, 10),
    },
  });

  return NextResponse.json({
    id: reglaActualizada.id,
    tipoGestionId: reglaActualizada.tipoGestionId,
    estadoOrigenId: reglaActualizada.estadoOrigenId,
    estadoDestinoId: reglaActualizada.estadoDestinoId,
    requiereAutorizacion: reglaActualizada.requiereAutorizacion,
    mensajeUi: reglaActualizada.mensajeUi,
    prioridad: reglaActualizada.prioridad,
    activo: reglaActualizada.activo,
    fechaModificacion: reglaActualizada.fechaModificacion,
  });
}

async function DELETEHandler(request: NextRequest, user: AuthenticatedUser) {
  if (user.role !== 'administrador') {
    throw new AppError('No tienes permisos para eliminar reglas de transición', 403, 'FORBIDDEN');
  }

  const id = extractId(request);

  const existing = await prisma.reglaTransicion.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Regla de transición no encontrada', 404, 'NOT_FOUND');
  }

  await prisma.reglaTransicion.update({
    where: { id },
    data: {
      activo: false,
      modificadoPorId: parseInt(user.id, 10),
    },
  });

  return NextResponse.json({ message: 'Regla de transición desactivada correctamente' });
}

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});

export const PUT = createAuthenticatedRouteHandler(PUTHandler, {
  requiredRoles: ['administrador']
});

export const DELETE = createAuthenticatedRouteHandler(DELETEHandler, {
  requiredRoles: ['administrador']
});
