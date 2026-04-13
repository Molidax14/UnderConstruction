# Exposición: backend Spring Boot (Under Construction)

Material orientado a presentación oral. Este backend expone una **API REST** bajo el prefijo `/api`, usa **MariaDB** para usuarios y permisos, **JWT** para sesiones sin estado y **Spring Security** para autorizar el tráfico. El frontend React (Vite) llama a las mismas rutas en desarrollo (proxy) y en producción (Apache reenvía `/api` al puerto interno de la API).

---

## Introduccion y proposito

El módulo **`backend-spring`** es una aplicación **Spring Boot 3** (Java 17) que:

- Autentica usuarios contra la tabla **`usuarios`** (contraseña **bcrypt**).
- Emite un **token JWT** tras un login correcto; el navegador lo envía en **`Authorization: Bearer ...`**.
- Expone endpoints para **listar usuarios**, **consultar y actualizar permisos** (matriz por usuario).
- Permite **registro público** (`POST /api/auth/register`) con validaciones en servidor.

No guarda sesiones en servidor: la política es **STATELESS** (típico en APIs REST + JWT).

---

## Vision general y capas

| Capa | Paquete / rol | Responsabilidad |
|------|----------------|-----------------|
| Arranque | `com.underconstruction.api` | Punto de entrada Spring Boot y registro de propiedades JWT |
| Configuración | `...config` | Seguridad HTTP, CORS, codificador bcrypt, propiedades `jwt.*` |
| Seguridad | `...security` | Generar y validar JWT; filtro que rellena el contexto de seguridad |
| Web / REST | `...web` | Controladores HTTP y respuestas JSON |
| DTOs | `...web.dto` | Records que representan cuerpos JSON de entrada/salida |
| Servicios | `...service` | Lógica de negocio de login y registro |
| Persistencia | `...repo` | Acceso a MariaDB: JDBC, procedimientos y SQL |

El frontend consume rutas como `POST /api/auth/login`, `GET /api/usuarios`, etc. Todo lo que no sea login, registro o health bajo `/api/**` exige usuario autenticado vía JWT.

---

## application.yml y variables de entorno

Archivo: `backend-spring/src/main/resources/application.yml`.

- **`server.port`**: por defecto **3099** (sobrescribible con `API_PORT`).
- **`server.address`**: por defecto **127.0.0.1** (`SERVER_ADDRESS`), acota el bind en despliegue seguro detrás de un proxy.
- **`spring.datasource`**: URL JDBC a MariaDB usando **`DB_HOST`**, **`DB_PORT`**, **`DB_NAME`**, **`DB_USER`**, **`DB_PASSWORD`** (valores reales solo en entorno o `.env` del servicio; no deben documentarse en el código).
- **`jwt.secret`** y **`jwt.expiration-ms`**: leídos como **`JWT_SECRET`** y **`JWT_EXPIRATION_MS`**; el secreto debe ser largo y aleatorio en producción (HMAC SHA).
- **Logging**: nivel INFO para `org.springframework.security` (auditoría básica de la capa de seguridad).

Spring Boot **inyecta** automáticamente un **`DataSource`** y un **`JdbcTemplate`** a partir de esta configuración.

---

## pom.xml y dependencias Maven

Archivo: `backend-spring/pom.xml`.

