# SisBolsa — Gestão de Bolsistas e Laboratórios

Sistema web acadêmico para gerenciamento de bolsistas, laboratórios de pesquisa, projetos e registros de frequência. API REST em Spring Boot com frontend estático consumindo `/api/**`.

## Preview do Projeto
![Preview](docs/images/previw.gif)

---

## Arquitetura

O frontend é estático e conversa com o backend só por HTTP:

```
HTML + CSS + JS → fetch /api/** → @RestController → Service → Repository (JPA) → PostgreSQL
```

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Frontend | HTML + CSS + JS puro | Páginas estáticas que consomem a API por `fetch` |
| API | `@RestController` + DTOs (`record`) | Endpoints REST em `/api/**`, erros em JSON |
| Service | `@Service` | Regras de negócio e permissões |
| Repository | Spring Data JPA | Acesso ao banco |
| Security | `SecurityConfig`, `JwtCookieFilter` | Autenticação por JWT em cookie e proteção de rotas |
| Migrations | Flyway | Dono do schema e dos dados iniciais |

**Stack:** Spring Boot 4.x · Java 21 · PostgreSQL · JPA · Flyway · Spring Security + JWT · springdoc/Swagger · HTML/CSS/JS · Maven · Docker

---

## Perfis de Usuário

O sistema possui três perfis com permissões distintas:

### ADMIN
- Gerencia todos os usuários (bolsistas, professores e outros admins)
- Cria, edita e exclui laboratórios e projetos de qualquer laboratório
- Visualiza e edita frequências de qualquer bolsista
- Acessa relatórios analíticos completos
- Exporta dados em CSV
- Limite de 3 administradores no sistema

### PROFESSOR
- Visualiza e gerencia apenas os laboratórios que coordena
- Cadastra e edita bolsistas vinculados aos seus laboratórios
- Visualiza e registra frequências dos bolsistas de seus laboratórios
- Dashboard personalizado com seus laboratórios e bolsistas coordenados

### BOLSISTA
- Registra e edita apenas suas próprias frequências
- Visualiza a equipe e os projetos do seu laboratório
- Edita o próprio perfil (nome, e-mail, foto, bio, senha)
- Acessa resumo pessoal de horas trabalhadas no mês

---

## Funcionalidades

### Autenticação e Sessão
- Login por e-mail e senha com hash BCrypt
- JWT emitido em cookie `httpOnly` + `SameSite=Strict` no login
- Spring Security protege `/api/**`; as páginas são casca sem dado e não precisam de proteção própria
- Requisição sem token válido recebe 401 em JSON, e o JavaScript devolve o usuário ao login
- Troca de senha exige confirmação da senha atual

### Usuários (Bolsistas, Professores e Admins)
- CRUD completo com soft delete (`ativo = false`)
- Filtro por nome, curso e tipo de usuário
- Paginação na listagem
- Exportação em CSV
- Campo de cargo para bolsistas: `DESENVOLVEDOR`, `PESQUISADOR`, `LIDER_TECNICO`, `DESIGNER`, `AUXILIAR`
- Foto de perfil via URL e biografia

### Laboratórios
- CRUD com controle de capacidade máxima
- Barra visual de ocupação (verde / amarelo / vermelho) por percentual de vagas preenchidas
- Alerta visual quando ocupação ultrapassa 85%
- Página de detalhes em 3 abas: **Visão Geral**, **Projetos** e **Equipe**
- Professor só acessa e edita os laboratórios que coordena

### Projetos
- Vinculados a um laboratório, gerenciados pelo coordenador ou admin
- Página de detalhes para gerenciar membros (vincular/desvincular bolsistas)
- Listagem geral com filtro por laboratório e busca por nome

### Frequência
- Bolsista registra horas trabalhadas com data e descrição
- Admin e professor podem registrar para qualquer bolsista do seu escopo
- Filtro por bolsista e paginação no histórico
- Resumo pessoal: total de horas no mês e total acumulado
- Exportação em CSV com filtro por papel do usuário

### Relatórios (Admin)
- Total de bolsistas, bolsistas ativos e laboratórios
- Total de horas por bolsista no mês corrente
- Projetos ativos por laboratório
- Distribuição de bolsistas por cargo
- Painel de ocupação: laboratórios próximos ou acima de 85% da capacidade

