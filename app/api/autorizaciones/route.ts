import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { createAuthenticatedRouteHandler } from '../../../src/infrastructure/auth/auth-middleware';
import { AuthenticatedUser } from '../../../src/infrastructure/auth/types';

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  const { searchParams } = new URL(request.url);
  const pagina = parseInt(searchParams.get('pagina') || '1', 10);
  const porPagina = parseInt(searchParams.get('porPagina') || '10', 10);
  const skip = (pagina - 1) * porPagina;

  const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

  let where: Record<string, unknown> = {};

  if (user.role === 'supervisor') {
    where = {
      supervisorAsignadoId: userId,
    };
  } else if (user.role === 'gestor') {
    where = {
      gestorSolicitanteId: userId,
    };
  }

  const [rows, total] = await Promise.all([
    prisma.solicitudAutorizacion.findMany({
      where,
      include: {
        estadoOrigen: { select: { nombre: true } },
        estadoDestino: { select: { nombre: true } },
        gestorSolicitante: {
          select: { id: true, nombre: true, username: true },
        },
        supervisorAsignado: {
          select: { id: true, nombre: true, username: true },
        },
        deudaMaestra: {
          select: { id: true, acreedor: true, concepto: true, deudaTotal: true },
        },
      },
      orderBy: { fechaSolicitud: 'desc' },
      skip,
      take: porPagina,
    }),
    prisma.solicitudAutorizacion.count({ where }),
  ]);

  const solicitudes = rows.map((s) => ({
    ...s,
    estadoOrigen: s.estadoOrigen.nombre,
    estadoDestino: s.estadoDestino.nombre,
  }));

  return NextResponse.json({
    solicitudes,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  });
}

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});
