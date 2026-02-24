import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { validateRequestBody } from '../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AppError } from '../../../src/domain/errors/app-error';

const crearEmailSchema = z.object({
  personaId: z.number().min(1),
  email: z.string().email('Email inválido'),
  observacion: z.string().optional(),
});

async function POSTHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const body = await validateRequestBody(request, crearEmailSchema);
  const email = await prisma.email.create({
    data: { 
      personaId: body.personaId, 
      email: body.email,
      observacion: body.observacion || null,
      creadoPorId: parseInt(token.id as string, 10) 
    },
  });
  return NextResponse.json({
    id: email.id,
    personaId: email.personaId,
    email: email.email,
    observacion: email.observacion,
    estado: email.estado,
    fechaCreacion: email.fechaCreacion,
  }, { status: 201 });
}

export { POSTHandler as POST };
