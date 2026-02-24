import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/infrastructure/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { AppError } from '../../../src/domain/errors/app-error';
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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    
    const usuarios = await prisma.usuario.findMany({
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
      orderBy: { nombre: 'asc' },
    });

    return NextResponse.json({ usuarios });
  } catch (error: any) {
    console.error('Error fetching usuarios:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();

    const { username, email, nombre, rol, password } = body;

    if (!username || !email || !nombre || !rol || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (!['gestor', 'supervisor', 'administrador'].includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }

    const existing = await prisma.usuario.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Usuario o email ya existe' }, { status: 400 });
    }

    const passwordHash = await hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        username,
        email,
        nombre,
        rol,
        passwordHash,
        activo: true,
      },
    });

    return NextResponse.json({
      id: nuevoUsuario.id,
      username: nuevoUsuario.username,
      email: nuevoUsuario.email,
      nombre: nuevoUsuario.nombre,
      rol: nuevoUsuario.rol,
      activo: nuevoUsuario.activo,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating usuario:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
