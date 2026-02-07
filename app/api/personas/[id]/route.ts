import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/infrastructure/lib/prisma';
import { PrismaPersonaRepository } from '../../../../src/infrastructure/repositories/prisma-persona-repository';
import { createAuthenticatedRouteHandler } from '../../../../src/infrastructure/auth/auth-middleware';
import { AuthenticatedUser } from '../../../../src/infrastructure/auth/types';
import { AppError } from '../../../../src/domain/errors/app-error';

async function GETHandler(request: NextRequest, user: AuthenticatedUser) {
  // Extraer ID de la URL
  const pathname = request.nextUrl.pathname;
  const idMatch = pathname.match(/\/api\/personas\/(\d+)/);
  if (!idMatch) {
    throw new AppError('ID de persona inválido o no proporcionado', 400, 'VALIDATION_ERROR');
  }
  const id = parseInt(idMatch[1], 10);
  
  if (isNaN(id)) {
    throw new AppError('ID de persona inválido', 400, 'VALIDATION_ERROR');
  }

  const personaRepository = new PrismaPersonaRepository(prisma);
  const persona = await personaRepository.buscarPorId(id);

  if (!persona) {
    throw new AppError('Persona no encontrada', 404, 'NOT_FOUND');
  }

  // Autorización: todos los roles pueden ver personas (según matriz de permisos)
  // No se requieren checks adicionales

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
}

export const GET = createAuthenticatedRouteHandler(GETHandler, {
  requiredRoles: ['gestor', 'supervisor', 'administrador']
});