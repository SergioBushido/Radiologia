## Aplicación de guardias y servicios

Aplicación para **gestión de guardias y servicios de Radiología**, con:

- **Frontend**: Next.js 13, React 18, TailwindCSS (UI mobile‑first).
- **Backend**: API Routes de Next.js con Prisma.
- **Base de datos**: SQLite (por defecto, fichero en `prisma/dev.db`).

Incluye:

- Gestión de **usuarios**, roles (`ADMIN` / `USER`) y grupos (p.ej. `MAMA`, `URGENCIAS`).
- Calendario interactivo de guardias con dos slots por día.
- **Autogeneración** de calendario de guardias con reglas de equidad.
- **Preferencias y bloqueos** por día con sistema de puntos.
- Bloqueo mensual de un día completo vía entidad `Block`.
- Estadísticas personales de guardias y puntos.
- Sistema de **mensajería interna** entre usuarios y panel de conversaciones para admin.
- Panel de administración con creación/edición de usuarios y herramientas sobre guardias.

---

## Requisitos y arranque local (Windows)

- **Node.js** 18+
- **npm**

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear un archivo `.env` en la raíz (si no existe) con al menos:

```bash
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="cambia-este-secreto"
```

Puedes ajustar `DATABASE_URL` si usas otra ruta de SQLite o un motor distinto.

### 3. Generar cliente Prisma y aplicar migraciones

```bash
npm run prisma:generate
npm run prisma:migrate
```

Esto crea/actualiza el esquema de la base de datos en `prisma/dev.db` a partir de `schema.prisma`.

### 4. Ejecutar seed para crear usuarios y admin

```bash
npm run seed
```

El seed crea varios usuarios de ejemplo y un admin:

- **Email**: `admin@youshift.local`
- **Password**: `Password123!`

### 5. Iniciar en modo desarrollo

```bash
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`.

---

## Roles y modelo funcional

- **ADMIN**
  - Accede al panel `/admin`.
  - Crea/edita/elimina usuarios.
  - Lanza el **autogenerador** de guardias por mes.
  - Puede resetear todas las guardias de un mes.
  - Puede consultar y gestionar bloqueos de cualquier usuario.
  - Tiene panel de conversaciones de mensajes con todo el personal.

- **USER**
  - Accede al calendario general `/` (tras login).
  - Consulta sus guardias y puntos en `/mis-guardias`.
  - Marca **preferencias** y **bloqueos** por día en `/preferences` usando puntos.
  - Puede tener 1 **bloqueo mensual** completo vía endpoint de `blocks`.
  - Envía y recibe mensajes con administración desde `/mensajes`.

---

## Flujo de uso por pantallas

### `/login`

Pantalla de acceso a la aplicación.

- Formulario con campos **email** y **password**.
- Llama a `POST /api/auth/login`.
- Si el login es correcto:
  - Guarda el **JWT** en `localStorage` (`token`).
  - Redirige a `/`.

### `/` (Calendario principal)

Requiere estar logueado (usa `useAuth` y redirige a `/login` si no hay usuario).

- Muestra el componente `Calendar` con:
  - Vista mensual con las guardias del mes (dos slots por día).
  - Posibilidad de ver detalles de un día (`DayDetailModal`) y editar guardias (`DayEditor`) según permisos.
  - Información de bloqueos, forzados, conflictos, etc.
- Acceso rápido a `/preferences` (puntos y preferencias) desde el botón de “Puntos”.

### `/mis-guardias`

Resumen personal del usuario autenticado.

- Pide `GET /api/shifts?month=YYYY-MM` y filtra solo las guardias del usuario.
- Consulta `/api/users/:id/stats?month=YYYY-MM` para mostrar:
  - **Total** de guardias del mes.
  - **Puntos** acumulados.
  - Número de guardias en **jueves**, **viernes** y **fines de semana**.
- Lista detallada de guardias con día de la semana, fecha y slot ocupado (SLOT 1 o 2).

### `/preferences`

Pantalla para que cada usuario indique sus **preferencias** y **evitaciones (blocks)** dentro de un mes, usando puntos.

