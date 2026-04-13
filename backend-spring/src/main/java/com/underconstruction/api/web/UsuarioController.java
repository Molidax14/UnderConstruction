package com.underconstruction.api.web;

import com.underconstruction.api.domain.Usuario;
import com.underconstruction.api.repo.UsuarioRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/api/usuarios")
    public List<Map<String, Object>> usuarios() {
        return usuarioRepository.findAll(Sort.by(Sort.Direction.ASC, "idUsuarios")).stream()
                .map(UsuarioController::toListRow)
                .toList();
    }

    private static Map<String, Object> toListRow(Usuario u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("IdUsuarios", u.getIdUsuarios());
        m.put("Nombre", u.getNombre());
        return m;
    }
}
