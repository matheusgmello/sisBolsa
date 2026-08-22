# Instalação e Execução do SisBolsa

## Pré-requisitos

| Ferramenta | Versão mínima | Observação |
|---|---|---|
| Java JDK | 21 | Necessário para compilar e rodar |
| Maven | 3.9+ | Gerenciamento de dependências e build |
| Docker + Docker Compose | Qualquer atual | Recomendado para o banco de dados |
| IntelliJ IDEA | Qualquer | Opcional — o projeto roda via Maven também |

> **PostgreSQL local** é uma alternativa ao Docker. Veja a Opção B abaixo.

---

## 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd CadastroBolsistas
```

---

## 2. Configurar o banco de dados

### Opção A — Docker Compose (recomendado)

Na raiz do projeto, execute:

```bash
docker compose up -d
```

O Docker sobe o PostgreSQL vazio na porta `5436`. As tabelas e os dados iniciais
são criados pelas migrations do Flyway quando a aplicação sobe.

Comandos úteis:

```bash
# Parar (mantém os dados)
docker compose down

# Parar e apagar todos os dados
docker compose down -v

# Ver logs do container
docker compose logs -f
```

Configurações usadas pelo container:

```
Banco:   cadastroBolsista
Usuário: postgres
Senha:   1234
Porta:   5436
```

---

### Opção B — PostgreSQL local (sem Docker)

1. Abra o pgAdmin.
2. Crie um banco de dados chamado exatamente `cadastroBolsista` (B maiúsculo).
3. Abra o Query Tool no banco criado.
4. Não precisa rodar script nenhum: o Flyway cria e popula as tabelas no primeiro start da aplicação.

Após isso, ajuste a porta no arquivo de configuração:

```
src/main/resources/application.properties
```

Altere a porta de `5436` para `5432` (porta padrão do PostgreSQL local), ou
exporte a variável de ambiente `DB_PORT=5432` antes de subir a aplicação.
As credenciais também aceitam as variáveis `DB_HOST`, `DB_NAME`, `DB_USER`
e `DB_PASSWORD`.

---

## 3. Rodar a aplicação

### Via Maven (recomendado para desenvolvimento)

```bash
mvn spring-boot:run
```

O Tomcat embarcado sobe na porta `8080`. Não é necessário instalar WildFly ou outro servidor.

### Via build

```bash
mvn clean package
```

---

## 4. Rodar os testes

```bash
mvn test
```

A suíte possui 74 testes unitários e de API (JUnit 5 + Mockito + MockMvc).
Nenhum teste requer banco de dados ativo — os repositórios são mockados.

---

## 5. Acessar o sistema

```
http://localhost:8080
```

Documentação da API (Swagger):

```
http://localhost:8080/swagger-ui.html
```

---

## 6. Credenciais iniciais

As migrations criam os seguintes usuários para teste:

### Administrador
```
E-mail: admin@sisbolsa.com
Senha:  12345678
Tipo:   ADMIN
```

### Professores coordenadores
```
roberto.mendes@sisbolsa.com  / 12345678  → Lab de Desenvolvimento de Software
carla.souza@sisbolsa.com     / 12345678  → Lab de Ciencias Biologicas
felipe.andrade@sisbolsa.com  / 12345678  → Lab de Engenharia Mecatronica
```

### Bolsistas (exemplos)
```
thiago.rocha@aluno.sisbolsa.com    / 12345678  → Lab de Desenvolvimento de Software
camila.pires@aluno.sisbolsa.com    / 12345678  → Lab de Desenvolvimento de Software
diego.almeida@aluno.sisbolsa.com   / 12345678  → Lab de Ciencias Biologicas
bruno.carvalho@aluno.sisbolsa.com  / 12345678  → Lab de Engenharia Mecatronica
```

> As senhas são armazenadas como hash BCrypt. O `V4__senhas_bcrypt.sql` converte
> os hashes do seed — não é necessário nenhuma migração manual.

---

## 7. Cadastrar novos administradores

O sistema suporta no máximo 3 administradores. Para cadastrar um novo:

1. Faça login com uma conta ADMIN existente.
2. Acesse **Usuários** no menu lateral.
3. Clique em **Novo Usuário** e selecione o tipo `ADMIN`.

---

## 8. Estrutura do banco

As migrations do Flyway criam e populam as seguintes tabelas:

| Tabela | Conteúdo inicial |
|---|---|
| `professor` | 3 professores coordenadores |
| `laboratorio` | 3 laboratórios vinculados aos professores |
| `projeto` | 6 projetos (2 por laboratório) |
| `bolsista` | 7 bolsistas + 1 administrador |
| `bolsista_projeto` | Vínculos entre bolsistas e projetos |
| `frequencia` | 28 registros de horas (4 por bolsista) |

Para reiniciar o banco do zero:

```bash
docker compose down -v
docker compose up -d
```
