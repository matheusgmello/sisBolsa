# SisBolsa

Sistema web de gestao de bolsistas, laboratorios, projetos e frequencia.
Trabalho academico da disciplina de POO Web.

## Estado atual

Migracao para REST API concluida (7 etapas, ver `PLANO.md` para o historico e
as decisoes). A branch `trabalho/poow2` foi mesclada na `main` e apagada.

Stack: Spring Boot 4.0.6, Java 21, JPA, Flyway, Spring Security + JWT,
springdoc 3.1.0, frontend em React + Vite + TypeScript (SPA em `frontend/`), PostgreSQL, Docker.

Fluxo: `React (SPA) -> fetch /api/** -> @RestController -> Service ->
Repository -> PostgreSQL`. Nao existe camada MVC nem view no servidor.

## Padroes de codigo

### Comentarios
- So comentar o que precisa mesmo. Codigo obvio nao leva comentario.
- Sempre em bloco `/* ... */`, nunca `//` para explicar logica.
- Sem acentos. Linguagem informal, direta, em portugues.
- Comentario explica *por que*, nao *o que*. Se o comentario so repete o nome
  do metodo, apaga.

Exemplo do que serve:

```java
/*
 * o professor so enxerga bolsista de lab que ele coordena.
 * admin passa direto porque enxerga tudo.
 */
```

Exemplo do que nao serve:

```java
/*
 * metodo que busca o bolsista por id
 */
```

### Nomenclatura
- Codigo, pacotes e classes em portugues, seguindo o que ja existe
  (`BolsistaService`, `buscarPorId`, `podeGerenciar`).
- Colunas do banco em snake_case, campos Java em camelCase.

### Commits
- Formato `tipo(escopo): descricao` em portugues, minusculo, sem acento.
  Tipos em uso no historico: `feat`, `fix`, `refactor`, `test`, `docs`,
  `style`, `data`, `chore`.
- **Nunca** incluir linha `Co-Authored-By`.

## Regras do banco

- `excluir()` em qualquer camada e **soft delete** (`ativo = false`), nunca
  DELETE de verdade. `bolsista_projeto` e `frequencia` tem
  `ON DELETE CASCADE` - um delete real leva os filhos junto.
- Schema so muda por migration nova do Flyway em
  `src/main/resources/db/migration`. Nunca editar migration ja aplicada.
- Nada de credencial chumbada no codigo. Tudo em `application.properties`
  com placeholder de ambiente.

## Rodando

```bash
docker compose up -d --build
```

Sobe banco e aplicacao. Para desenvolver com a aplicacao local:

```bash
docker compose up -d db
mvn spring-boot:run
```

Login inicial: `admin@sisbolsa.com` / `12345678`
Swagger: `http://localhost:8080/swagger-ui.html`

## Testes

`mvn test` **nao pode depender de banco**. Os repositories sao mockados, e o
`CadastroBolsistasApplicationTests` precisa de duas propriedades para o contexto
subir sem postgres:

- `spring.flyway.enabled=false`, senao o flyway tenta migrar no startup;
- `spring.jpa.properties.hibernate.dialect`, senao o hibernate abre conexao so
  para descobrir o dialect pela metadata do jdbc.

Ja aconteceu de a suite passar so porque o container estava de pe. Ao mexer em
teste de contexto, validar com `docker compose down` antes.

## Regras da API

- Erro sai sempre como `{"mensagem": "..."}`, via `ApiExceptionHandler`.
- Senha nunca entra em DTO de resposta.
- Regra de permissao mora no service (`podeGerenciar`, `filtrarPorEscopo`),
  nunca duplicada no controller.
- Todo dado que vem da api passa por `Util.escapar()` antes de virar html.
