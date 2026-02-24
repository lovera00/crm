import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { createAuthenticatedRouteHandler } from '../../../../src/infrastructure/auth/auth-middleware';
import { AuthenticatedUser } from '../../../../src/infrastructure/auth/types';

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

  let where: Record<string, unknown> = {};

  if (user.role === 'supervisor') {
    where = {
      supervisorAsignadoId: userId,
      estadoSolicitud: 'Pendiente',
    };
  } else if (user.role === 'gestor') {
    where = {
      gestorSolicitanteId: userId,
      estadoSolicitud: 'Pendiente',
    };
  } else if (user.role === 'administrador') {
    where = {
      estadoSolicitud: 'Pendiente',
    };
  }

  const count = await prisma.solicitudAutorizacion.count({ where });

  return NextResponse.json({ count });
}

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});
