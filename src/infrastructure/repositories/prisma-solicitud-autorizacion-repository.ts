import { SolicitudAutorizacionRepository } from '../../domain/repositories/solicitud-autorizacion-repository';
import { SolicitudAutorizacion } from '../../domain/entities/solicitud-autorizacion';
import { EstadoSolicitud } from '../../domain/enums/estado-solicitud';
import { PrioridadSolicitud } from '../../domain/enums/prioridad-solicitud';
import { PrismaClient } from '../../generated/client';

export class PrismaSolicitudAutorizacionRepository implements SolicitudAutorizacionRepository {
  constructor(private prisma: PrismaClient) {}

  async crear(solicitud: SolicitudAutorizacion): Promise<SolicitudAutorizacion> {
    // Obtener IDs de estados
    const estadoOrigen = await this.prisma.estadoDeuda.findUnique({
      where: { nombre: solicitud.estadoOrigen },
    });
    if (!estadoOrigen) {
      throw new Error(`Estado de deuda '${solicitud.estadoOrigen}' no encontrado`);
    }

    const estadoDestino = await this.prisma.estadoDeuda.findUnique({
      where: { nombre: solicitud.estadoDestino },
    });
    if (!estadoDestino) {
      throw new Error(`Estado de deuda '${solicitud.estadoDestino}' no encontrado`);
    }

    const solicitudData = await this.prisma.solicitudAutorizacion.create({
      data: {
        seguimientoId: solicitud.seguimientoId,
        deudaMaestraId: solicitud.deudaMaestraId,
        estadoOrigenId: estadoOrigen.id,
        estadoDestinoId: estadoDestino.id,
        gestorSolicitanteId: solicitud.gestorSolicitanteId,
        supervisorAsignadoId: solicitud.supervisorAsignadoId,
        estadoSolicitud: solicitud.estadoSolicitud as any, // Prisma enum
        fechaSolicitud: solicitud.fechaSolicitud,
        fechaResolucion: solicitud.fechaResolucion,
        comentarioSolicitante: solicitud.comentarioSolicitante,
        comentarioSupervisor: solicitud.comentarioSupervisor,
        prioridad: solicitud.prioridad as any, // Prisma enum
      },
    });

    // Reconstruir entidad con ID asignado
    return this.mapToDomain(solicitudData);
  }

  async buscarPorId(id: number): Promise<SolicitudAutorizacion | null> {
    const solicitudData = await this.prisma.solicitudAutorizacion.findUnique({
      where: { id },
      include: {
        estadoOrigen: true,
        estadoDestino: true,
      },
    });

    if (!solicitudData) return null;

    return this.mapToDomain(solicitudData);
  }

  async buscarPorDeuda(deudaMaestraId: number): Promise<SolicitudAutorizacion[]> {
    const solicitudesData = await this.prisma.solicitudAutorizacion.findMany({
      where: { deudaMaestraId },
      include: {
        estadoOrigen: true,
        estadoDestino: true,
      },
    });

    return solicitudesData.map(data => this.mapToDomain(data));
  }

  async buscarPorSeguimiento(seguimientoId: number): Promise<SolicitudAutorizacion[]> {
    const solicitudesData = await this.prisma.solicitudAutorizacion.findMany({
      where: { seguimientoId },
      include: {
        estadoOrigen: true,
        estadoDestino: true,
      },
    });

    return solicitudesData.map(data => this.mapToDomain(data));
  }

  async buscarPendientesPorSupervisor(supervisorId: number): Promise<SolicitudAutorizacion[]> {
    const solicitudesData = await this.prisma.solicitudAutorizacion.findMany({
      where: {
        supervisorAsignadoId: supervisorId,
        estadoSolicitud: 'Pendiente',
      },
      include: {
        estadoOrigen: true,
        estadoDestino: true,
      },
    });

    return solicitudesData.map(data => this.mapToDomain(data));
  }

  async actualizar(solicitud: SolicitudAutorizacion): Promise<void> {
    // Obtener IDs de estados (por si cambiaron, aunque no deberían)
    const estadoOrigen = await this.prisma.estadoDeuda.findUnique({
      where: { nombre: solicitud.estadoOrigen },
    });
    if (!estadoOrigen) {
      throw new Error(`Estado de deuda '${solicitud.estadoOrigen}' no encontrado`);
    }

    const estadoDestino = await this.prisma.estadoDeuda.findUnique({
      where: { nombre: solicitud.estadoDestino },
    });
    if (!estadoDestino) {
      throw new Error(`Estado de deuda '${solicitud.estadoDestino}' no encontrado`);
    }

    await this.prisma.solicitudAutorizacion.update({
      where: { id: solicitud.id! },
      data: {
        estadoOrigenId: estadoOrigen.id,
        estadoDestinoId: estadoDestino.id,
        supervisorAsignadoId: solicitud.supervisorAsignadoId,
        estadoSolicitud: solicitud.estadoSolicitud as any,
        fechaResolucion: solicitud.fechaResolucion,
        comentarioSupervisor: solicitud.comentarioSupervisor,
        prioridad: solicitud.prioridad as any,
      },
    });
  }

  private mapToDomain(data: any): SolicitudAutorizacion {
    return SolicitudAutorizacion.reconstruir({
      id: data.id,
      seguimientoId: data.seguimientoId,
      deudaMaestraId: data.deudaMaestraId,
      estadoOrigen: data.estadoOrigen.nombre,
      estadoDestino: data.estadoDestino.nombre,
      gestorSolicitanteId: data.gestorSolicitanteId,
      supervisorAsignadoId: data.supervisorAsignadoId,
      estadoSolicitud: data.estadoSolicitud as EstadoSolicitud,
      fechaSolicitud: data.fechaSolicitud,
      fechaResolucion: data.fechaResolucion,
      comentarioSolicitante: data.comentarioSolicitante ?? undefined,
      comentarioSupervisor: data.comentarioSupervisor ?? undefined,
      prioridad: data.prioridad as PrioridadSolicitud,
    });
  }
}