- **Parent**: `spring-boot-starter-parent` **3.4.2** — versiones alineadas de dependencias.
- **`spring-boot-starter-web`**: Tomcat embebido, Jackson, `@RestController`, MVC.
- **`spring-boot-starter-jdbc`**: `JdbcTemplate`, transacciones ligeras, sin JPA en este proyecto.
- **`spring-boot-starter-security`**: cadena de filtros, reglas `authorizeHttpRequests`, CORS integrado.
- **`mariadb-java-client`**: driver JDBC en runtime.
- **JJWT** (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`): construcción y verificación de tokens JWT.
- **Tests**: `spring-boot-starter-test`, `spring-security-test`.

El **plugin** `spring-boot-maven-plugin` empaqueta el JAR ejecutable usado en systemd en producción.

---

## UnderconstructionApiApplication

**Clase:** `UnderconstructionApiApplication.java`  
**Anotaciones:** `@SpringBootApplication`, `@EnableConfigurationProperties(JwtProperties.class)`.

Arranca el contexto de Spring y regististra el **record** `JwtProperties` como fuente tipada de `jwt.secret` y `jwt.expiration-ms` definidos en YAML. El método `main` delega en `SpringApplication.run`.

---

## Flujo de una peticion de login

Ejemplo pedagógico: **`POST /api/auth/login`** con JSON `{ "usuario", "password", "tipo" }`.

1. **Tomcat** recibe la petición en el puerto configurado (p. ej. 3099).
2. **CORS**: si es navegador, puede haber un **preflight OPTIONS**; `SecurityConfig` permite **OPTIONS** para todo y define orígenes/métodos permitidos.
3. **SecurityFilterChain**: la ruta `/api/auth/login` está en **`permitAll()`**, así que no hace falta JWT para esta petición.
4. **JwtAuthenticationFilter**: en `shouldNotFilter`, se **omite** el análisis del Bearer para `/api/auth/login`, `/api/auth/register` y `/api/health`.
5. **AuthController.login**: Spring deserializa el cuerpo a **`LoginRequest`** (record).
6. **AuthService.authenticate**: busca el usuario en **`usuarios`** con JDBC; compara la contraseña con **`PasswordEncoder.matches`** (bcrypt). Si falla, el controlador responde **401** JSON.
7. **JwtService.generateToken**: si el login es válido, se crea un JWT con *subject* = `IdUsuarios` y *claims* `usuario`, `nombre`, `tipo`.
8. **Respuesta 200**: JSON con `ok`, `token` y objeto `user` (campos públicos del perfil).

Así se conecta **HTTP → Security → Controller → Service → JDBC → JWT → JSON**.

---

## Como se protegen las rutas

- **Regla central:** en `SecurityConfig`, tras permitir explícitamente login, registro y health, cualquier otra ruta que coincida con **`/api/**`** requiere **`authenticated()`**.
- **JWT en cabecera:** el cliente envía `Authorization: Bearer <token>`.
- **JwtAuthenticationFilter** (ejecutado **antes** de `UsernamePasswordAuthenticationFilter`):
  - Lee el header, extrae el token, llama a **`JwtService.parseClaims`**.
  - Si el token es válido, crea un **`UsernamePasswordAuthenticationToken`** con autoridad **`ROLE_USER`** y lo coloca en **`SecurityContextHolder`**.
  - Si el token falta o es inválido, la cadena sigue; para rutas protegidas, la cadena de seguridad responderá **401** o **403** según el caso (configurado con `authenticationEntryPoint` / `accessDeniedHandler` devolviendo JSON).
- **Sin sesión HTTP:** `SessionCreationPolicy.STATELESS` evita cookies de sesión del lado servidor.

Para la exposición: enfatizar que **no** es “login con sesión en servidor”, sino **token firmado** que el cliente reenvía en cada petición.

---

## SecurityConfig

**Clase:** `SecurityConfig.java` — `@Configuration`, `@EnableWebSecurity`.

- **Constructor:** recibe **`JwtAuthenticationFilter`** (inyección por Spring).
- **`securityFilterChain` (Bean):**
  - **CSRF deshabilitado** (API REST típica con JWT).
  - **CORS** con `corsConfigurationSource()`: patrones de origen amplios, métodos incluidos GET/POST/PATCH/etc., cabeceras permitidas, expone `Authorization`.
  - **Sesión:** STATELESS.
  - **Autorización:** OPTIONS permitido; `/api/auth/login`, `/api/auth/register`, `/api/health` públicos; resto de `/api/**` autenticado.
  - **Errores JSON:** respuestas `401` / `403` con cuerpo JSON (`Unauthorized` / `Forbidden`).
  - **`addFilterBefore`:** inserta el filtro JWT antes del filtro de usuario/contraseña estándar.

Relación con el frontend: el navegador puede estar en otro origen en dev; CORS evita bloqueos incorrectos mientras la API valida JWT en rutas sensibles.

---

## JwtAuthenticationFilter

**Clase:** `JwtAuthenticationFilter` — `@Component`, extiende **`OncePerRequestFilter`**.

- **`shouldNotFilter`:** no procesa JWT en login, registro, health, OPTIONS, ni rutas fuera de `/api/`.
- **`doFilterInternal`:** si no hay prefijo `Bearer `, delega sin autenticar. Si hay token, intenta parsear claims; ante excepción, deja sin autenticación (la regla `authenticated()` fallará después).

Conexión con MariaDB: **ninguna** en el filtro; solo valida criptográficamente el JWT ya emitido en el login.

---

## JwtService y JwtProperties

**`JwtProperties`:** record con `@ConfigurationProperties(prefix = "jwt")` — campos `secret` y `expirationMs` enlazados al YAML.

**`JwtService`:** `@Service`, usa **`Keys.hmacShaKeyFor`** sobre el secreto en UTF-8.

- **`generateToken`:** `Jwts.builder()` con subject = id de usuario, claims personalizados, fechas `issuedAt` / `expiration`, firma con la clave HMAC.
- **`parseClaims`:** verifica firma y devuelve el payload.

El frontend solo **almacena** el string del token (p. ej. en `sessionStorage`) y lo repite en cabeceras vía `authFetch`.

---

## JwtConfig

**Clase:** `JwtConfig.java` — `@Configuration`.

Define un **Bean** `PasswordEncoder` como **`BCryptPasswordEncoder`**, usado en **`AuthService`** para comparar y generar hashes en registro. Centralizar aquí el algoritmo facilita cambiar la estrategia en un solo sitio.

---

## AuthController

**Clase:** `AuthController.java` — `@RestController`.

- **`POST /api/auth/login`:** usa `AuthService` + `JwtService`; monta el JSON de éxito o error.
- **`POST /api/auth/register`:** delega en `AuthService.register`; usa el tipo sellado **`RegisterResult`** para distinguir éxito (`201`) de error (`400` validación / `409` usuario duplicado).

Es la **fachada HTTP** que el React llama desde `LoginGeneric` y `RegisterModal`.

---

## AuthService

**Clase:** `AuthService.java` — `@Service`.

- **`authenticate`:** consulta SQL a `usuarios` por nombre de usuario (comparación insensible a mayúsculas en SQL); normaliza `tipo` (`generic` / `acm`); **`passwordEncoder.matches`** contra la columna `Clave`.
- **`register`:** valida nombre, usuario (regex, longitud), contraseña mínima; comprueba unicidad; **`passwordEncoder.encode`** e **`INSERT`** en `usuarios`.

Aquí está el vínculo directo **negocio ↔ MariaDB** para identidad; el JWT es consecuencia del login exitoso en el controlador.

---

## DTOs de autenticacion y permisos

Paquete `web.dto` — records inmutables, deserialización JSON automática:

| Clase | Campos | Uso |
|-------|--------|-----|
| `LoginRequest` | usuario, password, tipo | Cuerpo de login |
| `RegisterRequest` | nombre, usuario, password | Registro |
| `AuthUserDto` | idUsuarios, nombre, usuario, tipo | Datos de usuario tras autenticar (no es entidad JPA) |
| `PatchAccesoRequest` | acceso | PATCH por id de permiso |
| `PatchPermisoCeldaRequest` | idUsuarios, idTipoPermiso, acceso | PATCH matriz de permisos |

---

## RegisterResult

**Interfaz sellada** `RegisterResult` con records **`Ok`** y **`Error(String message)`**.

Patrón claro para el controlador: sin excepciones de negocio para “usuario duplicado”; se traduce a códigos HTTP explícitos.

---

## UsuarioController

**Clase:** `UsuarioController.java` — `@RestController`.

- **`GET /api/usuarios`:** devuelve lista de mapas desde **`ProcedureRepository.consultarUsuarios()`**, que ejecuta el procedimiento almacenado **`ConsultarUsuarios()`** en MariaDB.

Protegido por JWT: el frontend de la página Permisos debe estar autenticado.

---

## PermisoController

**Clase:** `PermisoController.java` — `@RestController`.

- **`GET /api/permisos?usuario=<IdUsuarios>`:** valida el parámetro numérico; devuelve filas de la **matriz** tipo permiso + acceso (consulta SQL con `LEFT JOIN` sobre `TipoPermiso` y `Permisos` en el repositorio).
- **`PATCH /api/permisos/celda`:** cuerpo `PatchPermisoCeldaRequest`; delega en **`upsertPermisoCelda`** (inserta fila si acceso=1 y no existía; actualiza vía procedimiento cuando ya hay `IdPermisos`).
- **`PATCH /api/permisos/{idPermisos}`:** actualiza solo el campo **Acceso** llamando al procedimiento **`ActualizarAcceso`** en BD.

Relación frontend: la UI de permisos usa estas rutas con **`authFetch`** (Bearer).

---

## ProcedureRepository y MariaDB

**Clase:** `ProcedureRepository.java` — `@Repository`, usa **`JdbcTemplate`** y callbacks con **`Connection`**.

- **`consultarUsuarios`:** `{CALL ConsultarUsuarios()}` — mapeo genérico de columnas a `Map`.
- **`listarMatrizPermisos`:** SQL explícito con joins (equivalente funcional a exponer todos los tipos de permiso para un usuario).
- **`actualizarAcceso`:** `{CALL ActualizarAcceso(?, ?)}`.
- **`upsertPermisoCelda`:** lectura previa, posible **INSERT** directo o actualización vía procedimiento.

**`PermisoCeldaResult`:** record con `idPermisos` y `acceso` para responder al cliente tras un PATCH de celda.

Este repositorio concentra el **contrato con la base** (procedimientos + SQL) sin exponer JDBC en los controladores.

---

## GlobalExceptionHandler

**Clase:** `GlobalExceptionHandler.java` — `@RestControllerAdvice`.

- **`ResponseStatusException`:** respeta el código HTTP indicado.
- **`DataAccessException`:** errores de acceso a datos → **500** con mensaje derivado de la causa (útil en depuración; en producción se puede endurecer el mensaje).
- **`Exception`:** red de seguridad con log y 500.

Unifica respuestas JSON de error en toda la API.

---

## HealthController y ApiFallbackController

**`HealthController`:** `GET /api/health` → `{ "ok": true }` para comprobaciones de vida (monitoring, load balancer, Apache).

**`ApiFallbackController`:** mapeo de baja precedencia sobre `/api/**` para métodos HTTP comunes; si ningún controlador más específico coincide, devuelve **404** JSON `Not found`. Evita respuestas HTML opacas en rutas API incorrectas.

---

## Tests JwtServiceTest

**Ubicación:** `src/test/java/.../JwtServiceTest.java`.

Prueba unitaria: instancia **`JwtProperties`** con un secreto de prueba largo, construye **`JwtService`**, genera un token y **parsea** claims comprobando subject y claims `usuario`, `nombre`, `tipo`.

Sirve para la exposición como ejemplo de **prueba rápida del núcleo JWT** sin levantar toda la aplicación.

---

## Cierre para la exposicion oral

1. **Stack:** Spring Boot Web + JDBC + Security + MariaDB + JJWT.  
2. **Flujo:** Cliente → filtros de seguridad → controladores → servicios/repositorio → BD; login devuelve JWT.  
3. **Seguridad:** rutas públicas mínimas; resto `/api/**` con Bearer; sin sesión servidor.  
4. **Extensión:** nuevos endpoints como nuevos métodos en `@RestController` + reglas en `SecurityConfig` si el perfil de acceso cambia.

*Documento generado para la app Under Construction; alinear la demo con la versión desplegada del JAR y del frontend.*
