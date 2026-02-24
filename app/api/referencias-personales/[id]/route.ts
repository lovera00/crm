import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { validateRequestBody } from '../../../../src/infrastructure/middleware/with-error-handler';
import { z } from 'zod';
import { AppError } from '../../../../src/domain/errors/app-error';

const actualizarReferenciaPersonalSchema = z.object({
  nombre: z.string().min(1).optional(),
  parentesco: z.string().optional(),
  telefono: z.string().min(1).optional(),
  observacion: z.string().optional(),
  estado: z.enum(['Pendiente_de_Verificacion', 'Activo', 'Inactivo']).optional(),
});

function extractId(request: NextRequest): number {
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/referencias-personales\/(\d+)/);
  if (!idMatch) throw new AppError('ID inválido', 400, 'VALIDATION_ERROR');
  return parseInt(idMatch[1], 10);
}

async function GETHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  
  const id = extractId(request);
  const referencia = await prisma.referenciaPersonal.findUnique({ where: { id } });
  if (!referencia) throw new AppError('Referencia personal no encontrada', 404, 'NOT_FOUND');
  return NextResponse.json(referencia);
}

async function PUTHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  
  const id = extractId(request);
  const body = await validateRequestBody(request, actualizarReferenciaPersonalSchema);
  
  const referencia = await prisma.referenciaPersonal.update({
    where: { id },
    data: { ...body, modificadoPorId: parseInt(token.id as string, 10) },
  });
  return NextResponse.json(referencia);
}

async function DELETEHandler(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  
  const id = extractId(request);
  await prisma.referenciaPersonal.delete({ where: { id } });
  return NextResponse.json({ message: 'Referencia personal eliminada' });
}

export { GETHandler as GET, PUTHandler as PUT, DELETEHandler as DELETE };
