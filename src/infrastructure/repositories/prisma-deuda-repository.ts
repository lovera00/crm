import { Deuda } from '../../domain/entities/deuda';
import { Cuota } from '../../domain/entities/cuota';
import { DeudaRepository, BuscarDeudasInput } from '../../domain/repositories/deuda-repository';
import { PrismaClient, Prisma, EstadoCuota as PrismaEstadoCuota } from '../../generated/client';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';
import { EstadoCuota } from '../../domain/enums/estado-cuota';

export class PrismaDeudaRepository implements DeudaRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorId(id: number): Promise<Deuda | null> {
    const deudaData = await this.prisma.deudaMaestra.findUnique({
      where: { id },
      include: { cuotas: true, estadoActual: true },
    });
    if (!deudaData) return null;

    // Mapear cuotas
    const cuotasRecuperadas = deudaData.cuotas.map((cuota: any) => 
      Cuota.reconstruir({
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        fechaVencimiento: cuota.fechaVencimiento,
        capitalOriginal: cuota.capitalOriginal,
        saldoCapital: cuota.saldoCapital,
        interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
        interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
        estadoCuota: cuota.estadoCuota as EstadoCuota,
        fechaUltimoPago: cuota.fechaUltimoPago,
        montoCuota: cuota.montoCuota,
      })
    );

