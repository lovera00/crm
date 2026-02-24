import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../src/domain/errors/app-error';

async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return token;
}

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);

    const estados = await prisma.estadoDeuda.findMany({
      orderBy: { orden: 'asc' },
    });

    return NextResponse.json({
      estados: estados.map(e => ({
        id: e.id,
        nombre: e.nombre,
        descripcion: e.descripcion,
        esEstadoFinal: e.esEstadoFinal,
        requiereAutorizacion: e.requiereAutorizacion,
        orden: e.orden,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching estados:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
