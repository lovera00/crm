import { TransicionEstadoRepository, TransicionEstado } from '../../domain/repositories/transicion-estado-repository';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';
import { PrismaClient } from '../../generated/prisma/client';

export class PrismaTransicionEstadoRepository implements TransicionEstadoRepository {
  constructor(private prisma: PrismaClient) {}

  async esTransicionValida(estadoOrigen: EstadoDeuda, estadoDestino: EstadoDeuda): Promise<boolean> {
    const transicion = await this.prisma.transicionEstado.findFirst({
      where: {
        estadoOrigen: { nombre: estadoOrigen },
        estadoDestino: { nombre: estadoDestino },
        activo: true,
      },
    });
    return transicion !== null;
  }

  async obtenerTransicionesDesde(estadoOrigen: EstadoDeuda): Promise<TransicionEstado[]> {
    const transiciones = await this.prisma.transicionEstado.findMany({
      where: {
        estadoOrigen: { nombre: estadoOrigen },
        activo: true,
      },
      include: {
        estadoOrigen: true,
        estadoDestino: true,
      },
    });

    return transiciones.map((t: any) => ({
      estadoOrigen: t.estadoOrigen.nombre as EstadoDeuda,
      estadoDestino: t.estadoDestino.nombre as EstadoDeuda,
      requiereAutorizacion: t.requiereAutorizacion,
      descripcion: t.descripcion ?? undefined,
    }));
  }

  async obtenerTransicion(estadoOrigen: EstadoDeuda, estadoDestino: EstadoDeuda): Promise<TransicionEstado | null> {
    const transicion = await this.prisma.transicionEstado.findFirst({
      where: {
        estadoOrigen: { nombre: estadoOrigen },
        estadoDestino: { nombre: estadoDestino },
        activo: true,
      },
      include: {
        estadoOrigen: true,
        estadoDestino: true,
      },
    });

    if (!transicion) return null;

    return {
      estadoOrigen: transicion.estadoOrigen.nombre as EstadoDeuda,
      estadoDestino: transicion.estadoDestino.nombre as EstadoDeuda,
      requiereAutorizacion: transicion.requiereAutorizacion,
      descripcion: transicion.descripcion ?? undefined,
    };
  }
}