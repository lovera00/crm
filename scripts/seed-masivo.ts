import { PrismaClient, EstadoVerificacion, EstadoContacto } from '../src/generated';

const prisma = new PrismaClient();

const NOMBRES = [
  'Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Carmen', 'Jorge', 'Rosa',
  'Miguel', 'Elena', 'Francisco', 'Isabel', 'Antonio', 'Patricia', 'Jose', 'Monica', 'David',
  'Sandra', 'Javier', 'Lucia', 'Fernando', 'Beatriz', 'Daniel', 'Sofia', 'Carlos', 'Valeria',
  'Alejandro', 'Natalia', 'Ricardo', 'Eugenia', 'Gonzalo', 'Adriana', 'Eduardo', 'Tamara',
  'Diego', 'Sabrina', 'Martin', 'Florencia', 'Bruno', 'Emilia', 'Sebastian', 'Camila', 'Gabriel',
  'Renata', 'Matias', 'Catalina', 'Nicolas', 'Abril', 'Julian', 'Zoe', 'Tomas', 'Lucrecia',
  'Santiago', 'Isidora', 'Andres', 'Emilia', 'Cristian', 'Antonella', 'Alfredo', 'Margarita',
  'Roberto', 'Veronica', 'Hugo', 'Silvia', 'Oscar', 'Norma', 'Sergio', 'Gloria', 'Manuel',
  'Alicia', 'Rafael', 'Denise', 'Alvaro', 'Lorena', 'Pablo', 'Pamela', 'Marcos', 'Vanessa'
];

const APELLIDOS = [
  'Gonzalez', 'Rodriguez', 'Lopez', 'Martinez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores',
  'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Reyes', 'Morales', 'Ortiz', 'Gutierrez', 'Chavez', 'Ramos',
  'Vargas', 'Castillo', 'Jimenez', 'Moreno', 'Romero', 'Herrera', 'Medina', 'Garcia', 'Fernandez',
  'Alvarez', 'Silva', 'Santos', 'Aguilar', 'Soto', 'Rojas', 'Duarte', 'Mendez', 'Castro', 'Vega',
  'Nunez', 'Campos', 'Salas', 'Rivero', 'Arias', 'Espinoza', 'Zamora', 'Benitez', 'Acosta', 'Barrios'
];

const ACREEDORES = [
  'Banco Continental', 'Banco Nacional', 'Credito Paraguay', 'Financiera Sol', 'Cooperativa 15 de Agosto',
  'Cooperativa San Cristobal', 'Crediamigo', 'Banco Itau', 'Banco Regional', 'Credi表达',
  'Financiera Global', 'Cooperativa Lambare', 'Banco do Brasil', 'Banco de la Nacion',
  'Credipar', 'CrediQ', 'Banco Fassil', 'Cooperativa Colonias Unidas'
];

const CONCEPTOS = [
  'Consumo', 'Tarjeta de Credito', 'Prestamo Personal', 'Credito Hipotecario', 'Credito Comercial',
  'Linea de Credito', 'Prestamo Motor', 'Credito Educativo', 'Prestamo Medicinal', 'Credito Vacacional'
];

