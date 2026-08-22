package dev.matheus.cadastroBolsistas;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/*
 * o flyway fica desligado aqui porque a suite nao sobe banco.
 * o datasource ainda e criado, mas o hikari so abre conexao quando alguem pede.
 */
@SpringBootTest(properties = "spring.flyway.enabled=false")
class CadastroBolsistasApplicationTests {

	@Test
	void contextLoads() {
	}

}
