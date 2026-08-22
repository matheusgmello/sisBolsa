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

**Stack:** Spring Boot 4.x · Java 21 · PostgreSQL · JPA · Flyway · Spring Security + JWT · springdoc/Swagger · HTML/CSS/JS · Maven

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
- Sessão gerenciada via `HttpSession`
- JWT emitido em cookie `httpOnly` + `SameSite=Strict` no login
- Spring Security protege todas as rotas exceto `/login`, `/cadastro-admin` e recursos estáticos
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

As migrations do Flyway em `src/main/resources/db/migration` criam todas as tabelas (`V1__schema.sql`) e inserem os dados iniciais (`V2__seed.sql`) com 3 professores, 3 laboratórios, 6 projetos (2 por laboratório), 7 bolsistas, 1 admin e frequências de exemplo. São aplicadas automaticamente na subida da aplicação.

---

## Segurança

- **Senhas:** BCrypt (`$2a$10$`) via `PasswordEncoder` do Spring Security. SHA-256 puro foi abandonado: é rápido demais e, sem salt, a mesma senha gera sempre o mesmo hash
- **SQL Injection:** todos os DAOs usam `PreparedStatement` com parâmetros `?`
- **Controle de acesso:** Spring Security nas rotas + lógica de escopo nos controllers e services
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
| Autenticação | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` |
| Usuários | `GET/POST /api/usuarios` · `GET/PUT/DELETE /api/usuarios/{id}` |
| Laboratórios | `GET/POST /api/laboratorios` · `GET/PUT/DELETE /api/laboratorios/{id}` · `GET /api/laboratorios/{id}/bolsistas` · `GET /api/laboratorios/{id}/projetos` |
| Projetos | `GET/POST /api/projetos` · `GET/PUT/DELETE /api/projetos/{id}` · `GET /api/projetos/{id}/membros` · `POST/DELETE /api/projetos/{id}/membros/{bolsistaId}` |
| Frequências | `GET/POST /api/frequencias` · `GET/PUT/DELETE /api/frequencias/{id}` |
| Relatórios (admin) | `GET /api/relatorios/resumo` · `/horas-mes` · `/projetos-por-laboratorio` · `/bolsistas-por-cargo` · `/ocupacao` |

As regras de escopo valem igual na API: professor só alcança os laboratórios que
coordena, bolsista só as próprias frequências e os colegas do próprio laboratório.

## Estrutura do Projeto

```
src/main/java/dev/matheus/cadastroBolsistas/
  api/          ← Controllers REST (/api/**) e tratamento de erro
  dto/          ← Records de entrada e saída da API
  security/     ← SecurityConfig, JwtService, JwtCookieFilter, CookieJwt
  config/       ← WebConfig (recursos estáticos)
  controller/   ← Controllers Spring MVC por entidade
  service/      ← Regras de negócio
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
```

---

## Instalação e Execução

As instruções completas estão em [instalacao.md](instalacao.md).

### Resumo rápido

```bash
# 1. Subir o banco
docker compose up -d

# 2. Rodar a aplicação
mvn spring-boot:run
```

Acesse: `http://localhost:8080`

### Acesso inicial

```
E-mail: admin@sisbolsa.com
Senha:  12345678
```
