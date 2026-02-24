import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../../src/domain/errors/app-error';
import { hash } from 'bcryptjs';

async function getAuthenticatedUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }
  if (token.role !== 'administrador') {
    throw new AppError('No autorizado', 403, 'FORBIDDEN');
  }
  return token;
}

function extractId(request: NextRequest): number {
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/usuarios\/(\d+)/);
  if (!idMatch) throw new AppError('ID inválido', 400, 'VALIDATION_ERROR');
  return parseInt(idMatch[1], 10);
}

export async function GET(request: NextRequest) {
  try {
    await getAuthenticatedUser(request);
    const id = extractId(request);

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        fechaCreacion: true,
        fechaModificacion: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error: any) {
    console.error('Error fetching usuario:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const id = extractId(request);
    const body = await request.json();

    const { nombre, email, rol, activo, password } = body;

    const existing = await prisma.usuario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // No permitir desactivar oneself
    if (id === parseInt(user.id as string, 10) && activo === false) {
      return NextResponse.json({ error: 'No puedes desactivarte a ti mismo' }, { status: 400 });
    }

    const updateData: any = {
      nombre: nombre || existing.nombre,
      email: email || existing.email,
      rol: rol || existing.rol,
      activo: activo !== undefined ? activo : existing.activo,
    };

    if (password) {
      updateData.passwordHash = await hash(password, 10);
    }

    const updated = await prisma.usuario.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      nombre: updated.nombre,
      rol: updated.rol,
      activo: updated.activo,
    });
  } catch (error: any) {
    console.error('Error updating usuario:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const id = extractId(request);

    // No permitir eliminarse a sí mismo
    if (id === parseInt(user.id as string, 10)) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    const existing = await prisma.usuario.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Soft delete
    await prisma.usuario.update({
      where: { id },
      data: {
        activo: false,
      },
    });

    return NextResponse.json({ message: 'Usuario desactivado' });
  } catch (error: any) {
    console.error('Error deleting usuario:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
