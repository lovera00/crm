import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { SeguimientoRepository } from '../../domain/repositories/seguimiento-repository';
import { ReglaTransicionRepository } from '../../domain/repositories/regla-transicion-repository';
import { Deuda } from '../../domain/entities/deuda';
import { Seguimiento } from '../../domain/entities/seguimiento';
import { ReglaTransicion } from '../../domain/entities/regla-transicion';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';

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
}

export class CrearSeguimientoUseCase {
  constructor(
    private deudaRepository: DeudaRepository,
    private seguimientoRepository: SeguimientoRepository,
    private reglaTransicionRepository: ReglaTransicionRepository,
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

    // 3. Para cada deuda, determinar cambio de estado y si requiere autorización
    const deudasActualizadas = [];
    for (const deuda of deudas) {
      const reglaAplicable = reglas.find(r => r.aplicaPara(input.tipoGestionId, deuda.estadoActual));
      let nuevoEstado = deuda.estadoActual;
      let requiereAutorizacion = false;

      if (reglaAplicable) {
        nuevoEstado = reglaAplicable.obtenerEstadoDestino(deuda.estadoActual) ?? deuda.estadoActual;
        requiereAutorizacion = reglaAplicable.requiereAutorizacion;
        // Aquí deberíamos actualizar el estado de la deuda si no requiere autorización
        // Por simplicidad, asumimos que si requiere autorización, se crea solicitud aparte
      }

      deudasActualizadas.push({
        deudaId: deuda.id!,
        nuevoEstado,
        requiereAutorizacion,
      });

      // 4. Si no requiere autorización, actualizar estado de deuda
      if (!requiereAutorizacion) {
        // Actualizar estado de deuda (esto requiere un método en Deuda)
        // deuda.cambiarEstado(nuevoEstado);
        // await this.deudaRepository.guardar(deuda);
      }
    }

    // 5. Crear seguimiento
    const seguimiento = Seguimiento.crear({
      gestorId: input.gestorId,
      personaId: input.personaId,
      tipoGestionId: input.tipoGestionId,
      observacion: input.observacion,
      requiereSeguimiento: input.requiereSeguimiento ?? false,
      fechaProximoSeguimiento: input.fechaProximoSeguimiento,
    });

    await this.seguimientoRepository.guardar(seguimiento);

    // 6. Si alguna deuda requiere autorización, crear solicitud (pendiente)

    return {
      seguimientoId: seguimiento.id!,
      deudasActualizadas,
    };
  }
}
