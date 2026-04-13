package com.underconstruction.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "Permisos",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_usuario_tipo",
                        columnNames = {"IdUsuarios", "IdTipoPermiso"}))
public class Permiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdPermisos")
    private Long idPermisos;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "IdUsuarios", nullable = false)
    private Usuario usuario;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "IdTipoPermiso", nullable = false)
    private TipoPermiso tipoPermiso;

    @Column(name = "Acceso", nullable = false)
    private Integer acceso = 1;

    protected Permiso() {}

    public Permiso(Usuario usuario, TipoPermiso tipoPermiso, int acceso) {
        this.usuario = usuario;
        this.tipoPermiso = tipoPermiso;
        this.acceso = acceso;
    }

    public Long getIdPermisos() {
        return idPermisos;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public TipoPermiso getTipoPermiso() {
        return tipoPermiso;
    }

    public Integer getAcceso() {
        return acceso;
    }

    public void setAcceso(int acceso) {
        this.acceso = acceso;
    }
}
