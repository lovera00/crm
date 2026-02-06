import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { PrismaTransicionEstadoRepository } from '../../../src/infrastructure/repositories/prisma-transicion-estado-repository';
import { InteresAcumulador } from '../../../src/domain/services/interes-acumulador';
import { ActualizarDeudasDiariamenteUseCase } from '../../../src/application/use-cases/actualizar-deudas-diariamente';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fechaReferencia } = body;

    // Validar fechaReferencia si se proporciona
    let fechaReferenciaDate: Date | undefined;
    if (fechaReferencia) {
      const parsedDate = new Date(fechaReferencia);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Fecha de referencia inválida' },
          { status: 400 }
        );
      }
      fechaReferenciaDate = parsedDate;
    }

    const deudaRepository = new PrismaDeudaRepository(prisma);
    const transicionEstadoRepository = new PrismaTransicionEstadoRepository(prisma);
    const interesAcumulador = new InteresAcumulador();

    const useCase = new ActualizarDeudasDiariamenteUseCase(
      deudaRepository,
      transicionEstadoRepository,
      interesAcumulador
    );

    const result = await useCase.execute({
      fechaReferencia: fechaReferenciaDate,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error actualizando deudas diariamente:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}