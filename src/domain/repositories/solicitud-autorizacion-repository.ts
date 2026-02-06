import { SolicitudAutorizacion } from '../entities/solicitud-autorizacion';

export interface SolicitudAutorizacionRepository {
  crear(solicitud: SolicitudAutorizacion): Promise<SolicitudAutorizacion>;
  buscarPorId(id: number): Promise<SolicitudAutorizacion | null>;
  buscarPorDeuda(deudaMaestraId: number): Promise<SolicitudAutorizacion[]>;
  buscarPorSeguimiento(seguimientoId: number): Promise<SolicitudAutorizacion[]>;
  buscarPendientesPorSupervisor(supervisorId: number): Promise<SolicitudAutorizacion[]>;
  actualizar(solicitud: SolicitudAutorizacion): Promise<void>;
}