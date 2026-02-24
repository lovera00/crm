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
});

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const query = listarPersonasSchema.parse({
      search: searchParams.get('search'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    const whereClause: any = {};
    if (query.search) {
      whereClause.OR = [
        { nombres: { contains: query.search, mode: 'insensitive' } },
        { apellidos: { contains: query.search, mode: 'insensitive' } },
        { documento: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [personasData, total] = await Promise.all([
      prisma.persona.findMany({
        where: whereClause,
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          documento: true,
        },
        skip: query.offset,
        take: query.limit,
        orderBy: { id: 'desc' },
      }),
      prisma.persona.count({ where: whereClause }),
    ]);

    const personasWithDeudaCount = await Promise.all(
      personasData.map(async (p) => {
        const deudaCount = await prisma.personaDeuda.count({
          where: { personaId: p.id },
        });
        return {
          id: p.id,
          nombres: p.nombres,
          apellidos: p.apellidos,
          documento: p.documento,
          deudaCount,
        };
      })
    );

    return NextResponse.json({
      personas: personasWithDeudaCount,
      total,
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
