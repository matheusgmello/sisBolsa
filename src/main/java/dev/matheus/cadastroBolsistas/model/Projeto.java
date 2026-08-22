package dev.matheus.cadastroBolsistas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/*
 * projeto vinculado a um laboratorio. o vinculo com bolsistas mora na tabela
 * bolsista_projeto e e manipulado por queries do ProjetoRepository, nao por
 * uma colecao mapeada - o Bolsista vai parar na HttpSession e colecao lazy
 * em objeto de sessao so da dor de cabeca.
 */
@Entity
@Table(name = "projeto")
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String nome;
    private String descricao;

    @Column(name = "laboratorio_id")
    private Integer laboratorioId;

    @ManyToOne
    @JoinColumn(name = "laboratorio_id", insertable = false, updatable = false)
    private Laboratorio laboratorio;

    private boolean ativo;

    public Projeto() {}

    public Projeto(int id, String nome, String descricao, int laboratorioId, String nomeLaboratorio, boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        setLaboratorioId(laboratorioId);
        this.ativo = ativo;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public int getLaboratorioId() { return laboratorioId != null ? laboratorioId : 0; }
    public void setLaboratorioId(int laboratorioId) { this.laboratorioId = laboratorioId > 0 ? laboratorioId : null; }

    public String getNomeLaboratorio() {
        return laboratorio != null ? laboratorio.getNome() : null;
    }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
