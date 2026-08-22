package dev.matheus.cadastroBolsistas.repository;

import dev.matheus.cadastroBolsistas.model.Laboratorio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaboratorioRepository extends JpaRepository<Laboratorio, Integer> {

    List<Laboratorio> findByAtivoTrueOrderByNome();

    /* jpql explicito: coordenadorId e coordenadorProfessor deixam o nome derivado ambiguo */
    @Query("SELECT l FROM Laboratorio l WHERE l.coordenadorId = :professorId AND l.ativo = true ORDER BY l.nome")
    List<Laboratorio> buscarPorCoordenador(@Param("professorId") int professorId);

    @Query("SELECT COUNT(b) FROM Bolsista b WHERE b.laboratorioId = :labId AND b.ativo = true")
    int contarBolsistasAtivos(@Param("labId") int labId);

    /* soft delete, mesmo motivo do BolsistaRepository */
    @Modifying
    @Query("UPDATE Laboratorio l SET l.ativo = false WHERE l.id = :id")
    int desativar(@Param("id") int id);
}
