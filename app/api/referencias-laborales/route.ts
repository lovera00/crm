import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AppError } from '../../../src/domain/errors/app-error';

const crearReferenciaLaboralSchema = z.object({
  personaId: z.number().min(1, 'Persona requerida'),
  nombre: z.string().min(1, 'Nombre requerido'),
  empresa: z.string().optional(),
  telefono: z.string().min(1, 'Teléfono requerido'),
});

type CrearReferenciaLaboralInput = z.infer<typeof crearReferenciaLaboralSchema>;

async function POSTHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const body = await validateRequestBody<CrearReferenciaLaboralInput>(request, crearReferenciaLaboralSchema);

  const persona = await prisma.persona.findUnique({
    where: { id: body.personaId },
  });

  if (!persona) {
    throw new AppError('Persona no encontrada', 404, 'NOT_FOUND');
  }

  const referencia = await prisma.referenciaLaboral.create({
    data: {
      personaId: body.personaId,
      nombre: body.nombre,
      empresa: body.empresa || null,
      telefono: body.telefono,
      creadoPorId: parseInt(token.id as string, 10),
    },
  });

  return NextResponse.json({
    id: referencia.id,
    personaId: referencia.personaId,
    nombre: referencia.nombre,
    empresa: referencia.empresa,
    telefono: referencia.telefono,
    estado: referencia.estado,
    fechaCreacion: referencia.fechaCreacion,
  }, { status: 201 });
}

export { POSTHandler as POST };
