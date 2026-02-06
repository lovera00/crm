import { ReferenciaPersonal } from '../../domain/entities/referencia-personal';
import { ReferenciaPersonalRepository } from '../../domain/repositories/referencia-personal-repository';
import { EstadoContacto } from '../../domain/enums/estado-contacto';
import { PrismaClient } from '../../generated/prisma';

export class PrismaReferenciaPersonalRepository implements ReferenciaPersonalRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorId(id: number): Promise<ReferenciaPersonal | null> {
    const referenciaData = await this.prisma.referenciaPersonal.findUnique({
      where: { id },
    });
    if (!referenciaData) return null;

    return ReferenciaPersonal.reconstruir({
      id: referenciaData.id,
      personaId: referenciaData.personaId,
      nombre: referenciaData.nombre,
      parentesco: referenciaData.parentesco,
      telefono: referenciaData.telefono,
      estado: referenciaData.estado as EstadoContacto,
    });
  }

  async buscarPorPersona(personaId: number): Promise<ReferenciaPersonal[]> {
    const referenciasData = await this.prisma.referenciaPersonal.findMany({
      where: { personaId },
      orderBy: { id: 'asc' },
    });

    return referenciasData.map(rp =>
      ReferenciaPersonal.reconstruir({
        id: rp.id,
        personaId: rp.personaId,
        nombre: rp.nombre,
        parentesco: rp.parentesco,
        telefono: rp.telefono,
        estado: rp.estado as EstadoContacto,
      })
    );
  }

  async guardar(referencia: ReferenciaPersonal): Promise<void> {
    const data = {
      personaId: referencia.personaId,
      nombre: referencia.nombre,
      parentesco: referencia.parentesco,
      telefono: referencia.telefono,
      estado: referencia.estado as any, // Prisma enum
    };

    if (referencia.id) {
      await this.prisma.referenciaPersonal.update({
        where: { id: referencia.id },
        data,
      });
    } else {
      await this.prisma.referenciaPersonal.create({
        data,
      });
    }
  }

  async cambiarEstado(id: number, estado: EstadoContacto): Promise<void> {
    await this.prisma.referenciaPersonal.update({
      where: { id },
      data: {
        estado: estado as any,
        fechaModificacion: new Date(),
      },
    });
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.referenciaPersonal.delete({
      where: { id },
    });
  }
}