    return Deuda.reconstruir({
      id: deudaData.id,
      acreedor: deudaData.acreedor,
      concepto: deudaData.concepto,
      estadoActual: deudaData.estadoActual.nombre as EstadoDeuda,
      gestorAsignadoId: deudaData.gestorAsignadoId,
      diasMora: deudaData.diasMora,
      diasGestion: deudaData.diasGestion,
      saldoCapitalTotal: deudaData.saldoCapitalTotal,
      deudaTotal: deudaData.deudaTotal,
      gastosCobranza: deudaData.gastosCobranza,
      interesMoratorio: deudaData.interesMoratorio,
      interesPunitorio: deudaData.interesPunitorio,
      fechaUltimoPago: deudaData.fechaUltimoPago,
      montoCuota: deudaData.montoCuota,
      fechaAsignacionGestor: deudaData.fechaAsignacionGestor,
      tasaInteresMoratorio: (deudaData as any).tasaInteresMoratorio,
      tasaInteresPunitorio: (deudaData as any).tasaInteresPunitorio,
      fechaExpiracionAcuerdo: (deudaData as any).fechaExpiracionAcuerdo,
      cuotas: cuotasRecuperadas,
    });
  }

  async guardar(deuda: Deuda): Promise<void> {
    // 1. Obtener ID del estado actual
    const estado = await this.prisma.estadoDeuda.findUnique({
      where: { nombre: deuda.estadoActual },
    });
    if (!estado) {
      throw new Error(`Estado de deuda '${deuda.estadoActual}' no encontrado`);
    }

    // 2. Preparar datos para upsert de DeudaMaestra
    const deudaData = {
      acreedor: deuda.acreedor,
      concepto: deuda.concepto,
      estadoActualId: estado.id,
      gestorAsignadoId: deuda.gestorAsignadoId,
      diasMora: deuda.diasMora,
      diasGestion: deuda.diasGestion,
      saldoCapitalTotal: deuda.saldoCapitalTotal,
      deudaTotal: deuda.deudaTotal,
      gastosCobranza: deuda.gastosCobranza,
      interesMoratorio: deuda.interesMoratorio,
      interesPunitorio: deuda.interesPunitorio,
      fechaUltimoPago: deuda.fechaUltimoPago,
      montoCuota: deuda.montoCuota,
      fechaAsignacionGestor: deuda.fechaAsignacionGestor,
      tasaInteresMoratorio: deuda.tasaInteresMoratorio,
      tasaInteresPunitorio: deuda.tasaInteresPunitorio,
      fechaExpiracionAcuerdo: deuda.fechaExpiracionAcuerdo,
    };

    // 3. Upsert de la deuda principal
    const deudaGuardada = await this.prisma.deudaMaestra.upsert({
      where: { id: deuda.id ?? -1 }, // Si no tiene ID, usar -1 para crear nueva
      update: deudaData,
      create: { ...deudaData, id: deuda.id }, // Si tiene ID, usarlo en create
    });

    // 4. Obtener IDs de cuotas existentes para esta deuda
    const cuotasExistentes = await this.prisma.cuota.findMany({
      where: { deudaMaestraId: deudaGuardada.id },
      select: { id: true },
    });
    const idsExistentes = new Set(cuotasExistentes.map((c: any) => c.id));

    // 5. Preparar operaciones para cuotas
    const operacionesCuotas = deuda.cuotas.map(cuota => {
      const cuotaData = {
        numeroCuota: cuota.numeroCuota,
        fechaVencimiento: cuota.fechaVencimiento,
        capitalOriginal: cuota.capitalOriginal,
        saldoCapital: cuota.saldoCapital,
        interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
        interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
        estadoCuota: cuota.estadoCuota as PrismaEstadoCuota,
        fechaUltimoPago: cuota.fechaUltimoPago,
        montoCuota: cuota.montoCuota,
        deudaMaestraId: deudaGuardada.id,
      };

      // Si la cuota tiene ID, actualizar; si no, crear
      if (cuota.id) {
        idsExistentes.delete(cuota.id);
        return this.prisma.cuota.update({
          where: { id: cuota.id },
          data: cuotaData,
        });
      } else {
        return this.prisma.cuota.create({
          data: cuotaData,
        });
      }
    });

    // 6. Ejecutar todas las operaciones de cuotas
    await Promise.all(operacionesCuotas);

    // 7. Eliminar cuotas que ya no están en la entidad
    if (idsExistentes.size > 0) {
      await this.prisma.cuota.deleteMany({
        where: { id: { in: Array.from(idsExistentes) } },
      });
    }
  }

  async buscarPorGestor(gestorId: number): Promise<Deuda[]> {
    const deudasData = await this.prisma.deudaMaestra.findMany({
      where: { gestorAsignadoId: gestorId },
      include: { cuotas: true, estadoActual: true },
    });
    return deudasData.map(deudaData => {
      const cuotasRecuperadas = deudaData.cuotas.map(cuota => 
        Cuota.reconstruir({
          id: cuota.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: cuota.fechaVencimiento,
          capitalOriginal: cuota.capitalOriginal,
          saldoCapital: cuota.saldoCapital,
          interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
          interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
        estadoCuota: cuota.estadoCuota as unknown as EstadoCuota,
          fechaUltimoPago: cuota.fechaUltimoPago,
          montoCuota: cuota.montoCuota,
        })
      );
      return Deuda.reconstruir({
        id: deudaData.id,
        acreedor: deudaData.acreedor,
        concepto: deudaData.concepto,
        estadoActual: deudaData.estadoActual.nombre as EstadoDeuda,
        gestorAsignadoId: deudaData.gestorAsignadoId,
        diasMora: deudaData.diasMora,
        diasGestion: deudaData.diasGestion,
        saldoCapitalTotal: deudaData.saldoCapitalTotal,
        deudaTotal: deudaData.deudaTotal,
        gastosCobranza: deudaData.gastosCobranza,
        interesMoratorio: deudaData.interesMoratorio,
        interesPunitorio: deudaData.interesPunitorio,
        fechaUltimoPago: deudaData.fechaUltimoPago,
        montoCuota: deudaData.montoCuota,
        fechaAsignacionGestor: deudaData.fechaAsignacionGestor,
        tasaInteresMoratorio: (deudaData as any).tasaInteresMoratorio,
        tasaInteresPunitorio: (deudaData as any).tasaInteresPunitorio,
        fechaExpiracionAcuerdo: (deudaData as any).fechaExpiracionAcuerdo,
        cuotas: cuotasRecuperadas,
      });
    });
  }

  async obtenerDeudasParaActualizacionDiaria(): Promise<Deuda[]> {
    // Deudas que no están en estados finales
    const estadosActivos: EstadoDeuda[] = [
      EstadoDeuda.NUEVO,
      EstadoDeuda.EN_GESTION,
      EstadoDeuda.CON_ACUERDO,
      EstadoDeuda.SUSPENDIDA,
    ];
    return this.obtenerDeudasConEstado(estadosActivos);
  }

  async obtenerDeudasConEstado(estados: EstadoDeuda[]): Promise<Deuda[]> {
    const deudasData = await this.prisma.deudaMaestra.findMany({
      where: {
        estadoActual: {
          nombre: { in: estados }
        }
      },
      include: { cuotas: true, estadoActual: true },
    });
    return deudasData.map(deudaData => {
      const cuotasRecuperadas = deudaData.cuotas.map(cuota => 
        Cuota.reconstruir({
          id: cuota.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: cuota.fechaVencimiento,
          capitalOriginal: cuota.capitalOriginal,
          saldoCapital: cuota.saldoCapital,
          interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
          interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
          estadoCuota: cuota.estadoCuota as unknown as EstadoCuota,
          fechaUltimoPago: cuota.fechaUltimoPago,
          montoCuota: cuota.montoCuota,
        })
      );
      return Deuda.reconstruir({
        id: deudaData.id,
        acreedor: deudaData.acreedor,
        concepto: deudaData.concepto,
        estadoActual: deudaData.estadoActual.nombre as EstadoDeuda,
        gestorAsignadoId: deudaData.gestorAsignadoId,
        diasMora: deudaData.diasMora,
        diasGestion: deudaData.diasGestion,
        saldoCapitalTotal: deudaData.saldoCapitalTotal,
        deudaTotal: deudaData.deudaTotal,
        gastosCobranza: deudaData.gastosCobranza,
        interesMoratorio: deudaData.interesMoratorio,
        interesPunitorio: deudaData.interesPunitorio,
        fechaUltimoPago: deudaData.fechaUltimoPago,
        montoCuota: deudaData.montoCuota,
        fechaAsignacionGestor: deudaData.fechaAsignacionGestor,
        tasaInteresMoratorio: (deudaData as any).tasaInteresMoratorio,
        tasaInteresPunitorio: (deudaData as any).tasaInteresPunitorio,
        fechaExpiracionAcuerdo: (deudaData as any).fechaExpiracionAcuerdo,
        cuotas: cuotasRecuperadas,
      });
    });
  }

  async buscarConPaginacion(input: BuscarDeudasInput): Promise<{ deudas: Deuda[]; total: number }> {
    const { gestorId, estadoId, search, limit, offset } = input;
    
    const where: any = {};
    
    if (gestorId) {
      where.gestorAsignadoId = gestorId;
    }
    
    if (estadoId) {
      where.estadoActualId = estadoId;
    }
    
    if (search) {
      where.OR = [
        { acreedor: { contains: search } },
        { concepto: { contains: search } },
      ];
    }
    
    const [deudasData, total] = await Promise.all([
      this.prisma.deudaMaestra.findMany({
        where,
        include: { cuotas: true, estadoActual: true, gestorAsignado: true },
        take: limit,
        skip: offset,
        orderBy: { id: 'desc' },
      }),
      this.prisma.deudaMaestra.count({ where }),
    ]);
    
    const deudas = deudasData.map(deudaData => {
      const cuotasRecuperadas = deudaData.cuotas.map(cuota => 
        Cuota.reconstruir({
          id: cuota.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: cuota.fechaVencimiento,
          capitalOriginal: cuota.capitalOriginal,
          saldoCapital: cuota.saldoCapital,
          interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
          interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
          estadoCuota: cuota.estadoCuota as unknown as EstadoCuota,
          fechaUltimoPago: cuota.fechaUltimoPago,
          montoCuota: cuota.montoCuota,
        })
      );
      return Deuda.reconstruir({
        id: deudaData.id,
        acreedor: deudaData.acreedor,
        concepto: deudaData.concepto,
        estadoActual: deudaData.estadoActual.nombre as EstadoDeuda,
        gestorAsignadoId: deudaData.gestorAsignadoId,
        diasMora: deudaData.diasMora,
        diasGestion: deudaData.diasGestion,
        saldoCapitalTotal: deudaData.saldoCapitalTotal,
        deudaTotal: deudaData.deudaTotal,
        gastosCobranza: deudaData.gastosCobranza,
        interesMoratorio: deudaData.interesMoratorio,
        interesPunitorio: deudaData.interesPunitorio,
        fechaUltimoPago: deudaData.fechaUltimoPago,
        montoCuota: deudaData.montoCuota,
        fechaAsignacionGestor: deudaData.fechaAsignacionGestor,
        tasaInteresMoratorio: (deudaData as any).tasaInteresMoratorio,
        tasaInteresPunitorio: (deudaData as any).tasaInteresPunitorio,
        fechaExpiracionAcuerdo: (deudaData as any).fechaExpiracionAcuerdo,
        cuotas: cuotasRecuperadas,
      });
    });
    
    return { deudas, total };
  }
}
