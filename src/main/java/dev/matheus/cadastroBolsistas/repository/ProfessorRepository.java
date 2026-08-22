package dev.matheus.cadastroBolsistas.repository;

import dev.matheus.cadastroBolsistas.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfessorRepository extends JpaRepository<Professor, Integer> {

    Optional<Professor> findByEmailAndSenhaAndAtivoTrue(String email, String senha);

    List<Professor> findByAtivoTrueOrderByNome();

    List<Professor> findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome(String nome);

    /* soft delete, mesmo motivo do BolsistaRepository */
    @Modifying
    @Query("UPDATE Professor p SET p.ativo = false WHERE p.id = :id")
    int desativar(@Param("id") int id);
}
