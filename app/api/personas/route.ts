import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../src/domain/errors/app-error';

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

const crearPersonaSchema = z.object({
  nombres: z.string().min(1, 'Nombres son requeridos'),
  apellidos: z.string().min(1, 'Apellidos son requeridos'),
  documento: z.string().min(1, 'Documento es requerido'),
  datosVarios: z.record(z.string(), z.any()).optional(),
});

type CrearPersonaInput = z.infer<typeof crearPersonaSchema>;

const listarPersonasSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  fp: z.enum(['SI', 'NO']).optional(),
  jubilado: z.enum(['SI', 'NO']).optional(),
  ips: z.enum(['SI', 'NO']).optional(),
  tieneDeudas: z.enum(['SI', 'NO']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const query = listarPersonasSchema.parse({
      search: searchParams.get('search'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      fp: searchParams.get('fp') as any,
      jubilado: searchParams.get('jubilado') as any,
      ips: searchParams.get('ips') as any,
      tieneDeudas: searchParams.get('tieneDeudas') as any,
    });

    const whereClause: any = {};
    if (query.search) {
      whereClause.OR = [
        { nombres: { contains: query.search, mode: 'insensitive' } },
        { apellidos: { contains: query.search, mode: 'insensitive' } },
        { documento: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.fp) {
      whereClause.funcionarioPublico = query.fp;
    }
    if (query.jubilado) {
      whereClause.jubilado = query.jubilado;
    }
    if (query.ips) {
      whereClause.ipsActivo = query.ips;
    }

    let personasData = await prisma.persona.findMany({
      where: whereClause,
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        documento: true,
        telefonos: { take: 1, orderBy: { fechaCreacion: 'desc' } },
        emails: { take: 1, orderBy: { fechaCreacion: 'desc' } },
        funcionarioPublico: true,
        jubilado: true,
        ipsActivo: true,
      },
      skip: query.offset,
      take: query.limit,
      orderBy: { id: 'desc' },
    });

    // Filtrar por tieneDeudas si se especifica
    if (query.tieneDeudas) {
      const personasConDeudas = await prisma.personaDeuda.findMany({
        where: { personaId: { in: personasData.map(p => p.id) } },
        select: { personaId: true },
      });
      const idsConDeudas = new Set(personasConDeudas.map(p => p.personaId));
      
      if (query.tieneDeudas === 'SI') {
        personasData = personasData.filter(p => idsConDeudas.has(p.id));
      } else {
        personasData = personasData.filter(p => !idsConDeudas.has(p.id));
      }
    }

    // Obtener conteo de deudas
    const personaIds = personasData.map(p => p.id);
    const deudaCounts = await prisma.personaDeuda.groupBy({
      by: ['personaId'],
      where: { personaId: { in: personaIds } },
      _count: { id: true },
    });
    const deudaCountMap = new Map(deudaCounts.map(d => [d.personaId, d._count.id]));

    const personasWithDeudaCount = personasData.map(p => ({
      id: p.id,
      nombres: p.nombres,
      apellidos: p.apellidos,
      documento: p.documento,
      telefonos: p.telefonos,
      emails: p.emails,
      funcionarioPublico: p.funcionarioPublico,
      jubilado: p.jubilado,
      ipsActivo: p.ipsActivo,
      deudaCount: deudaCountMap.get(p.id) || 0,
    }));

    return NextResponse.json({
      personas: personasWithDeudaCount,
      total: personasWithDeudaCount.length,
      limit: query.limit,
      offset: query.offset,
    });
  } catch (error: any) {
    console.error('Error fetching personas:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    if (user.role !== 'gestor' && user.role !== 'supervisor' && user.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await validateRequestBody<CrearPersonaInput>(request, crearPersonaSchema);

    const nuevaPersona = await prisma.persona.create({
      data: {
        nombres: body.nombres,
        apellidos: body.apellidos,
        documento: body.documento,
        datosVarios: body.datosVarios,
        creadoPorId: parseInt(user.id, 10),
      },
    });

    return NextResponse.json({
      id: nuevaPersona.id,
      nombres: nuevaPersona.nombres,
      apellidos: nuevaPersona.apellidos,
      documento: nuevaPersona.documento,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating persona:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
