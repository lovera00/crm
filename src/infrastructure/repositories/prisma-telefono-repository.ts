import { Telefono } from '../../domain/entities/telefono';
import { TelefonoRepository } from '../../domain/repositories/telefono-repository';
import { EstadoContacto } from '../../domain/enums/estado-contacto';
import { PrismaClient } from '../../generated/prisma';

export class PrismaTelefonoRepository implements TelefonoRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorId(id: number): Promise<Telefono | null> {
    const telefonoData = await this.prisma.telefono.findUnique({
      where: { id },
    });
    if (!telefonoData) return null;

    return Telefono.reconstruir({
      id: telefonoData.id,
      personaId: telefonoData.personaId,
      numero: telefonoData.numero,
      estado: telefonoData.estado as EstadoContacto,
      fechaModificacion: telefonoData.fechaModificacion,
    });
  }

  async buscarPorPersona(personaId: number): Promise<Telefono[]> {
    const telefonosData = await this.prisma.telefono.findMany({
      where: { personaId },
      orderBy: { id: 'asc' },
    });

    return telefonosData.map(t =>
      Telefono.reconstruir({
        id: t.id,
        personaId: t.personaId,
        numero: t.numero,
        estado: t.estado as EstadoContacto,
        fechaModificacion: t.fechaModificacion,
      })
    );
  }

  async guardar(telefono: Telefono): Promise<void> {
    const data = {
      personaId: telefono.personaId,
      numero: telefono.numero,
      estado: telefono.estado as any, // Prisma enum
      fechaModificacion: telefono.fechaModificacion ?? new Date(),
    };

    if (telefono.id) {
      await this.prisma.telefono.update({
        where: { id: telefono.id },
        data,
      });
    } else {
      await this.prisma.telefono.create({
        data,
      });
    }
  }

  async cambiarEstado(id: number, estado: EstadoContacto): Promise<void> {
    await this.prisma.telefono.update({
      where: { id },
      data: {
        estado: estado as any,
        fechaModificacion: new Date(),
      },
    });
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.telefono.delete({
      where: { id },
    });
  }
}