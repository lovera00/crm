import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { SeguimientoRepository } from '../../domain/repositories/seguimiento-repository';
import { ReglaTransicionRepository } from '../../domain/repositories/regla-transicion-repository';
import { SolicitudAutorizacionRepository } from '../../domain/repositories/solicitud-autorizacion-repository';
import { Deuda } from '../../domain/entities/deuda';
import { Seguimiento } from '../../domain/entities/seguimiento';
import { ReglaTransicion } from '../../domain/entities/regla-transicion';
import { SolicitudAutorizacion } from '../../domain/entities/solicitud-autorizacion';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';
import { PrioridadSolicitud } from '../../domain/enums/prioridad-solicitud';
import { TransicionEstadoRepository } from '../../domain/repositories/transicion-estado-repository';
import { ValidadorTransicionEstado } from '../../domain/services/validador-transicion-estado';
import { AsignadorSupervisor } from '../../domain/services/asignador-supervisor';
import { EvaluadorRegla } from '../../domain/services/evaluador-regla';

export interface CrearSeguimientoInput {
  gestorId: number;
  personaId: number;
  deudaIds: number[];
  tipoGestionId: number;
  observacion?: string;
  requiereSeguimiento?: boolean;
  fechaProximoSeguimiento?: Date;
}

export interface CrearSeguimientoOutput {
  seguimientoId: number;
  deudasActualizadas: Array<{
    deudaId: number;
    nuevoEstado: EstadoDeuda;
    requiereAutorizacion: boolean;
  }>;
  solicitudesAutorizacion: Array<{
    deudaId: number;
    solicitudId: number;
    supervisorAsignadoId: number | null;
  }>;
}

export class CrearSeguimientoUseCase {
  constructor(
    private deudaRepository: DeudaRepository,
    private seguimientoRepository: SeguimientoRepository,
    private reglaTransicionRepository: ReglaTransicionRepository,
    private transicionEstadoRepository: TransicionEstadoRepository,
    private solicitudAutorizacionRepository: SolicitudAutorizacionRepository,
    private asignadorSupervisor: AsignadorSupervisor,
  ) {}

  async execute(input: CrearSeguimientoInput): Promise<CrearSeguimientoOutput> {
    // 1. Validar que existan las deudas y pertenezcan al gestor
    const deudas: Deuda[] = [];
    for (const deudaId of input.deudaIds) {
      const deuda = await this.deudaRepository.buscarPorId(deudaId);
      if (!deuda) {
        throw new Error(`Deuda con ID ${deudaId} no encontrada`);
      }
      if (deuda.gestorAsignadoId !== input.gestorId) {
        throw new Error(`Deuda ${deudaId} no asignada al gestor`);
      }
      deudas.push(deuda);
    }

    // 2. Obtener reglas de transición para el tipo de gestión
    const reglas = await this.reglaTransicionRepository.buscarPorTipoGestion(input.tipoGestionId);
    const validadorTransicion = new ValidadorTransicionEstado(this.transicionEstadoRepository);

    // 3. Para cada deuda, determinar cambio de estado y si requiere autorización
    const deudasActualizadas = [];
    const deudasQueRequierenAutorizacion: Array<{
      deuda: Deuda;
      nuevoEstado: EstadoDeuda;
      reglaAplicable: ReglaTransicion;
    }> = [];

    for (const deuda of deudas) {
      // Evaluar reglas aplicables considerando condiciones y prioridad
      const reglaAplicable = EvaluadorRegla.evaluarReglasConPrioridad(reglas, deuda);
      let nuevoEstado = deuda.estadoActual;
      let requiereAutorizacion = false;

      if (reglaAplicable) {
        nuevoEstado = reglaAplicable.obtenerEstadoDestino(deuda.estadoActual) ?? deuda.estadoActual;
        requiereAutorizacion = reglaAplicable.requiereAutorizacion;
        
        // Validar que la transición esté permitida
        const validacion = await validadorTransicion.validarTransicion(deuda.estadoActual, nuevoEstado);
        if (!validacion.valida) {
          throw new Error(`Transición no permitida de ${deuda.estadoActual} a ${nuevoEstado} para la deuda ${deuda.id}`);
        }
        
        // Si la transición requiere autorización, guardar para crear solicitud después
        if (requiereAutorizacion) {
          deudasQueRequierenAutorizacion.push({ deuda, nuevoEstado, reglaAplicable });
        } else {
          // Si no requiere autorización, aplicar cambio de estado inmediatamente
          deuda.cambiarEstado(nuevoEstado);
          await this.deudaRepository.guardar(deuda);
        }
      }

      deudasActualizadas.push({
        deudaId: deuda.id!,
        nuevoEstado,
        requiereAutorizacion,
      });
    }

    // 5. Crear seguimiento
    const seguimiento = Seguimiento.crear({
      gestorId: input.gestorId,
      personaId: input.personaId,
      tipoGestionId: input.tipoGestionId,
      observacion: input.observacion,
      fechaProximoSeguimiento: input.fechaProximoSeguimiento,
    });

    await this.seguimientoRepository.guardar(seguimiento);

    // 6. Crear solicitudes de autorización para deudas que lo requieran
    const solicitudesAutorizacion = [];
    for (const { deuda, nuevoEstado, reglaAplicable } of deudasQueRequierenAutorizacion) {
      let supervisorAsignadoId: number | null = null;
      try {
        supervisorAsignadoId = await this.asignadorSupervisor.asignarSupervisor();
      } catch (error) {
        // Si no hay supervisores disponibles, la solicitud se crea sin supervisor asignado
        // Puede ser asignado manualmente después
      }

      // Calcular prioridad (por ahora basada en el monto total de la deuda)
      let prioridad = PrioridadSolicitud.MEDIA;
      if (deuda.deudaTotal > 100000) {
        prioridad = PrioridadSolicitud.ALTA;
      } else if (deuda.deudaTotal < 10000) {
        prioridad = PrioridadSolicitud.BAJA;
      }

      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: seguimiento.id!,
        deudaMaestraId: deuda.id!,
        estadoOrigen: deuda.estadoActual,
        estadoDestino: nuevoEstado,
        gestorSolicitanteId: input.gestorId,
        prioridad,
        comentarioSolicitante: input.observacion,
      });

      if (supervisorAsignadoId) {
        solicitud.asignarSupervisor(supervisorAsignadoId);
      }

      const solicitudCreada = await this.solicitudAutorizacionRepository.crear(solicitud);
      solicitudesAutorizacion.push({
        deudaId: deuda.id!,
        solicitudId: solicitudCreada.id!,
        supervisorAsignadoId: solicitudCreada.supervisorAsignadoId,
      });
    }

    return {
      seguimientoId: seguimiento.id!,
      deudasActualizadas,
      solicitudesAutorizacion,
    };
  }
}
