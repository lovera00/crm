import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AppError } from '../../../src/domain/errors/app-error';

const crearReferenciaSchema = z.object({
  personaId: z.number().min(1),
  nombre: z.string().min(1),
  parentesco: z.string().optional(),
  telefono: z.string().min(1),
  empresa: z.string().optional(),
  observacion: z.string().optional(),
});

async function POSTHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const body = await validateRequestBody(request, crearReferenciaSchema);
  const referencia = await prisma.referenciaPersonal.create({
    data: {
      personaId: body.personaId,
      nombre: body.nombre,
      parentesco: body.parentesco || '',
      telefono: body.telefono,
      observacion: body.observacion || null,
      creadoPorId: parseInt(token.id as string, 10),
    },
  });
  return NextResponse.json({
    id: referencia.id,
    personaId: referencia.personaId,
    nombre: referencia.nombre,
    parentesco: referencia.parentesco,
    telefono: referencia.telefono,
    observacion: referencia.observacion,
    estado: referencia.estado,
    fechaCreacion: referencia.fechaCreacion,
  }, { status: 201 });
}

export { POSTHandler as POST };