const DIRECCIONES = [
  'Asuncion', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Fernando de la Mora',
  'Lambare', 'Encarnacion', 'Pedro Juan Caballero', 'Villarrica', 'Coronel Oviedo',
  'Caaguazu', 'Concepcion', 'Villarrica', 'Pilar', 'San Antonio'
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateDocumento(): string {
  return randomInt(1000000, 9999999).toString();
}

function generateTelefono(): string {
  const prefix = randomElement(['098', '097', '096', '099']);
  return prefix + randomInt(1000000, 9999999);
}

async function createGestores() {
  console.log('Creando gestores...');
  
  const gestores = [];
  for (let i = 1; i <= 5; i++) {
    const gestor = await prisma.usuario.upsert({
      where: { username: `gestor${i}` },
      update: {},
      create: {
        username: `gestor${i}`,
        email: `gestor${i}@crm.com`,
        nombre: `Gestor ${i}`,
        rol: 'gestor',
        passwordHash: '$2a$10$placeholderhashfortesting123456789',
        activo: true,
      },
    });
    gestores.push(gestor);
  }
  
  console.log(`  ✓ ${gestores.length} gestores creados`);
  return gestores;
}

async function createEstadosDeuda() {
  console.log('Creando estados de deuda...');
  
  const estados = [
    { nombre: 'Nueva', descripcion: 'Deuda nueva sin gestionar', esEstadoFinal: false, orden: 1 },
    { nombre: 'En Gestión', descripcion: 'Deuda en proceso de cobranza', esEstadoFinal: false, orden: 2 },
    { nombre: 'Acordado', descripcion: 'Deuda con acuerdo de pago', esEstadoFinal: false, orden: 3 },
    { nombre: 'Pagada', descripcion: 'Deuda completamente pagada', esEstadoFinal: true, orden: 4 },
    { nombre: 'Incobrable', descripcion: 'Deuda imposible de cobrar', esEstadoFinal: true, orden: 5 },
  ];

  for (const estado of estados) {
    await prisma.estadoDeuda.upsert({
      where: { nombre: estado.nombre },
      update: {},
      create: estado,
    });
  }
  
  console.log(`  ✓ ${estados.length} estados de deuda creados`);
}

async function createTiposGestion() {
  console.log('Creando tipos de gestión...');
  
  const tipos = [
    { nombre: 'Llamada Telefonica', descripcion: 'Contacto telefonico con el deudor', activo: true, orden: 1, color: '#3B82F6' },
    { nombre: 'Mensaje WhatsApp', descripcion: 'Envio de mensaje por WhatsApp', activo: true, orden: 2, color: '#10B981' },
    { nombre: 'Visita Personal', descripcion: 'Visita al domicilio del deudor', activo: true, orden: 3, color: '#F59E0B' },
    { nombre: 'Acuerdo de Pago', descripcion: 'Negociacion de acuerdo de pago', activo: true, orden: 4, color: '#8B5CF6' },
    { nombre: 'Promesa de Pago', descripcion: 'El deudor promete pagar', activo: true, orden: 5, color: '#EC4899' },
    { nombre: 'No Contactado', descripcion: 'No se logro contacto', activo: true, orden: 6, color: '#6B7280' },
    { nombre: 'Deudor Inubicable', descripcion: 'No se encuentra al deudor', activo: true, orden: 7, color: '#DC2626' },
  ];

  for (const tipo of tipos) {
    await prisma.tipoGestion.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    });
  }
  
  console.log(`  ✓ ${tipos.length} tipos de gestión creados`);
}

async function createPersonasBatch(startId: number, count: number, creadorId: number) {
  const personas = [];
  const batchSize = 10000;
  
  for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
    const batchCount = Math.min(batchSize, count - batch * batchSize);
    const batchData = [];
    
    for (let i = 0; i < batchCount; i++) {
      const nombres = `${randomElement(NOMBRES)} ${randomElement(NOMBRES)}`;
      const apellidos = `${randomElement(APELLIDOS)} ${randomElement(APELLIDOS)}`;
      const funcPub = randomElement(['SI', 'NO', 'Pendiente']) as EstadoVerificacion;
      const jub = randomElement(['SI', 'NO', 'Pendiente']) as EstadoVerificacion;
      const ips = randomElement(['SI', 'NO', 'Pendiente']) as EstadoVerificacion;
      
      batchData.push({
        nombres,
        apellidos,
        documento: generateDocumento(),
        funcionarioPublico: funcPub,
        jubilado: jub,
        ipsActivo: ips,
        creadoPorId: creadorId,
        fechaCreacion: new Date(),
      });
    }
    
    await prisma.persona.createMany({
      data: batchData,
      skipDuplicates: true,
    });
    
    console.log(`  ✓ Creadas ${(batch + 1) * batchCount} personas de ${count}`);
  }
}

