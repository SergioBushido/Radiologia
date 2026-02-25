# SIGEO - Sistema Integral de Gestión de Efectivos Operativos

SIGEO es una aplicación web avanzada diseñada para la gestión profesional de guardias, servicios y ausencias en departamentos de Radiología. Centraliza la planificación, la comunicación interna y el seguimiento de equidad en la asignación de tareas.

## 🚀 Características Principales

- **Calendario Inteligente**: Visualización mensual con gestión de slots diarios, indicadores de estado (vacaciones, cursos, LD) y bloqueos administrativos.
- **Autogeneración Basada en Reglas**: Algoritmo de backtracking que optimiza la equidad, respeta descansos mínimos y cumple con límites mensuales automáticos.
- **Gestión de Ausencias**: Sistema completo para solicitar y gestionar Vacaciones, Cursos y Días de Libre Disposición (LD) con soporte para selección de rangos.
- **Comunicación en Tiempo Real**: Mensajería interna estilo WhatsApp con notificaciones de mensajes no leídos y fotos de perfil.
- **Panel de Administración**: Control total sobre usuarios, grupos, bloqueos mensuales estratégicos y reportes de generación.
- **Diseño Premium**: Interfaz moderna, responsive (Mobile-first) con modo oscuro y animaciones fluidas.

---

## 📘 Guía de Usuario (Personal)

### 1. Gestión de Guardias y Puntos
En la sección **"Puntos"**, puedes definir tus preferencias mensuales:
- **Preferencia (+)**: Indica los días que *deseas* hacer guardia. Gasta puntos para aumentar tu prioridad.
- **Bloqueo (-)**: Indica los días que *no deseas* hacer guardia. Gasta puntos para que el sistema intente evitar asignarte.
- **Lock (Bloqueo Total)**: Dispones de **1 Lock al mes** para asegurar que un día específico quede libre (sin gasto de puntos adicionales, pero limitado a uno).

### 2. Vacaciones y Ausencias
Desde el calendario, haciendo clic en un día (o mediante el botón de **Gestión de Rangos**):
- Selecciona el tipo: **Vacación**, **Curso** o **LD**.
- Define un rango de fechas para aplicar la ausencia de forma masiva.
- Una vez guardado, el sistema te excluirá automáticamente de cualquier guardia en esos días.

### 3. Perfil y Comunicación
- **Perfil**: Sube tu foto de perfil para ser identificado fácilmente en el chat y el calendario.
- **Mensajes**: Comunícate directamente con administración. El icono flotante te avisará si tienes mensajes pendientes.

---

## 🛠 Guía de Administrador

### 1. Gestión de Personal
En el panel de **Administración**:
- Crea usuarios asignándoles un **Grupo** (p.ej. MAMA, URGENCIAS).
- Las reglas de negocio impiden que usuarios del mismo grupo (salvo STANDARD) coincidan en la misma guardia para asegurar cobertura técnica.

### 2. Generación del Calendario
1. Selecciona el mes en el panel de control.
2. Pulsa **Autogenerar**. El sistema procesará todas las reglas, vacaciones y puntos de los usuarios.
3. Revisa el **Informe de Generación** para ver conflictos resueltos y métricas de equidad.
4. Si necesitas cambios manuales, usa el **Editor de Día** directamente en el calendario.

### 3. Bloqueo Mensual Estratégico
El administrador puede **bloquear un mes completo** (icono de candado en el calendario):
- **Efecto**: Los usuarios no podrán añadir, editar ni borrar ninguna preferencia o ausencia mientras el mes esté bloqueado.
- El administrador mantiene permisos totales incluso en meses bloqueados.

---

## ⚙️ Configuración Técnica

### Stack Tecnológico
- **Framework**: Next.js 13 (App & API Routes)
- **Base de Datos**: PostgreSQL vía Supabase
- **ORM**: Prisma
- **Estilos**: TailwindCSS con sistema de temas dinámico
- **Auth**: JWT con almacenamiento seguro

### Reglas de Negocio (Hard Constraints)
- **Descanso**: Mínimo 2 días de separación entre guardias asignadas.
- **Límites**: Máximo 1 jueves, 1 viernes y 2 fines de semana al mes por usuario.
- **Incompatibilidad**: No pueden coincidir MAMA y URGENCIAS en el mismo slot.
- **Prioridad**: Las vacaciones aprobadas tienen prioridad absoluta sobre cualquier asignación.

---

## 🛠 Instalación y Desarrollo

1. **Dependencias**: `npm install`
2. **Entorno**: Configura `.env` con las variables de Supabase (`DATABASE_URL`, `DIRECT_URL`).
3. **Base de Datos**: `npx prisma generate` y `npx prisma db push` (para sincronizar esquema).
4. **Arranque**: `npm run dev`

---
*SIGEO - Desarrollado para la optimización y equidad en servicios de Radiología.*
