import { describe, it, expect, beforeEach } from 'vitest';
import { EvaluadorRegla } from './evaluador-regla';
import { ReglaTransicion } from '../entities/regla-transicion';
import { Deuda } from '../entities/deuda';
import { EstadoDeuda } from '../enums/estado-deuda';
import { Cuota } from '../entities/cuota';
import { EstadoCuota } from '../enums/estado-cuota';

describe('EvaluadorRegla', () => {
  let deuda: Deuda;

  beforeEach(() => {
    deuda = Deuda.reconstruir({
      id: 1,
      acreedor: 'Banco de Prueba',
      concepto: 'Préstamo de prueba',
      estadoActual: EstadoDeuda.EN_GESTION,
      gestorAsignadoId: 1,
      diasMora: 45,
      diasGestion: 10,
      saldoCapitalTotal: 100000,
      deudaTotal: 150000,
      gastosCobranza: 2000,
      interesMoratorio: 5000,
      interesPunitorio: 3000,
      fechaUltimoPago: null,
      montoCuota: 5000,
      fechaAsignacionGestor: null,
      tasaInteresMoratorio: null,
      tasaInteresPunitorio: null,
      fechaExpiracionAcuerdo: null,
      cuotas: [],
    });
  });

  describe('crearContextoDeDeuda', () => {
    it('debería crear contexto correctamente', () => {
      const contexto = EvaluadorRegla.crearContextoDeDeuda(deuda);
      
      expect(contexto.deudaTotal).toBe(150000);
      expect(contexto.diasMora).toBe(45);
      expect(contexto.estadoActual).toBe(EstadoDeuda.EN_GESTION);
      expect(contexto.tieneAcuerdo).toBe(false);
      expect(contexto.gestorAsignadoId).toBe(1);
    });

    it('debería detectar deuda con acuerdo', () => {
      const deudaConAcuerdo = Deuda.reconstruir({
        id: 2,
        acreedor: 'Banco de Prueba',
        concepto: 'Préstamo con acuerdo',
        estadoActual: EstadoDeuda.CON_ACUERDO,
        gestorAsignadoId: 1,
        diasMora: 30,
        diasGestion: 5,
        saldoCapitalTotal: 50000,
        deudaTotal: 60000,
        gastosCobranza: 1000,
        interesMoratorio: 2000,
        interesPunitorio: 1000,
        fechaUltimoPago: null,
        montoCuota: 3000,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: null,
        tasaInteresPunitorio: null,
        fechaExpiracionAcuerdo: null,
        cuotas: [],
      });
      const contexto = EvaluadorRegla.crearContextoDeDeuda(deudaConAcuerdo);
      expect(contexto.tieneAcuerdo).toBe(true);
    });
  });

  describe('evaluarReglaParaDeuda', () => {
    it('debería devolver true si la regla aplica y no tiene condiciones', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
      });

      const resultado = EvaluadorRegla.evaluarReglaParaDeuda(regla, deuda);
      expect(resultado).toBe(true);
    });

    it('debería devolver false si la regla no aplica por estado origen', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
      });

      const resultado = EvaluadorRegla.evaluarReglaParaDeuda(regla, deuda);
      expect(resultado).toBe(false);
    });

    it('debería devolver true si estado origen es null (cualquier estado)', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: null,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
      });

      const resultado = EvaluadorRegla.evaluarReglaParaDeuda(regla, deuda);
      expect(resultado).toBe(true);
    });

    it('debería evaluar condiciones adicionales cuando existen', () => {
      const regla = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
        validacionAdicional: {
          tipo: 'comparacion',
          campo: 'deudaTotal',
          operador: 'gt',
          valor: 100000,
        },
        prioridad: 0,
        activo: true,
      });

      const resultado = EvaluadorRegla.evaluarReglaParaDeuda(regla, deuda);
      expect(resultado).toBe(true);

      // Cambiar deuda para que no cumpla condición
      const deudaPequena = Deuda.reconstruir({
        id: 3,
        acreedor: 'Banco de Prueba',
        concepto: 'Deuda pequeña',
        estadoActual: EstadoDeuda.EN_GESTION,
        gestorAsignadoId: 1,
        diasMora: 10,
        diasGestion: 2,
        saldoCapitalTotal: 40000,
        deudaTotal: 50000,
        gastosCobranza: 500,
        interesMoratorio: 1000,
        interesPunitorio: 500,
        fechaUltimoPago: null,
        montoCuota: 2000,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: null,
        tasaInteresPunitorio: null,
        fechaExpiracionAcuerdo: null,
        cuotas: [],
      });
      const resultado2 = EvaluadorRegla.evaluarReglaParaDeuda(regla, deudaPequena);
      expect(resultado2).toBe(false);
    });

    it('debería ignorar condiciones si validacionAdicional no es parseable', () => {
      const regla = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
        validacionAdicional: { minDias: 30 }, // formato antiguo
        prioridad: 0,
        activo: true,
      });

      const resultado = EvaluadorRegla.evaluarReglaParaDeuda(regla, deuda);
      expect(resultado).toBe(true); // Se ignora condición, regla aplica
    });
  });

  describe('evaluarReglasConPrioridad', () => {
    it('debería devolver la regla con mayor prioridad entre las aplicables', () => {
      const regla1 = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
        validacionAdicional: null,
        prioridad: 10,
        activo: true,
      });
      const regla2 = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: true,
        validacionAdicional: null,
        prioridad: 20, // Mayor prioridad
        activo: true,
      });
      const regla3 = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO, // No aplica
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
        validacionAdicional: null,
        prioridad: 30,
        activo: true,
      });

      const reglas = [regla1, regla2, regla3];
      const resultado = EvaluadorRegla.evaluarReglasConPrioridad(reglas, deuda);
      
      expect(resultado).toBe(regla2); // Mayor prioridad entre las aplicables
    });

    it('debería devolver null si ninguna regla aplica', () => {
      const regla = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
        validacionAdicional: null,
        prioridad: 10,
        activo: true,
      });

      const resultado = EvaluadorRegla.evaluarReglasConPrioridad([regla], deuda);
      expect(resultado).toBeNull();
    });

    it('debería aplicar condiciones en la evaluación de prioridad', () => {
      const regla1 = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
        validacionAdicional: {
          tipo: 'comparacion',
          campo: 'deudaTotal',
          operador: 'gt',
          valor: 200000, // Esta condición no se cumple
        },
        prioridad: 30,
        activo: true,
      });
      const regla2 = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: EstadoDeuda.CON_ACUERDO,
        requiereAutorizacion: false,
        validacionAdicional: {
          tipo: 'comparacion',
          campo: 'deudaTotal',
          operador: 'gt',
          valor: 100000, // Esta condición sí se cumple
        },
        prioridad: 20,
        activo: true,
      });

      const reglas = [regla1, regla2];
      const resultado = EvaluadorRegla.evaluarReglasConPrioridad(reglas, deuda);
      
      expect(resultado).toBe(regla2); // Única regla que aplica por condición
    });
  });
});