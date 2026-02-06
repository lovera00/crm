export interface Usuario {
  id: number;
  rol: string;
}

export interface UsuarioRepository {
  buscarSupervisoresActivos(): Promise<Usuario[]>;
  buscarPorId(id: number): Promise<Usuario | null>;
}