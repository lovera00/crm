import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { createAuthenticatedRouteHandler } from '../../../../src/infrastructure/auth/auth-middleware';
import { validateRequestBody } from '../../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AuthenticatedUser } from '../../../../src/infrastructure/auth/types';
import { AppError } from '../../../../src/domain/errors/app-error';

const crearTipoGestionSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(100),
  descripcion: z.string().optional(),
  activo: z.boolean().optional().default(true),
  orden: z.number().optional().default(0),
  color: z.string().optional(),
  icono: z.string().optional(),
});

const listarTiposGestionSchema = z.object({
  activo: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

type CrearTipoGestionInput = z.infer<typeof crearTipoGestionSchema>;

async function POSTHandler(request: NextRequest, user: AuthenticatedUser) {
  if (user.role !== 'administrador') {
    throw new AppError('No tienes permisos para crear tipos de gestión', 403, 'FORBIDDEN');
  }

  const body = await validateRequestBody<CrearTipoGestionInput>(request, crearTipoGestionSchema);

  const existing = await prisma.tipoGestion.findUnique({
    where: { nombre: body.nombre },
  });

  if (existing) {
    throw new AppError('Ya existe un tipo de gestión con ese nombre', 400, 'VALIDATION_ERROR');
  }

  const tipoGestion = await prisma.tipoGestion.create({
    data: {
      nombre: body.nombre,
      descripcion: body.descripcion,
      activo: body.activo ?? true,
      orden: body.orden ?? 0,
      color: body.color,
      icono: body.icono,
      creadoPorId: parseInt(user.id, 10),
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
    fechaCreacion: tipoGestion.fechaCreacion,
  }, { status: 201 });
}

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  const { searchParams } = new URL(request.url);
  const query = listarTiposGestionSchema.parse({
    activo: searchParams.get('activo'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  });

  const where: Record<string, unknown> = {};
  if (query.activo !== undefined) {
    where.activo = query.activo === 'true';
  }

  const [tiposGestion, total] = await Promise.all([
    prisma.tipoGestion.findMany({
      where,
      orderBy: { orden: 'asc' },
      skip: query.offset,
      take: query.limit,
    }),
    prisma.tipoGestion.count({ where }),
  ]);

  return NextResponse.json({
    tiposGestion: tiposGestion.map(t => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      activo: t.activo,
      orden: t.orden,
      color: t.color,
      icono: t.icono,
      fechaCreacion: t.fechaCreacion,
      fechaModificacion: t.fechaModificacion,
    })),
    total,
    limit: query.limit,
    offset: query.offset,
  });
}

export const POST = createAuthenticatedRouteHandler(POSTHandler, {
  requiredRoles: ['administrador']
});

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});
