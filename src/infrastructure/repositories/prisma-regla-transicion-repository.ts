import { ReglaTransicion } from '../../domain/entities/regla-transicion';
import { ReglaTransicionRepository } from '../../domain/repositories/regla-transicion-repository';
import { PrismaClient } from '../../generated/prisma/client';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';

export class PrismaReglaTransicionRepository implements ReglaTransicionRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorTipoGestion(tipoGestionId: number): Promise<ReglaTransicion[]> {
    const reglas = await this.prisma.reglaTransicion.findMany({
      where: { tipoGestionId, activo: true },
      include: { estadoOrigen: true, estadoDestino: true },
    });

    return reglas.map((regla: any) => ReglaTransicion.reconstruir({
      id: regla.id,
      tipoGestionId: regla.tipoGestionId,
      estadoOrigen: regla.estadoOrigen?.nombre as EstadoDeuda || null,
      estadoDestino: regla.estadoDestino?.nombre as EstadoDeuda || null,
      requiereAutorizacion: regla.requiereAutorizacion,
      mensajeUi: regla.mensajeUi || undefined,
      validacionAdicional: regla.validacionAdicional as any,
      activo: regla.activo,
    }));
  }
}
