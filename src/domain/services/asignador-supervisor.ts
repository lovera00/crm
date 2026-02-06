import { UsuarioRepository } from '../repositories/usuario-repository';

export class AsignadorSupervisor {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async asignarSupervisor(): Promise<number> {
    const supervisores = await this.usuarioRepository.buscarSupervisoresActivos();
    if (supervisores.length === 0) {
      throw new Error('No hay supervisores activos disponibles');
    }

    // Implementar lógica de asignación round-robin simple
    // Por ahora, devolver el primer supervisor activo
    // En una implementación real, se podría llevar un índice o estado de carga
    return supervisores[0].id;
  }
}