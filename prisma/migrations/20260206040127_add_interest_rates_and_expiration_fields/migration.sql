-- CreateEnum
CREATE TYPE "EstadoVerificacion" AS ENUM ('SI', 'NO', 'Pendiente');

-- CreateEnum
CREATE TYPE "EstadoContacto" AS ENUM ('Pendiente_de_Verificacion', 'Activo', 'Inactivo');

-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('Pendiente', 'Vencida', 'Pagada', 'En_Acuerdo');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('Pendiente', 'Aprobada', 'Rechazada', 'Expirada');

-- CreateEnum
CREATE TYPE "PrioridadSolicitud" AS ENUM ('Baja', 'Media', 'Alta', 'Critica');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "funcionarioPublico" "EstadoVerificacion" NOT NULL DEFAULT 'Pendiente',
    "fechaModFuncionario" TIMESTAMP(3),
    "jubilado" "EstadoVerificacion" NOT NULL DEFAULT 'Pendiente',
    "fechaModJubilado" TIMESTAMP(3),
    "ipsActivo" "EstadoVerificacion" NOT NULL DEFAULT 'Pendiente',
    "fechaModIps" TIMESTAMP(3),
    "datosVarios" JSONB,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telefonos" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "estado" "EstadoContacto" NOT NULL DEFAULT 'Pendiente_de_Verificacion',
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telefonos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "estado" "EstadoContacto" NOT NULL DEFAULT 'Pendiente_de_Verificacion',
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referencias_personales" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "estado" "EstadoContacto" NOT NULL DEFAULT 'Pendiente_de_Verificacion',
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referencias_personales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referencias_laborales" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "telefono" TEXT NOT NULL,
    "estado" "EstadoContacto" NOT NULL DEFAULT 'Pendiente_de_Verificacion',
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referencias_laborales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estados_deuda" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "esEstadoFinal" BOOLEAN NOT NULL DEFAULT false,
    "requiereAutorizacion" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estados_deuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deudas_maestras" (
    "id" SERIAL NOT NULL,
    "acreedor" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "saldoCapitalTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deudaTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estadoActualId" INTEGER NOT NULL,
    "gestorAsignadoId" INTEGER,
    "diasMora" INTEGER NOT NULL DEFAULT 0,
    "diasGestion" INTEGER NOT NULL DEFAULT 0,
    "gastosCobranza" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interesMoratorio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interesPunitorio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaUltimoPago" TIMESTAMP(3),
    "montoCuota" DOUBLE PRECISION,
    "fechaAsignacionGestor" TIMESTAMP(3),
    "tasaInteresMoratorio" DOUBLE PRECISION,
    "tasaInteresPunitorio" DOUBLE PRECISION,
    "fechaExpiracionAcuerdo" TIMESTAMP(3),
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deudas_maestras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas" (
    "id" SERIAL NOT NULL,
    "deudaMaestraId" INTEGER NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "capitalOriginal" DOUBLE PRECISION NOT NULL,
    "saldoCapital" DOUBLE PRECISION NOT NULL,
    "interesMoratorioAcumulado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interesPunitorioAcumulado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estadoCuota" "EstadoCuota" NOT NULL DEFAULT 'Pendiente',
    "fechaUltimoPago" TIMESTAMP(3),
    "montoCuota" DOUBLE PRECISION,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas_deudas" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "deudaMaestraId" INTEGER NOT NULL,
    "esDeudorPrincipal" BOOLEAN NOT NULL DEFAULT true,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_deudas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_gestion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "icono" TEXT,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_gestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos" (
    "id" SERIAL NOT NULL,
    "gestorId" INTEGER NOT NULL,
    "personaId" INTEGER NOT NULL,
    "tipoGestionId" INTEGER NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,
    "requiereSeguimiento" BOOLEAN NOT NULL DEFAULT false,
    "fechaProximoSeguimiento" TIMESTAMP(3),
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos_deudas" (
    "id" SERIAL NOT NULL,
    "seguimientoId" INTEGER NOT NULL,
    "deudaMaestraId" INTEGER NOT NULL,

    CONSTRAINT "seguimientos_deudas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_transicion" (
    "id" SERIAL NOT NULL,
    "tipoGestionId" INTEGER NOT NULL,
    "estadoOrigenId" INTEGER,
    "estadoDestinoId" INTEGER,
    "requiereAutorizacion" BOOLEAN NOT NULL DEFAULT false,
    "mensajeUi" TEXT,
    "validacionAdicional" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglas_transicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transiciones_estado" (
    "id" SERIAL NOT NULL,
    "estadoOrigenId" INTEGER NOT NULL,
    "estadoDestinoId" INTEGER NOT NULL,
    "requiereAutorizacion" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transiciones_estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_autorizacion" (
    "id" SERIAL NOT NULL,
    "seguimientoId" INTEGER NOT NULL,
    "deudaMaestraId" INTEGER NOT NULL,
    "estadoOrigenId" INTEGER NOT NULL,
    "estadoDestinoId" INTEGER NOT NULL,
    "gestorSolicitanteId" INTEGER NOT NULL,
    "supervisorAsignadoId" INTEGER,
    "estadoSolicitud" "EstadoSolicitud" NOT NULL DEFAULT 'Pendiente',
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaResolucion" TIMESTAMP(3),
    "comentarioSolicitante" TEXT,
    "comentarioSupervisor" TEXT,
    "prioridad" "PrioridadSolicitud" NOT NULL DEFAULT 'Media',
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_autorizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_cartera" (
    "id" SERIAL NOT NULL,
    "deudaMaestraId" INTEGER NOT NULL,
    "gestorId" INTEGER NOT NULL,
    "supervisorAsignadorId" INTEGER,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaReasignacion" TIMESTAMP(3),
    "motivoReasignacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoPorId" INTEGER,
    "fechaModificacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_cartera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "personas_documento_key" ON "personas"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "emails_email_key" ON "emails"("email");

-- CreateIndex
CREATE UNIQUE INDEX "estados_deuda_nombre_key" ON "estados_deuda"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "personas_deudas_personaId_deudaMaestraId_key" ON "personas_deudas"("personaId", "deudaMaestraId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_gestion_nombre_key" ON "tipos_gestion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "seguimientos_deudas_seguimientoId_deudaMaestraId_key" ON "seguimientos_deudas"("seguimientoId", "deudaMaestraId");

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telefonos" ADD CONSTRAINT "telefonos_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telefonos" ADD CONSTRAINT "telefonos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telefonos" ADD CONSTRAINT "telefonos_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_personales" ADD CONSTRAINT "referencias_personales_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_personales" ADD CONSTRAINT "referencias_personales_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_personales" ADD CONSTRAINT "referencias_personales_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_laborales" ADD CONSTRAINT "referencias_laborales_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_laborales" ADD CONSTRAINT "referencias_laborales_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referencias_laborales" ADD CONSTRAINT "referencias_laborales_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estados_deuda" ADD CONSTRAINT "estados_deuda_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estados_deuda" ADD CONSTRAINT "estados_deuda_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deudas_maestras" ADD CONSTRAINT "deudas_maestras_estadoActualId_fkey" FOREIGN KEY ("estadoActualId") REFERENCES "estados_deuda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deudas_maestras" ADD CONSTRAINT "deudas_maestras_gestorAsignadoId_fkey" FOREIGN KEY ("gestorAsignadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deudas_maestras" ADD CONSTRAINT "deudas_maestras_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deudas_maestras" ADD CONSTRAINT "deudas_maestras_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_deudaMaestraId_fkey" FOREIGN KEY ("deudaMaestraId") REFERENCES "deudas_maestras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas_deudas" ADD CONSTRAINT "personas_deudas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas_deudas" ADD CONSTRAINT "personas_deudas_deudaMaestraId_fkey" FOREIGN KEY ("deudaMaestraId") REFERENCES "deudas_maestras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas_deudas" ADD CONSTRAINT "personas_deudas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_gestion" ADD CONSTRAINT "tipos_gestion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_gestion" ADD CONSTRAINT "tipos_gestion_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_tipoGestionId_fkey" FOREIGN KEY ("tipoGestionId") REFERENCES "tipos_gestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos" ADD CONSTRAINT "seguimientos_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_deudas" ADD CONSTRAINT "seguimientos_deudas_seguimientoId_fkey" FOREIGN KEY ("seguimientoId") REFERENCES "seguimientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_deudas" ADD CONSTRAINT "seguimientos_deudas_deudaMaestraId_fkey" FOREIGN KEY ("deudaMaestraId") REFERENCES "deudas_maestras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_transicion" ADD CONSTRAINT "reglas_transicion_tipoGestionId_fkey" FOREIGN KEY ("tipoGestionId") REFERENCES "tipos_gestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_transicion" ADD CONSTRAINT "reglas_transicion_estadoOrigenId_fkey" FOREIGN KEY ("estadoOrigenId") REFERENCES "estados_deuda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_transicion" ADD CONSTRAINT "reglas_transicion_estadoDestinoId_fkey" FOREIGN KEY ("estadoDestinoId") REFERENCES "estados_deuda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_transicion" ADD CONSTRAINT "reglas_transicion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_transicion" ADD CONSTRAINT "reglas_transicion_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transiciones_estado" ADD CONSTRAINT "transiciones_estado_estadoOrigenId_fkey" FOREIGN KEY ("estadoOrigenId") REFERENCES "estados_deuda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transiciones_estado" ADD CONSTRAINT "transiciones_estado_estadoDestinoId_fkey" FOREIGN KEY ("estadoDestinoId") REFERENCES "estados_deuda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transiciones_estado" ADD CONSTRAINT "transiciones_estado_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transiciones_estado" ADD CONSTRAINT "transiciones_estado_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_seguimientoId_fkey" FOREIGN KEY ("seguimientoId") REFERENCES "seguimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_deudaMaestraId_fkey" FOREIGN KEY ("deudaMaestraId") REFERENCES "deudas_maestras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_estadoOrigenId_fkey" FOREIGN KEY ("estadoOrigenId") REFERENCES "estados_deuda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_estadoDestinoId_fkey" FOREIGN KEY ("estadoDestinoId") REFERENCES "estados_deuda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_gestorSolicitanteId_fkey" FOREIGN KEY ("gestorSolicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_supervisorAsignadoId_fkey" FOREIGN KEY ("supervisorAsignadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_autorizacion" ADD CONSTRAINT "solicitudes_autorizacion_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_cartera" ADD CONSTRAINT "asignaciones_cartera_deudaMaestraId_fkey" FOREIGN KEY ("deudaMaestraId") REFERENCES "deudas_maestras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_cartera" ADD CONSTRAINT "asignaciones_cartera_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_cartera" ADD CONSTRAINT "asignaciones_cartera_supervisorAsignadorId_fkey" FOREIGN KEY ("supervisorAsignadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_cartera" ADD CONSTRAINT "asignaciones_cartera_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_cartera" ADD CONSTRAINT "asignaciones_cartera_modificadoPorId_fkey" FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
