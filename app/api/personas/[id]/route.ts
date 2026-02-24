import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../../src/domain/errors/app-error';

async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  return token;
}

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    
    const pathname = request.nextUrl.pathname;
    const idMatch = pathname.match(/\/api\/personas\/(\d+)/);
    if (!idMatch) {
      throw new AppError('ID de persona inválido', 400, 'VALIDATION_ERROR');
    }
    const id = parseInt(idMatch[1], 10);
    
    if (isNaN(id)) {
      throw new AppError('ID de persona inválido', 400, 'VALIDATION_ERROR');
    }

    const persona = await prisma.persona.findUnique({
      where: { id },
      include: {
        creadoPor: { select: { nombre: true } },
        modificadoPor: { select: { nombre: true } },
        telefonos: { orderBy: { fechaCreacion: 'desc' } },
        emails: { orderBy: { fechaCreacion: 'desc' } },
        referenciasPersonales: { orderBy: { fechaCreacion: 'desc' } },
        referenciasLaborales: { orderBy: { fechaCreacion: 'desc' } },
      },
    });

    if (!persona) {
      throw new AppError('Persona no encontrada', 404, 'NOT_FOUND');
    }

    return NextResponse.json({
      id: persona.id,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      documento: persona.documento,
      funcionarioPublico: persona.funcionarioPublico,
      fechaModFuncionario: persona.fechaModFuncionario,
      jubilado: persona.jubilado,
      fechaModJubilado: persona.fechaModJubilado,
      ipsActivo: persona.ipsActivo,
      fechaModIps: persona.fechaModIps,
      datosVarios: persona.datosVarios,
      fechaCreacion: persona.fechaCreacion,
      creadoPor: persona.creadoPor?.nombre || 'Sistema',
      modificadoPor: persona.modificadoPor?.nombre || null,
      telefonos: persona.telefonos.map(t => ({
        id: t.id,
        numero: t.numero,
        estado: t.estado,
        fechaModificacion: t.fechaModificacion,
      })),
      emails: persona.emails.map(e => ({
        id: e.id,
        email: e.email,
        estado: e.estado,
        fechaModificacion: e.fechaModificacion,
      })),
      referenciasPersonales: persona.referenciasPersonales.map(rp => ({
        id: rp.id,
        nombre: rp.nombre,
        parentesco: rp.parentesco,
        telefono: rp.telefono,
        estado: rp.estado,
      })),
      referenciasLaborales: persona.referenciasLaborales.map(rl => ({
        id: rl.id,
        nombre: rl.nombre,
        empresa: rl.empresa,
        telefono: rl.telefono,
        estado: rl.estado,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching persona:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
