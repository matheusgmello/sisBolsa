package dev.matheus.cadastroBolsistas.dao;

import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/*
 * ponte entre os daos legados e o pool de conexao do spring.
 * os daos chamam getConexao() de forma estatica, entao o datasource injetado
 * fica guardado num campo static ate os daos virarem repositories.
 *
 * ponytail: gambiarra proposital de campo static. some inteira na etapa 2,
 * quando os repositories do spring data assumem o acesso ao banco.
 */
@Component
public class ConectaDBPostgres {

    private static DataSource dataSource;

    public ConectaDBPostgres(DataSource dataSource) {
        ConectaDBPostgres.dataSource = dataSource;
    }

    public static Connection getConexao() {
        if (dataSource == null) {
            throw new IllegalStateException("DataSource ainda nao foi injetado pelo spring.");
        }
        try {
            return dataSource.getConnection();
        } catch (SQLException ex) {
            throw new RuntimeException("Erro ao obter conexao do pool.", ex);
        }
    }
}