### Perfil
- Edição de nome, e-mail, foto e biografia
- Troca de senha com validação da senha atual

---

## Banco de Dados

### Tabelas

| Tabela | Descrição |
|---|---|
| `professor` | Professores coordenadores de laboratórios |
| `laboratorio` | Laboratórios de pesquisa |
| `bolsista` | Bolsistas, admins e outros usuários |
| `projeto` | Projetos vinculados a laboratórios |
| `bolsista_projeto` | Relacionamento N:N entre bolsistas e projetos |
| `frequencia` | Registros de horas trabalhadas |

### Relacionamentos
- Um professor pode coordenar vários laboratórios
- Um laboratório tem um coordenador (professor)
- Um bolsista pertence a zero ou um laboratório
- Um laboratório possui vários projetos
- Um bolsista pode participar de vários projetos (e vice-versa)
- Um bolsista pode ter vários registros de frequência

### Migrations

O Flyway é dono do schema. As migrations ficam em `src/main/resources/db/migration`
e são aplicadas automaticamente na subida da aplicação:

| Arquivo | O que faz |
|---|---|
| `V1__schema.sql` | Cria as 6 tabelas |
| `V2__seed.sql` | 3 professores, 3 laboratórios, 6 projetos, 7 bolsistas, 1 admin e 28 frequências |
| `V3__professor_tipo_usuario.sql` | Adiciona `tipo_usuario` em `professor`, o que permite às duas tabelas de usuário compartilharem o mesmo `@MappedSuperclass` |
| `V4__senhas_bcrypt.sql` | Converte os hashes do seed de SHA-256 para BCrypt |

Migration já aplicada nunca é editada — mudança de schema entra como arquivo novo.

---

## Segurança

- **Senhas:** BCrypt (`$2a$10$`) via `PasswordEncoder` do Spring Security. SHA-256 puro foi abandonado: é rápido demais e, sem salt, a mesma senha gera sempre o mesmo hash
- **SQL Injection:** consultas via Spring Data JPA, sempre com parâmetros nomeados — nenhuma query é montada por concatenação
- **XSS:** todo dado vindo da API passa por `Util.escapar()` antes de virar HTML
- **Controle de acesso:** Spring Security nas rotas + escopo por perfil nos services (`podeGerenciar`, `filtrarPorEscopo`), para a regra não existir em duas versões
- **Token:** cookie `httpOnly` (fora do alcance de JavaScript/XSS) com `SameSite=Strict` (cobre CSRF)
- **Soft delete:** exclusões não removem registros do banco, apenas marcam `ativo = false`

---

## Testes

```bash
mvn test
```

A suíte cobre 74 casos de teste sem dependência de banco de dados:

| Classe | Testes | Cobertura |
|---|---|---|
| `StringUtilTest` | 11 | `limpar()` e `estaVazio()` com todos os casos de borda |
| `UsuarioTest` | 6 | `isAdmin()`, `isBolsista()`, `isProfessor()` |
| `CargoTest` | 4 | `Cargo.deString()` com valores válidos, nulo e inválido |
| `LoginServiceTest` | 7 | Autenticação BCrypt, fallback para professor, senha nunca em texto puro |
| `LaboratorioServiceTest` | 9 | `podeGerenciar()` e `temVaga()` por perfil e cenário |
| `BolsistaServiceTest` | 8 | `podeGerenciar()` e `inserir()` com todos os perfis |
| `AuthApiControllerTest` | 18 | Login, cookie JWT, perfil, troca de senha, cadastro de admin |
| `CadastroBolsistasApplicationTests` | 1 | Contexto Spring sobe |
| `ProfessorServiceTest` | 10 | CRUD completo e soft delete via mock do repositório |

---

## API REST

Documentação interativa em **`http://localhost:8080/swagger-ui.html`** (aberta, sem
login — o que ela mostra é o formato dos endpoints, que continuam exigindo token).
O contrato OpenAPI cru fica em `/v3/api-docs`.

Para testar pela própria interface: chame `POST /api/auth/login` com e-mail e senha.
O cookie `httpOnly` é gravado no navegador e as chamadas seguintes já vão autenticadas
— não precisa colar token em lugar nenhum.

Todos os endpoints ficam sob `/api/**`, autenticados pelo mesmo cookie JWT das
telas. Erros saem sempre como `{"mensagem": "..."}`.

