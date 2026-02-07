import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaDeudaRepository } from '../../../src/infrastructure/repositories/prisma-deuda-repository';
import { createAuthenticatedRouteHandler } from '../../../src/infrastructure/auth/auth-middleware';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AuthenticatedUser, UserRole } from '../../../src/infrastructure/auth/types';
import { EstadoDeuda } from '../../../src/domain/enums/estado-deuda';

// Validation schema for query parameters (list)
const listarDeudasSchema = z.object({
  gestorId: z.coerce.number().optional(),
  estadoId: z.coerce.number().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  const { searchParams } = new URL(request.url);
  const query = listarDeudasSchema.parse({
    gestorId: searchParams.get('gestorId'),
    estadoId: searchParams.get('estadoId'),
    search: searchParams.get('search'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  });

  const deudaRepository = new PrismaDeudaRepository(prisma);
  
  // Si es gestor, solo puede ver sus propias deudas
  const gestorId = user.role === 'gestor' ? Number(user.id) : query.gestorId;
  
  const { deudas, total } = await deudaRepository.buscarConPaginacion({
    gestorId,
    estadoId: query.estadoId,
    search: query.search,
    limit: query.limit,
    offset: query.offset,
  });

  return NextResponse.json({
    deudas: deudas.map(d => ({
      id: d.id,
      acreedor: d.acreedor,
      concepto: d.concepto,
      estadoActual: d.estadoActual,
      gestorAsignadoId: d.gestorAsignadoId,
      diasMora: d.diasMora,
      diasGestion: d.diasGestion,
      saldoCapitalTotal: d.saldoCapitalTotal,
      deudaTotal: d.deudaTotal,
      gastosCobranza: d.gastosCobranza,
      interesMoratorio: d.interesMoratorio,
      interesPunitorio: d.interesPunitorio,
      fechaUltimoPago: d.fechaUltimoPago,
      montoCuota: d.montoCuota,
      fechaAsignacionGestor: d.fechaAsignacionGestor,
      tasaInteresMoratorio: d.tasaInteresMoratorio,
      tasaInteresPunitorio: d.tasaInteresPunitorio,
      fechaExpiracionAcuerdo: d.fechaExpiracionAcuerdo,
      cuotas: d.cuotas.map(c => ({
        id: c.id,
        numeroCuota: c.numeroCuota,
        fechaVencimiento: c.fechaVencimiento,
        capitalOriginal: c.capitalOriginal,
        saldoCapital: c.saldoCapital,
        interesMoratorioAcumulado: c.interesMoratorioAcumulado,
        interesPunitorioAcumulado: c.interesPunitorioAcumulado,
        estadoCuota: c.estadoCuota,
        fechaUltimoPago: c.fechaUltimoPago,
        montoCuota: c.montoCuota,
      })),
    })),
    total,
    limit: query.limit,
    offset: query.offset,
  });
}

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});