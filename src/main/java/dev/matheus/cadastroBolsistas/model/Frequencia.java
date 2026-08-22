package dev.matheus.cadastroBolsistas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

/*
 * registro de horas trabalhadas por um bolsista.
 */
@Entity
@Table(name = "frequencia")
public class Frequencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "bolsista_id")
    private Integer bolsistaId;

    /* so leitura, serve para o getNomeBolsista() das telas de frequencia */
    @ManyToOne
    @JoinColumn(name = "bolsista_id", insertable = false, updatable = false)
    private Bolsista bolsista;

    private LocalDate data;

    @Column(name = "horas_trabalhadas")
    private double horasTrabalhadas;

    private String descricao;
    private boolean ativo;

    public Frequencia() {}

    public Frequencia(int id, int bolsistaId, LocalDate data, double horasTrabalhadas, String descricao, boolean ativo) {
        this.id = id;
        setBolsistaId(bolsistaId);
        this.data = data;
        this.horasTrabalhadas = horasTrabalhadas;
        this.descricao = descricao;
        this.ativo = ativo;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getBolsistaId() { return bolsistaId != null ? bolsistaId : 0; }
    public void setBolsistaId(int bolsistaId) { this.bolsistaId = bolsistaId > 0 ? bolsistaId : null; }

    public String getNomeBolsista() {
        return bolsista != null ? bolsista.getNome() : null;
    }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public double getHorasTrabalhadas() { return horasTrabalhadas; }
    public void setHorasTrabalhadas(double horasTrabalhadas) { this.horasTrabalhadas = horasTrabalhadas; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
