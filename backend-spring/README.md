# Under Construction API (Spring Boot)

Backend único: REST + MariaDB + JPA (Hibernate) + JWT.

## Requisitos

- Java 17+
- Maven 3.9+
- MariaDB (o MySQL 8 compatible) con base `underconstruction`. Esquema ejecutable: **`../database/schema.sql`** (tablas + procedimientos opcionales).

## Variables de entorno

Se reutilizan las del proyecto raíz (`.env`):

| Variable | Descripción |
|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión MariaDB |
| `JWT_SECRET` | Secreto HMAC para firmar JWT (obligatorio en producción; cadena larga) |
| `API_PORT` | Puerto HTTP (default `3099`) |
| `SERVER_ADDRESS` | Interfaz de escucha (default `127.0.0.1`) |
| `JWT_EXPIRATION_MS` | Duración del token (default 24 h) |

## Ejecutar en desarrollo

Desde la raíz del monorepo:

```bash
npm run api
# o
cd backend-spring && mvn spring-boot:run
```

Junto con Vite: `npm run dev:all` (o `bun run dev:all`).

## Build para producción

```bash
cd backend-spring
mvn -q package -DskipTests
```

JAR: `target/api-0.0.1-SNAPSHOT.jar`

## Endpoints

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/api/health` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/register` | No | Body `nombre`, `usuario`, `password` → inserta en `usuarios` (bcrypt) |
| GET | `/api/usuarios` | JWT |
| GET | `/api/permisos?usuario=<id>` | JWT |
| PATCH | `/api/permisos/{id}` body `{"acceso":0\|1}` | JWT |

Login: `POST /api/auth/login` con `{"usuario","password","tipo":"generic"|"acm"}` → responde `token` + `user`.

## Tests

```bash
cd backend-spring && mvn test
```

## systemd

Unidad de ejemplo en la raíz del repo: `underconstruction-api.service` (ejecuta el JAR con `EnvironmentFile` apuntando a `.env`).

Tras cada deploy del backend: `mvn package` y `sudo systemctl restart underconstruction-api`.
