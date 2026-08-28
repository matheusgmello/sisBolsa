package dev.matheus.cadastroBolsistas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.UUID;

/*
 * bolsista e admin do sistema com id UUID.
 */
@Entity
@Table(name = "bolsista")
public class Bolsista extends Usuario {

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    private String curso;
    private String matricula;
    private String cpf;
    private String telefone;

    @Column(name = "laboratorio_id")
    private UUID laboratorioId;

    @ManyToOne
    @JoinColumn(name = "laboratorio_id", insertable = false, updatable = false)
    private Laboratorio laboratorio;

    @Enumerated(EnumType.STRING)
    private Cargo cargo;

    public Bolsista() {
        super();
        setTipoUsuario("BOLSISTA");
    }

    public Bolsista(UUID id, String nome, String senha, LocalDate dataNascimento, String curso, String email,
                    String matricula, String cpf, String telefone, boolean ativo, UUID laboratorioId,
                    String nomeLaboratorio, String tipoUsuario, String fotoUrl, Cargo cargo) {
        super(id, nome, email, senha, ativo, tipoUsuario, fotoUrl, nomeLaboratorio);
        this.dataNascimento = dataNascimento;
        this.curso = curso;
        this.matricula = matricula;
        this.cpf = cpf;
        this.telefone = telefone;
        this.laboratorioId = laboratorioId;
        this.cargo = cargo;
    }

    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }

    public String getCurso() { return curso; }
    public void setCurso(String curso) { this.curso = curso; }

    public String getMatricula() { return matricula; }
    public void setMatricula(String matricula) { this.matricula = matricula; }

    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public UUID getLaboratorioId() { return laboratorioId; }
    public void setLaboratorioId(UUID laboratorioId) { this.laboratorioId = laboratorioId; }

    public Laboratorio getLaboratorio() { return laboratorio; }

    @Override
    public String getNomeLaboratorio() {
        return laboratorio != null ? laboratorio.getNome() : super.getNomeLaboratorio();
    }

    public Cargo getCargo() { return cargo; }
    public void setCargo(Cargo cargo) { this.cargo = cargo; }
}
