import { SolicitudAutorizacionRepository } from '../../domain/repositories/solicitud-autorizacion-repository';
import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { SolicitudAutorizacion } from '../../domain/entities/solicitud-autorizacion';
import { Deuda } from '../../domain/entities/deuda';
import { EstadoSolicitud } from '../../domain/enums/estado-solicitud';

export interface ResolverSolicitudAutorizacionInput {
  solicitudId: number;
  supervisorId: number;
  aprobar: boolean;
  comentarioSupervisor?: string;
}

export interface ResolverSolicitudAutorizacionOutput {
  solicitudId: number;
  estadoSolicitud: EstadoSolicitud;
  deudaActualizada: boolean;
  nuevoEstadoDeuda?: string;
}

export class ResolverSolicitudAutorizacionUseCase {
  constructor(
    private solicitudAutorizacionRepository: SolicitudAutorizacionRepository,
    private deudaRepository: DeudaRepository,
  ) {}

  async execute(input: ResolverSolicitudAutorizacionInput): Promise<ResolverSolicitudAutorizacionOutput> {
    // 1. Obtener la solicitud
    const solicitud = await this.solicitudAutorizacionRepository.buscarPorId(input.solicitudId);
    if (!solicitud) {
      throw new Error(`Solicitud de autorización con ID ${input.solicitudId} no encontrada`);
    }

    // 2. Validar que el supervisor sea el asignado
    if (solicitud.supervisorAsignadoId !== input.supervisorId) {
      throw new Error('El supervisor no está autorizado para resolver esta solicitud');
    }

    // 3. Validar que la solicitud esté pendiente
    if (!solicitud.estaPendiente) {
      throw new Error('La solicitud ya ha sido resuelta');
    }

    // 4. Obtener la deuda relacionada
    const deuda = await this.deudaRepository.buscarPorId(solicitud.deudaMaestraId);
    if (!deuda) {
      throw new Error(`Deuda con ID ${solicitud.deudaMaestraId} no encontrada`);
    }

    let deudaActualizada = false;
    let nuevoEstadoDeuda: string | undefined;

    // 5. Aprobar o rechazar
    if (input.aprobar) {
      // Validar que la deuda aún esté en el estado origen esperado
      if (deuda.estadoActual !== solicitud.estadoOrigen) {
        throw new Error(`La deuda ya no está en el estado origen (${solicitud.estadoOrigen})`);
      }

      // Aplicar cambio de estado
      deuda.cambiarEstado(solicitud.estadoDestino);
      await this.deudaRepository.guardar(deuda);
      deudaActualizada = true;
      nuevoEstadoDeuda = solicitud.estadoDestino;

      // Aprobar solicitud
      solicitud.aprobar(input.comentarioSupervisor);
    } else {
      // Rechazar solicitud
      solicitud.rechazar(input.comentarioSupervisor);
    }

    // 6. Actualizar la solicitud
    await this.solicitudAutorizacionRepository.actualizar(solicitud);

    return {
      solicitudId: solicitud.id!,
      estadoSolicitud: solicitud.estadoSolicitud,
      deudaActualizada,
      nuevoEstadoDeuda,
    };
  }
}