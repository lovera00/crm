import { ReglaTransicion } from '../entities/regla-transicion';
import { Deuda } from '../entities/deuda';
import { EvaluadorCondicion, ContextoDeuda, Condicion } from './condicion-validacion';
import { EstadoDeuda } from '../enums/estado-deuda';

export class EvaluadorRegla {
  static crearContextoDeDeuda(deuda: Deuda): ContextoDeuda {
    return {
      deudaTotal: deuda.deudaTotal,
      saldoCapitalTotal: deuda.saldoCapitalTotal,
      diasMora: deuda.diasMora,
      diasGestion: deuda.diasGestion,
      estadoActual: deuda.estadoActual,
      gestorAsignadoId: deuda.gestorAsignadoId ?? 0,
      tieneAcuerdo: deuda.estadoActual === EstadoDeuda.CON_ACUERDO,
      fechaExpiracionAcuerdo: deuda.fechaExpiracionAcuerdo,
      // Campos adicionales que podrían ser útiles
      interesMoratorio: deuda.interesMoratorio,
      interesPunitorio: deuda.interesPunitorio,
      gastosCobranza: deuda.gastosCobranza,
      montoCuota: deuda.montoCuota ?? null,
    };
  }

  static evaluarReglaParaDeuda(regla: ReglaTransicion, deuda: Deuda): boolean {
    // Primero, verificar si la regla aplica según tipo de gestión y estado origen
    // (esto ya lo hace el método aplicaPara, pero lo incluimos por completitud)
    if (!regla.aplicaPara(regla.tipoGestionId, deuda.estadoActual)) {
      return false;
    }

    // Evaluar condiciones adicionales si existen
    const condicion = EvaluadorCondicion.parseValidacionAdicional(regla.validacionAdicional);
    if (!condicion) {
      // Si no hay condiciones o no se puede parsear, la regla aplica
      return true;
    }

    const contexto = this.crearContextoDeDeuda(deuda);
    return EvaluadorCondicion.evaluar(condicion, contexto);
  }

  static evaluarReglasConPrioridad(reglas: ReglaTransicion[], deuda: Deuda): ReglaTransicion | null {
    const reglasAplicables = reglas.filter(regla => this.evaluarReglaParaDeuda(regla, deuda));
    
    if (reglasAplicables.length === 0) {
      return null;
    }

    // Ordenar por prioridad descendente (mayor prioridad primero)
    reglasAplicables.sort((a, b) => b.prioridad - a.prioridad);
    
    // Si hay empate en prioridad, podemos usar otros criterios como especificidad
    // Por ahora, devolvemos la primera (mayor prioridad)
    return reglasAplicables[0];
  }
}