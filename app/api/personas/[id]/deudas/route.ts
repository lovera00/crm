import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../../../src/domain/errors/app-error';

async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return token;
}

function extractId(request: NextRequest): number {
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/personas\/(\d+)\/deudas/);
  if (!idMatch) throw new Error('ID inválido');
  return parseInt(idMatch[1], 10);
}

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    const personaId = extractId(request);

    const personaDeudas = await prisma.personaDeuda.findMany({
      where: { personaId },
      include: {
        deudaMaestra: {
          include: {
            estadoActual: { select: { id: true, nombre: true, orden: true } },
            gestorAsignado: { select: { id: true, nombre: true } },
            cuotas: { orderBy: { numeroCuota: 'asc' } },
          },
        },
      },
    });

    const deudas = personaDeudas.map(pd => ({
      id: pd.deudaMaestra.id,
      esDeudorPrincipal: pd.esDeudorPrincipal,
      acreedor: pd.deudaMaestra.acreedor,
      concepto: pd.deudaMaestra.concepto,
      saldoCapitalTotal: pd.deudaMaestra.saldoCapitalTotal,
      deudaTotal: pd.deudaMaestra.deudaTotal,
      diasMora: pd.deudaMaestra.diasMora,
      diasGestion: pd.deudaMaestra.diasGestion,
      estadoActual: {
        id: pd.deudaMaestra.estadoActual.id,
        nombre: pd.deudaMaestra.estadoActual.nombre,
        orden: pd.deudaMaestra.estadoActual.orden,
      },
      montoCuota: pd.deudaMaestra.montoCuota,
      fechaUltimoPago: pd.deudaMaestra.fechaUltimoPago,
      gestorAsignado: pd.deudaMaestra.gestorAsignado 
        ? { id: pd.deudaMaestra.gestorAsignado.id, nombre: pd.deudaMaestra.gestorAsignado.nombre }
        : null,
      cuotas: pd.deudaMaestra.cuotas.map(c => ({
        id: c.id,
        numeroCuota: c.numeroCuota,
        fechaVencimiento: c.fechaVencimiento,
        capitalOriginal: c.capitalOriginal,
        saldoCapital: c.saldoCapital,
        interesMoratorioAcumulado: c.interesMoratorioAcumulado,
        interesPunitorioAcumulado: c.interesPunitorioAcumulado,
        estadoCuota: c.estadoCuota,
        montoCuota: c.montoCuota,
      })),
    }));

    return NextResponse.json({ deudas });
  } catch (error: any) {
    console.error('Error fetching deudas:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
