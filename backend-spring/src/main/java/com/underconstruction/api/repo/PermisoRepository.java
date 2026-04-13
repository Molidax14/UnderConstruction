package com.underconstruction.api.repo;

import com.underconstruction.api.domain.Permiso;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermisoRepository extends JpaRepository<Permiso, Long> {

    Optional<Permiso> findByUsuario_IdUsuariosAndTipoPermiso_IdTipoPermiso(
            Long idUsuarios, Integer idTipoPermiso);
}
