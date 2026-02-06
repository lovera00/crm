import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrearPersonaUseCase } from './crear-persona';
import { PersonaRepository } from '../../domain/repositories/persona-repository';
import { Persona } from '../../domain/entities/persona';
import { EstadoVerificacion } from '../../domain/enums/estado-verificacion';

describe('CrearPersonaUseCase', () => {
  let personaRepository: PersonaRepository;
  let useCase: CrearPersonaUseCase;

  beforeEach(() => {
    personaRepository = {
      buscarPorId: vi.fn(),
      buscarPorDocumento: vi.fn(),
      guardar: vi.fn().mockImplementation(async (persona) => {
        // Simular asignación de ID
        (persona as any).props.id = 100;
      }),
      buscarPorNombreOApellido: vi.fn(),
      eliminar: vi.fn(),
    };
    useCase = new CrearPersonaUseCase(personaRepository);
  });

  it('debería crear una persona exitosamente', async () => {
    vi.mocked(personaRepository.buscarPorDocumento).mockResolvedValue(null);

    const input = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      documento: '12345678',
    };

    const output = await useCase.execute(input);

    expect(output.personaId).toBe(100);
    expect(output.documento).toBe('12345678');
    expect(personaRepository.buscarPorDocumento).toHaveBeenCalledWith('12345678');
    expect(personaRepository.guardar).toHaveBeenCalled();
  });

  it('debería rechazar crear persona con documento duplicado', async () => {
    const personaExistente = Persona.crear({
      nombres: 'María',
      apellidos: 'Gómez',
      documento: '87654321',
    });
    vi.mocked(personaRepository.buscarPorDocumento).mockResolvedValue(personaExistente);

    const input = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      documento: '87654321',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'Ya existe una persona con documento 87654321'
    );
  });

  it('debería aceptar estados personalizados', async () => {
    vi.mocked(personaRepository.buscarPorDocumento).mockResolvedValue(null);

    const input = {
      nombres: 'Carlos',
      apellidos: 'López',
      documento: '55555555',
      funcionarioPublico: EstadoVerificacion.SI,
      jubilado: EstadoVerificacion.NO,
      ipsActivo: EstadoVerificacion.SI,
    };

    const output = await useCase.execute(input);

    expect(output.personaId).toBe(100);
    expect(personaRepository.guardar).toHaveBeenCalled();
  });

  it('debería lanzar error si el repositorio no asigna ID después de guardar', async () => {
    // Mock de guardar que no asigna ID
    const personaRepositorySinId: PersonaRepository = {
      buscarPorId: vi.fn(),
      buscarPorDocumento: vi.fn().mockResolvedValue(null),
      guardar: vi.fn().mockImplementation(async () => {
        // No asignar ID
      }),
      buscarPorNombreOApellido: vi.fn(),
      eliminar: vi.fn(),
    };
    const useCaseSinId = new CrearPersonaUseCase(personaRepositorySinId);

    const input = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      documento: '12345678',
    };

    await expect(useCaseSinId.execute(input)).rejects.toThrow(
      'Error al guardar persona: ID no generado'
    );
  });
});
