import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaSolicitudAutorizacionRepository } from '../../../src/infrastructure/repositories/prisma-solicitud-autorizacion-repository';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { ResolverSolicitudAutorizacionUseCase } from '../../../src/application/use-cases/resolver-solicitud-autorizacion';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const supervisorId = url.searchParams.get('supervisorId');
    
    if (!supervisorId) {
      return NextResponse.json(
        { error: 'Parámetro supervisorId requerido' },
        { status: 400 }
      );
    }

    const solicitudAutorizacionRepository = new PrismaSolicitudAutorizacionRepository(prisma);
    const solicitudes = await solicitudAutorizacionRepository.buscarPendientesPorSupervisor(parseInt(supervisorId));

    return NextResponse.json({ solicitudes }, { status: 200 });
  } catch (error: any) {
    console.error('Error obteniendo solicitudes pendientes:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { solicitudId, supervisorId, aprobar, comentarioSupervisor } = body;

    // Validaciones básicas
    if (!solicitudId || !supervisorId || aprobar === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: solicitudId, supervisorId, aprobar' },
        { status: 400 }
      );
    }

    const solicitudAutorizacionRepository = new PrismaSolicitudAutorizacionRepository(prisma);
    const deudaRepository = new PrismaDeudaRepository(prisma);

    const useCase = new ResolverSolicitudAutorizacionUseCase(
      solicitudAutorizacionRepository,
      deudaRepository,
    );

    const result = await useCase.execute({
      solicitudId,
      supervisorId,
      aprobar,
      comentarioSupervisor,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error resolviendo solicitud de autorización:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}