async function createDeudasForPersonas(startPersonaId: number, count: number, gestorId: number, creadorId: number) {
  const estados = await prisma.estadoDeuda.findMany();
  const estadoNueva = estados.find(e => e.nombre === 'Nueva')!;
  const estadoEnGestion = estados.find(e => e.nombre === 'En Gestión')!;
  const estadoAcordado = estados.find(e => e.nombre === 'Acordado')!;
  const estadoPagada = estados.find(e => e.nombre === 'Pagada')!;
  const estadoIncobrable = estados.find(e => e.nombre === 'Incobrable')!;

  const batchSize = 5000;
  
  for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
    const batchCount = Math.min(batchSize, count - batch * batchSize);
    const batchData = [];
    
    for (let i = 0; i < batchCount; i++) {
      const personaId = startPersonaId + batch * batchSize + i;
      const numDeudas = randomInt(1, 2);
      
      for (let d = 0; d < numDeudas; d++) {
        const rand = Math.random();
        let estado: typeof estadoNueva;
        if (rand < 0.20) estado = estadoNueva;
        else if (rand < 0.55) estado = estadoEnGestion;
        else if (rand < 0.80) estado = estadoAcordado;
        else if (rand < 0.90) estado = estadoPagada;
        else estado = estadoIncobrable;

        const deudaTotal = randomInt(500000, 50000000);
        
        batchData.push({
          acreedor: randomElement(ACREEDORES),
          concepto: randomElement(CONCEPTOS),
          saldoCapitalTotal: deudaTotal * 0.8,
          deudaTotal,
          estadoActualId: estado.id,
          gestorAsignadoId: null,
          diasMora: randomInt(1, 365),
          diasGestion: randomInt(0, 180),
          gastosCobranza: randomInt(0, 500000),
          interesMoratorio: randomInt(0, 1000000),
          interesPunitorio: randomInt(0, 500000),
          montoCuota: randomInt(100000, 2000000),
          creadoPorId: creadorId,
          fechaCreacion: new Date(),
        });
      }
    }
    
    await prisma.deudaMaestra.createMany({
      data: batchData,
    });
    
    console.log(`  ✓ Creadas ${(batch + 1) * batchCount} deudas`);
  }
}

async function createPersonaDeudas(personaIdStart: number, count: number) {
  const batchSize = 10000;
  
  for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
    const batchCount = Math.min(batchSize, count - batch * batchSize);
    const batchData = [];
    
    for (let i = 0; i < batchCount; i++) {
      const personaId = personaIdStart + batch * batchSize + i;
      
      const deudas = await prisma.deudaMaestra.findMany({
        where: {
          personas: { none: { personaId } }
        },
        take: 2,
      });
      
      for (const deuda of deudas) {
        batchData.push({
          personaId,
          deudaMaestraId: deuda.id,
          esDeudorPrincipal: true,
        });
      }
    }
    
    if (batchData.length > 0) {
      await prisma.personaDeuda.createMany({
        data: batchData,
        skipDuplicates: true,
      });
    }
    
    console.log(`  ✓ Creadas relaciones para ${(batch + 1) * batchCount} personas`);
  }
}

async function createTelefonos(personaIdStart: number, count: number) {
  const batchSize = 10000;
  
  for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
    const batchCount = Math.min(batchSize, count - batch * batchSize);
    const batchData = [];
    
    for (let i = 0; i < batchCount; i++) {
      if (Math.random() < 0.7) {
        const telEstado = 'Activo' as EstadoContacto;
        batchData.push({
          personaId: personaIdStart + batch * batchSize + i,
          numero: generateTelefono(),
          estado: telEstado,
        });
      }
    }
    
    if (batchData.length > 0) {
      await prisma.telefono.createMany({
        data: batchData,
        skipDuplicates: true,
      });
    }
    
    console.log(`  ✓ Cread ${batchData.length} teléfonos`);
  }
}

async function assignClientesToGestores(gestores: { id: number }[], creadorId: number) {
  console.log('Asignando clientes a gestores...');
  
  const clientesPorGestor = 100;
  
  for (const gestor of gestores) {
    const personas = await prisma.persona.findMany({
      take: clientesPorGestor,
      orderBy: { id: 'asc' },
    });
    
    for (const persona of personas) {
      const deudas = await prisma.personaDeuda.findMany({
        where: { personaId: persona.id },
        include: { deudaMaestra: true },
      });
      
      for (const pd of deudas) {
        await prisma.deudaMaestra.update({
          where: { id: pd.deudaMaestraId },
          data: { gestorAsignadoId: gestor.id },
        });
      }
    }
    
    console.log(`  ✓ Gestor ${gestor.id}: ${personas.length} clientes asignados`);
  }
}

