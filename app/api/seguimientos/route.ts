import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { PrismaSeguimientoRepository } from '../../../src/infrastructure/repositories/prisma-seguimiento-repository';
import { PrismaReglaTransicionRepository } from '../../../src/infrastructure/repositories/prisma-regla-transicion-repository';
import { CrearSeguimientoUseCase } from '../../../src/application/use-cases/crear-seguimiento';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gestorId, personaId, deudaIds, tipoGestionId, observacion, requiereSeguimiento, fechaProximoSeguimiento } = body;

    // Validaciones básicas
    if (!gestorId || !personaId || !deudaIds || !tipoGestionId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const deudaRepository = new PrismaDeudaRepository(prisma);
    const seguimientoRepository = new PrismaSeguimientoRepository(prisma);
    const reglaTransicionRepository = new PrismaReglaTransicionRepository(prisma);

    const useCase = new CrearSeguimientoUseCase(
      deudaRepository,
      seguimientoRepository,
      reglaTransicionRepository,
    );

    const result = await useCase.execute({
      gestorId,
      personaId,
      deudaIds,
      tipoGestionId,
      observacion,
      requiereSeguimiento,
      fechaProximoSeguimiento: fechaProximoSeguimiento ? new Date(fechaProximoSeguimiento) : undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creando seguimiento:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
