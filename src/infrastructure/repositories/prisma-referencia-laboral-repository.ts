import { ReferenciaLaboral } from '../../domain/entities/referencia-laboral';
import { ReferenciaLaboralRepository } from '../../domain/repositories/referencia-laboral-repository';
import { EstadoContacto } from '../../domain/enums/estado-contacto';
import { PrismaClient } from '../../generated/client';

export class PrismaReferenciaLaboralRepository implements ReferenciaLaboralRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorId(id: number): Promise<ReferenciaLaboral | null> {
    const referenciaData = await this.prisma.referenciaLaboral.findUnique({
      where: { id },
    });
    if (!referenciaData) return null;

    return ReferenciaLaboral.reconstruir({
      id: referenciaData.id,
      personaId: referenciaData.personaId,
      nombre: referenciaData.nombre,
      empresa: referenciaData.empresa ?? undefined,
      telefono: referenciaData.telefono,
      estado: referenciaData.estado as EstadoContacto,
    });
  }

  async buscarPorPersona(personaId: number): Promise<ReferenciaLaboral[]> {
    const referenciasData = await this.prisma.referenciaLaboral.findMany({
      where: { personaId },
      orderBy: { id: 'asc' },
    });

    return referenciasData.map(rl =>
      ReferenciaLaboral.reconstruir({
        id: rl.id,
        personaId: rl.personaId,
        nombre: rl.nombre,
        empresa: rl.empresa ?? undefined,
        telefono: rl.telefono,
        estado: rl.estado as EstadoContacto,
      })
    );
  }

  async guardar(referencia: ReferenciaLaboral): Promise<void> {
    const data = {
      personaId: referencia.personaId,
      nombre: referencia.nombre,
      empresa: referencia.empresa ?? null,
      telefono: referencia.telefono,
      estado: referencia.estado as any, // Prisma enum
    };

    if (referencia.id) {
      await this.prisma.referenciaLaboral.update({
        where: { id: referencia.id },
        data,
      });
    } else {
      await this.prisma.referenciaLaboral.create({
        data,
      });
    }
  }

  async cambiarEstado(id: number, estado: EstadoContacto): Promise<void> {
    await this.prisma.referenciaLaboral.update({
      where: { id },
      data: {
        estado: estado as any,
        fechaModificacion: new Date(),
      },
    });
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.referenciaLaboral.delete({
      where: { id },
    });
  }
}