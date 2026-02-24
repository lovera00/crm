import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AuthenticatedUser, UserRole } from '../../../../src/infrastructure/auth/types';
import { AppError } from '../../../../src/domain/errors/app-error';

async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return {
    id: token.id as string,
    role: token.role as UserRole,
  };
}

async function GETHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  
  if (user.role !== 'supervisor' && user.role !== 'administrador') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const [
    totalDeudas,
    totalGestores,
    solicitudesPendientes,
    solicitudesHoy,
    gestores,
    estados,
  ] = await Promise.all([
    prisma.deudaMaestra.count(),
    prisma.usuario.count({ where: { rol: 'gestor', activo: true } }),
    prisma.solicitudAutorizacion.count({ where: { estadoSolicitud: 'Pendiente' } }),
    prisma.solicitudAutorizacion.count({
      where: {
        fechaSolicitud: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.usuario.findMany({
      where: { rol: 'gestor', activo: true },
      select: { id: true, nombre: true },
    }),
    prisma.estadoDeuda.findMany({
      include: { _count: { select: { deudas: true } } },
      orderBy: { orden: 'asc' },
    }),
  ]);

  const gestorIds = gestores.map(g => g.id);
  
  const metricasGestores = await prisma.deudaMaestra.groupBy({
    by: ['gestorAsignadoId'],
    where: { gestorAsignadoId: { in: gestorIds } },
    _count: { id: true },
    _avg: { diasMora: true },
    _sum: { deudaTotal: true },
  });

  const metricasPorEstado = await prisma.deudaMaestra.groupBy({
    by: ['estadoActualId', 'gestorAsignadoId'],
    where: { gestorAsignadoId: { in: gestorIds } },
    _count: { id: true },
  });

  const gestorMetrics = await Promise.all(
    gestores.map(async (g) => {
      const metricas = metricasGestores.find(m => m.gestorAsignadoId === g.id);
      const porEstado = metricasPorEstado.filter(m => m.gestorAsignadoId === g.id);
      
      const enGestion = porEstado.find(p => {
        const estado = estados.find(e => e.id === p.estadoActualId);
        return estado?.nombre === 'En Gestión';
      });
      const conAcuerdo = porEstado.find(p => {
        const estado = estados.find(e => e.id === p.estadoActualId);
        return estado?.nombre === 'Con Acuerdo';
      });
      const canceladas = porEstado.find(p => {
        const estado = estados.find(e => e.id === p.estadoActualId);
        return estado?.nombre === 'Cancelada';
      });

      return {
        id: g.id,
        nombre: g.nombre,
        totalDeudas: metricas?._count.id || 0,
        enGestion: enGestion?._count.id || 0,
        conAcuerdo: conAcuerdo?._count.id || 0,
        canceladas: canceladas?._count.id || 0,
        promedioMora: metricas?._avg.diasMora || 0,
        carteraTotal: metricas?._sum.deudaTotal || 0,
      };
    })
  );

  return NextResponse.json({
    tipo: 'supervisor',
    metricas: {
      totalDeudas,
      totalGestores,
      solicitudesPendientes,
      solicitudesHoy,
      gestors: gestorMetrics,
      estados: estados.map(e => ({ nombre: e.nombre, _count: { deudas: e._count.deudas } })),
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    return await GETHandler(request);
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
