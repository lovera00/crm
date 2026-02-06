import { ReferenciaPersonal } from '../entities/referencia-personal';
import { EstadoContacto } from '../enums/estado-contacto';

export interface ReferenciaPersonalRepository {
  buscarPorId(id: number): Promise<ReferenciaPersonal | null>;
  buscarPorPersona(personaId: number): Promise<ReferenciaPersonal[]>;
  guardar(referencia: ReferenciaPersonal): Promise<void>;
  cambiarEstado(id: number, estado: EstadoContacto): Promise<void>;
  eliminar(id: number): Promise<void>;
}