- Selección de mes (navegación mes anterior / siguiente).
- Grid de calendario del mes actual:
  - Cada día puede tener:
    - Sin preferencia.
    - Preferencia positiva (`PREFERENCE`) con X puntos.
    - Bloqueo (`BLOCK`) con X puntos.
- Lógica de puntos:
  - Contador de puntos totales utilizados (`totalPointsUsed`).
  - Sistema de **Deseo Guardia** (20 puntos) y **Evitar Guardia** (20 puntos independientes).
  - Los puntos se asignan por día y se usan para priorizar o penalizar la asignación.
  - Bloqueo Total (LOCK): Permite bloquear un día concreto (máximo 1 al mes).
  - Asignar bloqueo (`BLOCK`, también gasta puntos).
  - Poner 0 puntos elimina la preferencia.

Estas preferencias se usan como **soft constraints** en el autogenerador de guardias (`shiftGenerator.ts`):

- Días con `PREFERENCE` se priorizan.
- Días con `BLOCK` se penalizan para evitar asignaciones si es posible.

### `/admin`

Panel de administración (solo usuarios `ADMIN`).

Incluye:

- **Selector de mes** (`type="month"`) para operaciones de guardias.
- Botón **Autogenerar**:
  - Llama a `POST /api/shifts/generate` con el mes seleccionado.
  - Usa el algoritmo de `generateSchedule` (en `lib/shiftGenerator.ts`).
  - Guarda el resultado en `localStorage.lastGenerate` y redirige a `/admin/report`.
- Botón **Resetear**:
  - Llama a `POST /api/shifts/reset` para eliminar todas las guardias del mes seleccionado (requiere confirmación).
- Bloque **Crear usuario**:
  - Datos: `name`, `email`, `password`, `group` (`MAMA`, `URGENCIAS`, u otros) y `role` (`USER` / `ADMIN`).
  - Crea usuario vía `POST /api/users`.
- Listado de personal:
  - Nombre, email, grupo y rol.
  - Botón **Editar** → `/admin/user/[id]`.
  - Botón **Eliminar** (confirmación + `DELETE /api/users/:id`).

### `/admin/report`

Pantalla que muestra un **informe** del último proceso de generación automática de guardias.

- Lee `localStorage.lastGenerate` con el detalle de asignaciones, conflictos y métricas (equidad, puntos, etc.).
- Útil para que el admin revise el resultado antes o después de aplicar cambios adicionales.

### `/mensajes`

Pantalla de mensajería interna.

- Usuarios normales (`USER`):
  - Ven un chat tipo conversación única con administración.
  - Pueden enviar mensajes a través de `POST /api/messages`.
  - Los mensajes se refrescan cada pocos segundos mediante `GET /api/messages`.

- Admin (`ADMIN`):
  - Inicialmente ve una **lista de conversaciones** (usuarios con mensajes).
  - Al seleccionar un usuario, entra en la vista de chat con esa persona.
  - Puede volver a la lista de conversaciones.

Usa `MessageContext` para gestionar contadores de mensajes no leídos (`/api/messages/unread`).  
El componente `ChatFloating` puede mostrar un widget flotante de mensajes vinculado al mismo backend.

### Navegación inferior y otros componentes

La app se diseña como **mobile‑first**, con navegación inferior (`BottomNav`) y varios componentes de apoyo:

- `Calendar`, `DayDetailModal`, `DayEditor`, `BlockModal`, `PointsModal`.
- `ToastProvider` y `LoadingProvider` para feedback visual y estados de carga.
- `ChatFloating` para acceso rápido a la mensajería.

---

## Reglas de negocio (resumen)

Las reglas de validación viven principalmente en `lib/rules.ts` y se aplican tanto a la asignación manual (`POST /api/shifts`) como al generador.

### Validación de día (`validateDay`)

- Los dos slots de un día **no pueden ser el mismo usuario**.
- Se comprueba que ambos usuarios existan.
- Restricciones por **grupo**:
  - Mismo grupo distinto de `STANDARD` no puede coincidir en la misma guardia.
  - No pueden coincidir `MAMA` y `URGENCIAS` en la misma guardia.
