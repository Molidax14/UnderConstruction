# MariaDB: base `underconstruction`

## Base de datos

| Campo | Valor |
|-------|-------|
| Nombre | `underconstruction` |
| Charset | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |

## Usuario de aplicación

- **Usuario:** `underconstruction`@`localhost`
- **Privilegios:** `ALL` solo sobre `underconstruction.*`
- **Contraseña:** definida en `/home/ubuntu/underconstruction/.env` (`DB_PASSWORD`)

## Conexión desde la app

Variables en `.env` (no versionado):

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

URL típica (ej. migraciones):

`mysql://underconstruction:****@localhost:3306/underconstruction`

## Comandos útiles

```bash
# Consola como root del sistema
sudo mysql

# Consola como usuario de la app
mysql -u underconstruction -p underconstruction
```

## Tabla `usuarios`

| Columna     | Tipo           | Notas                                      |
|-------------|----------------|--------------------------------------------|
| IdUsuarios  | INT AUTO_INCREMENT PK | Identificador único                 |
| Nombre      | VARCHAR(255)   | NOT NULL                                   |
| Usuario     | VARCHAR(100)   | NOT NULL, UNIQUE (`uk_usuario`)            |
| Clave       | VARCHAR(255)   | NOT NULL — almacena **hash bcrypt** (no texto plano) |

Motor: InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`.

DDL (por si hay que recrearla):

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  IdUsuarios INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(255) NOT NULL,
  Usuario VARCHAR(100) NOT NULL,
  Clave VARCHAR(255) NOT NULL,
  PRIMARY KEY (IdUsuarios),
  UNIQUE KEY uk_usuario (Usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Procedimiento almacenado `ConsultarUsuarios`

Devuelve **`IdUsuarios`** y **`Nombre`** de **`usuarios`**.

```sql
CALL ConsultarUsuarios();
```

Definición:

```sql
DELIMITER //
CREATE PROCEDURE ConsultarUsuarios()
BEGIN
  SELECT IdUsuarios, Nombre FROM usuarios;
END //
DELIMITER ;
```

### Procedimiento almacenado `ConsultaPermisosXUsuarios`

Parámetro de entrada: **`p_IdUsuarios`** (`INT`). Devuelve los permisos de ese usuario uniendo **`Permisos`** con **`TipoPermiso`**.

| Columna devuelta | Origen                          |
|------------------|---------------------------------|
| IdPermisos       | `Permisos.IdPermisos` (para editar) |
| Nombre Permiso   | `TipoPermiso.NombrePermiso`     |
| Descripcion      | `TipoPermiso.DescripcionPermiso`|
| Acceso           | `Permisos.Acceso`               |

```sql
CALL ConsultaPermisosXUsuarios(1);
```

Definición:

```sql
DELIMITER //
CREATE PROCEDURE ConsultaPermisosXUsuarios(IN p_IdUsuarios INT)
BEGIN
  SELECT
    p.IdPermisos,
    tp.NombrePermiso AS `Nombre Permiso`,
    tp.DescripcionPermiso AS Descripcion,
    p.Acceso
  FROM Permisos p
  INNER JOIN TipoPermiso tp ON p.IdTipoPermiso = tp.IdTipoPermiso
  WHERE p.IdUsuarios = p_IdUsuarios;
END //
DELIMITER ;
```

### Procedimiento almacenado `ActualizarAcceso`

Parámetros: **`p_IdPermisos`** (`INT`), **`p_Acceso`** (`TINYINT(1)`). Actualiza solo la columna **`Acceso`** en **`Permisos`** para la fila indicada.

```sql
CALL ActualizarAcceso(1, 0);  -- denegar
CALL ActualizarAcceso(1, 1);  -- permitir
```

Definición:

```sql
DELIMITER //
CREATE PROCEDURE ActualizarAcceso(IN p_IdPermisos INT, IN p_Acceso TINYINT(1))
BEGIN
  UPDATE Permisos
  SET Acceso = p_Acceso
  WHERE IdPermisos = p_IdPermisos;
END //
DELIMITER ;
```

### Generar hash bcrypt para insertar un usuario

En el proyecto (devDependency `bcryptjs`):

```bash
cd /home/ubuntu/underconstruction
bun run hash-password -- tuContraseñaSegura
```

Copia la salida en un `INSERT`:

```sql
INSERT INTO usuarios (Nombre, Usuario, Clave)
VALUES ('Nombre completo', 'login', '$2a$10$...hash...');
```

En un API backend (Node/Bun), usar `bcrypt.hash` al registrar y `bcrypt.compare` al iniciar sesión. No hashear contraseñas solo en el navegador en producción.

## Tabla `TipoPermiso`

| Columna             | Tipo              | Notas                          |
|---------------------|-------------------|--------------------------------|
| IdTipoPermiso       | INT AUTO_INCREMENT PK | NOT NULL, autoincrement    |
| NombrePermiso       | VARCHAR(255)      | NOT NULL                       |
| DescripcionPermiso  | TEXT              | NULL permitido                 |

Motor: InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`.

DDL:

```sql
CREATE TABLE IF NOT EXISTS TipoPermiso (
  IdTipoPermiso INT NOT NULL AUTO_INCREMENT,
  NombrePermiso VARCHAR(255) NOT NULL,
  DescripcionPermiso TEXT NULL,
  PRIMARY KEY (IdTipoPermiso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Tabla `Permisos`

Relación usuario ↔ tipo de permiso. `Acceso` en `TINYINT(1)` (p. ej. 1 = permitido, 0 = denegado).

| Columna        | Tipo                 | Notas                                                |
|----------------|----------------------|------------------------------------------------------|
| IdPermisos     | INT AUTO_INCREMENT PK | NOT NULL                                             |
| IdUsuarios     | INT                  | NOT NULL, FK → `usuarios(IdUsuarios)`                |
| IdTipoPermiso  | INT                  | NOT NULL, FK → `TipoPermiso(IdTipoPermiso)`          |
| Acceso         | TINYINT(1)           | NOT NULL, default `1`                                |

Restricción única `uk_usuario_tipo (IdUsuarios, IdTipoPermiso)` para no duplicar el mismo permiso por usuario. FK con `ON DELETE CASCADE` / `ON UPDATE CASCADE`.

DDL:

```sql
CREATE TABLE IF NOT EXISTS Permisos (
  IdPermisos INT NOT NULL AUTO_INCREMENT,
  IdUsuarios INT NOT NULL,
  IdTipoPermiso INT NOT NULL,
  Acceso TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (IdPermisos),
  UNIQUE KEY uk_usuario_tipo (IdUsuarios, IdTipoPermiso),
  CONSTRAINT fk_permisos_usuario
    FOREIGN KEY (IdUsuarios) REFERENCES usuarios (IdUsuarios)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_permisos_tipo
    FOREIGN KEY (IdTipoPermiso) REFERENCES TipoPermiso (IdTipoPermiso)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Recrear solo la base (sin tocar usuario)

```sql
DROP DATABASE IF EXISTS underconstruction;
CREATE DATABASE underconstruction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON underconstruction.* TO 'underconstruction'@'localhost';
FLUSH PRIVILEGES;
```

**Nota:** al recrear la base se pierden las tablas (`usuarios`, `TipoPermiso`, `Permisos`, etc.); vuelve a crearlas con los DDL documentados o desde un respaldo.