| Recurso | Endpoints |
|---|---|
| Autenticação | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `PUT /api/auth/perfil` · `POST /api/auth/cadastro-admin` |
| Usuários | `GET/POST /api/usuarios` · `GET/PUT/DELETE /api/usuarios/{id}` · `GET /api/usuarios/{id}/projetos` · `GET /api/usuarios/exportar` |
| Laboratórios | `GET/POST /api/laboratorios` · `GET/PUT/DELETE /api/laboratorios/{id}` · `GET /api/laboratorios/{id}/bolsistas` · `GET /api/laboratorios/{id}/projetos` |
| Projetos | `GET/POST /api/projetos` · `GET/PUT/DELETE /api/projetos/{id}` · `GET /api/projetos/{id}/membros` · `POST/DELETE /api/projetos/{id}/membros/{bolsistaId}` |
| Frequências | `GET/POST /api/frequencias` · `GET/PUT/DELETE /api/frequencias/{id}` · `GET /api/frequencias/resumo` · `GET /api/frequencias/exportar` |
| Relatórios (admin) | `GET /api/relatorios/resumo` · `/horas-mes` · `/projetos-por-laboratorio` · `/bolsistas-por-cargo` · `/ocupacao` |

As regras de escopo valem igual na API: professor só alcança os laboratórios que
coordena, bolsista só as próprias frequências e os colegas do próprio laboratório.

## Estrutura do Projeto

```
src/main/java/dev/matheus/cadastroBolsistas/
  api/          ← Controllers REST (/api/**) e tratamento de erro
  dto/          ← Records de entrada e saída da API
  security/     ← SecurityConfig, JwtService, JwtCookieFilter, CookieJwt
  config/       ← OpenApiConfig (metadados do Swagger)
  service/      ← Regras de negócio e permissões
  repository/   ← Spring Data JPA
  model/        ← Entidades: Usuario, Bolsista, Professor, Laboratorio, Projeto, Frequencia, Cargo
  util/         ← StringUtil

src/main/resources/static/
  *.html           ← Uma página por tela
  css/             ← Um arquivo CSS por página
  js/
    api.js         ← Wrapper de fetch: cookie, 401 e mensagem de erro
    util.js        ← Escape de HTML, formatação, avisos
    sessao.js      ← Guarda de sessão e perfil do usuário
    sidebar.js     ← Menu lateral compartilhado
    <tela>.js      ← Lógica de cada página

src/main/resources/db/migration/
  V1__schema.sql   ← Criação das tabelas
  V2__seed.sql     ← Dados iniciais
  V3__*.sql        ← tipo_usuario em professor
  V4__*.sql        ← Senhas para BCrypt

Dockerfile         ← Build multi-stage (Maven → JRE)
docker-compose.yml ← Serviços app + db
```

---

## Deploy

`docker compose up -d --build` sobe o sistema completo em dois containers:

| Serviço | Imagem | Papel |
|---|---|---|
| `db` | `postgres:15` | Banco, com healthcheck — a aplicação só sobe depois que ele aceita conexão |
| `app` | build local | JAR executável com Tomcat embarcado |

O `Dockerfile` é multi-stage: o Maven compila num estágio e a imagem final leva
só o JRE e o JAR — sem Maven, sem código-fonte. O container roda como usuário
sem privilégio (`sisbolsa`), não como root.

Configuração por variável de ambiente, com default para desenvolvimento local:

| Variável | Default | Uso |
|---|---|---|
| `DB_HOST` | `localhost` | No compose vale `db` |
| `DB_PORT` | `5436` | Porta interna no compose é `5432` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | `cadastroBolsista` / `postgres` / `1234` | Credenciais |
| `JWT_SECRET` | valor de desenvolvimento | **Trocar em produção** |
| `JWT_EXPIRACAO_MINUTOS` | `120` | Validade do token |

---

## Histórico: migração para REST API

Este projeto nasceu como **Spring MVC + JSP + JDBC puro** e foi migrado para
**API REST + frontend estático**. A migração aconteceu na branch `trabalho/poow2`,
em sete etapas, cada uma fechando com o sistema rodando e verificada contra o
banco de verdade — não só com testes de unidade.

### Antes e depois

