import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { PrismaDeudaRepository } from '../../../../src/infrastructure/repositories/prisma-deuda-repository';
import { createAuthenticatedRouteHandler } from '../../../../src/infrastructure/auth/auth-middleware';
import { AuthenticatedUser } from '../../../../src/infrastructure/auth/types';

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  // Extraer ID de la URL
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/deudas\/(\d+)/);
  if (!idMatch) {
    return NextResponse.json(
      { error: 'ID de deuda inválido o no proporcionado' },
      { status: 400 }
    );
  }
  const id = parseInt(idMatch[1], 10);
  
  if (isNaN(id)) {
    return NextResponse.json(
      { error: 'ID de deuda inválido' },
      { status: 400 }
    );
  }

  const deudaRepository = new PrismaDeudaRepository(prisma);
  const deuda = await deudaRepository.buscarPorId(id);

  if (!deuda) {
    return NextResponse.json(
      { error: 'Deuda no encontrada' },
      { status: 404 }
    );
  }

  // Verificar permisos: gestores solo pueden ver sus propias deudas
  if (user.role === 'gestor' && deuda.gestorAsignadoId !== Number(user.id)) {
    return NextResponse.json(
      { error: 'No tienes permiso para ver esta deuda' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    id: deuda.id,
    acreedor: deuda.acreedor,
    concepto: deuda.concepto,
    estadoActual: deuda.estadoActual,
    gestorAsignadoId: deuda.gestorAsignadoId,
    diasMora: deuda.diasMora,
    diasGestion: deuda.diasGestion,
    saldoCapitalTotal: deuda.saldoCapitalTotal,
    deudaTotal: deuda.deudaTotal,
    gastosCobranza: deuda.gastosCobranza,
    interesMoratorio: deuda.interesMoratorio,
    interesPunitorio: deuda.interesPunitorio,
    fechaUltimoPago: deuda.fechaUltimoPago,
    montoCuota: deuda.montoCuota,
    fechaAsignacionGestor: deuda.fechaAsignacionGestor,
    tasaInteresMoratorio: deuda.tasaInteresMoratorio,
    tasaInteresPunitorio: deuda.tasaInteresPunitorio,
    fechaExpiracionAcuerdo: deuda.fechaExpiracionAcuerdo,
    cuotas: deuda.cuotas.map(c => ({
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
  });
}

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});