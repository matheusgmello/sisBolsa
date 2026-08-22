package dev.matheus.cadastroBolsistas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

/*
 * bolsista do sistema. a tabela tambem guarda os ADMIN, diferenciados por tipo_usuario.
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

    /*
     * a coluna e nullable (admin nao tem lab), por isso Integer.
     * o get/set publico continua em int para nao mexer em controller nem jsp:
     * 0 para fora vira null no banco, igual ao que o dao antigo fazia.
     */
    @Column(name = "laboratorio_id")
    private Integer laboratorioId;

    /*
     * so leitura, serve para resolver o nome do lab sem query extra.
     * quem grava a coluna e o campo laboratorioId acima.
     */
    @ManyToOne
    @JoinColumn(name = "laboratorio_id", insertable = false, updatable = false)
    private Laboratorio laboratorio;

    @Enumerated(EnumType.STRING)
    private Cargo cargo;

    public Bolsista() {
        super();
        setTipoUsuario("BOLSISTA");
    }

    public Bolsista(int id, String nome, String senha, LocalDate dataNascimento, String curso, String email,
                    String matricula, String cpf, String telefone, boolean ativo, int laboratorioId,
                    String nomeLaboratorio, String tipoUsuario, String fotoUrl, Cargo cargo) {
        super(id, nome, email, senha, ativo, tipoUsuario, fotoUrl, nomeLaboratorio);
        this.dataNascimento = dataNascimento;
        this.curso = curso;
        this.matricula = matricula;
        this.cpf = cpf;
        this.telefone = telefone;
        setLaboratorioId(laboratorioId);
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

    public int getLaboratorioId() { return laboratorioId != null ? laboratorioId : 0; }
    public void setLaboratorioId(int laboratorioId) { this.laboratorioId = laboratorioId > 0 ? laboratorioId : null; }

    public Laboratorio getLaboratorio() { return laboratorio; }

    @Override
    public String getNomeLaboratorio() {
        return laboratorio != null ? laboratorio.getNome() : super.getNomeLaboratorio();
    }

    public Cargo getCargo() { return cargo; }
    public void setCargo(Cargo cargo) { this.cargo = cargo; }
}
