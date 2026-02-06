import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrearSeguimientoUseCase } from './crear-seguimiento';
import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { SeguimientoRepository } from '../../domain/repositories/seguimiento-repository';
import { ReglaTransicionRepository } from '../../domain/repositories/regla-transicion-repository';
import { TransicionEstadoRepository } from '../../domain/repositories/transicion-estado-repository';
import { SolicitudAutorizacionRepository } from '../../domain/repositories/solicitud-autorizacion-repository';
import { AsignadorSupervisor } from '../../domain/services/asignador-supervisor';
import { UsuarioRepository } from '../../domain/repositories/usuario-repository';
import { Deuda } from '../../domain/entities/deuda';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';
import { ReglaTransicion } from '../../domain/entities/regla-transicion';

describe('CrearSeguimientoUseCase', () => {
  let deudaRepository: DeudaRepository;
  let seguimientoRepository: SeguimientoRepository;
  let reglaTransicionRepository: ReglaTransicionRepository;
  let transicionEstadoRepository: TransicionEstadoRepository;
  let solicitudAutorizacionRepository: SolicitudAutorizacionRepository;
  let asignadorSupervisor: AsignadorSupervisor;
  let useCase: CrearSeguimientoUseCase;

  beforeEach(() => {
    deudaRepository = {
      buscarPorId: vi.fn(),
      guardar: vi.fn(),
      buscarPorGestor: vi.fn(),
    };
    seguimientoRepository = {
      guardar: vi.fn().mockImplementation((seguimiento) => {
        seguimiento.asignarId(1000);
      }),
    };
    reglaTransicionRepository = {
      buscarPorTipoGestion: vi.fn(),
    };
    transicionEstadoRepository = {
      esTransicionValida: vi.fn(),
      obtenerTransicionesDesde: vi.fn(),
      obtenerTransicion: vi.fn(),
    };
    solicitudAutorizacionRepository = {
      crear: vi.fn().mockImplementation((solicitud) => {
        solicitud.asignarId(2000);
        return Promise.resolve(solicitud);
      }),
      buscarPorId: vi.fn(),
      buscarPorDeuda: vi.fn(),
      buscarPorSeguimiento: vi.fn(),
      buscarPendientesPorSupervisor: vi.fn(),
      actualizar: vi.fn(),
    };
    const usuarioRepository: UsuarioRepository = {
      buscarSupervisoresActivos: vi.fn().mockResolvedValue([{ id: 500, rol: 'supervisor' }]),
      buscarPorId: vi.fn(),
    };
    asignadorSupervisor = new AsignadorSupervisor(usuarioRepository);
    useCase = new CrearSeguimientoUseCase(
      deudaRepository,
      seguimientoRepository,
      reglaTransicionRepository,
      transicionEstadoRepository,
      solicitudAutorizacionRepository,
      asignadorSupervisor,
    );
  });

  it('debería crear seguimiento y actualizar deudas cuando regla no requiere autorización', async () => {
    const deudaMock = Deuda.crear({
      id: 1,
      acreedor: 'Banco',
      concepto: 'Préstamo',
      gestorAsignadoId: 100,
      montoCuota: null,
    });
    vi.mocked(deudaRepository.buscarPorId).mockResolvedValue(deudaMock);

    const reglaMock = ReglaTransicion.crear({
      tipoGestionId: 5,
      estadoOrigen: EstadoDeuda.NUEVO,
      estadoDestino: EstadoDeuda.EN_GESTION,
      requiereAutorizacion: false,
    });
    vi.mocked(reglaTransicionRepository.buscarPorTipoGestion).mockResolvedValue([reglaMock]);

    const input = {
      gestorId: 100,
      personaId: 200,
      deudaIds: [1],
      tipoGestionId: 5,
      observacion: 'Test',
    };

    // Mockear validación de transición
    vi.mocked(transicionEstadoRepository.obtenerTransicion).mockResolvedValue({
      estadoOrigen: EstadoDeuda.NUEVO,
      estadoDestino: EstadoDeuda.EN_GESTION,
      requiereAutorizacion: false,
      descripcion: 'Transición permitida',
    });

    const output = await useCase.execute(input);

    expect(output.seguimientoId).toBeDefined();
    expect(output.deudasActualizadas).toHaveLength(1);
    expect(output.deudasActualizadas[0].nuevoEstado).toBe(EstadoDeuda.EN_GESTION);
    expect(output.deudasActualizadas[0].requiereAutorizacion).toBe(false);
    expect(seguimientoRepository.guardar).toHaveBeenCalled();
  });
});
