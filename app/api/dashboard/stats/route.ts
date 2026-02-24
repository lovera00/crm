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
  const userId = parseInt(user.id, 10);
  
  if (user.role === 'gestor') {
    const [
      totalDeudas,
      deudasEnGestion,
      deudasConAcuerdo,
      promedioMora,
      carteraTotal,
      seguimientosRecientes,
      solicitudesPendientes,
    ] = await Promise.all([
      prisma.deudaMaestra.count({
        where: { gestorAsignadoId: userId },
      }),
      prisma.deudaMaestra.count({
        where: { 
          gestorAsignadoId: userId,
          estadoActual: { nombre: 'En Gestión' },
        },
      }),
      prisma.deudaMaestra.count({
        where: { 
          gestorAsignadoId: userId,
          estadoActual: { nombre: 'Con Acuerdo' },
        },
      }),
      prisma.deudaMaestra.aggregate({
        where: { gestorAsignadoId: userId },
        _avg: { diasMora: true },
      }),
      prisma.deudaMaestra.aggregate({
        where: { gestorAsignadoId: userId },
        _sum: { deudaTotal: true },
      }),
      prisma.seguimiento.count({
        where: { 
          gestorId: userId,
          fechaCreacion: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.solicitudAutorizacion.count({
        where: { 
          gestorSolicitanteId: userId,
          estadoSolicitud: 'Pendiente',
        },
      }),
    ]);

    return NextResponse.json({
      tipo: 'gestor',
      metricas: {
        totalDeudas,
        enGestion: deudasEnGestion,
        conAcuerdo: deudasConAcuerdo,
        promedioMora: promedioMora._avg.diasMora || 0,
        carteraTotal: carteraTotal._sum.deudaTotal || 0,
        seguimientosUltimaSemana: seguimientosRecientes,
        solicitudesPendientes,
      },
    });
  }

  if (user.role === 'supervisor' || user.role === 'administrador') {
    const [
      totalDeudas,
      totalGestores,
      deudasPorEstado,
      topGestores,
      solicitudesPendientes,
      promedioMoraGeneral,
      carteraTotal,
    ] = await Promise.all([
      prisma.deudaMaestra.count(),
      prisma.usuario.count({
        where: { rol: 'gestor', activo: true },
      }),
      prisma.estadoDeuda.findMany({
        include: {
          _count: {
            select: { deudas: true },
          },
        },
        orderBy: { orden: 'asc' },
      }),
      prisma.usuario.findMany({
        where: { rol: 'gestor', activo: true },
        include: {
          _count: {
            select: { deudasAsignadas: true },
          },
          deudasAsignadas: {
            select: { diasMora: true, deudaTotal: true },
          },
        },
      }),
      prisma.solicitudAutorizacion.count({
        where: { estadoSolicitud: 'Pendiente' },
      }),
      prisma.deudaMaestra.aggregate({
        _avg: { diasMora: true },
      }),
      prisma.deudaMaestra.aggregate({
        _sum: { deudaTotal: true },
      }),
    ]);

    // Obtener solicitudes recientes por separado
    let solicitudesRecientes: any[] = [];
    try {
      solicitudesRecientes = await prisma.solicitudAutorizacion.findMany({
        where: { estadoSolicitud: 'Pendiente' },
        take: 5,
        orderBy: { fechaSolicitud: 'desc' },
        include: {
          gestorSolicitante: { select: { nombre: true } },
          deudaMaestra: { 
            select: { acreedor: true, concepto: true },
          },
          estadoOrigen: { select: { nombre: true } },
          estadoDestino: { select: { nombre: true } },
        },
      });
    } catch (e) {
      console.error('Error fetching solicitudes recientes:', e);
    }

    const gestoresConMetricas = topGestores.map(g => ({
      id: g.id,
      nombre: g.nombre,
      totalDeudas: g._count.deudasAsignadas,
      promedioMora: g.deudasAsignadas.length > 0
        ? g.deudasAsignadas.reduce((sum, d) => sum + d.diasMora, 0) / g.deudasAsignadas.length
        : 0,
      carteraTotal: g.deudasAsignadas.reduce((sum, d) => sum + d.deudaTotal, 0),
    }));

    return NextResponse.json({
      tipo: user.role,
      metricas: {
        totalDeudas,
        totalGestores,
        promedioMoraGeneral: promedioMoraGeneral._avg.diasMora || 0,
        carteraTotal: carteraTotal._sum.deudaTotal || 0,
        solicitudesPendientes,
        deudasPorEstado: deudasPorEstado.map(e => ({
          id: e.id,
          nombre: e.nombre,
          cantidad: e._count.deudas,
        })),
        gestores: gestoresConMetricas,
        solicitudesRecientes: solicitudesRecientes.map(s => ({
          id: s.id,
          gestor: s.gestorSolicitante?.nombre || 'N/A',
          acreedor: s.deudaMaestra?.acreedor || 'N/A',
          deudor: 'Ver detalle',
          estadoOrigen: s.estadoOrigen?.nombre || 'N/A',
          estadoDestino: s.estadoDestino?.nombre || 'N/A',
          fechaSolicitud: s.fechaSolicitud,
        })),
      },
    });
  }

  return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    return await GETHandler(request);
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
