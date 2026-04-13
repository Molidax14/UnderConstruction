package com.underconstruction.api.service;

import com.underconstruction.api.domain.Permiso;
import com.underconstruction.api.domain.TipoPermiso;
import com.underconstruction.api.domain.Usuario;
import com.underconstruction.api.repo.PermisoCeldaResult;
import com.underconstruction.api.repo.PermisoRepository;
import com.underconstruction.api.repo.TipoPermisoRepository;
import com.underconstruction.api.repo.UsuarioRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PermisoService {

    private final TipoPermisoRepository tipoPermisoRepository;
    private final PermisoRepository permisoRepository;
    private final UsuarioRepository usuarioRepository;

    public PermisoService(
            TipoPermisoRepository tipoPermisoRepository,
            PermisoRepository permisoRepository,
            UsuarioRepository usuarioRepository) {
        this.tipoPermisoRepository = tipoPermisoRepository;
        this.permisoRepository = permisoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Map<String, Object>> listarMatrizPermisos(int idUsuarios) {
        List<TipoPermiso> tipos =
                tipoPermisoRepository.findAll(Sort.by(Sort.Direction.ASC, "idTipoPermiso"));
        List<Map<String, Object>> out = new ArrayList<>();
        long uid = idUsuarios;
        for (TipoPermiso tp : tipos) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("IdTipoPermiso", tp.getIdTipoPermiso());
            row.put("Nombre Permiso", tp.getNombrePermiso());
            row.put("Descripcion", tp.getDescripcionPermiso());
            Optional<Permiso> p =
                    permisoRepository.findByUsuario_IdUsuariosAndTipoPermiso_IdTipoPermiso(
                            uid, tp.getIdTipoPermiso());
            row.put("IdPermisos", p.map(Permiso::getIdPermisos).orElse(null));
            row.put("Acceso", p.map(Permiso::getAcceso).orElse(0));
            out.add(row);
        }
        return out;
    }

    @Transactional
    public PermisoCeldaResult upsertPermisoCelda(int idUsuarios, int idTipoPermiso, int acceso) {
        long uid = idUsuarios;
        Optional<Permiso> existing =
                permisoRepository.findByUsuario_IdUsuariosAndTipoPermiso_IdTipoPermiso(
                        uid, idTipoPermiso);
        if (existing.isPresent()) {
            Permiso perm = existing.get();
            perm.setAcceso(acceso);
            permisoRepository.save(perm);
            return new PermisoCeldaResult(perm.getIdPermisos(), acceso);
        }
        if (acceso == 1) {
            Usuario usuario =
                    usuarioRepository
                            .findById(uid)
                            .orElseThrow(
                                    () ->
                                            new IllegalArgumentException(
                                                    "Usuario no encontrado: " + idUsuarios));
            TipoPermiso tipo =
                    tipoPermisoRepository
                            .findById(idTipoPermiso)
                            .orElseThrow(
                                    () ->
                                            new IllegalArgumentException(
                                                    "Tipo de permiso no encontrado: "
                                                            + idTipoPermiso));
            Permiso created = permisoRepository.save(new Permiso(usuario, tipo, 1));
            return new PermisoCeldaResult(created.getIdPermisos(), 1);
        }
        return new PermisoCeldaResult(null, 0);
    }

    @Transactional
    public void actualizarAcceso(int idPermisos, int acceso) {
        permisoRepository
                .findById((long) idPermisos)
                .ifPresent(
                        p -> {
                            p.setAcceso(acceso);
                            permisoRepository.save(p);
                        });
    }
}
