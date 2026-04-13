package com.underconstruction.api.web;

import com.underconstruction.api.repo.PermisoCeldaResult;
import com.underconstruction.api.service.PermisoService;
import com.underconstruction.api.web.dto.PatchAccesoRequest;
import com.underconstruction.api.web.dto.PatchPermisoCeldaRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PermisoController {

    private final PermisoService permisoService;

    public PermisoController(PermisoService permisoService) {
        this.permisoService = permisoService;
    }

    @GetMapping("/api/permisos")
    public ResponseEntity<?> permisos(@RequestParam(name = "usuario", required = false) String usuario) {
        if (usuario == null || usuario.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Falta parámetro usuario"));
        }
        int id;
        try {
            id = Integer.parseInt(usuario.trim());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Falta parámetro usuario"));
        }
        List<Map<String, Object>> data = permisoService.listarMatrizPermisos(id);
        return ResponseEntity.ok(data);
    }

    /**
     * Activa o desactiva un permiso para un usuario. Si no existía fila en Permisos y acceso=1, se
     * inserta; si acceso=0 y no había fila, no se crea nada.
     */
    @PatchMapping("/api/permisos/celda")
    public ResponseEntity<?> actualizarCelda(@RequestBody PatchPermisoCeldaRequest body) {
        if (body == null
                || body.idUsuarios() == null
                || body.idTipoPermiso() == null
                || body.acceso() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Faltan idUsuarios, idTipoPermiso o acceso"));
        }
        int acceso = body.acceso();
        if (acceso != 0 && acceso != 1) {
            return ResponseEntity.badRequest().body(Map.of("error", "acceso debe ser 0 o 1"));
        }
        PermisoCeldaResult r =
                permisoService.upsertPermisoCelda(
                        body.idUsuarios(), body.idTipoPermiso(), acceso);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("ok", true);
        out.put("acceso", r.acceso());
        out.put("idPermisos", r.idPermisos());
        return ResponseEntity.ok(out);
    }

    @PatchMapping("/api/permisos/{idPermisos}")
    public ResponseEntity<?> actualizarAcceso(
            @PathVariable("idPermisos") String idStr, @RequestBody PatchAccesoRequest body) {
        int idPermisos;
        try {
            idPermisos = Integer.parseInt(idStr);
        } catch (NumberFormatException e) {
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        }
        Integer acceso = body != null ? body.acceso() : null;
        if (acceso == null || (acceso != 0 && acceso != 1)) {
            return ResponseEntity.badRequest().body(Map.of("error", "acceso debe ser 0 o 1"));
        }
        permisoService.actualizarAcceso(idPermisos, acceso);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
