import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../src/domain/errors/app-error';

async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return {
    id: token.id as string,
    role: token.role as string,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (user.role !== 'gestor') {
      throw new AppError('Acceso denegado', 403, 'FORBIDDEN');
    }

    const gestorId = parseInt(user.id, 10);
    const { searchParams } = new URL(request.url);
    
    const fechaStr = searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const estadoId = searchParams.get('estadoId');
    const search = searchParams.get('search');

    const fecha = new Date(fechaStr);
    fecha.setHours(23, 59, 59, 999);

    const whereClause: any = {
      gestorId,
      requiereSeguimiento: true,
      fechaProximoSeguimiento: {
        lte: fecha,
      },
    };

    if (search) {
      whereClause.persona = {
        OR: [
          { nombres: { contains: search, mode: 'insensitive' } },
          { apellidos: { contains: search, mode: 'insensitive' } },
          { documento: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const seguimientos = await prisma.seguimiento.findMany({
      where: whereClause,
      include: {
        persona: {
          include: {
            telefonos: {
              where: { estado: 'Activo' },
              take: 1,
            },
          },
        },
        deudas: {
          include: {
            deudaMaestra: {
              include: {
                estadoActual: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaProximoSeguimiento: 'asc',
      },
      take: 100,
    });

    const items = seguimientos.map(seg => {
      const totalDeuda = seg.deudas.reduce((sum, sd) => sum + sd.deudaMaestra.deudaTotal, 0);
      const telefono = seg.persona.telefonos[0]?.numero || null;
      const estadoDeuda = seg.deudas[0]?.deudaMaestra.estadoActual.nombre || 'Sin estado';
      
      const fechaProx = seg.fechaProximoSeguimiento;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      let estadoProximo: 'vencido' | 'hoy' | 'futuro';
      if (!fechaProx) {
        estadoProximo = 'futuro';
      } else {
        const fechaProxDate = new Date(fechaProx);
        fechaProxDate.setHours(0, 0, 0, 0);
        
        if (fechaProxDate < hoy) {
          estadoProximo = 'vencido';
        } else if (fechaProxDate.getTime() === hoy.getTime()) {
          estadoProximo = 'hoy';
        } else {
          estadoProximo = 'futuro';
        }
      }

      let filterMatch = true;
      if (estadoId) {
        const deudaEstadoId = seg.deudas[0]?.deudaMaestra.estadoActualId;
        filterMatch = deudaEstadoId === parseInt(estadoId, 10);
      }

      if (!filterMatch) return null;

      return {
        personaId: seg.personaId,
        nombres: seg.persona.nombres,
        apellidos: seg.persona.apellidos,
        documento: seg.persona.documento,
        telefono,
        totalDeuda,
        estadoDeuda,
        fechaProximo: seg.fechaProximoSeguimiento,
        estadoProximo,
      };
    }).filter(Boolean);

    const resumen = {
      vencidos: items.filter(i => i?.estadoProximo === 'vencido').length,
      hoy: items.filter(i => i?.estadoProximo === 'hoy').length,
      futuro: items.filter(i => i?.estadoProximo === 'futuro').length,
      total: items.length,
    };

    const conteoPorDia = await prisma.seguimiento.groupBy({
      by: ['fechaProximoSeguimiento'],
      where: {
        gestorId,
        requiereSeguimiento: true,
        fechaProximoSeguimiento: {
          gte: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
          lte: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      _count: true,
    });

    const conteoFormateado: Record<string, number> = {};
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      conteoFormateado[key] = 0;
    }
    
    conteoPorDia.forEach(c => {
      if (c.fechaProximoSeguimiento) {
        const key = c.fechaProximoSeguimiento.toISOString().split('T')[0];
        if (conteoFormateado[key] !== undefined) {
          conteoFormateado[key] = c._count;
        }
      }
    });

    return NextResponse.json({
      items,
      resumen,
      conteoPorDia: conteoFormateado,
    });

  } catch (error: any) {
    console.error('Error en agenda:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
