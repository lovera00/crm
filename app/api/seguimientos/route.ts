import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { PrismaSeguimientoRepository } from '../../../src/infrastructure/repositories/prisma-seguimiento-repository';
import { PrismaReglaTransicionRepository } from '../../../src/infrastructure/repositories/prisma-regla-transicion-repository';
import { PrismaTransicionEstadoRepository } from '../../../src/infrastructure/repositories/prisma-transicion-estado-repository';
import { PrismaSolicitudAutorizacionRepository } from '../../../src/infrastructure/repositories/prisma-solicitud-autorizacion-repository';
import { PrismaUsuarioRepository } from '../../../src/infrastructure/repositories/prisma-usuario-repository';
import { AsignadorSupervisor } from '../../../src/domain/services/asignador-supervisor';
import { CrearSeguimientoUseCase } from '../../../src/application/use-cases/crear-seguimiento';
import { createAuthenticatedRouteHandler } from '../../../src/infrastructure/auth/auth-middleware';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AuthenticatedUser, UserRole } from '../../../src/infrastructure/auth/types';
import { AppError } from '../../../src/domain/errors/app-error';

// Validation schema for creating a seguimiento
const crearSeguimientoSchema = z.object({
  gestorId: z.number().optional(),
  personaId: z.number(),
  deudaIds: z.array(z.number()).min(1, 'Debe incluir al menos una deuda'),
  tipoGestionId: z.number(),
  observacion: z.string().optional(),
  requiereSeguimiento: z.boolean().optional(),
  fechaProximoSeguimiento: z.string().optional(),
});

type CrearSeguimientoInput = z.infer<typeof crearSeguimientoSchema>;

async function POSTHandler(request: NextRequest, user: AuthenticatedUser) {
  const body = await validateRequestBody<CrearSeguimientoInput>(request, crearSeguimientoSchema);
  
  // Determine gestorId: use provided gestorId or default to authenticated user's ID
  const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
  const gestorId = body.gestorId ?? userId;
  
  // Authorization: gestores can only create seguimientos for themselves
  // Supervisors and administrators can create seguimientos for any gestor
  if (user.role === 'gestor') {
    if (gestorId !== userId) {
      throw new AppError('Gestores solo pueden crear seguimientos para sí mismos', 403, 'FORBIDDEN');
    }
  }

  const deudaRepository = new PrismaDeudaRepository(prisma);
  const seguimientoRepository = new PrismaSeguimientoRepository(prisma);
  const reglaTransicionRepository = new PrismaReglaTransicionRepository(prisma);
  const transicionEstadoRepository = new PrismaTransicionEstadoRepository(prisma);
  const solicitudAutorizacionRepository = new PrismaSolicitudAutorizacionRepository(prisma);
  const usuarioRepository = new PrismaUsuarioRepository(prisma);
  const asignadorSupervisor = new AsignadorSupervisor(usuarioRepository);

  const useCase = new CrearSeguimientoUseCase(
    deudaRepository,
    seguimientoRepository,
    reglaTransicionRepository,
    transicionEstadoRepository,
    solicitudAutorizacionRepository,
    asignadorSupervisor,
  );

  const result = await useCase.execute({
    gestorId,
    personaId: body.personaId,
    deudaIds: body.deudaIds,
    tipoGestionId: body.tipoGestionId,
    observacion: body.observacion,
    requiereSeguimiento: body.requiereSeguimiento,
    fechaProximoSeguimiento: body.fechaProximoSeguimiento ? new Date(body.fechaProximoSeguimiento) : undefined,
  });

  return NextResponse.json(result, { status: 201 });
}

// Export wrapped handler with authentication, error handling, logging, and rate limiting
export const POST = createAuthenticatedRouteHandler(POSTHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});
