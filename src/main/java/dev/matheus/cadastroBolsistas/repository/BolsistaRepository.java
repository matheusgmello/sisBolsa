package dev.matheus.cadastroBolsistas.repository;

import dev.matheus.cadastroBolsistas.model.Bolsista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BolsistaRepository extends JpaRepository<Bolsista, Integer> {

    /*
     * bcrypt tem salt proprio por hash, entao nao da para comparar senha
     * dentro do sql como antes. busca so pelo email e quem confere e o
     * PasswordEncoder no LoginService.
     */
    Optional<Bolsista> findByEmailAndAtivoTrue(String email);

    List<Bolsista> findByAtivoTrueOrderByNome();

    List<Bolsista> findByNomeContainingIgnoreCaseAndAtivoTrueOrderByNome(String nome);

    List<Bolsista> findByCursoContainingIgnoreCaseAndAtivoTrueOrderByNome(String curso);

    /*
     * jpql explicito porque existe o campo laboratorioId e a relacao laboratorio:
     * derivar pelo nome do metodo fica ambiguo.
     */
    @Query("SELECT b FROM Bolsista b WHERE b.laboratorioId = :labId AND b.ativo = true ORDER BY b.nome")
    List<Bolsista> buscarPorLaboratorio(@Param("labId") int labId);

    @Query(value = "SELECT b.* FROM bolsista b "
            + "INNER JOIN bolsista_projeto bp ON b.id = bp.bolsista_id "
            + "WHERE bp.projeto_id = :projetoId AND b.ativo = true ORDER BY b.nome",
            nativeQuery = true)
    List<Bolsista> buscarPorProjeto(@Param("projetoId") int projetoId);

    int countByTipoUsuarioAndAtivoTrue(String tipoUsuario);

    /*
     * soft delete. nao usar o delete() do JpaRepository: apagaria a linha de
     * verdade e o ON DELETE CASCADE levaria frequencias e vinculos junto.
     */
    @Modifying
    @Query("UPDATE Bolsista b SET b.ativo = false WHERE b.id = :id")
    int desativar(@Param("id") int id);
}
