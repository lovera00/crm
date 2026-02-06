import { prisma } from '../src/infrastructure/lib/prisma';
import { hashSync } from 'bcryptjs';

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...');

  // Limpiar datos existentes (opcional, cuidado en producción)
  // await prisma.usuario.deleteMany({});
  // await prisma.persona.deleteMany({});
  // await prisma.deudaMaestra.deleteMany({});

  // Crear usuarios de prueba
  const gestor1 = await prisma.usuario.upsert({
    where: { username: 'gestor1' },
    update: {},
    create: {
      username: 'gestor1',
      email: 'gestor1@example.com',
      nombre: 'Juan Pérez',
      rol: 'gestor',
      passwordHash: hashSync('password', 10),
      activo: true,
    },
  });

  const supervisor1 = await prisma.usuario.upsert({
    where: { username: 'supervisor1' },
    update: {},
    create: {
      username: 'supervisor1',
      email: 'supervisor1@example.com',
      nombre: 'María García',
      rol: 'supervisor',
      passwordHash: hashSync('password', 10),
      activo: true,
    },
  });

  const administrador1 = await prisma.usuario.upsert({
    where: { username: 'admin1' },
    update: {},
    create: {
      username: 'admin1',
      email: 'admin1@example.com',
      nombre: 'Carlos López',
      rol: 'administrador',
      passwordHash: hashSync('password', 10),
      activo: true,
    },
  });

  console.log('✅ Usuarios creados:');
  console.log(`   Gestor: ${gestor1.username} (${gestor1.email})`);
  console.log(`   Supervisor: ${supervisor1.username} (${supervisor1.email})`);
  console.log(`   Administrador: ${administrador1.username} (${administrador1.email})`);

  // Crear tipos de gestión básicos
  const tiposGestion = await Promise.all([
    prisma.tipoGestion.upsert({
      where: { nombre: 'Llamada Telefónica' },
      update: {},
      create: {
        nombre: 'Llamada Telefónica',
        descripcion: 'Contacto telefónico con el deudor',
        activo: true,
        orden: 1,
        color: '#3b82f6',
        icono: 'phone',
        creadoPorId: administrador1.id,
      },
    }),
    prisma.tipoGestion.upsert({
      where: { nombre: 'Visita Domiciliaria' },
      update: {},
      create: {
        nombre: 'Visita Domiciliaria',
        descripcion: 'Visita presencial al domicilio del deudor',
        activo: true,
        orden: 2,
        color: '#10b981',
        icono: 'home',
        creadoPorId: administrador1.id,
      },
    }),
    prisma.tipoGestion.upsert({
      where: { nombre: 'Envío de Carta' },
      update: {},
      create: {
        nombre: 'Envío de Carta',
        descripcion: 'Envío de comunicación formal por correo',
        activo: true,
        orden: 3,
        color: '#8b5cf6',
        icono: 'mail',
        creadoPorId: administrador1.id,
      },
    }),
  ]);

  console.log(`✅ ${tiposGestion.length} tipos de gestión creados`);

  // Crear estados de deuda básicos
  const estadosDeuda = await Promise.all([
    prisma.estadoDeuda.upsert({
      where: { nombre: 'Nueva' },
      update: {},
      create: {
        nombre: 'Nueva',
        descripcion: 'Deuda recién ingresada al sistema',
        esEstadoFinal: false,
        requiereAutorizacion: false,
        orden: 1,
        creadoPorId: administrador1.id,
      },
    }),
    prisma.estadoDeuda.upsert({
      where: { nombre: 'En Gestión' },
      update: {},
      create: {
        nombre: 'En Gestión',
        descripcion: 'Deuda en proceso de gestión activa',
        esEstadoFinal: false,
        requiereAutorizacion: false,
        orden: 2,
        creadoPorId: administrador1.id,
      },
    }),
    prisma.estadoDeuda.upsert({
      where: { nombre: 'Acordado' },
      update: {},
      create: {
        nombre: 'Acordado',
        descripcion: 'Deuda con acuerdo de pago establecido',
        esEstadoFinal: false,
        requiereAutorizacion: true,
        orden: 3,
        creadoPorId: administrador1.id,
      },
    }),
    prisma.estadoDeuda.upsert({
      where: { nombre: 'Pagada' },
      update: {},
      create: {
        nombre: 'Pagada',
        descripcion: 'Deuda completamente pagada',
        esEstadoFinal: true,
        requiereAutorizacion: false,
        orden: 4,
        creadoPorId: administrador1.id,
      },
    }),
    prisma.estadoDeuda.upsert({
      where: { nombre: 'Incobrable' },
      update: {},
      create: {
        nombre: 'Incobrable',
        descripcion: 'Deuda considerada incobrable',
        esEstadoFinal: true,
        requiereAutorizacion: true,
        orden: 5,
        creadoPorId: administrador1.id,
      },
    }),
  ]);

  console.log(`✅ ${estadosDeuda.length} estados de deuda creados`);

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