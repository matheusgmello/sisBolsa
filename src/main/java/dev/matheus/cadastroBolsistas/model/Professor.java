package dev.matheus.cadastroBolsistas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/*
 * professor/coordenador. tabela propria, sem relacao mapeada com laboratorio -
 * quem aponta e o laboratorio, via coordenador_id.
 */
@Entity
@Table(name = "professor")
public class Professor extends Usuario {

    public Professor() {
        super();
        setTipoUsuario("PROFESSOR");
    }

    public Professor(int id, String nome, String email, String senha, boolean ativo, String fotoUrl) {
        super(id, nome, email, senha, ativo, "PROFESSOR", fotoUrl, null);
    }
}
