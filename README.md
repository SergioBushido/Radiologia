# SIGEO - Sistema Integral de Gestión de Efectivos Operativos

SIGEO es una plataforma corporativa avanzada diseñada específicamente para la gestión de guardias y servicios en departamentos médicos (Radiología). La aplicación optimiza la planificación mediante algoritmos de equidad, centraliza la comunicación y garantiza el cumplimiento de reglas de descanso y cobertura.

---

## 🛠 Stack Tecnológico

- **Frontend**: Next.js 13 (Pages Router), React, TailwindCSS.
- **Backend**: API Routes de Next.js.
- **Base de Datos**: PostgreSQL alojado en Supabase.
- **ORM**: Prisma (con soporte para migraciones y tipado fuerte).
- **Autenticación**: JWT (JSON Web Tokens) con sistema de renovación.
- **Diseño**: Mobile-first, Glassmorphism, Soporte nativo para Modo Oscuro/Claro.

---

## 🏗 Arquitectura del Proyecto

```text
├── components/          # Componentes React reutilizables (Calendar, Modals, Nav)
├── lib/                 # Lógica de negocio core (Algoritmo de guardias, Auth context)
├── pages/
│   ├── api/             # Endpoints del Backend (Auth, Shifts, Preferences, Vacations)
│   ├── admin/           # Panel de administración y gestión de usuarios
│   └── index.tsx        # Dashboard principal (Calendario y Tablón)
├── prisma/              # Esquema de base de datos y migraciones
└── styles/              # Configuración de Tailwind y variables globales
```

---

## 🧠 Motor de Generación de Guardias

El núcleo de SIGEO es un **algoritmo de backtracking condicional** (`lib/shiftGenerator.ts`) que procesa miles de combinaciones para encontrar la solución óptima cada mes.

### 1. Restricciones Estrictas (Hard Constraints)
El sistema garantiza que:
- **Descanso Obligatorio**: Mínimo de 48 horas entre guardias consecutivas.
- **Límites Mensuales**: Máximo 1 jueves, 1 viernes y 2 fines de semana por persona.
- **Incompatbilidades**: El sistema impide que usuarios del mismo grupo técnico coincidan (ej. dos especialistas en MAMA), salvo en el grupo 'STANDARD'.
- **Conflictos Críticos**: Impide asignar guardias en días marcados como Vacaciones, Cursos o "LD".

### 2. Sistema de Equidad y Puntos
El algoritmo no es azaroso; utiliza un **sistema de puntuación dinámica**:
- **Equidad Global**: Prioriza a usuarios con menor carga histórica de guardias.
- **Puntos de Preferencia**: Los usuarios pueden gastar puntos para solicitar días específicos ("Deseo") o evitar otros ("Bloqueo").
- **Lock Mensual**: Cada usuario dispone de un bloqueo garantizado (HARD LOCK) que el sistema respeta por encima de cualquier necesidad de servicio.

---

## ✨ Experiencia de Usuario (UX) Premium

SIGEO ha sido diseñado para sentirse como una aplicación nativa de alta gama:
- **Confirmaciones Integradas**: Los diálogos nativos del navegador se han sustituido por modales estilizados con desenfoque de fondo.
- **Feedback en Tiempo Real**: Estados de carga animados (pulse effects) en botones críticos para evitar dobles envíos.
- **Visualización de Datos**: El calendario se adapta dinámicamente; en escritorio muestra nombres completos y en móvil utiliza indicadores visuales (dots) para máxima claridad.
- **Inmersión**: Uso extensivo de `backdrop-filter` y variables CSS dinámicas para que la interfaz sea agradable en largas jornadas de trabajo.

---

## 📘 Gestión Administrativa

El panel de administración permite:
- **Bloqueo de Meses**: Una vez planificado, el administrador puede bloquear el mes para evitar ediciones accidentales por parte del personal.
- **Asignación Manual & Edición**: Los administradores pueden asignar guardias a dedo en cualquier momento (antes o después de generar). 
- **Eliminación Parcial**: Es posible borrar a un solo profesional de una pareja de guardia sin afectar al otro, gracias al sistema de huecos "Libre / Pendiente".
- **Forzado Administrativo**: Posibilidad de ignorar restricciones ("Hard Constraints") en asignaciones manuales críticas desde el panel de edición.
- **Reportes de Conflictos**: Tras cada generación, se crea un informe que detalla qué reglas se aplicaron y qué profesionales cubren cada día.
- **Privacidad Avanzada**: Sistema de usuarios protegidos y exclusión de cuentas de testeo de los algoritmos automáticos.

---

## 🚀 Instalación y Despliegue

### Requisitos Previos
- Node.js 18+
- PostgreSQL (o cuenta en Supabase)

### Pasos
1. Clonar el repositorio.
2. `npm install`
3. Configurar `.env`:
   ```env
   DATABASE_URL="postgres://..."
   DIRECT_URL="postgres://..."
   JWT_SECRET="tu_secreto_super_seguro"
   ```
4. Sincronizar Base de Datos:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Ejecutar en desarrollo: `npm run dev`

---

*SIGEO - Sistema Integral de Gestión de Efectivos Operativos. Garantizando la equidad y el descanso en el sector salud.*
