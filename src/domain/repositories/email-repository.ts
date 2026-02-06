import { Email } from '../entities/email';
import { EstadoContacto } from '../enums/estado-contacto';

export interface EmailRepository {
  buscarPorId(id: number): Promise<Email | null>;
  buscarPorPersona(personaId: number): Promise<Email[]>;
  guardar(email: Email): Promise<void>;
  cambiarEstado(id: number, estado: EstadoContacto): Promise<void>;
  eliminar(id: number): Promise<void>;
}
