package dev.matheus.cadastroBolsistas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

import java.util.ArrayList;

/*
 * laboratorio de pesquisa. tem um professor coordenador e uma capacidade
 * maxima de bolsistas.
 */
@Entity
@Table(name = "laboratorio")
public class Laboratorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String nome;

    @Column(name = "area_pesquisa")
    private String areaPesquisa;

    private String status;
    private int capacidade;

    /* mesmo esquema do laboratorioId em Bolsista: coluna nullable, api publica em int */
    @Column(name = "coordenador_id")
    private Integer coordenadorId;

    /* so leitura, serve para o getCoordenador() devolver o nome sem query extra */
    @ManyToOne
    @JoinColumn(name = "coordenador_id", insertable = false, updatable = false)
    private Professor coordenadorProfessor;

    private boolean ativo;

    /* preenchidos pelo controller quando a tela precisa, nao sao colunas */
    @Transient
    private int totalBolsistas;
    @Transient
    private ArrayList<Projeto> projetos = new ArrayList<>();

    public Laboratorio() {}

    public Laboratorio(int id, String nome, String areaPesquisa, String status, int capacidade,
                       int coordenadorId, String coordenador, boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.areaPesquisa = areaPesquisa;
        this.status = status;
        this.capacidade = capacidade;
        setCoordenadorId(coordenadorId);
        this.ativo = ativo;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getAreaPesquisa() { return areaPesquisa; }
    public void setAreaPesquisa(String areaPesquisa) { this.areaPesquisa = areaPesquisa; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getCapacidade() { return capacidade; }
    public void setCapacidade(int capacidade) { this.capacidade = capacidade; }

    public int getCoordenadorId() { return coordenadorId != null ? coordenadorId : 0; }
    public void setCoordenadorId(int coordenadorId) { this.coordenadorId = coordenadorId > 0 ? coordenadorId : null; }

    /* as jsp leem ${lab.coordenador} esperando o nome do professor */
    public String getCoordenador() {
        return coordenadorProfessor != null ? coordenadorProfessor.getNome() : null;
    }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }

    public ArrayList<Projeto> getProjetos() { return projetos; }
    public void setProjetos(ArrayList<Projeto> projetos) { this.projetos = projetos; }

    public int getTotalBolsistas() { return totalBolsistas; }
    public void setTotalBolsistas(int totalBolsistas) { this.totalBolsistas = totalBolsistas; }
}
