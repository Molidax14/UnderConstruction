package com.underconstruction.api.repo;

import com.underconstruction.api.domain.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @Query(
            value =
                    "SELECT * FROM usuarios WHERE LOWER(TRIM(Usuario)) = LOWER(TRIM(:login)) LIMIT 1",
            nativeQuery = true)
    Optional<Usuario> findByUsuarioNormalized(@Param("login") String login);

    @Query(
            value =
                    "SELECT COUNT(*) FROM usuarios WHERE LOWER(TRIM(Usuario)) = LOWER(TRIM(:u))",
            nativeQuery = true)
    long countByUsuarioNormalized(@Param("u") String u);
}