| | Antes | Depois |
|---|---|---|
| Persistência | JDBC puro, `PreparedStatement` na mão | Spring Data JPA |
| Schema | `db/init.sql` rodado pelo entrypoint do Postgres | Flyway, 4 migrations versionadas |
| Senha | SHA-256 sem salt | BCrypt |
| Autenticação | `AuthInterceptor` artesanal + `HttpSession` | Spring Security + JWT em cookie `httpOnly` |
| Interface | 14 JSPs com JSTL | HTML + CSS + JS estático consumindo `/api/**` |
| API | não existia | 28 rotas / 41 operações REST documentadas no Swagger |
| Conexão | credenciais chumbadas no código | variáveis de ambiente |
| Empacotamento | WAR | JAR executável em container |

### As sete etapas

| # | Etapa | Commit |
|---|---|---|
| 1 | Flyway + `DataSource` real | `2575f4a` |
| 2 | JPA, `dao/` vira `repository/` | `9aab33c` |
| 3 | Spring Security + JWT + BCrypt | `27b8b96` |
| 4 | REST em `/api/**` + DTOs | `e219dc1` |
| 5 | Swagger (springdoc) | `716085d` |
| 6 | Frontend estático, remoção da camada MVC | `2b7b7da` |
| 7 | Docker | `05d3de1` |

### Decisões que valem registro

- **Frontend estático, sem template engine.** Thymeleaf renderiza no servidor, mesma
  categoria do JSP — não serviria para um frontend que consome REST. Sem React ou Vue
  porque o porte das ~680 expressões JSTL custaria igual, e o framework só somaria uma
  segunda toolchain. Os 12 arquivos CSS foram reaproveitados **sem uma linha alterada**.
- **JWT em cookie `httpOnly`, não `localStorage`.** Navegação direta pelo browser não
  manda header `Authorization`, e os downloads de CSV são link comum. O cookie resolve
  os dois casos e ainda tira o token do alcance de JavaScript.
- **`Usuario` é `@MappedSuperclass`, não uma hierarquia JPA.** `bolsista` e `professor`
  são tabelas separadas com sequences independentes — `bolsista.id=1` e `professor.id=1`
  coexistem. Nenhuma estratégia de herança do JPA mapeia isso.
- **Soft delete por query explícita.** O `delete()` do `JpaRepository` apagaria a linha
  de verdade, e o `ON DELETE CASCADE` levaria frequências e vínculos junto.
- **A camada MVC sobreviveu até a etapa 6.** O plano original a matava na etapa 4, mas
  o frontend estático só chegou na 6 — derrubar antes deixaria o sistema quebrado por
  duas etapas. As duas frentes conviveram dividindo o mesmo cookie e os mesmos services.

### Bugs que só apareceram com o sistema rodando

Nenhum destes seria pego por teste com mock:

| Sintoma | Causa |
|---|---|
| Flyway não migrava nada, sem erro nenhum | No Boot 4 a autoconfiguração saiu do `flyway-core` para um módulo próprio |
| `/projeto` retornava 500: `function lower(bytea) does not exist` | Postgres não infere o tipo de um parâmetro `String` nulo dentro de `LOWER()` |
| `/login` redirecionava para si mesmo, em loop | O forward do Spring MVC para a JSP passa pelo filtro de autorização de novo |
| `/api/frequencias` retornava 500 com `NullPointerException` | Ternário misturando `int` e `Integer` faz unboxing dos dois lados |
| Professor via a folha de frequência do sistema inteiro | A listagem não aplicava escopo nem validava o parâmetro `bolsistaId` |

### Pontos em aberto

- **CSRF** está desligado; hoje quem cobre é o `SameSite=Strict` do cookie. Com o
  frontend estático no lugar, dá para reavaliar.
- **`JWT_SECRET`** tem valor de desenvolvimento no `docker-compose.yml`. Em produção
  precisa vir do ambiente.
- **Não há testes de integração com banco** — a suíte é toda mockada.

---

## Instalação e Execução

As instruções completas estão em [instalacao.md](instalacao.md).

### Tudo em Docker (recomendado)

```bash
docker compose up -d --build
```

Sobe banco e aplicação. O Flyway cria o schema e insere os dados iniciais no
primeiro start. Acesse `http://localhost:8080`.

### Desenvolvimento (banco em Docker, app local)

```bash
docker compose up -d db
mvn spring-boot:run
```

### Acesso inicial

```
E-mail: admin@sisbolsa.com
Senha:  12345678
```
