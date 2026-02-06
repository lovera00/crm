import { EstadoDeuda } from '../enums/estado-deuda';

export type OperadorComparacion = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
export type OperadorLogico = 'and' | 'or' | 'not';

export interface CondicionComparacion {
  tipo: 'comparacion';
  campo: string;
  operador: OperadorComparacion;
  valor: any;
}

export interface CondicionLogica {
  tipo: 'logica';
  operador: OperadorLogico;
  condiciones: Condicion[];
}

export type Condicion = CondicionComparacion | CondicionLogica;

export interface ContextoDeuda {
  deudaTotal: number;
  saldoCapitalTotal: number;
  diasMora: number;
  diasGestion: number;
  estadoActual: EstadoDeuda;
  gestorAsignadoId: number;
  tieneAcuerdo: boolean;
  fechaExpiracionAcuerdo?: Date | null;
  interesMoratorio: number;
  interesPunitorio: number;
  gastosCobranza: number;
  montoCuota?: number | null;
  [key: string]: any;
}

export class EvaluadorCondicion {
  static evaluar(condicion: Condicion, contexto: ContextoDeuda): boolean {
    switch (condicion.tipo) {
      case 'comparacion':
        return this.evaluarComparacion(condicion, contexto);
      case 'logica':
        return this.evaluarLogica(condicion, contexto);
      default:
        throw new Error(`Tipo de condición no soportado: ${(condicion as any).tipo}`);
    }
  }

  private static evaluarComparacion(condicion: CondicionComparacion, contexto: ContextoDeuda): boolean {
    const valorCampo = contexto[condicion.campo];
    
    switch (condicion.operador) {
      case 'eq':
        return valorCampo === condicion.valor;
      case 'neq':
        return valorCampo !== condicion.valor;
      case 'gt':
        return valorCampo > condicion.valor;
      case 'gte':
        return valorCampo >= condicion.valor;
      case 'lt':
        return valorCampo < condicion.valor;
      case 'lte':
        return valorCampo <= condicion.valor;
      case 'in':
        return Array.isArray(condicion.valor) && condicion.valor.includes(valorCampo);
      case 'not_in':
        return Array.isArray(condicion.valor) && !condicion.valor.includes(valorCampo);
      default:
        throw new Error(`Operador no soportado: ${condicion.operador}`);
    }
  }

  private static evaluarLogica(condicion: CondicionLogica, contexto: ContextoDeuda): boolean {
    switch (condicion.operador) {
      case 'and':
        return condicion.condiciones.every(c => this.evaluar(c, contexto));
      case 'or':
        return condicion.condiciones.some(c => this.evaluar(c, contexto));
      case 'not':
        if (condicion.condiciones.length !== 1) {
          throw new Error('Operador NOT debe tener exactamente una condición');
        }
        return !this.evaluar(condicion.condiciones[0], contexto);
      default:
        throw new Error(`Operador lógico no soportado: ${condicion.operador}`);
    }
  }

  static parseValidacionAdicional(validacionAdicional: any): Condicion | null {
    if (!validacionAdicional) return null;
    // Si ya es una Condición (según nuestro esquema), validar estructura básica
    if (typeof validacionAdicional === 'object' && validacionAdicional.tipo) {
      // Validación básica: asegurar que tenga el formato correcto
      // Podríamos hacer una validación más estricta aquí
      return validacionAdicional as Condicion;
    }
    // Si es un objeto simple como { minDias: 30 }, convertirlo a una condición estándar
    // Por ahora, devolvemos null para indicar que no es una condición evaluable
    return null;
  }
}