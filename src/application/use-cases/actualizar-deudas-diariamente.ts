import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { TransicionEstadoRepository } from '../../domain/repositories/transicion-estado-repository';
import { Deuda } from '../../domain/entities/deuda';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';
import { ValidadorTransicionEstado } from '../../domain/services/validador-transicion-estado';
import { InteresAcumulador } from '../../domain/services/interes-acumulador';

export interface ActualizarDeudasDiariamenteInput {
  fechaReferencia?: Date;
}

export interface ActualizarDeudasDiariamenteOutput {
  deudasProcesadas: number;
  deudasConInteresesAplicados: number;
  deudasConEstadoCambiado: number;
  interesMoratorioTotal: number;
  interesPunitorioTotal: number;
  detalles: Array<{
    deudaId: number;
    cambios: string[];
    interesMoratorioAplicado: number;
    interesPunitorioAplicado: number;
    estadoCambiado?: EstadoDeuda;
  }>;
}

export class ActualizarDeudasDiariamenteUseCase {
  constructor(
    private deudaRepository: DeudaRepository,
    private transicionEstadoRepository: TransicionEstadoRepository,
    private interesAcumulador: InteresAcumulador
  ) {}

  async execute(input: ActualizarDeudasDiariamenteInput = {}): Promise<ActualizarDeudasDiariamenteOutput> {
    const fechaReferencia = input.fechaReferencia || new Date();
    const validadorTransicion = new ValidadorTransicionEstado(this.transicionEstadoRepository);
    
    // Obtener deudas activas (no en estados finales)
    const deudas = await this.deudaRepository.obtenerDeudasParaActualizacionDiaria();
    
    const output: ActualizarDeudasDiariamenteOutput = {
      deudasProcesadas: deudas.length,
      deudasConInteresesAplicados: 0,
      deudasConEstadoCambiado: 0,
      interesMoratorioTotal: 0,
      interesPunitorioTotal: 0,
      detalles: [],
    };

    for (const deuda of deudas) {
      const cambios: string[] = [];
      let interesMoratorioAplicado = 0;
      let interesPunitorioAplicado = 0;
      let estadoCambiado: EstadoDeuda | undefined;

      // 1. Actualizar días de mora y gestión
      deuda.actualizarDiasMoraYGestion(fechaReferencia);
      cambios.push('Días de mora y gestión actualizados');

      // 2. Aplicar intereses diarios a cuotas vencidas
      const { cuotasActualizadas, interesMoratorioTotal, interesPunitorioTotal } = 
        this.interesAcumulador.aplicarInteresDiario(deuda, fechaReferencia);
      
      if (interesMoratorioTotal > 0 || interesPunitorioTotal > 0) {
        interesMoratorioAplicado = interesMoratorioTotal;
        interesPunitorioAplicado = interesPunitorioTotal;
        output.interesMoratorioTotal += interesMoratorioTotal;
        output.interesPunitorioTotal += interesPunitorioTotal;
        cambios.push(`Intereses aplicados: moratorio $${interesMoratorioTotal.toFixed(2)}, punitorio $${interesPunitorioTotal.toFixed(2)}`);
        
        // Actualizar cuotas con nuevos intereses (en una implementación real, reemplazaríamos las cuotas)
        // Por ahora, asumimos que las cuotas se actualizan en el repositorio
      }

      // 3. Actualizar estado de cuotas pendientes a vencidas
      const cuotasConEstadoActualizado = this.interesAcumulador.actualizarEstadoCuotasPorVencimiento(
        deuda.cuotas,
        fechaReferencia
      );
      if (cuotasConEstadoActualizado.length > 0) {
        cambios.push(`${cuotasConEstadoActualizado.length} cuotas actualizadas a vencidas`);
      }

      // 4. Verificar si acuerdo ha expirado
      if (deuda.estaAcuerdoExpirado(fechaReferencia)) {
        const transicionValida = await validadorTransicion.esTransicionValida(
          EstadoDeuda.CON_ACUERDO,
          EstadoDeuda.EN_GESTION
        );
        
        if (transicionValida) {
          deuda.cambiarEstado(EstadoDeuda.EN_GESTION);
          estadoCambiado = EstadoDeuda.EN_GESTION;
          cambios.push('Acuerdo expirado, cambiado a estado "En Gestión"');
          output.deudasConEstadoCambiado++;
        }
      }

      // 5. Actualizar totales de la deuda
      deuda.actualizarTotales();

      // Guardar cambios en la deuda
      await this.deudaRepository.guardar(deuda);

      // Registrar detalles
      output.detalles.push({
        deudaId: deuda.id!,
        cambios,
        interesMoratorioAplicado,
        interesPunitorioAplicado,
        estadoCambiado,
      });

      if (interesMoratorioAplicado > 0 || interesPunitorioAplicado > 0) {
        output.deudasConInteresesAplicados++;
      }
    }

    return output;
  }
}