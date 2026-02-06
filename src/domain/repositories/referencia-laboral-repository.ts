import { ReferenciaLaboral } from '../entities/referencia-laboral';
import { EstadoContacto } from '../enums/estado-contacto';

export interface ReferenciaLaboralRepository {
  buscarPorId(id: number): Promise<ReferenciaLaboral | null>;
  buscarPorPersona(personaId: number): Promise<ReferenciaLaboral[]>;
  guardar(referencia: ReferenciaLaboral): Promise<void>;
  cambiarEstado(id: number, estado: EstadoContacto): Promise<void>;
  eliminar(id: number): Promise<void>;
}
