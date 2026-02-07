import { Persona } from '../entities/persona';

export interface PersonaRepository {
  buscarPorId(id: number): Promise<Persona | null>;
  buscarPorDocumento(documento: string): Promise<Persona | null>;
  guardar(persona: Persona): Promise<void>;
  buscarPorNombreOApellido(termino: string): Promise<Persona[]>;
  buscarConPaginacion(options: {
    termino?: string;
    limit: number;
    offset: number;
  }): Promise<{ personas: Persona[]; total: number }>;
  eliminar(id: number): Promise<void>;
}