async function createSeguimientos(gestores: { id: number }[], creadorId: number) {
  console.log('Creando seguimientos...');
  
  const tiposGestion = await prisma.tipoGestion.findMany();
  const tipoLlamada = tiposGestion.find(t => t.nombre === 'Llamada Telefonica')!;
  const tipoWhatsApp = tiposGestion.find(t => t.nombre === 'Mensaje WhatsApp')!;
  const tipoAcuerdo = tiposGestion.find(t => t.nombre === 'Acuerdo de Pago')!;
  
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];
  
  for (const gestor of gestores) {
    const personas = await prisma.persona.findMany({
      take: 100,
      include: {
        deudas: {
          include: { deudaMaestra: true }
        }
      }
    });
    
    for (const persona of personas) {
      if (persona.deudas.length === 0) continue;
      
      const numSeguimientos = randomInt(1, 3);
      
      for (let s = 0; s < numSeguimientos; s++) {
        const rand = Math.random();
        let fechaProximo: Date | null = null;
        
        if (rand < 0.30) {
          const diasAtras = randomInt(1, 10);
          fechaProximo = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
        } else if (rand < 0.50) {
          fechaProximo = hoy;
        } else if (rand < 0.75) {
          const diasAdelante = randomInt(1, 7);
          fechaProximo = new Date(hoy.getTime() + diasAdelante * 24 * 60 * 60 * 1000);
        }
        
        const randTipo = Math.random();
        let tipoGestionId = tipoLlamada.id;
        if (randTipo < 0.5) tipoGestionId = tipoWhatsApp.id;
        else if (randTipo < 0.7) tipoGestionId = tipoAcuerdo.id;
        
        const seguimiento = await prisma.seguimiento.create({
          data: {
            gestorId: gestor.id,
            personaId: persona.id,
            tipoGestionId,
            fechaHora: randomDate(new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000), hoy),
            observacion: randomElement([
              'Cliente no atiende llamadas',
              'Promete pagar la prox semana',
              'Acordado pago para viernes',
              'Numero fuera de servicio',
              'Contacto con familiar',
              'Deudor trabajo',
              'Dejare mensaje',
              'Llamar en otra hora',
              null,
            ]),
            requiereSeguimiento: fechaProximo !== null,
            fechaProximoSeguimiento: fechaProximo,
            creadoPorId: creadorId,
          },
        });
        
        const deudaIds = persona.deudas.map(d => d.deudaMaestraId).slice(0, 2);
        for (const deudaId of deudaIds) {
          await prisma.seguimientoDeuda.create({
            data: {
              seguimientoId: seguimiento.id,
              deudaMaestraId: deudaId,
            },
          });
        }
      }
    }
    
    console.log(`  ✓ Gestor ${gestor.id}: seguimientos creados`);
  }
}

async function main() {
  console.log('========================================');
  console.log('SEED MASIVO - CRM COBRANZAS');
  console.log('========================================\n');

  const startTime = Date.now();
  
  try {
    await createEstadosDeuda();
    await createTiposGestion();
    
    const gestorAdmin = await prisma.usuario.findFirst({ where: { rol: 'administrador' } });
    const creadorId = gestorAdmin?.id || 1;
    
    const gestores = await createGestores();
    
    const TOTAL_PERSONAS = 100;
    const PERSONAS_POR_GESTOR = 100;
    
    console.log(`\nCreando ${TOTAL_PERSONAS} personas...`);
    const lastPersona = await prisma.persona.findFirst({ orderBy: { id: 'desc' } });
    const startPersonaId = (lastPersona?.id || 0) + 1;
    
    await createPersonasBatch(startPersonaId, TOTAL_PERSONAS, creadorId);
    
    console.log(`\nCreando deudas...`);
    await createDeudasForPersonas(startPersonaId, TOTAL_PERSONAS, gestores[0].id, creadorId);
    
    console.log(`\nCreando relaciones persona-deuda...`);
    await createPersonaDeudas(startPersonaId, TOTAL_PERSONAS);
    
    console.log(`\nCreando teléfonos...`);
    await createTelefonos(startPersonaId, TOTAL_PERSONAS);
    
    console.log(`\nAsignando clientes a gestores...`);
    await assignClientesToGestores(gestores, creadorId);
    
    console.log(`\nCreando seguimientos...`);
    await createSeguimientos(gestores, creadorId);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n========================================');
    console.log('SEED COMPLETADO');
    console.log('========================================');
    console.log(`Duración: ${duration} segundos`);
    console.log(`  - Gestores: 5`);
    console.log(`  - Personas: ${TOTAL_PERSONAS}`);
    console.log(`  - Clientes por gestor: ~${PERSONAS_POR_GESTOR}`);
    
  } catch (error) {
    console.error('Error durante el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
