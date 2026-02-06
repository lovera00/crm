import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { PrismaPersonaRepository } from '../../../src/infrastructure/repositories/prisma-persona-repository';
import { CrearPersonaUseCase } from '../../../src/application/use-cases/crear-persona';
import { createAuthenticatedRouteHandler } from '../../../src/infrastructure/auth/auth-middleware';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { EstadoVerificacion } from '../../../src/domain/enums/estado-verificacion';
import { AuthenticatedUser, UserRole } from '../../../src/infrastructure/auth/types';

// Validation schema for creating a persona
const crearPersonaSchema = z.object({
  nombres: z.string().min(1, 'Nombres son requeridos'),
  apellidos: z.string().min(1, 'Apellidos son requeridos'),
  documento: z.string().min(1, 'Documento es requerido'),
  funcionarioPublico: z.nativeEnum(EstadoVerificacion).optional(),
  jubilado: z.nativeEnum(EstadoVerificacion).optional(),
  ipsActivo: z.nativeEnum(EstadoVerificacion).optional(),
  datosVarios: z.record(z.string(), z.any()).optional(),
});

type CrearPersonaInput = z.infer<typeof crearPersonaSchema>;

// Validation schema for query parameters (list)
const listarPersonasSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

async function POSTHandler(request: NextRequest, user: AuthenticatedUser) {
  const body = await validateRequestBody<CrearPersonaInput>(request, crearPersonaSchema);

  const personaRepository = new PrismaPersonaRepository(prisma);
  const useCase = new CrearPersonaUseCase(personaRepository);

  const result = await useCase.execute({
    nombres: body.nombres,
    apellidos: body.apellidos,
    documento: body.documento,
    funcionarioPublico: body.funcionarioPublico,
    jubilado: body.jubilado,
    ipsActivo: body.ipsActivo,
    datosVarios: body.datosVarios,
    // TODO: Add createdBy field to persona entity
    // For now, we can log the user who created this persona
  });

  return NextResponse.json(result, { status: 201 });
}

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  const { searchParams } = new URL(request.url);
  const query = listarPersonasSchema.parse({
    search: searchParams.get('search'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  });

  const personaRepository = new PrismaPersonaRepository(prisma);
  
  let personas;
  if (query.search) {
    personas = await personaRepository.buscarPorNombreOApellido(query.search);
  } else {
    // For simplicity, return empty array (we need pagination method in repository)
    // We'll implement a new method later
    personas = await personaRepository.buscarPorNombreOApellido('');
  }

  // Apply simple client-side pagination (not efficient)
  const paginated = personas.slice(query.offset, query.offset + query.limit);

  return NextResponse.json({
    personas: paginated.map(p => ({
      id: p.id,
      nombres: p.nombres,
      apellidos: p.apellidos,
      documento: p.documento,
      funcionarioPublico: p.funcionarioPublico,
      jubilado: p.jubilado,
      ipsActivo: p.ipsActivo,
    })),
    total: personas.length,
    limit: query.limit,
    offset: query.offset,
  });
}

export const POST = createAuthenticatedRouteHandler(POSTHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});