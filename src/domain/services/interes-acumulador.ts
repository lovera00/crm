import { EstadoCuota } from '../enums/estado-cuota';
import { Cuota } from '../entities/cuota';
import { Deuda } from '../entities/deuda';

export class InteresAcumulador {
  calcularInteresDiario(
    cuota: Cuota,
    tasaInteresMoratorio: number | null,
    tasaInteresPunitorio: number | null,
    fechaReferencia: Date
  ): { interesMoratorio: number; interesPunitorio: number } {
    // Solo calcular intereses para cuotas vencidas o pendientes con fecha vencida
    if (cuota.estadoCuota === EstadoCuota.PAGADA || cuota.estadoCuota === EstadoCuota.EN_ACUERDO) {
      return { interesMoratorio: 0, interesPunitorio: 0 };
    }

    const diasMora = this.calcularDiasMora(cuota, fechaReferencia);
    if (diasMora <= 0) {
      return { interesMoratorio: 0, interesPunitorio: 0 };
    }

    const saldoCapital = cuota.saldoCapital;
    let interesMoratorio = 0;
    let interesPunitorio = 0;

    // Calcular interés moratorio (diario sobre saldo capital)
    if (tasaInteresMoratorio !== null && tasaInteresMoratorio > 0) {
      const interesMoratorioTotal = saldoCapital * (tasaInteresMoratorio / 100 / 365) * diasMora;
      // Restar interés ya aplicado para evitar duplicación
      interesMoratorio = Math.max(0, interesMoratorioTotal - cuota.interesMoratorioAcumulado);
    }

    // Calcular interés punitorio (diario sobre saldo capital)
    if (tasaInteresPunitorio !== null && tasaInteresPunitorio > 0) {
      const interesPunitorioTotal = saldoCapital * (tasaInteresPunitorio / 100 / 365) * diasMora;
      // Restar interés ya aplicado para evitar duplicación
      interesPunitorio = Math.max(0, interesPunitorioTotal - cuota.interesPunitorioAcumulado);
    }

    return { interesMoratorio, interesPunitorio };
  }

  private calcularDiasMora(cuota: Cuota, fechaReferencia: Date): number {
    // Si la cuota está vencida o está pendiente pero ya pasó la fecha de vencimiento
    if (cuota.estadoCuota === EstadoCuota.VENCIDA || 
        (cuota.estadoCuota === EstadoCuota.PENDIENTE && cuota.fechaVencimiento < fechaReferencia)) {
      const diffMs = fechaReferencia.getTime() - cuota.fechaVencimiento.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
    return 0;
  }

  aplicarInteresDiario(
    deuda: Deuda,
    fechaReferencia: Date = new Date()
  ): { cuotasActualizadas: Cuota[]; interesMoratorioTotal: number; interesPunitorioTotal: number } {
    const tasaMoratorio = deuda.tasaInteresMoratorio;
    const tasaPunitorio = deuda.tasaInteresPunitorio;
    
    let interesMoratorioTotal = 0;
    let interesPunitorioTotal = 0;
    const cuotasActualizadas: Cuota[] = [];

    for (const cuota of deuda.cuotas) {
      const { interesMoratorio, interesPunitorio } = this.calcularInteresDiario(
        cuota,
        tasaMoratorio,
        tasaPunitorio,
        fechaReferencia
      );

      if (interesMoratorio > 0 || interesPunitorio > 0) {
        // Crear una nueva cuota con los intereses acumulados
        const cuotaActualizada = this.crearCuotaConIntereses(
          cuota,
          interesMoratorio,
          interesPunitorio
        );
        cuotasActualizadas.push(cuotaActualizada);
        
        interesMoratorioTotal += interesMoratorio;
        interesPunitorioTotal += interesPunitorio;
      }
    }

    return { cuotasActualizadas, interesMoratorioTotal, interesPunitorioTotal };
  }

  private crearCuotaConIntereses(
    cuotaOriginal: Cuota,
    interesMoratorio: number,
    interesPunitorio: number
  ): Cuota {
    // En una implementación real, usaríamos un método en la entidad Cuota para actualizar intereses
    // Por ahora, creamos un objeto con los nuevos valores
    const props = {
      id: cuotaOriginal.id,
      numeroCuota: cuotaOriginal.numeroCuota,
      fechaVencimiento: cuotaOriginal.fechaVencimiento,
      capitalOriginal: cuotaOriginal.capitalOriginal,
      saldoCapital: cuotaOriginal.saldoCapital,
      interesMoratorioAcumulado: cuotaOriginal.interesMoratorioAcumulado + interesMoratorio,
      interesPunitorioAcumulado: cuotaOriginal.interesPunitorioAcumulado + interesPunitorio,
      estadoCuota: cuotaOriginal.estadoCuota,
      fechaUltimoPago: cuotaOriginal.fechaUltimoPago,
      montoCuota: cuotaOriginal.montoCuota,
    };
    return Cuota.reconstruir(props);
  }

  actualizarEstadoCuotasPorVencimiento(
    cuotas: Cuota[],
    fechaReferencia: Date = new Date()
  ): Cuota[] {
    const cuotasActualizadas: Cuota[] = [];

    for (const cuota of cuotas) {
      if (cuota.estadoCuota === EstadoCuota.PENDIENTE && cuota.fechaVencimiento < fechaReferencia) {
        // Actualizar a VENCIDA
        const props = {
          id: cuota.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: cuota.fechaVencimiento,
          capitalOriginal: cuota.capitalOriginal,
          saldoCapital: cuota.saldoCapital,
          interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
          interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
          estadoCuota: EstadoCuota.VENCIDA,
          fechaUltimoPago: cuota.fechaUltimoPago,
          montoCuota: cuota.montoCuota,
        };
        cuotasActualizadas.push(Cuota.reconstruir(props));
      } else {
        cuotasActualizadas.push(cuota);
      }
    }

    return cuotasActualizadas;
  }
}