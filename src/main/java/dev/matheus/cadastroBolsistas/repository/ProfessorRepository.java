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

    /*
     * bcrypt tem salt proprio por hash, entao nao da para comparar senha
     * dentro do sql como antes. busca so pelo email e quem confere e o
     * PasswordEncoder no LoginService.
     */
    Optional<Professor> findByEmailAndAtivoTrue(String email);

    List<Professor> findByAtivoTrueOrderByNome();

    List<Professor> findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome(String nome);

    /* soft delete, mesmo motivo do BolsistaRepository */
    @Modifying
    @Query("UPDATE Professor p SET p.ativo = false WHERE p.id = :id")
    int desativar(@Param("id") int id);
}
