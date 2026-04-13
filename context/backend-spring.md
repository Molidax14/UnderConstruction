# Backend Spring Boot (reemplazo de la API Bun)

La API en el puerto **3099** la sirve **Spring Boot** (`backend-spring/`). El servidor Bun (`server/index.js`) ya no se usa.

## Arranque

- **Desarrollo:** `npm run api` o `cd backend-spring && mvn spring-boot:run`; con frontend: `npm run dev:all`.
- **Producción:** compilar con `mvn -q package -DskipTests` y ejecutar el JAR (véase `backend-spring/README.md` y `underconstruction-api.service`).

## Variables en `.env`

Además de `DB_*`, define **`JWT_SECRET`** (cadena larga y aleatoria) para firmar los JWT. Opcional: `API_PORT`, `SERVER_ADDRESS`, `JWT_EXPIRATION_MS`.

## Apache

Sin cambios de puerto: el proxy sigue enviando `/api` a `http://127.0.0.1:3099/api`.

## Autenticación

- Login real contra la tabla `usuarios` (campo `Usuario`, contraseña con **bcrypt** en `Clave`).
- Tras el login, el front guarda el **JWT** en `sessionStorage` y lo envía en `Authorization: Bearer ...` en las llamadas a permisos y usuarios.

## Documentación detallada

- Contrato de API y página Permisos: `context/api-permisos.md` (actualizado para JWT).
- Despliegue: `context/produccion-apache.md`.
