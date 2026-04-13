-- =============================================================================
-- underconstruction — esquema MariaDB / MySQL 8+
-- Compatible con el driver JDBC mariadb-java-client del backend Spring Boot.
-- Ejecutar con: mysql -u root -p < database/schema.sql
-- (ajusta usuario/host; la app usa la base "underconstruction" por defecto)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS underconstruction
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE underconstruction;

-- Opcional (requiere privilegios de administración). Descomenta y adapta la contraseña:
-- CREATE USER IF NOT EXISTS 'underconstruction'@'localhost' IDENTIFIED BY 'cambia_esto';
-- GRANT ALL PRIVILEGES ON underconstruction.* TO 'underconstruction'@'localhost';
-- FLUSH PRIVILEGES;

-- ----------------------------------------------------------------------------- 
-- Tablas
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuarios (
  IdUsuarios INT NOT NULL AUTO_INCREMENT,
  Nombre VARCHAR(255) NOT NULL,
  Usuario VARCHAR(100) NOT NULL,
  Clave VARCHAR(255) NOT NULL,
  PRIMARY KEY (IdUsuarios),
  UNIQUE KEY uk_usuario (Usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS TipoPermiso (
  IdTipoPermiso INT NOT NULL AUTO_INCREMENT,
  NombrePermiso VARCHAR(255) NOT NULL,
  DescripcionPermiso TEXT NULL,
  PRIMARY KEY (IdTipoPermiso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- -----------------------------------------------------------------------------
-- Procedimientos almacenados (útiles para consultas ad-hoc; la API usa JPA)
-- -----------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS ConsultarUsuarios;
DELIMITER //
CREATE PROCEDURE ConsultarUsuarios()
BEGIN
  SELECT IdUsuarios, Nombre FROM usuarios;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS ConsultaPermisosXUsuarios;
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

DROP PROCEDURE IF EXISTS ActualizarAcceso;
DELIMITER //
CREATE PROCEDURE ActualizarAcceso(IN p_IdPermisos INT, IN p_Acceso TINYINT(1))
BEGIN
  UPDATE Permisos
  SET Acceso = p_Acceso
  WHERE IdPermisos = p_IdPermisos;
END //
DELIMITER ;
