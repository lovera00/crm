import { Seguimiento } from '../../domain/entities/seguimiento';
import { SeguimientoRepository } from '../../domain/repositories/seguimiento-repository';
import { PrismaClient } from '../../generated/prisma';

export class PrismaSeguimientoRepository implements SeguimientoRepository {
  constructor(private prisma: PrismaClient) {}

  async guardar(seguimiento: Seguimiento): Promise<void> {
    await this.prisma.seguimiento.create({
      data: {
        gestorId: seguimiento.gestorId,
        personaId: seguimiento.personaId,
        tipoGestionId: seguimiento.tipoGestionId,
        fechaHora: seguimiento.fechaHora,
        observacion: seguimiento.observacion,
        requiereSeguimiento: seguimiento.requiereSeguimiento,
        fechaProximoSeguimiento: seguimiento.fechaProximoSeguimiento,
      },
    });
  }
}
