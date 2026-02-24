import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AppError } from '../../../src/domain/errors/app-error';

const crearTelefonoSchema = z.object({
  personaId: z.number().min(1, 'Persona requerida'),
  numero: z.string().min(1, 'Número requerido'),
  observacion: z.string().optional(),
});

type CrearTelefonoInput = z.infer<typeof crearTelefonoSchema>;

async function POSTHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const body = await validateRequestBody<CrearTelefonoInput>(request, crearTelefonoSchema);

  const persona = await prisma.persona.findUnique({
    where: { id: body.personaId },
  });

  if (!persona) {
    throw new AppError('Persona no encontrada', 404, 'NOT_FOUND');
  }

  const telefono = await prisma.telefono.create({
    data: {
      personaId: body.personaId,
      numero: body.numero,
      observacion: body.observacion || null,
      creadoPorId: parseInt(token.id as string, 10),
    },
  });

  return NextResponse.json({
    id: telefono.id,
    personaId: telefono.personaId,
    numero: telefono.numero,
    observacion: telefono.observacion,
    estado: telefono.estado,
    fechaCreacion: telefono.fechaCreacion,
  }, { status: 201 });
}

export { POSTHandler as POST };
