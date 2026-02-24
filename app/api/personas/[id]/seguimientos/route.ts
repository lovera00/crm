import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../../../src/domain/errors/app-error';
import { z } from 'zod';

async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return token;
}

const listarSeguimientosSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

function extractId(request: NextRequest): number {
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/personas\/(\d+)\/seguimientos/);
  if (!idMatch) {
    throw new Error('ID de persona inválido');
  }
  return parseInt(idMatch[1], 10);
}

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    const personaId = extractId(request);
    const { searchParams } = new URL(request.url);
    const query = listarSeguimientosSchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const [seguimientos, total] = await Promise.all([
      prisma.seguimiento.findMany({
        where: { personaId },
        include: {
          gestor: { select: { id: true, nombre: true } },
          tipoGestion: { select: { id: true, nombre: true, color: true, icono: true } },
          deudas: {
            include: {
              deudaMaestra: {
                select: { id: true, acreedor: true, concepto: true },
              },
            },
          },
          solicitudesAutorizacion: {
            select: {
              id: true,
              estadoSolicitud: true,
              fechaSolicitud: true,
            },
          },
        },
        orderBy: { fechaHora: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      prisma.seguimiento.count({ where: { personaId } }),
    ]);

    return NextResponse.json({
      seguimientos: seguimientos.map(s => ({
        id: s.id,
        gestorId: s.gestorId,
        gestor: s.gestor.nombre,
        personaId: s.personaId,
        tipoGestionId: s.tipoGestionId,
        tipoGestion: {
          nombre: s.tipoGestion.nombre,
          color: s.tipoGestion.color,
          icono: s.tipoGestion.icono,
        },
        fechaHora: s.fechaHora,
        observacion: s.observacion,
        requiereSeguimiento: s.requiereSeguimiento,
        fechaProximoSeguimiento: s.fechaProximoSeguimiento,
        deudas: s.deudas.map(d => ({
          id: d.deudaMaestra.id,
          acreedor: d.deudaMaestra.acreedor,
          concepto: d.deudaMaestra.concepto,
        })),
        solicitudAutorizacion: s.solicitudesAutorizacion.length > 0 ? {
          id: s.solicitudesAutorizacion[0].id,
          estado: s.solicitudesAutorizacion[0].estadoSolicitud,
          fechaSolicitud: s.solicitudesAutorizacion[0].fechaSolicitud,
        } : null,
      })),
      total,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error: any) {
    console.error('Error fetching seguimientos:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