- Si un usuario tiene **vacaciones aprobadas** (`Vacation.status = APPROVED`) en ese día, la asignación se marca como inválida.

### Validación de asignación individual (`validateAssignment`)

Dada una fecha y un usuario, se valida:

- **Vacaciones**: si el usuario tiene vacaciones aprobadas en esa fecha → error.
- **Separación mínima entre guardias**:
  - Debe haber al menos **2 días completos de descanso** entre guardias.
  - Se comprueba una ventana de `[date-2, date+2]` en la tabla de guardias.
- **Límites mensuales por tipo de día**:
  - Máximo **1 jueves** al mes.
  - Máximo **1 viernes** al mes.
  - Máximo **2 fines de semana** al mes (sábado/domingo, agrupados por semana ISO).

Si alguna de estas condiciones falla, se devuelve un listado de errores con códigos (`THURSDAY_LIMIT`, `FRIDAY_LIMIT`, `WEEKEND_LIMIT`, etc.).  
Al asignar vía `POST /api/shifts`, si hay errores y no se marca `forced`, la operación se rechaza (`400`).

---

## Autogeneración de guardias

El autogenerador está implementado en `lib/shiftGenerator.ts` y se expone por el endpoint:

- `POST /api/shifts/generate` (desde el panel `/admin`).

### Idea general

- Se carga para un mes (`YYYY-MM`):
  - Todos los usuarios con sus **vacaciones** y **preferencias**.
  - Guardias ya existentes para ese mes (se consideran **fijas** y se respetan).
- Se construye un estado interno por usuario (`UserState`) con:
  - Grupo, límite mensual (`monthlyLimit` o valor por defecto).
  - Mapa de preferencias por día (`PREFERENCE`, `BLOCK`, `LOCK`).
  - Fechas de vacaciones.
  - Historial de guardias (para equidad global).
- Se recorre día a día del mes con un algoritmo de **backtracking**:
  - Si el día ya tiene guardia en BD → se usa tal cual y se pasa al siguiente.
  - En caso contrario:
    - Se filtra la lista de usuarios por **hard constraints** (vacaciones, separación, límites por día de semana, límite mensual).
    - Sobre esa lista se ordena según un **score**:
      - Gran bonus si hay `PREFERENCE` en ese día (y más puntos).
      - Penalización fuerte si hay `BLOCK`.
      - Penalización suave al que ya tiene más guardias globales (equidad).
    - Se prueban combinaciones de pares (`slot1`, `slot2`) que respeten reglas de grupo (`validatePair`).
    - Se asigna provisionalmente y se continúa recursivamente al siguiente día.
    - Si no hay solución para adelante, se hace backtracking (se deshace la asignación y se prueba otro par).

El resultado es una propuesta de calendario completo para el mes, cumpliendo todos los **hard constraints** y optimizando lo posible respecto a **preferencias y equidad**.

---

## API principal (resumen rápido)

### Autenticación

- **`POST /api/auth/login`**
  - Body: `{ email, password }`.
  - Devuelve: `{ token, user }` (JWT firmado con `JWT_SECRET`).

- **`GET /api/auth/me`**
  - Requiere `Authorization: Bearer <token>`.
  - Devuelve el usuario autenticado.

### Guardias

- **`GET /api/shifts?month=YYYY-MM`**
  - Devuelve `{ shifts }` para ese mes (o todas si no se pasa `month`).

- **`POST /api/shifts`**
  - Asigna/edita una guardia en un día.
  - Body: `{ date, slot1UserId, slot2UserId, forced, forcedReason, actorUserId }`.
  - Valida con `validateDay` + `validateAssignment` (ambos slots).
  - Si hay errores y `forced` es falso → `400` con `{ errors }`.

- **`POST /api/shifts/generate`**
  - Body: `{ month }`.
  - Lanza el generador automático de guardias.

- **`POST /api/shifts/reset`**
  - Body: `{ month }`.
  - Elimina todas las guardias de ese mes.

### Bloqueos mensuales (`Block`)

- **`GET /api/blocks?userId=ID&month=YYYY-MM`**
  - Devuelve los bloqueos del usuario (o del usuario indicado si admin).

