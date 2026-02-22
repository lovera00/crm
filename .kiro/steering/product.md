# Product Overview

Sistema integral de gestión de cobranzas para entornos de call center. Permite gestionar deudores, codeudores, referencias, deudas con cuotas, y seguimientos de gestión con una máquina de estados configurable.

## Core Features

- Gestión completa de personas (deudores, codeudores, referencias personales y laborales)
- Sistema de deudas con cuotas y estados configurables
- Registro detallado de seguimientos con impacto automático en estados de deuda
- Sistema de reglas de negocio configurable por administradores
- Roles diferenciados: Gestor, Supervisor, Administrador
- Cálculos automáticos diarios (mora, gestión, totales)
- Sistema de autorizaciones para cambios de estado críticos
- Gestión de carteras con asignación de deudas a gestores

## Business Domain

El sistema implementa una máquina de estados para deudas con transiciones configurables. Los gestores registran seguimientos que pueden disparar cambios de estado automáticos según reglas configuradas. Algunos cambios requieren autorización de supervisores.

Estados principales: Nuevo, En Gestión, Con Acuerdo, Cancelada, Incobrable, Judicializada, Fallecido, Suspendida.

## User Roles

- **Gestor**: Usuario operativo que gestiona su cartera asignada, crea seguimientos, solicita autorizaciones
- **Supervisor**: Monitorea operación, autoriza solicitudes, gestiona carteras, puede cambiar estados manualmente
- **Administrador**: Configura reglas de negocio, tipos de gestión, gestiona usuarios y parámetros del sistema
