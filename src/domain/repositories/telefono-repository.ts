import { Telefono } from '../entities/telefono';
import { EstadoContacto } from '../enums/estado-contacto';

export interface TelefonoRepository {
  buscarPorId(id: number): Promise<Telefono | null>;
  buscarPorPersona(personaId: number): Promise<Telefono[]>;
  guardar(telefono: Telefono): Promise<void>;
  cambiarEstado(id: number, estado: EstadoContacto): Promise<void>;
  eliminar(id: number): Promise<void>;
}
