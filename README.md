# Aplicación de guardias y servicios

Proyecto minimal para gestión de guardias (Next.js + Prisma + SQLite).


Run locally (Windows):

1) Instalar dependencias

```bash
npm install
```

2) Generar cliente Prisma y migrar DB

```bash
npm run prisma:generate
npm run prisma:migrate
```

3) Ejecutar seed para crear usuarios y admin

```bash
npm run seed
```

4) Iniciar en modo desarrollo

```bash
npm run dev
```

Notas importantes:
- Asegúrate de revisar `./.env` y ajustar `JWT_SECRET` y `DATABASE_URL` si es necesario.
- El seed crea 20 usuarios y el admin:

	- Email: admin@youshift.local
	- Password: Password123!

Endpoints principales:
- `POST /api/auth/login` — login (recibe `email` y `password`).
- `GET /api/auth/me` — devuelve usuario autenticado (Bearer token requerido).
- `GET /api/shifts?month=YYYY-MM` — listas de guardias y bloques del mes.
- `POST /api/shifts` — asignar día (body: `date`, `slot1UserId`, `slot2UserId`, `forced`, `forcedReason`, `actorUserId`).
- `POST /api/shifts/generate` — auto-generar mes (admin UI button calls este endpoint).
- `GET|POST|DELETE /api/blocks` — gestionar bloqueos (autenticado; usuarios sólo gestionan su propio bloqueo).
- `GET /api/users` — admin only.
- `PUT|DELETE /api/users/:id` — admin only.

Frontend:
- `/login` — login
- `/` — calendario (mobile-first)
- `/mis-guardias` — lista y contadores del usuario
- `/admin` — admin UI (list, generate)

