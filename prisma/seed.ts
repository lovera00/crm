import { prisma } from '../src/infrastructure/lib/prisma';
import { hashSync } from 'bcryptjs';

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...');

  // Limpiar datos existentes
  await prisma.asignacionCartera.deleteMany({});
  await prisma.seguimientoDeuda.deleteMany({});
  await prisma.seguimiento.deleteMany({});
  await prisma.solicitudAutorizacion.deleteMany({});
  await prisma.cuota.deleteMany({});
  await prisma.personaDeuda.deleteMany({});
  await prisma.deudaMaestra.deleteMany({});
  await prisma.referenciaLaboral.deleteMany({});
  await prisma.referenciaPersonal.deleteMany({});
  await prisma.email.deleteMany({});
  await prisma.telefono.deleteMany({});
  await prisma.persona.deleteMany({});
  await prisma.reglaTransicion.deleteMany({});
  await prisma.transicionEstado.deleteMany({});
  await prisma.tipoGestion.deleteMany({});
  await prisma.estadoDeuda.deleteMany({});
  await prisma.usuario.deleteMany({});

  console.log('🗑️ Datos anteriores eliminados');

  // ==================== USUARIOS ====================
  const gestor1 = await prisma.usuario.create({
    data: {
      username: 'gestor1',
      email: 'gestor1@example.com',
      nombre: 'Juan Pérez',
      rol: 'gestor',
      passwordHash: hashSync('password', 10),
      activo: true,
    },
  });

  const gestor2 = await prisma.usuario.create({
    data: {
      username: 'gestor2',
      email: 'gestor2@example.com',
      nombre: 'Ana Martínez',
      rol: 'gestor',
      passwordHash: hashSync('password', 10),
      activo: true,
    },
  });

  const supervisor1 = await prisma.usuario.create({
    data: {
      username: 'supervisor1',
      email: 'supervisor1@example.com',
      nombre: 'María García',
      rol: 'supervisor',
      passwordHash: hashSync('password', 10),
      activo: true,
    },
  });

  const administrador1 = await prisma.usuario.create({
    data: {
      username: 'admin1',
      email: 'admin1@example.com',
      nombre: 'Carlos López',
      rol: 'administrador',
      passwordHash: hashSync('password', 10),
      activo: true,
    },
  });

  console.log('✅ 4 usuarios creados');

  // ==================== ESTADOS DE DEUDA ====================
  const estadoNueva = await prisma.estadoDeuda.create({
    data: {
      nombre: 'Nueva',
      descripcion: 'Deuda recién ingresada al sistema',
      esEstadoFinal: false,
      requiereAutorizacion: false,
      orden: 1,
    },
  });

  const estadoEnGestion = await prisma.estadoDeuda.create({
    data: {
      nombre: 'En Gestión',
      descripcion: 'Deuda en proceso de gestión activa',
      esEstadoFinal: false,
      requiereAutorizacion: false,
      orden: 2,
    },
  });

  const estadoAcordado = await prisma.estadoDeuda.create({
    data: {
      nombre: 'Acordado',
      descripcion: 'Deuda con acuerdo de pago establecido',
      esEstadoFinal: false,
      requiereAutorizacion: true,
      orden: 3,
    },
  });

  const estadoPagada = await prisma.estadoDeuda.create({
    data: {
      nombre: 'Pagada',
      descripcion: 'Deuda completamente pagada',
      esEstadoFinal: true,
      requiereAutorizacion: false,
      orden: 4,
    },
  });

  const estadoIncobrable = await prisma.estadoDeuda.create({
    data: {
      nombre: 'Incobrable',
      descripcion: 'Deuda considerada incobrable',
      esEstadoFinal: true,
      requiereAutorizacion: true,
      orden: 5,
    },
  });

  console.log('✅ 5 estados de deuda creados');

  // ==================== TIPOS DE GESTIÓN ====================
  const tipoLlamada = await prisma.tipoGestion.create({
    data: {
      nombre: 'Llamada Telefónica',
      descripcion: 'Contacto telefónico con el deudor',
      activo: true,
      orden: 1,
      color: '#3b82f6',
      icono: 'phone',
    },
  });

  const tipoVisita = await prisma.tipoGestion.create({
    data: {
      nombre: 'Visita Domiciliaria',
      descripcion: 'Visita presencial al domicilio del deudor',
      activo: true,
      orden: 2,
      color: '#10b981',
      icono: 'home',
    },
  });

  const tipoCarta = await prisma.tipoGestion.create({
    data: {
      nombre: 'Envío de Carta',
      descripcion: 'Envío de comunicación formal por correo',
      activo: true,
      orden: 3,
      color: '#8b5cf6',
      icono: 'mail',
    },
  });

  const tipoWhatsapp = await prisma.tipoGestion.create({
    data: {
      nombre: 'WhatsApp',
      descripcion: 'Contacto por WhatsApp',
      activo: true,
      orden: 4,
      color: '#25D366',
      icono: 'message-circle',
    },
  });

  const tipoAcuerdo = await prisma.tipoGestion.create({
    data: {
      nombre: 'Negociar Acuerdo',
      descripcion: 'Negociación de acuerdo de pago',
      activo: true,
      orden: 5,
      color: '#f59e0b',
      icono: 'handshake',
    },
  });

  console.log('✅ 5 tipos de gestión creados');

  // ==================== REGLAS DE TRANSICIÓN ====================
  // Nueva -> En Gestión (primer contacto)
  await prisma.reglaTransicion.create({
    data: {
      tipoGestionId: tipoLlamada.id,
      estadoOrigenId: estadoNueva.id,
      estadoDestinoId: estadoEnGestion.id,
      requiereAutorizacion: false,
      mensajeUi: 'Al primer contacto, la deuda pasa a "En Gestión"',
      prioridad: 1,
      activo: true,
    },
  });

  // En Gestión -> Acordado (negociar acuerdo)
  await prisma.reglaTransicion.create({
    data: {
      tipoGestionId: tipoAcuerdo.id,
      estadoOrigenId: estadoEnGestion.id,
      estadoDestinoId: estadoAcordado.id,
      requiereAutorizacion: true,
      mensajeUi: 'El acuerdo de pago requiere aprobación del supervisor',
      prioridad: 1,
      activo: true,
    },
  });

  // Cualquiera -> Incobrable (visita)
  await prisma.reglaTransicion.create({
    data: {
      tipoGestionId: tipoVisita.id,
      estadoOrigenId: null,
      estadoDestinoId: estadoIncobrable.id,
      requiereAutorizacion: true,
      mensajeUi: 'Declarar incobrable requiere aprobación del supervisor',
      prioridad: 1,
      activo: true,
    },
  });

  console.log('✅ 3 reglas de transición creadas');

  // ==================== PERSONAS ====================
  // Persona 1: Deudor principal con deudas
  const persona1 = await prisma.persona.create({
    data: {
      nombres: 'José',
      apellidos: 'González Ferreira',
      documento: '1234567-8',
      funcionarioPublico: 'NO',
      jubilado: 'NO',
      ipsActivo: 'SI',
      datosVarios: {
        entidad_origen: 'Banco Continental',
        numero_contrato: 'CT-2024-001',
        fecha_moroso_inicial: '2024-01-15',
        direccion_fiscal: 'Av. Aviadores del Chaco 1234',
        ciudad: 'Asunción',
      },
      telefonos: {
        create: [
          { numero: '+595 981 123456', estado: 'Activo' },
          { numero: '+595 21 123456', estado: 'Pendiente_de_Verificacion' },
        ],
      },
      emails: {
        create: [
          { email: 'jose.gonzalez@example.com', estado: 'Activo' },
        ],
      },
      referenciasPersonales: {
        create: [
          { nombre: 'María López', parentesco: 'Hermano', telefono: '+595 981 654321', estado: 'Activo' },
        ],
      },
      referenciasLaborales: {
        create: [
          { nombre: 'Roberto Silva', empresa: 'Empresa ABC', telefono: '+595 21 987654', estado: 'Activo' },
        ],
      },
    },
  });

  // Persona 2: Codeudor
  const persona2 = await prisma.persona.create({
    data: {
      nombres: 'Carmen',
      apellidos: 'Ruiz de González',
      documento: '2345678-9',
      funcionarioPublico: 'SI',
      jubilado: 'NO',
      ipsActivo: 'NO',
      datosVarios: {
        entidad_origen: 'Banco Continental',
        numero_contrato: 'CT-2024-001',
      },
      telefonos: {
        create: [
          { numero: '+595 982 234567', estado: 'Activo' },
        ],
      },
      emails: {
        create: [
          { email: 'carmen.ruiz@example.com', estado: 'Activo' },
        ],
      },
    },
  });

  // Persona 3: Otra persona con deudas
  const persona3 = await prisma.persona.create({
    data: {
      nombres: 'Pedro',
      apellidos: 'Martínez Ávalos',
      documento: '3456789-0',
      funcionarioPublico: 'NO',
      jubilado: 'SI',
      ipsActivo: 'NO',
      datosVarios: {
        entidad_origen: 'Cooperativa mbareté',
        numero_contrato: 'CT-2024-002',
        fecha_moroso_inicial: '2024-03-01',
      },
      telefonos: {
        create: [
          { numero: '+595 983 345678', estado: 'Activo' },
        ],
      },
    },
  });

  // Persona 4: Sin deudas aún
  const persona4 = await prisma.persona.create({
    data: {
      nombres: 'Laura',
      apellidos: 'Benítez Correa',
      documento: '4567890-1',
      funcionarioPublico: 'NO',
      jubilado: 'NO',
      ipsActivo: 'Pendiente',
      telefonos: {
        create: [
          { numero: '+595 984 456789', estado: 'Pendiente_de_Verificacion' },
        ],
      },
    },
  });

  console.log('✅ 4 personas creadas');

  // ==================== DEUDAS MAESTRAS ====================
  // Deuda 1: José González - Banco Continental
  const deuda1 = await prisma.deudaMaestra.create({
    data: {
      acreedor: 'Banco Continental',
      concepto: 'Préstamo Personal - Cuota #12 vencida',
      saldoCapitalTotal: 45000000,
      deudaTotal: 52000000,
      estadoActualId: estadoEnGestion.id,
      gestorAsignadoId: gestor1.id,
      diasMora: 45,
      diasGestion: 30,
      gastosCobranza: 500000,
      interesMoratorio: 2500000,
      interesPunitorio: 0,
      montoCuota: 3500000,
      fechaAsignacionGestor: new Date('2024-01-20'),
      fechaUltimoPago: new Date('2024-11-15'),
      cuotas: {
        create: [
          {
            numeroCuota: 10,
            fechaVencimiento: new Date('2024-10-15'),
            capitalOriginal: 3500000,
            saldoCapital: 0,
            interesMoratorioAcumulado: 0,
            interesPunitorioAcumulado: 0,
            estadoCuota: 'Pagada',
            montoCuota: 3500000,
          },
          {
            numeroCuota: 11,
            fechaVencimiento: new Date('2024-11-15'),
            capitalOriginal: 3500000,
            saldoCapital: 3500000,
            interesMoratorioAcumulado: 175000,
            interesPunitorioAcumulado: 0,
            estadoCuota: 'Pagada',
            montoCuota: 3500000,
          },
          {
            numeroCuota: 12,
            fechaVencimiento: new Date('2024-12-15'),
            capitalOriginal: 3500000,
            saldoCapital: 3500000,
            interesMoratorioAcumulado: 350000,
            interesPunitorioAcumulado: 0,
            estadoCuota: 'Vencida',
            montoCuota: 3500000,
          },
          {
            numeroCuota: 13,
            fechaVencimiento: new Date('2025-01-15'),
            capitalOriginal: 3500000,
            saldoCapital: 3500000,
            interesMoratorioAcumulado: 0,
            interesPunitorioAcumulado: 0,
            estadoCuota: 'Pendiente',
            montoCuota: 3500000,
          },
        ],
      },
    },
  });

  // Relación persona-deuda (José es deudor principal)
  await prisma.personaDeuda.create({
    data: {
      personaId: persona1.id,
      deudaMaestraId: deuda1.id,
      esDeudorPrincipal: true,
    },
  });

  // Relación persona-deuda (Carmen es codeudor)
  await prisma.personaDeuda.create({
    data: {
      personaId: persona2.id,
      deudaMaestraId: deuda1.id,
      esDeudorPrincipal: false,
    },
  });

  // Deuda 2: José González - Otra deuda
  const deuda2 = await prisma.deudaMaestra.create({
    data: {
      acreedor: 'Crediamigo',
      concepto: 'Crédito de consumo',
      saldoCapitalTotal: 15000000,
      deudaTotal: 18500000,
      estadoActualId: estadoNueva.id,
      gestorAsignadoId: gestor1.id,
      diasMora: 15,
      diasGestion: 5,
      montoCuota: 1200000,
      fechaAsignacionGestor: new Date('2024-12-20'),
    },
  });

  await prisma.personaDeuda.create({
    data: {
      personaId: persona1.id,
      deudaMaestraId: deuda2.id,
      esDeudorPrincipal: true,
    },
  });

  // Deuda 3: Pedro Martínez - Cooperativa
  const deuda3 = await prisma.deudaMaestra.create({
    data: {
      acreedor: 'Cooperativa mbareté',
      concepto: 'Préstamo prendario',
      saldoCapitalTotal: 28000000,
      deudaTotal: 32000000,
      estadoActualId: estadoAcordado.id,
      gestorAsignadoId: gestor2.id,
      diasMora: 60,
      diasGestion: 45,
      montoCuota: 2200000,
      fechaAsignacionGestor: new Date('2024-10-01'),
      fechaExpiracionAcuerdo: new Date('2025-03-01'),
    },
  });

  await prisma.personaDeuda.create({
    data: {
      personaId: persona3.id,
      deudaMaestraId: deuda3.id,
      esDeudorPrincipal: true,
    },
  });

  // Deuda 4: José - Ya pagada
  const deuda4 = await prisma.deudaMaestra.create({
    data: {
      acreedor: 'Banco Regional',
      concepto: 'Tarjeta de crédito',
      saldoCapitalTotal: 0,
      deudaTotal: 0,
      estadoActualId: estadoPagada.id,
      gestorAsignadoId: gestor1.id,
      diasMora: 0,
      diasGestion: 90,
      montoCuota: 800000,
      fechaAsignacionGestor: new Date('2024-06-01'),
      fechaUltimoPago: new Date('2024-09-15'),
    },
  });

  await prisma.personaDeuda.create({
    data: {
      personaId: persona1.id,
      deudaMaestraId: deuda4.id,
      esDeudorPrincipal: true,
    },
  });

  console.log('✅ 4 deudas maestras creadas con cuotas');

  // ==================== SEGUIMIENTOS ====================
  // Seguimientos para deuda1
  const seg1 = await prisma.seguimiento.create({
    data: {
      gestorId: gestor1.id,
      personaId: persona1.id,
      tipoGestionId: tipoLlamada.id,
      observacion: 'Cliente atiende, indica que realizará pago parcial esta semana',
      requiereSeguimiento: true,
      fechaProximoSeguimiento: new Date('2025-01-25'),
      deudas: {
        create: [{ deudaMaestraId: deuda1.id }],
      },
    },
  });

  const seg2 = await prisma.seguimiento.create({
    data: {
      gestorId: gestor1.id,
      personaId: persona1.id,
      tipoGestionId: tipoWhatsapp.id,
      observacion: 'Enviado recordatorio por WhatsApp',
      requiereSeguimiento: false,
      deudas: {
        create: [{ deudaMaestraId: deuda1.id }],
      },
    },
  });

  // Seguimiento con solicitud de autorización
  const seg3 = await prisma.seguimiento.create({
    data: {
      gestorId: gestor1.id,
      personaId: persona1.id,
      tipoGestionId: tipoAcuerdo.id,
      observacion: 'Cliente propone pagar en 6 cuotas de Gs. 8.000.000 cada una',
      requiereSeguimiento: false,
      deudas: {
        create: [{ deudaMaestraId: deuda1.id }],
      },
    },
  });

  // Crear solicitud de autorización
  await prisma.solicitudAutorizacion.create({
    data: {
      seguimientoId: seg3.id,
      deudaMaestraId: deuda1.id,
      estadoOrigenId: estadoEnGestion.id,
      estadoDestinoId: estadoAcordado.id,
      gestorSolicitanteId: gestor1.id,
      supervisorAsignadoId: supervisor1.id,
      estadoSolicitud: 'Pendiente',
      comentarioSolicitante: 'Cliente con buen historial, propone acuerdo viable',
      prioridad: 'Media',
    },
  });

  console.log('✅ 3 seguimientos creados (1 con solicitud de autorización)');

  // ==================== ASIGNACIONES DE CARTERA ====================
  await prisma.asignacionCartera.create({
    data: {
      deudaMaestraId: deuda1.id,
      gestorId: gestor1.id,
      supervisorAsignadorId: supervisor1.id,
      activo: true,
    },
  });

  await prisma.asignacionCartera.create({
    data: {
      deudaMaestraId: deuda2.id,
      gestorId: gestor1.id,
      supervisorAsignadorId: supervisor1.id,
      activo: true,
    },
  });

  await prisma.asignacionCartera.create({
    data: {
      deudaMaestraId: deuda3.id,
      gestorId: gestor2.id,
      supervisorAsignadorId: supervisor1.id,
      activo: true,
    },
  });

  console.log('✅ 3 asignaciones de cartera creadas');

  // ==================== RESUMEN ====================
  console.log('\n📋 RESUMEN DEL SEED:');
  console.log('====================');
  console.log('👥 Usuarios:');
  console.log(`   - Administrador: admin1 (password: password)`);
  console.log(`   - Supervisor: supervisor1 (password: password)`);
  console.log(`   - Gestores: gestor1, gestor2 (password: password)`);
  console.log('');
  console.log('👤 Personas:');
  console.log(`   - José González Ferreira (${persona1.documento})`);
  console.log(`   - Carmen Ruiz de González (${persona2.documento}) - Codeudora`);
  console.log(`   - Pedro Martínez Ávalos (${persona3.documento})`);
  console.log(`   - Laura Benítez Correa (${persona4.documento}) - Sin deudas`);
  console.log('');
  console.log('💰 Deudas:');
  console.log(`   - Deuda 1: Banco Continental - Gs. 52.000.000 (En Gestión)`);
  console.log(`   - Deuda 2: Crediamigo - Gs. 18.500.000 (Nueva)`);
  console.log(`   - Deuda 3: Cooperativa mbareté - Gs. 32.000.000 (Acordado)`);
  console.log(`   - Deuda 4: Banco Regional - Pagada`);
  console.log('');
  console.log('📝 Tipos de Gestión: 5');
  console.log('📊 Estados de Deuda: 5');
  console.log('⚙️ Reglas de Transición: 3');
  console.log('');
  console.log('🌱 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
