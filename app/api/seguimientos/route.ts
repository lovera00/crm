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
import { createRouteHandler, createProtectedRouteHandler, validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';

// Validation schema for creating a seguimiento
const crearSeguimientoSchema = z.object({
  gestorId: z.number(),
  personaId: z.number(),
  deudaIds: z.array(z.number()).min(1, 'Debe incluir al menos una deuda'),
  tipoGestionId: z.number(),
  observacion: z.string().optional(),
  requiereSeguimiento: z.boolean().optional(),
  fechaProximoSeguimiento: z.string().datetime().optional(),
});

type CrearSeguimientoInput = z.infer<typeof crearSeguimientoSchema>;

async function POSTHandler(request: NextRequest) {
  const body = await validateRequestBody<CrearSeguimientoInput>(request, crearSeguimientoSchema);

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
    gestorId: body.gestorId,
    personaId: body.personaId,
    deudaIds: body.deudaIds,
    tipoGestionId: body.tipoGestionId,
    observacion: body.observacion,
    requiereSeguimiento: body.requiereSeguimiento,
    fechaProximoSeguimiento: body.fechaProximoSeguimiento ? new Date(body.fechaProximoSeguimiento) : undefined,
  });

  return NextResponse.json(result, { status: 201 });
}

// Export wrapped handler with error handling, logging, and rate limiting
export const POST = createProtectedRouteHandler(POSTHandler);
