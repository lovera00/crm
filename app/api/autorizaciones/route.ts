import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaSolicitudAutorizacionRepository } from '../../../src/infrastructure/repositories/prisma-solicitud-autorizacion-repository';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { ResolverSolicitudAutorizacionUseCase } from '../../../src/application/use-cases/resolver-solicitud-autorizacion';
import { createRouteHandler, createProtectedRouteHandler, validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { ValidationError } from '../../../src/domain/errors/app-error';
import { z } from 'zod';

// Schemas
const getAutorizacionesSchema = z.object({
  supervisorId: z.string().transform((val) => parseInt(val, 10)),
});

const resolveAutorizacionSchema = z.object({
  solicitudId: z.number(),
  supervisorId: z.number(),
  aprobar: z.boolean(),
  comentarioSupervisor: z.string().optional(),
});

// Handlers
async function GETHandler(request: NextRequest) {
  const url = new URL(request.url);
  const supervisorId = url.searchParams.get('supervisorId');
  
  if (!supervisorId) {
    throw new ValidationError('Parámetro supervisorId requerido');
  }

  // Validate query parameters
  const { supervisorId: validatedSupervisorId } = getAutorizacionesSchema.parse({
    supervisorId,
  });

  const solicitudAutorizacionRepository = new PrismaSolicitudAutorizacionRepository(prisma);
  const solicitudes = await solicitudAutorizacionRepository.buscarPendientesPorSupervisor(validatedSupervisorId);

  return NextResponse.json({ solicitudes }, { status: 200 });
}

async function POSTHandler(request: NextRequest) {
  const body = await validateRequestBody(request, resolveAutorizacionSchema);

  const solicitudAutorizacionRepository = new PrismaSolicitudAutorizacionRepository(prisma);
  const deudaRepository = new PrismaDeudaRepository(prisma);

  const useCase = new ResolverSolicitudAutorizacionUseCase(
    solicitudAutorizacionRepository,
    deudaRepository,
  );

  const result = await useCase.execute(body);

  return NextResponse.json(result, { status: 200 });
}

// Export wrapped handlers with error handling, logging, and rate limiting
export const GET = createProtectedRouteHandler(GETHandler);
export const POST = createProtectedRouteHandler(POSTHandler);