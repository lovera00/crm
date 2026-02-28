import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }

  const userId = typeof token.id === 'string' ? parseInt(token.id, 10) : (token.id as number);
  const role = token.role as string;

  let where: Record<string, unknown> = {};

  if (role === 'supervisor') {
    where = { supervisorAsignadoId: userId, estadoSolicitud: 'Pendiente' };
  } else if (role === 'gestor') {
    where = { gestorSolicitanteId: userId, estadoSolicitud: 'Pendiente' };
  } else if (role === 'administrador') {
    where = { estadoSolicitud: 'Pendiente' };
  }

  const count = await prisma.solicitudAutorizacion.count({ where });

  return NextResponse.json({ count });
}
