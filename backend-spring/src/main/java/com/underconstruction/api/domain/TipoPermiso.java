package com.underconstruction.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "TipoPermiso")
public class TipoPermiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdTipoPermiso")
    private Integer idTipoPermiso;

    @Column(name = "NombrePermiso", nullable = false, length = 255)
    private String nombrePermiso;

    @Column(name = "DescripcionPermiso", columnDefinition = "TEXT")
    private String descripcionPermiso;

    protected TipoPermiso() {}

    public Integer getIdTipoPermiso() {
        return idTipoPermiso;
    }

    public String getNombrePermiso() {
        return nombrePermiso;
    }

    public String getDescripcionPermiso() {
        return descripcionPermiso;
    }
}
