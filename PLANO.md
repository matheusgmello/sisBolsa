# Migracao para REST API - branch `trabalho/poow2`

Sai de Spring MVC + JSP + JDBC puro, vai para REST API com frontend estatico.

## Etapas

| # | Etapa | Status |
|---|---|---|
| 1 | Flyway + DataSource real | feito |
| 2 | JPA, `dao/` vira `repository/` | feito |
| 3 | Spring Security + JWT em cookie httpOnly | feito |
| 4 | `@RestController` em `/api/**` + DTOs | feito |
| 5 | Swagger (springdoc 3.1.0) | feito |
| 6 | Frontend estatico em `resources/static/` + morte da camada MVC | feito |
| 7 | Docker: WAR vira JAR, compose com `app` + `db` | feito |

Cada etapa fecha com o sistema rodando.

## Correcao de sequenciamento (etapa 4)

O plano original dizia que a camada MVC morreria na etapa 4. Nao da: o frontend
estatico so chega na etapa 6, entao matar as jsp na 4 deixaria o sistema
quebrado por duas etapas. `/api/**` entrou **ao lado** das jsp; o MVC morre na
etapa 6, quando existe substituto.

Enquanto convivem, os dois compartilham o mesmo cookie jwt e a mesma camada de
service - inclusive `BolsistaService.filtrarPorEscopo`, que saiu de dentro do
controller justamente para a regra de permissao nao existir em duas versoes.

## Decisoes tomadas

- **Frontend estatico, sem template engine.** Thymeleaf renderiza no servidor,
  mesma categoria do JSP - nao serve para consumir REST. HTML + CSS + JS puro.
- **Sem React/Vue.** O porte das ~680 expressoes JSTL custa igual nos dois; o
  framework so somaria uma segunda toolchain. Os 2.571 linhas de CSS entram
  intactas.
- **JWT em cookie httpOnly, nao localStorage.** Navegacao direta pelo browser
  nao manda header `Authorization`, e os downloads de CSV
  (`/bolsista/exportar`, `/frequencia/exportar`) sao links comuns.
- Rotas `/api/**` sem versionamento - nao ha consumidor externo.
- Paginas estaticas ficam publicas (sao casca sem dado). Protecao so em `/api/**`.
- Senha do seed continua `12345678`, vira bcrypt na etapa 3.

## Armadilhas mapeadas para a etapa 2

- **`excluir()` e soft delete, nao `delete()`.** Todos fazem
  `UPDATE ... SET ativo=false`. `repository.delete()` apaga de verdade e o
  `ON DELETE CASCADE` leva `bolsista_projeto` e `frequencia` junto.
- **Heranca `Usuario` nao mapeia em JPA.** `bolsista` e `professor` sao tabelas
  separadas com sequences independentes (`bolsista.id=1` e `professor.id=1`
  coexistem). Nenhuma estrategia de heranca JPA funciona. `Usuario` vira
  `@MappedSuperclass` e as duas viram entidades independentes. ADMIN continua
  morando na tabela `bolsista` via `tipo_usuario`.
- **`RelatorioDAO` devolve `List<Map<String,Object>>`** de queries com
  `GROUP BY`/`SUM`. Spring Data nao lida bem com `Map` - os 4 metodos viram
  `@Query(nativeQuery=true)` com interface projection. E reescrita.
- ~~`autenticar()` dos repositorios~~ resolvido na etapa 3: bcrypt tem salt, entao
  a comparacao saiu do sql e foi para o `PasswordEncoder`.
- ~~`throws SQLException`~~ removido na etapa 4 do projeto inteiro.
- `getProjetosDosBolsistasDoLaboratorio` existe so para driblar N+1 na mao.
  `@EntityGraph` / `JOIN FETCH` torna o metodo desnecessario.
- `BolsistaController.listar` pagina com `subList` em memoria depois de
  carregar tudo. Vira `Pageable`.
- Os 4 testes de service que mockam DAO quebram. Repository e interface, entao
  o conserto e mecanico.

## Codigo que morre ate o fim

`dao/` inteiro, `ConectaDBPostgres`, as 14 JSPs, `sidebar.tag`, `index.jsp`,
`web.xml`, `ServletInitializer`, `tomcat-embed-jasper`, as duas dependencias
JSTL, `AuthInterceptor`, `SecurityUtil` (sha-256), packaging WAR.

## Codigo que sobrevive

Os 7 Services (regra de negocio intacta), os 7 models (viram `@Entity`), os
11 arquivos CSS, os 2 JS de validacao, `StringUtil`.
