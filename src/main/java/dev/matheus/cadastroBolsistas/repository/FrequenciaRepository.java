package dev.matheus.cadastroBolsistas.repository;

import dev.matheus.cadastroBolsistas.model.Frequencia;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FrequenciaRepository extends JpaRepository<Frequencia, Integer> {

    Optional<Frequencia> findByIdAndAtivoTrue(int id);

    @Query("SELECT f FROM Frequencia f WHERE f.bolsistaId = :bolsistaId AND f.ativo = true ORDER BY f.data DESC")
    List<Frequencia> buscarPorBolsista(@Param("bolsistaId") int bolsistaId);

    @Query("SELECT f FROM Frequencia f WHERE f.ativo = true "
            + "AND f.bolsistaId IN (SELECT b.id FROM Bolsista b WHERE b.laboratorioId = :labId) "
            + "ORDER BY f.data DESC")
    List<Frequencia> buscarPorLaboratorio(@Param("labId") int labId);

    List<Frequencia> findByAtivoTrueOrderByDataDesc();

    /*
     * filtro opcional por bolsista. a paginacao vem no Pageable, no lugar do
     * limit/offset que o dao antigo colava na string do sql.
     */
    @Query("SELECT f FROM Frequencia f WHERE f.ativo = true "
            + "AND (:bolsistaId IS NULL OR f.bolsistaId = :bolsistaId) "
            + "ORDER BY f.data DESC")
    List<Frequencia> buscarFrequencias(@Param("bolsistaId") Integer bolsistaId, Pageable pageable);

    @Query("SELECT COUNT(f) FROM Frequencia f WHERE f.ativo = true "
            + "AND (:bolsistaId IS NULL OR f.bolsistaId = :bolsistaId)")
    int contarFrequencias(@Param("bolsistaId") Integer bolsistaId);

    /*
     * usado pelo professor sem filtro: ele so pode ver as frequencias dos
     * bolsistas dos laboratorios que coordena, e nao a folha do sistema inteiro.
     */
    @Query("SELECT f FROM Frequencia f WHERE f.ativo = true AND f.bolsistaId IN :ids ORDER BY f.data DESC")
    List<Frequencia> buscarPorBolsistas(@Param("ids") List<Integer> ids, Pageable pageable);

    @Query("SELECT COUNT(f) FROM Frequencia f WHERE f.ativo = true AND f.bolsistaId IN :ids")
    int contarPorBolsistas(@Param("ids") List<Integer> ids);

    /* soft delete, mesmo motivo do BolsistaRepository */
    @Modifying
    @Query("UPDATE Frequencia f SET f.ativo = false WHERE f.id = :id")
    int desativar(@Param("id") int id);
}
