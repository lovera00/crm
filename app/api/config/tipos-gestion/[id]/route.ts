import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { validateRequestBody } from '../../../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AppError } from '../../../../../src/domain/errors/app-error';

const actualizarTipoGestionSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
  orden: z.number().optional(),
  color: z.string().optional(),
  icono: z.string().optional(),
});

type ActualizarTipoGestionInput = z.infer<typeof actualizarTipoGestionSchema>;

function extractId(request: NextRequest): number {
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/config\/tipos-gestion\/(\d+)/);
  if (!idMatch) {
    throw new AppError('ID inválido', 400, 'VALIDATION_ERROR');
  }
  const id = parseInt(idMatch[1], 10);
  if (isNaN(id)) {
    throw new AppError('ID inválido', 400, 'VALIDATION_ERROR');
  }
  return id;
}

async function GETHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const id = extractId(request);

  const tipoGestion = await prisma.tipoGestion.findUnique({
    where: { id },
    include: {
      reglasTransicion: {
        where: { activo: true },
        orderBy: { prioridad: 'asc' },
      },
    },
  });

  if (!tipoGestion) {
    throw new AppError('Tipo de gestión no encontrado', 404, 'NOT_FOUND');
  }

  return NextResponse.json({
    id: tipoGestion.id,
    nombre: tipoGestion.nombre,
    descripcion: tipoGestion.descripcion,
    activo: tipoGestion.activo,
    orden: tipoGestion.orden,
    color: tipoGestion.color,
    icono: tipoGestion.icono,
    fechaCreacion: tipoGestion.fechaCreacion,
    fechaModificacion: tipoGestion.fechaModificacion,
    reglasTransicion: tipoGestion.reglasTransicion.map(r => ({
      id: r.id,
      tipoGestionId: r.tipoGestionId,
      estadoOrigenId: r.estadoOrigenId,
      estadoDestinoId: r.estadoDestinoId,
      requiereAutorizacion: r.requiereAutorizacion,
      mensajeUi: r.mensajeUi,
      prioridad: r.prioridad,
      activo: r.activo,
    })),
  });
}

async function PUTHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  if (token.role !== 'administrador') {
    throw new AppError('No tienes permisos para modificar tipos de gestión', 403, 'FORBIDDEN');
  }

  const id = extractId(request);
  const body = await validateRequestBody<ActualizarTipoGestionInput>(request, actualizarTipoGestionSchema);

  const existing = await prisma.tipoGestion.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Tipo de gestión no encontrado', 404, 'NOT_FOUND');
  }

  if (body.nombre && body.nombre !== existing.nombre) {
    const duplicate = await prisma.tipoGestion.findUnique({
      where: { nombre: body.nombre },
    });
    if (duplicate) {
      throw new AppError('Ya existe un tipo de gestión con ese nombre', 400, 'VALIDATION_ERROR');
    }
  }

  const tipoGestion = await prisma.tipoGestion.update({
    where: { id },
    data: {
      ...body,
      modificadoPorId: parseInt(token.id as string, 10),
    },
  });

  return NextResponse.json({
    id: tipoGestion.id,
    nombre: tipoGestion.nombre,
    descripcion: tipoGestion.descripcion,
    activo: tipoGestion.activo,
    orden: tipoGestion.orden,
    color: tipoGestion.color,
    icono: tipoGestion.icono,
    fechaModificacion: tipoGestion.fechaModificacion,
  });
}

async function DELETEHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  if (token.role !== 'administrador') {
    throw new AppError('No tienes permisos para eliminar tipos de gestión', 403, 'FORBIDDEN');
  }

  const id = extractId(request);

  const existing = await prisma.tipoGestion.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Tipo de gestión no encontrado', 404, 'NOT_FOUND');
  }

  await prisma.tipoGestion.update({
    where: { id },
    data: {
      activo: false,
      modificadoPorId: parseInt(token.id as string, 10),
    },
  });

  return NextResponse.json({ message: 'Tipo de gestión desactivado correctamente' });
}

export { GETHandler as GET, PUTHandler as PUT, DELETEHandler as DELETE };