- **`POST /api/blocks`**
  - Body: `{ userId, date }`.
  - Crea un bloqueo mensual para la fecha indicada (se guarda por mes).
  - Restricciones:
    - Un bloqueo por mes y usuario.
    - No se puede bloquear un día donde el usuario ya tenga guardia.

- **`DELETE /api/blocks?userId=ID&month=YYYY-MM`**
  - Elimina el bloqueo mensual de ese mes para el usuario.

### Preferencias por día (`ShiftPreference`)

- **`GET /api/preferences?month=YYYY-MM`**
  - Devuelve las preferencias del usuario autenticado para ese mes.

- **`POST /api/preferences`**
  - Body: `{ date, type, points }` con:
    - `type`: `"PREFERENCE"` o `"BLOCK"`.
    - `points`: entero, 0 borra la preferencia.
  - Aplica límites de puntos y reglas de negocio asociadas.

### Usuarios

- **`GET /api/users`** – Solo admin. Lista todos los usuarios.
- **`POST /api/users`** – Solo admin. Crea usuario.
- **`GET /api/users/:id`** – Detalle de usuario (según permisos).
- **`PUT /api/users/:id`** – Actualiza datos de usuario (admin).
- **`DELETE /api/users/:id`** – Elimina usuario (admin).
- **`GET /api/users/:id/stats?month=YYYY-MM`** – Devuelve estadísticas de guardias y puntos para ese mes.

### Mensajes

- **`GET /api/messages`**
  - Admin:
    - Sin query → lista de conversaciones (usuarios) con mensajes.
    - Con `?targetUserId=ID` → mensajes con ese usuario.
  - Usuario:
    - Devuelve la conversación del usuario con administración (o lógica equivalente).

- **`POST /api/messages`**
  - Body: `{ content, targetUserId? }`.
  - Crea un nuevo mensaje en la conversación (usuario ↔ admin).

- **`GET /api/messages/unread`**
  - Devuelve el contador de mensajes no leídos para el usuario actual.

---

## Estructura del proyecto (alto nivel)

- `pages/`
  - `index.tsx` – Calendario principal.
  - `login.tsx` – Pantalla de login.
  - `mis-guardias.tsx` – Resumen de guardias personales.
  - `preferences.tsx` – Gestión de preferencias y puntos.
  - `mensajes.tsx` – Pantalla principal de mensajería.
  - `admin.tsx` – Panel de administración.
  - `admin/report.tsx` – Informe del generador.
  - `admin/user/[id].tsx` – Edición individual de usuario.
  - `api/*` – Endpoints REST (auth, shifts, blocks, messages, preferences, users…).

- `components/`
  - Componentes UI reutilizables: `Calendar`, `DayDetailModal`, `DayEditor`, `BlockModal`, `PointsModal`, `ChatFloating`, `BottomNav`, `ToastProvider`, `LoadingProvider`, etc.

- `lib/`
  - `prisma.ts` – Cliente Prisma.
  - `auth.ts`, `apiAuth.ts` – Utilidades de autenticación/JWT.
  - `rules.ts` – Reglas de negocio y validaciones.
  - `shiftGenerator.ts` – Algoritmo de autogeneración de guardias.
  - `MessageContext.tsx`, `useAuth.tsx` – Hooks y context providers.

- `prisma/`
  - `schema.prisma` – Modelo de datos.
  - `migrations/` – Migraciones generadas.
  - `seed.js`, `seed.ts`, `createAdmin.js`, `insertUsers.js` – Scripts de inicialización de datos.

---

## Notas finales

- Para desplegar en producción, se recomienda usar una base de datos gestionada (PostgreSQL o similar) y actualizar `DATABASE_URL` en `.env`.
- Revisa siempre las reglas de negocio en `lib/rules.ts` y `lib/shiftGenerator.ts` si necesitas ajustar límites (nº máximo de guardias, puntos, fines de semana, etc.).
- El diseño está optimizado para móvil, pero puede extenderse fácilmente a layouts de escritorio añadiendo vistas adicionales o cambios en la navegación.
