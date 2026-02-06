import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { PrismaTransicionEstadoRepository } from '../../../src/infrastructure/repositories/prisma-transicion-estado-repository';
import { InteresAcumulador } from '../../../src/domain/services/interes-acumulador';
import { ActualizarDeudasDiariamenteUseCase } from '../../../src/application/use-cases/actualizar-deudas-diariamente';
import { createRouteHandler, createProtectedRouteHandler, validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';

// Validation schema for request body
const updateDebtsSchema = z.object({
  fechaReferencia: z.string().datetime().optional(),
});

type UpdateDebtsInput = z.infer<typeof updateDebtsSchema>;

async function POSTHandler(request: NextRequest) {
  // Validate request body
  const { fechaReferencia } = await validateRequestBody<UpdateDebtsInput>(request, updateDebtsSchema);
  
  // Parse fechaReferencia if provided
  let fechaReferenciaDate: Date | undefined;
  if (fechaReferencia) {
    fechaReferenciaDate = new Date(fechaReferencia);
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
}

// Export wrapped handler with error handling, logging, and rate limiting
export const POST = createProtectedRouteHandler(POSTHandler, {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10, // Max 10 requests per minute
});