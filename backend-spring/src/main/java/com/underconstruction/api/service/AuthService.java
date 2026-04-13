package com.underconstruction.api.service;

import com.underconstruction.api.domain.Usuario;
import com.underconstruction.api.repo.UsuarioRepository;
import com.underconstruction.api.web.dto.AuthUserDto;
import java.util.Locale;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** @return null if invalid credentials */
    public AuthUserDto authenticate(String usuario, String password, String tipo) {
        if (usuario == null || usuario.isBlank() || password == null) {
            return null;
        }
        String tipoNorm = (tipo == null || tipo.isBlank()) ? "generic" : tipo.toLowerCase(Locale.ROOT);
        if (!tipoNorm.equals("generic") && !tipoNorm.equals("acm")) {
            tipoNorm = "generic";
        }
        Optional<Usuario> row = usuarioRepository.findByUsuarioNormalized(usuario.trim());
        if (row.isEmpty()) {
            return null;
        }
        Usuario u = row.get();
        if (!passwordEncoder.matches(password, u.getClave())) {
            return null;
        }
        return new AuthUserDto(u.getIdUsuarios(), u.getNombre(), u.getUsuario(), tipoNorm);
    }

    /**
     * Crea un usuario con contraseña hasheada (bcrypt). El nombre de usuario debe ser único
     * (comparación sin distinguir mayúsculas).
     */
    public RegisterResult register(String nombre, String usuario, String password) {
        if (nombre == null || nombre.isBlank()) {
            return new RegisterResult.Error("El nombre es obligatorio");
        }
        if (usuario == null || usuario.isBlank()) {
            return new RegisterResult.Error("El usuario es obligatorio");
        }
        String u = usuario.trim();
        if (u.length() < 2 || u.length() > 64) {
            return new RegisterResult.Error("El usuario debe tener entre 2 y 64 caracteres");
        }
        if (!u.matches("^[a-zA-Z0-9._-]+$")) {
            return new RegisterResult.Error(
                    "El usuario solo puede contener letras, números, punto, guion y guion bajo");
        }
        if (password == null || password.length() < 6) {
            return new RegisterResult.Error("La contraseña debe tener al menos 6 caracteres");
        }
        if (nombre.trim().length() > 255) {
            return new RegisterResult.Error("El nombre es demasiado largo");
        }
        if (usuarioRepository.countByUsuarioNormalized(u) > 0) {
            return new RegisterResult.Error("Ese nombre de usuario ya está en uso");
        }
        String hash = passwordEncoder.encode(password);
        usuarioRepository.save(new Usuario(nombre.trim(), u, hash));
        return new RegisterResult.Ok();
    }
}
