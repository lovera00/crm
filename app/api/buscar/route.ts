import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '@/src/domain/errors/app-error';

async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return {
    id: token.id as string,
    role: token.role as string,
  };
}

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q || q.length < 2) {
      return NextResponse.json({ personas: [], deudas: [] });
    }

    const searchTerm = q.trim();
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const personas = await prisma.persona.findMany({
      where: {
        OR: [
          { nombres: { contains: searchTerm, mode: 'insensitive' } },
          { apellidos: { contains: searchTerm, mode: 'insensitive' } },
          { documento: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        documento: true,
      },
      take: limit,
      orderBy: { id: 'desc' },
    });

    const deudas = await prisma.deudaMaestra.findMany({
      where: {
        OR: [
          { acreedor: { contains: searchTerm, mode: 'insensitive' } },
          { concepto: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        acreedor: true,
        concepto: true,
        saldoCapitalTotal: true,
        estadoActual: { select: { nombre: true } },
        personas: { select: { personaId: true } },
      },
      take: limit,
      orderBy: { id: 'desc' },
    });

    const deudasConPersona = await Promise.all(
      deudas.map(async (d) => {
        const personaDeuda = await prisma.personaDeuda.findFirst({
          where: { deudaMaestraId: d.id },
          select: { personaId: true },
        });
        return {
          id: d.id,
          acreedor: d.acreedor,
          concepto: d.concepto,
          saldoCapitalTotal: d.saldoCapitalTotal,
          estadoActual: d.estadoActual,
          personaId: personaDeuda?.personaId,
        };
      })
    );

    return NextResponse.json({ personas, deudas: deudasConPersona });
  } catch (error: any) {
    console.error('Error in global search:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
