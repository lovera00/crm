import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AsignadorSupervisor } from './asignador-supervisor';
import { UsuarioRepository } from '../repositories/usuario-repository';

describe('AsignadorSupervisor', () => {
  let usuarioRepository: UsuarioRepository;
  let asignadorSupervisor: AsignadorSupervisor;

  beforeEach(() => {
    usuarioRepository = {
      buscarSupervisoresActivos: vi.fn(),
      buscarPorId: vi.fn(),
    };
    asignadorSupervisor = new AsignadorSupervisor(usuarioRepository);
  });

  describe('asignarSupervisor', () => {
    it('debería asignar el primer supervisor cuando hay supervisores disponibles', async () => {
      vi.mocked(usuarioRepository.buscarSupervisoresActivos).mockResolvedValue([
        { id: 1, rol: 'supervisor' },
        { id: 2, rol: 'supervisor' },
        { id: 3, rol: 'supervisor' },
      ]);

      const supervisorId = await asignadorSupervisor.asignarSupervisor();
      expect(supervisorId).toBe(1);
      expect(usuarioRepository.buscarSupervisoresActivos).toHaveBeenCalled();
    });

    it('debería lanzar error cuando no hay supervisores disponibles', async () => {
      vi.mocked(usuarioRepository.buscarSupervisoresActivos).mockResolvedValue([]);

      await expect(asignadorSupervisor.asignarSupervisor()).rejects.toThrow(
        'No hay supervisores activos disponibles'
      );
      expect(usuarioRepository.buscarSupervisoresActivos).toHaveBeenCalled();
    });

    it('debería implementar lógica round-robin en futuras iteraciones (comentario)', async () => {
      // Nota: La implementación actual solo devuelve el primer supervisor
      // En una implementación real, se debería implementar round-robin
      vi.mocked(usuarioRepository.buscarSupervisoresActivos).mockResolvedValue([
        { id: 1, rol: 'supervisor' },
        { id: 2, rol: 'supervisor' },
      ]);

      const supervisorId1 = await asignadorSupervisor.asignarSupervisor();
      const supervisorId2 = await asignadorSupervisor.asignarSupervisor();

      // Implementación actual: siempre devuelve el primero
      expect(supervisorId1).toBe(1);
      expect(supervisorId2).toBe(1); // Siempre el mismo por ahora
    });
  });
});