# SisBolsa — Gestão de Bolsistas e Laboratórios

Sistema web acadêmico para gerenciamento de bolsistas, laboratórios de pesquisa, projetos e registros de frequência. Desenvolvido com Spring MVC, JSP e JDBC direto sobre PostgreSQL.

## Preview do Projeto
![Preview](docs/images/previw.gif)

---

## Arquitetura

O projeto segue o padrão MVC em camadas com Spring MVC:

```
JSP → Controller → Service → DAO → PostgreSQL
```

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| View | JSP + JSTL + CSS | Renderização das páginas |
| Controller | Spring MVC `@Controller` | Recebe requisições HTTP, retorna view names |
| Service | `@Service` | Regras de negócio e orquestração |
| DAO | `@Repository` + JDBC direto | Acesso ao banco via `PreparedStatement` |
| Config | `AuthInterceptor`, `WebConfig` | Proteção de rotas e recursos estáticos |

**Stack:** Spring Boot 4.x · Java 21 · PostgreSQL · Maven · WAR · Jakarta EE

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
- Login por e-mail e senha com hash SHA-256
- Sessão gerenciada via `HttpSession`
- `AuthInterceptor` protege todas as rotas exceto `/login` e recursos estáticos
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

- **Senhas:** armazenadas como hash SHA-256 (hex) via `util/SecurityUtil.java`
- **SQL Injection:** todos os DAOs usam `PreparedStatement` com parâmetros `?`
- **Controle de acesso:** verificado em cada endpoint via `AuthInterceptor` + lógica nos controllers e services
- **Soft delete:** exclusões não removem registros do banco, apenas marcam `ativo = false`

---

## Testes

```bash
mvn test
```

A suíte cobre 78 casos de teste sem dependência de banco de dados:

| Classe | Testes | Cobertura |
|---|---|---|
| `SecurityUtilTest` | 5 | Hash SHA-256: determinismo, null-safety, tamanho |
| `StringUtilTest` | 11 | `limpar()` e `estaVazio()` com todos os casos de borda |
| `UsuarioTest` | 6 | `isAdmin()`, `isBolsista()`, `isProfessor()` |
| `CargoTest` | 4 | `Cargo.deString()` com valores válidos, nulo e inválido |
| `LoginServiceTest` | 4 | Autenticação via bolsista, fallback para professor, hash verificado |
| `LaboratorioServiceTest` | 9 | `podeGerenciar()` e `temVaga()` por perfil e cenário |
| `BolsistaServiceTest` | 8 | `podeGerenciar()` e `inserir()` com todos os perfis |
| `LoginControllerTest` | 4 | GET/POST com MockMvc, redirect e sessão |
| `ProfessorServiceTest` | 9 | CRUD completo via mock do DAO |
| `PerfilControllerTest` | 17 | GET/POST com sessão, validações, troca de senha, null do banco |

---

## Estrutura do Projeto

```
src/main/java/dev/matheus/cadastroBolsistas/
  config/       ← AuthInterceptor e WebConfig
  controller/   ← Controllers Spring MVC por entidade
  service/      ← Regras de negócio
  dao/          ← Acesso ao banco via JDBC
  model/        ← Entidades: Usuario, Bolsista, Professor, Laboratorio, Projeto, Frequencia, Cargo
  util/         ← SecurityUtil (SHA-256), StringUtil

src/main/webapp/
  WEB-INF/pages/   ← JSPs por tela
  WEB-INF/tags/    ← sidebar.tag (componente reutilizável)
  css/             ← Um arquivo CSS por página
  js/              ← Validações client-side

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
