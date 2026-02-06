import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaSolicitudAutorizacionRepository } from '../../../src/infrastructure/repositories/prisma-solicitud-autorizacion-repository';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { ResolverSolicitudAutorizacionUseCase } from '../../../src/application/use-cases/resolver-solicitud-autorizacion';
import { createAuthenticatedRouteHandler } from '../../../src/infrastructure/auth/auth-middleware';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { ValidationError, AppError } from '../../../src/domain/errors/app-error';
import { z } from 'zod';
import { AuthenticatedUser, UserRole } from '../../../src/infrastructure/auth/types';

// Schemas
const getAutorizacionesSchema = z.object({
  supervisorId: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

const resolveAutorizacionSchema = z.object({
  solicitudId: z.number(),
  supervisorId: z.number().optional(),
  aprobar: z.boolean(),
  comentarioSupervisor: z.string().optional(),
});

// Handlers
async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url);
  const supervisorId = url.searchParams.get('supervisorId');
  
  // Validate query parameters
  const { supervisorId: validatedSupervisorId } = getAutorizacionesSchema.parse({
    supervisorId,
  });

  // Determine target supervisor ID: use provided supervisorId or default to authenticated user's ID for supervisors
  const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
  let targetSupervisorId = validatedSupervisorId;
  
  if (targetSupervisorId === undefined) {
    if (user.role === 'supervisor') {
      targetSupervisorId = userId;
    } else {
      // Administrators must specify supervisorId
      throw new ValidationError('Parámetro supervisorId requerido para administradores');
    }
  }

  // Authorization: supervisors can only access their own requests
  // Administrators can access any supervisor's requests
  if (user.role === 'supervisor') {
    if (targetSupervisorId !== userId) {
      throw new AppError('Supervisores solo pueden acceder a sus propias solicitudes', 403, 'FORBIDDEN');
    }
  }

  const solicitudAutorizacionRepository = new PrismaSolicitudAutorizacionRepository(prisma);
  const solicitudes = await solicitudAutorizacionRepository.buscarPendientesPorSupervisor(targetSupervisorId);

  return NextResponse.json({ solicitudes }, { status: 200 });
}

async function POSTHandler(request: NextRequest, user: AuthenticatedUser) {
  const body = await validateRequestBody(request, resolveAutorizacionSchema);

  // Determine supervisorId: use provided supervisorId or default to authenticated user's ID
  const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
  const supervisorId = body.supervisorId ?? userId;
  
  // Authorization: supervisors can only resolve requests assigned to them
  // Administrators can resolve any request
  if (user.role === 'supervisor') {
    if (supervisorId !== userId) {
      throw new AppError('Supervisores solo pueden resolver solicitudes asignadas a ellos', 403, 'FORBIDDEN');
    }
  }

  const solicitudAutorizacionRepository = new PrismaSolicitudAutorizacionRepository(prisma);
  const deudaRepository = new PrismaDeudaRepository(prisma);

  const useCase = new ResolverSolicitudAutorizacionUseCase(
    solicitudAutorizacionRepository,
    deudaRepository,
  );

  const result = await useCase.execute({
    solicitudId: body.solicitudId,
    supervisorId,
    aprobar: body.aprobar,
    comentarioSupervisor: body.comentarioSupervisor,
  });

  return NextResponse.json(result, { status: 200 });
}

// Export wrapped handlers with authentication, error handling, logging, and rate limiting
export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['supervisor', 'administrador']
});

export const POST = createAuthenticatedRouteHandler(POSTHandler, {
  requiredRoles: ['supervisor', 'administrador']
});